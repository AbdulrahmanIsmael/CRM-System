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
export function TaskEditDialog({
  task,
  contacts,
  deals,
  projects,
  compact = false,
}: {
  task: Task;
  contacts: Option[];
  deals: Option[];
  projects: Option[];
  compact?: boolean;
}) {
  const t = useTranslations("Tasks"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [form, setForm] = useState({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: toInput(task.due_date),
      contactId: task.contact_id ?? "",
      dealId: task.deal_id ?? "",
      projectId: task.project_id ?? "",
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
      const { error } = await supabase
        .from("tasks")
        .update({
          title: form.title.trim(),
          description: form.description.trim() || null,
          status: form.status,
          priority: form.priority,
          due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tc("edit")} — {t("title")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <label className="space-y-4 text-sm block">
            <span>{t("taskTitle")}</span>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
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
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-4 text-sm">
              <span>{t("contact")}</span>
              <Select
                value={form.contactId || "none"}
                items={[
                  { value: "none", label: tc("none") },
                  ...contacts.map((x) => ({ value: x.id, label: x.label })),
                ]}
                onValueChange={(v) =>
                  update("contactId", v === "none" ? "" : String(v))
                }
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
