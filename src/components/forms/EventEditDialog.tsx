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
type Event = {
  id: string;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
  description: string | null;
  contact_id: string | null;
  deal_id: string | null;
  project_id: string | null;
  all_day: boolean;
};
const inputDate = (value: string) => new Date(value).toISOString().slice(0, 16);
export function EventEditDialog({
  event,
  contacts,
  deals,
  projects,
  compact = false,
}: {
  event: Event;
  contacts: Option[];
  deals: Option[];
  projects: Option[];
  compact?: boolean;
}) {
  const t = useTranslations("Calendar"),
    tc = useTranslations("Common"),
    supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [form, setForm] = useState({
      title: event.title,
      type: event.type,
      startTime: inputDate(event.start_time),
      endTime: inputDate(event.end_time),
      description: event.description ?? "",
      contactId: event.contact_id ?? "",
      dealId: event.deal_id ?? "",
      projectId: event.project_id ?? "",
      allDay: event.all_day,
    });
  const update = (k: keyof typeof form, v: string | boolean) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      toast.error(t("validation"));
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      toast.error(t("invalidRange"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: form.title.trim(),
          type: form.type,
          start_time: new Date(form.startTime).toISOString(),
          end_time: new Date(form.endTime).toISOString(),
          description: form.description.trim() || null,
          contact_id: form.contactId || null,
          deal_id: form.dealId || null,
          project_id: form.projectId || null,
          all_day: form.allDay,
        })
        .eq("id", event.id);
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user)
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "updated",
          entity_type: "event",
          entity_id: event.id,
          description: null,
          metadata: { source: "event_edit" },
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
            <span>{tc("title")}</span>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-4 text-sm">
              <span>{tc("type")}</span>
              <Select
                value={form.type}
                items={[
                  "meeting",
                  "call",
                  "follow_up",
                  "deadline",
                  "other",
                ].map((value) => ({ value, label: t(value) }))}
                onValueChange={(v) => update("type", String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["meeting", "call", "follow_up", "deadline", "other"].map(
                    (v) => (
                      <SelectItem key={v} value={v}>
                        {t(v)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-4 text-sm">
              <span>{tc("start")}</span>
              <Input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => update("startTime", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{tc("end")}</span>
              <Input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => update("endTime", e.target.value)}
              />
            </label>
          </div>
          <label className="space-y-4 text-sm block">
            <span>
              {tc("description")}{" "}
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
          <div className="grid md:grid-cols-3 gap-4">
            <label className="space-y-4 text-sm">
              <span>{tc("contact")}</span>
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
              <span>{tc("deal")}</span>
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
              <span>{tc("project")}</span>
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
          <label className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-sm">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => update("allDay", e.target.checked)}
            />
            <span>{t("allDay")}</span>
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
