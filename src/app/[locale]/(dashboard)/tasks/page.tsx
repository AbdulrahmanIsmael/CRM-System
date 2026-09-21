import { getLocale, getTranslations } from "next-intl/server";
import { Clock, ListChecks, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TaskCreateDialog } from "@/components/forms/TaskCreateDialog";
import { TaskEditDialog } from "@/components/forms/TaskEditDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getContactDisplayName, formatDateTime, sanitizeSearchTerm } from "@/lib/crm";
import { TaskStatusToggle } from "@/components/tasks/TaskStatusToggle";

export default async function TasksPage({ searchParams }: { searchParams?: Promise<{ action?: string; q?: string }> }) {
  const params = (await searchParams) ?? {};
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Tasks");
  const tn = await getTranslations("Navigation");
  const supabase = await createClient();
  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  let taskQuery = supabase.from("tasks").select("id,title,description,status,priority,due_date,project_id,contact_id,deal_id,projects(name),contacts(type,first_name,last_name,company_name),deals(title)").order("status").order("due_date", { ascending: true, nullsFirst: false });
  if (q) taskQuery = taskQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  const [{ data: tasks }, { data: contacts }, { data: deals }, { data: projects }] = await Promise.all([
    taskQuery,
    supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active"),
    supabase.from("deals").select("id,title").order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name").order("created_at", { ascending: false }),
  ]);
  const contactOptions = (contacts ?? []).map((c) => ({ id: c.id, label: getContactDisplayName(c) })).filter((x) => x.label);
  const dealOptions = (deals ?? []).map((d) => ({ id: d.id, label: d.title }));
  const projectOptions = (projects ?? []).map((p) => ({ id: p.id, label: p.name }));
  return <div className="space-y-6 pb-10"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">Nexus CRM</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{tn("tasks")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p></div><TaskCreateDialog contacts={contactOptions} deals={dealOptions} projects={projectOptions} autoOpen={params.action === "new"} /></div><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><form className="relative flex-1 sm:max-w-xl"><Search className="pointer-events-none absolute start-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"/><Input name="q" aria-label={t("searchPlaceholder")} defaultValue={q} className="h-12 rounded-2xl ps-11" placeholder={t("searchPlaceholder")} /></form><div className="flex items-center rounded-2xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground"><ListChecks className="me-2 size-4 text-primary-light" />{tasks?.length ?? 0} {tn("tasks")}</div></div><div className="space-y-3">{(tasks ?? []).length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><ListChecks className="size-8 text-primary"/><h2 className="mt-4 font-semibold">{t("noTasks")}</h2></CardContent></Card> : (tasks ?? []).map(task => { const overdue = Boolean(task.due_date && new Date(task.due_date) < new Date() && task.status !== "done"); const contact = Array.isArray(task.contacts) ? task.contacts[0] : task.contacts; const project = Array.isArray(task.projects) ? task.projects[0] : task.projects; const deal = Array.isArray(task.deals) ? task.deals[0] : task.deals; const related = project?.name || getContactDisplayName(contact || {}) || deal?.title; return <Card key={task.id} className={`group rounded-2xl border-border/80 bg-card/95 transition-all hover:border-primary/25 ${task.status === "done" ? "opacity-65" : ""}`}><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><TaskStatusToggle id={task.id} status={task.status}/><div className="min-w-0"><p className={`truncate font-medium ${task.status === "done" ? "line-through" : ""}`}>{task.title}</p><p className="mt-1 flex items-center text-xs text-muted-foreground"><Clock className="me-1 size-3.5"/>{task.due_date ? <><span>{t("due")}</span><span className={overdue ? "ms-1 text-danger" : "ms-1"}>{overdue ? t("overdue") : formatDateTime(task.due_date, locale)}</span></> : t("dueDate")}</p>{related && <p className="mt-1 truncate text-xs text-muted-foreground">{related}</p>}</div></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>{t(`priorities.${task.priority}`)}</Badge><Badge variant="outline">{t(`statuses.${task.status}`)}</Badge><TaskEditDialog task={task} contacts={contactOptions} deals={dealOptions} projects={projectOptions} compact/><DeleteEntityButton entity="task" id={task.id}/></div></div></CardContent></Card> })}</div></div>;
}
