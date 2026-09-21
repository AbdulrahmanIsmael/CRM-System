import { buildPageMetadata, type AppLocale } from "@/lib/seo";
import { PageSchema } from "@/components/seo/StructuredData";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "confirmEmail", path: "/confirm-email" });
}

export default async function ConfirmEmailLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  return <><PageSchema locale={locale as AppLocale} path="/confirm-email" name={t("confirmEmail.title")} description={t("confirmEmail.description")} />{children}</>;
}
