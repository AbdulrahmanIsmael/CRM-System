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
export function ProjectCreateDialog({
  contacts,
  deals,
  autoOpen = false,
}: {
  contacts: Option[];
  deals: Option[];
  autoOpen?: boolean;
}) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contactId: contacts[0]?.id ?? "",
    dealId: "",
    description: "",
    status: "not_started",
    startDate: "",
    deadline: "",
    budget: "",
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
            {t("addProject")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("addProject")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="space-y-4 text-sm block">
            <span>{t("name")}</span>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-3">
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
          </div>
          <label className="space-y-4 text-sm block">
            <span>{t("description")}</span>
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-2 gap-3">
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
          <div className="grid md:grid-cols-2 gap-3">
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
