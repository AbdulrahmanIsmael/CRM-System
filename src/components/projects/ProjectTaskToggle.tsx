"use client";

import { useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function ProjectTaskToggle({ id, done }: { id: string; done: boolean }) {
  const t = useTranslations("Tasks");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle(value: boolean) {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: value ? "done" : "todo",
          completed_at: value ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t("createError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Checkbox
      id={`project-task-${id}`}
      checked={done}
      disabled={loading}
      onCheckedChange={(value) => toggle(value === true)}
      aria-label={t("completed")}
    />
  );
}
