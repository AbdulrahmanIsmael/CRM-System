"use client";

import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function TaskStatusToggle({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const t = useTranslations("Tasks");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = status === "done" ? "todo" : "done";
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: next,
          completed_at: next === "done" ? new Date().toISOString() : null,
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={toggle}
      aria-label={status === "done" ? t("statuses.todo") : t("completed")}
    >
      {loading ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : status === "done" ? (
        <CheckCircle2 className="size-5 text-success" />
      ) : (
        <Circle className="size-5 text-muted-foreground" />
      )}
    </Button>
  );
}
