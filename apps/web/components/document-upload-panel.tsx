"use client";



import { useRouter } from "next/navigation";

import { useEffect, useMemo, useState } from "react";



import {
  ApiError,
  createGenerationTask,
  createProjectDocument,
  deleteProjectDocument,
  getProject,
  uploadProjectDocument,
  waitForGenerationTask,
  type ProjectDocumentRecord,
} from "../lib/workspace-api";

import { copy, documentTypeLabels, labelSourceMode } from "../lib/copy";

import { FileUploadField } from "./file-upload-field";



type DocumentUploadPanelProps = Readonly<{

  projectId: string;

  documents: ProjectDocumentRecord[];

  defaultProvider?: string;

  onGeneratingChange?: (generating: boolean) => void;

}>;



type UploadKind = "prd" | "swagger" | "figma";



const uploadKinds: Array<{

  kind: UploadKind;

  label: string;

  hint: string;

  icon: string;

  sourceMode: string;

  accept?: string;

  usesUrl?: boolean;

}> = [

  {

    kind: "prd",

    label: "PRD 需求",

    hint: "支持 PDF、Word、Markdown",

    icon: "📄",

    sourceMode: "upload",

    accept: ".pdf,.doc,.docx,.md,.markdown",

  },

  {

    kind: "swagger",

    label: "API 文档",

    hint: "上传文件或粘贴 OpenAPI 地址",

    icon: "🔌",

    sourceMode: "upload",

    accept: ".json,.yaml,.yml",

    usesUrl: true,

  },

  {

    kind: "figma",

    label: "设计稿",

    hint: "粘贴 Figma 文件链接",

    icon: "🎨",

    sourceMode: "external_link",

    usesUrl: true,

  },

];



export function DocumentUploadPanel({

  projectId,

  documents: initialDocuments,

  defaultProvider,

  onGeneratingChange,

}: DocumentUploadPanelProps) {

  const router = useRouter();

  const [documents, setDocuments] = useState(initialDocuments);

  const [selectedIds, setSelectedIds] = useState<string[]>(

    initialDocuments.map((document) => document.id),

  );

  const [activeKind, setActiveKind] = useState<UploadKind>("prd");

  const [name, setName] = useState("");

  const [url, setUrl] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [uploading, setUploading] = useState(false);

  const [generating, setGenerating] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);



  useEffect(() => {

    setDocuments(initialDocuments);

    setSelectedIds((current) => {

      const existing = new Set(initialDocuments.map((document) => document.id));

      return current.filter((id) => existing.has(id));

    });

  }, [initialDocuments]);



  useEffect(() => {

    onGeneratingChange?.(generating);

  }, [generating, onGeneratingChange]);



  useEffect(() => {

    if (!toast) {

      return undefined;

    }

    const timer = window.setTimeout(() => setToast(null), 4000);

    return () => window.clearTimeout(timer);

  }, [toast]);



  const activeConfig = useMemo(

    () => uploadKinds.find((item) => item.kind === activeKind) ?? uploadKinds[0],

    [activeKind],

  );



  const allSelected = documents.length > 0 && selectedIds.length === documents.length;



  function toggleDocument(documentId: string) {

    setSelectedIds((current) =>

      current.includes(documentId)

        ? current.filter((id) => id !== documentId)

        : [...current, documentId],

    );

  }



  function toggleSelectAll() {

    setSelectedIds(allSelected ? [] : documents.map((document) => document.id));

  }



  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setUploading(true);

    setToast(null);



    try {

      const documentName =

        name.trim() ||

        file?.name ||

        (activeConfig.usesUrl ? `${activeConfig.label} 链接` : activeConfig.label);



      if (!documentName) {

        throw new Error(copy.fillDocumentName);

      }



      if (activeConfig.usesUrl && !url.trim()) {

        throw new Error(copy.fillValidUrl);

      }



      if (!activeConfig.usesUrl && !file) {

        throw new Error(copy.chooseUploadFile);

      }



      let created: ProjectDocumentRecord;



      if (activeConfig.usesUrl) {

        created = await createProjectDocument(projectId, {

          type: activeConfig.kind,

          name: documentName,

          sourceMode: activeKind === "figma" ? "external_link" : "url",

          sourceUri: url.trim(),

        });

      } else {

        created = await uploadProjectDocument(projectId, {

          file: file as File,

          type: activeConfig.kind,

          name: documentName,

          sourceMode: activeConfig.sourceMode,

        });

      }



      setDocuments((current) => [...current, created]);

      setSelectedIds((current) => [...current, created.id]);

      setName("");

      setUrl("");

      setFile(null);

      setToast({ type: "success", text: copy.documentAdded(created.name) });

      router.refresh();

    } catch (uploadError) {

      const text =

        uploadError instanceof ApiError

          ? uploadError.message

          : uploadError instanceof Error

            ? uploadError.message

            : copy.uploadDocumentFailed;

      setToast({ type: "error", text });

    } finally {

      setUploading(false);

    }

  }



  async function handleDelete(documentId: string) {

    setDeletingId(documentId);

    setToast(null);



    try {

      await deleteProjectDocument(projectId, documentId);

      setDocuments((current) => current.filter((document) => document.id !== documentId));

      setSelectedIds((current) => current.filter((id) => id !== documentId));

      router.refresh();

    } catch (deleteError) {

      const text =

        deleteError instanceof ApiError

          ? deleteError.message

          : deleteError instanceof Error

            ? deleteError.message

            : copy.uploadDocumentFailed;

      setToast({ type: "error", text });

    } finally {

      setDeletingId(null);

    }

  }



  async function handleGenerate() {

    if (selectedIds.length === 0) {

      setToast({ type: "error", text: copy.selectOneDocument });

      return;

    }



    setGenerating(true);

    setToast(null);



    try {

      let provider = defaultProvider;

      if (!provider) {

        const project = await getProject(projectId);

        provider = project.defaultProvider;

      }



      const task = await createGenerationTask(projectId, {

        documentIds: selectedIds.map((id) => Number(id)),

        provider,

      });



      const finished =

        task.status === "completed" || task.status === "failed"

          ? task

          : await waitForGenerationTask(task.id);



      if (finished.status === "failed") {

        throw new Error(finished.errorMessage ?? copy.generateFailed);

      }



      router.push(`/projects/${projectId}/test-cases?generated=1`);

      router.refresh();

    } catch (generateError) {

      const text =

        generateError instanceof ApiError

          ? generateError.message

          : generateError instanceof Error

            ? generateError.message

            : copy.generateFailed;

      setToast({ type: "error", text });

    } finally {

      setGenerating(false);

    }

  }



  return (

    <section className="upload-panel" aria-label="上传与生成">

      {toast ? (

        <div className={`toast toast-${toast.type}`} role="status">

          {toast.text}

        </div>

      ) : null}



      {generating ? (

        <div className="loading-banner" role="status" aria-live="polite">

          <span className="spinner" aria-hidden="true" />

          <div>

            <strong>{copy.generating}</strong>

            <p>{copy.generateProgress(selectedIds.length)}</p>

          </div>

        </div>

      ) : null}



      <div className="upload-panel-header">

        <div>

          <span className="eyebrow">{copy.uploadStepEyebrow}</span>

          <h3>{copy.uploadTitle}</h3>

          <p>{copy.uploadHint}</p>

        </div>

      </div>



      <div className="upload-layout">

        <div className="upload-form-card">

          <div className="upload-kind-tabs" role="tablist" aria-label={copy.documentTypeTabLabel}>

            {uploadKinds.map((item) => (

              <button

                key={item.kind}

                type="button"

                role="tab"

                aria-selected={activeKind === item.kind}

                className={`tab-button ${activeKind === item.kind ? "is-active" : ""}`}

                onClick={() => setActiveKind(item.kind)}

              >

                <span aria-hidden="true">{item.icon}</span> {item.label}

              </button>

            ))}

          </div>



          <form className="upload-form" onSubmit={handleUpload}>

            <label className="field">

              <span>{copy.documentNameLabel}</span>

              <input

                value={name}

                onChange={(event) => setName(event.target.value)}

                placeholder={`${activeConfig.label} 文档`}

              />

            </label>



            {activeConfig.usesUrl ? (

              <label className="field">

                <span>{copy.sourceUrlLabel}</span>

                <input

                  value={url}

                  onChange={(event) => setUrl(event.target.value)}

                  placeholder={

                    activeKind === "figma"

                      ? "https://www.figma.com/file/..."

                      : "https://example.com/openapi.json"

                  }

                />

              </label>

            ) : (

              <div className="field">

                <span>{copy.chooseFileLabel}</span>

                <FileUploadField

                  accept={activeConfig.accept}

                  disabled={uploading || generating}

                  fileName={file?.name ?? null}

                  onFileChange={setFile}

                />

                <small>{activeConfig.hint}</small>

              </div>

            )}



            <button className="button-secondary" type="submit" disabled={uploading || generating}>

              {uploading ? "添加中…" : copy.addDocument}

            </button>

          </form>

        </div>



        <div className="document-library">

          <div className="document-library-header">

            <div>

              <span className="eyebrow">{copy.uploadedEyebrow}</span>

              <h4>{copy.documentLibraryTitle(documents.length)}</h4>

            </div>

            {documents.length > 0 ? (

              <div className="inline-actions">

                <button className="button-ghost" type="button" onClick={toggleSelectAll}>

                  {allSelected ? copy.clearSelection : copy.selectAll}

                </button>

                <button

                  className="button-primary"

                  type="button"

                  disabled={generating || selectedIds.length === 0}

                  onClick={handleGenerate}

                >

                  {generating ? copy.generating : copy.generate}

                </button>

              </div>

            ) : null}

          </div>



          <div className="document-list" aria-label="文档列表">

            {documents.length === 0 ? (

              <article className="empty-card compact">

                <h4>{copy.noDocuments}</h4>

                <p>{copy.noDocumentsHint}</p>

              </article>

            ) : (

              documents.map((document) => (

                <div key={document.id} className="document-row">

                  <label className="document-row-main">

                    <input

                      type="checkbox"

                      checked={selectedIds.includes(document.id)}

                      onChange={() => toggleDocument(document.id)}

                    />

                    <span className="doc-type-icon" aria-hidden="true">

                      {uploadKinds.find((item) => item.kind === document.type)?.icon ?? "📎"}

                    </span>

                    <div>

                      <strong>{document.name}</strong>

                      <p>

                        {documentTypeLabels[document.type] ?? document.type} ·{" "}

                        {labelSourceMode(document.sourceMode)}

                      </p>

                      <small>{document.sourceUri ?? copy.internalStorage}</small>

                    </div>

                  </label>

                  <button

                    className="button-ghost"

                    type="button"

                    disabled={generating || deletingId === document.id}

                    aria-label={`删除 ${document.name}`}

                    onClick={() => handleDelete(document.id)}

                  >

                    删除

                  </button>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </section>

  );

}


