import { cn } from "@/lib/utils";

export interface RatingSummaryProps {
  /** How many reviews gave 5, 4, 3, 2 and 1 stars, in that order. */
  counts: readonly [number, number, number, number, number];
  /** Adds links to filter the reviews: called with the star count, returns the href. */
  hrefFor?: (stars: number) => string;
  locale?: string;
  className?: string;
}

const STAR = "M12 2.8l2.8 5.8 6.4.9-4.6 4.5 1.1 6.3L12 17.3l-5.7 3 1.1-6.3L2.8 9.5l6.4-.9z";

function Stars({ value }: { value: number }) {
  return (
    <span className="relative inline-flex" aria-hidden="true">
      <span className="flex text-muted-foreground/30">
        {[0, 1, 2, 3, 4].map((index) => (
          <svg key={index} viewBox="0 0 24 24" className="size-4 fill-current">
            <path d={STAR} />
          </svg>
        ))}
      </span>
      <span className="absolute inset-0 flex overflow-hidden text-foreground" style={{ width: `${(value / 5) * 100}%` }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <svg key={index} viewBox="0 0 24 24" className="size-4 shrink-0 fill-current">
            <path d={STAR} />
          </svg>
        ))}
      </span>
    </span>
  );
}

/**
 * What reviewers thought, at a glance: the average with partial stars, the
 * number of reviews, and a bar per star level with its share. The average
 * is computed from the counts, so it never disagrees with the bars.
 */
export function RatingSummary({ counts, hrefFor, locale = "en-GB", className }: RatingSummaryProps) {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const average = total ? counts.reduce((sum, count, index) => sum + count * (5 - index), 0) / total : 0;
  const shown = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(average);
  return (
    <section data-slot="rating-summary" aria-label="Customer reviews" className={cn("grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8", className)}>
      <div className="grid justify-items-start gap-1.5">
        <p className="text-4xl font-semibold tracking-tight tabular-nums" suppressHydrationWarning>
          {shown}
          <span className="sr-only"> out of 5 stars</span>
        </p>
        <Stars value={average} />
        <p className="text-xs text-muted-foreground" suppressHydrationWarning>
          {new Intl.NumberFormat(locale).format(total)} {total === 1 ? "review" : "reviews"}
        </p>
      </div>
      <ul className="grid gap-1.5">
        {counts.map((count, index) => {
          const stars = 5 - index;
          const share = total ? Math.round((count / total) * 100) : 0;
          const row = (
            <>
              <span className="w-12 shrink-0 text-muted-foreground">{stars} star</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${share}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">{share}%</span>
              <span className="sr-only">, {count} reviews</span>
            </>
          );
          return (
            <li key={stars}>
              {hrefFor && count ? (
                <a href={hrefFor(stars)} className="flex items-center gap-3 rounded-sm text-xs outline-none hover:[&_span:first-child]:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {row}
                </a>
              ) : (
                <div className="flex items-center gap-3 text-xs">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
