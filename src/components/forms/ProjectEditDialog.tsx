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
type Project = {
  id: string;
  name: string;
  contact_id: string;
  deal_id: string | null;
  description: string | null;
  status: string;
  start_date: string | null;
  deadline: string | null;
  budget: number | string;
};
export function ProjectEditDialog({
  project,
  contacts,
  deals,
  compact = false,
}: {
  project: Project;
  contacts: Option[];
  deals: Option[];
  compact?: boolean;
}) {
  const t = useTranslations("Projects"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [form, setForm] = useState({
      name: project.name,
      contactId: project.contact_id,
      dealId: project.deal_id ?? "",
      description: project.description ?? "",
      status: project.status,
      startDate: project.start_date ?? "",
      deadline: project.deadline ?? "",
      budget: String(project.budget ?? ""),
    });
  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contactId) {
      toast.error(t("validation.required"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          name: form.name.trim(),
          contact_id: form.contactId,
          deal_id: form.dealId || null,
          description: form.description.trim() || null,
          status: form.status,
          start_date: form.startDate || null,
          deadline: form.deadline || null,
          budget: Number(form.budget) || 0,
        })
        .eq("id", project.id);
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user)
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "updated",
          entity_type: "project",
          entity_id: project.id,
          description: null,
          metadata: { source: "project_edit" },
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
            {tc("edit")} — {t("projectDetails")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="space-y-4 text-sm block">
            <span>{t("name")}</span>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-4 text-sm">
              <span>{t("client")}</span>
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
              <span>{t("deal")}</span>
              <Select
                value={form.dealId || "none"}
                items={[
                  { value: "none", label: tc("none") },
                  ...deals.map((x) => ({ value: x.id, label: x.label })),
                ]}
                onValueChange={(v) =>
                  update("dealId", v === "none" ? "" : String(v))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{tc("none")}</SelectItem>
                  {deals.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-4 text-sm">
              <span>{tc("status")}</span>
              <Select
                value={form.status}
                items={[
                  "not_started",
                  "in_progress",
                  "on_hold",
                  "completed",
                  "cancelled",
                ].map((value) => ({ value, label: t(`statuses.${value}`) }))}
                onValueChange={(v) => update("status", String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "not_started",
                    "in_progress",
                    "on_hold",
                    "completed",
                    "cancelled",
                  ].map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`statuses.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("budget")}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => update("budget", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("startDate")}</span>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("deadline")}</span>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => update("deadline", e.target.value)}
              />
            </label>
          </div>
          <label className="space-y-4 text-sm block">
            <span>
              {t("description")}{" "}
              <em className="text-xs text-muted-foreground">
                ({tc("optional")})
              </em>
            </span>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
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
