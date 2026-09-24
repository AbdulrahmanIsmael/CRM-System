"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  if (pageCount <= 1) return null;

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <nav
      aria-label={t("page")}
      className="flex items-center justify-between gap-4 pt-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
      >
        <ChevronRight className="rtl:hidden" />
        <ChevronLeft className="hidden rtl:block" />
        {t("previous")}
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t("page")} {page} {t("of")} {pageCount}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => goTo(page + 1)}
      >
        {t("next")}
        <ChevronLeft className="rtl:hidden" />
        <ChevronRight className="hidden rtl:block" />
      </Button>
    </nav>
  );
}
