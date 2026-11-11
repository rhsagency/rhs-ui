"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { ageText, compactNumber, dateIn, fill, wholeNumber, type DateInput } from "@rhs-ui/application/repo-card/format";
import { IconBook, IconGitBranch, IconGlobe, IconLock, IconStar } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/** Who can see the repository. Each has its own glyph and word, so none depends on colour. */
export type RepoVisibility = "public" | "private";

/** The words the card uses, for translation. `{count}` and `{time}` are filled in. */
export interface RepoCardLabels {
  /** The mark of a public repository. Default "Public". */
  public?: string;
  /** The mark of a private repository. Default "Private". */
  private?: string;
  /** Said to screen readers before the language. Default "Language". */
  language?: string;
  /** One star, in full. Default "{count} star". */
  starsOne?: string;
  /** Several stars, in full: the tooltip and what screen readers hear. Default "{count} stars". */
  starsOther?: string;
  /** One fork. Default "{count} fork". */
  forksOne?: string;
  /** Several forks. Default "{count} forks". */
  forksOther?: string;
  /** The last change; `{time}` is the time in words and carries the exact date in a tooltip. Default "Updated {time}". */
  updated?: string;
  /** The name of the list of topics. Default "Topics". */
  topics?: string;
  /** What the "+3" after the topics says to screen readers. Default "{count} more topics". */
  moreTopics?: string;
  /** What a time under a minute old is called. Default "just now". */
  justNow?: string;
}

export interface RepoCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The repository's name: "ledger-core". It is the one link of the card. */
  name: string;
  /** Whose it is, a person or an organisation: "northwind". Written in front of the name in a quieter weight. */
  owner?: string;
  /** What it is, in a sentence or two. Clamped to three lines. */
  description?: string;
  /** The main language, in words: "TypeScript". Shown with a small neutral marker, never a brand colour. */
  language?: string;
  /** How many stars it has. Written short (12.4K) with the full number in a tooltip and for screen readers. */
  stars?: number;
  /** How many forks it has. Written like the stars. */
  forks?: number;
  /** When it last changed: a Date, a timestamp or an ISO string. Written in words, with the exact date in a tooltip. */
  updatedAt?: DateInput;
  /** Who can see it: a badge that says Public or Private, with a glyph. */
  visibility?: RepoVisibility;
  /** What it is about, as tags. */
  topics?: readonly string[];
  /** How many topics are drawn before "+N". Default 4. */
  maxTopics?: number;
  /** The repository's page. The name becomes a link and the whole card opens it. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the last change is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the numbers and dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are counted, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: RepoCardLabels;
}

const DEFAULT_LABELS = {
  public: "Public",
  private: "Private",
  language: "Language",
  starsOne: "{count} star",
  starsOther: "{count} stars",
  forksOne: "{count} fork",
  forksOther: "{count} forks",
  updated: "Updated {time}",
  topics: "Topics",
  moreTopics: "{count} more topics",
  justNow: "just now",
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

/**
 * A tooltip that a tap can open. Radix opens one on hover and keyboard focus
 * only and closes it on every click, so on a touch screen the full number or
 * the exact date would never show: here a press toggles it, and hover works
 * as it does in every tooltip. What it says is also in the text for screen
 * readers, so nothing depends on it.
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
        {...AS_CHILD}
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

/** A count with its glyph: short on the page, in full in the tooltip and in what screen readers hear. */
function Count({ glyph, value, full, locale }: { glyph: ReactNode; value: number; full: string; locale: string }) {
  return (
    <Tip content={full}>
      <span className="relative z-10 inline-flex cursor-default items-center gap-1.5 tabular-nums [@media(hover:none)]:cursor-pointer">
        {glyph}
        <span aria-hidden="true">{compactNumber(value, locale)}</span>
        <span className="sr-only">{full}</span>
      </span>
    </Tip>
  );
}

/** What stretches the name's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A code repository as a card, for a developer's portfolio, an organisation's
 * page or a directory of open source: whose it is and what it is called (the
 * name is the one link of the card), a description of up to three lines, the
 * topics as tags, and a footer with the main language beside a small neutral
 * marker (never a brand colour), the stars and forks written short with the
 * full number in a tooltip and for screen readers, and when it last changed
 * in words with the exact date on hover. Visibility is a badge that says
 * Public or Private with its own glyph. The whole card opens the repository;
 * the counts and the date stay separate targets above it.
 */
export function RepoCard({
  name,
  owner,
  description,
  language,
  stars,
  forks,
  updatedAt,
  visibility,
  topics,
  maxTopics = 4,
  href,
  onOpen,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: RepoCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const changed = updatedAt === undefined ? Number.NaN : new Date(updatedAt).getTime();
  const clock = useNow(now, !Number.isNaN(changed));
  const shown = (topics ?? []).slice(0, Math.max(0, maxTopics));
  const rest = (topics ?? []).length - shown.length;
  const exact = Number.isNaN(changed) ? "" : dateIn(changed, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  // Before the clock is known the server and the first paint write the date, never a guess at "ago".
  const when = Number.isNaN(changed) ? "" : clock === null ? dateIn(changed, locale, timeZone, { day: "numeric", month: "short", year: "numeric" }) : ageText(changed, clock, locale, timeZone, text.justNow);
  const hasFooter = language || stars !== undefined || forks !== undefined || !Number.isNaN(changed);

  const title = (
    <>
      {owner ? <span className="font-normal text-muted-foreground">{owner} / </span> : null}
      <span className="[overflow-wrap:anywhere]">{name}</span>
    </>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <article
        data-slot="repo-card"
        data-visibility={visibility}
        aria-labelledby={nameId}
        className={cn(
          "group/repo-card @container relative flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
          "has-[[data-slot=repo-card-open]:focus-visible]:border-ring has-[[data-slot=repo-card-open]:focus-visible]:ring-[3px] has-[[data-slot=repo-card-open]:focus-visible]:ring-ring/40",
          (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
          className,
        )}
        {...props}
      >
        <div className="flex items-start gap-2.5">
          <IconBook className="mt-[3px] size-4 shrink-0 text-muted-foreground" />
          <Heading id={nameId} className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
            {href ? (
              <a data-slot="repo-card-open" href={href} onClick={onOpen} className={OPEN}>
                {title}
              </a>
            ) : onOpen ? (
              <button data-slot="repo-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {title}
              </button>
            ) : (
              title
            )}
          </Heading>
          {visibility ? (
            <Badge variant="outline" className="shrink-0">
              {visibility === "public" ? <IconGlobe /> : <IconLock />}
              {visibility === "public" ? text.public : text.private}
            </Badge>
          ) : null}
        </div>

        {description ? <p className="line-clamp-3 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{description}</p> : null}

        {shown.length ? (
          <ul aria-label={text.topics} className="flex flex-wrap gap-1.5">
            {shown.map((topic) => (
              <li key={topic}>
                <Badge variant="secondary">{topic}</Badge>
              </li>
            ))}
            {rest > 0 ? (
              <li>
                <Badge variant="muted" className="tabular-nums">
                  <span aria-hidden="true">+{rest}</span>
                  <span className="sr-only">{fill(text.moreTopics, { count: rest })}</span>
                </Badge>
              </li>
            ) : null}
          </ul>
        ) : null}

        {hasFooter ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[0.8125rem] leading-5 text-muted-foreground">
            {language ? (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-full bg-foreground/60" />
                <span className="sr-only">{text.language}: </span>
                {language}
              </span>
            ) : null}
            {stars !== undefined ? <Count glyph={<IconStar className="size-3.5" />} value={stars} locale={locale} full={fill(stars === 1 ? text.starsOne : text.starsOther, { count: wholeNumber(stars, locale) })} /> : null}
            {forks !== undefined ? <Count glyph={<IconGitBranch className="size-3.5" />} value={forks} locale={locale} full={fill(forks === 1 ? text.forksOne : text.forksOther, { count: wholeNumber(forks, locale) })} /> : null}
            {!Number.isNaN(changed) ? (
              <span className="@sm:ml-auto">
                {withTime(
                  text.updated,
                  <Tip content={exact}>
                    <time dateTime={new Date(changed).toISOString()} className="relative z-10 cursor-default tabular-nums decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:underline [@media(hover:none)]:cursor-pointer">
                      {when}
                      <span className="sr-only">{`, ${exact}`}</span>
                    </time>
                  </Tip>,
                )}
              </span>
            ) : null}
          </div>
        ) : null}
      </article>
    </TooltipProvider>
  );
}
