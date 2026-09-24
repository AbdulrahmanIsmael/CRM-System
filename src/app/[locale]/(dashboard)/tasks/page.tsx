import { Card, CardContent } from "@/components/ui/card";
import { Clock, ListChecks } from "lucide-react";
import {
  formatDateTime,
  getContactDisplayName,
  sanitizeSearchTerm,
} from "@/lib/crm";
import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { LiveSearchInput } from "@/components/search/LiveSearchInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/layout/Pagination";
import { TaskFormDialog } from "@/components/forms/TaskFormDialog";
import { TaskStatusToggle } from "@/components/tasks/TaskStatusToggle";
import { createClient } from "@/lib/supabase/server";

export default async function TasksPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string; q?: string; page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Tasks");
  const tn = await getTranslations("Navigation");
  const supabase = await createClient();
  const q = params.q ? sanitizeSearchTerm(params.q) : "";

  let taskQuery = supabase
    .from("tasks")
    .select(
      "id,title,description,status,priority,due_date,project_id,contact_id,deal_id,projects(name),contacts(type,first_name,last_name,company_name),deals(title)",
      { count: "exact" },
    )
    .order("status")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (q)
    taskQuery = taskQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  taskQuery = taskQuery.range(from, to);

  const [
    { data: tasks, count },
    { data: contacts },
    { data: deals },
    { data: projects },
  ] = await Promise.all([
    taskQuery,
    supabase
      .from("contacts")
      .select("id,type,first_name,last_name,company_name")
      .eq("status", "active"),
    supabase
      .from("deals")
      .select("id,title")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id,name")
      .order("created_at", { ascending: false }),
  ]);

  const contactOptions = (contacts ?? [])
    .map((c) => ({ id: c.id, label: getContactDisplayName(c) }))
    .filter((x) => x.label);
  const dealOptions = (deals ?? []).map((d) => ({ id: d.id, label: d.title }));
  const projectOptions = (projects ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }));

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title={tn("tasks")}
        subtitle={t("subtitle")}
        action={
          <TaskFormDialog
            contacts={contactOptions}
            deals={dealOptions}
            projects={projectOptions}
            autoOpen={params.action === "new"}
          />
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <LiveSearchInput
          key={q}
          value={q}
          placeholder={t("searchPlaceholder")}
          ariaLabel={t("searchPlaceholder")}
        />
        <div className="flex items-center rounded-2xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground">
          <ListChecks className="me-2 size-4 text-primary-light" />
          {tn("tasks")}
        </div>
      </div>

      <div className="space-y-3">
        {(tasks ?? []).length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ListChecks className="size-6" />
              </div>
              <h2 className="mt-4 font-semibold">{t("noTasks")}</h2>
            </CardContent>
          </Card>
        ) : (
          (tasks ?? []).map((task) => {
            const overdue = Boolean(
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              task.status !== "done",
            );
            const contact = Array.isArray(task.contacts)
              ? task.contacts[0]
              : task.contacts;
            const project = Array.isArray(task.projects)
              ? task.projects[0]
              : task.projects;
            const deal = Array.isArray(task.deals) ? task.deals[0] : task.deals;
            const related =
              project?.name ||
              getContactDisplayName(contact || {}) ||
              deal?.title;

            return (
              <Card
                key={task.id}
                className={`group rounded-2xl border-border/80 bg-card/95 transition-all hover:border-primary/25 ${task.status === "done" ? "opacity-65" : ""}`}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <TaskStatusToggle id={task.id} status={task.status} />
                      <div className="min-w-0">
                        <p
                          className={`truncate font-medium ${task.status === "done" ? "line-through" : ""}`}
                        >
                          {task.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {task.due_date ? (
                            <>
                              <span>{t("due")}</span>
                              <span
                                className={overdue ? "text-danger" : undefined}
                              >
                                {overdue
                                  ? t("overdue")
                                  : formatDateTime(task.due_date, locale)}
                              </span>
                            </>
                          ) : (
                            t("dueDate")
                          )}
                        </p>
                        {related && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {related}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Badge
                        variant={
                          task.priority === "urgent"
                            ? "destructive"
                            : task.priority === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {t(`priorities.${task.priority}`)}
                      </Badge>
                      <Badge variant="outline">
                        {t(`statuses.${task.status}`)}
                      </Badge>
                      {/* Always visible on mobile, hover-reveal on md+ */}
                      <div className="flex items-center gap-1 row-actions">
                        <TaskFormDialog
                          task={task}
                          contacts={contactOptions}
                          deals={dealOptions}
                          projects={projectOptions}
                          compact
                        />
                        <DeleteEntityButton entity="task" id={task.id} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      {(tasks ?? []).length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={count ?? 0} />
      )}
    </div>
  );
}
