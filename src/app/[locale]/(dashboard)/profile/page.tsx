import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  Settings2,
  WalletCards,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getInitials } from "@/lib/crm";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const t = await getTranslations("Settings");
  const supabase = await createClient();
  const [{ data: auth }, { data: p }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("profiles")
      .select(
        "full_name,business_name,business_email,business_phone,business_address,cover_image_url,default_currency,default_tax_rate,payment_terms,bank_details,avatar_url,business_logo_url",
      )
      .maybeSingle(),
  ]);
  const name = p?.full_name || auth.user?.email?.split("@")[0] || "";
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
            Nexus CRM
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("profile")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("profileSubtitle")}
          </p>
        </div>
        <Link
          href="/settings"
          className={buttonVariants({ variant: "outline", size: "lg" })}
        >
          <Settings2 data-icon="inline-start" />
          {t("openSettings")}
        </Link>
      </div>
      <Card className="overflow-hidden">
        <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_20%_30%,rgb(75_84_197/0.45),transparent_35%),linear-gradient(135deg,rgb(47_57_169/0.18),rgb(73_164_187/0.08))]">
          {p?.cover_image_url ? (
            <Image
              src={p.cover_image_url}
              alt={t("coverImage")}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <CardContent className="relative -mt-12 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-card bg-primary/15 text-2xl font-semibold text-primary-light shadow-xl">
              {p?.avatar_url ? (
                <Image
                  src={p.avatar_url}
                  alt={name || t("profile")}
                  width={96}
                  height={96}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-primary-light">
                  {getInitials(name)}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-semibold">{name}</h2>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {auth.user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness className="size-4 text-primary-light" />
              {t("business")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">
                {t("businessName")}
              </p>
              <p className="mt-1 font-medium">{p?.business_name || "-"}</p>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <span>{p?.business_email || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <span>{p?.business_phone || "-"}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <span className="whitespace-pre-line">
                {p?.business_address || "-"}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <WalletCards className="size-4 text-primary-light" />
              {t("invoiceDefaults")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("defaultCurrency")}
              </span>
              <span className="font-mono font-semibold">
                {p?.default_currency || "USD"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("defaultTax")}</span>
              <span className="font-semibold">
                {Number(p?.default_tax_rate ?? 0)}%
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("paymentTerms")}
              </p>
              <p className="mt-1 whitespace-pre-line">
                {p?.payment_terms || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {t("bankDetails")}
              </p>
              <p className="mt-1 whitespace-pre-line">
                {p?.bank_details || "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
