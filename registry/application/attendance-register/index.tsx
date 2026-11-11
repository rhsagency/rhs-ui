"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconCheck, IconClock, IconClose, IconMinus, IconPlus } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  DEFAULT_MARKS,
  DEFAULT_MEANINGS,
  MARK_KEY,
  MARK_ORDER,
  dayKeyAt,
  dayOf,
  fill,
  isMark,
  longDateText,
  markOf,
  markOfLetter,
  numberText,
  shortDateText,
  tallyPerson,
  tallySession,
  weekdayText,
  withMark,
  type AttendanceChange,
  type AttendanceLabels,
  type AttendanceMark,
  type AttendanceMarks,
  type AttendancePerson,
  type AttendanceSession,
} from "@rhs-ui/application/attendance-register/marks";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type {
  AttendanceChange,
  AttendanceLabels,
  AttendanceMark,
  AttendanceMarks,
  AttendancePerson,
  AttendanceSession,
} from "@rhs-ui/application/attendance-register/marks";

export interface AttendanceRegisterProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** Who is in the group, one row each: an id, a name and optionally a picture. */
  people: readonly AttendancePerson[];
  /** The times the group met, one column each, in the order they should read. A session after today cannot be marked yet. */
  sessions: readonly AttendanceSession[];
  /** The marks, as `marks[personId][sessionId]`, when you control them. Pair it with `onMarkChange`. */
  marks?: AttendanceMarks;
  /** The marks to start from, when the register keeps them itself. */
  defaultMarks?: AttendanceMarks;
  /** Marks were set or cleared: what changed (one entry for a cell, one per person for a whole session) and the whole new map. */
  onMarkChange?: (changes: readonly AttendanceChange[], marks: AttendanceMarks) => void;
  /** Shows the register without a way to change it: plain marks, no menus and no buttons. */
  readOnly?: boolean;
  /** What "now" is, for marking today and telling sessions that have happened from sessions to come. Pass it for output that does not change between server and browser. Default: the current time. */
  now?: Date | string | number;
  /** The language of the dates and numbers. Default "en-US". */
  locale?: string;
  /** The time zone that decides which day today is, and on which day a session given as a moment falls. Default "UTC". */
  timeZone?: string;
  /** The words the register says, for translation. */
  labels?: AttendanceLabels;
}

const GLYPH = { present: IconCheck, late: IconClock, absent: IconClose, excused: IconMinus } as const satisfies Record<AttendanceMark, unknown>;

const CHIP_BASE = "inline-flex shrink-0 items-center justify-center rounded-lg border select-none";

/** Four weights of one monochrome chip, each with a glyph of its own, so no mark is told apart by colour alone: solid, outlined, soft and dashed. */
const CHIP: Record<AttendanceMark, string> = {
  present: "border-primary bg-primary text-primary-foreground",
  late: "border-[1.5px] border-foreground bg-card text-foreground",
  absent: "border-transparent bg-muted text-foreground",
  excused: "border-dashed border-muted-foreground/60 bg-transparent text-muted-foreground",
};

const CHIP_HOVER: Record<AttendanceMark, string> = {
  present: "hover:bg-primary/85",
  late: "hover:bg-muted",
  absent: "hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_9%)]",
  excused: "hover:border-muted-foreground hover:bg-muted/60",
};

/** A cell that can be marked and has no mark yet: a dashed outline, a soft fill and a plus that are there without pointing at them, so the people still to mark are found at a glance. A session to come is dotted, empty and quieter, so the two never read alike. */
const OPEN_CELL =
  "border-dashed border-muted-foreground/60 bg-muted/40 text-muted-foreground/60 hover:border-muted-foreground hover:bg-muted hover:text-foreground focus-visible:border-muted-foreground focus-visible:text-foreground data-[state=open]:border-muted-foreground data-[state=open]:text-foreground";

/** The first column stays put while the sessions scroll sideways. It is solid, so nothing shows through it, and narrower on a phone, so more sessions fit beside it. */
const PINNED =
  "sticky left-0 z-10 w-36 min-w-36 max-w-36 border-r border-border bg-card px-3 group-hover/row:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)] @lg:w-52 @lg:min-w-52 @lg:max-w-52 @lg:px-4";

const cellKey = (row: number, col: number): string => `${row}:${col}`;

/** The glyph of a mark: a check, a clock, a cross, a dash. It takes the colour of its chip, also inside a menu item, whose own rule would turn an icon without a text colour grey. */
function MarkGlyph({ mark }: { mark: AttendanceMark }) {
  const Glyph = GLYPH[mark];
  return <Glyph aria-hidden="true" size={16} className="text-current" />;
}

function MarkChip({ mark, className }: { mark: AttendanceMark; className?: string }) {
  return (
    <span aria-hidden="true" data-mark={mark} className={cn(CHIP_BASE, CHIP[mark], "size-9", className)}>
      <MarkGlyph mark={mark} />
    </span>
  );
}

interface Column {
  session: AttendanceSession;
  /** The day, as "2026-10-12". */
  key: string;
  /** Midnight of that day in UTC, for formatting. */
  ms: number;
  /** After today: it cannot be marked yet. */
  future: boolean;
  today: boolean;
}

/**
 * Who came, as a grid: people down the side, the sessions across, and in every cell a mark that is a glyph and a word,
 * so "Mara Visser, 12 Oct, late" is read in full. A cell opens a menu of the four marks (present, late, absent,
 * excused); from the keyboard the arrow keys move across the grid and P, L, A and E set a mark, Backspace clears it. A
 * person's row ends with their rate ("9 of 11, 82%"), the footer counts who came to each session, and a session can be
 * marked present for everyone who has no mark yet in one press. A session that has not happened is disabled and says
 * why. On a narrow screen the sessions scroll sideways while the names stay put.
 */
export function AttendanceRegister({
  people,
  sessions,
  marks,
  defaultMarks,
  onMarkChange,
  readOnly = false,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: AttendanceRegisterProps) {
  const words: Required<Omit<AttendanceLabels, "marks" | "meanings">> = { ...DEFAULT_LABELS, ...labels };
  const markWords: Record<AttendanceMark, string> = { ...DEFAULT_MARKS, ...labels?.marks };
  const meanings: Record<AttendanceMark, string> = { ...DEFAULT_MEANINGS, ...labels?.meanings };
  const hintId = useId();
  const headingId = useId();
  const cells = useRef(new Map<string, HTMLButtonElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<AttendanceMarks>(defaultMarks ?? {});
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [said, setSaid] = useState("");
  const current = marks ?? own;

  const nowAt = now === undefined ? Date.now() : new Date(now).getTime();
  const today = dayKeyAt(Number.isNaN(nowAt) ? Date.now() : nowAt, timeZone);
  const columns: Column[] = [];
  for (const session of sessions) {
    const day = dayOf(session.date, timeZone);
    if (day) columns.push({ session, key: day.key, ms: day.ms, future: day.key > today, today: day.key === today });
  }
  const personIds = people.map((person) => person.id);
  const heldIds = columns.filter((column) => !column.future).map((column) => column.session.id);
  const empty = people.length === 0 || columns.length === 0;

  // One cell is in the tab order: the one last used, or today's session, or the latest one that has happened.
  const lastHeld = columns.reduce((found, column, index) => (column.future ? found : index), 0);
  const todayColumn = columns.findIndex((column) => column.today);
  const stop = {
    row: Math.min(active?.row ?? 0, Math.max(0, people.length - 1)),
    col: Math.min(active?.col ?? (todayColumn >= 0 ? todayColumn : lastHeld), Math.max(0, columns.length - 1)),
  };

  // On a narrow screen the sessions are wider than the card: when the register appears and today is out of sight, its column is brought into view.
  useEffect(() => {
    const box = scroller.current;
    const column = box?.querySelector<HTMLElement>('[aria-current="date"]');
    if (!box || !column) return;
    const pinned = box.querySelector("th")?.getBoundingClientRect().width ?? 0;
    const area = box.getBoundingClientRect();
    const rect = column.getBoundingClientRect();
    if (rect.left >= area.left + pinned && rect.right <= area.right) return;
    box.scrollLeft += rect.left - area.left - pinned - (area.width - pinned - rect.width) / 2;
  }, [today, columns.length]);

  function apply(changes: readonly AttendanceChange[], next: AttendanceMarks, message: string) {
    if (marks === undefined) setOwn(next);
    onMarkChange?.(changes, next);
    setSaid(message);
  }

  function change(person: AttendancePerson, column: Column, mark: AttendanceMark | undefined) {
    if (readOnly || column.future || markOf(current, person.id, column.session.id) === mark) return;
    const date = shortDateText(column.ms, locale);
    apply(
      [{ personId: person.id, sessionId: column.session.id, mark }],
      withMark(current, person.id, column.session.id, mark),
      mark ? fill(words.marked, { person: person.name, mark: markWords[mark].toLowerCase(), date }) : fill(words.cleared, { person: person.name, date }),
    );
  }

  /** Marks everyone who has no mark in the session present: a mark that was set on purpose is never overwritten. */
  function markRestPresent(column: Column) {
    const rest = people.filter((person) => !markOf(current, person.id, column.session.id));
    if (readOnly || column.future || !rest.length) return;
    let next = current;
    const changes: AttendanceChange[] = [];
    for (const person of rest) {
      next = withMark(next, person.id, column.session.id, "present");
      changes.push({ personId: person.id, sessionId: column.session.id, mark: "present" });
    }
    apply(changes, next, fill(words.bulk, { count: numberText(rest.length, locale), date: shortDateText(column.ms, locale) }));
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: number, col: number) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const lastRow = people.length - 1;
    const lastCol = columns.length - 1;
    let target: [number, number] | null = null;
    switch (event.key) {
      case "ArrowRight":
        target = [row, Math.min(lastCol, col + 1)];
        break;
      case "ArrowLeft":
        target = [row, Math.max(0, col - 1)];
        break;
      case "ArrowDown":
        target = [Math.min(lastRow, row + 1), col];
        break;
      case "ArrowUp":
        target = [Math.max(0, row - 1), col];
        break;
      case "Home":
        target = [row, 0];
        break;
      case "End":
        target = [row, lastCol];
        break;
      case "PageUp":
        target = [0, col];
        break;
      case "PageDown":
        target = [lastRow, col];
        break;
      case "Backspace":
      case "Delete": {
        event.preventDefault();
        const person = people[row];
        const column = columns[col];
        if (person && column) change(person, column, undefined);
        return;
      }
      default: {
        const mark = event.key.length === 1 ? markOfLetter(event.key) : undefined;
        if (!mark) return;
        event.preventDefault();
        const person = people[row];
        const column = columns[col];
        if (person && column) change(person, column, mark);
        return;
      }
    }
    // Arrow keys move the focus; the menu opens with Enter or Space (ArrowDown must not open it here).
    event.preventDefault();
    cells.current.get(cellKey(target[0], target[1]))?.focus();
  }

  if (empty) {
    return (
      <div data-slot="attendance-register" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </div>
    );
  }

  return (
    <div data-slot="attendance-register" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {/* A register that scrolls sideways takes the keyboard too: the region can be focused and scrolled. The scroll padding is the width of the pinned column, so a cell the browser scrolls into view lands beside it and not beneath it. */}
        <div
          role="region"
          aria-label={words.caption}
          aria-describedby={hintId}
          tabIndex={0}
          ref={scroller}
          className="relative scroll-pl-36 overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 @lg:scroll-pl-52"
        >
          <table data-slot="table" className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <TableCaption className="sr-only">{words.caption}</TableCaption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className={cn(PINNED, "z-20 h-auto border-b py-3 align-bottom text-[0.8125rem]")}>
                  {words.people}
                </TableHead>
                {columns.map((column) => {
                  const unmarked = people.filter((person) => !markOf(current, person.id, column.session.id)).length;
                  const everyone = unmarked === people.length;
                  const date = shortDateText(column.ms, locale);
                  return (
                    <TableHead
                      key={column.session.id}
                      scope="col"
                      aria-current={column.today ? "date" : undefined}
                      aria-labelledby={`${headingId}-${column.session.id}`}
                      className={cn("h-auto w-[5.5rem] min-w-[5.5rem] border-b border-border px-1.5 py-3 text-center align-top font-normal whitespace-normal", column.today && "bg-muted/60")}
                    >
                      <span id={`${headingId}-${column.session.id}`} className="sr-only">
                        {longDateText(column.ms, locale)}
                        {column.session.title ? `: ${column.session.title}` : ""}
                        {column.today ? `, ${words.today}` : column.future ? `, ${words.upcoming}` : ""}
                      </span>
                      <span aria-hidden="true" className="block text-xs text-muted-foreground">
                        {weekdayText(column.ms, locale)}
                      </span>
                      <span aria-hidden="true" className="block text-sm font-semibold tabular-nums text-foreground">
                        {date}
                      </span>
                      <span aria-hidden="true" title={column.session.title} className="mt-1 block h-[1.7rem] text-[0.6875rem] leading-[0.85rem] text-muted-foreground">
                        <span className="line-clamp-2">{column.session.title}</span>
                      </span>
                      <span aria-hidden="true" className="mt-1 block h-4 text-[0.6875rem] leading-4 font-medium text-foreground">
                        {column.today ? words.today : column.future ? <span className="font-normal text-muted-foreground">{words.upcoming}</span> : null}
                      </span>
                      <span className="mt-1 block h-6">
                        {!readOnly && !column.future && unmarked > 0 ? (
                          <button
                            type="button"
                            aria-label={fill(everyone ? words.allPresentFor : words.restPresentFor, { date })}
                            onClick={() => markRestPresent(column)}
                            className="inline-flex h-6 items-center rounded-md border border-border bg-background px-1.5 text-[0.6875rem] font-medium whitespace-nowrap text-foreground outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                          >
                            {everyone ? words.allPresent : words.restPresent}
                          </button>
                        ) : null}
                      </span>
                    </TableHead>
                  );
                })}
                <TableHead scope="col" className="h-auto w-32 min-w-32 border-b border-l border-border px-4 py-3 text-right align-bottom text-[0.8125rem]">
                  {words.rate}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {people.map((person, row) => {
                const tally = tallyPerson(current, person.id, heldIds);
                return (
                  <TableRow key={person.id} className="group/row hover:bg-[color-mix(in_oklch,var(--card),var(--muted)_45%)]">
                    <TableHead scope="row" className={cn(PINNED, "h-auto border-b py-2 text-left font-normal whitespace-normal text-foreground")}>
                      <span className="flex items-center gap-3">
                        <Avatar size="sm" aria-hidden="true" className="@max-lg:hidden">
                          {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                          <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-[-0.01em]">{person.name}</span>
                      </span>
                    </TableHead>
                    {columns.map((column, col) => {
                      const mark = markOf(current, person.id, column.session.id);
                      const date = shortDateText(column.ms, locale);
                      const spoken = fill(words.cell, { person: person.name, date, mark: column.future ? words.notOpen : mark ? markWords[mark].toLowerCase() : words.notMarked });
                      const tabbable = stop.row === row && stop.col === col;
                      return (
                        <TableCell key={column.session.id} className={cn("border-b border-border p-2 text-center", column.today && "bg-muted/60")}>
                          {readOnly ? (
                            <span className="inline-flex size-9 items-center justify-center">
                              <span className="sr-only">{spoken}</span>
                              {mark ? <MarkChip mark={mark} /> : null}
                            </span>
                          ) : column.future ? (
                            <button
                              ref={(element) => {
                                if (element) cells.current.set(cellKey(row, col), element);
                                else cells.current.delete(cellKey(row, col));
                              }}
                              type="button"
                              aria-label={spoken}
                              aria-disabled="true"
                              tabIndex={tabbable ? 0 : -1}
                              onFocus={() => setActive({ row, col })}
                              onKeyDown={(event) => onCellKeyDown(event, row, col)}
                              className={cn(CHIP_BASE, "size-9 cursor-not-allowed border-dotted border-border/80 bg-transparent outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40")}
                            />
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  ref={(element) => {
                                    if (element) cells.current.set(cellKey(row, col), element);
                                    else cells.current.delete(cellKey(row, col));
                                  }}
                                  type="button"
                                  aria-label={spoken}
                                  tabIndex={tabbable ? 0 : -1}
                                  onFocus={() => setActive({ row, col })}
                                  onKeyDown={(event) => onCellKeyDown(event, row, col)}
                                  className={cn(
                                    CHIP_BASE,
                                    "size-9 outline-none motion-safe:transition-[background-color,border-color,color,box-shadow,transform] motion-safe:duration-150 motion-safe:active:translate-y-px",
                                    "focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:ring-[3px] data-[state=open]:ring-ring/25",
                                    mark ? [CHIP[mark], CHIP_HOVER[mark]] : OPEN_CELL,
                                  )}
                                >
                                  {mark ? <MarkGlyph mark={mark} /> : <IconPlus aria-hidden="true" size={14} />}
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="center" collisionPadding={8} className="w-64 max-w-[calc(100vw-2rem)]">
                                <DropdownMenuLabel className="max-w-full truncate">{fill(words.menu, { person: person.name, date })}</DropdownMenuLabel>
                                <DropdownMenuRadioGroup value={mark ?? ""} onValueChange={(next) => change(person, column, isMark(next) ? next : undefined)}>
                                  {MARK_ORDER.map((option) => (
                                    <DropdownMenuRadioItem key={option} value={option} className="gap-2.5 py-1.5">
                                      <MarkChip mark={option} className="size-6 rounded-md [&_svg]:size-3.5" />
                                      <span className="flex min-w-0 flex-1 flex-col leading-tight">
                                        <span className="font-medium">{markWords[option]}</span>
                                        <span className="text-xs text-muted-foreground">{meanings[option]}</span>
                                      </span>
                                      <DropdownMenuShortcut>{MARK_KEY[option]}</DropdownMenuShortcut>
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem disabled={!mark} onSelect={() => change(person, column, undefined)}>
                                  {words.clear}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="border-b border-l border-border px-4 py-2 text-right align-middle">
                      {tally.percent === null ? (
                        <span className="text-xs text-muted-foreground">{words.noRate}</span>
                      ) : (
                        <>
                          <span className="block text-sm font-medium tabular-nums">{fill(words.rateOf, { came: numberText(tally.came, locale), counted: numberText(tally.counted, locale) })}</span>
                          <span className="mt-1 flex items-center justify-end gap-2">
                            <span aria-hidden="true" className="block h-1 w-12 overflow-hidden rounded-full bg-border">
                              <span className="block h-full rounded-full bg-foreground" style={{ width: `${tally.percent}%` }} />
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">{fill(words.percent, { percent: numberText(tally.percent, locale) })}</span>
                          </span>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter className="bg-transparent">
              <TableRow className="hover:bg-transparent">
                <TableHead scope="row" className={cn(PINNED, "h-auto border-t border-border bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)] py-3 text-left text-[0.8125rem] font-medium text-foreground")}>
                  {words.came}
                </TableHead>
                {columns.map((column) => {
                  const tally = tallySession(current, column.session.id, personIds);
                  const marked = tally.unmarked < people.length;
                  const total = numberText(people.length, locale);
                  return (
                    <TableCell key={column.session.id} className={cn("border-t border-border bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)] px-1.5 py-3 text-center align-top", column.today && "bg-muted")}>
                      {column.future ? (
                        <span aria-hidden="true" className="text-xs text-muted-foreground">
                          –
                        </span>
                      ) : marked ? (
                        <>
                          <span className="sr-only">{fill(words.cameWords, { came: numberText(tally.came, locale), total })}</span>
                          <span aria-hidden="true" className="text-sm font-medium tabular-nums">
                            {fill(words.cameOf, { came: numberText(tally.came, locale), total })}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">{words.nobody}</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="border-t border-l border-border bg-[color-mix(in_oklch,var(--card),var(--muted)_55%)]" />
              </TableRow>
            </TableFooter>
          </table>
        </div>

        <div className="border-t border-border px-4 py-4">
          <dl aria-label={words.legend} className="grid grid-cols-2 gap-x-6 gap-y-3 @3xl:grid-cols-4">
            {MARK_ORDER.map((mark) => (
              <div key={mark} className="grid grid-cols-[1.5rem_minmax(0,1fr)] content-start gap-x-2.5">
                <dt className="col-span-2 flex items-center gap-2.5 text-[0.8125rem] leading-6 font-medium">
                  <MarkChip mark={mark} className="size-6 rounded-md [&_svg]:size-3.5" />
                  {markWords[mark]}
                </dt>
                <dd className="col-start-2 text-xs leading-snug text-muted-foreground">{meanings[mark]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3.5 border-t border-border pt-3 text-xs leading-relaxed text-pretty text-muted-foreground">{words.rateNote}</p>
          {readOnly ? null : (
            <p className="mt-1.5 text-xs leading-relaxed text-pretty text-muted-foreground">
              <span className="@lg:hidden">{words.hintTouch}</span>
              <span className="hidden @lg:inline">{words.hint}</span>
            </p>
          )}
        </div>
      </div>
      <p id={hintId} className="sr-only">
        {readOnly ? words.rateNote : words.hint}
      </p>
      <p aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
