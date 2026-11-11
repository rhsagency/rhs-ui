"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";

import { IconAlertCircle, IconCheck, IconChevronLeft, IconChevronRight, IconLock, IconWarning } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  addDays,
  cellMinutes,
  dayNumberText,
  dayStatus,
  durationText,
  fill,
  isDayKey,
  isoWeek,
  longDayText,
  minutesOf,
  minutesText,
  numberText,
  parseHours,
  rangeText,
  todayKey,
  weekDays,
  weekStartOf,
  weekdayOf,
  weekdayText,
  withHours,
  type DayStatus,
  type HoursFormat,
  type TimesheetChange,
  type TimesheetEntries,
  type TimesheetLabels,
  type TimesheetProject,
} from "@rhs-ui/application/timesheet-grid/hours";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { HoursFormat, TimesheetChange, TimesheetEntries, TimesheetLabels, TimesheetProject } from "@rhs-ui/application/timesheet-grid/hours";

export interface TimesheetGridProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** What time can be spent on, one row each: an id, a name and the client. */
  projects: readonly TimesheetProject[];
  /** The first day of the week shown, as "2026-10-26", when you control the week. The week is seven days from it, and "This week" goes to the week of today that starts on the same weekday. Pair it with `onWeekChange`. */
  weekStart?: string;
  /** The first day of the week to start on, when the grid keeps the week itself. Default: this week, from Monday. */
  defaultWeekStart?: string;
  /** Called with the first day of the new week when the arrows or "This week" are pressed. */
  onWeekChange?: (weekStart: string) => void;
  /** The hours, as `entries[projectId]["2026-10-26"]`, when you control them. Pair it with `onChange`. */
  entries?: TimesheetEntries;
  /** The hours to start from, when the grid keeps them itself. */
  defaultEntries?: TimesheetEntries;
  /** A cell was set or emptied: the whole new map, and what changed. */
  onChange?: (entries: TimesheetEntries, change: TimesheetChange) => void;
  /** Hours a working day should come to. A day under it says how much is missing, one that reaches it says so. Default 8. */
  dailyTarget?: number;
  /** The most a day may hold. A day over it is flagged in words. Default 12. */
  dailyCap?: number;
  /** The weekdays that have a target, 0 for Sunday to 6 for Saturday. Default Monday to Friday. */
  workingDays?: readonly number[];
  /** Makes every cell read-only, for a week that is approved or closed. The banner above the grid says why. */
  locked?: boolean;
  /** Why the week is locked: "Approved by Mara Visser on 2 November. Ask a manager to reopen it." */
  lockedReason?: string;
  /** How hours are written: decimal "7.5" or as a clock "7:30". What can be typed does not depend on it. Default "decimal". */
  format?: HoursFormat;
  /** What "now" is, for marking today and telling days that are over from days to come. Pass it for output that does not change between server and browser. Default: the current time. */
  now?: Date | string | number;
  /** The language of the dates and numbers. Default "en-US". */
  locale?: string;
  /** The time zone that decides which day today is. Default "UTC". */
  timeZone?: string;
  /** The words the grid says, for translation. */
  labels?: TimesheetLabels;
}

/** The failure text, darkened toward the foreground so small red words reach 4.5:1. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** The first column stays put while the days scroll sideways. It is solid, so nothing shows through it, and narrower on a phone, so a fourth day shows beside it and the week is seen to go on. */
const PINNED =
  "sticky left-0 z-10 w-28 min-w-28 max-w-28 border-r border-border bg-card px-3 group-hover/row:bg-[color-mix(in_oklch,var(--card),var(--muted)_50%)] @lg:w-44 @lg:min-w-44 @lg:max-w-44 @lg:px-4";

/** A soft shade along the right edge of the table while there is more of the week behind it: the cue that it scrolls. */
const EDGE =
  "pointer-events-none absolute inset-y-0 right-0 z-30 w-5 shadow-[inset_-16px_0_12px_-12px_color-mix(in_oklch,var(--foreground)_24%,transparent)] transition-opacity duration-150 motion-reduce:transition-none dark:shadow-[inset_-16px_0_12px_-12px_rgb(0_0_0/0.7)]";

const cellKey = (row: number, col: number): string => `${row}:${col}`;

/** A cell whose text could not be read, with what was said about it. The one that is last in a list is the latest. */
interface Problem {
  /** The project and the day, so the mark follows the cell and not the place it happens to be in. */
  key: string;
  message: string;
}

const NO_PROBLEMS: readonly Problem[] = [];

const problemKey = (projectId: string, day: string): string => `${projectId}|${day}`;

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

interface CellProps {
  label: string;
  hours: number;
  format: HoursFormat;
  locale: string;
  readOnly: boolean;
  tabbable: boolean;
  invalid: boolean;
  describedBy: string | undefined;
  register: (element: HTMLInputElement | null) => void;
  onActivate: () => void;
  onEdit: () => void;
  onCommit: (text: string) => boolean;
  onRevert: () => void;
  onMove: (rowStep: number, colStep: number) => void;
}

/** One cell: a text field that reads 7.5, 7:30 or 7h 30m, shows the hours in tabular figures, and saves when you leave it or press Enter. */
function Cell({ label, hours, format, locale, readOnly, tabbable, invalid, describedBy, register, onActivate, onEdit, onCommit, onRevert, onMove }: CellProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const pointer = useRef(false);
  const shown = draft ?? (hours > 0 ? minutesText(minutesOf(hours), format, locale) : "");

  // Saves what was typed. A refusal keeps the text and the focus, so it can be fixed; nothing typed is nothing to save.
  const commit = (): boolean => {
    if (draft === null) return true;
    const accepted = onCommit(draft);
    if (accepted) setDraft(null);
    return accepted;
  };

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // A key that belongs to an input method (choosing a candidate with Enter) is not for the grid.
    if (event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const input = event.currentTarget;
    const atEdge = (side: "start" | "end") => input.selectionStart === input.selectionEnd && input.selectionStart === (side === "start" ? 0 : input.value.length);
    const go = (rowStep: number, colStep: number) => {
      event.preventDefault();
      if (commit()) onMove(rowStep, colStep);
    };
    switch (event.key) {
      case "Enter":
        go(event.shiftKey ? -1 : 1, 0);
        return;
      case "ArrowDown":
        go(1, 0);
        return;
      case "ArrowUp":
        go(-1, 0);
        return;
      // Sideways, the arrow keys move the caret while there is text being typed, and move the cell when the caret is at its end.
      case "ArrowRight":
        if (draft === null || atEdge("end")) go(0, 1);
        return;
      case "ArrowLeft":
        if (draft === null || atEdge("start")) go(0, -1);
        return;
      case "Escape":
        if (draft !== null || invalid) {
          event.preventDefault();
          setDraft(null);
          onRevert();
        }
        return;
      default:
    }
  }

  return (
    <Input
      ref={register}
      type="text"
      // Not "decimal": that keypad has no colon and no letters, and 7:30 and 7h 30m are as welcome as 7.5.
      inputMode="text"
      enterKeyHint="next"
      autoComplete="off"
      spellCheck={false}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? describedBy : undefined}
      readOnly={readOnly}
      tabIndex={tabbable ? 0 : -1}
      placeholder="–"
      value={shown}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        setDraft(event.target.value);
        onEdit();
      }}
      onFocus={(event) => {
        onActivate();
        // Typing replaces what is there, as in a spreadsheet.
        event.currentTarget.select();
      }}
      onMouseDown={(event: MouseEvent<HTMLInputElement>) => {
        pointer.current = document.activeElement !== event.currentTarget;
      }}
      onMouseUp={(event: MouseEvent<HTMLInputElement>) => {
        // The click that gave the field focus must not undo the selection the focus just made.
        if (pointer.current) event.preventDefault();
        pointer.current = false;
      }}
      onBlur={() => {
        commit();
      }}
      onKeyDown={onKeyDown}
      className={cn(
        "h-9 w-full min-w-0 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none",
        "placeholder:text-muted-foreground/40 hover:border-border focus-visible:bg-background",
        "read-only:cursor-default read-only:hover:border-transparent read-only:focus-visible:bg-transparent",
      )}
    />
  );
}

/** A day's verdict under its total: reached, short, still to go or over the cap, always in words, with an icon as well. */
function Status({ status, labels, format, locale, cap }: { status: DayStatus; labels: Required<TimesheetLabels>; format: HoursFormat; locale: string; cap: string }) {
  if (status.kind === "none") return null;
  // The icon sits in the line of text, so when the words wrap it stays next to the first of them.
  const line = "mt-1 block text-right text-[0.6875rem] leading-tight font-normal text-pretty";
  const icon = "mr-1 inline size-3 align-[-1px]";
  if (status.kind === "met") {
    return (
      <span className={cn(line, "text-muted-foreground")}>
        <IconCheck aria-hidden="true" className={cn(icon, "text-foreground")} />
        {labels.targetMet}
      </span>
    );
  }
  if (status.kind === "over") {
    return (
      <span className={cn(line, "font-medium", DANGER_TEXT)}>
        <IconWarning aria-hidden="true" className={icon} />
        {fill(labels.overCap, { cap })}
      </span>
    );
  }
  const hours = durationText(status.minutes, format, locale, labels.unit);
  return <span className={cn(line, status.past ? "font-medium text-foreground" : "text-muted-foreground")}>{fill(status.past ? labels.hoursShort : labels.hoursToGo, { hours })}</span>;
}

/**
 * A weekly timesheet: projects down the side, the seven days across, and in every cell the hours, typed as 7.5, 7:30 or
 * 7h 30m and shown in tabular figures. Row totals sit at the end and day totals in the footer; a day that reached its
 * target, is short of it, is still to come or went over the cap says so in words with an icon, never in colour alone,
 * and today's column carries the word Today. The arrow keys move between cells, Enter saves and moves down, Escape
 * undoes, and the week arrows and "This week" change the range. A locked week makes every cell read-only and says why.
 * On a narrow screen the days scroll sideways while the project names stay put.
 */
export function TimesheetGrid({
  projects,
  weekStart,
  defaultWeekStart,
  onWeekChange,
  entries,
  defaultEntries,
  onChange,
  dailyTarget = 8,
  dailyCap = 12,
  workingDays = [1, 2, 3, 4, 5],
  locked = false,
  lockedReason,
  format = "decimal",
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: TimesheetGridProps) {
  const words: Required<TimesheetLabels> = { ...DEFAULT_LABELS, ...labels };
  const problemId = useId();
  const cells = useRef(new Map<string, HTMLInputElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const nowAt = now === undefined ? Date.now() : new Date(now).getTime();
  const today = todayKey(Number.isNaN(nowAt) ? Date.now() : nowAt, timeZone);

  const [ownWeek, setOwnWeek] = useState(() => defaultWeekStart ?? weekStartOf(today, 1));
  const [ownEntries, setOwnEntries] = useState<TimesheetEntries>(defaultEntries ?? {});
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const [flagged, setFlagged] = useState<{ week: string; list: readonly Problem[] }>({ week: "", list: NO_PROBLEMS });
  const [more, setMore] = useState(false);
  const [said, setSaid] = useState("");

  const candidate = weekStart ?? ownWeek;
  const first = isDayKey(candidate) ? candidate : weekStartOf(today, 1);
  const days = weekDays(first);
  const last = days[6] ?? first;
  const thisWeek = weekStartOf(today, weekdayOf(first));
  const current = entries ?? ownEntries;
  const range = rangeText(first, last, locale);

  // Every cell whose text was refused stays marked until that cell is edited, saved or undone, whatever happens in the others. The text lives in the cell and goes when the week does, so the marks go with it and do not wait for the week to come back.
  if (flagged.week !== first && flagged.list.length > 0) setFlagged({ week: first, list: NO_PROBLEMS });
  const problems = flagged.week === first ? flagged.list : NO_PROBLEMS;
  const messages = new Map(problems.map((problem) => [problem.key, problem.message]));
  const latest = problems[problems.length - 1];
  const flag = (key: string, message: string) =>
    setFlagged((previous) => ({ week: first, list: [...(previous.week === first ? previous.list : NO_PROBLEMS).filter((problem) => problem.key !== key), { key, message }] }));
  const unflag = (key: string) =>
    setFlagged((previous) => (previous.week === first && previous.list.some((problem) => problem.key === key) ? { week: first, list: previous.list.filter((problem) => problem.key !== key) } : previous));

  const working = new Set(workingDays);
  const workingCount = days.filter((day) => working.has(weekdayOf(day))).length;
  const dayTotals = days.map((day) => projects.reduce((sum, project) => sum + cellMinutes(current, project.id, day), 0));
  const weekTotal = dayTotals.reduce((sum, minutes) => sum + minutes, 0);
  const weekTarget = minutesOf(workingCount * dailyTarget);
  const capText = durationText(minutesOf(dailyCap), format, locale, words.unit);

  // One cell is in the tab order: the one last used, or today's, or the first.
  const todayColumn = Math.max(0, days.indexOf(today));
  const stop = { row: clamp(active?.row ?? 0, 0, Math.max(0, projects.length - 1)), col: clamp(active?.col ?? todayColumn, 0, 6) };

  // On a narrow screen the week is wider than the card: when a week appears and today's column is out of sight, it is brought into view.
  useEffect(() => {
    const box = scroller.current;
    const column = box?.querySelector<HTMLElement>('[aria-current="date"]');
    if (!box || !column) return;
    const pinned = box.querySelector("th")?.getBoundingClientRect().width ?? 0;
    const area = box.getBoundingClientRect();
    const rect = column.getBoundingClientRect();
    if (rect.left >= area.left + pinned && rect.right <= area.right) return;
    box.scrollLeft += rect.left - area.left - pinned - (area.width - pinned - rect.width) / 2;
  }, [first, today]);

  // Whether there is more of the week beyond the right edge, so the cue shows only while that is true.
  const measure = useCallback(() => {
    const box = scroller.current;
    if (!box) return;
    const beyond = box.scrollWidth - box.scrollLeft - box.clientWidth > 2;
    setMore((previous) => (previous === beyond ? previous : beyond));
  }, []);

  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, [measure, projects.length]);

  const goTo = (start: string) => {
    if (weekStart === undefined) setOwnWeek(start);
    onWeekChange?.(start);
  };

  const focusCell = (row: number, col: number, rowStep: number, colStep: number) => {
    const target = cells.current.get(cellKey(clamp(row + rowStep, 0, projects.length - 1), clamp(col + colStep, 0, 6)));
    target?.focus();
  };

  // Reads what was typed, and either saves it or says what is wrong and keeps the text where it can be fixed, with its cell marked.
  function commit(project: TimesheetProject, day: string, text: string): boolean {
    const key = problemKey(project.id, day);
    const parsed = parseHours(text);
    if (!parsed.ok) {
      const message = parsed.reason === "range" ? words.tooMany : fill(words.invalid, { text: text.trim() });
      flag(key, message);
      setSaid(message);
      return false;
    }
    unflag(key);
    if (minutesOf(parsed.hours) === cellMinutes(current, project.id, day)) return true;
    const next = withHours(current, project.id, day, parsed.hours);
    if (entries === undefined) setOwnEntries(next);
    onChange?.(next, { projectId: project.id, date: day, hours: parsed.hours });
    const values = { project: project.name, day: longDayText(day, locale) };
    setSaid(parsed.hours > 0 ? fill(words.saved, { ...values, hours: minutesText(minutesOf(parsed.hours), format, locale) }) : fill(words.cleared, values));
    return true;
  }

  if (!projects.length) {
    return (
      <div data-slot="timesheet-grid" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </div>
    );
  }

  return (
    <div data-slot="timesheet-grid" data-locked={locked || undefined} className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border px-4 py-3.5">
          <div className="min-w-0">
            <p aria-live="polite" className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] tabular-nums">
              {range}
            </p>
            {/* The week of the middle day: a week that starts on a Sunday belongs to the ISO week most of its days are in. */}
            <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{fill(words.week, { number: numberText(isoWeek(addDays(first, 3)), locale) })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <div>
              <p className="text-xs text-muted-foreground">{words.weekTotal}</p>
              <p className="text-sm leading-snug font-semibold tabular-nums">
                {fill(words.weekProgress, {
                  hours: minutesText(weekTotal, format, locale),
                  target: durationText(weekTarget, format, locale, words.unit),
                })}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button type="button" variant="outline" size="icon-sm" aria-label={words.previousWeek} onClick={() => goTo(addDays(first, -7))}>
                <IconChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-disabled={first === thisWeek || undefined}
                onClick={() => first !== thisWeek && goTo(thisWeek)}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                {words.thisWeek}
              </Button>
              <Button type="button" variant="outline" size="icon-sm" aria-label={words.nextWeek} onClick={() => goTo(addDays(first, 7))}>
                <IconChevronRight />
              </Button>
            </div>
          </div>
        </div>

        {locked ? (
          <p role="note" className="flex items-start gap-2.5 border-b border-border bg-muted/50 px-4 py-3 text-sm leading-snug">
            <IconLock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 text-pretty">{lockedReason ?? words.locked}</span>
          </p>
        ) : null}

        {/* The days scroll sideways on a narrow screen, and a soft shade at the right edge says so while there is more of the week. The scroll padding is the width of the pinned column, so a cell the browser scrolls into view lands beside it and not beneath it. */}
        <div className="relative">
          <div ref={scroller} onScroll={measure} className="relative scroll-pl-28 overflow-x-auto @lg:scroll-pl-44">
            <table data-slot="table" className="w-full min-w-[44rem] caption-bottom border-collapse text-sm">
              <TableCaption className="sr-only">{fill(words.caption, { range })}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className={cn(PINNED, "z-20 h-auto py-3 align-bottom text-[0.8125rem]")}>
                    {words.project}
                  </TableHead>
                  {days.map((day) => {
                    const isToday = day === today;
                    const off = !working.has(weekdayOf(day));
                    return (
                      <TableHead
                        key={day}
                        scope="col"
                        aria-current={isToday ? "date" : undefined}
                        className={cn("h-auto min-w-[4.5rem] py-3 pr-3 pl-1 text-right align-bottom font-normal", isToday && "bg-muted/60", off && "text-muted-foreground/80")}
                      >
                        <span className="sr-only">
                          {longDayText(day, locale)}
                          {isToday ? `, ${words.today}` : ""}
                        </span>
                        <span aria-hidden="true" className="block text-xs">
                          {weekdayText(day, locale)}
                        </span>
                        <span aria-hidden="true" className={cn("block text-sm font-semibold tabular-nums", isToday ? "text-foreground" : "text-foreground/80")}>
                          {dayNumberText(day, locale)}
                        </span>
                        {isToday ? (
                          <span aria-hidden="true" className="mt-0.5 block text-[0.6875rem] font-semibold text-foreground">
                            {words.today}
                          </span>
                        ) : null}
                      </TableHead>
                    );
                  })}
                  <TableHead scope="col" className="h-auto w-20 min-w-20 px-4 py-3 text-right align-bottom text-[0.8125rem]">
                    {words.total}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project, row) => {
                  const rowTotal = days.reduce((sum, day) => sum + cellMinutes(current, project.id, day), 0);
                  return (
                    <TableRow key={project.id} className="group/row">
                      <TableHead scope="row" className={cn(PINNED, "h-auto py-2.5 text-left font-normal whitespace-normal text-foreground")}>
                        <span className="block text-sm leading-snug font-medium tracking-[-0.01em] @max-lg:line-clamp-2 @lg:truncate">{project.name}</span>
                        {project.client ? <span className="block truncate text-xs text-muted-foreground">{project.client}</span> : null}
                      </TableHead>
                      {days.map((day, col) => {
                        const key = cellKey(row, col);
                        const flagKey = problemKey(project.id, day);
                        const message = messages.get(flagKey);
                        const messageId = `${problemId}-${row}-${col}`;
                        return (
                          <TableCell key={day} className={cn("p-1", day === today && "bg-muted/60")}>
                            <Cell
                              label={fill(words.cell, { project: project.name, day: longDayText(day, locale) })}
                              hours={current[project.id]?.[day] ?? 0}
                              format={format}
                              locale={locale}
                              readOnly={locked}
                              tabbable={stop.row === row && stop.col === col}
                              invalid={message !== undefined}
                              describedBy={messageId}
                              register={(element) => {
                                if (element) cells.current.set(key, element);
                                else cells.current.delete(key);
                              }}
                              onActivate={() => setActive({ row, col })}
                              onEdit={() => unflag(flagKey)}
                              onCommit={(text) => commit(project, day, text)}
                              onRevert={() => unflag(flagKey)}
                              onMove={(rowStep, colStep) => focusCell(row, col, rowStep, colStep)}
                            />
                            {/* Each marked cell is described by its own words, so with several to fix none of them is read the message of another. */}
                            {message !== undefined ? (
                              <span id={messageId} className="sr-only">
                                {message}
                              </span>
                            ) : null}
                          </TableCell>
                        );
                      })}
                      <TableCell className={cn("px-4 py-2.5 text-right text-sm tabular-nums", rowTotal === 0 ? "text-muted-foreground" : "font-medium")}>
                        {minutesText(rowTotal, format, locale)}
                        <span className="sr-only"> {words.hoursWord}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="row" className={cn(PINNED, "h-auto bg-[color-mix(in_oklch,var(--card),var(--muted)_50%)] py-3 text-left align-top text-[0.8125rem] font-medium text-foreground")}>
                    {words.total}
                  </TableHead>
                  {days.map((day, index) => {
                    const minutes = dayTotals[index] ?? 0;
                    const when = day < today ? "past" : day === today ? "today" : "future";
                    return (
                      <TableCell key={day} className={cn("py-3 pr-3 pl-1 text-right align-top", day === today && "bg-muted/60")}>
                        <span className={cn("text-sm tabular-nums", minutes === 0 ? "text-muted-foreground" : "font-semibold")}>{minutesText(minutes, format, locale)}</span>
                        <span className="sr-only"> {words.hoursWord}</span>
                        <Status status={dayStatus(minutes, dailyTarget, dailyCap, working.has(weekdayOf(day)), when)} labels={words} format={format} locale={locale} cap={capText} />
                      </TableCell>
                    );
                  })}
                  <TableCell className={cn("px-4 py-3 text-right align-top text-sm tabular-nums", weekTotal === 0 ? "text-muted-foreground" : "font-semibold")}>
                    {minutesText(weekTotal, format, locale)}
                    <span className="sr-only"> {words.hoursWord}</span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            </table>
          </div>
          <div aria-hidden="true" className={cn(EDGE, more ? "opacity-100" : "opacity-0")} />
        </div>

        <div className="flex min-h-11 items-start gap-2 border-t border-border px-4 py-3 text-xs leading-snug">
          {latest ? (
            <p role="alert" className={cn("flex items-start gap-2 font-medium", DANGER_TEXT)}>
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className="min-w-0">{latest.message}</span>
            </p>
          ) : (
            <p className="text-pretty text-muted-foreground">
              <span className="@lg:hidden">{words.hintTouch}</span>
              <span className="hidden @lg:inline">{words.hint}</span>
            </p>
          )}
        </div>
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
