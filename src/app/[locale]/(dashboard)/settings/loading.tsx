import { PageHeaderSkeleton, Skeleton } from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      {/* Profile card */}
      <div className="rounded-2xl border border-border/80 bg-card/95 overflow-hidden">
        <Skeleton className="h-36 w-full rounded-none" />
        <div className="p-6 -mt-12 space-y-4">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Skeleton className="size-24 rounded-3xl shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
      </div>
      {/* Form sections */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-32 rounded-xl" />
    </div>
  );
}
