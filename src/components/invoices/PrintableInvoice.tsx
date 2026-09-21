"use client";

import { Download, Settings2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/crm";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import BrandLogo from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";

export interface InvoiceItem {
  description: string;
  amount: number;
}
export interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  status: string;
  type: string;
  notes: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  currency: string;
  business: {
    name: string;
    email: string;
    phone: string;
    address: string;
    logo: string;
  };
}

type Layout = "modern" | "classic" | "minimal";
type Accent = "primary" | "accent" | "secondary";

export function PrintableInvoice({ invoice }: { invoice: Invoice }) {
  const ref = useRef<HTMLDivElement>(null);
  const locale = useLocale() as "en" | "ar";
  const t = useTranslations("PDF");
  const [layout, setLayout] = useState<Layout>("modern");
  const [accent, setAccent] = useState<Accent>("primary");
  const [showNotes, setShowNotes] = useState(true);
  const [showBusiness, setShowBusiness] = useState(true);
  const print = useReactToPrint({
    contentRef: ref,
    documentTitle: invoice.number,
  });
  const color =
    accent === "primary"
      ? "#2F39A9"
      : accent === "accent"
        ? "#49A4BB"
        : "#2E6FA0";
  const headerClass =
    layout === "minimal"
      ? "border-b border-gray-200 pb-7"
      : layout === "classic"
        ? "border-b-2 pb-8"
        : "rounded-2xl border p-8";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Settings2 className="size-4 text-primary-light" />
          {t("customize")}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={layout}
            items={[
              { value: "modern", label: t("modern") },
              { value: "classic", label: t("classic") },
              { value: "minimal", label: t("minimal") },
            ]}
            onValueChange={(v) => setLayout(v as Layout)}
          >
            <SelectTrigger className="w-36" />
            <SelectContent>
              <SelectItem value="modern">{t("modern")}</SelectItem>
              <SelectItem value="classic">{t("classic")}</SelectItem>
              <SelectItem value="minimal">{t("minimal")}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={accent}
            items={[
              { value: "primary", label: t("nexusBlue") },
              { value: "accent", label: t("nexusCyan") },
              { value: "secondary", label: t("nexusSecondary") },
            ]}
            onValueChange={(v) => setAccent(v as Accent)}
          >
            <SelectTrigger className="w-36" />
            <SelectContent>
              <SelectItem value="primary">{t("nexusBlue")}</SelectItem>
              <SelectItem value="accent">{t("nexusCyan")}</SelectItem>
              <SelectItem value="secondary">{t("nexusSecondary")}</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs">
            <input
              type="checkbox"
              checked={showBusiness}
              onChange={(e) => setShowBusiness(e.target.checked)}
            />
            {t("businessDetails")}
          </label>
          <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs">
            <input
              type="checkbox"
              checked={showNotes}
              onChange={(e) => setShowNotes(e.target.checked)}
            />
            {t("showNotes")}
          </label>
          <Button onClick={() => print()}>
            <Download data-icon="inline-start" />
            {t("savePdf")}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-surface/30 p-3">
        <div
          ref={ref}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="mx-auto min-h-264 w-198.5 max-w-full bg-white p-12 text-black print:w-full print:p-10"
        >
          <div
            className={headerClass}
            style={layout === "classic" ? { borderColor: color } : undefined}
          >
            <div className="flex justify-between gap-8">
              <div className="min-w-0">
                {showBusiness ? (
                  <>
                    <div className="mb-3 flex items-center gap-3">
                      <BrandLogo
                        alt="Nexus CRM"
                        width={132}
                        height={36}
                        className="h-9 w-auto"
                      />
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color }}>
                      {invoice.business.name || "Account owner"}
                    </h1>
                    <p className="mt-2 whitespace-pre-line text-sm text-gray-500">
                      {[
                        invoice.business.address,
                        invoice.business.email,
                        invoice.business.phone,
                      ]
                        .filter(Boolean)
                        .join("\n")}
                    </p>
                  </>
                ) : null}
              </div>
              <div className="text-end">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  {invoice.status === "draft" ? t("quote") : t("invoice")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-800">
                  {invoice.number}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  {t("date")}: {formatDate(invoice.issueDate, locale)}
                </p>
                <p className="text-sm text-gray-500">
                  {t("dueDateLabel")}: {formatDate(invoice.dueDate, locale)}
                </p>
              </div>
            </div>
          </div>
          <div className="my-8 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("billedTo")}
              </p>
              <p className="font-semibold text-gray-800">
                {invoice.clientName}
              </p>
              <p className="text-sm text-gray-500">
                {invoice.clientEmail || "—"}
              </p>
            </div>
            <div className="sm:text-end">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                {t("pricingMode")}
              </p>
              <p className="font-semibold text-gray-800">
                {invoice.type === "fixed" ? t("fixedPrice") : t("itemized")}
              </p>
            </div>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr
                style={{ backgroundColor: `${color}10` }}
                className="border-b-2 border-gray-200 text-sm text-gray-600"
              >
                <th className="px-3 py-3 text-start">{t("description")}</th>
                <th className="px-3 py-3 text-end">{t("amount")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length ? (
                invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-4 text-gray-800">
                      {item.description}
                    </td>
                    <td className="px-3 py-4 text-end text-gray-800">
                      {formatCurrency(item.amount, invoice.currency, locale)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-3 py-5 text-sm text-gray-500">
                    {t("fixedAmountRow")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="ms-auto mt-8 w-72 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>{t("subtotal")}</span>
              <span>
                {formatCurrency(invoice.subtotal, invoice.currency, locale)}
              </span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>
                {t("tax")} ({invoice.taxRate}%)
              </span>
              <span>
                {formatCurrency(invoice.taxAmount, invoice.currency, locale)}
              </span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t("discount")}</span>
                <span>
                  -{formatCurrency(invoice.discount, invoice.currency, locale)}
                </span>
              </div>
            )}
            <div
              className="flex justify-between border-t-2 border-gray-200 pt-3 text-lg font-bold"
              style={{ color }}
            >
              <span>{t("total")}</span>
              <span>
                {formatCurrency(invoice.total, invoice.currency, locale)}
              </span>
            </div>
          </div>
          {showNotes ? (
            <div className="mt-14 border-t border-gray-200 pt-6 text-sm text-gray-500">
              <p className="font-semibold text-gray-700">{t("paymentTerms")}</p>
              <p className="mt-2 whitespace-pre-line">{invoice.notes || "—"}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
