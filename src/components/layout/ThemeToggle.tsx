"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

const getTheme = () => {
  if (typeof document === "undefined") {
    return "dark";
  }

  const match = document.cookie.match(/(?:^|;\s*)nexus-theme=(dark|light)/);

  return match?.[1] === "light" ? "light" : "dark";
};

const getServerTheme = () => "dark";

const subscribe = (callback: () => void) => {
  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener("nexus-theme-change", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener("nexus-theme-change", handleChange);
  };
};

export function ThemeToggle() {
  const t = useTranslations("Navigation");
  const locale = useLocale();

  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const dark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark, locale]);

  const toggle = () => {
    const next = dark ? "light" : "dark";

    document.cookie = `nexus-theme=${next}; path=/; max-age=31536000; samesite=lax`;

    document.documentElement.classList.toggle("dark", next === "dark");

    window.dispatchEvent(new Event("nexus-theme-change"));
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-10 rounded-xl"
      onClick={toggle}
      aria-label={`${t("theme")}: ${dark ? t("light") : t("dark")}`}
      title={`${t("theme")}: ${dark ? t("light") : t("dark")}`}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
