import { CustomPage } from "@/components/site/CustomPage";

export default async function CustomRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CustomPage slug={slug} />;
}
