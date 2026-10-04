import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

/**
 * Ready-made placeholders in the shape of what is coming: a list row, a
 * card, a table, a profile. Matching the final layout keeps the page from
 * jumping when the data arrives. Each preset is hidden from screen readers
 * and paired with one status line.
 */
export function SkeletonList({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div data-slot="skeleton-list" className={cn("divide-y divide-border rounded-xl border border-border", className)}>
      <span role="status" className="sr-only">Loading list</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex items-center gap-3 p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-2/3" /></div>
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div data-slot="skeleton-card" className={cn("overflow-hidden rounded-xl border border-border", className)}>
      <span role="status" className="sr-only">Loading card</span>
      <div aria-hidden="true">
        <Skeleton className="aspect-[16/10] w-full rounded-none" />
        <div className="space-y-2 p-4"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div data-slot="skeleton-table" className={cn("rounded-xl border border-border", className)}>
      <span role="status" className="sr-only">Loading table</span>
      <div aria-hidden="true">
        <div className="grid gap-4 border-b border-border p-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, i) => <Skeleton key={i} className="h-3 w-2/3" />)}</div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="grid gap-4 border-b border-border p-4 last:border-0" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{Array.from({ length: columns }, (_, c) => <Skeleton key={c} className="h-3" style={{ width: `${55 + ((r * 7 + c * 13) % 40)}%` }} />)}</div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div data-slot="skeleton-profile" className={cn("flex items-center gap-4", className)}>
      <span role="status" className="sr-only">Loading profile</span>
      <div aria-hidden="true" className="contents">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /><Skeleton className="h-3 w-32" /></div>
      </div>
    </div>
  );
}
