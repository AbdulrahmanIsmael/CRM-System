"use client";

import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function InvoiceStatusActions({
  invoiceId,
  status,
  compact = false,
}: {
  invoiceId: string;
  status: string;
  compact?: boolean;
}) {
  const t = useTranslations("Common");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  async function updateStatus(nextStatus: "sent" | "paid") {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({
          status: nextStatus,
          paid_at: nextStatus === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", invoiceId);
      if (error) throw error;
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user)
        await supabase.from("activity_log").insert({
          user_id: auth.user.id,
          action: "status_changed",
          entity_type: "invoice",
          entity_id: invoiceId,
          description: null,
          metadata: { status: nextStatus },
        });
      toast.success(nextStatus === "paid" ? t("markPaid") : t("markSent"));
      router.replace(pathname);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {(status === "draft" || status === "overdue") && (
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "default"}
          disabled={loading}
          onClick={() => updateStatus("sent")}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <Send data-icon="inline-start" />
          )}
          {t("markSent")}
        </Button>
      )}
      {status === "sent" || status === "overdue" ? (
        <Button
          type="button"
          size={compact ? "sm" : "default"}
          disabled={loading}
          onClick={() => updateStatus("paid")}
        >
          {loading ? (
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
          ) : (
            <CheckCircle2 data-icon="inline-start" />
          )}
          {t("markPaid")}
        </Button>
      ) : null}
    </div>
  );
}
