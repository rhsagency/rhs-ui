"use client";

import { Fragment, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface BigNumberAction {
  /** The button's text: "Read the report". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface BigNumberSource {
  /** Where the figure comes from: "Northwind Water Authority, annual report 2025". */
  label: string;
  /** A link to it. The source is a link when this is set. */
  href?: string;
}

/** The words the hero says. `{source}` and `{date}` are filled in. */
export interface BigNumberHeroLabels {
  /** The source line. */
  source: string;
  /** The day the figure was true. `{date}` is the day, in a time element. */
  asOf: string;
}

export interface BigNumberHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The figure. It is the heading, together with its label, and its final value is in the page from the first render. */
  value: number;
  /** What it is a count of, set smaller beside the figure: "million litres", "years", "%". A short one stays beside it everywhere; a longer one drops under it on a narrow screen. */
  unit?: string;
  /** What the figure measures, in a line over it: "Drinking water saved since 2019". */
  label: string;
  /** A sentence of context under the figure. */
  description?: string;
  /** Where the figure comes from, as words or as words with a link. */
  source?: string | BigNumberSource;
  /** The day the figure was true: an ISO day ("2025-12-31"), a timestamp or a Date. It is printed after the source, in a time element, so the figure is dated. */
  asOf?: string | Date;
  /** The actions that follow from it. The first is the solid button and the rest are outlined; two read best. */
  actions?: readonly BigNumberAction[];
  /** How the figure is written, as options for Intl.NumberFormat: `{ maximumFractionDigits: 1 }`, `{ style: "percent" }`. */
  format?: Intl.NumberFormatOptions;
  /** Count up from zero, once, the first time the figure is on screen. The page always holds the final value, and a reader who asked for less motion gets it at once. Default false. */
  animate?: boolean;
  /** Seconds the count takes. Default 1.6. */
  duration?: number;
  /** The language of the figure and the date. Default "en-US". */
  locale?: string;
  /** The time zone a full timestamp is read in. A plain ISO day is that calendar day everywhere. Default "UTC". */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BigNumberHeroLabels>;
}

const LABELS: BigNumberHeroLabels = {
  source: "Source: {source}",
  asOf: "as of {date}",
};

/** Written out whole: Tailwind only generates the classes it can read in the source. Both sizes are worked out below and arrive as custom properties. */
const STACKED = "text-[length:var(--fit-stack)] @2xl:text-[length:var(--fit-row)]";
const ATTACHED = "text-[length:var(--fit-row)]";

/** The tracking of a figure made of digits alone: tight enough that they lock into one shape. Written out whole, like every class here. */
const TRACKING_TIGHT = "tracking-[-0.06em]";
/** A decimal point, a group separator, a space or a percent sign is a narrow mark beside wide digits, and at the tight tracking it fuses into the digit next to it. A figure that has one is set a little looser, so the mark keeps air on both sides. */
const TRACKING_OPEN = "tracking-[-0.03em]";
/** What the looser tracking adds to every character, in em: the width of the figure is worked out with it. */
const OPEN_EXTRA = 0.03;

/** How wide a figure is set, in em: tabular digits are about 0.6, a separator about a quarter of that, a percent sign almost a whole one. `extra` is added to every character, for looser tracking. */
function widthEm(text: string, extra = 0): number {
  let width = 0;
  for (const character of text) width += (/\p{N}/u.test(character) ? 0.6 : /[.,'\s]/.test(character) ? 0.28 : character === "%" ? 0.92 : 0.62) + extra;
  return width;
}

/** A template with one `{name}` in it, with a node in its place: the line can carry a link or a time element in any language. */
function withNode(template: string, name: string, node: ReactNode): ReactNode[] {
  return template.split(new RegExp(`(\\{${name}\\})`)).map((part, index) => (part === `{${name}}` ? <Fragment key={index}>{node}</Fragment> : part));
}

const link = "rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * One figure as the picture: a huge number, what it measures, and the action
 * that follows from it. The value is set at the largest size its container
 * allows, from a phone to a wide page, so a long figure shrinks to fit and a
 * short one fills the width, with its unit beside it. Under the figure go a
 * sentence of context, a source line with the day the figure was true as a
 * time element, and the actions. With `animate` the figure counts up from zero
 * the first time it is on screen, in tabular figures inside a box as wide as the
 * final value, so nothing shifts while it runs. The page holds the final value
 * from the first render, for screen readers, search engines and print: what
 * counts is a copy for the eye, hidden from assistive technology, and under
 * reduced motion there is no count at all. For nonprofits, public bodies and
 * data products whose strongest statement is a number.
 */
export function BigNumberHero({
  titleAs: Title = "h2",
  value,
  unit,
  label,
  description,
  source,
  asOf,
  actions = [],
  format,
  animate = false,
  duration = 1.6,
  locale = "en-US",
  timeZone = "UTC",
  labels: custom,
  className,
  ...props
}: BigNumberHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const figure = useRef<HTMLSpanElement>(null);
  // Starts false, so the server and the browser both print the real value. It turns true, before the first paint, only where the count will run.
  const [waiting, setWaiting] = useState(false);
  // The final value as text, and how many decimals it shows: the numbers that pass on the way are written with the same count, so 98 never shows as 97.384 on its way up.
  const formatter = new Intl.NumberFormat(locale, format);
  const finalText = formatter.format(value);
  const parts = formatter.formatToParts(value);
  const decimals = parts.find((part) => part.type === "fraction")?.value.length ?? 0;
  // Whether the figure is more than digits: a mark between or after them, in whatever way the locale writes one (a point, a comma, a space, a percent sign).
  const marked = parts.some((part) => part.type !== "integer" && part.type !== "fraction");
  // AnimatedNumber restarts when the options change identity, and an inline object is new on every render: keep one for as long as it says the same.
  const formatKey = JSON.stringify(format ?? null);
  const counting = useMemo(() => ({ ...(formatKey === "null" ? {} : (JSON.parse(formatKey) as Intl.NumberFormatOptions)), minimumFractionDigits: decimals, maximumFractionDigits: decimals }), [formatKey, decimals]);

  useLayoutEffect(() => {
    const node = figure.current;
    if (!animate || !node || typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setWaiting(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setWaiting(false);
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      setWaiting(false);
    };
  }, [animate]);

  const unitText = unit?.trim() ?? "";
  const attached = unitText.length > 0 && unitText.length <= 3;
  const unitEm = unitText ? (attached ? 0.42 * 0.6 * unitText.length + 0.12 : 0.24 * 0.56 * unitText.length + 0.22) : 0;
  const figureEm = widthEm(finalText, marked ? OPEN_EXTRA : 0);
  const fit = (em: number) => `clamp(2rem, calc(100cqi / ${em.toFixed(2)} * 0.96), 18rem)`;
  const size = { "--fit-stack": fit(figureEm), "--fit-row": fit(figureEm + unitEm) } as CSSProperties;

  const origin: BigNumberSource | undefined = typeof source === "string" ? { label: source } : source;
  let dated: { text: string; iso: string } | null = null;
  if (asOf !== undefined) {
    const moment = new Date(asOf);
    if (!Number.isNaN(moment.getTime())) {
      const calendarDay = typeof asOf === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asOf);
      let zone = "UTC";
      if (!calendarDay) {
        try {
          new Intl.DateTimeFormat("en-US", { timeZone });
          zone = timeZone;
        } catch {
          zone = "UTC";
        }
      }
      dated = { text: new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(moment).replace(/\s/g, " "), iso: calendarDay ? asOf : moment.toISOString() };
    }
  }

  return (
    <section data-slot="big-number-hero" aria-labelledby={`${id}-title`} className={cn("@container w-full py-14 sm:py-20", className)} {...props}>
      <Title id={`${id}-title`} className="flex flex-col">
        <span className="text-lg leading-snug font-medium tracking-[-0.01em] text-balance text-muted-foreground sm:text-xl [overflow-wrap:anywhere]">
          {label}
          <span className="sr-only">: </span>
        </span>
        {/* The figure is written once for everyone, as text, from the first render. What is drawn below is a copy for the eye. */}
        <span className="sr-only">{unitText ? `${finalText} ${unitText}` : finalText}</span>
        <span
          aria-hidden="true"
          data-slot="big-number-hero-figure"
          style={size}
          className={cn("mt-3 flex flex-wrap items-baseline font-medium sm:mt-4", attached ? "gap-x-[0.05em]" : "gap-x-[0.2em]", marked ? TRACKING_OPEN : TRACKING_TIGHT, attached ? ATTACHED : STACKED, "leading-[0.9]")}
        >
          {/* Tabular digits only while counting, so the box does not change width on the way up; a figure at rest has the font's own digits, with their own footing. */}
          <span ref={figure} className={cn("inline-grid", animate && "tabular-nums")}>
            <span className="invisible col-start-1 row-start-1">{finalText}</span>
            <span className="col-start-1 row-start-1 justify-self-end">{animate ? <AnimatedNumber value={waiting ? 0 : value} duration={waiting ? 0 : duration} locale={locale} format={counting} /> : finalText}</span>
          </span>
          {unitText ? <span className={cn("max-w-full font-medium tracking-[-0.03em] text-muted-foreground [overflow-wrap:anywhere]", attached ? "text-[max(1.25rem,0.42em)]" : "text-[max(1rem,0.24em)]", "leading-none")}>{unitText}</span> : null}
        </span>
      </Title>

      {description ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty sm:mt-8 sm:text-xl">{description}</p> : null}

      {origin || dated ? (
        <p className="mt-5 flex max-w-2xl flex-col items-start gap-y-0.5 text-sm text-pretty text-muted-foreground sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-2">
          {/* On a phone the source and the day sit on two lines and the dot is left out; from sm up the dot trails the source, so when the line wraps it ends a line and never starts one. */}
          {origin ? (
            <span>
              {withNode(words.source, "source", origin.href ? <a href={origin.href} className={cn(link, "text-foreground")}>{origin.label}</a> : <span className="text-foreground">{origin.label}</span>)}
              {dated ? (
                <span aria-hidden="true" className="ml-2 max-sm:hidden">
                  &middot;
                </span>
              ) : null}
            </span>
          ) : null}
          {dated ? <span>{withNode(words.asOf, "date", <time dateTime={dated.iso}>{dated.text}</time>)}</span> : null}
        </p>
      ) : null}

      {actions.length ? (
        <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10">
          {actions.map((action, index) => (
            <Button key={`${action.label}-${action.href}`} asChild size="lg" variant={index === 0 ? "default" : "outline"} className="max-sm:w-full">
              <a href={action.href}>
                {action.label}
                {index === 0 ? <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" /> : null}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
