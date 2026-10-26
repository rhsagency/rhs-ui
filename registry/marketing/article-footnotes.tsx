"use client";

import { createContext, useContext, useId, useMemo, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconArrowUpRight, IconReturn } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FootnoteSource {
  /** What the source is called: "Kestrel Institute, Working Time Survey 2026". */
  label: string;
  /** Where to read it. Without it the label is plain text. */
  href?: string;
  /** The day you read it, as an ISO date: "2026-10-12". Pages change, so this says which version you saw. */
  accessed?: string;
}

export interface FootnoteNote {
  /** Stable and URL-safe. The note's anchor is built from it (#fn-sick-days), so a link to a note keeps working when notes are added or reordered. */
  id: string;
  /** What the note says: a sentence or two. */
  content: ReactNode;
  /** Where the claim comes from. It gets its own line, in the foreground colour. */
  source?: FootnoteSource;
  /** How many places in the text point at this note. Each one gets its own back link. 1 by default. */
  mentions?: number;
}

export interface FootnoteLabels {
  /** The accessible name of a reference, followed by its number: "Footnote 3". */
  reference: string;
  /** Before the source's name. */
  source: string;
  /** Before the day a source was read. */
  accessed: string;
  /** Added to a back link's name when a note is mentioned more than once: "mention 2". */
  mention: string;
  /** Read out after a source link, which opens in a new tab. */
  newTab: string;
}

const LABELS: FootnoteLabels = { reference: "Footnote", source: "Source", accessed: "Accessed", mention: "mention", newTab: "(opens in a new tab)" };

interface FootnoteScope {
  notes: readonly FootnoteNote[];
  idPrefix: string;
}

const Scope = createContext<FootnoteScope | null>(null);

const noteIdOf = (prefix: string, id: string) => `${prefix}-${id}`;
const refIdOf = (prefix: string, id: string, mention: number) => `${prefix}ref-${id}${mention > 1 ? `-${mention}` : ""}`;

/**
 * Follows a link to an anchor and then puts focus on it. The browser has
 * already scrolled (with the reader's own scroll behaviour), so focus must not.
 * A modified click opens a new tab and leaves this page alone.
 */
function followTo(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  window.requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
}

export interface FootnotesProps {
  /** The notes in the order they are numbered. A reference takes its number from its place in this list, not from where it sits in the text. */
  notes: readonly FootnoteNote[];
  /** Start of every anchor on the page: "fn" gives #fn-<id> for a note and #fnref-<id> for the spot in the text. Change it when two articles share a page. */
  idPrefix?: string;
  /** The article: the text with its references, and wherever the list belongs. */
  children: ReactNode;
}

/**
 * Holds the notes of one article so every FootnoteRef knows its number and
 * every FootnoteList knows its notes. Wrap the article in it; it renders no
 * element of its own. Numbers follow the order of the list, and the anchors
 * are built from each note's id, so deep links survive an edit.
 */
export function Footnotes({ notes, idPrefix = "fn", children }: FootnotesProps) {
  const scope = useMemo(() => ({ notes, idPrefix }), [notes, idPrefix]);
  return <Scope.Provider value={scope}>{children}</Scope.Provider>;
}

export interface FootnoteRefProps extends Omit<ComponentProps<"sup">, "children"> {
  /** The id of the note this points to. */
  note: string;
  /** Which mention of the note this is, when the text refers to it more than once. 1 by default. */
  mention?: number;
  /** Start of the link's accessible name; the number follows it: "Footnote 3". */
  label?: string;
}

/**
 * A superscript number in the text that links to its note. It is a small pill
 * with a larger touch target than it looks, it keeps its place when you come
 * back from the note, and following it moves focus to the note as well as the
 * page, so a keyboard or screen reader user lands where the eye does.
 */
export function FootnoteRef({ note, mention = 1, label = LABELS.reference, className, ...props }: FootnoteRefProps) {
  const scope = useContext(Scope);
  if (!scope) throw new Error("FootnoteRef must be inside <Footnotes>");
  const index = scope.notes.findIndex((entry) => entry.id === note);
  if (index === -1) {
    return (
      <sup data-slot="footnote-ref" data-missing className={cn("mx-px text-destructive", className)} {...props}>
        ?
      </sup>
    );
  }
  const number = index + 1;
  const target = noteIdOf(scope.idPrefix, note);
  return (
    <sup data-slot="footnote-ref" className={cn("mr-[0.12em] ml-[0.06em] font-medium", className)} {...props}>
      <a
        id={refIdOf(scope.idPrefix, note, mention)}
        href={`#${target}`}
        aria-label={`${label} ${number}`}
        onClick={(event) => followTo(event, target)}
        className="relative inline-block min-w-[1.6em] rounded-full bg-muted px-[0.35em] text-center leading-[1.4] font-medium tabular-nums text-foreground no-underline outline-none border border-border transition-colors duration-150 after:absolute after:-inset-x-1.5 after:-inset-y-2.5 after:content-[''] hover:border-foreground hover:bg-foreground hover:text-background focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
      >
        {number}
      </a>
    </sup>
  );
}

export interface FootnoteListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The notes, when the list is not inside <Footnotes>. Inside it, leave this out: the references and the list must share one list to agree on the numbers. */
  notes?: readonly FootnoteNote[];
  /** The heading above the list. "Notes" by default. */
  title?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Start of each back link's accessible name; the number follows it: "Back to reference 3". */
  backLabel?: string;
  /** Start of every anchor, when the list is not inside <Footnotes>. */
  idPrefix?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FootnoteLabels>;
  /** Locale for the day a source was read. */
  locale?: string;
}

const UTC_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A label split before its last word, so the link's arrow can be kept with that word. */
function lastWord(label: string): { head: string; tail: string } {
  const cut = label.lastIndexOf(" ");
  return { head: label.slice(0, cut + 1), tail: label.slice(cut + 1) };
}

/**
 * The notes of an article as an ordered list with the source of each claim:
 * the text in the muted colour at a readable size (never below 14px), the
 * source on its own line in the foreground colour with the day it was read,
 * and a back link that returns to the exact spot in the text. Every note has
 * a stable anchor, so a reader can link to one, and the note that a link or a
 * reference points at is highlighted and takes focus. For essays, reports and
 * explainers that need to show their work.
 */
export function FootnoteList({ notes: own, title = "Notes", headingLevel = 2, backLabel = "Back to reference", idPrefix = "fn", labels: custom, locale = "en-US", className, ...props }: FootnoteListProps) {
  const scope = useContext(Scope);
  const headingId = useId();
  const notes = own ?? scope?.notes ?? [];
  const prefix = scope?.idPrefix ?? idPrefix;
  const labels = { ...LABELS, ...custom };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  // The day a source was read is a calendar day, so it is written in UTC and never shifts with the reader's zone.
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  if (notes.length === 0) return null;

  return (
    <section data-slot="footnote-list" aria-labelledby={headingId} className={cn("w-full break-words", className)} {...props}>
      <Heading id={headingId} className="flex items-baseline gap-2.5 text-lg leading-snug font-semibold tracking-[-0.02em]">
        {title}
        <span aria-hidden="true" className="text-sm font-normal text-muted-foreground tabular-nums">
          {notes.length}
        </span>
      </Heading>
      <ol role="list" className="-mx-3 mt-4">
        {notes.map((note, index) => {
          const number = index + 1;
          const mentions = Math.max(1, Math.floor(note.mentions ?? 1));
          const source = note.source;
          const read = source?.accessed && UTC_DAY.test(source.accessed) ? new Date(`${source.accessed}T00:00:00Z`) : null;
          return (
            <li
              key={note.id}
              id={noteIdOf(prefix, note.id)}
              tabIndex={-1}
              className="group/note scroll-mt-24 rounded-lg px-3 outline-none transition-colors duration-300 target:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
            >
              <div className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-x-3 border-b border-border py-4 group-last/note:border-b-0 group-target/note:border-transparent">
                <span aria-hidden="true" className="text-sm leading-relaxed font-medium text-muted-foreground tabular-nums">
                  {number}
                </span>
                <div className="min-w-0">
                  <div className="text-sm leading-relaxed text-pretty text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_p+p]:mt-2">{note.content}</div>
                  {source ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-foreground">
                      <span className="text-muted-foreground">{labels.source}: </span>
                      {source.href ? (
                        <a
                          href={source.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-sm font-medium underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                        >
                          {lastWord(source.label).head}
                          {/* The arrow stays with the last word, so it never wraps onto a line of its own. */}
                          <span className="whitespace-nowrap">
                            {lastWord(source.label).tail}
                            <IconArrowUpRight aria-hidden="true" size={13} className="mb-px ml-1 inline" />
                            <span className="sr-only"> {labels.newTab}</span>
                          </span>
                        </a>
                      ) : (
                        <span className="font-medium">{source.label}</span>
                      )}
                      {source.accessed ? (
                        <span className="mt-0.5 block">
                          {labels.accessed} {read ? <time dateTime={source.accessed}>{day.format(read)}</time> : source.accessed}
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
                <div className="-mr-1.5 flex items-start gap-0.5">
                  {Array.from({ length: mentions }, (_, at) => at + 1).map((mention) => {
                    const back = refIdOf(prefix, note.id, mention);
                    return (
                      <a
                        key={mention}
                        href={`#${back}`}
                        aria-label={`${backLabel} ${number}${mentions > 1 ? `, ${labels.mention} ${mention}` : ""}`}
                        onClick={(event) => followTo(event, back)}
                        className="grid h-6 min-w-6 place-items-center rounded-md px-1 text-sm font-medium text-muted-foreground tabular-nums outline-none transition-colors duration-150 hover:bg-foreground/10 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                      >
                        {mention === 1 ? <IconReturn aria-hidden="true" size={14} /> : mention}
                      </a>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
