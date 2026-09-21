"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReportCreateDialog({ projects, preselectedProjectId }: { projects: { id: string; label: string }[]; preselectedProjectId?: string }) {
  const t = useTranslations("Reports");
  const tc = useTranslations("Common");
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState(preselectedProjectId ?? projects[0]?.id ?? "");
  const [loading, setLoading] = useState(false);

  async function createReport(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("UNAUTHORIZED");
      const project = projects.find((item) => item.id === projectId);
      if (!project) throw new Error("PROJECT_NOT_FOUND");
      const { data, error } = await supabase.from("project_reports").insert({
        user_id: auth.user.id,
        project_id: project.id,
        title: `${t("defaultTitle")} — ${project.label}`,
      }).select("id").single();
      if (error) {
        if (error.code === "23505") throw new Error("REPORT_EXISTS");
        throw error;
      }
      const firstSectionId = crypto.randomUUID();
      const { error: sectionError } = await supabase.from("report_sections").insert({ id: firstSectionId, report_id: data.id, user_id: auth.user.id, title: t("defaultSection"), content_html: "", position: 0 });
      if (sectionError) {
        await supabase.from("project_reports").delete().eq("id", data.id);
        throw sectionError;
      }
      toast.success(t("created"));
      setOpen(false);
      router.push(`/reports/${data.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error && error.message === "REPORT_EXISTS" ? t("alreadyExists") : t("createError"));
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg"><Plus data-icon="inline-start" />{t("createReport")}</Button>} />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader><DialogTitle>{t("createReport")}</DialogTitle><DialogDescription>{t("createDescription")}</DialogDescription></DialogHeader>
        <form onSubmit={createReport} className="space-y-5">
          <label className="space-y-2.5 text-sm"><span>{t("selectProject")}</span><Select value={projectId} items={projects.map((item) => ({ value: item.id, label: item.label }))} onValueChange={(value) => setProjectId(String(value))}><SelectTrigger className="w-full"><SelectValue placeholder={t("selectProject")} /></SelectTrigger><SelectContent>{projects.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></label>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>{tc("cancel")}</Button><Button type="submit" disabled={loading || !projectId}>{loading ? tc("saving") : tc("create")}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
