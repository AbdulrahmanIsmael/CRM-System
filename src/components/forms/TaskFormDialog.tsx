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
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Pencil, Plus } from "lucide-react";
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  contact_id: string | null;
  deal_id: string | null;
  project_id: string | null;
};

function toInput(v: string | null) {
  return v ? new Date(v).toISOString().slice(0, 16) : "";
}

export function TaskFormDialog({
  task,
  contacts,
  deals,
  projects,
  autoOpen = false,
  compact = false,
}: {
  task?: Task;
  contacts: Option[];
  deals: Option[];
  projects: Option[];
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(task);
  const t = useTranslations("Tasks");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    priority: task?.priority ?? "medium",
    status: task?.status ?? "todo",
    dueDate: task ? toInput(task.due_date) : "",
    contactId: task?.contact_id ?? "",
    dealId: task?.deal_id ?? "",
    projectId: task?.project_id ?? "",
  });

  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(t("validation.required"));
      return;
    }
    setLoading(true);
    try {
      if (isEdit && task) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: form.title.trim(),
            description: form.description.trim() || null,
            status: form.status,
            priority: form.priority,
            due_date: form.dueDate
              ? new Date(form.dueDate).toISOString()
              : null,
            completed_at:
              form.status === "done" ? new Date().toISOString() : null,
            contact_id: form.contactId || null,
            deal_id: form.dealId || null,
            project_id: form.projectId || null,
          })
          .eq("id", task.id);
        if (error) throw error;

        const { data: auth } = await supabase.auth.getUser();
        if (auth.user)
          await supabase.from("activity_log").insert({
            user_id: auth.user.id,
            action: "updated",
            entity_type: "task",
            entity_id: task.id,
            description: null,
            metadata: { source: "task_edit" },
          });
        toast.success(t("saved"));
      } else {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("UNAUTHORIZED");
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: auth.user.id,
            title: form.title.trim(),
            description: form.description.trim() || null,
            priority: form.priority,
            status: form.status,
            due_date: form.dueDate
              ? new Date(form.dueDate).toISOString()
              : null,
            contact_id: form.contactId || null,
            deal_id: form.dealId || null,
            project_id: form.projectId || null,
          })
          .select("id")
          .single();
        if (error) throw error;
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "created",
          entity_type: "task",
          entity_id: data.id,
          description: null,
          metadata: { source: "task_create" },
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
            <Button size="lg" className="shadow-[0_10px_30px_rgb(47_57_169/0.2)]">
              <Plus data-icon="inline-start" />
              {t("addTask")}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${tc("edit")} - ${t("title")}` : t("addTask")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <LoadingOverlay show={loading} label={tc("saving")} />
          <form onSubmit={submit} className="space-y-5">
            <label className="space-y-4 text-sm block">
              <span>{t("taskTitle")}</span>
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
            <div className="space-y-4 text-sm block">
              <span>
                {t("description")} {" "}
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
                <span>{tc("status")}</span>
                <Select
                  value={form.status}
                  items={["todo", "in_progress", "done"].map((value) => ({
                    value,
                    label: t(`statuses.${value}`),
                  }))}
                  onValueChange={(v) => update("status", String(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["todo", "in_progress", "done"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`statuses.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-4 text-sm md:col-span-2">
                <span>
                  {t("dueDate")} {" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <DateInput
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => update("dueDate", e.target.value)}
                />
              </label>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {(
                [
                  ["contact", "contactId", contacts],
                  ["deal", "dealId", deals],
                  ["project", "projectId", projects],
                ] as const
              ).map(([labelKey, field, options]) => (
                <label key={field} className="space-y-4 text-sm">
                  <span>{t(labelKey)}</span>
                  <Select
                    value={form[field] || "none"}
                    items={[
                      { value: "none", label: tc("none") },
                      ...options.map((x) => ({ value: x.id, label: x.label })),
                    ]}
                    onValueChange={(v) =>
                      update(field, v === "none" ? "" : String(v))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{tc("none")}</SelectItem>
                      {options.map((x) => (
                        <SelectItem key={x.id} value={x.id}>
                          {x.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ))}
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
