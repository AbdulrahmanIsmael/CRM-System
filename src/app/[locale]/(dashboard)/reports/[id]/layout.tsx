import { buildPageMetadata, type AppLocale } from "@/lib/seo";
import { PageSchema } from "@/components/seo/StructuredData";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "reportDetails", path: `/reports/${id}` });
}

export default async function DetailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  return (
    <>
      <PageSchema locale={locale as AppLocale} path={`/reports/${id}`} name={t("reportDetails.title")} description={t("reportDetails.description")} />
      {children}
    </>
  );
}
