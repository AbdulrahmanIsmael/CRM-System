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
import { PhoneField, splitLegacyPhone } from "@/components/contacts/PhoneField";
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
import { CONTACT_LEAD_SOURCES } from "@/constants";
import { Input } from "@/components/ui/input";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

type Contact = {
  id: string;
  type: "person" | "company";
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  phone_country_code?: string | null;
  phone_number?: string | null;
  nationality?: string | null;
  lead_source?: string | null;
  website: string | null;
  location: string | null;
  timezone: string | null;
  notes: string | null;
};

export function ContactFormDialog({
  contact,
  autoOpen = false,
  compact = false,
}: {
  contact?: Contact;
  autoOpen?: boolean;
  compact?: boolean;
}) {
  const isEdit = Boolean(contact);
  const t = useTranslations("Contacts");
  const tc = useTranslations("Common");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const parsedPhone = contact
    ? splitLegacyPhone(
        contact.phone_country_code,
        contact.phone_number,
        contact.phone,
      )
    : { code: "+20", number: "" };
  const [open, setOpen] = useState(autoOpen);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"person" | "company">(
    contact?.type ?? "person",
  );
  const [form, setForm] = useState({
    firstName: contact?.first_name ?? "",
    lastName: contact?.last_name ?? "",
    companyName: contact?.company_name ?? "",
    email: contact?.email ?? "",
    phoneCountryCode: parsedPhone.code,
    phoneNumber: parsedPhone.number,
    nationality: contact?.nationality ?? "",
    leadSource: contact?.lead_source ?? "none",
    website: contact?.website ?? "",
    location: contact?.location ?? "",
    timezone: contact?.timezone ?? "",
    notes: contact?.notes ?? "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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
      if (isEdit && contact) {
        const { error } = await supabase
          .from("contacts")
          .update({
            type,
            first_name: type === "person" ? form.firstName.trim() : null,
            last_name: type === "person" ? form.lastName.trim() || null : null,
            company_name: type === "company" ? form.companyName.trim() : null,
            email: form.email.trim() || null,
            phone: form.phoneNumber.trim()
              ? `${form.phoneCountryCode} ${form.phoneNumber.trim()}`
              : null,
            phone_country_code: form.phoneCountryCode,
            phone_number: form.phoneNumber.trim() || null,
            nationality:
              type === "person" ? form.nationality.trim() || null : null,
            lead_source: form.leadSource === "none" ? null : form.leadSource,
            website: form.website.trim() || null,
            location: form.location.trim() || null,
            timezone: form.timezone.trim() || null,
            notes: form.notes.trim() || null,
          })
          .eq("id", contact.id);
        if (error) throw error;

        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await supabase.from("activity_log").insert({
            user_id: auth.user.id,
            action: "updated",
            entity_type: "contact",
            entity_id: contact.id,
            description: null,
            metadata: { source: "contact_edit" },
          });
        }
        toast.success(t("saved"));
      } else {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error("UNAUTHORIZED");
        const phone = form.phoneNumber.trim()
          ? `${form.phoneCountryCode} ${form.phoneNumber.trim()}`
          : null;
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
            phone,
            phone_country_code: form.phoneCountryCode,
            phone_number: form.phoneNumber.trim() || null,
            nationality:
              type === "person" ? form.nationality.trim() || null : null,
            lead_source: form.leadSource === "none" ? null : form.leadSource,
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
      }

      setOpen(false);
      router.replace(pathname);
      router.refresh();
    } catch (error) {
      console.error(error);
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
              {t("addContact")}
            </Button>
          )
        }
      />
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `${tc("edit")} - ${t("contactDetails")}`
              : t("addContact")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1 space-y-5 overflow-y-auto">
            <LoadingOverlay show={loading} label={tc("saving")} />
            <label className="block space-y-2.5 text-sm">
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
            {type === "person" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2.5 text-sm">
                  <span>{t("firstName")}</span>
                  <Input
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                  />
                </label>
                <label className="block space-y-2.5 text-sm">
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
              </div>
            ) : (
              <label className="block space-y-2.5 text-sm">
                <span>{t("company")}</span>
                <Input
                  value={form.companyName}
                  onChange={(e) => update("companyName", e.target.value)}
                />
              </label>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2.5 text-sm">
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
              <label className="block space-y-2.5 text-sm">
                <span>
                  {t("phone")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <PhoneField
                  code={form.phoneCountryCode}
                  number={form.phoneNumber}
                  onCodeChange={(value) => update("phoneCountryCode", value)}
                  onNumberChange={(value) => update("phoneNumber", value)}
                />
              </label>
              {type === "person" ? (
                <label className="block space-y-2.5 text-sm">
                  <span>
                    {t("nationality")}{" "}
                    <em className="text-xs text-muted-foreground">
                      ({tc("optional")})
                    </em>
                  </span>
                  <Input
                    value={form.nationality}
                    onChange={(e) => update("nationality", e.target.value)}
                  />
                </label>
              ) : null}
              <label className="block space-y-2.5 text-sm">
                <span>{t("leadSource")}</span>
                <Select
                  value={form.leadSource}
                  items={[
                    { value: "none", label: t("leadSources.none") },
                    ...CONTACT_LEAD_SOURCES.map((value) => ({
                      value,
                      label: t(`leadSources.${value}`),
                    })),
                  ]}
                  onValueChange={(value) => update("leadSource", String(value))}
                >
                  <SelectTrigger className="h-11 w-full min-w-0 rounded-xl border border-input bg-surface/60 px-3.5 py-2 text-sm shadow-sm transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-surface/60 dark:hover:bg-surface-light/40">
                    <SelectValue>
                      {(value: string | null) =>
                        value === "none"
                          ? t("leadSources.none")
                          : value
                            ? t(`leadSources.${value}`)
                            : t("leadSources.none")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("leadSources.none")}
                    </SelectItem>
                    {CONTACT_LEAD_SOURCES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`leadSources.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2.5 text-sm">
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
              <label className="block space-y-2.5 text-sm">
                <span>
                  {t("location")}{" "}
                  <em className="text-xs text-muted-foreground">
                    ({tc("optional")})
                  </em>
                </span>
                <Input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </label>
            </div>
            <div className="block space-y-2.5 text-sm">
              <span>
                {t("notes")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <RichTextEditor
                value={form.notes}
                onChange={(value) => update("notes", value)}
                placeholder={t("notes")}
              />
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
              {loading ? tc("saving") : isEdit ? tc("save") : tc("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
