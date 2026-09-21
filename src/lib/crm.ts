import { format, formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";

export function getContactDisplayName(contact: {
  type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
}) {
  if (contact.type === "company" || contact.company_name) {
    if (contact.type === "company") return contact.company_name?.trim() || "";
  }
  return `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || contact.company_name?.trim() || "";
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
}

export function formatDate(value: string | Date | null | undefined, locale: "en" | "ar", options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value: string | Date | null | undefined, locale: "en" | "ar") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value: number | string | null | undefined, currency: string, locale: "en" | "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatRelative(value: string | Date, locale: "en" | "ar") {
  const dateFnsLocale: Locale = locale === "ar" ? ar : enUS;
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: dateFnsLocale });
}

export function getMonthLabel(date: Date, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { month: "short" }).format(date);
}

export function toLocalDateInput(value: string | null | undefined) {
  return value ? format(new Date(value), "yyyy-MM-dd") : "";
}

export function sanitizeSearchTerm(value: string) {
  return value.replace(/[\\%_(),.*"]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}
