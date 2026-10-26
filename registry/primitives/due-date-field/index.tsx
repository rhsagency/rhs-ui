"use client";

import { useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCalendar, IconCheck } from "@rhs-ui/icons";
import { Calendar } from "@rhs-ui/primitives/calendar";
import {
  chipDate,
  dateInWords,
  DEFAULT_LABELS,
  dayNumber,
  defaultChips,
  distanceInWords,
  fromLocalDate,
  isoInZone,
  lengthInWords,
  parseIso,
  toLocalDate,
  type DueDateChip,
  type DueDateLabels,
} from "@rhs-ui/primitives/due-date-field/due-dates";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { DueDateChip, DueDateLabels } from "@rhs-ui/primitives/due-date-field/due-dates";

export interface DueDateFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "dir"> {
  /** The due date as "YYYY-MM-DD", when you control it. Null means no date. */
  value?: string | null;
  /** The due date to start with, when you do not control it. */
  defaultValue?: string | null;
  /** Called with the date as "YYYY-MM-DD", or null when No date is chosen. */
  onValueChange?: (date: string | null) => void;
  /** The moment the chips are worked out from: a Date, a timestamp or an ISO string. Leave it out and the browser's clock is used once the page has hydrated; pass it to render everything on the server, in a test or in a preview. */
  now?: Date | string | number;
  /** The locale that writes the dates and the distances. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar day `now` is read in. Default "UTC". */
  timeZone?: string;
  /** The quick picks, in order. Default: Today, Tomorrow and Next week (the coming Monday). */
  chips?: readonly DueDateChip[];
  /** Let the calendar offer days that have passed. Default false. A date that has passed and arrives as the value is always shown, and marked overdue. */
  allowPast?: boolean;
  /** Show the No date chip. Default true. Without it the field cannot be emptied once a date is set. */
  allowClear?: boolean;
  /** The first day of the week in the calendar: 1 is Monday (the default), 0 is Sunday. */
  weekStartsOn?: 0 | 1;
  /** The field's name for a plain form submit: the date as "YYYY-MM-DD", or empty. */
  name?: string;
  /** Dim the field and stop it responding. */
  disabled?: boolean;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<DueDateLabels>;
}

const NONE = "none";
const CUSTOM = "custom";

const noSubscription = (): (() => void) => () => undefined;

const CHIP = [
  "group/chip relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[0.8125rem] font-medium whitespace-nowrap text-foreground select-none",
  "transition-[background-color,border-color,color,box-shadow] duration-150 outline-none motion-reduce:transition-none",
  "hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_18%)] hover:bg-muted",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=checked]:hover:bg-foreground/90 data-[state=checked]:focus-visible:border-foreground",
  "active:not-disabled:translate-y-px",
  // Disabled, the chosen chip keeps its check and a quiet fill; a black slab at half strength would be the heaviest thing in the field.
  "disabled:pointer-events-none disabled:opacity-50 disabled:data-[state=checked]:border-border disabled:data-[state=checked]:bg-muted disabled:data-[state=checked]:text-foreground disabled:data-[state=checked]:opacity-100",
  // A touch screen gets a 44px target without the chip growing.
  "[@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:inset-x-0 [@media(pointer:coarse)]:before:-inset-y-[7px] [@media(pointer:coarse)]:before:content-['']",
].join(" ");

/** The check that slides in before a chosen chip's label, so the choice never rests on the fill alone. */
const MARK = "-mr-1.5 h-3.5 w-0 shrink-0 opacity-0 transition-[width,margin,opacity] duration-150 group-data-[state=checked]/chip:mr-0 group-data-[state=checked]/chip:w-3.5 group-data-[state=checked]/chip:opacity-100 motion-reduce:transition-none";

/**
 * A due date for a task or a deadline, the way people actually choose one:
 * Today, Tomorrow and Next week (the coming Monday) as chips, a Pick a date
 * chip that opens the calendar, and No date. The chips are one radio group, so
 * the arrow keys move between them and choose, and the group is a single tab
 * stop; the chosen chip is filled and carries a check. Under them the date is
 * written in words with the weekday and the distance ("Fri 23 Oct, in 3 days"),
 * and a date that has passed says "Overdue by 2 days" with a warning icon,
 * never by colour alone. The chips are worked out from `now` in `timeZone`, so
 * a task due tomorrow in Amsterdam is tomorrow for the server too. The
 * calendar keeps its own arrow-key grid and returns the focus to its chip.
 */
export function DueDateField({
  value,
  defaultValue = null,
  onValueChange,
  now,
  locale = "en-US",
  timeZone = "UTC",
  chips,
  allowPast = false,
  allowClear = true,
  weekStartsOn,
  name,
  disabled,
  labels: labelOverrides,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: DueDateFieldProps) {
  const labels: DueDateLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState<string | null>(defaultValue);
  const date = value === undefined ? own : value;
  const [open, setOpen] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const calendar = useRef<HTMLDivElement>(null);
  const custom = useRef<HTMLButtonElement | null>(null);

  // Without a `now`, "today" is the reader's: known only in the browser, so the server marks no chip and nothing mismatches.
  const browserToday = useSyncExternalStore(
    noSubscription,
    () => isoInZone(Date.now(), timeZone),
    () => null,
  );
  const today = now === undefined ? browserToday : isoInZone(now, timeZone);
  const quick = chips ?? defaultChips(labels);
  const resolved = today === null ? [] : quick.map((chip) => ({ chip, at: chipDate(chip, today) }));
  const match = date === null ? undefined : resolved.find((entry) => entry.at === date);
  const chosen = date === null ? (allowClear ? NONE : "") : (match?.chip.id ?? CUSTOM);
  const keys = [...quick.map((chip) => chip.id), CUSTOM, ...(allowClear ? [NONE] : [])];
  // One tab stop: the chosen chip, or the first when nothing is chosen.
  const stop = keys.includes(chosen) ? chosen : keys[0];

  function write(next: string | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function choose(key: string) {
    if (key === NONE) write(null);
    else if (key !== CUSTOM) {
      const entry = resolved.find((item) => item.chip.id === key);
      if (entry) write(entry.at);
    }
  }

  // Arrow keys move to the next chip and choose it, the way a radio group does; the one that opens the calendar is only focused.
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !backward && event.key !== "Home" && event.key !== "End") return;
    const items = [...(group.current?.querySelectorAll<HTMLButtonElement>("[role=radio]:not(:disabled)") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1) return;
    event.preventDefault();
    const next = items[event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (at + (forward ? 1 : -1) + items.length) % items.length];
    next?.focus();
    const key = next?.dataset.key;
    if (key && key !== CUSTOM) choose(key);
  }

  const radio = (key: string, content: ReactNode, extra?: ComponentProps<"button">) => (
    <button
      key={key}
      type="button"
      role="radio"
      data-key={key}
      aria-checked={chosen === key}
      data-state={chosen === key ? "checked" : "unchecked"}
      tabIndex={stop === key ? 0 : -1}
      disabled={disabled}
      className={CHIP}
      onClick={() => choose(key)}
      {...extra}
    >
      {content}
    </button>
  );

  const gap = date !== null && today !== null && parseIso(date) ? dayNumber(date) - dayNumber(today) : null;
  const lateBy = gap !== null && gap < 0 ? -gap : null;
  const dated = date === null ? "" : dateInWords(date, locale, today);
  const floor = !allowPast && today !== null ? (toLocalDate(today) ?? undefined) : undefined;
  // `min` blocks every day before today, the value too, and the calendar draws a blocked day struck through even when it is the chosen one. A value that has passed must
  // stay chosen and readable, so then the days before today are refused one by one instead, the value apart. Otherwise `min` also keeps the grid from opening on a past day.
  const keepsOverdue = floor !== undefined && lateBy !== null;
  const refuse = (day: Date) => today !== null && fromLocalDate(day) < today && fromLocalDate(day) !== date;

  const mark = <IconCheck aria-hidden="true" className={MARK} />;

  return (
    <div data-slot="due-date-field" className={cn("grid w-full min-w-0 grid-cols-1 justify-items-start gap-3", className)} {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <div ref={group} role="radiogroup" aria-label={labelledBy ? undefined : (ariaLabel ?? labels.group)} aria-labelledby={labelledBy} onKeyDown={keyDown} className="flex flex-wrap gap-2">
          {quick.map((chip) =>
            radio(
              chip.id,
              <>
                {mark}
                {chip.label}
              </>,
            ),
          )}
          <PopoverAnchor asChild>
            {radio(
              CUSTOM,
              <>
                <span aria-hidden="true" className="relative grid size-3.5 shrink-0 place-items-center">
                  <IconCalendar className="col-start-1 row-start-1 size-3.5 transition-opacity duration-150 group-data-[state=checked]/chip:opacity-0 motion-reduce:transition-none" />
                  <IconCheck className="col-start-1 row-start-1 size-3.5 opacity-0 transition-opacity duration-150 group-data-[state=checked]/chip:opacity-100 motion-reduce:transition-none" />
                </span>
                {labels.pick}
              </>,
              {
                ref: (node) => {
                  custom.current = node;
                },
                // The chip that opened the calendar also closes it: a press on it is not "outside", or the calendar would close and open again.
                onClick: () => setOpen((now) => !now),
              },
            )}
          </PopoverAnchor>
          {allowClear
            ? radio(
                NONE,
                <>
                  {mark}
                  {labels.none}
                </>,
              )
            : null}
        </div>
        <PopoverContent
          align="start"
          collisionPadding={8}
          aria-label={labels.calendar}
          className="w-auto p-0"
          onInteractOutside={(event) => {
            if (custom.current?.contains(event.target as Node)) event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            // Start in the grid of days, where the arrow keys work, and not on the month buttons above it.
            const day = calendar.current?.querySelector<HTMLButtonElement>('[role="gridcell"] button[tabindex="0"]');
            if (!day) return;
            event.preventDefault();
            day.focus();
          }}
          onCloseAutoFocus={(event) => {
            // There is no trigger to return to: the chip that opened the calendar takes the focus back, unless the calendar closed because the person went on to another chip or control.
            event.preventDefault();
            // After Escape or a picked day the focus had nowhere to go and sits on the page itself.
            if (!document.activeElement || document.activeElement === document.body) custom.current?.focus();
          }}
        >
          <div ref={calendar}>
            <Calendar
              value={date === null ? null : toLocalDate(date)}
              min={keepsOverdue ? undefined : floor}
              isDisabled={keepsOverdue ? refuse : undefined}
              locale={locale}
              weekStartsOn={weekStartsOn}
              onValueChange={(picked) => {
                write(fromLocalDate(picked));
                setOpen(false);
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
      <p aria-live="polite" className={cn("min-h-5 text-sm tabular-nums", disabled && "opacity-50")}>
        {date === null ? (
          <span className="text-muted-foreground">{labels.noDate}</span>
        ) : lateBy !== null ? (
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
              <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />
              {labels.overdue(lengthInWords(lateBy, locale))}
            </span>
            <span className="text-muted-foreground">{dated}</span>
          </span>
        ) : (
          <span>
            <span className="font-medium text-foreground">{dated}</span>
            {gap !== null ? <span className="text-muted-foreground">{`, ${distanceInWords(gap, locale)}`}</span> : null}
          </span>
        )}
      </p>
      {name ? <input type="hidden" name={name} value={date ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
