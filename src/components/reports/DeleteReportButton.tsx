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

import { Button } from "@/components/ui/button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const t = useTranslations("Reports");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function remove() {
    setLoading(true);
    try {
      const { data: sections, error: sectionError } = await supabase
        .from("report_sections")
        .select("id")
        .eq("report_id", reportId);
      if (sectionError) throw sectionError;
      const ids = (sections ?? []).map((section) => section.id);
      if (ids.length) {
        const { data: images, error: imageError } = await supabase
          .from("report_section_images")
          .select("storage_path")
          .in("report_section_id", ids);
        if (imageError) throw imageError;
        const paths = (images ?? [])
          .map((image) => image.storage_path)
          .filter(Boolean);
        if (paths.length) {
          const { error: storageError } = await supabase.storage
            .from("report-assets")
            .remove(paths);
          if (storageError) throw storageError;
        }
      }
      const { error } = await supabase
        .from("project_reports")
        .delete()
        .eq("id", reportId);
      if (error) throw error;
      toast.success(t("deleted"));
      setOpen(false);
      router.push("/reports");
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
            variant="destructive"
            size="icon-sm"
            aria-label={tc("delete")}
            title={tc("delete")}
          >
            <Trash2 />
          </Button>
        }
      />
      <DialogContent className="h-fit max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] overflow-y-auto sm:max-w-md">
        <LoadingOverlay show={loading} label={t("deleting")} />
        <DialogHeader>
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle>{t("deleteReportTitle")}</DialogTitle>
          <DialogDescription>{t("deleteReportDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {tc("cancel")}
          </Button>
          <Button variant="destructive" onClick={remove} disabled={loading}>
            {loading ? t("deleting") : tc("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
