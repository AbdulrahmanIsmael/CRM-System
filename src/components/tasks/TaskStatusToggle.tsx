"use client";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2,Circle } from "lucide-react";
export function TaskStatusToggle({id,status}:{id:string;status:string}){const t=useTranslations("Tasks"),supabase=createClient(),router=useRouter(),[loading,setLoading]=useState(false);async function toggle(){setLoading(true);const next=status==="done"?"todo":"done";const{error}=await supabase.from("tasks").update({status:next,completed_at:next==="done"?new Date().toISOString():null}).eq("id",id);if(error)toast.error(t("createError"));else router.refresh();setLoading(false)}return <Button type="button" variant="ghost" size="icon" disabled={loading} onClick={toggle} aria-label={status==="done"?t("statuses.todo"):t("completed")}>{status==="done"?<CheckCircle2 className="size-5 text-success"/>:<Circle className="size-5 text-muted-foreground"/>}</Button>}
