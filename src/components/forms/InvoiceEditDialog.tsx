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
import { Pencil, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
type Item = { id: string; description: string; amount: number | string };
type Invoice = {
  id: string;
  invoice_number: string;
  contact_id: string;
  project_id: string | null;
  pricing_type: "itemized" | "fixed";
  fixed_amount: number | string | null;
  subtotal: number | string;
  tax_rate: number | string;
  discount: number | string;
  currency: string;
  status: string;
  issue_date: string;
  due_date: string;
  notes: string | null;
};
export function InvoiceEditDialog({
  invoice,
  items,
  contacts,
  projects,
  compact = false,
}: {
  invoice: Invoice;
  items: Item[];
  contacts: Option[];
  projects: Option[];
  compact?: boolean;
}) {
  const t = useTranslations("Invoices"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [form, setForm] = useState({
      invoiceNumber: invoice.invoice_number,
      contactId: invoice.contact_id,
      projectId: invoice.project_id ?? "",
      pricingType: invoice.pricing_type,
      fixedAmount: String(invoice.fixed_amount ?? ""),
      currency: invoice.currency,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      taxRate: String(invoice.tax_rate ?? 0),
      discount: String(invoice.discount ?? 0),
      notes: invoice.notes ?? "",
    }),
    [rows, setRows] = useState(
      items.map((x) => ({
        id: x.id,
        description: x.description,
        amount: String(x.amount),
      })).length
        ? items.map((x) => ({
            id: x.id,
            description: x.description,
            amount: String(x.amount),
          }))
        : [{ id: "new", description: "", amount: "" }],
    );
  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  const subtotal = useMemo(
    () =>
      form.pricingType === "fixed"
        ? Number(form.fixedAmount) || 0
        : rows.reduce((s, r) => s + (Number(r.amount) || 0), 0),
    [form.pricingType, form.fixedAmount, rows],
  );
  const taxAmount = Math.max(0, (subtotal * (Number(form.taxRate) || 0)) / 100);
  const total = Math.max(
    0,
    subtotal + taxAmount - (Number(form.discount) || 0),
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId || !form.dueDate) {
      toast.error(t("validation.required"));
      return;
    }
    if (
      form.pricingType === "itemized" &&
      !rows.some((r) => r.description.trim())
    ) {
      toast.error(t("validation.items"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          invoice_number: form.invoiceNumber.trim() || invoice.invoice_number,
          contact_id: form.contactId,
          project_id: form.projectId || null,
          pricing_type: form.pricingType,
          fixed_amount:
            form.pricingType === "fixed" ? Number(form.fixedAmount) || 0 : null,
          subtotal,
          tax_rate: Number(form.taxRate) || 0,
          tax_amount: taxAmount,
          discount: Number(form.discount) || 0,
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
        const valid = rows.filter((r) => r.description.trim());
        if (valid.length) {
          const { error: itemError } = await supabase
            .from("invoice_items")
            .insert(
              valid.map((r, i) => ({
                invoice_id: invoice.id,
                description: r.description.trim(),
                amount: Number(r.amount) || 0,
                position: i,
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
      setOpen(false);
      router.replace(pathname);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
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
        }
      />
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tc("edit")} — {t("invoice")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-4 text-sm">
              <span>{t("invoiceNumber")}</span>
              <Input
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
              <span>{t("project")}</span>
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
          <div className="grid md:grid-cols-4 gap-4">
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
              <Input
                type="date"
                value={form.issueDate}
                onChange={(e) => update("issueDate", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("dueDate")}</span>
              <Input
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
                <p className="text-sm font-semibold">{t("lineItems")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRows((x) => [
                      ...x,
                      { id: crypto.randomUUID(), description: "", amount: "" },
                    ])
                  }
                >
                  {t("addItem")}
                </Button>
              </div>
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_140px_40px] gap-3"
                >
                  <Input
                    placeholder={t("itemDescription")}
                    value={row.description}
                    onChange={(e) =>
                      setRows((x) =>
                        x.map((r, i) =>
                          i === index
                            ? { ...r, description: e.target.value }
                            : r,
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
                      setRows((x) =>
                        x.map((r, i) =>
                          i === index ? { ...r, amount: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={rows.length === 1}
                    onClick={() =>
                      setRows((x) => x.filter((_, i) => i !== index))
                    }
                    aria-label={tc("remove")}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-4 text-sm">
              <span>{t("taxRate")}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => update("taxRate", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("discount")}</span>
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
          <label className="space-y-4 text-sm block">
            <span>{t("notes")}</span>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
