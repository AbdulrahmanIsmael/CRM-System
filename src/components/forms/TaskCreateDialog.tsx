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
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Option = { id: string; label: string };
export function TaskCreateDialog({
  contacts,
  deals,
  projects,
  autoOpen = false,
}: {
  contacts: Option[];
  deals: Option[];
  projects: Option[];
  autoOpen?: boolean;
}) {
  const t = useTranslations("Tasks"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(autoOpen),
    [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    contactId: "",
    dealId: "",
    projectId: "",
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
          due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
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
            {t("addTask")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addTask")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="space-y-4 text-sm block">
            <span>{t("taskTitle")}</span>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <label className="space-y-4 text-sm block">
            <span>{t("description")}</span>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-3 gap-3">
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
            <label className="space-y-4 text-sm">
              <span>{t("dueDate")}</span>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => update("dueDate", e.target.value)}
              />
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
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
              {loading ? tc("saving") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
