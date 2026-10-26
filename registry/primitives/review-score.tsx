import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface ReviewBand {
  /** The lowest score, on the scale of `max`, that earns this word. */
  min: number;
  /** The word: "Superb". */
  label: string;
}

export interface ReviewScoreProps extends Omit<ComponentProps<"div">, "children"> {
  /** The average score, from 0 to `max`. `null` and `undefined` mean there is none yet. */
  score: number | null | undefined;
  /** The top of the scale. Default 10. A score is written with one decimal on a scale up to 10 and as a whole number above it. */
  max?: number;
  /** How many reviews the score rests on, written "1,204 reviews". Without a count only the score and its word are shown; a count of 0 reads "No reviews yet". */
  count?: number;
  /** The bands and their words, best first or in any order: a score gets the word of the highest `min` it reaches. The default has seven words, Poor up to Exceptional, on a scale of 10 and is stretched to fit another `max`. */
  labels?: readonly ReviewBand[];
  /** The box and the type: 32, 40 or 56px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** Make the whole score a link, to the reviews. */
  href?: string;
  /** Defaults to "en-US". Used for the decimal mark and the thousands in the count. */
  locale?: string;
  /** How the count is written, for another language. Gets the count. */
  reviewsLabel?: (count: number) => string;
  /** What a score without reviews says. Default "No reviews yet". */
  emptyLabel?: string;
  /** The start of what a screen reader hears, with `{score}` and `{max}` replaced. Default "Rated {score} out of {max}". */
  ratedLabel?: string;
}

const BANDS: readonly ReviewBand[] = [
  { min: 9.5, label: "Exceptional" },
  { min: 9, label: "Superb" },
  { min: 8, label: "Excellent" },
  { min: 7, label: "Very good" },
  { min: 6, label: "Good" },
  { min: 5, label: "Fair" },
  { min: 0, label: "Poor" },
];

const SIZE = {
  sm: { root: "gap-2", box: "size-8 rounded-md text-[0.8125rem]", band: "text-[0.8125rem] leading-4", count: "text-xs leading-4" },
  md: { root: "gap-2.5", box: "size-10 rounded-lg text-base", band: "text-sm leading-5", count: "text-xs leading-4" },
  lg: { root: "gap-3", box: "size-14 rounded-xl text-2xl", band: "text-base leading-5", count: "text-sm leading-5" },
} as const;

// Strength is in the fill of the box as well as in the word, never in colour: a solid box for a high score, an outline for a middling one, a quiet one for a low one.
const FILL = {
  strong: "bg-primary text-primary-foreground forced-colors:border",
  medium: "border border-foreground/25 bg-background text-foreground",
  weak: "bg-muted text-muted-foreground forced-colors:border",
  none: "border border-dashed border-border text-muted-foreground",
} as const;

const numbers = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = numbers.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    numbers.set(key, format);
  }
  return format;
}

/**
 * Intl writes some spaces as thin or narrow no-break spaces (the thousands in
 * French, for one), and the version of the Unicode data decides which: a server
 * and a browser with different versions then write different text, and React
 * throws the server markup away. A plain space looks the same and every engine
 * agrees on it.
 */
const tidy = (text: string) => text.replace(/[\u00a0\u2009\u202f]/g, " ");

/**
 * The compact rating listings use where five stars take too much room: the
 * score in a rounded square in tabular numerals, the word for it beside it
 * ("Excellent") and how many reviews it rests on. The whole is one name for a
 * screen reader: "Rated 8.9 out of 10, Excellent, 1,204 reviews". The word
 * comes from bands you can set, and the box says it too, by its fill (solid,
 * outlined, quiet), so the strength of a score never depends on colour. A score
 * without reviews says "No reviews yet". It fits hotel, venue, property and
 * course cards. With `href` the whole score links to the reviews. A Server
 * Component.
 */
export function ReviewScore({
  score,
  max = 10,
  count,
  labels,
  size = "md",
  href,
  locale = "en-US",
  reviewsLabel,
  emptyLabel = "No reviews yet",
  ratedLabel = "Rated {score} out of {max}",
  className,
  ...props
}: ReviewScoreProps) {
  const look = SIZE[size];
  const empty = score === null || score === undefined || !Number.isFinite(score) || count === 0;
  const digits = max <= 10 ? 1 : 0;
  const format = numberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  let box = "–";
  let word = "";
  let detail = "";
  let spoken = emptyLabel;
  let fill: keyof typeof FILL = "none";
  if (!empty) {
    // The score the reader sees decides the word, so 8.96 is "9.0 Superb" and never "9.0 Excellent".
    const shown = Number(Math.min(Math.max(score, 0), max).toFixed(digits));
    const bands = [...(labels ?? BANDS.map((band) => ({ ...band, min: (band.min * max) / 10 })))].sort((a, b) => b.min - a.min);
    word = (bands.find((band) => shown >= band.min) ?? bands[bands.length - 1])?.label ?? "";
    const ratio = max > 0 ? shown / max : 0;
    fill = ratio >= 0.8 ? "strong" : ratio >= 0.6 ? "medium" : "weak";
    box = tidy(format.format(shown));
    if (count !== undefined) detail = reviewsLabel ? reviewsLabel(count) : `${tidy(numberFormat(locale, {}).format(count))} review${count === 1 ? "" : "s"}`;
    spoken = [ratedLabel.replace("{score}", box).replace("{max}", tidy(numberFormat(locale, { maximumFractionDigits: 2 }).format(max))), word, detail].filter(Boolean).join(", ");
  } else {
    word = emptyLabel;
  }

  const classes = cn(
    "group/score inline-flex max-w-full items-center text-start",
    look.root,
    href && "-m-1 rounded-xl p-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
    className,
  );
  const content = (
    <>
      <span aria-hidden="true" data-slot="review-score-box" className={cn("grid shrink-0 place-items-center font-semibold tracking-[-0.02em] tabular-nums", look.box, FILL[fill])}>
        {box}
      </span>
      <span aria-hidden="true" className="grid min-w-0">
        <span className={cn("truncate font-medium text-foreground group-hover/score:underline group-hover/score:underline-offset-4", look.band, empty && "font-normal text-muted-foreground")}>{word}</span>
        {detail ? <span className={cn("truncate text-muted-foreground tabular-nums", look.count)}>{detail}</span> : null}
      </span>
      <span className="sr-only">{spoken}</span>
    </>
  );

  return href ? (
    <a data-slot="review-score" data-fill={fill} href={href} className={classes} {...(props as ComponentProps<"a">)}>
      {content}
    </a>
  ) : (
    <div data-slot="review-score" data-fill={fill} className={classes} {...props}>
      {content}
    </div>
  );
}
