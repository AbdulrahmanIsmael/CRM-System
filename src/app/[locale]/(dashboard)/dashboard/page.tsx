import {
  ActiveProjectData,
  ActiveProjects,
} from "@/components/dashboard/ActiveProjects";
import {
  ActivityData,
  RecentActivity,
} from "@/components/dashboard/RecentActivity";
import {
  PipelineStageData,
  SalesPipeline,
} from "@/components/dashboard/SalesPipeline";
import {
  RevenueDataPoint,
  RevenueOverview,
} from "@/components/dashboard/RevenueOverview";
import {
  UpcomingEventData,
  UpcomingEvents,
} from "@/components/dashboard/UpcomingEvents";
import {
  UpcomingTaskData,
  UpcomingTasks,
} from "@/components/dashboard/UpcomingTasks";
import { endOfWeek, startOfDay, startOfMonth, subMonths } from "date-fns";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPIGrid } from "@/components/dashboard/KPIGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { createClient } from "@/lib/supabase/server";
import { getContactDisplayName } from "@/lib/crm";
import { getLocale } from "next-intl/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = (await getLocale()) as "en" | "ar";
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const todayStart = startOfDay(now);
  const sixMonthsAgo = subMonths(monthStart, 5);

  const [
    profileRes,
    paidInvoicesRes,
    projectCountRes,
    contactCountRes,
    pendingInvoicesRes,
    overdueTasksRes,
    revenueInvoicesRes,
    stagesRes,
    dealsRes,
    activityRes,
    projectsRes,
    tasksRes,
    eventsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,default_currency")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("total,currency,paid_at,issue_date")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString()),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .in("status", ["not_started", "in_progress", "on_hold"]),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["sent", "overdue"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .lt("due_date", now.toISOString())
      .neq("status", "done"),
    supabase
      .from("invoices")
      .select("total,currency,issue_date,paid_at,status")
      .gte("paid_at", sixMonthsAgo.toISOString()),
    supabase
      .from("deal_stages")
      .select("id,name,color,position")
      .order("position", { ascending: true }),
    supabase.from("deals").select("stage_id,value,currency"),
    supabase
      .from("activity_log")
      .select("id,action,entity_type,entity_id,description,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("projects")
      .select(
        "id,name,status,contact_id,contacts(type,first_name,last_name,company_name)",
      )
      .in("status", ["not_started", "in_progress", "on_hold"])
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("tasks")
      .select(
        "id,title,due_date,priority,status,project_id,contact_id,projects(name),contacts(type,first_name,last_name,company_name)",
      )
      .neq("status", "done")
      .gte("due_date", todayStart.toISOString())
      .lte("due_date", weekEnd.toISOString())
      .order("due_date", { ascending: true })
      .limit(5),
    supabase
      .from("events")
      .select(
        "id,title,start_time,end_time,contact_id,contacts(type,first_name,last_name,company_name)",
      )
      .gte("start_time", now.toISOString())
      .order("start_time", { ascending: true })
      .limit(4),
  ]);

  const currency = profileRes.data?.default_currency || "USD";
  const profileName =
    profileRes.data?.full_name?.split(" ")[0] ||
    auth.user?.email?.split("@")[0] ||
    "";
  const totalRevenue = (paidInvoicesRes.data ?? [])
    .filter((x) => x.currency === currency)
    .reduce((sum, x) => sum + Number(x.total || 0), 0);

  const months: RevenueDataPoint[] = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(sixMonthsAgo);
    month.setMonth(sixMonthsAgo.getMonth() + index);
    return {
      name: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        month: "short",
      }).format(month),
      revenue: 0,
      invoices: 0,
    };
  });
  (revenueInvoicesRes.data ?? []).forEach((invoice) => {
    if (invoice.status !== "paid" || !invoice.paid_at) return;
    const date = new Date(invoice.paid_at);
    const diff =
      (date.getFullYear() - sixMonthsAgo.getFullYear()) * 12 +
      date.getMonth() -
      sixMonthsAgo.getMonth();
    if (diff >= 0 && diff < 6 && invoice.currency === currency) {
      months[diff].revenue += Number(invoice.total || 0);
      months[diff].invoices += 1;
    }
  });

  const pipeline: PipelineStageData[] = (stagesRes.data ?? []).map((stage) => {
    const stageDeals = (dealsRes.data ?? []).filter(
      (deal) => deal.stage_id === stage.id,
    );
    const stageCurrencyDeals = stageDeals.filter(
      (deal) => deal.currency === currency,
    );
    return {
      id: stage.id,
      name: stage.name,
      color: stage.color,
      count: stageDeals.length,
      value: stageCurrencyDeals.reduce(
        (sum, deal) => sum + Number(deal.value || 0),
        0,
      ),
      currency,
    };
  });

  const getRelatedName = (relation: unknown) => {
    if (!relation) return null;
    const value = Array.isArray(relation) ? relation[0] : relation;
    if (!value || typeof value !== "object") return null;
    return (
      getContactDisplayName(
        value as {
          type?: string;
          first_name?: string | null;
          last_name?: string | null;
          company_name?: string | null;
        },
      ) || null
    );
  };

  const recentActivities: ActivityData[] = (activityRes.data ?? []).map(
    (log) => ({
      id: log.id,
      description: log.description,
      entityName: log.entity_type,
      time: new Date(log.created_at),
      type: log.entity_type,
      action: log.action,
    }),
  );

  const projectIds = (projectsRes.data ?? []).map((project) => project.id);
  const projectTasksRes = projectIds.length
    ? await supabase
        .from("tasks")
        .select("project_id,status")
        .in("project_id", projectIds)
    : { data: [] as { project_id: string | null; status: string }[] };
  const activeProjects: ActiveProjectData[] = (projectsRes.data ?? []).map(
    (project) => {
      const tasks = (projectTasksRes.data ?? []).filter(
        (task) => task.project_id === project.id,
      );
      const progress = tasks.length
        ? (tasks.filter((task) => task.status === "done").length /
            tasks.length) *
          100
        : null;
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        clientName: getRelatedName(project.contacts) || "",
        progress,
      };
    },
  );

  const upcomingTasks: UpcomingTaskData[] = (tasksRes.data ?? []).map(
    (task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      priority: task.priority,
      linkedName: (task.projects?.[0]?.name) || getRelatedName(task.contacts),
    }),
  );
  const upcomingEvents: UpcomingEventData[] = (eventsRes.data ?? []).map(
    (event) => ({
      id: event.id,
      title: event.title,
      startTime: new Date(event.start_time),
      endTime: new Date(event.end_time),
      context: getRelatedName(event.contacts),
    }),
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <DashboardHeader userName={profileName} />
      <KPIGrid
        totalRevenue={totalRevenue}
        currency={currency}
        activeProjects={projectCountRes.count ?? 0}
        totalClients={contactCountRes.count ?? 0}
        pendingInvoices={pendingInvoicesRes.count ?? 0}
        overdueTasks={overdueTasksRes.count ?? 0}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(250px,1fr)_minmax(250px,1fr)]">
        <RevenueOverview data={months} currency={currency} />
        <SalesPipeline stages={pipeline} />
        <UpcomingTasks tasks={upcomingTasks} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(280px,0.8fr)]">
        <RecentActivity activities={recentActivities} />
        <ActiveProjects projects={activeProjects} />
        <div className="grid gap-4">
          <QuickActions />
          <UpcomingEvents events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
}
