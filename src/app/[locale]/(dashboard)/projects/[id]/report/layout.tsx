import { buildPageMetadata, type AppLocale } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "reports", path: `/projects/${id}/report` });
}

export default function LegacyReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
