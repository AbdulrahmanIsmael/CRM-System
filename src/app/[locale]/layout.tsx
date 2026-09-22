import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildPageMetadata, type AppLocale } from "@/lib/seo";
import { WebApplicationSchema } from "@/components/seo/StructuredData";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    return {};
  }

  const metadata = await buildPageMetadata({
    locale: locale as AppLocale,
    key: "root",
    path: "/",
  });

  const title = String(metadata.title ?? "Nexus CRM");
  return {
    ...metadata,
    title: {
      default: title,
      template: `%s | Nexus CRM`,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8FC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F1A" },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>
            <WebApplicationSchema locale={locale as AppLocale} />
            {children}
            <Toaster
              position={dir === "rtl" ? "bottom-left" : "bottom-right"}
              richColors
            />
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
