"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { countText, durationText, fill, priceText } from "@rhs-ui/application/service-card/format";
import { IconArrowRight, IconCheck, IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. `{name}` and `{count}` are filled in. */
export interface ServiceCardLabels {
  /** The name of the list of what is included, said to screen readers. Default "Included". */
  included?: string;
  /** The label of the length, read together with its value. Default "Duration". */
  duration?: string;
  /** The label of the price, read together with its value. Default "Price". */
  price?: string;
  /** Before a price that is the lowest of several. Default "from". */
  from?: string;
  /** What a price of nothing says. Default "Free". */
  free?: string;
  /** The number of choices behind a from-price. Default "{count} options". */
  options?: string;
  /** Hours in the length of the service. Default "{count} h". */
  hours?: string;
  /** Minutes in the length of the service. Default "{count} min". */
  minutes?: string;
  /** The action of a card you pick, when it is not picked. Default "Select". */
  select?: string;
  /** The action of a card you have picked. Default "Selected". */
  selected?: string;
  /** The action of a card that links to its booking page. Default "Book". */
  book?: string;
  /** The name of the booking link. Default "Book {name}". */
  bookFor?: string;
}

export interface ServiceCardProps extends Omit<ComponentProps<"article">, "children" | "onSelect"> {
  /** What the service is called: "Signature cut". */
  name: string;
  /** One or two lines on what it is. */
  description?: string;
  /** How long it takes: a number of minutes (written "45 min", "1 h 30 min") or your own words ("Half a day"). */
  duration?: number | string;
  /** What it costs: a number is written in the currency and locale you name, in tabular numerals ("€60", "€59.50"; 0 says "Free"); a string is shown as you wrote it ("On request"). */
  price?: number | string;
  /** The ISO 4217 code of the currency of a numeric price. Default "EUR". */
  currency?: string;
  /** The price is the lowest of several: it is written "from €60". Set automatically when `options` is more than one. */
  priceFrom?: boolean;
  /** How many variants the service comes in. Two or more write "from" before the price and "3 options" after it. */
  options?: number;
  /** What is included, as a short check list. */
  includes?: readonly string[];
  /** A word on the card: "Most booked", "New". */
  badge?: string;
  /** Whether the service is picked, controlled. Giving it (or `onSelect`) makes the action a toggle with `aria-pressed`, and the whole card a place to click. */
  selected?: boolean;
  /** Whether the service starts picked, when you do not control `selected`. */
  defaultSelected?: boolean;
  /** The action was pressed, with the state it asks for. */
  onSelect?: (selected: boolean) => void;
  /** The service's page. Without `onSelect` the action becomes a link to it ("Book"); with `onSelect` the name becomes a link to it. */
  href?: string;
  /** Why the service cannot be booked: "Fully booked until 14 Nov". It is said on the card, the action is disabled, and the reason is what the action is described by. */
  unavailable?: string;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: ServiceCardLabels;
}

const DEFAULT_LABELS = {
  included: "Included",
  duration: "Duration",
  price: "Price",
  from: "from",
  free: "Free",
  options: "{count} options",
  hours: "{count} h",
  minutes: "{count} min",
  select: "Select",
  selected: "Selected",
  book: "Book",
  bookFor: "Book {name}",
};

/** A label over a value, read as a pair by a screen reader and seen as one. */
function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-4 text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-sm leading-5 tabular-nums">{children}</dd>
    </div>
  );
}

/**
 * A bookable service for a salon, a clinic, a studio or a repair shop: its
 * name and what it is, a short check list of what is included, and the length
 * and the price as a labelled pair that a screen reader reads as such
 * ("Duration: 45 min", "Price: from €60, 3 options"). A service with variants
 * says "from" and counts its options. The action is a toggle: picked, it shows
 * a check, a heavier border and `aria-pressed`, and the whole card is a place
 * to click. With a link instead of a handler the action is "Book". A service
 * that cannot be booked says why on the card, mutes, and keeps a disabled
 * action that is described by the reason, so it stays findable by keyboard.
 */
export function ServiceCard({
  name,
  description,
  duration,
  price,
  currency = "EUR",
  priceFrom = false,
  options,
  includes,
  badge,
  selected: controlled,
  defaultSelected = false,
  onSelect,
  href,
  unavailable,
  headingLevel = 3,
  locale = "en-US",
  labels,
  className,
  ...props
}: ServiceCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const reasonId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [own, setOwn] = useState(defaultSelected);
  const selected = controlled ?? own;
  const selectable = onSelect !== undefined || controlled !== undefined;
  const blocked = Boolean(unavailable);
  const many = options !== undefined && options > 1;
  const from = priceFrom || many;
  const length = typeof duration === "number" ? durationText(duration, text.hours, text.minutes) : duration;
  const cost = price === undefined ? null : typeof price === "number" ? (price === 0 ? text.free : priceText(price, currency, locale)) : price;

  function toggle() {
    if (blocked) return;
    if (controlled === undefined) setOwn(!selected);
    onSelect?.(!selected);
  }

  const action = selectable ? (
    <Button
      type="button"
      size="sm"
      variant={selected && !blocked ? "default" : "outline"}
      aria-pressed={selected}
      aria-disabled={blocked || undefined}
      aria-describedby={blocked ? reasonId : undefined}
      // The button does not sink a pixel when pressed: a transform would make it the containing block of the overlay, and the press would let go of the card.
      onClick={toggle}
      className="ml-auto shrink-0 after:absolute after:inset-0 after:rounded-xl after:content-[''] active:not-disabled:translate-none aria-disabled:pointer-events-none aria-disabled:opacity-50"
    >
      {selected && !blocked ? <IconCheck strokeWidth={2.25} /> : null}
      {selected && !blocked ? text.selected : text.select}
      {/* Its name is the words on it and then the service, so a voice control that says what it sees reaches it, and a list of them is not a list of "Select". */}
      <span className="sr-only"> {name}</span>
    </Button>
  ) : href ? (
    <Button asChild size="sm" variant="outline" className="ml-auto shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50">
      <a
        href={blocked ? undefined : href}
        role={blocked ? "link" : undefined}
        aria-label={fill(text.bookFor, { name })}
        aria-disabled={blocked || undefined}
        aria-describedby={blocked ? reasonId : undefined}
      >
        {text.book}
        <IconArrowRight />
      </a>
    </Button>
  ) : null;

  const title = <span className="[overflow-wrap:anywhere]">{name}</span>;

  return (
    <article
      data-slot="service-card"
      data-selected={selected && selectable ? "" : undefined}
      data-unavailable={blocked ? "" : undefined}
      aria-labelledby={nameId}
      className={cn(
        "group/service-card @container relative flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none",
        selectable && !blocked && "hover:border-foreground/30 hover:shadow-sm has-[button:active]:bg-muted/50",
        selectable && selected && !blocked && "border-foreground ring-1 ring-foreground hover:border-foreground",
        blocked && "bg-muted/40",
        className,
      )}
      {...props}
    >
      <div className="grid grid-cols-1 gap-1.5">
        {/* With a badge, a narrow card puts it above the name, so the name never gets squeezed into a few letters a line. */}
        <div className={cn("flex items-start gap-3", badge && "flex-col gap-2 @[17rem]:flex-row @[17rem]:gap-3")}>
          <Heading id={nameId} className={cn("min-w-0 flex-1 text-[0.9375rem] leading-6 font-semibold tracking-[-0.01em] text-balance", badge && "order-2 @[17rem]:order-none", blocked && "text-muted-foreground")}>
            {selectable && href ? (
              <a href={href} className="relative z-10 rounded-sm underline decoration-transparent underline-offset-4 outline-none transition-[text-decoration-color] duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {title}
              </a>
            ) : (
              title
            )}
          </Heading>
          {badge || selectable ? (
            <div className={cn("flex shrink-0 items-center gap-2", badge && "order-1 w-full justify-between @[17rem]:order-none @[17rem]:w-auto @[17rem]:justify-end")}>
              {badge ? (
                <Badge variant="secondary" className="max-w-full">
                  <span className="truncate">{badge}</span>
                </Badge>
              ) : null}
              {selectable ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 place-items-center rounded-full bg-primary text-primary-foreground transition-[opacity,scale] duration-200 motion-reduce:transition-none",
                    selected && !blocked ? "scale-100 opacity-100" : "scale-50 opacity-0",
                  )}
                >
                  <IconCheck className="size-3.5" strokeWidth={2.25} />
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        {description ? <p className="text-sm leading-5 text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      {includes?.length ? (
        <ul aria-label={text.included} className={cn("grid grid-cols-1 gap-2 text-sm leading-5", blocked && "text-muted-foreground")}>
          {includes.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <IconCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {blocked ? (
        <p id={reasonId} className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[0.8125rem] leading-5">
          <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{unavailable}</span>
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-border pt-4">
        {length || cost !== null ? (
          <dl className="flex flex-wrap gap-x-7 gap-y-2">
            {length ? <Fact term={text.duration}>{length}</Fact> : null}
            {cost !== null ? (
              <Fact term={text.price}>
                <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", blocked && "text-muted-foreground")}>
                  {from && typeof price === "number" ? <span className="text-muted-foreground">{text.from}</span> : null}
                  <span className="text-base leading-5 font-semibold tracking-[-0.01em]">{cost}</span>
                  {many ? (
                    <span className="text-muted-foreground">
                      <span aria-hidden="true" className="mr-1.5">
                        ·
                      </span>
                      <span className="sr-only">, </span>
                      {fill(text.options, { count: countText(options ?? 0, locale) })}
                    </span>
                  ) : null}
                </span>
              </Fact>
            ) : null}
          </dl>
        ) : null}
        {action}
      </div>
    </article>
  );
}
