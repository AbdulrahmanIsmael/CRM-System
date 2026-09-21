import { getSiteUrl, absoluteUrl, type AppLocale } from "@/lib/seo";

function serialize(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function WebApplicationSchema({ locale }: { locale: AppLocale }) {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Nexus CRM",
    url: absoluteUrl(`/${locale}`),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: locale,
    description:
      locale === "ar"
        ? "نظام CRM لإدارة العملاء والصفقات والمشاريع والفواتير والمهام.":
        "CRM software for managing contacts, deals, projects, invoices, tasks and business operations.",
    image: absoluteUrl("/assets/images/og-image.png"),
    publisher: {
      "@type": "Organization",
      name: "Nexus CRM",
      url: siteUrl,
    },
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}

export function PageSchema({
  locale,
  path,
  name,
  description,
  parentName = "Nexus CRM",
}: {
  locale: AppLocale;
  path: string;
  name: string;
  description: string;
  parentName?: string;
}) {
  const url = absoluteUrl(`/${locale}${path === "/" ? "" : path}`);
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name,
      description,
      url,
      inLanguage: locale,
      isPartOf: {
        "@type": "WebSite",
        name: parentName,
        url: absoluteUrl(`/${locale}`),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: parentName,
          item: absoluteUrl(`/${locale}`),
        },
        {
          "@type": "ListItem",
          position: 2,
          name,
          item: url,
        },
      ],
    },
  ];

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialize(data) }} />;
}
