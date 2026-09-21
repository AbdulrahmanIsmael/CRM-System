import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactRound, FilePlus2, FolderPlus, ListPlus, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function QuickActions() {
  const t = useTranslations("Dashboard");
  const actions = [
    { label: t("newClient"), href: "/contacts?action=new", icon: ContactRound, tone: "bg-primary/10 text-primary-light" },
    { label: t("newDeal"), href: "/deals?action=new", icon: ListPlus, tone: "bg-accent/10 text-accent-light" },
    { label: t("newProject"), href: "/projects?action=new", icon: FolderPlus, tone: "bg-secondary/10 text-secondary-light" },
    { label: t("newInvoice"), href: "/invoices?action=new", icon: FilePlus2, tone: "bg-success/10 text-success" },
  ];

  return (
    <Card className="h-full min-h-[320px] overflow-hidden rounded-2xl border-border/80 bg-card/95 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{t("quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="grid flex-1 grid-cols-2 gap-3 pb-5">
        {actions.map(({ label, href, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-border/80 bg-surface/45 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-light/60 hover:shadow-[0_14px_34px_rgb(0_0_0_/_0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="size-5" />
            </span>
            <span className="flex items-center justify-between gap-2 text-start text-sm font-semibold text-foreground">
              <span>{label}</span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
