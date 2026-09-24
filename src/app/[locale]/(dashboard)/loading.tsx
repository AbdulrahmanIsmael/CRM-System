import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted", className)}
      aria-hidden="true"
    />
  );
}

export default function Loading() {
  return (
    <div
      className="mx-auto max-w-[1600px] space-y-6 pb-10"
      aria-busy="true"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-9 w-56 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 w-full sm:max-w-md" />
        <Skeleton className="h-11 w-full sm:max-w-44" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Skeleton className="min-h-[320px]" />
        <Skeleton className="min-h-[320px]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="min-h-[280px]" />
        <Skeleton className="min-h-[280px]" />
        <Skeleton className="min-h-[280px]" />
      </div>
    </div>
  );
}
