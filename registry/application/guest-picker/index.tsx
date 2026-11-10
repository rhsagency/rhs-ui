"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { IconChevronDown, IconInfo, IconMinus, IconPlus, IconUsers } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  countOf,
  fill,
  limitsOf,
  normalise,
  nounFor,
  summarise,
  totalOf,
  type GuestCounts,
  type GuestGroup,
  type GuestPickerLabels,
  type Words,
} from "@rhs-ui/application/guest-picker/counts";
import { Button } from "@rhs-ui/primitives/button";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { GuestCounts, GuestGroup, GuestPickerLabels } from "@rhs-ui/application/guest-picker/counts";

export interface GuestPickerProps extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children"> {
  /** The kinds of guest, one row each, in order: adults, children, infants. */
  groups: readonly GuestGroup[];
  /** How many of each kind, by group id, when you control the picker. */
  value?: GuestCounts;
  /** The counts to begin with, when the picker keeps them itself. Every kind starts at its fewest. */
  defaultValue?: GuestCounts;
  /** Called with the counts whenever they change; with `commit="done"`, when Done is pressed. */
  onValueChange?: (value: GuestCounts) => void;
  /** The most guests in total. Kinds with `countsTowardTotal: false` are left out of the sum. Default no limit. */
  maxTotal?: number;
  /** Writes the summary on the button yourself. Default "2 adults, 1 child". */
  formatSummary?: (value: GuestCounts, groups: readonly GuestGroup[]) => string;
  /** `immediate` applies every step as it is made. `done` keeps the steps in the panel until Done is pressed; closing any other way throws them away. Default `immediate`. */
  commit?: "immediate" | "done";
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. A panel that opens by itself does not take focus, so a page that loads with it open does not jump. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of the summary. Default "en-US". */
  locale?: string;
  /** The words the picker says, for translation. */
  labels?: GuestPickerLabels;
}

interface StepperProps {
  /** Names the number: the kind of guest. */
  label: string;
  value: number;
  min: number;
  max: number;
  /** What a screen reader reads after the number: "2 adults". */
  valueText: string;
  decrease: string;
  increase: string;
  /** The line that explains why minus is stopped, while it is. */
  minusReasonId: string | undefined;
  /** The line that explains why plus is stopped, while it is. */
  plusReasonId: string | undefined;
  onChange: (next: number) => void;
}

const BUTTON =
  "grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-foreground outline-none transition-[background-color,opacity] duration-150 hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-background motion-reduce:transition-none";

/**
 * Minus, a number you can type into, plus. The buttons never become `disabled`:
 * a button that disables while it has focus drops the focus, and a disabled
 * button cannot say why. They are `aria-disabled`, stay in the tab order and
 * point at the line that explains the limit.
 */
function Stepper({ label, value, min, max, valueText, decrease, increase, minusReasonId, plusReasonId, onChange }: StepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const atMin = value <= min;
  const atMax = value >= max;
  function settle(text: string) {
    const typed = Number.parseInt(text.replace(/\D/g, ""), 10);
    if (!Number.isNaN(typed)) onChange(typed);
    setDraft(null);
  }
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button type="button" aria-label={decrease} aria-disabled={atMin || undefined} aria-describedby={atMin ? minusReasonId : undefined} onClick={() => (atMin ? undefined : onChange(value - 1))} className={BUTTON}>
        <IconMinus size={14} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="spinbutton"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        value={draft ?? String(value)}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => (draft === null ? undefined : settle(draft))}
        onKeyDown={(event) => {
          const moves: Record<string, number> = { ArrowUp: value + 1, ArrowDown: value - 1, Home: min, End: max };
          if (event.key in moves) {
            event.preventDefault();
            setDraft(null);
            onChange(moves[event.key]!);
          } else if (event.key === "Enter") {
            // Enter confirms the number; it must not submit a form the picker sits in.
            event.preventDefault();
            settle(draft ?? String(value));
          }
        }}
        className="h-8 w-9 rounded-md border border-transparent bg-transparent text-center text-sm font-medium tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      <button type="button" aria-label={increase} aria-disabled={atMax || undefined} aria-describedby={atMax ? plusReasonId : undefined} onClick={() => (atMax ? undefined : onChange(value + 1))} className={BUTTON}>
        <IconPlus size={14} />
      </button>
    </div>
  );
}

interface RowProps {
  group: GuestGroup;
  counts: GuestCounts;
  groups: readonly GuestGroup[];
  maxTotal: number | undefined;
  locale: string;
  text: Words;
  /** The id of the note in the footer that says the total is full. */
  totalNoteId: string;
  onChange: (group: GuestGroup, next: number) => void;
}

/** One kind of guest: its title and description, the limit of the kind in words when one holds, and the stepper. A full total is explained once, in the footer, which both the plus buttons point at. */
function Row({ group, counts, groups, maxTotal, locale, text, totalNoteId, onChange }: RowProps) {
  const id = useId();
  const count = countOf(counts, group);
  const limits = limitsOf(group, counts, groups, maxTotal);
  const quiet = (word: string) => word.toLocaleLowerCase(locale);
  const stoppedByTotal = count >= limits.max && limits.why === "total";
  let reason: string | null = null;
  if (count >= limits.max && limits.why === "group") reason = fill(text.atMost, { max: limits.max, noun: nounFor(group, limits.max, locale) });
  else if (count <= limits.min && limits.min > 0) reason = fill(text.atLeast, { min: limits.min, noun: nounFor(group, limits.min, locale) });
  const reasonId = reason ? `${id}-reason` : undefined;
  return (
    <div role="group" aria-labelledby={`${id}-label`} data-slot="guest-picker-row" className="flex items-start justify-between gap-3 py-4">
      <div className="grid min-w-0 gap-0.5">
        <p id={`${id}-label`} className="text-sm leading-5 font-medium">
          {group.label}
        </p>
        {group.description ? <p className="text-xs leading-5 text-pretty text-muted-foreground">{group.description}</p> : null}
        {reason ? (
          <p id={reasonId} className="mt-1 flex items-start gap-1.5 text-xs leading-4 text-foreground">
            <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0 text-muted-foreground" />
            {reason}
          </p>
        ) : null}
      </div>
      <Stepper
        label={group.label}
        value={count}
        min={limits.min}
        max={limits.max}
        valueText={`${count} ${nounFor(group, count, locale)}`}
        decrease={fill(text.decrease, { group: quiet(group.label) })}
        increase={fill(text.increase, { group: quiet(group.label) })}
        minusReasonId={reasonId}
        plusReasonId={stoppedByTotal ? totalNoteId : reasonId}
        onChange={(next) => onChange(group, next)}
      />
    </div>
  );
}

/**
 * The party-size control for a booking or a reservation: one button that reads
 * "2 adults, 1 child", and a panel with a stepper for each kind of guest.
 * Minus and plus are real buttons named after the kind ("Fewer adults"), and
 * the number between them can be typed into. When a limit stops a button (at
 * least one adult, a cap on the total, infants left out of it) the reason is
 * written in the panel and the stopped buttons point at it, so it is read and
 * not only seen. Every change is announced politely. Escape closes the panel
 * and returns focus to the button. With `commit="done"` nothing is applied
 * until Done is pressed, and closing any other way throws the steps away.
 */
export function GuestPicker({
  groups,
  value,
  defaultValue,
  onValueChange,
  maxTotal,
  formatSummary,
  commit = "immediate",
  open,
  defaultOpen = false,
  onOpenChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: GuestPickerProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const totalNoteId = `${base}-total`;
  // A panel that opened by itself, on load, does not take focus: the page must not jump to it.
  const opened = useRef(defaultOpen);
  const [own, setOwn] = useState<GuestCounts>(() => normalise(groups, defaultValue));
  const [draft, setDraft] = useState<GuestCounts>(() => normalise(groups, value ?? defaultValue));
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [said, setSaid] = useState("");
  const current = value ?? own;
  const isOpen = open ?? ownOpen;
  const staged = commit === "done";
  // The panel shows the steps being made; the button shows what is applied.
  const live = staged ? draft : current;
  const summary = (formatSummary ? formatSummary(current, groups) : summarise(current, groups, locale, text.placeholder)) || text.placeholder;
  const none = !groups.some((group) => countOf(current, group) > 0);

  const line = (counts: GuestCounts) => {
    const sum = totalOf(counts, groups);
    return maxTotal !== undefined ? fill(text.totalOf, { total: sum, max: maxTotal }) : sum === 1 ? text.totalOne : fill(text.totalMany, { total: sum });
  };
  const full = maxTotal !== undefined && totalOf(live, groups) >= maxTotal;
  const left = groups.filter((group) => group.countsTowardTotal === false).map((group) => group.label);
  const totalNote = full
    ? [fill(text.totalFull, { maxTotal: maxTotal ?? 0 }), left.length ? fill(text.notCounted, { groups: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(left) }) : ""].filter(Boolean).join(" ")
    : null;

  function apply(counts: GuestCounts) {
    if (value === undefined) setOwn(counts);
    onValueChange?.(counts);
  }

  function setOpen(next: boolean) {
    if (next) {
      setDraft(normalise(groups, current));
      setSaid("");
    }
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function change(group: GuestGroup, requested: number) {
    const limits = limitsOf(group, live, groups, maxTotal);
    const next = Math.min(limits.max, Math.max(limits.min, Math.trunc(requested)));
    if (next === countOf(live, group)) return;
    const counts = { ...live, [group.id]: next };
    if (staged) setDraft(counts);
    else apply(counts);
    setSaid(fill(text.changed, { group: group.label, count: next, total: line(counts) }));
  }

  function done() {
    if (staged) apply(draft);
    setOpen(false);
  }

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="guest-picker"
          // Named by what it holds, so a label placed beside it by the page cannot hide the summary from a screen reader.
          aria-labelledby={`${base}-name ${base}-value`}
          className={cn(fieldSurface, "group/trigger flex h-9 w-full min-w-56 items-center gap-2 px-3 text-left", none && "text-muted-foreground", className)}
          {...props}
        >
          <IconUsers aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span id={`${base}-name`} className="sr-only">
            {text.guests}:
          </span>
          <span id={`${base}-value`} className="min-w-0 flex-1 truncate">
            {summary}
          </span>
          <IconChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={16}
        aria-label={text.guests}
        onOpenAutoFocus={(event) => {
          if (!opened.current) return;
          opened.current = false;
          event.preventDefault();
        }}
        // As wide as the button, which is never narrower than 14rem, so on a phone the panel sits under the field and not past it.
        className="w-[clamp(14rem,var(--radix-popover-trigger-width),26rem)] max-w-[min(26rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="divide-y divide-border px-4">
          {groups.map((group) => (
            <Row key={group.id} group={group} counts={live} groups={groups} maxTotal={maxTotal} locale={locale} text={text} totalNoteId={totalNoteId} onChange={change} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-3">
          <div className="grid min-w-0 gap-1">
            <p className="text-xs font-medium text-muted-foreground tabular-nums">{line(live)}</p>
            {totalNote ? (
              <p id={totalNoteId} className="flex items-start gap-1.5 text-xs leading-4 text-foreground">
                <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0 text-muted-foreground" />
                {totalNote}
              </p>
            ) : null}
          </div>
          <Button size="sm" onClick={done} className="shrink-0">
            {text.done}
          </Button>
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {said}
        </p>
      </PopoverContent>
    </Popover>
  );
}
