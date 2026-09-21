"use client";

import Image from "next/image";
import { useState } from "react";
import { LogOut, Menu, Settings2, UserRound, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/crm";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { GlobalSearch } from "./GlobalSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ initialProfile }: { initialProfile: { name: string; email: string; avatar: string } }) {
  const locale = useLocale();
  const nav = useTranslations("Navigation");
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = initialProfile;
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  const initials = getInitials(profile.name);

  return (
    <header className="sticky top-0 z-40 flex h-[68px] w-full min-w-0 shrink-0 items-center border-b border-border/80 bg-background/85 px-3 backdrop-blur-2xl sm:px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 md:hidden"
                aria-label={nav("menu")}
              >
                <Menu />
              </Button>
            }
          />
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            className="w-[272px] border-e border-border bg-background p-0"
          >
            <Sidebar className="w-full" />
          </SheetContent>
        </Sheet>

        <GlobalSearch />
      </div>

      <div className="ms-2 flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        <ThemeToggle />
        <LanguageSwitcher />
        <span className="mx-0.5 hidden h-7 w-px bg-border sm:block" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-10 w-10 gap-2 rounded-xl p-1.5 sm:w-auto sm:max-w-[15rem] sm:px-2 lg:px-2.5"
                aria-label={nav("account")}
              >
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/10 text-xs font-semibold text-primary-light">
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name || nav("profile")}
                      width={32}
                      height={32}
                      className="size-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </span>
                <span className="hidden min-w-0 flex-1 text-start sm:flex sm:flex-col sm:items-start lg:max-w-[10rem]">
                  <span className="max-w-full truncate text-sm font-semibold text-foreground">
                    {profile.name || nav("profile")}
                  </span>
                  <span className="hidden max-w-full truncate text-[11px] text-muted-foreground lg:block">
                    {profile.email}
                  </span>
                </span>
                <ChevronDown className="hidden size-4 shrink-0 text-muted-foreground sm:block" />
              </Button>
            }
          />
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[min(19rem,calc(100vw-1rem))] rounded-2xl border-border bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-2 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10 text-sm font-semibold text-primary-light">
                    {profile.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={profile.name || nav("profile")}
                        width={40}
                        height={40}
                        className="size-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {profile.name || nav("profile")}
                    </p>
                    <p className="truncate text-xs font-normal text-muted-foreground">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="h-11 rounded-xl"
              onClick={() => router.push("/profile")}
            >
              <UserRound className="size-4" />
              <span>{nav("profile")}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="h-11 rounded-xl"
              onClick={() => router.push("/settings")}
            >
              <Settings2 className="size-4" />
              <span>{nav("settings")}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="h-11 rounded-xl text-danger focus:text-danger"
              onClick={logout}
            >
              <LogOut className="size-4" />
              <span>{nav("logout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
