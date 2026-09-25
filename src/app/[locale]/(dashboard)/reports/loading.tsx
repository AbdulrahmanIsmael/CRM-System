import {
  PageHeaderSkeleton,
  ReportCardGridSkeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      <ReportCardGridSkeleton
        count={6}
        className="lg:grid-cols-2 2xl:grid-cols-3"
      />
    </div>
  );
}
