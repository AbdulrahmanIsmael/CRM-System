import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, FolderKanban, ExternalLink, Search, WalletCards } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContactDisplayName, formatCurrency, formatDate, sanitizeSearchTerm } from "@/lib/crm";
import { ProjectCreateDialog } from "@/components/forms/ProjectCreateDialog";
import { ProjectEditDialog } from "@/components/forms/ProjectEditDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default async function ProjectsPage({ searchParams }: { searchParams?: Promise<{ action?: string; q?: string }> }) {
  const params = (await searchParams) ?? {};
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Projects");
  const tn = await getTranslations("Navigation");
  const supabase = await createClient();
  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  let projectQuery = supabase
    .from("projects")
    .select("id,name,status,budget,deadline,start_date,description,contact_id,deal_id,contacts(type,first_name,last_name,company_name)")
    .order("created_at", { ascending: false });
  if (q) projectQuery = projectQuery.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  const [{ data: projects }, { data: contacts }, { data: deals }, { data: profile }] = await Promise.all([
    projectQuery,
    supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active"),
    supabase.from("deals").select("id,title,contact_id").order("created_at", { ascending: false }),
    supabase.from("profiles").select("default_currency").maybeSingle(),
  ]);
  const ids = (projects ?? []).map((p) => p.id);
  const { data: tasks } = ids.length
    ? await supabase.from("tasks").select("project_id,status").in("project_id", ids)
    : { data: [] as { project_id: string | null; status: string }[] };
  const taskMap = new Map<string, { total: number; done: number }>();
  (tasks ?? []).forEach((task) => {
    if (!task.project_id) return;
    const current = taskMap.get(task.project_id) ?? { total: 0, done: 0 };
    current.total += 1;
    if (task.status === "done") current.done += 1;
    taskMap.set(task.project_id, current);
  });
  const currency = profile?.default_currency || "USD";
  const contactOptions = (contacts ?? []).map((c) => ({ id: c.id, label: getContactDisplayName(c) })).filter((x) => x.label);
  const dealOptions = (deals ?? []).map((d) => ({ id: d.id, label: d.title }));

  return <div className="space-y-6 pb-10">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">Nexus CRM</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{tn("projects")}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("subtitle")}</p></div>
      <ProjectCreateDialog contacts={contactOptions} deals={dealOptions} autoOpen={params.action === "new"} />
    </div>
    <form className="relative max-w-xl">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <Input name="q" aria-label={t("searchPlaceholder")} defaultValue={q} placeholder={t("searchPlaceholder")} className="h-12 rounded-2xl ps-11" />
    </form>
    {(projects ?? []).length === 0 ? <Card className="border-dashed"><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FolderKanban className="size-6" /></div><h2 className="mt-4 font-semibold">{t("noProjects")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("createDescription")}</p></CardContent></Card> :
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{projects!.map((project) => { const contact = Array.isArray(project.contacts) ? project.contacts[0] : project.contacts; const client = getContactDisplayName(contact || {}) || t("clientUnknown"); const stat = taskMap.get(project.id); const progress = stat?.total ? Math.round((stat.done / stat.total) * 100) : null; return <Card key={project.id} className="group overflow-hidden rounded-2xl border-border/80 bg-card/95 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_50px_rgb(0_0_0_/_0.18)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/projects/${project.id}`} className="block truncate text-base font-semibold hover:text-primary-light">{project.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{client}</p></div><div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><ProjectEditDialog project={project as any} contacts={contactOptions} deals={dealOptions} compact /><DeleteEntityButton entity="project" id={project.id} /><Link href={`/projects/${project.id}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })} aria-label={t("viewDetails")}><ExternalLink /></Link></div></div><div className="mt-5 flex items-center justify-between gap-2"><Badge variant="outline" className={cn(project.status === "in_progress" && "border-primary/30 bg-primary/5 text-primary-light", project.status === "completed" && "border-success/30 bg-success/5 text-success", project.status === "on_hold" && "border-warning/30 bg-warning/5 text-warning")}>{t(`statuses.${project.status}`)}</Badge><span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"><WalletCards className="size-3.5" />{formatCurrency(Number(project.budget || 0), currency, locale)}</span></div><div className="mt-5"><div className="mb-2 flex items-center justify-between text-xs text-muted-foreground"><span>{t("progress")}</span><span>{progress === null ? t("noProgress") : `${progress}%`}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-light"><div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${progress ?? 0}%` }} /></div></div><div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{project.deadline ? formatDate(project.deadline, locale) : t("noDeadline")}</div></CardContent></Card> })}</div>}
  </div>;
}
