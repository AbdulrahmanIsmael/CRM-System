import { CalendarDays, Clock3, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, getContactDisplayName } from "@/lib/crm";
import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { EventFormDialog } from "@/components/forms/EventFormDialog";
import { RichTextContent } from "@/components/reports/RichTextContent";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ action?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Calendar");
  const tc = await getTranslations("Common");
  const supabase = await createClient();
  const now = new Date();
  const [
    { data: events },
    { data: tasks },
    { data: deals },
    { data: contacts },
    { data: projects },
  ] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id,title,type,start_time,end_time,description,contact_id,deal_id,project_id,all_day",
      )
      .order("start_time", { ascending: false })
      .limit(100),
    supabase
      .from("tasks")
      .select("id,title,due_date,contact_id,project_id,deal_id")
      .neq("status", "done")
      .order("due_date", { ascending: false })
      .limit(100),
    supabase
      .from("deals")
      .select("id,title,expected_close_date,contact_id")
      .not("expected_close_date", "is", null)
      .order("expected_close_date")
      .limit(50),
    supabase
      .from("contacts")
      .select("id,type,first_name,last_name,company_name")
      .eq("status", "active"),
    supabase.from("projects").select("id,name"),
  ]);
  const contactOptions = (contacts ?? [])
    .map((c) => ({ id: c.id, label: getContactDisplayName(c) }))
    .filter((x) => x.label);
  const projectOptions = (projects ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }));
  const dealOptions = (deals ?? []).map((d) => ({ id: d.id, label: d.title }));
  const contactById = new Map(
    (contacts ?? []).map((c) => [c.id, getContactDisplayName(c)]),
  );
  const projectById = new Map((projects ?? []).map((p) => [p.id, p.name]));
  const eventRows = (events ?? []).map((event) => ({
    kind: "event" as const,
    id: event.id,
    title: event.title,
    type: event.type,
    start: event.start_time,
    description: event.description,
    context:
      contactById.get(event.contact_id) ||
      projectById.get(event.project_id) ||
      null,
    event,
  }));
  const otherRows = [
    ...(tasks ?? [])
      .filter((t) => t.due_date)
      .map((task) => ({
        kind: "derived" as const,
        id: `task-${task.id}`,
        title: task.title,
        type: "deadline",
        start: task.due_date!,
        description: null,
        context:
          projectById.get(task.project_id) ||
          contactById.get(task.contact_id) ||
          null,
      })),
    ...(deals ?? []).map((deal) => ({
      kind: "derived" as const,
      id: `deal-${deal.id}`,
      title: deal.title,
      type: "deadline",
      start: `${deal.expected_close_date}T00:00:00`,
      description: null,
      context: contactById.get(deal.contact_id) || null,
    })),
  ];
  const rows = [...eventRows, ...otherRows].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const upcomingRows = rows
    .filter((row) => new Date(row.start).getTime() >= now.getTime())
    .slice(0, 50);

  const pastRows = rows
    .filter((row) => new Date(row.start).getTime() < now.getTime())
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
    .slice(0, 30);
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-light">
            Nexus CRM
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <EventFormDialog
          contacts={contactOptions}
          projects={projectOptions}
          deals={dealOptions}
          autoOpen={params.action === "new"}
        />
      </div>
      <div className="space-y-4">
        {/* Upcoming */}
        <Card className="overflow-hidden rounded-2xl border-border/80 bg-card/95">
          <CardHeader className="border-b border-border/70 bg-muted/10">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary-light" />
              {tc("upcoming")}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {upcomingRows.length ? (
              <div className="divide-y divide-border">
                {upcomingRows.map((row) => (
                  <div
                    key={row.id}
                    className="group grid gap-4 p-5 transition-colors hover:bg-muted/20 md:grid-cols-[170px_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="size-4 shrink-0 text-primary-light" />
                      {formatDateTime(row.start, locale)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {row.title}
                      </p>

                      {row.description && (
                        <RichTextContent
                          value={row.description}
                          className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                        />
                      )}

                      {row.context && (
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {row.context}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 md:justify-end">
                      <Badge
                        variant="outline"
                        className={cn(
                          row.type === "meeting" &&
                            "border-accent/30 bg-accent/5 text-accent-light",
                          row.type === "deadline" &&
                            "border-warning/30 bg-warning/5 text-warning",
                        )}
                      >
                        {t(row.type)}
                      </Badge>

                      {row.kind === "event" && (
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                          <EventFormDialog
                            event={row.event}
                            contacts={contactOptions}
                            deals={dealOptions}
                            projects={projectOptions}
                            compact
                          />
                          <DeleteEntityButton entity="event" id={row.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {t("noEvents")}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        {pastRows.length > 0 && (
          <Card className="overflow-hidden rounded-2xl border-border/60 bg-card/80">
            <CardHeader className="border-b border-border/60 bg-muted/5">
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                <History className="size-4" />
                {t("past")}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y divide-border/70">
                {pastRows.map((row) => (
                  <div
                    key={row.id}
                    className="group grid gap-4 bg-muted/5 p-5 transition-colors hover:bg-muted/10 md:grid-cols-[170px_minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock3 className="size-4 shrink-0 text-muted-foreground/70" />
                      {formatDateTime(row.start, locale)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-muted-foreground">
                        {row.title}
                      </p>

                      {row.description && (
                        <RichTextContent
                          value={row.description}
                          className="mt-1 line-clamp-2 text-xs text-muted-foreground/80"
                        />
                      )}

                      {row.context && (
                        <p className="mt-1 truncate text-xs text-muted-foreground/80">
                          {row.context}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 md:justify-end">
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/30 text-muted-foreground"
                      >
                        {t(row.type)}
                      </Badge>

                      {row.kind === "event" && (
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                          <EventFormDialog
                            event={row.event}
                            contacts={contactOptions}
                            deals={dealOptions}
                            projects={projectOptions}
                            compact
                          />

                          <DeleteEntityButton entity="event" id={row.id} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
