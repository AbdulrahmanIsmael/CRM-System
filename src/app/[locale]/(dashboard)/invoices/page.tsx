import { getLocale, getTranslations } from "next-intl/server";
import { FileText, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { InvoiceFormDialog } from "@/components/forms/InvoiceFormDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { LiveSearchInput } from "@/components/search/LiveSearchInput";
import { Link } from "@/i18n/navigation";
import { formatCurrency, formatDate, getContactDisplayName, sanitizeSearchTerm } from "@/lib/crm";
import { cn } from "@/lib/utils";

export default async function InvoicesPage({ searchParams }: { searchParams?: Promise<{ action?: string; q?: string }> }) {
  const params = (await searchParams) ?? {};
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Invoices");
  const tc = await getTranslations("Common");
  const tn = await getTranslations("Navigation");
  const supabase = await createClient();
  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  let invoiceQuery = supabase.from("invoices").select("id,invoice_number,pricing_type,total,currency,status,issue_date,due_date,contact_id,project_id,contacts(type,first_name,last_name,company_name,email)").order("issue_date", { ascending: false });
  if (q) invoiceQuery = invoiceQuery.or(`invoice_number.ilike.%${q}%,notes.ilike.%${q}%`);
  const [{ data: invoices }, { data: contacts }, { data: projects }] = await Promise.all([
    invoiceQuery,
    supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active"),
    supabase.from("projects").select("id,name").order("created_at", { ascending: false }),
  ]);
  const contactOptions = (contacts ?? []).map(c => ({ id: c.id, label: getContactDisplayName(c) })).filter(x => x.label);
  const projectOptions = (projects ?? []).map(p => ({ id: p.id, label: p.name }));
  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">Nexus CRM</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{tn("invoices")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p></div><InvoiceFormDialog contacts={contactOptions} projects={projectOptions} autoOpen={params.action === "new"}/></div>
    <LiveSearchInput key={q} value={q} placeholder={t("searchPlaceholder")} ariaLabel={t("searchPlaceholder")} />
    {(invoices ?? []).length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="size-6"/></div><h2 className="mt-4 font-semibold">{t("noInvoices")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("createDescription")}</p></CardContent></Card> : <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/95"><CardContent className="p-0"><div className="divide-y divide-border">{invoices!.map(invoice => { const contact = Array.isArray(invoice.contacts) ? invoice.contacts[0] : invoice.contacts; return <div key={invoice.id} className="group grid gap-4 p-5 transition-colors hover:bg-muted/20 md:grid-cols-[1.3fr_1.2fr_0.8fr_0.9fr_auto] md:items-center"><div className="min-w-0"><Link href={`/invoices/${invoice.id}`} className="block truncate font-semibold text-primary-light hover:text-primary">{invoice.invoice_number}</Link><p className="mt-1 text-xs text-muted-foreground">{invoice.pricing_type === "fixed" ? t("fixedPrice") : t("itemized")}</p></div><div className="min-w-0"><p className="truncate text-sm font-medium">{getContactDisplayName(contact || {}) || tc("unknown")}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.issue_date, locale)}</p></div><div className="text-sm font-semibold">{formatCurrency(Number(invoice.total || 0), invoice.currency || "USD", locale)}</div><Badge variant={invoice.status === "paid" ? "default" : invoice.status === "overdue" ? "destructive" : invoice.status === "sent" ? "outline" : "secondary"} className={cn(invoice.status === "paid" && "bg-success text-black hover:bg-success-light")}>{t(`status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}</Badge><div className="flex items-center justify-end gap-1"><DeleteEntityButton entity="invoice" id={invoice.id}/><Link href={`/invoices/${invoice.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={tc("viewDetails")}><ExternalLink/></Link></div></div>;})}</div></CardContent></Card>}
  </div>;
}
