import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      aria-hidden="true"
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-3 w-24 rounded-md" />
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Skeleton className="h-11 w-36" />
    </div>
  );
}

export function SearchBarSkeleton() {
  return <Skeleton className="h-11 w-full sm:max-w-md" />;
}

export function CardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}

export function RowListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border/80 bg-card/95">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-5">
          <Skeleton className="size-10 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-80 shrink-0 space-y-3">
          <Skeleton className="h-11" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a detail page header (back button + title + actions) */
export function DetailHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  );
}

/** Skeleton for a set of small stat cards (e.g., project metrics) */
export function StatCardsSkeleton({
  count = 4,
  cols = 4,
}: {
  count?: number;
  cols?: number;
}) {
  return (
    <div
      className={cn("grid gap-4", {
        "sm:grid-cols-2 xl:grid-cols-4": cols === 4,
        "md:grid-cols-4": cols === 4,
        "md:grid-cols-2": cols === 2,
      })}
      style={cols !== 4 && cols !== 2 ? { gridTemplateColumns: `repeat(${cols},minmax(0,1fr))` } : {}}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a tabs layout (tabs bar + one card placeholder) */
export function TabsSkeleton({
  tabCount = 3,
  contentHeight = 320,
}: {
  tabCount?: number;
  contentHeight?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-border/80 bg-surface/80 p-1.5 w-full max-w-2xl">
        {Array.from({ length: tabCount }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
        ))}
      </div>
      <div
        className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-4"
        style={{ minHeight: contentHeight }}
      >
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
            <Skeleton className="size-5 rounded shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the calendar/events page list */
export function EventListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/95 overflow-hidden">
      <div className="border-b border-border/70 bg-muted/10 p-4">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 p-5 md:grid-cols-[170px_minmax(0,1fr)_auto] md:items-center"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 shrink-0 rounded" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for analytics charts grid */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56" />
        </div>
        <div className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-56" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-44" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for contacts card grid with avatar + info */
export function ContactCardGridSkeleton({
  count = 8,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-1">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for project card grid with progress bar */
export function ProjectCardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex gap-1 shrink-0">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for invoice list rows */
export function InvoiceListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/95 overflow-hidden">
      <div className="border-b border-border/70 bg-muted/10 p-4 flex gap-4">
        {["w-24","w-32","flex-1","w-20","w-24","w-16"].map((w, i) => (
          <Skeleton key={i} className={cn("h-3", w)} />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-4 w-32 shrink-0" />
            <Skeleton className="h-4 flex-1 hidden sm:block" />
            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
            <Skeleton className="h-4 w-24 shrink-0" />
            <div className="flex gap-1 shrink-0">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a contact/project detail page */
export function ContactDetailSkeleton() {
  return (
    <div className="space-y-6">
      <DetailHeaderSkeleton />
      <TabsSkeleton tabCount={4} contentHeight={300} />
    </div>
  );
}

/** Skeleton for the project detail page */
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-6">
      <DetailHeaderSkeleton />
      <StatCardsSkeleton count={4} cols={4} />
      <TabsSkeleton tabCount={3} contentHeight={300} />
    </div>
  );
}

/** Skeleton for the reports list page */
export function ReportCardGridSkeleton({
  count = 6,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="size-11 rounded-2xl shrink-0" />
            <div className="flex gap-1">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="size-7 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
