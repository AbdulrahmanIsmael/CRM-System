import { CalendarDays } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/crm";

export async function DashboardHeader({ userName }: { userName: string }) {
  const t = await getTranslations("Dashboard");
  const locale = (await getLocale()) as "en" | "ar";
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + 30);
  const greetings = Array.from({ length: 6 }, (_, index) => t(`greeting${index + 1}`, { name: userName }));
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-primary-light">{t("overview")}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
        <CalendarDays className="size-4 text-primary-light" />
        <span>{formatDate(now, locale)} – {formatDate(end, locale)}</span>
      </div>
    </div>
  );
}
