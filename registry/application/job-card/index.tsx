"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { ageText, dateIn, fill, money, shortPay, type DateInput } from "@rhs-ui/application/job-card/format";
import { IconBanknote, IconBriefcase, IconBuilding, IconGlobe, IconHome, IconPin } from "@rhs-ui/icons";
import { IconBookmarkAnimated } from "@rhs-ui/icons/animated/bookmark";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** Where the work happens. */
export type JobWorkMode = "onsite" | "hybrid" | "remote";

/** What the job pays. Every part is optional: with only a minimum it reads "From €85K", with only a maximum "Up to €105K". */
export interface JobSalary {
  /** The lowest amount. */
  min?: number;
  /** The highest amount. */
  max?: number;
  /** The ISO 4217 code of the currency: "EUR", "USD". */
  currency: string;
  /** What the amounts are per. Leave it out for a one-off amount. */
  period?: "hour" | "day" | "week" | "month" | "year";
}

/** The words the card uses, for translation. `{title}`, `{company}`, `{amount}`, `{period}` and `{time}` are filled in. */
export interface JobCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {title} at {company}". */
  save?: string;
  /** Said to screen readers after the title, so the link says whose job it is. Default "at {company}". */
  at?: string;
  /** The label of the place, said to screen readers. Default "Location". */
  location?: string;
  /** The label of how the work is done. Default "Work mode". */
  workMode?: string;
  /** The label of the kind of contract. Default "Employment type". */
  type?: string;
  /** The label of the pay. Default "Pay". */
  salary?: string;
  /** The three ways of working. */
  workModes?: Partial<Record<JobWorkMode, string>>;
  /** A salary with a minimum only. Default "From {amount}". */
  from?: string;
  /** A salary with a maximum only. Default "Up to {amount}". */
  upTo?: string;
  /** A salary with its period. Default "{amount} / {period}". */
  per?: string;
  /** The words for the periods. */
  periods?: Partial<Record<NonNullable<JobSalary["period"]>, string>>;
  /** The line at the foot; `{time}` is the time in words and carries the exact date in a tooltip. Default "Posted {time}". */
  posted?: string;
  /** The mark on a posting under three days old. Default "New". */
  new?: string;
  /** The name of the list of tags. Default "Skills". */
  tags?: string;
  /** What a time under a minute old is called. Default "just now". */
  justNow?: string;
}

export interface JobCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** The job's title: "Senior Product Designer". It is the one link of the card. */
  title: string;
  /** Who is hiring: "Halcyon Freight". */
  company: string;
  /** The company's logo, as an image address. Without one the tile shows the initials of the name. */
  logo?: string;
  /** Where the job is: "Amsterdam, Netherlands". */
  location?: string;
  /** Where the work happens: on site, hybrid or remote. */
  workMode?: JobWorkMode;
  /** The kind of contract, in words: "Full-time", "Contract". */
  type?: string;
  /** What it pays, formatted with Intl in the locale you name. Left out gracefully: with no salary the card has no pay row and no placeholder. */
  salary?: JobSalary;
  /** When it was posted: a Date, a timestamp or an ISO string. A posting under three days old is marked "New" in words. */
  postedAt?: DateInput;
  /** Skills or topics, as tags. */
  tags?: readonly string[];
  /** The posting's page. The title becomes a link and the whole card opens it. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the title becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the job is saved, controlled. The save button is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether the job starts saved, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The save button was pressed, with the state it asks for. Leave it out, and leave `saved` out, and there is no save button. */
  onSave?: (saved: boolean) => void;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the posting's age is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates and the pay. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are counted, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: JobCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {title} at {company}",
  at: "at {company}",
  location: "Location",
  workMode: "Work mode",
  type: "Employment type",
  salary: "Pay",
  from: "From {amount}",
  upTo: "Up to {amount}",
  per: "{amount} / {period}",
  posted: "Posted {time}",
  new: "New",
  tags: "Skills",
  justNow: "just now",
};

const DEFAULT_MODES: Record<JobWorkMode, string> = { onsite: "On site", hybrid: "Hybrid", remote: "Remote" };
const DEFAULT_PERIODS = { hour: "hour", day: "day", week: "week", month: "month", year: "year" };
const MODE_GLYPH: Record<JobWorkMode, ReactNode> = { onsite: <IconBuilding />, hybrid: <IconHome />, remote: <IconGlobe /> };

const DAY = 86_400_000;
/** How young a posting is to count as new. */
const FRESH = 3 * DAY;

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

/**
 * A tooltip that a tap can open. Radix opens one on hover and keyboard focus
 * only and closes it on every click, so on a touch screen the exact date
 * would never show: here a press toggles it, and hover works as it does in
 * every tooltip. The date is also in the text for screen readers.
 */
function Tip({ content, children }: { content: ReactNode; children: ReactElement }): ReactElement {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <Tooltip
      open={open}
      onOpenChange={(next) => {
        // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
        if (!next && pressing.current) return;
        setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        onPointerDown={() => {
          wasOpen.current = open;
        }}
        onClick={() => {
          pressing.current = true;
          setOpen(!wasOpen.current);
          queueMicrotask(() => {
            pressing.current = false;
          });
        }}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent collisionPadding={8} className="tabular-nums">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

/** A template with `{time}` in it, with the time element in its place. */
function withTime(template: string, time: ReactNode): ReactNode {
  return template.split(/(\{time\})/).map((part, index) => (part === "{time}" ? <Fragment key={index}>{time}</Fragment> : part));
}

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A job opening as a card, for a careers page, a job board or a recruiter's
 * list: the company with its logo, the title as the one link of the card, and
 * the facts as a real definition list with a glyph each: place, how the work
 * is done (on site, hybrid, remote), the kind of contract and the pay, which
 * is formatted with Intl in your locale and simply not there when the posting
 * names none. Skills are tags. At the foot, how old the posting is in words
 * with the exact date on hover, and "New" in words when it is under three
 * days old. The save button is a toggle with `aria-pressed` whose name says
 * which job it saves; it is its own target above the card's link.
 */
export function JobCard({
  title,
  company,
  logo,
  location,
  workMode,
  type,
  salary,
  postedAt,
  tags,
  href,
  onOpen,
  saved: controlled,
  defaultSaved = false,
  onSave,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: JobCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const modes = { ...DEFAULT_MODES, ...labels?.workModes };
  const periods = { ...DEFAULT_PERIODS, ...labels?.periods };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [own, setOwn] = useState(defaultSaved);
  const saved = controlled ?? own;
  const posted = postedAt === undefined ? Number.NaN : new Date(postedAt).getTime();
  const clock = useNow(now, !Number.isNaN(posted));
  const fresh = clock !== null && !Number.isNaN(posted) && clock - posted >= 0 && clock - posted < FRESH;
  const exact = Number.isNaN(posted) ? "" : dateIn(posted, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  // Before the clock is known the server and the first paint write the date, never a guess at "ago".
  const when = Number.isNaN(posted) ? "" : clock === null ? dateIn(posted, locale, timeZone, { day: "numeric", month: "short", year: "numeric" }) : ageText(posted, clock, locale, timeZone, text.justNow);
  const canSave = onSave !== undefined || controlled !== undefined;

  let pay = "";
  if (salary && (salary.min !== undefined || salary.max !== undefined)) {
    // One style for the whole range: "€9.5K – €12.5K", never "€9,500 – €12.5K".
    const short = shortPay(salary.min, salary.max);
    const low = salary.min === undefined ? "" : money(salary.min, salary.currency, locale, short);
    const high = salary.max === undefined ? "" : money(salary.max, salary.currency, locale, short);
    const amount = low && high ? (low === high ? low : `${low} – ${high}`) : low ? fill(text.from, { amount: low }) : fill(text.upTo, { amount: high });
    pay = salary.period ? fill(text.per, { amount, period: periods[salary.period] }) : amount;
  }

  const facts: { key: string; label: string; glyph: ReactNode; value: string }[] = [];
  if (location) facts.push({ key: "location", label: text.location, glyph: <IconPin />, value: location });
  if (workMode) facts.push({ key: "mode", label: text.workMode, glyph: MODE_GLYPH[workMode], value: modes[workMode] });
  if (type) facts.push({ key: "type", label: text.type, glyph: <IconBriefcase />, value: type });
  if (pay) facts.push({ key: "pay", label: text.salary, glyph: <IconBanknote />, value: pay });

  const name = (
    <>
      <span className="[overflow-wrap:anywhere]">{title}</span>
      <span className="sr-only"> {fill(text.at, { company })}</span>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <article
        data-slot="job-card"
        data-work-mode={workMode}
        aria-labelledby={titleId}
        className={cn(
          "group/job-card @container relative flex min-w-0 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
          "has-[[data-slot=job-card-open]:focus-visible]:border-ring has-[[data-slot=job-card-open]:focus-visible]:ring-[3px] has-[[data-slot=job-card-open]:focus-visible]:ring-ring/40",
          (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
          className,
        )}
        {...props}
      >
        <div className="flex items-center gap-3">
          <Avatar size="sm" className="rounded-lg border border-border bg-background data-[size=sm]:size-9">
            {logo ? <AvatarImage src={logo} alt="" className="object-contain p-1" /> : null}
            <AvatarFallback className="rounded-lg bg-muted text-[0.6875rem] font-semibold tracking-[-0.02em]">{initialsOf(company)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 flex-1 text-sm leading-5 font-medium text-muted-foreground [overflow-wrap:anywhere]">{company}</p>
          {canSave ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-pressed={saved}
              aria-label={fill(text.save, { title, company })}
              onClick={() => {
                if (controlled === undefined) setOwn(!saved);
                onSave?.(!saved);
              }}
              className={cn("relative z-10 -my-1 -mr-1.5 shrink-0 text-muted-foreground hover:text-foreground", saved && "text-foreground")}
            >
              <IconBookmarkAnimated active={saved} className="size-[1.125rem]" />
            </Button>
          ) : null}
        </div>

        <Heading id={titleId} className="-mt-1 text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em]">
          {href ? (
            <a data-slot="job-card-open" href={href} onClick={onOpen} className={OPEN}>
              {name}
            </a>
          ) : onOpen ? (
            <button data-slot="job-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
              {name}
            </button>
          ) : (
            name
          )}
        </Heading>

        {facts.length ? (
          <dl className="grid gap-x-5 gap-y-2 text-sm leading-5 @sm:grid-cols-2">
            {facts.map((fact) => (
              <div key={fact.key} className="min-w-0">
                <dt className="sr-only">{fact.label}</dt>
                <dd className="flex items-start gap-2 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground">
                  {fact.glyph}
                  <span className="min-w-0 [overflow-wrap:anywhere]">{fact.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {tags?.length ? (
          <ul aria-label={text.tags} className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {!Number.isNaN(posted) ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-t border-border pt-3.5 text-[0.8125rem] leading-5 text-muted-foreground">
            {fresh ? <Badge variant="default">{text.new}</Badge> : null}
            <span>
              {withTime(
                text.posted,
                <Tip content={exact}>
                  <time dateTime={new Date(posted).toISOString()} className="relative z-10 cursor-default tabular-nums decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:underline [@media(hover:none)]:cursor-pointer">
                    {when}
                    <span className="sr-only">{`, ${exact}`}</span>
                  </time>
                </Tip>,
              )}
            </span>
          </div>
        ) : null}
      </article>
    </TooltipProvider>
  );
}
