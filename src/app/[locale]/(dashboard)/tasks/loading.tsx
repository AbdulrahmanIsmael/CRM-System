import {
  PageHeaderSkeleton,
  RowListSkeleton,
  SearchBarSkeleton,
  Skeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBarSkeleton />
        <Skeleton className="h-11 w-36 rounded-2xl" />
      </div>
      <RowListSkeleton count={8} />
    </div>
  );
}
