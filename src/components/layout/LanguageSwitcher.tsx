"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LoaderCircle } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const switchLocale = (next: "en" | "ar") => {
    if (next !== locale) startTransition(() => router.replace(pathname, { locale: next }));
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="h-10 min-w-0 gap-1.5 rounded-xl px-1.5 sm:gap-2 sm:px-2.5"
            aria-label={t("language")}
            disabled={isPending}
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface-light/80 text-primary-light">
              {isPending ? <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" /> : <Image src={locale === "ar" ? "/assets/flags/eg.svg" : "/assets/flags/us.svg"} alt={locale === "ar" ? "العربية" : "English"} width={20} height={14} className="h-3.5 w-5 rounded-sm object-cover" />}
            </span>
            <span className="hidden text-sm font-medium sm:inline">
              {locale === "ar" ? t("arabic") : t("english")}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {locale.toUpperCase()}
            </span>
            <ChevronDown className="hidden size-3.5 text-muted-foreground sm:inline" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-52 rounded-2xl border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 py-2 text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
            {t("language")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => switchLocale("en")}
            className="h-11 rounded-xl px-3"
          >
            <Image
              src="/assets/flags/us.svg"
              alt="English"
              width={20}
              height={14}
              className="h-3.5 w-5 rounded-sm object-cover"
            />
            <span className="flex-1">{t("english")}</span>
            {locale === "en" && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchLocale("ar")}
            className="h-11 rounded-xl px-3"
          >
            <Image
              src="/assets/flags/eg.svg"
              alt="العربية"
              width={20}
              height={14}
              className="h-3.5 w-5 rounded-sm object-cover"
            />
            <span className="flex-1">{t("arabic")}</span>
            {locale === "ar" && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
