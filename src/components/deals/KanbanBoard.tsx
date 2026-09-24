"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarDays, DollarSign } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/crm";
import { DealFormDialog } from "@/components/forms/DealFormDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

type Stage = { id: string; name: string; position: number; color: string | null; is_won: boolean; is_lost: boolean };
type Deal = { id: string; title: string; value: number; currency: string; priority: string; expected_close_date: string | null; contactName: string; stageId: string; contact_id: string; notes: string | null };

export function KanbanBoard() {
  const t = useTranslations("Deals");
  const stageLabel = (name: string) => {
    switch (name) {
      case "Lead": return t("stages.lead");
      case "Contacted": return t("stages.contacted");
      case "Proposal Sent": return t("stages.proposalSent");
      case "Negotiation": return t("stages.negotiation");
      case "Won": return t("stages.won");
      case "Lost": return t("stages.lost");
      default: return name;
    }
  };
  const tc = useTranslations("Common");
  const locale = useLocale() as "en" | "ar";
  const supabase = useMemo(() => createClient(), []);
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: stageData, error: stageError }, { data: dealData, error: dealError }, { data: contactData, error: contactError }] = await Promise.all([
        supabase.from("deal_stages").select("id,name,position,color,is_won,is_lost").order("position"),
        supabase.from("deals").select("id,title,value,currency,priority,expected_close_date,stage_id,contact_id,notes,contacts(type,first_name,last_name,company_name)").order("created_at", { ascending: false }),
        supabase.from("contacts").select("id,type,first_name,last_name,company_name").eq("status", "active").order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      if (stageError || dealError || contactError) {
        toast.error(tc("retry"));
        setLoading(false);
        return;
      }
      setStages((stageData ?? []) as Stage[]);
      setContacts((contactData ?? []).map((contact) => ({ id: contact.id, label: contact.type === "company" ? contact.company_name || "" : `${contact.first_name || ""} ${contact.last_name || ""}`.trim() })).filter((x) => x.label));
      setDeals((dealData ?? []).map((deal) => {
        const contact = Array.isArray(deal.contacts) ? deal.contacts[0] : deal.contacts;
        return {
          id: deal.id,
          title: deal.title,
          value: Number(deal.value || 0),
          currency: deal.currency || "USD",
          priority: deal.priority,
          expected_close_date: deal.expected_close_date,
          stageId: deal.stage_id,
          contactName: contact?.type === "company" ? contact?.company_name || "" : `${contact?.first_name || ""} ${contact?.last_name || ""}`.trim(),
          contact_id: deal.contact_id,
          notes: deal.notes,
        };
      }));
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [supabase, tc]);

  async function move(result: DropResult) {
    if (!result.destination) return;
    if (result.destination.droppableId === result.source.droppableId) return;

    const id = result.draggableId;
    const nextStage = stages.find((stage) => stage.id === result.destination?.droppableId);
    const previous = deals.find((deal) => deal.id === id);
    if (!nextStage || !previous) return;

    setDeals((current) => current.map((deal) => deal.id === id ? { ...deal, stageId: nextStage.id } : deal));
    setMoving(true);

    const { error } = await supabase
      .from("deals")
      .update({
        stage_id: nextStage.id,
        won_at: nextStage.is_won ? new Date().toISOString() : null,
        lost_at: nextStage.is_lost ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      setDeals((current) => current.map((deal) => deal.id === id ? previous : deal));
      toast.error(t("moveError"));
      setMoving(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase.from("activity_log").insert({
        user_id: auth.user.id,
        action: "stage_changed",
        entity_type: "deal",
        entity_id: id,
        description: null,
        metadata: { from_stage: previous.stageId, to_stage: nextStage.id },
      });
    }

    toast.success(nextStage.is_won ? t("wonPrompt") : t("moved"));
    setMoving(false);
  }

  if (loading) {
    return <div className="rounded-md border border-border bg-card p-8 text-sm text-muted-foreground">{tc("loading")}</div>;
  }

  return (
    <DragDropContext onDragEnd={move}>
      <div className="relative">
        <LoadingOverlay show={moving} label={tc("saving")} />
      <div className="flex min-h-0 h-[calc(100vh-12rem)] gap-4 overflow-x-auto overflow-y-hidden pb-4">
        {stages.map((stage) => {
          const stageDeals = deals.filter((deal) => deal.stageId === stage.id);
          return (
            <div key={stage.id} className="flex min-h-0 w-80 shrink-0 flex-col overflow-hidden">
              <div className="mb-3 flex items-center justify-between rounded-xl border border-border/70 bg-surface/60 px-3 py-2">
                <h3 className="flex items-center gap-2 font-semibold">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || "#94A3B8" }} />
                  {stageLabel(stage.name)}
                </h3>
                <Badge variant="secondary">{stageDeals.length}</Badge>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-border/80 p-2 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : "bg-card/70"}`}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable key={deal.id} draggableId={deal.id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`group mb-3 cursor-grab last:mb-0 rounded-2xl border-border/80 bg-card/95 transition-all hover:border-primary/30 hover:shadow-lg ${snapshot.isDragging ? "opacity-70 shadow-xl" : ""}`}
                          >
                            <CardHeader {...provided.dragHandleProps} className="cursor-grab p-4 pb-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium leading-tight">{deal.title}</h4>
                                {deal.priority === "high" || deal.priority === "urgent" ? (
                                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">{t(`priorities.${deal.priority}`)}</Badge>
                                ) : null}
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-1">
                              <div className="mb-3 flex items-center justify-between gap-2"><p className="truncate text-xs text-muted-foreground">{deal.contactName || tc("unknown")}</p><div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100"><DealFormDialog deal={{...deal,contact_id:deal.contact_id,stage_id:deal.stageId}} contacts={contacts} stages={stages.map(s=>({id:s.id,label:s.name}))} compact/><DeleteEntityButton entity="deal" id={deal.id}/></div></div>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center font-medium text-primary">
                                  <DollarSign className="me-0.5 h-3 w-3" />
                                  {formatCurrency(deal.value, deal.currency, locale)}
                                </span>
                                {deal.expected_close_date ? (
                                  <span className="flex items-center">
                                    <CalendarDays className="me-1 h-3 w-3" />
                                    {formatDate(deal.expected_close_date, locale, { year: undefined })}
                                  </span>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
      </div>
    </DragDropContext>
  );
}
