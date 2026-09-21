"use client";

import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Settings,
  UsersRound,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

import { APP_NAME } from "@/constants/index";
import BrandLogo from "@/components/ui/BrandLogo";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/contacts", key: "contacts", icon: UsersRound },
  { href: "/deals", key: "deals", icon: BriefcaseBusiness },
  { href: "/projects", key: "projects", icon: FolderKanban },
  { href: "/invoices", key: "invoices", icon: FileText },
  { href: "/tasks", key: "tasks", icon: ListChecks },
  { href: "/calendar", key: "calendar", icon: CalendarDays },
  { href: "/analytics", key: "analytics", icon: BarChart3 },
  { href: "/reports", key: "reports", icon: FileCheck2 },
] as const;

export function Sidebar({ className }: { className?: string }) {
  const t = useTranslations("Navigation"),
    pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex w-58 shrink-0 flex-col border-e border-border/80 bg-background/90",
        className,
      )}
    >
      <div className="flex h-17 items-center border-b border-border/80 px-5">
        <Link
          href="/dashboard"
          className="flex items-center"
          aria-label="Nexus CRM"
        >
          <BrandLogo
            alt={`${APP_NAME} Logo`}
            width={148}
            height={44}
            priority
            className="w-37"
          />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1" aria-label={t("dashboard")}>
          {navItems.map(({ href, key, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-[0_10px_28px_rgb(47_57_169/0.22)]"
                    : "text-muted-foreground hover:bg-surface-light/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4.5 shrink-0" />
                <span className="truncate">{t(key)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="my-4 h-px bg-border/80" />
        <Link
          href="/settings"
          className={cn(
            "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-all",
            pathname.startsWith("/settings")
              ? "bg-primary text-primary-foreground shadow-[0_10px_28px_rgb(47_57_169/0.18)]"
              : "text-muted-foreground hover:bg-surface-light/70 hover:text-foreground",
          )}
        >
          <Settings className="size-4.5" />
          <span>{t("settings")}</span>
        </Link>
      </div>
    </aside>
  );
}
