import {
  EventListSkeleton,
  PageHeaderSkeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <EventListSkeleton count={6} />
        <EventListSkeleton count={4} />
      </div>
    </div>
  );
}
