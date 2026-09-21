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

interface ContactCreateDialogProps {
  autoOpen?: boolean;
}

export function ContactCreateDialog({
  autoOpen = false,
}: ContactCreateDialogProps) {
  const t = useTranslations("Contacts");
  const tCommon = useTranslations("Common");
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"person" | "company">("person");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    timezone: "",
    notes: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      (type === "person" && !form.firstName.trim()) ||
      (type === "company" && !form.companyName.trim())
    ) {
      toast.error(t("validation.requiredName"));
      return;
    }
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: auth.user.id,
          type,
          status: "active",
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
        .select("id")
        .single();
      if (error) throw error;
      await supabase.from("activity_log").insert({
        user_id: auth.user.id,
        action: "created",
        entity_type: "contact",
        entity_id: data.id,
        description: null,
        metadata: { source: "contact_create" },
      });
      toast.success(t("created"));
      setOpen(false);
      router.replace(pathname);
      router.refresh();
      setForm({
        firstName: "",
        lastName: "",
        companyName: "",
        email: "",
        phone: "",
        website: "",
        location: "",
        timezone: "",
        notes: "",
      });
    } catch (error) {
      console.error(error);
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
            {t("addContact")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addContact")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-4 text-sm">
              <span>{t("type")}</span>
              <Select
                value={type}
                items={["person", "company"].map((value) => ({
                  value,
                  label: t(`types.${value}`),
                }))}
                onValueChange={(value) =>
                  setType(value as "person" | "company")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">{t("types.person")}</SelectItem>
                  <SelectItem value="company">{t("types.company")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>
          {type === "person" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-4 text-sm">
                <span>{t("firstName")}</span>
                <Input
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </label>
              <label className="space-y-4 text-sm">
                <span>
                  {t("lastName")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tCommon("optional")})
                  </em>
                </span>
                <Input
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </label>
            </div>
          ) : (
            <label className="space-y-4 text-sm">
              <span>{t("company")}</span>
              <Input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
              />
            </label>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-4 text-sm">
              <span>
                {t("email")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tCommon("optional")})
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
                  ({tCommon("optional")})
                </em>
              </span>
              <Input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-4 text-sm">
              <span>
                {t("website")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tCommon("optional")})
                </em>
              </span>
              <Input
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
              />
            </label>
            <label className="space-y-4 text-sm">
              <span>
                {t("location")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tCommon("optional")})
                </em>
              </span>
              <Input
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </label>
          </div>
          <label className="space-y-4 text-sm">
            <span>
              {t("notes")}{" "}
              <em className="text-xs text-muted-foreground">
                ({tCommon("optional")})
              </em>
            </span>
            <Textarea
              rows={4}
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
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon("saving") : tCommon("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
