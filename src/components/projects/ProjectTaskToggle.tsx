"use client";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ProjectTaskToggle({ id, done }: { id: string; done: boolean }) {
  const t = useTranslations("Tasks");
  const supabase = createClient();
  const [checked, setChecked] = useState(done);
  const [loading, setLoading] = useState(false);

  useEffect(() => setChecked(done), [done]);

  async function toggle() {
    const next = !checked;
    setLoading(true);
    const { error } = await supabase.from("tasks").update({
      status: next ? "done" : "todo",
      completed_at: next ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) {
      toast.error(t("createError"));
    } else {
      setChecked(next);
    }
    setLoading(false);
  }

  return <Checkbox id={`project-task-${id}`} checked={checked} disabled={loading} onCheckedChange={toggle} aria-label={t("completed")} />;
}
