import { redirect } from "next/navigation";

type ProjectDocumentsPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDocumentsPage({ params }: ProjectDocumentsPageProps) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}`);
}
