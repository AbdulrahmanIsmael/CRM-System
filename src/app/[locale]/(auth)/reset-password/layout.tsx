import { buildPageMetadata, type AppLocale } from "@/lib/seo";
import { PageSchema } from "@/components/seo/StructuredData";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "resetPassword", path: "/reset-password" });
}

export default async function ResetPasswordLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "SEO" });
  return <><PageSchema locale={locale as AppLocale} path="/reset-password" name={t("resetPassword.title")} description={t("resetPassword.description")} />{children}</>;
}
