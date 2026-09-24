import {
  KanbanSkeleton,
  PageHeaderSkeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="flex h-full flex-col space-y-6" aria-busy="true">
      <PageHeaderSkeleton />
      <KanbanSkeleton />
    </div>
  );
}
