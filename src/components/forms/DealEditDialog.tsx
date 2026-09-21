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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
type Deal = {
  id: string;
  title: string;
  contact_id: string;
  stage_id: string;
  value: number | string;
  currency: string;
  priority: string;
  expected_close_date: string | null;
  notes: string | null;
};
export function DealEditDialog({
  deal,
  contacts,
  stages,
  compact = false,
}: {
  deal: Deal;
  contacts: Option[];
  stages: Option[];
  compact?: boolean;
}) {
  const t = useTranslations("Deals"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [form, setForm] = useState({
      title: deal.title,
      contactId: deal.contact_id,
      stageId: deal.stage_id,
      value: String(deal.value ?? ""),
      currency: deal.currency,
      priority: deal.priority,
      expectedCloseDate: deal.expected_close_date ?? "",
      notes: deal.notes ?? "",
    });
  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.contactId || !form.stageId) {
      toast.error(t("validation.required"));
      return;
    }
    setLoading(true);
    try {
      const stage = stages.find((x) => x.id === form.stageId);
      const { error } = await supabase
        .from("deals")
        .update({
          title: form.title.trim(),
          contact_id: form.contactId,
          stage_id: form.stageId,
          value: Number(form.value) || 0,
          currency: form.currency.trim().toUpperCase() || "USD",
          priority: form.priority,
          expected_close_date: form.expectedCloseDate || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", deal.id);
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user)
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "updated",
          entity_type: "deal",
          entity_id: deal.id,
          description: null,
          metadata: { source: "deal_edit" },
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {tc("edit")} — {t("title")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="space-y-4 text-sm block">
            <span>{t("titleLabel")}</span>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
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
              <span>{t("stage")}</span>
              <Select
                value={form.stageId}
                items={stages.map((x) => ({ value: x.id, label: x.label }))}
                onValueChange={(v) => update("stageId", String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("value")}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) => update("value", e.target.value)}
              />
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
              <span>{t("priority")}</span>
              <Select
                value={form.priority}
                items={["low", "medium", "high", "urgent"].map((value) => ({
                  value,
                  label: t(`priorities.${value}`),
                }))}
                onValueChange={(v) => update("priority", String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`priorities.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("expectedCloseDate")}</span>
              <Input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => update("expectedCloseDate", e.target.value)}
              />
            </label>
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
              {loading ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
