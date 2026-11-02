"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { countText, dateIn, dayNumber, fill, moneyText, percentText, type DateInput } from "@rhs-ui/application/fundraiser-card/format";
import { IconCalendar, IconCheck, IconImage } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** Who runs the fundraiser. */
export interface FundraiserOrganiser {
  /** Their name, or the name of the group: "Amira Haddad". */
  name: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** The picture at the top. */
export interface FundraiserImage {
  /** The picture's address. */
  src: string;
  /** What it shows. Leave it out for a picture that only decorates, which is the usual case: the title is written right under it. */
  alt?: string;
}

/** The words the card uses, for translation. `{goal}`, `{amount}`, `{title}`, `{name}`, `{date}` and `{count}` are filled in. */
export interface FundraiserCardLabels {
  /** The words after the amount raised: "{amount} raised of {goal}". Default "raised of {goal}". */
  raisedOf?: string;
  /** The name of the progress bar. Default "Fundraising progress". */
  progress?: string;
  /** What the progress bar says in words. Default "{raised} raised of {goal}". */
  progressValue?: string;
  /** What a campaign at or over its goal says in place of the percentage. Default "Goal reached". */
  reached?: string;
  /** The label of the number of donors. Default "Donors". */
  donors?: string;
  /** The label of the days left. Default "Days left". */
  daysLeft?: string;
  /** The label of a campaign that ends today, or before the clock is known. Default "Ends". */
  ends?: string;
  /** The value of a campaign that ends today. Default "Today". */
  today?: string;
  /** What an ended campaign says in place of the button. Default "Ended on {date}". */
  ended?: string;
  /** Said to screen readers before the organiser. Default "Organised by". */
  organiser?: string;
  /** The button. Default "Donate". */
  donate?: string;
  /** The name of the button. Default "Donate to {title}". */
  donateTo?: string;
  /** Said when the picture did not load. Default "Photo unavailable". */
  photoFailed?: string;
}

export interface FundraiserCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** What the fundraiser is for: "Rebuild the Maple Street playground". */
  title: string;
  /** A picture for the campaign. If it does not load, a quiet tile of the same shape says so. */
  image?: string | FundraiserImage;
  /** The story in a line or two. Cut to three lines. */
  summary?: string;
  /** How much has been raised, in whole units of the currency: 4820 is €4,820. */
  raised: number;
  /** What the campaign hopes to raise, in the same units. */
  goal: number;
  /** The ISO 4217 code of the currency. Default "EUR". */
  currency?: string;
  /** How many people have given. */
  donors?: number;
  /** When the campaign ends: a Date, a timestamp or an ISO string with its offset. Days left are counted in `timeZone`; once it has passed the card says "Ended on 3 Oct" and hides the button. */
  endsAt?: DateInput;
  /** Who runs it, credited with an avatar at the foot. */
  organiser?: FundraiserOrganiser;
  /** The Donate button was pressed. Leave it out and there is no button. A campaign that has reached its goal keeps the button: gifts are still welcome. */
  onDonate?: () => void;
  /** The campaign's page. The title becomes a link and the whole card opens it; the Donate button stays its own target. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the title becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the days left are counted from. Leave it out to use the browser's clock, read once the page is live (until then the end date is written); pass it to get the same card in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the amounts and dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are counted, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: FundraiserCardLabels;
}

const DEFAULT_LABELS = {
  raisedOf: "raised of {goal}",
  progress: "Fundraising progress",
  progressValue: "{raised} raised of {goal}",
  reached: "Goal reached",
  donors: "Donors",
  daysLeft: "Days left",
  ends: "Ends",
  today: "Today",
  ended: "Ended on {date}",
  organiser: "Organised by",
  donate: "Donate",
  donateTo: "Donate to {title}",
  photoFailed: "Photo unavailable",
};

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

/** A label over a value, read as a pair by a screen reader and seen as one. */
function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-4 text-muted-foreground">{term}</dt>
      <dd className="mt-1 text-base leading-5 font-semibold tracking-[-0.01em] tabular-nums">{children}</dd>
    </div>
  );
}

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A picture that failed before the page was interactive left no error for React
 * to hear, and the browser does not say it twice. One that looks lost (finished,
 * with no width) is asked for once more: that answer is heard.
 */
function askAgain(img: HTMLImageElement | null, lost: () => void) {
  if (!img || !img.complete || img.naturalWidth > 0 || !img.currentSrc) return;
  const probe = new Image();
  probe.onerror = lost;
  probe.src = img.currentSrc;
}

/**
 * A fundraiser as a card: a picture, the title, the story in a line, and the
 * money written first: "€4,820 raised of €10,000" with the percentage beside
 * it and a progress bar that is a real progress bar, so the figure is in text
 * and the bar only repeats it. Donors and days left are a labelled list. The
 * organiser is credited with an avatar and the Donate button sits beside them.
 * A campaign that reaches its goal says "Goal reached" and keeps accepting
 * gifts; one that has ended says "Ended on 3 Oct", drops the button and mutes
 * its picture. The title is the one link of the card and Donate stays its own
 * target above it.
 */
export function FundraiserCard({
  title,
  image,
  summary,
  raised,
  goal,
  currency = "EUR",
  donors,
  endsAt,
  organiser,
  onDonate,
  href,
  onOpen,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: FundraiserCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const endAt = endsAt === undefined ? Number.NaN : new Date(endsAt).getTime();
  const dated = !Number.isNaN(endAt);
  const clock = useNow(now, dated);
  const ended = dated && clock !== null && clock >= endAt;
  const left = dated && clock !== null && !ended ? dayNumber(endAt, timeZone) - dayNumber(clock, timeZone) : null;
  const [broken, setBroken] = useState<string | null>(null);
  const photo = useRef<HTMLImageElement>(null);
  const reached = goal > 0 && raised >= goal;
  // Rounded down, and never 100% until the goal is reached: 9,960 of 10,000 is 99%, not "100%" without the badge.
  const share = reached ? 1 : goal > 0 ? Math.min(99, Math.max(0, Math.floor((raised * 100) / goal + 1e-9))) / 100 : 0;
  const raisedText = moneyText(raised, currency, locale);
  const goalText = moneyText(goal, currency, locale);
  const picture = typeof image === "string" ? { src: image } : image;
  const source = picture?.src;
  useEffect(() => {
    if (source) askAgain(photo.current, () => setBroken(source));
  }, [source]);
  const label = <span className="[overflow-wrap:anywhere]">{title}</span>;

  return (
    <article
      data-slot="fundraiser-card"
      data-ended={ended ? "" : undefined}
      data-reached={reached ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "group/fundraiser-card @container relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=fundraiser-card-open]:focus-visible]:border-ring has-[[data-slot=fundraiser-card-open]:focus-visible]:ring-[3px] has-[[data-slot=fundraiser-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {picture ? (
        <div className="relative aspect-video shrink-0 overflow-hidden border-b border-border bg-muted">
          {broken === picture.src ? (
            <div className="grid size-full place-items-center text-muted-foreground">
              <span className="grid justify-items-center gap-1.5 text-xs">
                <IconImage className="size-6" />
                {text.photoFailed}
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
            <img ref={photo} src={picture.src} alt={picture.alt ?? ""} loading="lazy" decoding="async" onError={() => setBroken(picture.src)} className={cn("size-full object-cover", ended && "grayscale")} />
          )}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="grid grid-cols-1 gap-1.5">
          <Heading id={titleId} className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
            {href ? (
              <a data-slot="fundraiser-card-open" href={href} onClick={onOpen} className={OPEN}>
                {label}
              </a>
            ) : onOpen ? (
              <button data-slot="fundraiser-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {label}
              </button>
            ) : (
              label
            )}
          </Heading>
          {summary ? <p className="line-clamp-3 text-sm leading-relaxed text-pretty text-muted-foreground">{summary}</p> : null}
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
            <p className="min-w-0 text-sm leading-6 text-muted-foreground tabular-nums">
              <strong className="text-xl leading-6 font-semibold tracking-[-0.02em] text-foreground">{raisedText}</strong> {fill(text.raisedOf, { goal: goalText })}
            </p>
            {reached ? (
              <Badge variant="default" className="h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5">
                <IconCheck strokeWidth={2.25} />
                {text.reached}
              </Badge>
            ) : (
              <span className="text-sm font-medium tabular-nums">{percentText(share, locale)}</span>
            )}
          </div>
          <Progress
            value={Math.max(0, Math.min(raised, goal))}
            max={goal > 0 ? goal : 1}
            aria-label={text.progress}
            getValueLabel={() => fill(text.progressValue, { raised: raisedText, goal: goalText })}
            className="mt-3 h-2"
          />
        </div>

        {donors !== undefined || dated ? (
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            {donors !== undefined ? <Fact term={text.donors}>{countText(donors, locale)}</Fact> : null}
            {dated && !ended ? (
              left === null ? (
                <Fact term={text.ends}>
                  <time dateTime={new Date(endAt).toISOString()}>{dateIn(endAt, locale, timeZone, { day: "numeric", month: "short" })}</time>
                </Fact>
              ) : left >= 1 ? (
                <Fact term={text.daysLeft}>
                  <time dateTime={new Date(endAt).toISOString()}>{countText(left, locale)}</time>
                </Fact>
              ) : (
                <Fact term={text.ends}>
                  <time dateTime={new Date(endAt).toISOString()}>{text.today}</time>
                </Fact>
              )
            ) : null}
          </dl>
        ) : null}
      </div>

      {organiser || onDonate || ended ? (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border bg-muted/30 px-5 py-3.5">
          {organiser ? (
            <p className="flex min-w-0 flex-1 basis-40 items-center gap-2.5 text-[0.8125rem] leading-5 text-muted-foreground">
              <Avatar size="sm" aria-hidden="true">
                {organiser.image ? <AvatarImage src={organiser.image} alt="" /> : null}
                <AvatarFallback>{initialsOf(organiser.name) || "?"}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate">{text.organiser}</span>
                <span className="block truncate font-medium text-foreground">{organiser.name}</span>
              </span>
            </p>
          ) : null}
          {ended ? (
            // Beside the organiser it is pushed to the end of the row by the organiser's own width; when the row wraps it stays under them, at the start, not alone at the right.
            <p className={cn("flex items-center gap-1.5 text-sm leading-5 font-medium", !organiser && "ml-auto")}>
              <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
              <time dateTime={new Date(endAt).toISOString()}>{fill(text.ended, { date: dateIn(endAt, locale, timeZone, { day: "numeric", month: "short" }) })}</time>
            </p>
          ) : onDonate ? (
            <Button type="button" size="sm" aria-label={fill(text.donateTo, { title })} onClick={onDonate} className="relative z-10 ml-auto shrink-0">
              {text.donate}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
