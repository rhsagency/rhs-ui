"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type SyntheticEvent } from "react";

import { IconAlertCircle, IconChevronDown, IconClock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { clockWriter, CRON_FIELDS, describeCron, nextRuns, parseCron, runDistance, safeLocale } from "@rhs-ui/primitives/cron-field/cron";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** A ready-made schedule in the menu. */
export interface CronPreset {
  /** What it is called in the menu: "Weekdays at 09:00". */
  label: string;
  /** The expression it fills in: "0 9 * * 1-5". */
  value: string;
}

export interface CronFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "autoComplete" | "children" | "size"> {
  /** The expression, when you control it. */
  value?: string;
  /** The expression to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the expression as typed (or as a preset wrote it) and whether it is a complete, right cron expression. */
  onValueChange?: (expression: string, state: { valid: boolean }) => void;
  /** The zone whose clock the schedule follows, as an IANA name: "Europe/Amsterdam". The next runs are worked out and written on that clock. Default "UTC". */
  timeZone?: string;
  /** Decides whether the clock is written on 12 or 24 hours, in the sentence and in the menu, and how the dates and the distances in the list of runs are written. The sentence is English whatever the locale, names of days and months included, so it never mixes two languages. A tag that is not one, such as `en_US`, is read as `en-US`. Default "en-US". */
  locale?: string;
  /** The schedules in the menu, or `false` for no menu. A default set of six comes with it, its times written on the clock of `locale`. */
  presets?: readonly CronPreset[] | false;
  /** How many runs to list. Default 3. */
  count?: number;
  /** The moment the runs are counted from, as a Date, a timestamp or an ISO string. Leave it out and the field reads the clock of the browser once it is on screen, and keeps it up to date. Give it for a fixed preview or a test. */
  now?: Date | number | string;
}

/** The six schedules of the menu, with their times written the way the sentence writes them. */
const defaultPresets = (clock: (hour: number, minute: number) => string): readonly CronPreset[] => [
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: `Every day at ${clock(9, 0)}`, value: "0 9 * * *" },
  { label: `Weekdays at ${clock(9, 0)}`, value: "0 9 * * 1-5" },
  { label: `Every Monday at ${clock(8, 30)}`, value: "30 8 * * 1" },
  { label: "First of the month", value: "0 0 1 * *" },
];

/** One space between the words, so "0  9 * * *" is the preset "0 9 * * *". */
const squash = (expression: string) => expression.trim().replace(/\s+/g, " ");

/** The text, once it has stopped changing for `delay` ms. Starting text is never said, and an emptied one is cleared at once. */
function useSettled(text: string, delay: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(text);
  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    if (!text) {
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timer);
  }, [text, delay]);
  return said;
}

/** Which of the fields the caret is in: the one it touches, or the next one when it stands after a space. */
function fieldAt(text: string, caret: number): number {
  let index = 0;
  for (const match of text.matchAll(/\S+/g)) {
    if (caret <= (match.index ?? 0) + match[0].length) return index;
    index += 1;
  }
  return index;
}

function instantOf(when: Date | number | string | undefined): number | null {
  if (when === undefined) return null;
  const instant = when instanceof Date ? when.getTime() : typeof when === "string" ? Date.parse(when) : when;
  return Number.isFinite(instant) ? instant : null;
}

/**
 * A field for a cron expression that explains itself. Type `0 9 * * 1-5` and it
 * reads "At 09:00, Monday to Friday" underneath, with the next runs listed on
 * the clock of the time zone you give it. The five fields are drawn apart under
 * the input so you can see how the expression is being read, and a field that
 * is wrong is named in words ("Minute must be 0 to 59") only once you have
 * moved past it, never while you are still typing it. Lists, ranges, steps,
 * month and weekday names and the `@daily` family all work; the grammar and the
 * next-run calculator are plain functions in `cron-field/cron` (no cron library),
 * so a server can check an expression with the same rules. A menu of presets
 * fills the field for you. Like the other fields it never blocks a submit by
 * itself: `onValueChange` tells you whether the expression is valid.
 */
export function CronField({
  value,
  defaultValue = "",
  onValueChange,
  timeZone = "UTC",
  locale = "en-US",
  presets,
  count = 3,
  now,
  disabled,
  required,
  placeholder = "0 9 * * 1-5",
  className,
  onFocus,
  onBlur,
  onSelect,
  ref,
  "aria-describedby": describedBy,
  ...props
}: CronFieldProps) {
  const base = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const picked = useRef(false);
  // The field keeps the ref you pass and uses its own to put the focus back after a preset.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [text, setText] = useState(value ?? defaultValue);
  const [synced, setSynced] = useState(value);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [caret, setCaret] = useState(0);
  const [tick, setTick] = useState<number | null>(null);

  // An expression that arrives from outside replaces what is typed.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== text) setText(value);
  }

  // Without `now` the clock of the browser is read once the field is on screen, never while rendering, so the server and the browser agree; it is read again every half minute.
  useEffect(() => {
    if (now !== undefined) return;
    setTick(Date.now());
    const timer = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [now]);
  const clock = now !== undefined ? instantOf(now) : tick;

  // A locale that is not a language tag (en_US) is read as the nearest one rather than stopping the page.
  const tag = safeLocale(locale);
  const parsed = useMemo(() => parseCron(text), [text]);
  const sentence = useMemo(() => (parsed.schedule ? describeCron(parsed.schedule, { locale: tag }) : null), [parsed.schedule, tag]);

  // A word is only judged once it is finished: while the caret is still in the last one, it may well be half written.
  const typing = focused && !/\s$/.test(text);
  const words = parsed.tokens;
  const wordError = (index: number) => {
    const token = words[index];
    return token?.field && token.error && (!typing || index < words.length - 1) ? token.error : null;
  };
  let error: string | null = null;
  for (let index = 0; index < words.length && !error; index += 1) error = wordError(index);
  if (!error && (parsed.problem === "count" || parsed.problem === "shortcut") && !typing) error = parsed.error;
  if (!error && parsed.problem === "empty" && required && touched && !focused) error = "Enter a cron expression.";

  const runs = useMemo(() => {
    if (!parsed.schedule || clock === null) return null;
    try {
      return { list: nextRuns(parsed.schedule, { from: clock, timeZone, count }), error: null };
    } catch {
      return { list: [], error: `“${timeZone}” is not a time zone this browser knows.` };
    }
  }, [parsed.schedule, clock, timeZone, count]);

  const format = useMemo(() => {
    try {
      const twelve = ["h11", "h12"].includes(new Intl.DateTimeFormat(tag, { hour: "numeric", timeZone }).resolvedOptions().hourCycle ?? "h23");
      const date = (extra: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, { weekday: "short", day: "numeric", month: "short", timeZone, ...extra });
      return {
        date: date({}),
        dateWithYear: date({ year: "numeric" }),
        year: new Intl.DateTimeFormat(tag, { year: "numeric", timeZone }),
        time: new Intl.DateTimeFormat(tag, { hour: twelve ? "numeric" : "2-digit", minute: "2-digit", timeZone }),
        zone: new Intl.DateTimeFormat(tag, { timeZoneName: "short", timeZone }),
      };
    } catch {
      return null;
    }
  }, [tag, timeZone]);
  const zoneName = clock !== null && format ? format.zone.formatToParts(clock).find((part) => part.type === "timeZoneName")?.value : undefined;

  const message = error ?? (parsed.ok ? sentence : null);
  const said = useSettled(message ?? "", 700);

  function report(next: string) {
    onValueChange?.(next, { valid: parseCron(next).ok });
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    setText(event.target.value);
    report(event.target.value);
  }

  function choose(expression: string) {
    picked.current = true;
    setText(expression);
    setTouched(true);
    report(expression);
  }

  function enter(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    setFocused(true);
  }

  // Where the caret is says which field is being written, and the drawing under the input lights it.
  function select(event: SyntheticEvent<HTMLInputElement>) {
    onSelect?.(event);
    setCaret(event.currentTarget.selectionStart ?? 0);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    setFocused(false);
    setTouched(true);
  }

  const summaryId = `${base}-summary`;
  const menu = useMemo(() => {
    if (presets === false) return null;
    const list = presets ?? defaultPresets(clockWriter(tag));
    return list.length === 0 ? null : list;
  }, [presets, tag]);
  const next = CRON_FIELDS[parsed.count];
  const rows = Math.max(1, count);
  // What is said while there is nothing to read out yet: how far along the expression is, or which word is still being finished.
  const unfinished = error ? undefined : words.find((token) => token.field && token.error);
  const progress =
    parsed.problem === "empty"
      ? "Five fields: minute, hour, day of month, month and day of week."
      : unfinished
        ? `Finish the ${CRON_FIELDS.find((spec) => spec.name === unfinished.field)?.title.toLowerCase() ?? "last"} field.`
        : `${Math.min(parsed.count, 5)} of 5 fields.${next && parsed.count < 5 ? ` Next: ${next.title.toLowerCase()}.` : ""}`;

  return (
    <div data-slot="cron-field" className={cn("@container grid w-full gap-3", className)}>
      <div className="flex items-center gap-2">
        <Input
          ref={attach}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          {...props}
          value={text}
          onChange={change}
          onFocus={enter}
          onBlur={leave}
          onSelect={select}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, summaryId].filter(Boolean).join(" ")}
          className="font-mono tabular-nums"
        />
        {menu ? (
          // Where the field is narrow the word "Presets" goes and the chevron stays, so the expression keeps the room.
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" disabled={disabled} className="shrink-0 gap-1.5 pr-2.5 @max-[17rem]:px-2.5">
                <span className="@max-[17rem]:sr-only">Presets</span>
                <IconChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[min(19rem,calc(100vw-2rem))]"
              onCloseAutoFocus={(event) => {
                // A preset fills the field, so the next thing to do is read it or change it: the focus goes there. Escape without a choice still returns to the button.
                if (!picked.current) return;
                picked.current = false;
                event.preventDefault();
                input.current?.focus();
              }}
            >
              <DropdownMenuLabel>Schedules</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={squash(text)} onValueChange={choose}>
                {menu.map((preset) => (
                  <DropdownMenuRadioItem key={`${preset.label}-${preset.value}`} value={preset.value}>
                    <span className="min-w-0 flex-1 truncate">{preset.label}</span>
                    <code className="font-mono text-[0.6875rem] text-muted-foreground tabular-nums">{preset.value}</code>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {/* The five fields, apart, so the reading can be seen. It repeats the input, so a screen reader skips it. */}
      <div aria-hidden="true" className="flex gap-1.5 text-center">
        {CRON_FIELDS.map((spec, index) => {
          const token = words[index];
          const wrong = Boolean(wordError(index));
          // The field under the caret, while the input has focus. A shortcut such as @daily is one word, not five, so nothing is lit for it.
          const active = focused && !text.trim().startsWith("@") && fieldAt(text, caret) === index;
          return (
            // Each field is as wide as its word, and the rest of the row is shared out, so "mon-fri" and "0,15,30,45" are not cut short while there is room. Where there is none, as on a phone, the words give way before the row does.
            <div key={spec.name} className="min-w-0 flex-auto">
              <div
                title={token?.text}
                className={cn(
                  "truncate rounded-md border px-1 py-1 font-mono text-[0.8125rem] tabular-nums transition-colors duration-150 motion-reduce:transition-none",
                  !token && "border-dashed border-border text-muted-foreground/50",
                  !token && active && "border-foreground/40 text-foreground",
                  token && !wrong && "border-border bg-muted/50 text-foreground",
                  token && !wrong && active && "border-foreground/60 bg-muted",
                  wrong && "border-destructive/60 bg-destructive/[0.03] font-medium text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_15%)]",
                )}
              >
                {token?.text ?? "·"}
              </div>
              <div className={cn("mt-1 truncate text-[0.6875rem] transition-colors duration-150 motion-reduce:transition-none", wrong ? "font-medium text-destructive" : active ? "font-medium text-foreground" : "text-muted-foreground")}>{spec.label}</div>
            </div>
          );
        })}
      </div>

      <div id={summaryId} className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-start gap-2.5 px-4 py-3">
          {error ? <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" /> : <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
          {error ? (
            <p className="min-w-0 text-sm leading-snug text-destructive [overflow-wrap:anywhere]">{error}</p>
          ) : parsed.ok && sentence ? (
            <p className="min-w-0 text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] [overflow-wrap:anywhere]">{sentence}</p>
          ) : (
            <p className="min-w-0 text-sm leading-snug text-muted-foreground">{progress}</p>
          )}
        </div>
        <div className="border-t border-border px-4 py-3">
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-muted-foreground">
            <span>Next {rows === 1 ? "run" : `${rows} runs`}</span>
            <span>{zoneName && timeZone !== zoneName ? `${timeZone} (${zoneName})` : timeZone}</span>
          </p>
          {runs?.error ? (
            <p className="mt-2 text-xs text-destructive">{runs.error}</p>
          ) : runs && runs.list.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">This schedule never runs: no day in it exists in the months it names.</p>
          ) : (
            <ol aria-label="Next runs" aria-busy={parsed.ok && !runs ? true : undefined} className="mt-2 grid gap-1.5">
              {Array.from({ length: rows }, (_, index) => {
                const run = parsed.ok && runs && format && clock !== null ? runs.list[index] : undefined;
                if (!run || !format || clock === null) {
                  return (
                    <li key={index} aria-hidden="true" className="flex items-baseline gap-3 text-sm text-muted-foreground/40 tabular-nums">
                      <span className="flex-1">—</span>
                      <span>—:——</span>
                    </li>
                  );
                }
                const sameYear = format.year.format(run) === format.year.format(clock);
                // The date and the time share a line; how far away it is sits at the end of it where there is room, and under it where there is not.
                return (
                  <li key={run.getTime()} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 text-sm @sm:grid-cols-[minmax(0,1fr)_auto_6.5rem]">
                    <span className="col-start-1 row-start-1 min-w-0 truncate tabular-nums">{(sameYear ? format.date : format.dateWithYear).format(run)}</span>
                    <time dateTime={run.toISOString()} className="col-start-2 row-start-1 font-medium tabular-nums">
                      {format.time.format(run)}
                    </time>
                    <span className="col-span-2 col-start-1 row-start-2 text-xs text-muted-foreground @sm:col-span-1 @sm:col-start-3 @sm:row-start-1 @sm:text-right">{runDistance(run, clock, { locale: tag, timeZone })}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
