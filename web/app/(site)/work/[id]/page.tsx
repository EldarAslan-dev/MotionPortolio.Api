import { ProjectDetail } from "@/components/site/ProjectDetail";

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail id={Number(id)} />;
}
