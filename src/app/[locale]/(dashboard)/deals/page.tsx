import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "@/components/deals/KanbanBoard";
import { DealFormDialog } from "@/components/forms/DealFormDialog";

export default async function DealsPage({ searchParams }: { searchParams?: Promise<{ action?: string }> }) {
  const params = (await searchParams) ?? {};
  const t = await getTranslations("Deals");
  const tNav = await getTranslations("Navigation");
  const supabase = await createClient();
  const [{ data: contacts }, { data: stages }] = await Promise.all([
    supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("deal_stages").select("id,name,position").order("position"),
  ]);
  const contactOptions = (contacts ?? [])
    .map((contact) => ({ id: contact.id, label: contact.type === "company" ? contact.company_name || "" : `${contact.first_name || ""} ${contact.last_name || ""}`.trim() }))
    .filter((x) => x.label);
  const stageLabel = (name: string) => { switch (name) { case "Lead": return t("stages.lead"); case "Contacted": return t("stages.contacted"); case "Proposal Sent": return t("stages.proposalSent"); case "Negotiation": return t("stages.negotiation"); case "Won": return t("stages.won"); case "Lost": return t("stages.lost"); default: return name; } };
  const stageOptions = (stages ?? []).map((stage) => ({ id: stage.id, label: stageLabel(stage.name) }));

  return (
    <div className="flex h-full flex-col space-y-6">
      <PageHeader
        title={tNav("deals")}
        subtitle={t("subtitle")}
        action={
          <DealFormDialog
            contacts={contactOptions}
            stages={stageOptions}
            autoOpen={params.action === "new"}
          />
        }
      />

      <div className="min-h-0 flex-1">
        <KanbanBoard />
      </div>
    </div>
  );
}
