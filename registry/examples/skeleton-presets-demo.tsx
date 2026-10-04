import { SkeletonCard, SkeletonList, SkeletonProfile, SkeletonTable } from "@rhs-ui/primitives/skeleton-presets";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-4xl gap-8 p-8 md:grid-cols-2">
      <SkeletonProfile />
      <SkeletonCard />
      <SkeletonList rows={3} />
      <SkeletonTable rows={4} columns={3} />
    </div>
  );
}
