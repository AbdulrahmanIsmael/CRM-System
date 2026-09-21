"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const t = useTranslations("Navigation");
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem("nexus-theme");
    const isDark = saved ? saved === "dark" : true;
    document.documentElement.classList.toggle("dark", isDark);
    setDark(isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("nexus-theme", next ? "dark" : "light");
    setDark(next);
  };

  return (
    <Button variant="ghost" size="icon" className="size-10 rounded-xl" onClick={toggle} aria-label={`${t("theme")}: ${dark ? t("light") : t("dark")}`} title={`${t("theme")}: ${dark ? t("light") : t("dark")}`}>
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}
