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
        <Skeleton key={i} className="h-36 rounded-2xl" />
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
        </div>
      ))}
    </div>
  );
}
