import { useId, type ComponentProps, type CSSProperties } from "react";

import { CountUp } from "@rhs-ui/motion/count-up";
import { cn } from "@/lib/utils";

export interface HeadlineStatSupport {
  /** The figure, as you want it written: "98.7%", "41", "12 min". */
  value: string;
  /** What it counts, in a short phrase. */
  label: string;
}

export interface HeadlineStatSource {
  /** Where the numbers come from and what they cover: "Halcyon delivery data, 1 January to 31 October 2026." */
  text: string;
  /** A page behind the source. A full address to another site opens in a new tab and says so. */
  href?: string;
}

export interface HeadlineStatLabels {
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
}

export interface HeadlineStatProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The one big figure. A number counts up once as it scrolls into view; a string, such as "A+" or "24/7", is set as it is. */
  value: number | string;
  /** Text before the figure: "$", "€". */
  prefix?: string;
  /** Text after the figure, set at the same size: "M", "%", "k". */
  suffix?: string;
  /** Digits after the decimal point of a number: `2.4` with `decimals={1}`. */
  decimals?: number;
  /** The locale of a number's digits and separators. Default "en-US". */
  locale?: string;
  /** What the figure counts, in a phrase: "parcels delivered in 2026". It is the heading of the section. */
  label: string;
  /** One sentence of context under the label. */
  description?: string;
  /** Three smaller figures that back the claim up. Two to four work; more turns it back into a row of equal stats. */
  supporting?: readonly HeadlineStatSupport[];
  /** The source line, small, under everything. */
  source?: HeadlineStatSource;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<HeadlineStatLabels>;
}

const LABELS: HeadlineStatLabels = { newTab: "opens in a new tab" };

const EXTERNAL = /^https?:\/\//i;

/** The figure as it will read once the count has finished, so its size can be worked out before it runs. */
function writtenFigure(value: number | string, prefix: string, suffix: string, decimals: number, locale: string): string {
  if (typeof value === "string") return `${prefix}${value}${suffix}`;
  try {
    return `${prefix}${new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)}${suffix}`;
  } catch {
    // A locale the browser does not know must not take the page down.
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  }
}

/**
 * One claim, remembered: a single figure set enormous with the sentence that
 * explains it, backed by a short list of smaller figures between hairlines and
 * an honest source line. A number counts up once as it scrolls into view and
 * stands still under reduced motion; its final value is in the page from the
 * first render, so screen readers, search engines and print all read it at
 * once. The figure is sized to its column from the length it will have, so a
 * long one such as "$128.4M" shrinks to fit instead of running over, and a
 * short one is as large as the column allows. One dominant number with three
 * footnotes is remembered where a row of four equal stats is skimmed. No state
 * of its own, so it renders on the server.
 */
export function HeadlineStat({ value, prefix = "", suffix = "", decimals = 0, locale = "en-US", label, description, supporting = [], source, labels, className, ...props }: HeadlineStatProps) {
  const heading = useId();
  const words = { ...LABELS, ...labels };
  const characters = Math.max(2, writtenFigure(value, prefix, suffix, decimals, locale).length);
  // The size is the smaller of the cap and what the column holds at about 0.62em a character.
  const figure = { "--stat-chars": characters, fontSize: "min(10rem, calc(100cqw / (var(--stat-chars) * 0.62)))" } as CSSProperties;
  const external = source?.href ? EXTERNAL.test(source.href) : false;

  return (
    <section data-slot="headline-stat" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <div className="grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end lg:gap-24">
        <div className="@container min-w-0">
          <p style={figure} className="leading-[0.88] font-medium tracking-[-0.05em] whitespace-nowrap">
            {typeof value === "number" ? (
              <CountUp value={value} prefix={prefix} suffix={suffix} decimals={decimals} locale={locale} />
            ) : (
              <>
                {prefix}
                {value}
                {suffix}
              </>
            )}
          </p>
          <h2 id={heading} className="mt-7 text-xl font-medium tracking-[-0.02em] text-balance sm:text-2xl">
            {label}
          </h2>
          {description ? <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </div>
        {supporting.length ? (
          <dl className="border-b border-border">
            {supporting.map((stat) => (
              <div key={`${stat.label}-${stat.value}`} className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] items-baseline gap-x-6 border-t border-border py-5">
                <dt className="col-start-2 row-start-1 text-sm text-pretty text-muted-foreground">{stat.label}</dt>
                <dd className="col-start-1 row-start-1 text-3xl leading-none font-medium tracking-[-0.045em] whitespace-nowrap tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      {source ? (
        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {source.href ? (
            <a
              href={source.href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rounded-sm underline decoration-border decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              {source.text}
              {external ? <span className="sr-only"> ({words.newTab})</span> : null}
            </a>
          ) : (
            source.text
          )}
        </p>
      ) : null}
    </section>
  );
}
