import {
  ContactCardGridSkeleton,
  PageHeaderSkeleton,
  SearchBarSkeleton,
} from "@/components/layout/PageSkeletons";

export default function Loading() {
  return (
    <div className="space-y-6 pb-10" aria-busy="true">
      <PageHeaderSkeleton />
      <SearchBarSkeleton />
      <ContactCardGridSkeleton
        count={8}
        className="xl:grid-cols-3 2xl:grid-cols-4"
      />
    </div>
  );
}
