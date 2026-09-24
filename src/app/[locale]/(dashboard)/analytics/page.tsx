import { getLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";

export default async function AnalyticsPage() {
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Analytics");
  const supabase = await createClient();

  const [{ data: profile }, { data: invoices }, { data: stages }, { data: deals }, { data: tasks }] = await Promise.all([
    supabase.from("profiles").select("default_currency").maybeSingle(),
    supabase.from("invoices").select("total,status,paid_at,currency,contacts(type,first_name,last_name,company_name)"),
    supabase.from("deal_stages").select("id,name,color,position,is_won,is_lost").order("position"),
    supabase.from("deals").select("stage_id,value,currency"),
    supabase.from("tasks").select("status"),
  ]);

  const currency = profile?.default_currency || "USD";
  const monthCount = 6;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  start.setMonth(start.getMonth() - (monthCount - 1));

  const months = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index);
    return {
      date,
      name: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", { month: "short" }).format(date),
      revenue: 0,
    };
  });

  (invoices ?? []).forEach((invoice) => {
    if (invoice.status !== "paid" || !invoice.paid_at || invoice.currency !== currency) return;
    const date = new Date(invoice.paid_at);
    const index = (date.getFullYear() - start.getFullYear()) * 12 + date.getMonth() - start.getMonth();
    if (index >= 0 && index < monthCount) months[index].revenue += Number(invoice.total || 0);
  });

  const stageData = (stages ?? []).map((stage) => ({
    name: stage.name,
    count: (deals ?? []).filter((deal) => deal.stage_id === stage.id).length,
    color: stage.color || "#94A3B8",
  }));

  const invoiceKeys = ["paid", "sent", "overdue", "draft", "cancelled"] as const;
  const invoiceStatus = invoiceKeys.map((key) => ({
    key,
    name: t(`invoiceStatuses.${key}`),
    value: (invoices ?? []).filter((invoice) => invoice.status === key).length,
  }));

  const contactTotals = new Map<string, number>();
  (invoices ?? []).forEach((invoice) => {
    if (invoice.status !== "paid" || invoice.currency !== currency) return;
    const contact = Array.isArray(invoice.contacts) ? invoice.contacts[0] : invoice.contacts;
    const name = contact?.type === "company"
      ? contact.company_name || t("unknownClient")
      : `${contact?.first_name || ""} ${contact?.last_name || ""}`.trim() || t("unknownClient");
    contactTotals.set(name, (contactTotals.get(name) || 0) + Number(invoice.total || 0));
  });
  const clientRevenue = [...contactTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, revenue]) => ({ name, revenue }));

  const done = (tasks ?? []).filter((task) => task.status === "done").length;
  const wonIds = new Set((stages ?? []).filter((stage) => stage.is_won).map((stage) => stage.id));
  const lostIds = new Set((stages ?? []).filter((stage) => stage.is_lost).map((stage) => stage.id));
  const won = (deals ?? []).filter((deal) => wonIds.has(deal.stage_id)).length;
  const lost = (deals ?? []).filter((deal) => lostIds.has(deal.stage_id)).length;
  const sameCurrencyDeals = (deals ?? []).filter((deal) => deal.currency === currency);
  const avgDeal = sameCurrencyDeals.length
    ? sameCurrencyDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0) / sameCurrencyDeals.length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AnalyticsCharts
        locale={locale}
        revenue={months.map(({ name, revenue }) => ({ name, revenue }))}
        stages={stageData}
        invoiceStatus={invoiceStatus}
        clientRevenue={clientRevenue}
        taskRate={tasks?.length ? (done / tasks.length) * 100 : null}
        avgDeal={avgDeal}
        won={won}
        lost={lost}
        currency={currency}
        labels={{
          revenueOverTime: t("revenueOverTime"),
          dealConversion: t("dealConversion"),
          winLoss: t("winLoss"),
          invoiceBreakdown: t("invoiceBreakdown"),
          revenueByContact: t("revenueByContact"),
          taskCompletion: t("taskCompletion"),
          noData: t("noData"),
          winRate: t("winRate"),
          won: t("won"),
          lost: t("lost"),
          avgDealSize: t("avgDealSize"),
          allTasks: t("allTasks"),
        }}
      />
    </div>
  );
}
