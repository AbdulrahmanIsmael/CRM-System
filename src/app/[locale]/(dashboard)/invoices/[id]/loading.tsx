import {
  DetailHeaderSkeleton,
  StatCardsSkeleton,
  Skeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <DetailHeaderSkeleton />
      <StatCardsSkeleton count={3} cols={4} />
      {/* Invoice line items */}
      <div className="rounded-2xl border border-border/80 bg-card/95 overflow-hidden">
        <div className="border-b border-border/70 bg-muted/10 p-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-10 shrink-0" />
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
            </div>
          ))}
          <div className="p-4 flex justify-end">
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
