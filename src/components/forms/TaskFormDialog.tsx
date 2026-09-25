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

type Option = { id: string; label: string };
type DealOption = Option & { contactId?: string | null };
type ProjectOption = Option & { contactId?: string | null; dealId?: string | null };
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
  deals: DealOption[];
  projects: ProjectOption[];
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(task);
  const t = useTranslations("Tasks");
  const tc = useTranslations("Common");
  const supabase = useMemo(() => createClient(), []);
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

  // Filtered deals: only those belonging to the selected contact
  const filteredDeals = useMemo(
    () =>
      form.contactId
        ? deals.filter((d) => d.contactId === form.contactId)
        : deals,
    [deals, form.contactId],
  );

  // Filtered projects: those belonging to the selected deal, OR
  // contact-only projects (no deal) for the selected contact
  const filteredProjects = useMemo(() => {
    if (form.dealId) {
      return projects.filter((p) => p.dealId === form.dealId);
    }
    if (form.contactId) {
      return projects.filter(
        (p) => p.contactId === form.contactId && !p.dealId,
      );
    }
    return projects;
  }, [projects, form.contactId, form.dealId]);

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
            <Button
              size="lg"
              className="shadow-[0_10px_30px_rgb(47_57_169/0.2)]"
            >
              <Plus data-icon="inline-start" />
              {t("addTask")}
            </Button>
          )
        }
      />
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${tc("edit")} - ${t("title")}` : t("addTask")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 space-y-5 overflow-y-auto">
            <label className="space-y-4 text-sm block">
              <span>{t("taskTitle")}</span>
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
              />
            </label>
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
                  {t("dueDate")}{" "}
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
              {/* Contact */}
              <label className="space-y-4 text-sm">
                <span>{t("contact")}</span>
                <Select
                  value={form.contactId || "none"}
                  items={[
                    { value: "none", label: tc("none") },
                    ...contacts.map((x) => ({ value: x.id, label: x.label })),
                  ]}
                  onValueChange={(v) => {
                    const next = v === "none" ? "" : String(v);
                    setForm((x) => ({
                      ...x,
                      contactId: next,
                      dealId: "",
                      projectId: "",
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{tc("none")}</SelectItem>
                    {contacts.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {/* Deal (filtered by contact) */}
              <label className="space-y-4 text-sm">
                <span>{t("deal")}</span>
                <Select
                  value={form.dealId || "none"}
                  items={[
                    { value: "none", label: tc("none") },
                    ...filteredDeals.map((x) => ({ value: x.id, label: x.label })),
                  ]}
                  onValueChange={(v) => {
                    const next = v === "none" ? "" : String(v);
                    setForm((x) => ({ ...x, dealId: next, projectId: "" }));
                  }}
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
              {/* Project (filtered by deal or contact) */}
              <label className="space-y-4 text-sm">
                <span>{t("project")}</span>
                <Select
                  value={form.projectId || "none"}
                  items={[
                    { value: "none", label: tc("none") },
                    ...filteredProjects.map((x) => ({ value: x.id, label: x.label })),
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
                    {filteredProjects.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
