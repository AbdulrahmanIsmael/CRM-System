import { redirect } from "next/navigation";
export default async function LegacyProjectReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/reports?project=${id}`);
}
