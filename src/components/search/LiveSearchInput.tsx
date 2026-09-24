"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

export function LiveSearchInput({ value = "", placeholder, ariaLabel }: { value?: string; placeholder: string; ariaLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(value);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === value) return;
      startTransition(() => {
        const next = query.trim();
        router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, value, pathname, router]);

  return (
    <div className="relative max-w-xl flex-1">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        type="search"
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="flex h-12 w-full rounded-2xl border border-input bg-transparent px-3 py-2 ps-11 pe-11 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {query ? (
        <button type="button" onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
          <X className="size-4" />
        </button>
      ) : null}
      {isPending ? <LoaderCircle className="pointer-events-none absolute end-10 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" aria-hidden="true" /> : null}
    </div>
  );
}
