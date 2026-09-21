import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Globe, ArrowLeft, Edit } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, getContactDisplayName } from "@/lib/crm";
import { InvoiceCreateDialog } from "@/components/forms/InvoiceCreateDialog";
import { ContactEditDialog } from "@/components/forms/ContactEditDialog";
import { DeleteEntityButton } from "@/components/actions/DeleteEntityButton";

export default async function ContactDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = (await getLocale()) as "en" | "ar";
  const t = await getTranslations("Contacts");
  const tProjects = await getTranslations("Projects");
  const tInvoices = await getTranslations("Invoices");
  const tCommon = await getTranslations("Common");
  const supabase = await createClient();

  const [{ data: contact }, { data: deals }, { data: projects }, { data: invoices }, { data: communications }] = await Promise.all([
    supabase.from("contacts").select("id,type,status,first_name,last_name,company_name,email,phone,website,location,timezone,notes").eq("id", id).maybeSingle(),
    supabase.from("deals").select("id,title,value,currency,stage_id,deal_stages(name)").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name,status,budget,deadline").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("invoices").select("id,invoice_number,total,currency,status,due_date").eq("contact_id", id).order("created_at", { ascending: false }),
    supabase.from("communication_log").select("id,type,subject,content,date").eq("contact_id", id).order("date", { ascending: false }).limit(10),
  ]);

  if (!contact) notFound();
  const name = getContactDisplayName(contact) || tCommon("unknown");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/contacts" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground">
            {contact.type === "person" && contact.company_name ? contact.company_name : null}
            <Badge variant="outline" className="capitalize">{t(`types.${contact.type}`)}</Badge>
            <Badge variant={contact.status === "active" ? "default" : "secondary"} className={contact.status === "active" ? "bg-success text-black" : ""}>
              {t(`statuses.${contact.status}`)}
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2"><ContactEditDialog contact={contact} /><DeleteEntityButton entity="contact" id={contact.id} /></div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-2 gap-1 rounded-xl bg-surface/80 p-1.5 sm:grid-cols-4">
          <TabsTrigger value="overview" className="rounded-lg px-5 py-2.5">{t("overview")}</TabsTrigger>
          <TabsTrigger value="deals" className="rounded-lg px-5 py-2.5">{t("deals")}</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-lg px-5 py-2.5">{t("projects")}</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg px-5 py-2.5">{t("invoices")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("contactInfo")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {contact.email && <div className="flex items-center gap-3 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><a href={`mailto:${contact.email}`} className="text-primary hover:underline">{contact.email}</a></div>}
                {contact.phone && <div className="flex items-center gap-3 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{contact.phone}</span></div>}
                {contact.website && <div className="flex items-center gap-3 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /><a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{contact.website}</a></div>}
                {contact.location && <div className="flex items-center gap-3 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{contact.location}</span></div>}
                {contact.timezone && <div className="text-sm"><span className="text-muted-foreground">{t("timezone")}: </span>{contact.timezone}</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("notesTitle")}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{contact.notes || "—"}</p></CardContent>
            </Card>
          </div>

          {communications?.length ? (
            <Card>
              <CardHeader><CardTitle>{t("communicationHistory")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {communications.map((communication) => (
                  <div key={communication.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-medium">{communication.subject || tCommon("type")}</p>
                      <span className="text-xs text-muted-foreground">{formatDate(communication.date, locale)}</span>
                    </div>
                    {communication.content && <p className="mt-1 text-sm text-muted-foreground">{communication.content}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="deals">
          <Card>
            <CardHeader>
              <CardTitle>{t("linkedDeals")}</CardTitle>
              <CardDescription>{t("dealsDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {(deals ?? []).length ? (
                <div className="space-y-3">
                  {(deals ?? []).map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{(deal.deal_stages?.[0]?.name) || tCommon("none")}</p>
                      </div>
                      <span className="shrink-0 font-semibold text-primary">{formatCurrency(Number(deal.value || 0), deal.currency || "USD", locale)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">{t("noDeals")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <CardHeader><CardTitle>{t("linkedProjects")}</CardTitle></CardHeader>
            <CardContent>
              {(projects ?? []).length ? (
                <div className="space-y-3">
                  {(projects ?? []).map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0 hover:underline">
                      <div><p className="font-medium">{project.name}</p><p className="text-xs text-muted-foreground">{formatDate(project.deadline, locale)}</p></div>
                      <Badge variant="outline">{tProjects(`statuses.${project.status}`)}</Badge>
                    </Link>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">{t("noProjects")}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t("linkedInvoices")}</CardTitle>
              <InvoiceCreateDialog contacts={[{ id: contact.id, label: name }]} projects={(projects ?? []).map((project) => ({ id: project.id, label: project.name }))} />
            </CardHeader>
            <CardContent>
              {(invoices ?? []).length ? (
                <div className="space-y-3">
                  {(invoices ?? []).map((invoice) => (
                    <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                      <div><p className="font-medium">{invoice.invoice_number}</p><p className="text-xs text-muted-foreground">{formatDate(invoice.due_date, locale)}</p></div>
                      <div className="text-end"><p className="font-semibold">{formatCurrency(Number(invoice.total || 0), invoice.currency || "USD", locale)}</p><Badge variant="outline">{tInvoices(`status${invoice.status.charAt(0).toUpperCase()}${invoice.status.slice(1)}`)}</Badge></div>
                    </Link>
                  ))}
                </div>
              ) : <p className="py-8 text-center text-sm text-muted-foreground">{t("noInvoices")}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
