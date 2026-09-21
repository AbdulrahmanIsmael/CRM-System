import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useLocale,useTranslations } from "next-intl";
export interface PipelineStageData{id:string;name:string;color:string|null;count:number;value:number;currency?:string}
export function SalesPipeline({stages}:{stages:PipelineStageData[]}){const t=useTranslations("Dashboard");const locale=useLocale() as "en"|"ar";const stageLabel = (name: string) => {
    switch (name) {
      case "Lead": return t("stages.lead");
      case "Contacted": return t("stages.contacted");
      case "Proposal Sent": return t("stages.proposalSent");
      case "Negotiation": return t("stages.negotiation");
      case "Won": return t("stages.won");
      case "Lost": return t("stages.lost");
      default: return name;
    }
  };return <Card className="h-full rounded-2xl"><CardHeader className="pb-2"><CardTitle className="text-sm">{t("salesPipeline")}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{t("dealStages")}</p></CardHeader><CardContent>{stages.length===0?<div className="py-12 text-center text-sm text-muted-foreground">{t("noPipelineData")}</div>:<div className="space-y-2">{stages.map(s=><div key={s.id} className="flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 hover:border-border hover:bg-muted/40"><span className="size-2.5 shrink-0 rounded-full" style={{backgroundColor:s.color||"var(--color-text-muted)"}}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{stageLabel(s.name)}</p><p className="text-xs text-muted-foreground">{t("dealCount",{count:s.count})}</p></div><span className="text-xs font-semibold text-muted-foreground">{new Intl.NumberFormat(locale==="ar"?"ar-EG":"en-US", { style: "currency", currency: s.currency || "USD", maximumFractionDigits: 0 }).format(s.value)}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"/></div>)}</div>}</CardContent></Card>}
