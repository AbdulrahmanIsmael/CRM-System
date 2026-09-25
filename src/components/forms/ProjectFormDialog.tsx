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
import { Pencil, Plus, LoaderCircle } from "lucide-react";
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
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string; contactId?: string };
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

export function ProjectFormDialog({
  project,
  contacts,
  deals,
  autoOpen = false,
  compact = false,
}: {
  project?: Project;
  contacts: Option[];
  deals: Option[];
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(project);
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: project?.name ?? "",
    contactId: project?.contact_id ?? contacts[0]?.id ?? "",
    dealId: project?.deal_id ?? "",
    description: project?.description ?? "",
    status: project?.status ?? "not_started",
    startDate: project?.start_date ?? "",
    deadline: project?.deadline ?? "",
    budget: String(project?.budget ?? ""),
  });
  const filteredDeals = deals.filter(
    (deal) => deal.contactId === form.contactId,
  );
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
      if (isEdit && project) {
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
      } else {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("UNAUTHORIZED");
        const { data, error } = await supabase
          .from("projects")
          .insert({
            user_id: auth.user.id,
            contact_id: form.contactId,
            deal_id: form.dealId || null,
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: form.status,
            start_date: form.startDate || null,
            deadline: form.deadline || null,
            budget: Number(form.budget) || 0,
          })
          .select("id")
          .single();
        if (error) throw error;
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "created",
          entity_type: "project",
          entity_id: data.id,
          description: null,
          metadata: { source: "project_create" },
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
              {t("addProject")}
            </Button>
          )
        }
      />
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `${tc("edit")} - ${t("projectDetails")}`
              : t("addProject")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 space-y-5 overflow-y-auto">
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
                  onValueChange={(v) => {
                    const next = String(v);
                    update("contactId", next);
                    if (
                      form.dealId &&
                      deals.find((deal) => deal.id === form.dealId)
                        ?.contactId !== next
                    ) {
                      update("dealId", "");
                    }
                  }}
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
                    ...filteredDeals.map((x) => ({
                      value: x.id,
                      label: x.label,
                    })),
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
                    {filteredDeals.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <div className="space-y-4 text-sm block">
              <span>
                {t("description")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <RichTextEditor
                value={form.description}
                onChange={(value) => update("description", value)}
                placeholder={t("description")}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="space-y-4 text-sm">
                <span>{t("startDate")}</span>
                <DateInput
                  type="date"
                  value={form.startDate}
                  onChange={(e) => update("startDate", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>{t("deadline")}</span>
                <DateInput
                  type="date"
                  value={form.deadline}
                  onChange={(e) => update("deadline", e.target.value)}
                />
              </label>
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
              {loading ? tc("saving") : isEdit ? tc("save") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
