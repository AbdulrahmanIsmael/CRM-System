import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export type AppLocale = "en" | "ar";

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path.startsWith("/") ? path : `/${path}`, `${getSiteUrl()}/`).toString();
}

export async function buildPageMetadata({
  locale,
  key,
  path,
  title,
  description,
  noIndex = true,
}: {
  locale: AppLocale;
  key: string;
  path: string;
  title?: string;
  description?: string;
  noIndex?: boolean;
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "SEO" });
  const resolvedTitle = title ?? t(`${key}.title`);
  const resolvedDescription = description ?? t(`${key}.description`);
  const canonicalPath = `/${locale}${path === "/" ? "" : path}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const ogImage = absoluteUrl("/assets/images/og-image.png");
  const languageAlternates = {
    en: absoluteUrl(`/en${path === "/" ? "" : path}`),
    ar: absoluteUrl(`/ar${path === "/" ? "" : path}`),
    "x-default": absoluteUrl(`/en${path === "/" ? "" : path}`),
  };

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    applicationName: "Nexus CRM",
    authors: [{ name: "Nexus CRM" }],
    creator: "Nexus CRM",
    publisher: "Nexus CRM",
    category: "Business Software",
    referrer: "origin-when-cross-origin",
    alternates: {
      canonical: canonicalUrl,
      languages: languageAlternates,
    },
    keywords: t("keywords").split(",").map((item) => item.trim()),
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
            "max-image-preview": "none",
            "max-snippet": 0,
            "max-video-preview": 0,
          },
        }
      : undefined,
    openGraph: {
      type: "website",
      siteName: "Nexus CRM",
      title: resolvedTitle,
      description: resolvedDescription,
      url: canonicalUrl,
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
    },
    formatDetection: {
      email: false,
      telephone: false,
      address: false,
    },
  };
}
