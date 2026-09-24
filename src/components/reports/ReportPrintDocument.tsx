/* eslint-disable @next/next/no-img-element */
"use client";

import { formatCurrency, formatDate } from "@/lib/crm";
import { useLocale, useTranslations } from "next-intl";

import type { ReportEditorSection } from "@/components/reports/ReportEditor";
import { RichTextContent } from "@/components/reports/RichTextContent";
import { sanitizeReportHtml } from "@/lib/report";

export function ReportPrintDocument({
  title,
  project,
  business,
  sections,
}: {
  title: string;
  project: {
    name: string;
    clientName: string;
    start_date: string | null;
    deadline: string | null;
    budget: number;
    description: string | null;
  };
  business: {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
  };
  sections: ReportEditorSection[];
}) {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("Reports");
  const direction = locale === "ar" ? "rtl" : "ltr";
  const compactReport = sections.length <= 1;

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 12mm 0;
          }
        }
      `}</style>
      <div
        dir={direction}
        className="w-198.5 bg-white p-8 text-black print:w-full print:px-10 print:py-0"
      >
        {/* Header */}
        <header
          className={`border-b border-gray-200 ${
            compactReport ? "pb-5" : "pb-7"
          }`}
        >
          <div className="flex items-start justify-between gap-10">
            {/* Business */}
            <div
              dir="ltr"
              className={`min-w-0 flex-1 ${
                locale === "ar" ? "text-end" : "text-start"
              }`}
            >
              {business.logo ? (
                <div
                  className={`mb-3 flex ${
                    locale === "ar" ? "justify-end" : "justify-start"
                  }`}
                >
                  <img
                    src={business.logo}
                    alt={`${business.name || "Business"} logo`}
                    className="h-12 w-auto max-w-50 object-contain"
                  />
                </div>
              ) : null}

              {business.name ? (
                <h2 className="text-xl font-bold text-gray-900">
                  {business.name}
                </h2>
              ) : null}

              {business.address || business.email || business.phone ? (
                <div className="mt-2 space-y-0.5 text-xs leading-5 text-gray-500">
                  {business.address ? <p>{business.address}</p> : null}

                  {business.email ? <p dir="ltr">{business.email}</p> : null}

                  {business.phone ? <p dir="ltr">{business.phone}</p> : null}
                </div>
              ) : null}
            </div>

            {/* Report metadata */}
            <div className="shrink-0 text-end">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                {t("title")}
              </p>

              <p className="mt-3 text-xs text-gray-500">{t("reportDate")}</p>

              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatDate(new Date(), locale)}
              </p>
            </div>
          </div>

          {/* Full-width report title */}
          <div
            className={`border-t border-gray-100 ${
              compactReport ? "mt-5 pt-4" : "mt-8 pt-6"
            }`}
          >
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2F39A9]">
              {t("report")}
            </p>

            <h1 className="max-w-none text-3xl font-bold leading-tight tracking-tight text-gray-900">
              {title}
            </h1>

            <p className="mt-2 text-sm text-gray-500">{project.name}</p>
          </div>
        </header>

        {/* Project / Client metadata */}
        <section
          className={`grid gap-4 sm:grid-cols-2 ${
            compactReport ? "my-5" : "my-8"
          }`}
        >
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              {t("client")}
            </p>

            <p className="mt-2 text-base font-semibold text-gray-900">
              {project.clientName || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
              {t("projectPeriod")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-gray-400">
                  {t("startDate")}
                </p>

                <p
                  dir="auto"
                  className="mt-1 text-sm font-semibold text-gray-800"
                >
                  {project.start_date
                    ? formatDate(project.start_date, locale)
                    : "-"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-medium text-gray-400">
                  {t("deadline")}
                </p>

                <p
                  dir="auto"
                  className="mt-1 text-sm font-semibold text-gray-800"
                >
                  {project.deadline
                    ? formatDate(project.deadline, locale)
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Project summary */}
        {project.description ? (
          <section className={compactReport ? "mb-6" : "mb-10"}>
            <div className="rounded-2xl border border-[#2F39A9]/15 bg-[#2F39A9]/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2F39A9]/10">
                  <span className="size-2 rounded-full bg-[#2F39A9]" />
                </div>

                <h2 className="text-lg font-bold text-gray-900">
                  {t("projectSummary")}
                </h2>
              </div>

              <div className="mt-3 text-sm leading-6 text-gray-700">
                <RichTextContent
                  value={project.description}
                  className="**:text-gray-700!"
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Sections */}
        <main>
          {sections.map((section, index) => (
            <section
              key={section.id}
              className={`break-inside-avoid ${compactReport ? "mb-6" : "mb-10"}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2F39A9]/10 text-xs font-bold text-[#2F39A9]">
                  {index + 1}
                </span>

                <h2 className="min-w-0 text-lg font-bold text-gray-900">
                  {section.title}
                </h2>

                <span className="h-px flex-1 bg-gray-200" />
              </div>

              {section.content_html ? (
                <div
                  className="text-sm leading-7 text-gray-700 [&_strong]:font-bold [&_em]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-2"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeReportHtml(section.content_html),
                  }}
                />
              ) : (
                <p className="text-sm text-gray-400">-</p>
              )}

              {/* Section images */}
              {section.images.length ? (
                <div
                  className={`grid grid-cols-2 items-stretch gap-3 ${
                    compactReport ? "mt-3" : "mt-5"
                  }`}
                >
                  {section.images.map((image) => {
                    const alt =
                      image.alt_text || `${section.title} - ${t("imageAlt")}`;

                    return (
                      <figure
                        key={image.id}
                        className="flex min-w-0 break-inside-avoid flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                      >
                        <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-gray-100">
                          <img
                            src={image.url}
                            alt={alt}
                            className="block max-h-full max-w-full object-contain"
                          />
                        </div>

                        <figcaption className="mt-auto border-t border-gray-200 bg-white px-3 py-2 text-[10px] leading-4 text-gray-400">
                          {alt}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ))}
        </main>

        {/* Footer */}
        <footer
          className={`break-inside-avoid border-t border-gray-200 ${
            compactReport ? "mt-6 pt-4" : "mt-10 pt-6"
          }`}
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {t("thanks")}
              </p>

              <p className="mt-1 text-xs text-gray-500">{t("questions")}</p>
            </div>

            <div className="text-end">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                {t("projectBudget")}
              </p>

              <p dir="ltr" className="mt-1 text-lg font-bold text-gray-900">
                {formatCurrency(project.budget, "USD", locale)}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
