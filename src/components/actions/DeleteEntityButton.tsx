"use client";

import { AlertTriangle, Trash2, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Entity = "contact" | "deal" | "project" | "task" | "event" | "invoice";

export function DeleteEntityButton({
  entity,
  id,
  label,
  variant = "destructive",
}: {
  entity: Entity;
  id: string;
  label?: string;
  variant?: "destructive" | "ghost";
}) {
  const t = useTranslations("Common");
  const router = useRouter();
  const collectionPath: Record<
    Entity,
    "/contacts" | "/deals" | "/projects" | "/tasks" | "/calendar" | "/invoices"
  > = {
    contact: "/contacts",
    deal: "/deals",
    project: "/projects",
    task: "/tasks",
    event: "/calendar",
    invoice: "/invoices",
  };
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const target = t(
    entity === "contact"
      ? "contact"
      : entity === "deal"
        ? "deal"
        : entity === "project"
          ? "project"
          : entity === "task"
            ? "task"
            : entity === "event"
              ? "event"
              : "invoice",
  );

  async function remove() {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");

      if (entity === "contact") {
        // 1. Find all projects linked to this contact
        const { data: contactProjects, error: projectLookupError } =
          await supabase
            .from("projects")
            .select("id")
            .eq("contact_id", id);
        if (projectLookupError) throw projectLookupError;
        const projectIds = (contactProjects ?? []).map((p) => p.id);

        // 2. Delete tasks/events linked to those projects
        if (projectIds.length) {
          const { error: evtProjErr } = await supabase
            .from("events")
            .delete()
            .in("project_id", projectIds);
          if (evtProjErr) throw evtProjErr;

          const { error: taskProjErr } = await supabase
            .from("tasks")
            .delete()
            .in("project_id", projectIds);
          if (taskProjErr) throw taskProjErr;

          // 3. Delete invoices linked to those projects
          const { error: invProjErr } = await supabase
            .from("invoices")
            .delete()
            .in("project_id", projectIds);
          if (invProjErr) throw invProjErr;

          // 4. Delete the projects themselves
          const { error: projErr } = await supabase
            .from("projects")
            .delete()
            .in("id", projectIds);
          if (projErr) throw projErr;
        }

        // 5. Find all deals linked to this contact
        const { data: contactDeals, error: dealLookupError } = await supabase
          .from("deals")
          .select("id")
          .eq("contact_id", id);
        if (dealLookupError) throw dealLookupError;
        const dealIds = (contactDeals ?? []).map((d) => d.id);

        if (dealIds.length) {
          // 6. Delete tasks/events linked to those deals
          const { error: evtDealErr } = await supabase
            .from("events")
            .delete()
            .in("deal_id", dealIds);
          if (evtDealErr) throw evtDealErr;

          const { error: taskDealErr } = await supabase
            .from("tasks")
            .delete()
            .in("deal_id", dealIds);
          if (taskDealErr) throw taskDealErr;

          // 7. Delete the deals themselves
          const { error: dealErr } = await supabase
            .from("deals")
            .delete()
            .in("id", dealIds);
          if (dealErr) throw dealErr;
        }

        // 8. Delete contact-level tasks, events, invoices, communication_log
        const { error: evtContactErr } = await supabase
          .from("events")
          .delete()
          .eq("contact_id", id);
        if (evtContactErr) throw evtContactErr;

        const { error: taskContactErr } = await supabase
          .from("tasks")
          .delete()
          .eq("contact_id", id);
        if (taskContactErr) throw taskContactErr;

        const { error: invContactErr } = await supabase
          .from("invoices")
          .delete()
          .eq("contact_id", id);
        if (invContactErr) throw invContactErr;

        const { error: commContactErr } = await supabase
          .from("communication_log")
          .delete()
          .eq("contact_id", id);
        if (commContactErr) throw commContactErr;
      }

      if (entity === "deal") {
        // 1. Delete tasks and events directly linked to this deal
        const { error: evtDealErr } = await supabase
          .from("events")
          .delete()
          .eq("deal_id", id);
        if (evtDealErr) throw evtDealErr;

        const { error: taskDealErr } = await supabase
          .from("tasks")
          .delete()
          .eq("deal_id", id);
        if (taskDealErr) throw taskDealErr;

        // 2. Find projects exclusively linked to this deal (no other deal)
        const { data: dealProjects, error: dealProjLookupError } =
          await supabase
            .from("projects")
            .select("id")
            .eq("deal_id", id);
        if (dealProjLookupError) throw dealProjLookupError;
        const dealProjectIds = (dealProjects ?? []).map((p) => p.id);

        if (dealProjectIds.length) {
          // 3. Delete tasks/events/invoices tied to those projects
          const { error: evtProjErr } = await supabase
            .from("events")
            .delete()
            .in("project_id", dealProjectIds);
          if (evtProjErr) throw evtProjErr;

          const { error: taskProjErr } = await supabase
            .from("tasks")
            .delete()
            .in("project_id", dealProjectIds);
          if (taskProjErr) throw taskProjErr;

          const { error: invProjErr } = await supabase
            .from("invoices")
            .delete()
            .in("project_id", dealProjectIds);
          if (invProjErr) throw invProjErr;

          // 4. Delete those projects
          const { error: projErr } = await supabase
            .from("projects")
            .delete()
            .in("id", dealProjectIds);
          if (projErr) throw projErr;
        }
      }

      if (entity === "project") {
        const { error: eventError } = await supabase
          .from("events")
          .delete()
          .eq("project_id", id);
        if (eventError) throw eventError;
        const { error: taskError } = await supabase
          .from("tasks")
          .delete()
          .eq("project_id", id);
        if (taskError) throw taskError;
        const { error: invError } = await supabase
          .from("invoices")
          .delete()
          .eq("project_id", id);
        if (invError) throw invError;
      }

      const tableMap: Record<Entity, string> = {
        contact: "contacts",
        deal: "deals",
        project: "projects",
        task: "tasks",
        event: "events",
        invoice: "invoices",
      };
      const { error } = await supabase
        .from(tableMap[entity])
        .delete()
        .eq("id", id);
      if (error) throw error;
      if (entity !== "event") {
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "deleted",
          entity_type: entity,
          entity_id: id,
          description: null,
          metadata: { source: "delete" },
        });
      }
      toast.success(t("deleted"));
      setOpen(false);
      router.replace(collectionPath[entity]);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("deleteError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={variant === "ghost" ? "ghost" : "destructive"}
            size={label ? "sm" : "icon-sm"}
            aria-label={label || t("delete")}
          >
            {label ? <Trash2 data-icon="inline-start" /> : <Trash2 />}
            {label}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <div className="relative">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle className="size-5" />
            </div>

            <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>

            <DialogDescription>
              {t("deleteConfirmDescription", { entity: target })}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mx-0 mb-0 rounded-none border-t-0 bg-transparent p-0 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={loading}
              onClick={remove}
            >
              {loading && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
              {loading ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
