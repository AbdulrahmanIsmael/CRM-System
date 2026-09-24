"use client";

import {
  BriefcaseBusiness,
  CalendarDays,
  Command,
  FileText,
  FolderKanban,
  ListChecks,
  MessageCircle,
  Search,
  UsersRound,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { sanitizeSearchTerm } from "@/lib/crm";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type GroupKey =
  | "contacts"
  | "deals"
  | "projects"
  | "invoices"
  | "tasks"
  | "events"
  | "communications";
type SearchResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  href: string;
};
type Group = {
  key: GroupKey;
  icon: React.ComponentType<{ className?: string }>;
  results: SearchResult[];
};
export function GlobalSearch() {
  const t = useTranslations("GlobalSearch"),
    nav = useTranslations("Navigation"),
    supabase = useMemo(() => createClient(), []),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [term, setTerm] = useState(""),
    [loading, setLoading] = useState(false),
    [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!open || !term.trim()) {
      return;
    }

    const handle = window.setTimeout(async () => {
      const q = sanitizeSearchTerm(term);

      if (!q) {
        return;
      }

      setLoading(true);

      const like = `%${q}%`;
      const [
        contacts,
        deals,
        projects,
        invoices,
        tasks,
        events,
        communications,
      ] = await Promise.all([
        supabase
          .from("contacts")
          .select("id,first_name,last_name,company_name,email,type")
          .or(
            `first_name.ilike.${like},last_name.ilike.${like},company_name.ilike.${like},email.ilike.${like}`,
          )
          .limit(6),
        supabase
          .from("deals")
          .select("id,title,value,currency,notes")
          .or(`title.ilike.${like},notes.ilike.${like}`)
          .limit(6),
        supabase
          .from("projects")
          .select("id,name,description,budget")
          .or(`name.ilike.${like},description.ilike.${like}`)
          .limit(6),
        supabase
          .from("invoices")
          .select("id,invoice_number,total,currency,notes")
          .or(`invoice_number.ilike.${like},notes.ilike.${like}`)
          .limit(6),
        supabase
          .from("tasks")
          .select("id,title,description,status")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(6),
        supabase
          .from("events")
          .select("id,title,description,start_time")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(6),
        supabase
          .from("communication_log")
          .select("id,subject,content,date,contact_id")
          .or(`subject.ilike.${like},content.ilike.${like}`)
          .limit(6),
      ]);
      const next: Group[] = [];
      if (contacts.data?.length)
        next.push({
          key: "contacts",
          icon: UsersRound,
          results: contacts.data.map((x) => ({
            id: x.id,
            title:
              x.type === "company"
                ? x.company_name || ""
                : `${x.first_name || ""} ${x.last_name || ""}`.trim(),
            subtitle: x.email,
            href: `/contacts/${x.id}`,
          })),
        });
      if (deals.data?.length)
        next.push({
          key: "deals",
          icon: BriefcaseBusiness,
          results: deals.data.map((x) => ({
            id: x.id,
            title: x.title,
            subtitle: `${x.value} ${x.currency}`,
            href: "/deals",
          })),
        });
      if (projects.data?.length)
        next.push({
          key: "projects",
          icon: FolderKanban,
          results: projects.data.map((x) => ({
            id: x.id,
            title: x.name,
            subtitle: x.description,
            href: `/projects/${x.id}`,
          })),
        });
      if (invoices.data?.length)
        next.push({
          key: "invoices",
          icon: FileText,
          results: invoices.data.map((x) => ({
            id: x.id,
            title: x.invoice_number,
            subtitle: `${x.total} ${x.currency}`,
            href: `/invoices/${x.id}`,
          })),
        });
      if (tasks.data?.length)
        next.push({
          key: "tasks",
          icon: ListChecks,
          results: tasks.data.map((x) => ({
            id: x.id,
            title: x.title,
            subtitle: x.description,
            href: "/tasks",
          })),
        });
      if (events.data?.length)
        next.push({
          key: "events",
          icon: CalendarDays,
          results: events.data.map((x) => ({
            id: x.id,
            title: x.title,
            subtitle: x.start_time,
            href: "/calendar",
          })),
        });
      if (communications.data?.length)
        next.push({
          key: "communications",
          icon: MessageCircle,
          results: communications.data.map((x) => ({
            id: x.id,
            title: x.subject || t("communications"),
            subtitle: x.content,
            href: x.contact_id ? `/contacts/${x.contact_id}` : "/contacts",
          })),
        });
      setGroups(next);
      setLoading(false);
    }, 220);
    return () => window.clearTimeout(handle);
  }, [open, term, supabase, t]);
  const hasValidSearch = open && Boolean(sanitizeSearchTerm(term));

  const visibleGroups = hasValidSearch ? groups : [];

  const total = visibleGroups.reduce((sum, g) => sum + g.results.length, 0);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-surface/70 px-3.5 text-start text-sm text-muted-foreground shadow-sm transition-all hover:border-border-light hover:bg-surface-light/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label={nav("openSearch")}
      >
        <Search className="size-4.5 shrink-0" />
        <span className="hidden min-w-0 flex-1 truncate sm:block">
          {nav("searchPlaceholder")}
        </span>
        <kbd className="hidden items-center gap-1 rounded-md border border-border-light bg-background/80 px-2 py-1 font-mono text-[10px] text-text-secondary sm:inline-flex">
          <Command className="size-3" />K
        </kbd>
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);

          if (!value) {
            setTerm("");
            setGroups([]);
            setLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="border-b border-border bg-surface/70 p-6 pb-5">
            <DialogTitle className="text-lg">{t("title")}</DialogTitle>
            <DialogDescription>{t("hint")}</DialogDescription>
            <div className="relative mt-3">
              <Search className="absolute inset-s-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={t("placeholder")}
                className="h-14 rounded-2xl bg-background pe-4 ps-11 text-[15px] shadow-lg"
              />
            </div>
          </DialogHeader>
          <div className="max-h-[76vh] overflow-y-auto p-4 sm:p-5">
            {!term.trim() ? (
              <div className="flex min-h-60 flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Search className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("startTyping")}
                </p>
              </div>
            ) : loading ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
                {t("searching")}
              </div>
            ) : total === 0 ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-muted-foreground">
                {t("noResults")}
              </div>
            ) : (
              <div className="space-y-6">
                {visibleGroups.map((group) => (
                  <section key={group.key}>
                    <div className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <group.icon className="size-3.5" />
                      <span>{t(group.key)}</span>
                      <span className="ms-auto rounded-full bg-muted px-2 py-0.5 font-mono text-[10px]">
                        {group.results.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.results.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setTerm("");
                            router.push(result.href);
                          }}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-start transition-all hover:border-border hover:bg-muted/55"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <group.icon className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {result.title}
                            </span>
                            {result.subtitle && (
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
