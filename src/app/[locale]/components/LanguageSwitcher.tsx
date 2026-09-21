"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = locale === "en" ? "ar" : "en";
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      dir="ltr"
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-hover transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4 text-text-secondary" />
      {locale === "en" ? (
        <span className="flex items-center gap-2">
          <span>🇺🇸</span> EN
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <span>🇸🇦</span> AR
        </span>
      )}
    </button>
  );
}
