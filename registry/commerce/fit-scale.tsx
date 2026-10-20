import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface FitScaleLabels {
  /** The name of the scale for assistive technology. */
  title?: string;
  /** The left end of the scale. */
  small?: string;
  /** The middle of the scale. */
  trueToSize?: string;
  /** The right end of the scale. */
  large?: string;
  /** The verdict that fills {fit} in the sentence, from the smallest fit to the largest. */
  verdicts?: readonly [string, string, string, string, string];
  /** The sentence under the scale. {fit} and {count} are filled in. */
  summary?: string;
  /** The sentence for a single review. */
  summaryOne?: string;
  /** The sentence when no review count is given. */
  summaryNoCount?: string;
}

export interface FitScaleProps extends Omit<ComponentProps<"div">, "children"> {
  /** The average reported fit from 1 (runs small) to 5 (runs large); 3 is true to size. Without it nothing renders. */
  value?: number;
  /** How many reviews the average comes from. It is said in the sentence under the scale. */
  count?: number;
  /** Always pass your application locale, so the review count is formatted the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: FitScaleLabels;
  /** A smaller scale without the sentence; the sentence stays available to assistive technology. */
  compact?: boolean;
}

const WORDS = {
  title: "Fit",
  small: "Runs small",
  trueToSize: "True to size",
  large: "Runs large",
  verdicts: ["it runs small", "it runs slightly small", "true to size", "it runs slightly large", "it runs large"],
  summary: "Most customers say {fit}, based on {count} reviews",
  summaryOne: "One customer says {fit}, based on 1 review",
  summaryNoCount: "Most customers say {fit}",
} as const satisfies Required<FitScaleLabels>;

/**
 * Where an item runs, from small to large, as a five-point scale with a marker
 * at the average fit reported in reviews. The position is explained in words
 * under the scale, the scale is a meter for assistive technology, and without
 * data it renders nothing instead of a fake mid-point.
 */
export function FitScale({ value, count, locale = "en-US", labels, compact = false, className, ...props }: FitScaleProps) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1 || value > 5 || count === 0) return null;
  const words = { ...WORDS, ...labels };
  // 1.5, 2.5, 3.5 and 4.5 are the borders of the five verdicts.
  const zone = Math.min(4, Math.max(0, Math.round(value) - 1));
  const template = count === undefined ? words.summaryNoCount : count === 1 ? words.summaryOne : words.summary;
  const sentence = template.replace("{fit}", words.verdicts[zone] ?? "").replace("{count}", count === undefined ? "" : new Intl.NumberFormat(locale).format(count));
  // Five segments with 4px gaps: the marker sits on the middle of its segment and slides between the middles.
  const along = value - 1;
  const left = `calc((100% - 16px) / 5 * ${along + 0.5} + ${along * 4}px)`;
  // The end labels and the middle one carry weight only when the marker is in their zone.
  const emphasis = (index: number) => (zone === index ? "font-medium text-foreground" : "");

  return (
    <div data-slot="fit-scale" data-compact={compact || undefined} className={cn("grid gap-2.5 text-xs text-muted-foreground", className)} {...props}>
      <div role="meter" aria-label={words.title} aria-valuemin={1} aria-valuemax={5} aria-valuenow={value} aria-valuetext={sentence} className={cn("relative", compact ? "h-4" : "h-5")}>
        <div aria-hidden="true" className={cn("absolute inset-x-0 top-1/2 flex -translate-y-1/2 gap-1", compact ? "h-1" : "h-1.5")}>
          {[0, 1, 2, 3, 4].map((segment) => (
            <span key={segment} className={cn("flex-1 rounded-full", segment === 2 ? "bg-foreground/25" : "bg-foreground/12")} />
          ))}
        </div>
        <span
          aria-hidden="true"
          style={{ left }}
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-background bg-foreground shadow-sm ring-1 ring-foreground/25 transition-[left] duration-500 ease-out motion-reduce:transition-none",
            compact ? "size-3.5 border-2" : "size-5 border-[3px]",
          )}
        />
      </div>
      <div aria-hidden="true" className={cn("grid grid-cols-3 gap-2", compact && "text-[0.6875rem]")}>
        <span className={cn("text-left", emphasis(0))}>{words.small}</span>
        <span className={cn("text-center", emphasis(2))}>{words.trueToSize}</span>
        <span className={cn("text-right", emphasis(4))}>{words.large}</span>
      </div>
      {compact ? null : <p className="text-pretty">{sentence}.</p>}
    </div>
  );
}
