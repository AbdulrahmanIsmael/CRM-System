import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default async function SettingsPage() {
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Settings");
  const supabase = await createClient();

  const [{ data: auth }, { data: profile }, { data: stages }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("profiles")
        .select(
          "full_name,business_name,business_email,business_phone,business_address,business_logo_url,avatar_url,cover_image_url,default_currency,default_tax_rate,payment_terms,bank_details,language",
        )
        .maybeSingle(),
      supabase
        .from("deal_stages")
        .select("id,name,color,position,is_won,is_lost")
        .order("position"),
    ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <SettingsForm
        locale={locale}
        email={auth.user?.email ?? ""}
        profile={{
          full_name: profile?.full_name ?? "",
          business_name: profile?.business_name ?? "",
          business_email: profile?.business_email ?? "",
          business_phone: profile?.business_phone ?? "",
          business_address: profile?.business_address ?? "",
          business_logo_url: profile?.business_logo_url ?? "",
          avatar_url: profile?.avatar_url ?? "",
          cover_image_url: profile?.cover_image_url ?? "",
          default_currency: profile?.default_currency ?? "USD",
          default_tax_rate: Number(profile?.default_tax_rate ?? 0),
          payment_terms: profile?.payment_terms ?? "",
          bank_details: profile?.bank_details ?? "",
        }}
        stages={(stages ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          color: s.color ?? "#94A3B8",
          position: s.position,
          is_won: s.is_won,
          is_lost: s.is_lost,
        }))}
      />
    </div>
  );
}
