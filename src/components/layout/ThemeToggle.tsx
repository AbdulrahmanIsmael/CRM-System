"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("Navigation");

  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nexus-theme");
    const isDark = saved ? saved === "dark" : true;

    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    setDark((current) => {
      const next = !current;

      document.documentElement.classList.toggle("dark", next);
      window.localStorage.setItem("nexus-theme", next ? "dark" : "light");

      return next;
    });
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-10 rounded-xl"
        aria-hidden="true"
        tabIndex={-1}
      />
    );
  }

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
