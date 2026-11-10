"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface SatisfactionOverall {
  /** The overall score: 9.2. */
  score: number;
  /** What the scale tops out at: 10, or 5. The bars are drawn against it. */
  max: number;
  /** How many people answered. */
  responses: number;
  /** When they were asked, as you want it written: "July to September 2026". */
  period: string;
}

export interface SatisfactionCategory {
  /** What was rated: "Ease of use". */
  label: string;
  /** The score, on the same scale as the overall one. */
  score: number;
}

export interface SatisfactionScoresLabels {
  /** Under the big number; `{max}` is filled in. Default "out of {max}". */
  outOf: string;
  /** About the survey; `{responses}` is filled in. Default "Based on {responses} responses". */
  basedOn: string;
  /** What each bar reports as its value; `{score}` and `{max}` are filled in. Default "{score} out of {max}". */
  valueText: string;
  /** The word before the source line. Default "Source". */
  source: string;
  /** The text of the link to the method. Default "How we measure this". */
  method: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
  /** The name of the list of category scores. Default "Scores by category". */
  categories: string;
  /** The name of the section when it has no `title`. Default "Customer satisfaction". */
  region: string;
}

export interface SatisfactionScoresProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** An optional heading. Without it the section is named by `labels.region`. */
  title?: string;
  /** One sentence under the title. */
  description?: string;
  /** The overall score on the left, with how many answered and when. */
  overall: SatisfactionOverall;
  /** Five or six categories, in the order they are read, each scored on the overall scale. */
  categories: readonly SatisfactionCategory[];
  /** Where the scores come from: who was asked and how it was scored. Required: a score without its source undermines itself. */
  source: string;
  /** The page that explains the method. When set it is linked after the source; an address on another site opens in a new tab and says so. */
  methodHref?: string;
  /** Digits after the decimal point of every score. Default 1. */
  decimals?: number;
  /** The locale of the numbers. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SatisfactionScoresLabels>;
}

const LABELS: SatisfactionScoresLabels = {
  outOf: "out of {max}",
  basedOn: "Based on {responses} responses",
  valueText: "{score} out of {max}",
  source: "Source",
  method: "How we measure this",
  newTab: "opens in a new tab",
  categories: "Scores by category",
  region: "Customer satisfaction",
};

const EXTERNAL = /^https?:\/\//i;

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));

/** A number formatter that survives a locale the browser does not know. */
function numberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat("en-US", options);
  }
}

type Phase = "rest" | "armed" | "grown";

/**
 * Whether the bars are drawn yet. Everything starts at rest: the server renders
 * the bars full, the first paint shows them full, and a list that is on screen
 * when the page opens stays that way, as it does for a browser without
 * IntersectionObserver and for a reader who asked for less motion. Once the
 * reader first scrolls, a list still below the window is emptied (it is off
 * screen, so nothing flashes) and grows once, the first time most of it is in
 * view.
 */
function useGrowPhase(ref: RefObject<HTMLElement | null>): Phase {
  const [phase, setPhase] = useState<Phase>("rest");

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A list taller than the window can never show a large share of itself, so cap what we wait for.
    const room = Math.min(1, window.innerHeight / Math.max(node.getBoundingClientRect().height, 1));
    const needed = Math.min(0.35, room * 0.9);
    let first = true;
    let finished = false;
    const arm = (): void => {
      window.removeEventListener("scroll", arm, true);
      if (!finished && node.getBoundingClientRect().top > window.innerHeight) setPhase("armed");
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry || finished) return;
        if (first) {
          first = false;
          // On screen when it appeared: leave it at rest for good.
          if (entry.isIntersecting) {
            finished = true;
            observer.disconnect();
            window.removeEventListener("scroll", arm, true);
            return;
          }
        }
        if (entry.isIntersecting && entry.intersectionRatio >= needed - 0.001) {
          finished = true;
          setPhase("grown");
          observer.disconnect();
          window.removeEventListener("scroll", arm, true);
        }
      },
      { threshold: [0, needed] },
    );
    observer.observe(node);
    // Capturing, so a list inside a scrolling box of its own is noticed too.
    window.addEventListener("scroll", arm, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", arm, true);
    };
  }, [ref]);

  return phase;
}

/**
 * The score of a survey, laid out the way buyers compare tools: one large
 * overall number with how many answered and when, and beside it five or six
 * categories as labelled bars with their scores in tabular digits. Each bar is
 * a meter with its label, range and value, so a screen reader hears "Ease of
 * use, 9.4 out of 10" once, and the drawing is left out of the reading. A list
 * that is below the window when the page opens fills its bars once, a little
 * after one another, as it scrolls into view; one that is already in view, and
 * every list under reduced motion, simply stands still. The source is required
 * and the method link is part of the API on purpose: a score without them
 * undermines itself.
 */
export function SatisfactionScores({ title, description, overall, categories, source, methodHref, decimals = 1, locale = "en-US", labels, className, ...props }: SatisfactionScoresProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const list = useRef<HTMLUListElement>(null);
  const phase = useGrowPhase(list);
  const score = numberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const whole = numberFormat(locale, { maximumFractionDigits: 0 });
  const max = whole.format(overall.max);
  const external = methodHref ? EXTERNAL.test(methodHref) : false;
  const top = overall.max > 0 ? overall.max : 1;

  return (
    <section
      data-slot="satisfaction-scores"
      aria-labelledby={title ? heading : undefined}
      aria-label={title ? undefined : words.region}
      className={cn("py-16 sm:py-24", className)}
      {...props}
    >
      {title ? (
        <header className="max-w-2xl">
          <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </header>
      ) : null}

      <div className={cn("grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-0", title && "mt-12 sm:mt-14")}>
        <div className="lg:pr-14">
          <p className="text-[5.5rem] leading-[0.85] font-medium tracking-[-0.06em] tabular-nums sm:text-[7.5rem]">{score.format(overall.score)}</p>
          <p className="mt-4 text-xl font-medium tracking-[-0.02em] text-muted-foreground">{fill(words.outOf, { max })}</p>
          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
            <span className="block">{fill(words.basedOn, { responses: whole.format(overall.responses) })}</span>
            <span className="block">{overall.period}</span>
          </p>
        </div>

        <ul ref={list} role="list" aria-label={words.categories} className="grid content-start gap-7 border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-14">
          {categories.map((category, index) => {
            const share = Math.min(1, Math.max(0, category.score / top)) * 100;
            const text = fill(words.valueText, { score: score.format(category.score), max });
            return (
              <li key={category.label}>
                <div className="flex items-baseline justify-between gap-4 text-sm" aria-hidden="true">
                  <span className="font-medium">{category.label}</span>
                  <span className="text-muted-foreground tabular-nums">{score.format(category.score)}</span>
                </div>
                <div role="meter" aria-label={category.label} aria-valuemin={0} aria-valuemax={overall.max} aria-valuenow={category.score} aria-valuetext={text} className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    data-phase={phase}
                    style={{ "--fill": share, ...(phase === "grown" ? { transitionDelay: `${index * 80}ms` } : null) } as CSSProperties}
                    className="h-full w-full translate-x-[calc(var(--fill)*1%_-_100%)] rounded-full bg-foreground transition-[translate] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[phase=armed]:-translate-x-full data-[phase=armed]:transition-none motion-reduce:transition-none print:translate-x-[calc(var(--fill)*1%_-_100%)]!"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <span>
          {words.source}: {source}
        </span>
        {methodHref ? (
          <a
            href={methodHref}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="rounded-sm text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {words.method}
            {external ? <span className="sr-only"> ({words.newTab})</span> : null}
          </a>
        ) : null}
      </p>
    </section>
  );
}
