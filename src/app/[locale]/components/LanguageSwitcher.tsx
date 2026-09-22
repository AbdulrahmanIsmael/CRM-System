"use client";

import { usePathname, useRouter } from "@/i18n/navigation";

import Image from "next/image";
import { useLocale } from "next-intl";
import { useTransition } from "react";

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
      {locale === "en" ? (
        <span className="flex items-center gap-2">
          <Image
            src="/assets/flags/eg.svg"
            alt="العربية"
            width={20}
            height={14}
            className="h-3.5 w-5 rounded-sm object-cover"
          />
          Arabic
        </span>
      ) : (
        <span className="flex items-center gap-2">
          <Image
            src="/assets/flags/us.svg"
            alt="English"
            width={20}
            height={14}
            className="h-3.5 w-5 rounded-sm object-cover"
          />
          English
        </span>
      )}
    </button>
  );
}
