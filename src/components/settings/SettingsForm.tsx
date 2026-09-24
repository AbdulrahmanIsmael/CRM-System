"use client";

import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  ImagePlus,
  KeyRound,
  Plus,
  ReceiptText,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/reports/RichTextEditor";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Stage = {
  id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
};
type Profile = {
  full_name: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  business_logo_url: string;
  avatar_url: string;
  cover_image_url: string;
  default_currency: string;
  default_tax_rate: number;
  payment_terms: string;
  bank_details: string;
};

function createUploadPath(
  userId: string,
  kind: "avatar" | "cover" | "business-logo",
  ext: string,
) {
  return `${userId}/${kind}-${Date.now()}.${ext}`;
}

export function SettingsForm({
  profile,
  email,
  locale,
  stages,
}: {
  profile: Profile;
  email: string;
  locale: "en" | "ar";
  stages: Stage[];
}) {
  const t = useTranslations("Settings"),
    tc = useTranslations("Common");
  const supabase = createClient(),
    router = useRouter();
  const [form, setForm] = useState(profile);
  const [accountEmail, setAccountEmail] = useState(email);
  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [stageRows, setStageRows] = useState(stages);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const deleteConfirmationPhrase = t("deleteConfirmationPhrase");
  const update = (k: keyof Profile, v: string) =>
    setForm((x) => ({ ...x, [k]: v }));

  const uploadProfileImage = async (
    kind: "avatar" | "cover" | "business-logo",
    file: File,
  ) => {
    if (
      !/^image\/(png|jpe?g|webp)$/i.test(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      toast.error(t("imageTypes"));
      return;
    }
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");
      const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
      const path = createUploadPath(auth.user.id, kind, ext);
      const { error: uploadError } = await supabase.storage
        .from("profile-assets")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
          cacheControl: "31536000",
        });
      if (uploadError) throw uploadError;
      const { data: url } = supabase.storage
        .from("profile-assets")
        .getPublicUrl(path);
      const key =
        kind === "avatar"
          ? "avatar_url"
          : kind === "cover"
            ? "cover_image_url"
            : "business_logo_url";
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: url.publicUrl })
        .eq("id", auth.user.id);
      if (error) throw error;
      setForm((x) => ({ ...x, [key]: url.publicUrl }));
      toast.success(t("saved"));
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          business_name: form.business_name.trim() || null,
          business_email: form.business_email.trim() || null,
          business_phone: form.business_phone.trim() || null,
          business_address: form.business_address.trim() || null,
          business_logo_url: form.business_logo_url.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          cover_image_url: form.cover_image_url.trim() || null,
          default_currency: form.default_currency.trim().toUpperCase() || "USD",
          default_tax_rate: Number(form.default_tax_rate) || 0,
          payment_terms: form.payment_terms.trim() || null,
          bank_details: form.bank_details.trim() || null,
          language: locale,
        })
        .eq("id", auth.user.id);
      if (error) throw error;
      toast.success(t("saved"));
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };
  const updateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountEmail.trim() || accountEmail === email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: accountEmail.trim(),
      });
      if (error) throw error;
      toast.success(t("emailUpdateSent"));
    } catch (err) {
      console.error(err);
      toast.error(t("accountError"));
    } finally {
      setLoading(false);
    }
  };
  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.next || password.next !== password.confirm) {
      toast.error(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.next,
        current_password: password.current || undefined,
      });
      if (error) throw error;
      setPassword({ current: "", next: "", confirm: "" });
      toast.success(t("passwordUpdated"));
    } catch (err) {
      console.error(err);
      toast.error(t("accountError"));
    } finally {
      setLoading(false);
    }
  };
  const saveStage = async (stage: Stage) => {
    setStageRows((x) => x.map((s) => (s.id === stage.id ? stage : s)));
    const { error } = await supabase
      .from("deal_stages")
      .update({ name: stage.name, color: stage.color })
      .eq("id", stage.id);
    if (error) {
      toast.error(t("saveError"));
      return;
    }
    toast.success(t("saved"));
  };
  const addStage = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");
      const nextPosition = stageRows.length
        ? Math.max(...stageRows.map((s) => s.position)) + 1
        : 0;
      const { data, error } = await supabase
        .from("deal_stages")
        .insert({
          user_id: auth.user.id,
          name: t("newStage"),
          position: nextPosition,
          color: "#94A3B8",
          is_won: false,
          is_lost: false,
        })
        .select("id,name,color,position,is_won,is_lost")
        .single();
      if (error) throw error;
      if (data) setStageRows((x) => [...x, data as Stage]);
      toast.success(t("stageAdded"));
    } catch (err) {
      console.error(err);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  };
  const removeStage = async (stage: Stage) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deal_stages")
        .delete()
        .eq("id", stage.id);
      if (error) {
        if (error.code === "23503") throw new Error("STAGE_IN_USE");
        throw error;
      }
      setStageRows((x) => x.filter((s) => s.id !== stage.id));
      toast.success(t("stageDeleted"));
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error && err.message === "STAGE_IN_USE"
          ? t("stageInUse")
          : t("saveError"),
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (deleteConfirmation !== deleteConfirmationPhrase) {
      toast.error(t("deleteConfirmationError"));
      return;
    }
    setDeletingAccount(true);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(result?.error || "ACCOUNT_DELETE_FAILED");

      await supabase.auth.signOut({ scope: "local" });
      setDeleteDialogOpen(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("accountDeleteError"));
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-4 text-primary-light" />
            {t("profile")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/10">
                  {form.avatar_url ? (
                    <Image
                      src={form.avatar_url}
                      alt={t("avatar")}
                      width={64}
                      height={64}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="size-6 text-primary-light" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t("avatar")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("imageTypes")}
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    <span>{t("uploadAvatar")}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadProfileImage("avatar", f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 flex-1 overflow-hidden rounded-2xl bg-primary/10">
                  {form.cover_image_url ? (
                    <Image
                      src={form.cover_image_url}
                      alt={t("coverImage")}
                      width={900}
                      height={240}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full bg-[radial-gradient(circle_at_20%_30%,rgb(75_84_197/0.45),transparent_35%),linear-gradient(135deg,rgb(47_57_169/0.18),rgb(73_164_187/0.08))]" />
                  )}
                </div>
                <div className="shrink-0">
                  <p className="font-medium">{t("coverImage")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("imageTypes")}
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    <span>{t("uploadCover")}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadProfileImage("cover", f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-primary/10">
                  {form.business_logo_url ? (
                    <Image
                      src={form.business_logo_url}
                      alt={form.business_name || t("businessLogo")}
                      width={64}
                      height={64}
                      className="size-full object-contain p-2"
                    />
                  ) : (
                    <BriefcaseBusiness className="size-6 text-primary-light" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t("businessLogo")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("imageTypes")}
                  </p>
                  <label className="mt-2 inline-flex cursor-pointer items-center justify-center rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    <span>{t("uploadBusinessLogo")}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadProfileImage("business-logo", f);
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
          <form onSubmit={saveProfile} className="grid gap-4 md:grid-cols-2">
            {(
              [
                ["full_name", "fullName"],
                ["business_name", "businessName"],
                ["business_email", "businessEmail"],
                ["business_phone", "businessPhone"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="space-y-2.5 text-sm">
                <span>{t(label)}</span>
                <Input
                  value={form[key]}
                  onChange={(e) => update(key, e.target.value)}
                />
              </label>
            ))}
            <label className="space-y-2.5 text-sm md:col-span-2">
              <span>
                {t("businessAddress")}{" "}
                <em className="text-xs text-muted-foreground">
                  ({tc("optional")})
                </em>
              </span>
              <Textarea
                value={form.business_address}
                onChange={(e) => update("business_address", e.target.value)}
                placeholder={t("businessAddress")}
              />
            </label>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>
                {t("saveProfile")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-primary-light" />
            {t("business")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2.5 text-sm">
              <span>{t("defaultCurrency")}</span>
              <Input
                maxLength={3}
                value={form.default_currency}
                onChange={(e) => update("default_currency", e.target.value)}
              />
            </label>
            <label className="space-y-2.5 text-sm">
              <span>{t("defaultTax")}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={String(form.default_tax_rate)}
                onChange={(e) => update("default_tax_rate", e.target.value)}
              />
            </label>
            <label className="space-y-2.5 text-sm md:col-span-2">
              <span>{t("paymentTerms")}</span>
              <RichTextEditor
                value={form.payment_terms}
                onChange={(value) => update("payment_terms", value)}
                placeholder={t("paymentTerms")}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="size-4 text-primary-light" />
            {t("dealPipeline")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addStage}
              disabled={loading}
            >
              <Plus data-icon="inline-start" />
              {t("addStage")}
            </Button>
          </div>
          {stageRows.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/15 p-4 sm:flex-row sm:items-center"
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <Input
                value={stage.name}
                onChange={(e) =>
                  setStageRows((x) =>
                    x.map((s) =>
                      s.id === stage.id ? { ...s, name: e.target.value } : s,
                    ),
                  )
                }
                className="sm:flex-1"
              />
              <Input
                value={stage.color}
                onChange={(e) =>
                  setStageRows((x) =>
                    x.map((s) =>
                      s.id === stage.id ? { ...s, color: e.target.value } : s,
                    ),
                  )
                }
                className="sm:w-36"
              />
              <div className="flex items-center gap-2">
                <Badge variant={stage.is_won ? "default" : "secondary"}>
                  {stage.is_won
                    ? t("won")
                    : stage.is_lost
                      ? t("lost")
                      : stage.position + 1}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => saveStage(stage)}
                  disabled={loading}
                >
                  {tc("save")}
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  onClick={() => removeStage(stage)}
                  aria-label={tc("delete")}
                  disabled={loading}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-primary-light" />
            {t("accountSecurity")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            onSubmit={updateEmail}
            className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end"
          >
            <label className="space-y-2.5 text-sm">
              <span>{t("accountEmail")}</span>
              <Input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
              />
            </label>
            <Button
              type="submit"
              variant="outline"
              disabled={loading || accountEmail === email}
            >
              {t("updateEmail")}
            </Button>
          </form>
          <div className="h-px bg-border" />
          <form onSubmit={updatePassword} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2.5 text-sm">
                <span>{t("currentPassword")}</span>
                <Input
                  type="password"
                  value={password.current}
                  onChange={(e) =>
                    setPassword((x) => ({ ...x, current: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-2.5 text-sm">
                <span>{t("newPassword")}</span>
                <Input
                  type="password"
                  value={password.next}
                  onChange={(e) =>
                    setPassword((x) => ({ ...x, next: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-2.5 text-sm">
                <span>{t("confirmNewPassword")}</span>
                <Input
                  type="password"
                  value={password.confirm}
                  onChange={(e) =>
                    setPassword((x) => ({ ...x, confirm: e.target.value }))
                  }
                />
              </label>
            </div>
            <Button type="submit" disabled={loading || !password.next}>
              {t("updatePassword")}
            </Button>
          </form>
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary-light" />
            <p>{t("securityNote")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-danger/30 bg-danger/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <AlertTriangle className="size-4" />
            {t("dangerZone")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-3xl text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {t("deleteAccountTitle")}
            </p>
            <p className="mt-1">{t("deleteAccountDescription")}</p>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              setDeleteConfirmation("");
              setDeleteDialogOpen(true);
            }}
            disabled={loading || deletingAccount}
          >
            <Trash2 data-icon="inline-start" />
            {t("deleteAccountButton")}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!deletingAccount) setDeleteDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-danger">
              {t("deleteAccountDialogTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("deleteAccountDialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <label
              htmlFor="delete-account-confirmation"
              className="text-sm font-medium"
            >
              {t("deleteConfirmationLabel")}
            </label>
            <Input
              id="delete-account-confirmation"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder={deleteConfirmationPhrase}
              disabled={deletingAccount}
            />
            <p className="text-xs text-muted-foreground">
              {t("deleteConfirmationHint", {
                phrase: deleteConfirmationPhrase,
              })}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deletingAccount}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void deleteAccount()}
              disabled={
                deletingAccount ||
                deleteConfirmation !== deleteConfirmationPhrase
              }
            >
              <Trash2 data-icon="inline-start" />
              {deletingAccount
                ? t("deletingAccount")
                : t("confirmDeleteAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
