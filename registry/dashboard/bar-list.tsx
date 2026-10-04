import { cn } from "@/lib/utils";

export interface BarListItem {
  name: string;
  value: number;
  href?: string;
}

export interface BarListProps {
  items: readonly BarListItem[];
  /** Column headings: "Page", "Visitors". */
  labels?: [string, string];
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Show this many rows, largest first. */
  limit?: number;
  className?: string;
}

/**
 * Top pages, referrers, countries: each row a soft bar behind the label,
 * sized against the largest, the value at the end. A real list, sorted
 * largest first, with links when the rows lead somewhere. The bars are
 * decoration; the numbers are text.
 */
export function BarList({ items, labels, format, locale = "en-GB", limit, className }: BarListProps) {
  const sorted = [...items].sort((a, b) => b.value - a.value).slice(0, limit);
  const max = Math.max(1, ...sorted.map((item) => item.value));
  const number = new Intl.NumberFormat(locale, format);
  return (
    <div data-slot="bar-list" className={cn("grid gap-1.5", className)}>
      {labels ? <div aria-hidden="true" className="flex justify-between px-2 text-xs text-muted-foreground"><span>{labels[0]}</span><span>{labels[1]}</span></div> : null}
      <ul className="grid gap-1">
        {sorted.map((item) => {
          const row = (
            <>
              <span aria-hidden="true" className="absolute inset-y-0 left-0 rounded-md bg-foreground/[0.08]" style={{ width: `${(item.value / max) * 100}%` }} />
              <span className="relative truncate">{item.name}</span>
              <span className="relative shrink-0 font-medium tabular-nums" suppressHydrationWarning>{number.format(item.value)}</span>
            </>
          );
          return (
            <li key={`${item.name}-${item.href ?? ""}`}>
              {item.href ? (
                <a href={item.href} className="relative flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40">{row}</a>
              ) : (
                <span className="relative flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm">{row}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
