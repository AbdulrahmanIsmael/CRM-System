import type { Metadata } from "next";
import { buildPageMetadata, type AppLocale } from "@/lib/seo";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale: locale as AppLocale, key: "signIn", path: "/sign-in" });
}


export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("Common");
  return (
    <div className="min-h-screen flex flex-col bg-bg text-text-primary">
      <header className="w-full flex justify-end p-4 absolute top-0 z-50">
        <LanguageSwitcher />
      </header>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-2xl">{t("skipToContent")}</a>
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center p-4 py-16 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
