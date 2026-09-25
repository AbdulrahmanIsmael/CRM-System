import { DetailHeaderSkeleton, Skeleton } from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <DetailHeaderSkeleton />
      {/* Rich text editor area */}
      <div className="rounded-2xl border border-border/80 bg-card/95 p-6 space-y-3">
        {/* Toolbar */}
        <div className="flex gap-2 border-b border-border pb-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="size-7 rounded" />
          ))}
        </div>
        {/* Content */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
