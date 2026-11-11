"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconAlertCircle, IconCalendar, IconChevronLeft, IconChevronRight, IconClock, IconGlobe, IconSpinner } from "@rhs-ui/icons";
import {
  addDays,
  clockText,
  daySlots,
  DEFAULT_LABELS,
  defaultPresets,
  dayNumber,
  fill,
  isThenable,
  presetOptions,
  readClock,
  rowText,
  slotText,
  toTimestamp,
  wallOf,
  whenText,
  zonedTime,
  zoneName,
  type CivilDay,
  type SnoozeLabels,
  type SnoozePreset,
  type SnoozeTime,
} from "@rhs-ui/application/snooze-popover/snooze";
import { Button } from "@rhs-ui/primitives/button";
import { Calendar } from "@rhs-ui/primitives/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface SnoozePanelProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /**
   * The moment the person chose. It may return a promise: the row shows progress while it runs, and when it rejects the panel stays
   * open with a message so the choice can be made again.
   */
  onSnooze: (date: Date) => void | Promise<void>;
  /** The moment every choice is worked out from, and the moment the past starts. Leave it out to use the browser's clock once the page is live; pass it for the same times in server HTML, in tests and in previews. */
  now?: SnoozeTime;
  /** The time zone the choices, the calendar and the time are read in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The language of the weekdays, the months and the way a time is written. Default "en-US". */
  locale?: string;
  /** Your own choices instead of the four defaults (later today, tomorrow morning, this weekend, next week). */
  presets?: readonly SnoozePreset[];
  /** Which part is showing to begin with: the list of choices, or the calendar with a time. Default "presets". */
  defaultView?: "presets" | "custom";
  /** Called once a choice was made and saved, with the moment and the sentence that was announced, so a popover around the panel can close. */
  onDone?: (result: { date: Date; text: string }) => void;
  /** The words the panel says, for translation. */
  labels?: SnoozeLabels;
}

const subscribeNever = (): (() => void) => () => undefined;

/**
 * The clock the choices are worked out from: `now` when it is given, otherwise the browser's, once the page is live and then once a
 * minute, so a choice that has passed leaves the list. Null while the server renders and while the browser hydrates, so both write
 * the same text; a panel that mounts after the page is live has the time at once.
 */
function useClock(now: SnoozeTime | undefined): number | null {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [tick, setTick] = useState(() => Date.now());
  const pinned = now !== undefined;
  useEffect(() => {
    if (pinned) return;
    const timer = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  if (pinned) {
    const at = toTimestamp(now);
    if (!Number.isNaN(at)) return at;
  }
  return mounted ? tick : null;
}

/** A calendar day as the plain date the Calendar draws: its own local midnight, so the day it shows is the day we mean. */
const floating = (day: CivilDay) => new Date(day.year, day.month - 1, day.day);

const SLOTS = daySlots(30);

interface CustomProps {
  now: number;
  timeZone: string;
  locale: string;
  words: Required<SnoozeLabels>;
  busy: boolean;
  failed: boolean;
  onBack: () => void;
  onConfirm: (date: Date) => void;
}

/** The calendar and the time field, with the choice written out in words before it is made. */
function CustomPicker({ now, timeZone, locale, words, busy, failed, onBack, onConfirm }: CustomProps) {
  const today = wallOf(now, timeZone);
  const [day, setDay] = useState<CivilDay>(() => addDays(today, 1));
  const [time, setTime] = useState("08:00");
  const clock = readClock(time) ?? { hour: 8, minute: 0 };
  const instant = zonedTime({ ...day, ...clock }, timeZone);
  const isToday = dayNumber(day) === dayNumber(today);
  // Today, the slots that have gone are marked taken, so a time that has passed cannot be picked.
  const passed = isToday ? SLOTS.filter((slot) => slot <= clockText(today)) : [];
  const past = instant.getTime() <= now;
  const timeId = useId();

  function pickDay(picked: Date) {
    const next = { year: picked.getFullYear(), month: picked.getMonth() + 1, day: picked.getDate() };
    setDay(next);
    // Moving to today with a time that has already gone takes the next slot that has not.
    if (dayNumber(next) === dayNumber(today) && SLOTS.filter((slot) => slot <= clockText(today)).includes(time)) {
      const later = SLOTS.find((slot) => slot > clockText(today));
      if (later) setTime(later);
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1 border-b border-border py-1.5 pr-4 pl-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <IconChevronLeft />
          {words.back}
        </Button>
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{words.pick}</h2>
      </div>
      <div
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain"
        onKeyDown={(event) => {
          // Enter on a day picks it, and Enter on the button confirms; Ctrl or Command with Enter confirms from anywhere in here.
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !past && !busy) {
            event.preventDefault();
            onConfirm(instant);
          }
        }}
      >
        <div className="flex justify-center pt-1">
          <Calendar value={floating(day)} onValueChange={pickDay} min={floating(today)} locale={locale} />
        </div>
        <div className="grid gap-3 px-4 pt-1 pb-4">
          <div role="group" aria-labelledby={timeId} className="flex items-center justify-between gap-3">
            <span id={timeId} className="text-sm font-medium">
              {words.time}
            </span>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger size="sm" aria-labelledby={timeId} className="w-32 tabular-nums">
                <span className="flex min-w-0 items-center gap-2">
                  <IconClock aria-hidden="true" className="size-4 text-muted-foreground" />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent align="end" className="max-h-72 min-w-32">
                {SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot} disabled={passed.includes(slot)} className="py-1.5 tabular-nums">
                    {slotText(slot, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">{words.until}</p>
            <p className="text-sm font-medium tracking-[-0.01em] tabular-nums">{whenText(instant.getTime(), locale, timeZone)}</p>
          </div>
          {past ? <p className="text-xs text-muted-foreground">{words.past}</p> : null}
          {failed ? (
            <p role="alert" className="flex items-start gap-1.5 text-xs leading-snug font-medium text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {words.failed}
            </p>
          ) : null}
          {/* Off and busy are said with aria-disabled and aria-busy, not disabled: a disabled button gives up focus, which would leave a keyboard on no control. */}
          <Button
            type="button"
            aria-disabled={past || busy || undefined}
            aria-busy={busy || undefined}
            onClick={() => {
              if (!past && !busy) onConfirm(instant);
            }}
            className={cn("w-full aria-disabled:cursor-not-allowed", past && !busy && "opacity-50", busy && "aria-disabled:cursor-progress")}
          >
            {busy ? <IconSpinner data-slot="button-spinner" /> : null}
            {words.confirm}
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * The inside of the snooze popover, on its own, for a sheet on a phone: a list of choices worked out from now in a zone (later
 * today, tomorrow morning, this weekend, next week) with the day and the time at the right of each, a row that opens a calendar
 * and a time field, and the zone said in words at the foot. A choice that would land in the past is left out. Enter on a choice
 * snoozes at once; the calendar view writes the choice out before it is made. Every day is read in `timeZone` against `now`.
 */
export function SnoozePanel({ onSnooze, now, timeZone = "UTC", locale = "en-US", presets, defaultView = "presets", onDone, labels, className, ...props }: SnoozePanelProps) {
  const words: Required<SnoozeLabels> = { ...DEFAULT_LABELS, ...labels };
  const clock = useClock(now);
  const [view, setView] = useState<"presets" | "custom">(defaultView);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const options = clock === null ? [] : presetOptions(presets ?? defaultPresets(words), clock, timeZone);
  const current = options.some((option) => option.preset.id === activeId) ? activeId : (options[0]?.preset.id ?? null);

  async function choose(date: Date, id: string) {
    if (busy.current) return;
    setFailed(false);
    const text = fill(words.snoozed, { when: whenText(date.getTime(), locale, timeZone) });
    let outcome: void | Promise<void>;
    try {
      outcome = onSnooze(date);
    } catch {
      setFailed(true);
      return;
    }
    if (isThenable(outcome)) {
      busy.current = true;
      setPending(id);
      try {
        await outcome;
      } catch {
        setFailed(true);
        return;
      } finally {
        busy.current = false;
        setPending(null);
      }
    }
    setSaid(text);
    onDone?.({ date, text });
  }

  function move(event: KeyboardEvent<HTMLUListElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const list = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-row]")];
    const at = list.findIndex((row) => row === document.activeElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : Math.min(list.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)));
    event.preventDefault();
    list[next]?.focus();
  }

  const zone = clock === null ? "" : fill(words.zone, { zone: zoneName(clock, locale, timeZone) });

  return (
    <div ref={root} data-slot="snooze-panel" data-view={view} aria-busy={pending !== null || undefined} className={cn("flex min-h-0 flex-col bg-popover text-popover-foreground", className)} {...props}>
      {view === "custom" && clock !== null ? (
        <CustomPicker
          now={clock}
          timeZone={timeZone}
          locale={locale}
          words={words}
          busy={pending !== null}
          failed={failed}
          onBack={() => {
            setFailed(false);
            setView("presets");
            // The calendar leaves, and with it the button that had focus: the row that opened it takes it back.
            window.requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("[data-pick]")?.focus());
          }}
          onConfirm={(date) => void choose(date, "custom")}
        />
      ) : (
        <>
          <div className="shrink-0 border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-semibold tracking-[-0.01em]">{words.title}</h2>
          </div>
          <ul onKeyDown={move} className="relative grid min-h-0 flex-1 gap-px overflow-y-auto overscroll-contain p-1.5">
            {options.map(({ preset, date }) => (
              <li key={preset.id}>
                <button
                  type="button"
                  data-row=""
                  tabIndex={preset.id === current ? 0 : -1}
                  aria-disabled={pending !== null || undefined}
                  onFocus={() => setActiveId(preset.id)}
                  onClick={() => void choose(date, preset.id)}
                  className="flex w-full items-center justify-between gap-4 rounded-md px-2.5 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 aria-disabled:cursor-progress motion-reduce:transition-none"
                >
                  <span className="text-sm font-medium tracking-[-0.01em]">{preset.label}</span>
                  <span className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground tabular-nums">
                    {pending === preset.id ? <IconSpinner aria-hidden="true" className="size-3.5" /> : null}
                    {clock === null ? "" : rowText(date.getTime(), clock, locale, timeZone, words)}
                  </span>
                </button>
              </li>
            ))}
            <li className={cn(options.length > 0 && "mt-1 border-t border-border pt-1")}>
              <button
                type="button"
                data-row=""
                data-pick=""
                tabIndex={current === null ? 0 : -1}
                onFocus={() => setActiveId("pick")}
                onClick={() => {
                  setView("custom");
                  // The row leaves, and with it the focus: the calendar takes it, on the day it opens on.
                  window.requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("[data-slot='calendar'] button[tabindex='0']")?.focus());
                }}
                className="flex w-full items-center justify-between gap-4 rounded-md px-2.5 py-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                <span className="flex items-center gap-2.5 text-sm font-medium tracking-[-0.01em]">
                  <IconCalendar aria-hidden="true" className="size-4 text-muted-foreground" />
                  {words.pick}
                </span>
                <IconChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
              </button>
            </li>
          </ul>
          {failed ? (
            <p role="alert" className="flex shrink-0 items-start gap-1.5 px-4 pb-2 text-xs leading-snug font-medium text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {words.failed}
            </p>
          ) : null}
        </>
      )}
      {zone ? (
        <div className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/30 px-4 py-2.5 text-xs leading-snug text-muted-foreground">
          <IconGlobe aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {zone}
        </div>
      ) : null}
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {pending !== null ? words.snoozing : said}
      </p>
    </div>
  );
}
