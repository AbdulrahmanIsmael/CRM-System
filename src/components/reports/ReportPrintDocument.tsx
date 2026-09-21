"use client";

import { formatCurrency, formatDate } from "@/lib/crm";
import { useLocale, useTranslations } from "next-intl";

import BrandLogo from "@/components/ui/BrandLogo";
import Image from "next/image";
import type { ReportEditorSection } from "@/components/reports/ReportEditor";
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
  business: { name: string; email: string; phone: string; address: string };
  sections: ReportEditorSection[];
}) {
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("Reports");
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={direction}
      className="min-h-264 w-198.5 bg-white p-12 text-black print:w-full print:p-10"
    >
      <div className="flex items-start justify-between gap-10 border-b border-gray-200 pb-8">
        <div className="min-w-0">
          <BrandLogo
            alt={`${business.name || "Nexus CRM"} logo`}
            width={132}
            height={40}
            className="mb-4 h-9 w-auto"
          />
          <h1 className="text-2xl font-bold text-[#2F39A9]">
            {business.name || t("businessFallback")}
          </h1>
          <p className="mt-2 whitespace-pre-line text-xs text-gray-500">
            {[business.address, business.email, business.phone]
              .filter(Boolean)
              .join("\n")}
          </p>
        </div>
        <div className="text-end">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            {t("title")}
          </p>
          <h2 className="mt-2 max-w-72 text-2xl font-semibold text-gray-800">
            {title}
          </h2>
          <p className="mt-3 text-xs text-gray-500">
            {t("reportDate")}: {formatDate(new Date(), locale)}
          </p>
        </div>
      </div>

      <div className="my-8 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {t("client")}
          </p>
          <p className="mt-2 font-semibold text-gray-800">
            {project.clientName}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {t("projectPeriod")}
          </p>
          <p className="mt-2 text-sm text-gray-700">
            {project.start_date ? formatDate(project.start_date, locale) : "—"}{" "}
            — {project.deadline ? formatDate(project.deadline, locale) : "—"}
          </p>
        </div>
      </div>

      {project.description ? (
        <section className="mb-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {t("projectSummary")}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800">
            {project.description}
          </p>
        </section>
      ) : null}

      {sections.map((section) => (
        <section key={section.id} className="mb-8">
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-lg font-semibold text-gray-800">
            {section.title}
          </h3>
          {section.content_html ? (
            <div
              className="text-sm leading-7 text-gray-800 [&_strong]:font-bold [&_em]:italic [&_ul]:my-3 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:ps-6"
              dangerouslySetInnerHTML={{
                __html: sanitizeReportHtml(section.content_html),
              }}
            />
          ) : (
            <p className="text-sm text-gray-400">—</p>
          )}
          {section.images.length ? (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {section.images.map((image) => {
                const alt =
                  image.alt_text || `${section.title} — ${t("imageAlt")}`;
                return (
                  <figure key={image.id} className="break-inside-avoid">
                    <Image
                      src={image.url}
                      alt={alt}
                      width={1200}
                      height={800}
                      className="max-h-85 w-full rounded-xl object-cover"
                    />
                    <figcaption className="mt-1 text-[10px] text-gray-400">
                      {alt}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          ) : null}
        </section>
      ))}

      <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
        <div>
          <p className="text-xs font-semibold text-gray-700">{t("thanks")}</p>
          <p className="mt-1 text-xs text-gray-500">{t("questions")}</p>
        </div>
        <div className="text-end text-sm font-semibold text-gray-700">
          {formatCurrency(project.budget, "USD", locale)}
        </div>
      </div>
    </div>
  );
}
