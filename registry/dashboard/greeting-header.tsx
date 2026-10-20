import type { ComponentProps, ReactNode } from "react";

import { IconCheckCircle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface GreetingCount {
  /** How many are waiting. A zero drops out of the sentence. */
  count: number;
  /** What one is called, after the number: "order to ship". */
  one: string;
  /** What several are called: "orders to ship". Defaults to the singular with an s. */
  other?: string;
  /** Where that list lives. The count, with its noun, becomes a link to it. */
  href?: string;
}

export interface GreetingAction {
  /** What the button says: "New order". */
  label: string;
  /** Makes the action a link. Use it in a Server Component, where a function cannot be passed. */
  href?: string;
  /** Called when the action is pressed. On a link it runs as well as the navigation. */
  onClick?: () => void;
  /** An icon before the label: `<IconPlus />`. */
  icon?: ReactNode;
}

export interface GreetingHeaderProps extends Omit<ComponentProps<"header">, "children"> {
  /** Who is being greeted. Leave it out for a greeting on its own. */
  name?: string;
  /** IANA zone of the reader. Decides the greeting and the date, so a server in UTC never says good morning at night. */
  timeZone?: string;
  /** BCP 47 locale for the date and the sentence. */
  locale?: string;
  /** The moment to greet at. Pass it from the server for a first render that matches the browser's; without it the clock is read at render. */
  now?: Date | string | number;
  /** What is waiting. Counts of zero are left out; with nothing left the header says you are all caught up. */
  summary?: readonly GreetingCount[];
  /** The one thing to do next: a button, or a link when it has an `href`. */
  action?: GreetingAction;
  /** Heading level of the greeting. h1 when it is the page's title, h2 when the page has another. */
  headingAs?: "h1" | "h2";
  /** The greeting for each part of the day: morning from 05:00, afternoon from 12:00, evening from 18:00. */
  greetings?: Partial<Record<"morning" | "afternoon" | "evening", string>>;
  /** What comes before the counts. "You have" gives "You have 3 orders to ship and 2 tickets waiting." */
  lead?: string;
  /** The line for when nothing is waiting. */
  allClear?: string;
}

const GREETINGS = { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening" } as const;

const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value));

/** An unknown zone name would throw while rendering; fall back to UTC instead. */
function knownZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}

/** The calendar date as ISO text and the hour (0 to 23) at an instant, in a zone. */
function wallClock(ms: number, timeZone: string): { iso: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(ms);
  const pick = (type: string): string => parts.find((part) => part.type === type)?.value ?? "";
  return { iso: `${pick("year")}-${pick("month")}-${pick("day")}`, hour: Number(pick("hour")) % 24 };
}

function Count({ item, locale, plural }: { item: GreetingCount; locale: string; plural: Intl.PluralRules }): React.JSX.Element {
  const noun = plural.select(item.count) === "one" ? item.one : (item.other ?? `${item.one}s`);
  const text = (
    <>
      <span className="tabular-nums">{new Intl.NumberFormat(locale).format(item.count)}</span> {noun}
    </>
  );
  return item.href ? (
    <a
      href={item.href}
      className="rounded-sm font-medium text-foreground underline decoration-border decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
    >
      {text}
    </a>
  ) : (
    <span className="font-medium text-foreground">{text}</span>
  );
}

/**
 * The top of a dashboard home: "Good afternoon, Anna", today's date, one
 * sentence built from the counts you pass in ("You have 3 orders to ship and
 * 2 tickets waiting") with every count linking to its list, and the one
 * action to take next. The greeting and the date come from the hour and the
 * day in the reader's time zone, so a server running in UTC never says good
 * morning at night and server and browser print the same words. With nothing
 * waiting it says so in a friendly line. It needs no client code: with a link
 * as its action it works in a Server Component.
 */
export function GreetingHeader({
  name,
  timeZone = "UTC",
  locale = "en-US",
  now,
  summary = [],
  action,
  headingAs: Heading = "h1",
  greetings,
  lead = "You have",
  allClear = "You're all caught up. Nothing is waiting for you.",
  className,
  ...props
}: GreetingHeaderProps) {
  const zone = knownZone(timeZone);
  const asked = now === undefined ? Number.NaN : toMs(now);
  const at = Number.isFinite(asked) ? asked : Date.now();
  const { iso, hour } = wallClock(at, zone);
  const period = hour >= 18 || hour < 5 ? "evening" : hour < 12 ? "morning" : "afternoon";
  const greeting = greetings?.[period] ?? GREETINGS[period];
  const date = new Intl.DateTimeFormat(locale, { timeZone: zone, weekday: "long", day: "numeric", month: "long" }).format(at);
  // Without `now` the clock is read at render, so the first browser render can differ from the server's by an hour.
  const volatile = now === undefined;

  const waiting = summary.filter((item) => item.count > 0);
  const plural = new Intl.PluralRules(locale);
  const sentence = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).formatToParts(waiting.map((_, index) => String(index))).map((part, index) => {
    const item = part.type === "element" ? waiting[Number(part.value)] : undefined;
    return item ? <Count key={index} item={item} locale={locale} plural={plural} /> : part.value;
  });

  return (
    <header data-slot="greeting-header" className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8", className)} {...props}>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          <time dateTime={iso} suppressHydrationWarning={volatile}>
            {date}
          </time>
        </p>
        <Heading className="mt-1.5 text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl" suppressHydrationWarning={volatile}>
          {name ? `${greeting}, ${name}` : greeting}
        </Heading>
        <p className="mt-3 flex max-w-xl items-start gap-2 text-base leading-relaxed text-muted-foreground">
          {waiting.length ? (
            <span>
              {lead} {sentence}.
            </span>
          ) : (
            <>
              <IconCheckCircle aria-hidden="true" className="mt-[0.3em] size-4 shrink-0 text-foreground" />
              <span>{allClear}</span>
            </>
          )}
        </p>
      </div>
      {action ? (
        <div className="shrink-0 *:w-full sm:*:w-auto">
          {action.href !== undefined ? (
            <Button asChild size="lg">
              <a href={action.href} onClick={action.onClick}>
                {action.icon}
                {action.label}
              </a>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </header>
  );
}
