import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectEditDialog } from "@/components/forms/ProjectEditDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { formatCurrency, formatDate, getContactDisplayName } from "@/lib/crm";
import { ProjectTaskToggle } from "@/components/projects/ProjectTaskToggle";
import { InvoiceCreateDialog } from "@/components/forms/InvoiceCreateDialog";
import { TaskEditDialog } from "@/components/forms/TaskEditDialog";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Projects");
  const tCommon = await getTranslations("Common");
  const tInvoices = await getTranslations("Invoices");
  const tTasks = await getTranslations("Tasks");
  const supabase = await createClient();

  const [{ data: project }, { data: tasks }, { data: invoices }, { data: contacts }, { data: deals }, { data: existingReport }] = await Promise.all([
    supabase.from("projects").select("id,name,description,status,start_date,deadline,budget,contact_id,deal_id,contacts(type,first_name,last_name,company_name),deals(title,currency)").eq("id", id).maybeSingle(),
    supabase.from("tasks").select("id,title,status,priority").eq("project_id", id).order("created_at"),
    supabase.from("invoices").select("id,invoice_number,total,currency,status,due_date").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active"),
    supabase.from("deals").select("id,title,contact_id").order("created_at", { ascending: false }),
    supabase.from("project_reports").select("id").eq("project_id", id).maybeSingle(),
  ]);

  if (!project) notFound();
  const contact = getContactDisplayName((Array.isArray(project.contacts) ? project.contacts[0] : project.contacts) || {}) || t("clientUnknown");
  const progress = tasks?.length ? Math.round((tasks.filter((task) => task.status === "done").length / tasks.length) * 100) : null;
  const contactOptions = (contacts ?? []).map((c) => ({ id: c.id, label: getContactDisplayName(c) })).filter((x) => x.label);
  const dealOptions = (deals ?? []).map((d) => ({ id: d.id, label: d.title }));
  const linkedDeal = Array.isArray(project.deals) ? project.deals[0] : project.deals;
  const currency = linkedDeal?.currency || "USD";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Link href={`/contacts/${project.contact_id}`} className="hover:underline">{contact}</Link>
            <Badge variant="secondary" className="capitalize">{t(`statuses.${project.status}`)}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2"><Link href={existingReport?.id ? `/reports/${existingReport.id}` : `/reports?project=${project.id}`} className={buttonVariants({variant:"outline",size:"sm"})}><FileText data-icon="inline-start"/>{t("report")}</Link><ProjectEditDialog project={{ id: project.id, name: project.name, contact_id: project.contact_id, deal_id: project.deal_id, description: project.description, status: project.status, start_date: project.start_date, deadline: project.deadline, budget: project.budget }} contacts={contactOptions} deals={dealOptions}/><DeleteEntityButton entity="project" id={project.id}/></div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("budget")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(Number(project.budget || 0), currency, locale)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("startDate")}</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-medium">{formatDate(project.start_date, locale)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("deadline")}</CardTitle></CardHeader>
          <CardContent><div className="text-xl font-medium text-warning">{formatDate(project.deadline, locale)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t("progress")}</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{progress === null ? "—" : `${progress}%`}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">{t("tasks")}</TabsTrigger>
          <TabsTrigger value="overview">{t("description")}</TabsTrigger>
          <TabsTrigger value="invoices">{t("relatedInvoices")}</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader><CardTitle>{t("tasks")}</CardTitle></CardHeader>
            <CardContent>
              {(tasks ?? []).length ? (
                <div className="space-y-4">
                  {(tasks ?? []).map((task) => (
                    <div key={task.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                      <ProjectTaskToggle id={task.id} done={task.status === "done"} />
                      <label htmlFor={task.id} className={`flex-1 text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </label>
                      <Badge variant={task.priority === "high" ? "destructive" : "secondary"}>{tTasks(`priorities.${task.priority}`)}</Badge>
                      <TaskEditDialog task={{ ...task, description: null, due_date: null, contact_id: project.contact_id, deal_id: project.deal_id, project_id: project.id }} contacts={contactOptions} deals={dealOptions} projects={[{ id: project.id, label: project.name }]} compact />
                      <DeleteEntityButton entity="task" id={task.id} />
                    </div>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">{t("noTasks")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview">
          <Card><CardContent className="pt-6"><p>{project.description || "—"}</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("relatedInvoices")}</CardTitle>
              <InvoiceCreateDialog contacts={[{ id: project.contact_id, label: contact }, ...contactOptions.filter((x) => x.id !== project.contact_id)]} projects={[{ id: project.id, label: project.name }]} />
            </CardHeader>
            <CardContent>
              {(invoices ?? []).length ? (
                <div className="space-y-3">
                  {(invoices ?? []).map((invoice) => (
                    <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div><p className="font-medium">{invoice.invoice_number}</p><p className="text-xs text-muted-foreground">{formatDate(invoice.due_date, locale)}</p></div>
                      <div className="text-end"><p className="font-semibold">{formatCurrency(Number(invoice.total || 0), invoice.currency || "USD", locale)}</p><Badge variant="outline">{tInvoices(`status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}</Badge></div>
                    </Link>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
