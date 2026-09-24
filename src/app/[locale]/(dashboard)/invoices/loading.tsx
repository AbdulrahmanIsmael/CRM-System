import {
  PageHeaderSkeleton,
  RowListSkeleton,
  SearchBarSkeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <RowListSkeleton />
    </div>
  );
}
