"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
type Item = { id: string; description: string; amount: number | string };
export type InvoiceFormData = {
  id: string;
  invoice_number: string;
  contact_id: string;
  project_id: string | null;
  pricing_type: "itemized" | "fixed";
  fixed_amount: number | string | null;
  tax_rate: number | string;
  discount: number | string;
  currency: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
};
type Row = { id: string; description: string; amount: string };

const createRow = (): Row => ({
  id: crypto.randomUUID(),
  description: "",
  amount: "",
});

export function InvoiceFormDialog({
  invoice,
  items,
  contacts,
  projects,
  autoOpen = false,
  compact = false,
}: {
  invoice?: InvoiceFormData;
  items?: Item[];
  contacts: Option[];
  projects: Option[];
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(invoice);
  const t = useTranslations("Invoices");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    invoiceNumber: invoice?.invoice_number ?? "",
    contactId: invoice?.contact_id ?? contacts[0]?.id ?? "",
    projectId: invoice?.project_id ?? "",
    pricingType: invoice?.pricing_type ?? ("fixed" as const),
    fixedAmount: String(invoice?.fixed_amount ?? ""),
    currency: invoice?.currency ?? "USD",
    issueDate: invoice?.issue_date ?? new Date().toISOString().slice(0, 10),
    dueDate: invoice?.due_date ?? "",
    taxRate: String(invoice?.tax_rate ?? 0),
    discount: String(invoice?.discount ?? 0),
    notes: invoice?.notes ?? "",
  });
  const [rows, setRows] = useState<Row[]>(() => {
    if (!isEdit) return [createRow()];
    const initial = (items ?? []).map((x) => ({
      id: x.id,
      description: x.description,
      amount: String(x.amount),
    }));
    return initial.length ? initial : [createRow()];
  });

  const subtotal = useMemo(
    () =>
      form.pricingType === "fixed"
        ? Number(form.fixedAmount) || 0
        : rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [form.pricingType, form.fixedAmount, rows],
  );
  const taxRate = Number(form.taxRate) || 0;
  const discount = Number(form.discount) || 0;
  const taxAmount = (subtotal * taxRate) / 100;
  const total = Math.max(0, subtotal + taxAmount - discount);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId || !form.dueDate) {
      toast.error(t("validation.required"));
      return;
    }
    if (
      form.pricingType === "itemized" &&
      !rows.some((row) => row.description.trim())
    ) {
      toast.error(t("validation.items"));
      return;
    }

    setLoading(true);
    try {
      if (isEdit && invoice) {
        const { error } = await supabase
          .from("invoices")
          .update({
            invoice_number: form.invoiceNumber.trim() || invoice.invoice_number,
            contact_id: form.contactId,
            project_id: form.projectId || null,
            pricing_type: form.pricingType,
            fixed_amount:
              form.pricingType === "fixed"
                ? Number(form.fixedAmount) || 0
                : null,
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            discount,
            total,
            currency: form.currency.trim().toUpperCase() || "USD",
            issue_date: form.issueDate,
            due_date: form.dueDate,
            notes: form.notes.trim() || null,
          })
          .eq("id", invoice.id);
        if (error) throw error;

        const { error: deleteItemsError } = await supabase
          .from("invoice_items")
          .delete()
          .eq("invoice_id", invoice.id);
        if (deleteItemsError) throw deleteItemsError;

        if (form.pricingType === "itemized") {
          const valid = rows.filter((row) => row.description.trim());
          if (valid.length) {
            const { error: itemError } = await supabase
              .from("invoice_items")
              .insert(
                valid.map((row, index) => ({
                  invoice_id: invoice.id,
                  description: row.description.trim(),
                  amount: Number(row.amount) || 0,
                  position: index,
                })),
              );
            if (itemError) throw itemError;
          }
        }

        const { data: auth } = await supabase.auth.getUser();
        if (auth.user)
          await supabase.from("activity_log").insert({
            user_id: auth.user.id,
            action: "updated",
            entity_type: "invoice",
            entity_id: invoice.id,
            description: null,
            metadata: { source: "invoice_edit" },
          });
        toast.success(t("saved"));
      } else {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("UNAUTHORIZED");

        let invoiceNumber = form.invoiceNumber.trim();
        if (!invoiceNumber) {
          const { data: existing } = await supabase
            .from("invoices")
            .select("invoice_number")
            .order("created_at", { ascending: false })
            .limit(200);
          const year = new Date().getFullYear();
          const max = (existing ?? [])
            .map(
              (item) =>
                String(item.invoice_number).match(
                  new RegExp(`INV-${year}-(\\d+)`),
                )?.[1],
            )
            .filter(Boolean)
            .map(Number)
            .reduce((maxValue, value) => Math.max(maxValue, value), 0);
          invoiceNumber = `INV-${year}-${String(max + 1).padStart(3, "0")}`;
        }

        const { data, error } = await supabase
          .from("invoices")
          .insert({
            user_id: auth.user.id,
            contact_id: form.contactId,
            project_id: form.projectId || null,
            invoice_number: invoiceNumber,
            pricing_type: form.pricingType,
            fixed_amount:
              form.pricingType === "fixed"
                ? Number(form.fixedAmount) || 0
                : null,
            subtotal,
            tax_rate: taxRate,
            tax_amount: taxAmount,
            discount,
            total,
            currency: form.currency.trim().toUpperCase() || "USD",
            status: "draft",
            issue_date: form.issueDate,
            due_date: form.dueDate,
            notes: form.notes.trim() || null,
          })
          .select("id")
          .single();
        if (error) throw error;

        if (form.pricingType === "itemized") {
          const { error: itemError } = await supabase
            .from("invoice_items")
            .insert(
              rows
                .filter((row) => row.description.trim())
                .map((row, index) => ({
                  invoice_id: data.id,
                  description: row.description.trim(),
                  amount: Number(row.amount) || 0,
                  position: index,
                })),
            );
          if (itemError) throw itemError;
        }

        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "created",
          entity_type: "invoice",
          entity_id: data.id,
          description: null,
          metadata: { source: "invoice_create" },
        });
        toast.success(t("created"));
      }

      setOpen(false);
      router.replace(pathname);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? t("saveError") : t("createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button
              variant="ghost"
              size={compact ? "icon-sm" : "sm"}
              aria-label={tc("edit")}
            >
              {compact ? (
                <Pencil />
              ) : (
                <>
                  <Pencil data-icon="inline-start" />
                  {tc("edit")}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="lg"
              className="shadow-[0_10px_30px_rgb(47_57_169/0.2)]"
            >
              <Plus data-icon="inline-start" />
              {t("createInvoice")}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${tc("edit")} - ${t("invoice")}` : t("createInvoice")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <LoadingOverlay show={loading} label={tc("saving")} />
          <form onSubmit={submit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-3">
              <label className="space-y-4 text-sm">
                <span>
                  {t("invoiceNumber")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <Input
                  placeholder={isEdit ? undefined : t("autoGenerated")}
                  value={form.invoiceNumber}
                  onChange={(e) => update("invoiceNumber", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>{t("contact")}</span>
                <Select
                  value={form.contactId}
                  items={contacts.map((x) => ({ value: x.id, label: x.label }))}
                  onValueChange={(v) => update("contactId", String(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-4 text-sm">
                <span>
                  {t("project")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <Select
                  value={form.projectId || "none"}
                  items={[
                    { value: "none", label: tc("none") },
                    ...projects.map((x) => ({ value: x.id, label: x.label })),
                  ]}
                  onValueChange={(v) =>
                    update("projectId", v === "none" ? "" : String(v))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tc("none")}</SelectItem>
                    {projects.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <label className="space-y-4 text-sm">
                <span>{t("pricingType")}</span>
                <Select
                  value={form.pricingType}
                  items={[
                    { value: "fixed", label: t("fixedPrice") },
                    { value: "itemized", label: t("itemized") },
                  ]}
                  onValueChange={(v) => update("pricingType", String(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">{t("fixedPrice")}</SelectItem>
                    <SelectItem value="itemized">{t("itemized")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-4 text-sm">
                <span>{t("currency")}</span>
                <Input
                  maxLength={3}
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>{t("issueDate")}</span>
                <DateInput
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => update("issueDate", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>{t("dueDate")}</span>
                <DateInput
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
              </label>
            </div>

            {form.pricingType === "fixed" ? (
              <label className="space-y-4 text-sm block">
                <span>{t("fixedAmount")}</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.fixedAmount}
                  onChange={(e) => update("fixedAmount", e.target.value)}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{t("lineItems")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setRows((current) => [...current, createRow()])
                    }
                  >
                    {t("addItem")}
                  </Button>
                </div>
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_140px_36px] gap-2"
                  >
                    <Input
                      placeholder={t("itemDescription")}
                      value={row.description}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={t("amount")}
                      value={row.amount}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, amount: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={rows.length === 1}
                      onClick={() =>
                        setRows((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      aria-label={tc("remove")}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-3">
              <label className="space-y-4 text-sm">
                <span>
                  {t("taxRate")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(e) => update("taxRate", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>
                  {t("discount")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) => update("discount", e.target.value)}
                />
              </label>
              <div className="rounded-2xl border border-border bg-muted/20 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>{t("subtotal")}</span>
                  <strong>{subtotal.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t("tax")}</span>
                  <strong>{taxAmount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span>{t("total")}</span>
                  <strong className="text-primary">
                    {total.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-sm block">
              <span>
                {t("notes")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <RichTextEditor
                value={form.notes}
                onChange={(value) => update("notes", value)}
                placeholder={t("notes")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? tc("saving") : isEdit ? tc("save") : tc("create")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
