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

type Contact = {
  id: string;
  type: "person" | "company";
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  timezone: string | null;
  notes: string | null;
};

export function ContactEditDialog({
  contact,
  compact = false,
}: {
  contact: Contact;
  compact?: boolean;
}) {
  const t = useTranslations("Contacts"),
    tc = useTranslations("Common");
  const supabase = createClient(),
    router = useRouter(),
    pathname = usePathname();
  const [open, setOpen] = useState(false),
    [loading, setLoading] = useState(false),
    [type, setType] = useState(contact.type),
    [form, setForm] = useState({
      firstName: contact.first_name ?? "",
      lastName: contact.last_name ?? "",
      companyName: contact.company_name ?? "",
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      website: contact.website ?? "",
      location: contact.location ?? "",
      timezone: contact.timezone ?? "",
      notes: contact.notes ?? "",
    });
  const update = (k: keyof typeof form, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      (type === "person" && !form.firstName.trim()) ||
      (type === "company" && !form.companyName.trim())
    ) {
      toast.error(t("validation.requiredName"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          type,
          first_name: type === "person" ? form.firstName.trim() : null,
          last_name: type === "person" ? form.lastName.trim() || null : null,
          company_name: type === "company" ? form.companyName.trim() : null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          website: form.website.trim() || null,
          location: form.location.trim() || null,
          timezone: form.timezone.trim() || null,
          notes: form.notes.trim() || null,
        })
        .eq("id", contact.id);
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user)
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "updated",
          entity_type: "contact",
          entity_id: contact.id,
          description: null,
          metadata: { source: "contact_edit" },
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
            {tc("edit")} — {t("contactDetails")}
          </DialogTitle>
          <DialogDescription>{t("editDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-4 text-sm">
              <span>{t("type")}</span>
              <Select
                value={type}
                items={["person", "company"].map((value) => ({
                  value,
                  label: t(`types.${value}`),
                }))}
                onValueChange={(v) => setType(v as "person" | "company")}
              >
                <SelectTrigger className="w-full" />
                <SelectContent>
                  <SelectItem value="person">{t("types.person")}</SelectItem>
                  <SelectItem value="company">{t("types.company")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            {type === "person" ? (
              <label className="space-y-4 text-sm">
                <span>{t("firstName")}</span>
                <Input
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </label>
            ) : (
              <label className="space-y-4 text-sm">
                <span>{t("company")}</span>
                <Input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                />
              </label>
            )}
          </div>
          {type === "person" && (
            <label className="space-y-4 text-sm block">
              <span>
                {t("lastName")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <Input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </label>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-4 text-sm">
              <span>
                {t("email")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>
                {t("phone")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>
                {t("website")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <Input
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>{t("location")}</span>
              <Input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
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
              rows={5}
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
