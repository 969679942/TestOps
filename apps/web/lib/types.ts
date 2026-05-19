export type LooseString<T extends string> = T | (string & {});

export type ProjectRecord = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: string;
  defaultProvider: string;
  defaultPromptProfile: string;
};

export type DocumentType = LooseString<"prd" | "figma" | "swagger">;

export type DocumentAsset = {
  id: string | number;
  projectId: string | number;
  type: DocumentType;
  name: string;
  sourceMode: string;
  sourceUri: string | null;
  parseStatus?: string;
};

export type GenerationTaskStatus = LooseString<
  "queued" | "running" | "succeeded" | "failed"
>;

export type GenerationTaskRecord = {
  id: string | number;
  projectId: string | number;
  status: GenerationTaskStatus;
  provider: string;
  model: string;
  promptVersion: string;
  inputRefs: Record<string, unknown>;
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type ProjectListResult =
  | {
      kind: "success";
      projects: ProjectRecord[];
    }
  | {
      kind: "unavailable";
      projects: ProjectRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type DocumentAssetListResult =
  | {
      kind: "success";
      documents: DocumentAsset[];
    }
  | {
      kind: "unavailable";
      documents: DocumentAsset[];
    }
  | {
      kind: "http-error";
      status: number;
    };

export type GenerationTaskListResult =
  | {
      kind: "success";
      tasks: GenerationTaskRecord[];
    }
  | {
      kind: "unavailable";
      tasks: GenerationTaskRecord[];
    }
  | {
      kind: "http-error";
      status: number;
    };
