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
import { Pencil, Plus } from "lucide-react";
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
import { RichTextEditor } from "@/components/reports/RichTextEditor";
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

const getEmptyForm = () => ({
  title: "",
  type: "meeting",
  startTime: "",
  endTime: "",
  description: "",
  contactId: "",
  dealId: "",
  projectId: "",
  allDay: false,
});

export function EventFormDialog({
  event,
  contacts,
  deals,
  projects,
  autoOpen = false,
  compact = false,
}: {
  event?: Event;
  contacts: Option[];
  deals: Option[];
  projects: Option[];
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(event);
  const t = useTranslations("Calendar");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() =>
    event
      ? {
          title: event.title,
          type: event.type,
          startTime: inputDate(event.start_time),
          endTime: inputDate(event.end_time),
          description: event.description ?? "",
          contactId: event.contact_id ?? "",
          dealId: event.deal_id ?? "",
          projectId: event.project_id ?? "",
          allDay: event.all_day,
        }
      : getEmptyForm(),
  );

  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

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
      if (isEdit && event) {
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
      } else {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("UNAUTHORIZED");
        const { error } = await supabase.from("events").insert({
          user_id: auth.user.id,
          title: form.title.trim(),
          type: form.type,
          description: form.description.trim() || null,
          start_time: new Date(form.startTime).toISOString(),
          end_time: new Date(form.endTime).toISOString(),
          all_day: form.allDay,
          contact_id: form.contactId || null,
          deal_id: form.dealId || null,
          project_id: form.projectId || null,
        });
        if (error) throw error;
        toast.success(t("created"));
        setForm(getEmptyForm());
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen && !event) {
          setForm(getEmptyForm());
        }
      }}
    >
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
              {t("newEvent")}
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${tc("edit")} - ${t("title")}` : t("newEvent")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("subtitle")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <LoadingOverlay show={loading} label={tc("saving")} />
          <form onSubmit={submit} className="space-y-4">
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
                <DateInput
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>{tc("end")}</span>
                <DateInput
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) => update("endTime", e.target.value)}
                />
              </label>
            </div>
            <div className="space-y-4 text-sm block">
              <span>
                {tc("description")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <RichTextEditor
                value={form.description}
                onChange={(value) => update("description", value)}
                placeholder={tc("description")}
              />
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
                  <span>{tc(labelKey)}</span>
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
                {loading ? tc("saving") : isEdit ? tc("save") : tc("create")}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
