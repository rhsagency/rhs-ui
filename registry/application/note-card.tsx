"use client";

import { useEffect, useId, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconMoreHorizontal, IconPushpin } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/**
 * The colours a label can have, as steps of the page's own ink. They are the
 * small token set: change the table below to use your brand's hues. A label
 * always shows its name next to its mark, so colour is never the only signal.
 */
export type NoteTone = "ink" | "graphite" | "stone" | "mist";

/** A label on a note. */
export interface NoteLabel {
  /** Its name: "Work", "Draft". It is always written out. */
  name: string;
  /** The tone of the mark beside the name. Default "stone". */
  tone?: NoteTone;
}

/** The note a card shows. */
export interface Note {
  /** A stable identity: the key of the card in its grid. */
  id: string;
  /** Its title. Up to two lines, then cut. An empty title reads "Untitled". */
  title: string;
  /** The start of its text, as plain text. Clamped to five lines, with line breaks kept. Empty reads "No content yet". */
  preview?: string;
  /** When it was last changed: a Date, a timestamp or an ISO string. */
  editedAt: DateInput;
  /** Its page. The title becomes a link and the whole card opens it. */
  href?: string;
  /** Its labels. The first few are drawn, the rest as "+2". */
  labels?: readonly NoteLabel[];
  /** The preview is code: it is drawn in a monospace face with its indentation kept. */
  code?: boolean;
}

/** One entry of a card's overflow menu. */
export interface NoteCardAction {
  /** A stable identity. */
  id: string;
  /** What the entry says. */
  label: string;
  /** An icon element, drawn at 16px. */
  icon?: ReactNode;
  /** Red, and set apart under a rule: Delete. */
  destructive?: boolean;
  /** Greyed out and skipped by the keyboard. */
  disabled?: boolean;
  /** The entry was chosen. */
  onSelect: () => void;
}

/** The words the card uses, for translation. `{time}`, `{title}` and `{count}` are filled in. */
export interface NoteCardLabels {
  /** The pin button's name, followed by the title. It stays the same when the note is pinned: `aria-pressed` says the state. Default "Pin". */
  pin?: string;
  /** Written in the footer of a pinned note, beside the icon. Default "Pinned". */
  pinned?: string;
  /** The last change. Default "Edited {time}". */
  edited?: string;
  /** What an edit under a minute old is called. Default "just now". */
  justNow?: string;
  /** The title of a note that has none. Default "Untitled". */
  untitled?: string;
  /** The preview of a note without text. Default "No content yet". */
  empty?: string;
  /** The menu button's name, followed by "for" and the title. Default "More actions". */
  more?: string;
  /** Read before the labels. Default "Labels". */
  labels?: string;
  /** Read by a skeleton. Default "Loading note". */
  loading?: string;
}

export interface NoteCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The note to show. */
  note: Note;
  /** The card was opened. With `note.href` it runs on the link and receives the event, so a client-side router can call `preventDefault()`. Without an href it makes the whole card a button. */
  onOpen?: (note: Note, event: MouseEvent<HTMLElement>) => void;
  /** Whether the note is pinned. The pin is a toggle with `aria-pressed`, and a pinned note also says "Pinned" in its footer. Leave out `onPinChange` for no pin button. */
  pinned?: boolean;
  /** The pin was pressed, with the state it asks for. Update `pinned`. */
  onPinChange?: (pinned: boolean) => void;
  /** The overflow menu: duplicate, archive. A destructive action is set apart at the end. Leave it out for no menu. */
  menu?: readonly NoteCardAction[];
  /** How many labels are drawn before "+N". Default 2. */
  maxLabels?: number;
  /** The moment the age is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get relative text in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: NoteCardLabels;
}

const DOTS: Record<NoteTone, string> = {
  ink: "bg-foreground",
  graphite: "bg-foreground/70",
  stone: "bg-foreground/45",
  mist: "bg-foreground/25",
};

const DEFAULT_LABELS = {
  pin: "Pin",
  pinned: "Pinned",
  edited: "Edited {time}",
  justNow: "just now",
  untitled: "Untitled",
  empty: "No content yet",
  more: "More actions",
  labels: "Labels",
  loading: "Loading note",
} satisfies Required<NoteCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A date in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/**
 * "just now", "12 minutes ago", "yesterday", "3 weeks ago", then the date.
 * Before the browser's clock is known (the server, the first paint) it writes
 * the date instead, which reads the same everywhere.
 */
function describe(at: number, now: number | null, locale: string, timeZone: string, justNow: string): string {
  if (now === null) return dateIn(at, locale, timeZone, { day: "numeric", month: "short" });
  const diff = at - now;
  const age = Math.abs(diff);
  if (age < MINUTE) return justNow;
  if (age >= 30 * DAY) return dateIn(at, locale, timeZone, new Date(at).getUTCFullYear() === new Date(now).getUTCFullYear() ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  if (age < HOUR) return words.format(Math.trunc(diff / MINUTE), "minute");
  if (age < DAY) return words.format(Math.trunc(diff / HOUR), "hour");
  // Days and weeks are rounded: 47 hours is "2 days ago", not "yesterday", and 13.9 days is "2 weeks ago".
  if (age < 7 * DAY) return words.format(Math.round(diff / DAY), "day");
  return words.format(Math.round(diff / (7 * DAY)), "week");
}

/** The browser's clock, once the page is live and then every minute while the text can still change. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, at: number): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    // Past a month the text is a date and never changes again.
    const timer = Math.abs(Date.now() - at) < 30 * DAY ? window.setInterval(read, MINUTE) : undefined;
    return () => window.clearInterval(timer);
  }, [pinned, at]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A note as a tile in a grid of notes or snippets: the title, the start of the
 * text clamped to five lines, its labels, and when it was last edited. The
 * tile is one stretched link (or button) with a ring around all of it when it
 * has focus; the pin toggle and the overflow menu sit above it as separate
 * controls, so pressing them never opens the note. A pinned note says
 * "Pinned" in words as well as in the icon, a label always shows its name
 * beside its mark, and a note without text says "No content yet". Tiles in a
 * grid keep equal heights, and `NoteCardSkeleton` fills the same footprint
 * while they load.
 */
export function NoteCard({ note, onOpen, pinned = false, onPinChange, menu, maxLabels = 2, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: NoteCardProps) {
  const text: Required<NoteCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const at = new Date(note.editedAt).getTime();
  const valid = !Number.isNaN(at);
  const clock = useNow(now, valid ? at : 0);
  const title = note.title.trim() ? note.title : text.untitled;
  const preview = note.preview?.trim() ? note.preview.replace(/\s+$/, "") : "";
  const noteLabels = note.labels ?? [];
  const shown = noteLabels.slice(0, Math.max(0, maxLabels));
  const rest = noteLabels.slice(shown.length);
  const plain = menu?.filter((action) => !action.destructive) ?? [];
  const danger = menu?.filter((action) => action.destructive) ?? [];
  const name = <span className={cn("line-clamp-2 [overflow-wrap:anywhere]", !note.title.trim() && "font-normal text-muted-foreground")}>{title}</span>;

  return (
    <article
      data-slot="note-card"
      data-pinned={pinned ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "group/note-card relative flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "hover:border-foreground/30 hover:shadow-sm has-[[data-slot=note-card-open]:focus-visible]:border-ring has-[[data-slot=note-card-open]:focus-visible]:ring-[3px] has-[[data-slot=note-card-open]:focus-visible]:ring-ring/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <h3 id={titleId} className="min-w-0 flex-1 text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">
          {note.href ? (
            <a data-slot="note-card-open" href={note.href} onClick={(event) => onOpen?.(note, event)} className={OPEN}>
              {name}
            </a>
          ) : onOpen ? (
            <button data-slot="note-card-open" type="button" onClick={(event) => onOpen(note, event)} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
              {name}
            </button>
          ) : (
            name
          )}
        </h3>
        {onPinChange || menu?.length ? (
          <div className="relative z-10 -mt-1.5 -me-1.5 flex shrink-0 items-center">
            {onPinChange ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-pressed={pinned}
                aria-label={`${text.pin} ${title}`}
                onClick={() => onPinChange(!pinned)}
                className={cn("size-7 text-muted-foreground hover:text-foreground", pinned && "text-foreground")}
              >
                <IconPushpin className={cn(pinned && "fill-current")} />
              </Button>
            ) : null}
            {menu?.length ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`${text.more} for ${title}`} className="size-7 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
                    <IconMoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  {plain.map((action) => (
                    <DropdownMenuItem key={action.id} disabled={action.disabled} onSelect={action.onSelect}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {danger.length && plain.length ? <DropdownMenuSeparator /> : null}
                  {danger.map((action) => (
                    <DropdownMenuItem key={action.id} variant="destructive" disabled={action.disabled} onSelect={action.onSelect}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* The wrapper takes the spare height of a taller neighbour, so the clamped paragraph keeps its own height: five lines at most, never a sixth drawn under the ellipsis. */}
      {preview ? (
        <div className="min-h-0 flex-1">
          <p className={cn("line-clamp-5 text-sm leading-5 whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]", note.code && "font-mono text-[0.8125rem] leading-5 whitespace-pre [tab-size:2]")}>{preview}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <p className="text-sm leading-5 text-muted-foreground italic">{text.empty}</p>
        </div>
      )}

      {noteLabels.length ? (
        <ul aria-label={text.labels} className="flex flex-wrap items-center gap-1.5">
          {shown.map((label) => (
            <li key={label.name}>
              <Badge variant="outline" className="gap-1.5 pe-2 ps-1.5 text-foreground">
                <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOTS[label.tone ?? "stone"])} />
                <span className="max-w-24 truncate">{label.name}</span>
              </Badge>
            </li>
          ))}
          {rest.length ? (
            <li>
              <Badge variant="muted" title={rest.map((label) => label.name).join(", ")}>
                +{rest.length}
                <span className="sr-only">: {rest.map((label) => label.name).join(", ")}</span>
              </Badge>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {valid ? (
          <time dateTime={new Date(at).toISOString()} title={dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning className="min-w-0 truncate tabular-nums">
            {fill(text.edited, { time: describe(at, clock, locale, timeZone, text.justNow) })}
          </time>
        ) : (
          <span />
        )}
        {pinned ? (
          <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
            <IconPushpin aria-hidden="true" className="size-3 fill-current" />
            {text.pinned}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export interface NoteCardSkeletonProps extends ComponentProps<"div"> {
  /** The words a screen reader gets. Default "Loading note". */
  label?: string;
}

/** A card-shaped placeholder for a grid that is still loading: the title, five lines of text, a label and the footer, in the footprint of a real card. */
export function NoteCardSkeleton({ label = "Loading note", className, ...props }: NoteCardSkeletonProps) {
  return (
    <div data-slot="note-card-skeleton" aria-busy="true" className={cn("flex h-full min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs", className)} {...props}>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-2/3" />
      <div className="grid flex-1 content-start gap-2 pt-0.5">
        <Skeleton className="h-3.5 w-full" delay={80} />
        <Skeleton className="h-3.5 w-full" delay={160} />
        <Skeleton className="h-3.5 w-11/12" delay={240} />
        <Skeleton className="h-3.5 w-4/5" delay={320} />
        <Skeleton className="h-3.5 w-1/2" delay={400} />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" delay={480} />
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-3 w-28" delay={560} />
      </div>
    </div>
  );
}
