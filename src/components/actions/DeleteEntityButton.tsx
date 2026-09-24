"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
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
import { LoadingOverlay } from "@/components/ui/loading-overlay";
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
        const { data: projects, error: projectLookupError } = await supabase
          .from("projects")
          .select("id")
          .eq("contact_id", id);
        if (projectLookupError) throw projectLookupError;
        const projectIds = (projects ?? []).map((project) => project.id);
        if (projectIds.length) {
          const { error: eventProjectError } = await supabase
            .from("events")
            .delete()
            .in("project_id", projectIds);
          if (eventProjectError) throw eventProjectError;
          const { error: taskProjectError } = await supabase
            .from("tasks")
            .delete()
            .in("project_id", projectIds);
          if (taskProjectError) throw taskProjectError;
        }
        const { error: eventContactError } = await supabase
          .from("events")
          .delete()
          .eq("contact_id", id);
        if (eventContactError) throw eventContactError;
        const { error: taskContactError } = await supabase
          .from("tasks")
          .delete()
          .eq("contact_id", id);
        if (taskContactError) throw taskContactError;
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
          <LoadingOverlay show={loading} label={t("deleting")} />

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
              {loading ? t("deleting") : t("delete")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
