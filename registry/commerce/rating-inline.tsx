import type { ComponentProps } from "react";

import { IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface RatingInlineProps extends Omit<ComponentProps<"span">, "children"> {
  /** The average score, from 0 to `max`. Fractions are drawn: 4.6 fills 60% of the fifth star. */
  value?: number;
  /** How many reviews the score rests on. Zero shows the empty state instead of stars. */
  count?: number;
  /** The reviews section. When set, the whole line is a link there. */
  href?: string;
  /** Star and text size: 12px, 14px or 18px stars. */
  size?: "sm" | "md" | "lg";
  /** Hides the "(128)" but keeps the number in the accessible name. */
  hideCount?: boolean;
  /** Replaces the sentence a screen reader hears, for other languages: "4,6 van 5 sterren, 128 beoordelingen". */
  label?: string;
  /** The top of the scale. */
  max?: number;
  /** Locale for the numbers. Always passed, so server and browser agree. */
  locale?: string;
  /** What to show when there are no reviews. `null` shows nothing at all. Never five empty stars. */
  emptyText?: string | null;
}

const SIZES = {
  sm: { star: 12, text: "gap-1 text-xs" },
  md: { star: 14, text: "gap-1.5 text-sm" },
  lg: { star: 18, text: "gap-2 text-base" },
} as const;

const focus = "rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/*
 * The star does not fill its 24-unit box: what is drawn runs from 2.625 to 21.375 (the points at 3.5 and 20.5, plus half the 1.75 stroke).
 * A fraction is laid on that stretch, not on the box, so 0.8 cuts the star at four fifths of what can be seen and 4.8 does not pass for 5.
 */
const STAR_EDGE = 2.625;
const STAR_SPAN = 18.75;
const clipWidth = (fill: number) => (fill >= 1 ? "100%" : `${((STAR_EDGE + fill * STAR_SPAN) / 24) * 100}%`);

/**
 * The compact rating that sits under a product name or on a card: stars drawn
 * to the exact average, the score and the review count on one line, linking to
 * the reviews when you give it an `href`. A screen reader hears one sentence
 * ("Rated 4.6 out of 5, 1,284 reviews") and skips the stars. With no reviews
 * it says so, or shows nothing, and never draws five empty stars. Figures are
 * tabular, and a count above a thousand is shortened ("1.3K").
 */
export function RatingInline({ value, count, href, size = "md", hideCount = false, label, max = 5, locale = "en-US", emptyText = "No reviews yet", className, ...props }: RatingInlineProps) {
  const spec = SIZES[size];
  const scored = value !== undefined && Number.isFinite(value) && (count === undefined || count > 0);

  if (!scored) {
    if (emptyText === null) return null;
    const text = <>{emptyText}</>;
    // A link in place of the stars is drawn as one (underlined), so nobody takes "Be the first to review" for plain text.
    return href ? (
      <a data-slot="rating-inline" data-empty="" href={href} className={cn("inline-flex text-foreground underline decoration-muted-foreground/50 underline-offset-4 transition-[text-decoration-color] duration-150 hover:decoration-foreground motion-reduce:transition-none", spec.text, focus, className)} {...(props as ComponentProps<"a">)}>
        {text}
      </a>
    ) : (
      <span data-slot="rating-inline" data-empty="" className={cn("inline-flex text-muted-foreground", spec.text, className)} {...props}>
        {text}
      </span>
    );
  }

  const score = Math.min(max, Math.max(0, value));
  const shown = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
  const reviews = count ?? 0;
  const noun = new Intl.PluralRules(locale).select(reviews) === "one" ? "review" : "reviews";
  const sentence = label ?? `Rated ${shown} out of ${max}${count === undefined ? "" : `, ${new Intl.NumberFormat(locale).format(reviews)} ${noun}`}`;
  const short = reviews >= 1000 ? new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(reviews) : new Intl.NumberFormat(locale).format(reviews);

  const line = (
    <>
      <span aria-hidden="true" className="inline-flex items-center gap-px">
        {Array.from({ length: max }, (_, index) => {
          const fill = Math.max(0, Math.min(1, score - index));
          return (
            <span key={index} className="relative inline-flex" style={{ width: spec.star, height: spec.star }}>
              <IconStar size={spec.star} className="text-muted-foreground/40" />
              {fill > 0 ? (
                <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: clipWidth(fill) }}>
                  <IconStar size={spec.star} fill="currentColor" className="text-foreground" />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
      {/* One run of text, so the hover underline is a single line under "4.6 (128)" and not two with a gap. */}
      <span aria-hidden="true" className="tabular-nums">
        <span className="font-medium text-foreground">{shown}</span>
        {count !== undefined && !hideCount ? <span className="text-muted-foreground"> ({short})</span> : null}
      </span>
    </>
  );

  return href ? (
    <a data-slot="rating-inline" href={href} aria-label={sentence} className={cn("inline-flex items-center leading-none underline-offset-4 hover:underline", spec.text, focus, className)} {...(props as ComponentProps<"a">)}>
      {line}
    </a>
  ) : (
    <span data-slot="rating-inline" role="img" aria-label={sentence} className={cn("inline-flex items-center leading-none", spec.text, className)} {...props}>
      {line}
    </span>
  );
}
