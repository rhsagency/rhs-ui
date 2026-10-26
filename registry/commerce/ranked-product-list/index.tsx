import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArrowDown, IconArrowUp, IconPackage, IconStar } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { RankedAddButton } from "@rhs-ui/commerce/ranked-product-list/add-button";
import {
  DEFAULT_PERIODS,
  WORDS,
  fill,
  movementOf,
  type RankedMovement,
  type RankedPeriod,
  type RankedProduct,
  type RankedProductImage,
  type RankedProductListLabels,
} from "@rhs-ui/commerce/ranked-product-list/ranking";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export type { RankedMovement, RankedPeriod, RankedProduct, RankedProductImage, RankedProductListLabels } from "@rhs-ui/commerce/ranked-product-list/ranking";

export interface RankedProductListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The best sellers, best first. A product's rank is its place in the array. */
  items: readonly RankedProduct[];
  /** The period the list shows: the `value` of one of `periods`. The list is controlled, so it shows what you pass for this period. */
  period: string;
  /** The periods to choose from. Defaults to this week, this month and all time. */
  periods?: readonly RankedPeriod[];
  /** Called with the value of the period that was chosen. Fetch or pick the list for it and pass it back as `items` and `period`. Without it the periods are not offered and the list just says which one it shows. */
  onPeriodChange?: (period: string) => void;
  /** Called when a row's Add button is pressed. Return a promise and the button shows it is working; reject it and the button says "Try again" and a screen reader is told. Without it the buttons are left out. */
  onAddToCart?: (item: RankedProduct) => void | Promise<void>;
  /** How many places to show. Without it every product is shown. */
  limit?: number;
  /** Renders the links of the rows. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Draws a product picture: plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: RankedProductImage, className: string) => ReactNode;
  /** ISO 4217 code for the prices. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same prices and numbers. */
  locale?: string;
  /** The heading. Defaults to "Best sellers". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. The names of the products sit one level below. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: RankedProductListLabels;
}

function DefaultImage(image: RankedProductImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt ?? ""} width={image.width} height={image.height} loading="lazy" decoding="async" className={className} />;
}

/** The movement as a small chip: always the word, with an arrow where there is a direction. `decorative` hides a second copy from screen readers, which hear it once, after the name. */
function Movement({ movement, numbers, words, className, decorative }: { movement: RankedMovement | undefined; numbers: Intl.NumberFormat; words: typeof WORDS; className?: string; decorative?: boolean }) {
  const found = movementOf(movement, numbers, words);
  if (!found) return null;
  return (
    <Badge
      data-movement={found.kind}
      aria-hidden={decorative || undefined}
      variant={found.kind === "new" ? "default" : found.kind === "same" ? "muted" : "outline"}
      className={cn("shrink-0 tabular-nums", className)}
    >
      {found.kind === "up" ? <IconArrowUp aria-hidden="true" /> : found.kind === "down" ? <IconArrowDown aria-hidden="true" /> : null}
      {found.text}
    </Badge>
  );
}

/**
 * A best-sellers list people can scan in five seconds: each place has a large rank figure, a picture, the name, the
 * price, a line of proof ("1,240 sold this week", or a rating) and a word for how it moved ("New", "Up 2", "Down 1"),
 * which is always a word as well as an arrow. A control switches the period and tells you when it changed, and the
 * list announces the new period politely. Each row is one link with its own Add button on top. On a wide screen the
 * proof has a column of its own; on a phone the picture shrinks and the proof moves under the name. The list is
 * controlled: you hold the period and pass the products that belong to it.
 */
export function RankedProductList({
  items,
  period,
  periods = DEFAULT_PERIODS,
  onPeriodChange,
  onAddToCart,
  limit,
  linkAs: Link = "a",
  renderImage = DefaultImage,
  currency = "EUR",
  locale = "en-US",
  title,
  description,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: RankedProductListProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const Item = Heading === "h2" ? "h3" : "h4";
  const numbers = new Intl.NumberFormat(locale);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency });
  const shown = limit === undefined ? items : items.slice(0, Math.max(0, Math.floor(limit)));
  const periodLabel = periods.find((entry) => entry.value === period)?.label ?? period;
  const choices = onPeriodChange && periods.length > 1;

  return (
    <section data-slot="ranked-product-list" aria-labelledby={`${id}-title`} className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-xl leading-tight font-medium tracking-[-0.03em] text-balance @3xl:text-2xl">
            {title ?? words.title}
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">{description ?? words.description}</p>
        </div>
        {choices ? (
          <SegmentedControl
            label={words.period}
            options={periods.map((entry) => ({ value: entry.value, label: entry.label }))}
            value={period}
            onValueChange={onPeriodChange}
            className="@max-sm:w-full @max-sm:[&>button]:flex-1 @max-sm:[&>button]:px-1.5"
          />
        ) : (
          <p className="text-sm font-medium">{periodLabel}</p>
        )}
      </header>

      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      ) : (
        <ol role="list" aria-label={fill(words.list, { period: periodLabel })} className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {shown.map((item, index) => {
            const rank = index + 1;
            const available = item.available !== false;
            const hasRating = item.rating !== undefined && Number.isFinite(item.rating);
            const onSale = item.compareAtPrice !== undefined && item.compareAtPrice > item.price;
            return (
              <li
                key={item.id}
                data-slot="ranked-product-list-item"
                data-rank={rank}
                className="relative grid grid-cols-[1.75rem_3rem_minmax(0,1fr)_auto] items-center gap-x-3.5 px-3.5 py-3.5 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none @3xl:grid-cols-[4.75rem_4rem_minmax(0,1fr)_minmax(0,11rem)_6rem_auto] @3xl:gap-x-5 @3xl:px-5 @3xl:py-4"
              >
                {/* The rank, with how it moved under it on a wide list; on a phone the movement sits under the name instead. */}
                <div className="grid justify-items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("text-center text-xl leading-none font-medium tracking-[-0.05em] tabular-nums @3xl:text-3xl", rank <= 3 ? "text-foreground" : "text-muted-foreground")}
                  >
                    {numbers.format(rank)}
                  </span>
                  <Movement movement={item.movement} numbers={numbers} words={words} className="hidden @3xl:inline-flex" decorative />
                </div>

                <span aria-hidden="true" className={cn("relative grid size-12 place-items-center overflow-hidden rounded-lg bg-muted @3xl:size-16", !available && "opacity-60 grayscale")}>
                  {item.image ? renderImage(item.image, "size-full object-cover") : <IconPackage className="size-5 text-muted-foreground" />}
                </span>

                <div className="min-w-0 @3xl:contents">
                  <div className="min-w-0 @3xl:col-start-3 @3xl:row-start-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <Item className="min-w-0 text-sm leading-snug font-medium text-pretty">
                        <Link
                          href={item.href}
                          className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-ring/50"
                        >
                          <span className="sr-only">{fill(words.rank, { rank: numbers.format(rank) })}: </span>
                          {item.name}
                        </Link>
                      </Item>
                      <Movement movement={item.movement} numbers={numbers} words={words} className="@3xl:sr-only" />
                    </div>
                    {item.subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p> : null}
                  </div>

                  {item.proof || hasRating ? (
                    <p className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground @3xl:col-start-4 @3xl:row-start-1 @3xl:mt-0 @3xl:text-sm">
                      {hasRating && item.rating !== undefined ? (
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <IconStar aria-hidden="true" className="size-3.5 fill-current text-foreground" />
                          <span aria-hidden="true" className="font-medium text-foreground">
                            {new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(item.rating)}
                          </span>
                          {item.ratingCount !== undefined ? <span aria-hidden="true">({numbers.format(item.ratingCount)})</span> : null}
                          <span className="sr-only">
                            {fill(words.ratingName, { rating: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(item.rating), count: numbers.format(item.ratingCount ?? 0) })}
                          </span>
                        </span>
                      ) : null}
                      {item.proof ? <span>{item.proof}</span> : null}
                    </p>
                  ) : null}

                  <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm font-medium tabular-nums @3xl:col-start-5 @3xl:row-start-1 @3xl:mt-0 @3xl:flex-col @3xl:items-end @3xl:gap-x-0">
                    <AnimatedPrice value={item.price / 100} currency={currency} locale={locale} className={cn(onSale && "text-foreground")} />
                    {onSale && item.compareAtPrice !== undefined ? (
                      <>
                        <span className="sr-only">{words.was}</span>
                        <s className="text-xs font-normal text-muted-foreground">{money.format(item.compareAtPrice / 100)}</s>
                      </>
                    ) : null}
                  </p>
                </div>

                {onAddToCart ? (
                  <div className="@3xl:col-start-6 @3xl:row-start-1">
                    <RankedAddButton
                      label={words.add}
                      busyLabel={words.adding}
                      addedLabel={words.added}
                      retryLabel={words.retry}
                      soldOutLabel={words.soldOut}
                      name={fill(available ? words.addName : words.soldOutName, { name: item.name })}
                      addedName={fill(words.addedName, { name: item.name })}
                      failedName={fill(words.failedName, { name: item.name })}
                      soldOut={!available}
                      onAdd={() => onAddToCart(item)}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      <p role="status" className="sr-only">
        {shown.length === 1 ? fill(words.statusOne, { period: periodLabel }) : fill(words.status, { period: periodLabel, count: numbers.format(shown.length) })}
      </p>
    </section>
  );
}
