import { cn } from "@/lib/utils";

export interface ProgressListItem {
  id: string;
  label: string;
  value: number;
  /** The target; the bar shows value against it. */
  target: number;
  /** How to print a value: "€12k", "84 tickets". */
  display?: string;
}

export interface ProgressListProps {
  title?: string;
  items: readonly ProgressListItem[];
  className?: string;
}

/**
 * Several goals at once, each a labelled bar against its own target: sales
 * per region, tickets per agent, budget per category. Over-target bars stay
 * full and say so; every bar is a meter for assistive technology.
 */
export function ProgressList({ title, items, className }: ProgressListProps) {
  return (
    <section data-slot="progress-list" aria-label={title} className={cn("space-y-4", className)}>
      {title ? <h3 className="text-sm font-medium">{title}</h3> : null}
      <ul className="space-y-4">
        {items.map((item) => {
          const ratio = item.target > 0 ? item.value / item.target : 0;
          return (
            <li key={item.id}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground tabular-nums">{item.display ?? item.value}{ratio >= 1 ? <span className="ml-1.5 text-foreground">Target met</span> : <span className="ml-1.5">{Math.round(ratio * 100)}%</span>}</span>
              </div>
              <div role="meter" aria-label={item.label} aria-valuemin={0} aria-valuemax={item.target} aria-valuenow={Math.min(item.value, item.target)} className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.min(1, ratio) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
