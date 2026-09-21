import { ArrowUpRight, CalendarDays, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, getContactDisplayName } from "@/lib/crm";
import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { ReportCreateDialog } from "@/components/reports/ReportCreateDialog";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ project?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Reports");
  const tn = await getTranslations("Navigation");
  const tc = await getTranslations("Common");
  const supabase = await createClient();
  const [{ data: reports }, { data: projects }] = await Promise.all([
    supabase
      .from("project_reports")
      .select(
        "id,title,project_id,created_at,updated_at,projects(name,contact_id,contacts(type,first_name,last_name,company_name))",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("projects")
      .select(
        "id,name,contact_id,contacts(type,first_name,last_name,company_name)",
      )
      .order("created_at", { ascending: false }),
  ]);
  const existing = new Set((reports ?? []).map((report) => report.project_id));

  type ContactDisplay = Parameters<typeof getContactDisplayName>[0];
  const getContact = (contacts: unknown): ContactDisplay | null => {
    if (Array.isArray(contacts)) {
      return (contacts[0] ?? null) as ContactDisplay | null;
    }

    return contacts as ContactDisplay | null;
  };

  const projectOptions = (projects ?? [])
    .filter((project) => !existing.has(project.id))
    .map((project) => {
      const contact = getContact(project.contacts) as
        | Parameters<typeof getContactDisplayName>[0]
        | null;
      return {
        id: project.id,
        label: `${project.name} — ${getContactDisplayName(contact ?? {})}`,
      };
    });
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
            {tn("reports")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <ReportCreateDialog
          projects={projectOptions}
          preselectedProjectId={params.project}
        />
      </div>
      {(reports ?? []).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-6" />
            </div>
            <h2 className="mt-4 font-semibold">{t("noReports")}</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {t("createDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {reports!.map((report) => {
            const project = Array.isArray(report.projects)
              ? report.projects[0]
              : report.projects;
            const contact = project ? getContact(project.contacts) : null;
            const client = contact
              ? getContactDisplayName(contact)
              : tc("unknown");
            return (
              <Card
                key={report.id}
                className="group overflow-hidden rounded-2xl border-border/80 bg-card/95 transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_50px_rgb(0_0_0/0.18)]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <FileText className="size-5" />
                    </div>
                    <Link
                      href={`/reports/${report.id}`}
                      className={buttonVariants({
                        variant: "ghost",
                        size: "icon-sm",
                        className:
                          "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                      })}
                      aria-label={t("openReport")}
                    >
                      <ArrowUpRight />
                    </Link>
                  </div>
                  <h2 className="mt-5 truncate text-base font-semibold">
                    {report.title}
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {project?.name} · {client}
                  </p>
                  <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDate(report.updated_at, locale)}
                    </span>
                    <Link
                      href={`/reports/${report.id}`}
                      className="font-semibold text-primary-light hover:text-primary"
                    >
                      {t("openReport")}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
