import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconCheck, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ServiceStartRequirement {
  /** What to have ready, in a few words: "Your ID". */
  label: string;
  /** One line that says what counts: "A passport, ID card or driving licence". */
  hint?: string;
}

export interface ServiceStartAlternative {
  /** The other way, as a short phrase: "By post". */
  label: string;
  /** Where it is explained. */
  href: string;
}

export interface ServiceStartLabels {
  /** The heading over the list of what to have ready. */
  before: string;
  /** The words in front of the other ways to apply. */
  alternatives: string;
  /** The words in front of the date the page was last changed. */
  updated: string;
}

export interface ServiceStartHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h1" by default, because the start page of a service is a page of its own; "h2" inside a page that already has an h1. The list heading sits one level below it. */
  titleAs?: "h1" | "h2";
  /** What the service is, in the words people use for it: "Apply for a resident parking permit". */
  title: string;
  /** One or two sentences: who it is for, what happens at the end and how soon. */
  lead: string;
  /** The one action. It is a link to the first step of the service, so it works without script and opens in a new tab like any link. */
  start: { label: string; href: string };
  /** How long the service takes, written as a sentence: "Takes about 10 minutes". It sits beside the button and is read with it. */
  duration: string;
  /** What to have ready before the first step, in the order it is asked for. */
  requirements: readonly ServiceStartRequirement[];
  /** Other ways to reach the same result, as a quiet line of links under the list. */
  alternatives?: readonly ServiceStartAlternative[];
  /** When the page was last changed: a Date, or a day written as "2026-10-21". Shown in a time element. */
  updatedAt?: Date | string;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar day is shown when `updatedAt` is a Date, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ServiceStartLabels>;
}

const LABELS: ServiceStartLabels = {
  before: "Before you start",
  alternatives: "Other ways to apply",
  updated: "Last updated",
};

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * The day to print and its machine-readable form. A day written as
 * "2026-10-21" is a calendar date, not a moment: it is shown as that day in
 * every zone. A Date is a moment, so it is read in `timeZone`.
 */
function dayOf(value: Date | string, locale: string, timeZone: string): { text: string; iso: string } | null {
  const match = typeof value === "string" ? DAY.exec(value) : null;
  const format = (at: number, zone: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: zone }).format(at);
  if (match) {
    const at = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
    return Number.isNaN(at) ? null : { text: format(at, "UTC"), iso: value as string };
  }
  const at = new Date(value).getTime();
  if (Number.isNaN(at)) return null;
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(at);
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return { text: format(at, timeZone), iso: `${part("year")}-${part("month")}-${part("day")}` };
}

const LINK = "rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The page a service starts on, with nothing else on it: what the service is,
 * how long it takes, one large Start button, and a list of what to have
 * ready so nobody gets halfway and has to stop. Other ways to apply are one
 * quiet line, and the date the page was last checked sits in a time element.
 * Everything is text and one link, set in the strongest contrast the theme
 * has, with no image to load or wait for. For public bodies, insurers, banks
 * and any flow people dread, where clarity beats persuasion.
 */
export function ServiceStartHero({
  titleAs: Title = "h1",
  title,
  lead,
  start,
  duration,
  requirements,
  alternatives = [],
  updatedAt,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: ServiceStartHeroProps) {
  const words = { ...LABELS, ...labels };
  const id = useId();
  const List = Title === "h1" ? "h2" : "h3";
  const updated = updatedAt === undefined ? null : dayOf(updatedAt, locale, timeZone);

  return (
    <section data-slot="service-start-hero" className={cn("py-14 sm:py-20 lg:py-24", className)} {...props}>
      <div className="max-w-3xl">
        <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance text-foreground sm:text-5xl lg:text-6xl">{title}</Title>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-foreground sm:text-xl">{lead}</p>

        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
          {/* The start button grows to a second line for a longer label, in any language, instead of being cut off. */}
          <Button asChild size="lg" className="h-auto min-h-12 max-w-full px-7 py-[0.6875rem] text-center text-base whitespace-normal text-balance max-sm:w-full">
            <a href={start.href} aria-describedby={`${id}-duration`}>
              {start.label}
              <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          </Button>
          <p id={`${id}-duration`} className="flex items-center gap-2 text-base text-foreground">
            <IconClock className="size-4 shrink-0" />
            {duration}
          </p>
        </div>

        {requirements.length ? (
          <div className="mt-14 sm:mt-16">
            <List className="text-xl font-medium tracking-[-0.02em] sm:text-2xl">{words.before}</List>
            <ul className="mt-6 divide-y divide-border border-y border-border">
              {requirements.map((item) => (
                <li key={item.label} className="flex items-start gap-4 py-4 sm:py-5">
                  <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-foreground text-foreground">
                    <IconCheck className="size-3.5" strokeWidth={2.25} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base leading-snug font-medium text-foreground sm:text-lg">{item.label}</span>
                    {item.hint ? <span className="mt-1 block text-[0.9375rem] leading-relaxed text-muted-foreground">{item.hint}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {alternatives.length ? (
          <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 text-base">
            <p id={`${id}-alternatives`} className="text-muted-foreground">
              {words.alternatives}
            </p>
            <ul aria-labelledby={`${id}-alternatives`} className="flex flex-wrap gap-x-5 gap-y-2">
              {alternatives.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <a href={item.href} className={LINK}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {updated ? (
          <p className="mt-10 text-sm text-muted-foreground">
            {words.updated} <time dateTime={updated.iso}>{updated.text}</time>
          </p>
        ) : null}
      </div>
    </section>
  );
}
