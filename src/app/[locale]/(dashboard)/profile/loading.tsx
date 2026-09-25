import { PageHeaderSkeleton, Skeleton } from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      {/* Profile hero card */}
      <div className="rounded-2xl border border-border/80 bg-card/95 overflow-hidden">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="relative -mt-12 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Skeleton className="size-24 rounded-3xl shrink-0 border-4 border-card" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-52" />
            </div>
          </div>
        </div>
      </div>
      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card/95 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="size-4 rounded shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
