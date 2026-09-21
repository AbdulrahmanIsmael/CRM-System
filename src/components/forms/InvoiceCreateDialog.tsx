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
import { Plus, Trash2 } from "lucide-react";
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
type Line = { description: string; amount: string };
export function InvoiceCreateDialog({
  contacts,
  projects,
  autoOpen = false,
}: {
  contacts: Option[];
  projects: Option[];
  autoOpen?: boolean;
}) {
  const t = useTranslations("Invoices"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(autoOpen),
    [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<"itemized" | "fixed">("fixed");
  const [form, setForm] = useState({
    invoiceNumber: "",
    contactId: contacts[0]?.id ?? "",
    projectId: "",
    currency: "USD",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    fixedAmount: "",
    taxRate: "0",
    discount: "0",
    notes: "",
  });
  const [items, setItems] = useState<Line[]>([{ description: "", amount: "" }]);
  const subtotal = useMemo(
    () =>
      pricing === "fixed"
        ? Number(form.fixedAmount) || 0
        : items.reduce((s, x) => s + (Number(x.amount) || 0), 0),
    [pricing, form.fixedAmount, items],
  );
  const tax = Number(form.taxRate) || 0,
    discount = Number(form.discount) || 0,
    total = Math.max(0, subtotal + (subtotal * tax) / 100 - discount);
  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId || !form.dueDate) {
      toast.error(t("validation.required"));
      return;
    }
    if (pricing === "itemized" && !items.some((x) => x.description.trim())) {
      toast.error(t("validation.items"));
      return;
    }
    setLoading(true);
    try {
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
            (x) =>
              String(x.invoice_number).match(
                new RegExp(`INV-${year}-(\\d+)`),
              )?.[1],
          )
          .filter(Boolean)
          .map(Number)
          .reduce((m, n) => Math.max(m, n), 0);
        invoiceNumber = `INV-${year}-${String(max + 1).padStart(3, "0")}`;
      }
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          user_id: auth.user.id,
          contact_id: form.contactId,
          project_id: form.projectId || null,
          invoice_number: invoiceNumber,
          pricing_type: pricing,
          fixed_amount:
            pricing === "fixed" ? Number(form.fixedAmount) || 0 : null,
          subtotal,
          tax_rate: tax,
          tax_amount: (subtotal * tax) / 100,
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
      if (pricing === "itemized") {
        const { error: itemError } = await supabase
          .from("invoice_items")
          .insert(
            items
              .filter((x) => x.description.trim())
              .map((x, i) => ({
                invoice_id: data.id,
                description: x.description.trim(),
                amount: Number(x.amount) || 0,
                position: i,
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
      setOpen(false);
      router.replace(pathname);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(t("createError"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="lg" className="shadow-[0_10px_30px_rgb(47_57_169/0.2)]">
            <Plus data-icon="inline-start" />
            {t("createInvoice")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createInvoice")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
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
                placeholder={t("autoGenerated")}
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
                value={pricing}
                items={[
                  { value: "fixed", label: t("fixedPrice") },
                  { value: "itemized", label: t("itemized") },
                ]}
                onValueChange={(v) => setPricing(v as "itemized" | "fixed")}
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
          {pricing === "fixed" ? (
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
                    setItems((x) => [...x, { description: "", amount: "" }])
                  }
                >
                  {t("addItem")}
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_140px_36px] gap-2">
                  <Input
                    placeholder={t("itemDescription")}
                    value={item.description}
                    onChange={(e) =>
                      setItems((x) =>
                        x.map((r, j) =>
                          j === i ? { ...r, description: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={t("amount")}
                    value={item.amount}
                    onChange={(e) =>
                      setItems((x) =>
                        x.map((r, j) =>
                          j === i ? { ...r, amount: e.target.value } : r,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={items.length === 1}
                    onClick={() => setItems((x) => x.filter((_, j) => j !== i))}
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
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <strong>{subtotal.toLocaleString()}</strong>
              </div>
              <div className="flex justify-between mt-1">
                <span>{t("total")}</span>
                <strong className="text-primary">
                  {total.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
          <label className="space-y-4 text-sm block">
            <span>
              {t("notes")}{" "}
              <em className="text-xs text-muted-foreground">
                ({tc("optional")})
              </em>
            </span>
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
              {loading ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
