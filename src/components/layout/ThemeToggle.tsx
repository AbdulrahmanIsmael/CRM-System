"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const getTheme = () => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem("nexus-theme") === "light"
    ? "light"
    : "dark";
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
  const theme = useSyncExternalStore(subscribe, getTheme, getServerTheme);

  const dark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => {
    const next = dark ? "light" : "dark";

    window.localStorage.setItem("nexus-theme", next);
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
