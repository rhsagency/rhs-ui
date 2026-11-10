"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type RefObject } from "react";

import { cn } from "@/lib/utils";

export interface BenchmarkValue {
  /** The number the bar is drawn from. */
  value: number;
  /** How the value is written at the end of its bar: "11 min", "3 h 6 min". Without it the value is formatted and followed by the metric's `unit`. Keep it short: past 14 characters it may wrap beside its bar, and the values never take more than 45% of the row. */
  label?: string;
}

export interface BenchmarkMetric {
  /** Identifies the metric in the list. */
  id: string;
  /** What was measured: "Time to first reply". */
  label: string;
  /** Your customers' result. Drawn in the foreground tone. */
  ours: BenchmarkValue;
  /** The industry median, or whatever you compare against. Drawn muted. */
  benchmark: BenchmarkValue;
  /** The unit written after a value that has no `label`: "min", "%", "days". A "%" sits against the number; any other unit follows a space. */
  unit?: string;
  /** Which way is good. With "lower" the shorter bar wins, and the sentence and a note under the metric say so. */
  better: "higher" | "lower";
  /** The word for the multiple when yours wins: "faster", "cheaper", "fewer" in "2.4 times faster". Without it the words "higher" and "lower" are used, and they are always used when yours does not win. */
  comparative?: string;
}

export interface BenchmarkBarsLabels {
  /** The name of the first bar of each metric. Default "Our customers". */
  ours: string;
  /** The name of the second bar. Default "Industry median". */
  benchmark: string;
  /** The default word for a multiple where the larger number is yours. Default "higher". */
  higher: string;
  /** The same for the smaller. Default "lower". */
  lower: string;
  /** The multiple in words; `{multiple}` and `{word}` are filled in. Default "{multiple} times {word}". */
  multiple: string;
  /** When the two are within 5 percent of each other. Default "In line with the median". */
  same: string;
  /** The note under a metric where a lower number is better. Default "Lower is better". */
  lowerIsBetter: string;
  /** The word before the source line. Default "Source". */
  source: string;
  /** The text of the link to the method. Default "How we measure this". */
  method: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
}

export interface BenchmarkBarsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Three or four metrics, each drawn against its own scale. */
  metrics: readonly BenchmarkMetric[];
  /** Where both numbers come from and what the comparison covers. Required: a comparison without its method is just an assertion. */
  source: string;
  /** The page that explains the method. When set it is linked after the source; an address on another site opens in a new tab and says so. */
  methodHref?: string;
  /** The locale of the numbers and of the multiple. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BenchmarkBarsLabels>;
}

const LABELS: BenchmarkBarsLabels = {
  ours: "Our customers",
  benchmark: "Industry median",
  higher: "higher",
  lower: "lower",
  multiple: "{multiple} times {word}",
  same: "In line with the median",
  lowerIsBetter: "Lower is better",
  source: "Source",
  method: "How we measure this",
  newTab: "opens in a new tab",
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

/** A value as it is written at the end of a bar: its own label, or the number and the unit. */
function written(value: BenchmarkValue, unit: string | undefined, locale: string): string {
  if (value.label) return value.label;
  const number = numberFormat(locale, { maximumFractionDigits: 2 }).format(value.value);
  if (!unit) return number;
  return /^[%‰°]/.test(unit) ? `${number}${unit}` : `${number} ${unit}`;
}

type Phase = "rest" | "armed" | "grown";

/**
 * Whether the bars of a row are drawn yet. Everything starts at rest: the server
 * renders the bars full, the first paint shows them full, and a row that is on
 * screen when the page opens stays that way, as it does for a browser without
 * IntersectionObserver and for a reader who asked for less motion. Once the
 * reader first scrolls, a row still below the window is emptied (it is off
 * screen, so nothing flashes) and grows once, the first time most of it is in
 * view.
 */
function useGrowPhase(ref: RefObject<HTMLElement | null>): Phase {
  const [phase, setPhase] = useState<Phase>("rest");

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A row taller than the window can never show a large share of itself, so cap what we wait for.
    const room = Math.min(1, window.innerHeight / Math.max(node.getBoundingClientRect().height, 1));
    const needed = Math.min(0.4, room * 0.9);
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
    // Capturing, so a row inside a scrolling box of its own is noticed too.
    window.addEventListener("scroll", arm, { capture: true, passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", arm, true);
    };
  }, [ref]);

  return phase;
}

/** A value written with more characters than this may wrap onto a second line; a short one such as "11 min" never does. */
const WRAP_FROM = 14;

/** The most of a row the values may take: past it the longest bar still keeps over half the row, and a long value wraps beside its bar. */
const RESERVE_CAP = "45%";

/** The bar and its value at the end of it. The longest bar stops short of the end of the row by the room its value needs, so the number never runs out of the page. */
function Bar({ share, text, tone, phase, delay }: { share: number; text: string; tone: "ours" | "benchmark"; phase: Phase; delay: number }) {
  return (
    <div className="flex items-center gap-3">
      <span
        data-phase={phase}
        style={{ "--share": share, ...(phase === "grown" ? { transitionDelay: `${delay}ms` } : null) } as CSSProperties}
        className={cn(
          "h-3 shrink-0 rounded-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          "w-[calc((100%_-_var(--reserve))*var(--share))] data-[phase=armed]:w-0 data-[phase=armed]:transition-none print:w-[calc((100%_-_var(--reserve))*var(--share))]!",
          tone === "ours" ? "bg-foreground" : "bg-muted-foreground/35",
        )}
      />
      <span className={cn("text-sm tabular-nums", text.length > WRAP_FROM ? "text-pretty" : "whitespace-nowrap", tone === "ours" ? "font-medium text-foreground" : "text-muted-foreground")}>{text}</span>
    </div>
  );
}

interface RowProps {
  metric: BenchmarkMetric;
  words: BenchmarkBarsLabels;
  locale: string;
}

/** One metric: its name, the multiple in words, two bars on a shared scale, and the whole of it as one sentence for a screen reader. */
function MetricRow({ metric, words, locale }: RowProps) {
  const figure = useRef<HTMLElement>(null);
  const phase = useGrowPhase(figure);
  const { ours, benchmark } = metric;
  const oursText = written(ours, metric.unit, locale);
  const benchmarkText = written(benchmark, metric.unit, locale);
  const top = Math.max(ours.value, benchmark.value, 0);
  const share = (value: number): number => (top > 0 ? Math.min(1, Math.max(0, value) / top) : 0);
  // Only a positive pair has a ratio.
  const ratio = ours.value > 0 && benchmark.value > 0 ? Math.max(ours.value, benchmark.value) / Math.min(ours.value, benchmark.value) : null;
  const wins = metric.better === "higher" ? ours.value > benchmark.value : ours.value < benchmark.value;

  let comparison: string | null = null;
  if (ratio !== null) {
    if (ratio < 1.05) comparison = words.same;
    else {
      const multiple = numberFormat(locale, { maximumFractionDigits: ratio >= 10 ? 0 : 1 }).format(ratio);
      const word = wins && metric.comparative ? metric.comparative : ours.value > benchmark.value ? words.higher : words.lower;
      comparison = fill(words.multiple, { multiple, word });
    }
  }
  const note = metric.better === "lower" ? words.lowerIsBetter : null;
  const reserve = `min(calc(${Math.max(oursText.length, benchmarkText.length) + 1}ch + 0.75rem), ${RESERVE_CAP})`;
  const caption = [`${metric.label}.`, `${words.ours}: ${oursText}.`, `${words.benchmark}: ${benchmarkText}.`, comparison ? `${comparison}.` : null, note ? `${note}.` : null].filter(Boolean).join(" ");

  return (
    <figure ref={figure} className="grid gap-6 py-8 sm:py-10">
      <figcaption className="sr-only">{caption}</figcaption>
      <div aria-hidden="true" className="grid gap-6" style={{ "--reserve": reserve } as CSSProperties}>
        <div className="grid gap-1.5">
          <p className="text-sm text-muted-foreground">
            {metric.label}
            {note ? <span> &middot; {note}</span> : null}
          </p>
          {comparison ? <p className="text-2xl leading-tight font-medium tracking-[-0.03em] text-balance sm:text-3xl">{comparison}</p> : null}
        </div>
        <div className="grid gap-4">
          <div className="grid gap-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-5">
            <p className="text-xs text-muted-foreground">{words.ours}</p>
            <Bar share={share(ours.value)} text={oursText} tone="ours" phase={phase} delay={0} />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center sm:gap-5">
            <p className="text-xs text-muted-foreground">{words.benchmark}</p>
            <Bar share={share(benchmark.value)} text={benchmarkText} tone="benchmark" phase={phase} delay={140} />
          </div>
        </div>
      </div>
    </figure>
  );
}

/**
 * Prove a claim against the field: for each metric, your customers' result
 * beside the industry median as two horizontal bars on one scale, both values
 * written at the bar ends in tabular digits, and the multiple in words ("7.4
 * times faster"). The bars are drawn from the numbers and the words are worked
 * out from the same numbers, so they cannot disagree; where lower is better the
 * shorter bar wins and the sentence and a note say so, and a result that does
 * not win is described as it is. Each metric is a figure whose caption reads
 * the whole comparison to a screen reader in one go, and the bars grow once, a
 * little after one another, when their row scrolls into view; reduced motion
 * shows them at rest. The source is required: a comparison without its method
 * is just an assertion.
 */
export function BenchmarkBars({ title, description, metrics, source, methodHref, locale = "en-US", labels, className, ...props }: BenchmarkBarsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const external = methodHref ? EXTERNAL.test(methodHref) : false;

  return (
    <section data-slot="benchmark-bars" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className="mx-auto mt-12 max-w-3xl border-b border-border sm:mt-16">
        {metrics.map((metric) => (
          <li key={metric.id} className="border-t border-border">
            <MetricRow metric={metric} words={words} locale={locale} />
          </li>
        ))}
      </ul>
      <p className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-1.5 text-xs leading-relaxed text-muted-foreground">
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
