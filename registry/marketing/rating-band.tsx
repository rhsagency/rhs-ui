import { IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PlatformRating {
  /** Where the rating comes from: "App Store", "Trustpilot", "G2". */
  source: string;
  /** Out of five, one decimal. */
  rating: number;
  /** "2,140 reviews". */
  count: string;
  href?: string;
}

export interface RatingBandProps {
  ratings: readonly PlatformRating[];
  className?: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden="true" className="relative inline-flex">
      <span className="flex text-border">{Array.from({ length: 5 }, (_, index) => <IconStar key={index} className="size-4 fill-current" />)}</span>
      <span className="absolute inset-0 flex overflow-hidden text-foreground" style={{ width: `${(rating / 5) * 100}%` }}>
        {Array.from({ length: 5 }, (_, index) => <IconStar key={index} className="size-4 shrink-0 fill-current" />)}
      </span>
    </span>
  );
}

/**
 * Ratings from the places people check: score, partial stars and the count
 * per source, side by side. The stars are decoration; the score is read as
 * "4.8 out of 5 on the App Store, 2,140 reviews".
 */
export function RatingBand({ ratings, className }: RatingBandProps) {
  return (
    <section data-slot="rating-band" aria-label="Ratings" className={cn("py-10", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
        {ratings.map((item) => {
          const body = (
            <>
              <span aria-hidden="true" className="flex items-center gap-3">
                <span className="text-3xl font-medium tracking-[-.05em] tabular-nums">{item.rating.toFixed(1)}</span>
                <span className="flex flex-col gap-1">
                  <Stars rating={item.rating} />
                  <span className="text-xs text-muted-foreground">{item.source}, {item.count}</span>
                </span>
              </span>
              <span className="sr-only">{`${item.rating.toFixed(1)} out of 5 on ${item.source}, ${item.count}`}</span>
            </>
          );
          return (
            <li key={item.source}>
              {item.href ? (
                <a href={item.href} className="relative flex items-center gap-3 rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">{body}</a>
              ) : (
                <span className="relative flex items-center gap-3">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
