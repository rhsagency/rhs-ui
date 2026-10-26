"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { WORDS, fill, slicesOf, type PricePart, type PriceTransparencyLabels } from "@rhs-ui/commerce/price-transparency/parts";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { PricePart, PriceTransparencyLabels } from "@rhs-ui/commerce/price-transparency/parts";

export interface PriceTransparencyProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** What the customer pays, in minor units: 14800 is 148.00. It is written large, and it is what the bar adds up to. */
  price: number;
  /** What the price pays for, in the order they are drawn. A part with no money in it is left out. When they add up to less than the price, the rest is drawn as "Other costs"; when they add up to more, the price is what they add up to. With no usable part the bar and the list are left out and the price stands alone, so a product without cost data is never shown as free. */
  parts: readonly PricePart[];
  /** What the same product typically costs in the shops, in minor units. It is shown beside the price, with how much lower the price is when it is lower. */
  retail?: number;
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same amounts and percentages. */
  locale?: string;
  /** Small print under everything: what the figures are based on and when they were last checked. */
  note?: ReactNode;
  /** The heading. Defaults to "Where the money goes". */
  title?: string;
  /** The line under it: which product this is about. */
  description?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: PriceTransparencyLabels;
}

/** The tones of the bar, from the strongest to the faintest and, after the sixth, two that sit between them, so neighbours differ without a second colour. Whole class names, because Tailwind reads the source text. */
const TONES = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/28", "bg-foreground/15", "bg-foreground/8", "bg-foreground/85", "bg-foreground/36"] as const;

/**
 * Shows where the money goes: the price, one bar split into what it pays for (materials, making, shipping and
 * duties, margin) and the same parts as a list with an amount and a share each, so the bar is never the only thing
 * that carries a number. The bar is computed from the parts, so it always adds up to the price and so do the
 * whole percentages. A part can explain itself in one line in a popover, hovering a part lights it in the bar, and
 * an optional typical retail price sits beside the price for comparison. It builds trust for direct-to-consumer
 * brands without a long about page.
 */
export function PriceTransparency({ price, parts, retail, currency = "EUR", locale = "en-US", note, title, description, headingAs: Heading = "h2", labels, className, ...props }: PriceTransparencyProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const { slices, total } = slicesOf(parts, price, words.other);
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const lower = retail !== undefined && Number.isFinite(retail) && retail > total && total > 0;
  const hasRetail = retail !== undefined && Number.isFinite(retail) && retail > 0;

  return (
    <section
      data-slot="price-transparency"
      aria-labelledby={`${id}-title`}
      className={cn("@container min-w-0 rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      {/* The padding sits on a child: a container query cannot style the container it is declared on. */}
      <div className="grid gap-7 p-5 @2xl:p-7">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div className="min-w-0">
            <Heading id={`${id}-title`} className="text-xl leading-tight font-medium tracking-[-0.03em] text-balance">
              {title ?? words.title}
            </Heading>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <p className="text-4xl leading-none font-medium tracking-[-0.045em] tabular-nums @2xl:text-5xl">
            <AnimatedPrice value={total / 100} currency={currency} locale={locale} />
          </p>
        </header>

        {slices.length > 0 ? (
          <div className="grid gap-5">
            <div aria-hidden="true" className="flex h-5 gap-0.5" onMouseLeave={() => setActive(null)}>
              {slices.map((slice, index) => (
                <span
                  key={`${slice.label}-${index}`}
                  onMouseEnter={() => setActive(index)}
                  style={{ flexGrow: slice.amount }}
                  className={cn(
                    "min-w-1 basis-0 rounded-[3px] transition-transform duration-150 first:rounded-l-md last:rounded-r-md motion-reduce:transition-none",
                    slice.other ? "border border-dashed border-foreground/35" : TONES[slice.tone % TONES.length],
                    active === index && "scale-y-[1.4]",
                  )}
                />
              ))}
            </div>

            <ul aria-label={words.list} role="list" className="divide-y divide-border border-y border-border">
              {slices.map((slice, index) => (
                <li
                  key={`${slice.label}-${index}`}
                  data-active={active === index}
                  onMouseEnter={() => setActive(index)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className="relative isolate grid grid-cols-[auto_minmax(0,1fr)_auto_3rem] items-center gap-x-3 py-3 text-sm before:absolute before:inset-y-0 before:-inset-x-2.5 before:-z-10 before:rounded-lg before:bg-muted/70 before:opacity-0 before:transition-opacity before:duration-150 data-[active=true]:before:opacity-100 motion-reduce:before:transition-none @2xl:gap-x-4"
                >
                  <span
                    aria-hidden="true"
                    className={cn("size-3 shrink-0 rounded-[4px]", slice.other ? "border border-dashed border-foreground/40" : TONES[slice.tone % TONES.length])}
                  />
                  <span className={cn("min-w-0 leading-snug", slice.other && "text-muted-foreground")}>
                    {slice.note ? (
                      <Popover>
                        <PopoverTrigger className="rounded-sm text-left font-medium underline decoration-muted-foreground/60 decoration-dotted underline-offset-[5px] outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:decoration-foreground motion-reduce:transition-none">
                          {slice.label}
                          <span className="sr-only"> ({fill(words.explain, { label: slice.label })})</span>
                        </PopoverTrigger>
                        <PopoverContent align="start" aria-label={slice.label} className="w-72 max-w-[calc(100vw-2rem)]">
                          <p className="text-sm font-medium tabular-nums">
                            {slice.label}, {money(slice.amount)}
                          </p>
                          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{slice.note}</p>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="font-medium">{slice.label}</span>
                    )}
                  </span>
                  <span className="text-right font-medium tabular-nums">{money(slice.amount)}</span>
                  <span className="text-right text-muted-foreground tabular-nums">{slice.share === 0 ? words.lessThanOne : percent.format(slice.share / 100)}</span>
                </li>
              ))}
            </ul>

            <p className="flex items-baseline justify-between gap-4 text-sm font-medium">
              <span>{words.total}</span>
              <span className="tabular-nums">{money(total)}</span>
            </p>
          </div>
        ) : null}

        {hasRetail && retail !== undefined ? (
          <div className="grid gap-3.5 rounded-lg border border-border bg-muted/40 p-4">
            {lower ? <p className="text-sm font-medium text-pretty">{fill(words.saving, { percent: percent.format(1 - total / retail) })}</p> : null}
            {lower ? (
              <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-border">
                <span className="block h-full rounded-full bg-foreground" style={{ width: `${Math.min(100, (total / retail) * 100)}%` }} />
              </div>
            ) : null}
            <dl className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{words.thisPrice}</dt>
                <dd className="font-medium tabular-nums">{money(total)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-xs text-muted-foreground">{words.retail}</dt>
                <dd className="font-medium tabular-nums">{money(retail)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {note ? <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{note}</p> : null}
      </div>
    </section>
  );
}
