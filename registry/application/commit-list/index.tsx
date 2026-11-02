"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactElement, type ReactNode } from "react";

import { IconBan, IconCheck, IconClock, IconClose, IconGitMerge, IconMoreHorizontal, IconSpinner } from "@rhs-ui/icons";
import { ageText, dateIn, dayNumber, fill, splitMessage, type DateInput } from "@rhs-ui/application/commit-list/format";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** How the checks of a commit ended. Each has its own glyph and word, so none depends on colour. */
export type CommitStatus = "success" | "failure" | "running" | "pending" | "cancelled";

/** One commit. */
export interface Commit {
  /** The full hash. Seven characters of it are shown; the whole hash is what the copy button copies. Also the key of the row, so it must be unique. */
  hash: string;
  /** The message. Its first line is the subject and the link; whatever follows is the description, unless `body` is given. */
  message: string;
  /** The description, folded behind a disclosure. Leave it out to use what follows the first line of `message`. */
  body?: string;
  /** Who wrote it. Without an image the avatar shows their initials. */
  author: { name: string; image?: string };
  /** When it was committed: a Date, a timestamp or an ISO string. */
  committedAt: DateInput;
  /** How the checks ended: a glyph and a word. Leave it out for a commit nothing ran on. */
  status?: CommitStatus;
  /** A merge commit, marked with a glyph and the word "Merge". */
  merge?: boolean;
  /** The commit's page. The subject becomes a link to it. */
  href?: string;
}

/** The words the list uses, for translation. `{subject}`, `{time}` and `{count}` are filled in. */
export interface CommitListLabels {
  /** Names the description button, followed by the state it reports (expanded or not). Default `Description of "{subject}"`. */
  description?: string;
  /** Said to screen readers about the hash button, as its description. Default "Copy the full hash of this commit". */
  copyHash?: string;
  /** The mark on a merge commit. Default "Merge". */
  merge?: string;
  /** The line under the subject; `{time}` is the time in words and carries the exact moment in a tooltip. Default "committed {time}". */
  committed?: string;
  /** Said to screen readers before the status word. Default "Checks". */
  checks?: string;
  /** The five status words. */
  statuses?: Partial<Record<CommitStatus, string>>;
  /** What a time under a minute old is called. Default "just now". */
  justNow?: string;
  /** The number of commits of one day. Default "{count} commit". */
  commitsOne?: string;
  /** The number of commits of one day. Default "{count} commits". */
  commitsOther?: string;
  /** Shown when there are no commits. Default "No commits yet." */
  empty?: string;
}

export interface CommitListProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** The commits, newest first. They are grouped by calendar day, in the order they come. */
  commits: readonly Commit[];
  /** A subject was pressed. With `commit.href` it runs on the link, so a client-side router can call `preventDefault()` on the event; without an href the subject becomes a button. */
  onSelect?: (commit: Commit, event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the day headings. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the times are measured from. Leave it out to use the browser's clock, read once the page is live and kept current; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates and of the words that count time. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days group the commits, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the list uses, for translation. */
  labels?: CommitListLabels;
}

const DEFAULT_LABELS = {
  description: 'Description of "{subject}"',
  copyHash: "Copy the full hash of this commit",
  merge: "Merge",
  committed: "committed {time}",
  checks: "Checks",
  justNow: "just now",
  commitsOne: "{count} commit",
  commitsOther: "{count} commits",
  empty: "No commits yet.",
};

const DEFAULT_STATUSES: Record<CommitStatus, string> = { success: "Passing", failure: "Failing", running: "Running", pending: "Pending", cancelled: "Cancelled" };

// Darkened toward the foreground so the small red word reaches 4.5:1 on its pale fill.
const FAILING = "font-semibold text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const STATUS: Record<CommitStatus, { glyph: ReactNode; variant: BadgeProps["variant"]; className?: string }> = {
  success: { glyph: <IconCheck />, variant: "outline" },
  failure: { glyph: <IconClose />, variant: "destructive", className: FAILING },
  running: { glyph: <IconSpinner />, variant: "outline" },
  pending: { glyph: <IconClock />, variant: "muted" },
  cancelled: { glyph: <IconBan />, variant: "muted" },
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
 * A time with its exact moment in a tooltip. Radix opens a tooltip on hover
 * and keyboard focus only and closes it on every click, so on a touch screen
 * the exact time would never show: here a press toggles it, and hover works
 * as it does in every tooltip. The exact time is also in the text, for
 * screen readers.
 */
function Exact({ at, text, exact }: { at: number; text: string; exact: string }): ReactElement {
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
        <time dateTime={new Date(at).toISOString()} className="cursor-default tabular-nums decoration-muted-foreground/50 decoration-dotted underline-offset-4 hover:underline [@media(hover:none)]:cursor-pointer">
          {text}
          <span className="sr-only">{`, ${exact}`}</span>
        </time>
      </TooltipTrigger>
      <TooltipContent collisionPadding={8} className="tabular-nums">
        {exact}
      </TooltipContent>
    </Tooltip>
  );
}

/** A template with `{time}` in it, with the time element in its place. */
function withTime(template: string, time: ReactNode): ReactNode {
  return template.split(/(\{time\})/).map((part, index) => (part === "{time}" ? <Fragment key={index}>{time}</Fragment> : part));
}

interface Entry {
  commit: Commit;
  at: number;
}

interface Day {
  key: number;
  at: number;
  entries: Entry[];
}

/** The commits grouped by calendar day in the zone, in the order they come. Anything without a valid date is left out. */
function groupByDay(commits: readonly Commit[], timeZone: string): Day[] {
  const days = new Map<number, Day>();
  for (const commit of commits) {
    const at = new Date(commit.committedAt).getTime();
    if (Number.isNaN(at)) continue;
    const key = dayNumber(at, timeZone);
    const day = days.get(key) ?? { key, at, entries: [] };
    day.entries.push({ commit, at });
    days.set(key, day);
  }
  return [...days.values()];
}

// `anywhere`, not `break-word`: only it lowers the min-content width, so a subject without a space (an identifier, a URL) folds inside a 320px list instead of widening it.
const SUBJECT = "rounded-sm font-medium text-foreground [overflow-wrap:anywhere] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

interface RowProps {
  commit: Commit;
  at: number;
  clock: number | null;
  locale: string;
  timeZone: string;
  text: typeof DEFAULT_LABELS;
  statuses: Record<CommitStatus, string>;
  onSelect?: CommitListProps["onSelect"];
}

function CommitRow({ commit, at, clock, locale, timeZone, text, statuses, onSelect }: RowProps) {
  const hintId = useId();
  const { subject, body } = splitMessage(commit.message, commit.body);
  const status = commit.status ? STATUS[commit.status] : null;
  const exact = dateIn(at, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  // Before the clock is known the server and the first paint write the date, never a guess at "ago".
  const when = clock === null ? dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" }) : ageText(at, clock, locale, timeZone, text.justNow);

  return (
    <li data-slot="commit-list-item" data-status={commit.status} data-merge={commit.merge ? "true" : undefined} className="px-4 py-3.5 @lg:px-5">
      <Collapsible>
        <div className="flex flex-col gap-3 @lg:flex-row @lg:items-start @lg:justify-between @lg:gap-6">
          <div className="min-w-0 flex-1">
            {/* One line of text, so the mark and the disclosure follow the last word of a subject that wraps instead of dropping to a line of their own. */}
            <div className="text-sm leading-6">
              {commit.href ? (
                <a href={commit.href} onClick={(event) => onSelect?.(commit, event)} className={cn(SUBJECT, "hover:underline hover:underline-offset-4")}>
                  {subject}
                </a>
              ) : onSelect ? (
                <button type="button" onClick={(event) => onSelect(commit, event)} className={cn(SUBJECT, "cursor-pointer text-left hover:underline hover:underline-offset-4")}>
                  {subject}
                </button>
              ) : (
                <span className={SUBJECT}>{subject}</span>
              )}
              {commit.merge ? (
                <Badge variant="outline" className="ml-2 align-middle">
                  <IconGitMerge />
                  {text.merge}
                </Badge>
              ) : null}
              {body ? (
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    aria-label={fill(text.description, { subject })}
                    className="ml-2 inline-flex h-5 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md bg-muted align-middle text-muted-foreground transition-colors duration-150 outline-none hover:bg-border hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:bg-foreground data-[state=open]:text-background motion-reduce:transition-none"
                  >
                    <IconMoreHorizontal className="size-3.5" />
                  </button>
                </CollapsibleTrigger>
              ) : null}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] leading-5 text-muted-foreground">
              <Avatar size="sm" className="data-[size=sm]:size-6">
                {commit.author.image ? <AvatarImage src={commit.author.image} alt="" /> : null}
                <AvatarFallback className="text-[0.625rem]">{initialsOf(commit.author.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]">{commit.author.name}</span>
              <span>{withTime(text.committed, <Exact at={at} text={when} exact={exact} />)}</span>
            </p>
            {body ? (
              <CollapsibleContent>
                <p className="mt-3 max-w-prose border-l-2 border-border pl-3.5 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground [overflow-wrap:anywhere]">{body}</p>
              </CollapsibleContent>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {status && commit.status ? (
              <Badge variant={status.variant} data-status={commit.status} className={status.className}>
                {status.glyph}
                <span className="sr-only">{text.checks}: </span>
                {statuses[commit.status]}
              </Badge>
            ) : null}
            <span id={hintId} className="sr-only">
              {text.copyHash}
            </span>
            <CopyButton value={commit.hash} label={commit.hash.slice(0, 7)} size="sm" aria-describedby={hintId} className="h-7 gap-1.5 px-2 font-mono text-xs text-muted-foreground hover:text-foreground" />
          </div>
        </div>
      </Collapsible>
    </li>
  );
}

/**
 * A repository's history, one calendar day at a time: each day has a heading
 * that sticks to the top while its commits scroll past, and each commit a
 * subject (the first line of its message) that is the link, an author, a
 * time in words with the exact moment on hover, a tap or a long look, the
 * result of its checks as a glyph and a word, and the short hash as a
 * monospace button that copies the whole hash. A longer description folds
 * behind a disclosure, and a merge commit is marked in words. The sticky
 * headings follow the page; to park them under a fixed header, set
 * `--commit-list-top` on the list (`className="[--commit-list-top:3.5rem]"`).
 * It fits repository pages, release notes and deploy histories.
 */
export function CommitList({ commits, onSelect, headingLevel = 3, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: CommitListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = { ...DEFAULT_STATUSES, ...labels?.statuses };
  const id = useId();
  const clock = useNow(now, commits.length > 0);
  const days = groupByDay(commits, timeZone);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <TooltipProvider delayDuration={200}>
      <div data-slot="commit-list" className={cn("@container grid grid-cols-[minmax(0,1fr)] gap-6", className)} {...props}>
        {days.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{text.empty}</p> : null}
        {days.map((day) => (
          <section key={day.key} aria-labelledby={`${id}-${day.key}`}>
            <Heading
              id={`${id}-${day.key}`}
              className="sticky top-[var(--commit-list-top,0px)] z-[1] flex items-baseline justify-between gap-3 bg-background py-2.5 text-sm font-semibold tracking-[-0.02em]"
            >
              <span>{dateIn(day.at, locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{fill(day.entries.length === 1 ? text.commitsOne : text.commitsOther, { count: day.entries.length })}</span>
            </Heading>
            <ol className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
              {day.entries.map(({ commit, at }) => (
                <CommitRow key={commit.hash} commit={commit} at={at} clock={clock} locale={locale} timeZone={timeZone} text={text} statuses={statuses} onSelect={onSelect} />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </TooltipProvider>
  );
}
