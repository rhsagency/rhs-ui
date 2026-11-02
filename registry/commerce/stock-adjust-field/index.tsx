"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArrowRight, IconWarning } from "@rhs-ui/icons";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { DEFAULT_REASONS, problemsOf, stockAfter, type StockAdjustment, type StockChange, type StockMode, type StockReason } from "@rhs-ui/commerce/stock-adjust-field/stock";
import { cn } from "@/lib/utils";

export type { StockAdjustment, StockChange, StockMode, StockReason } from "@rhs-ui/commerce/stock-adjust-field/stock";

export interface StockAdjustFieldLabels {
  /** Names the whole form for a screen reader. */
  group?: string;
  /** Names the three modes. */
  mode?: string;
  /** The first mode: the quantity is added to what is on hand. */
  add?: string;
  /** The second mode: the quantity is taken from what is on hand. */
  remove?: string;
  /** The third mode: the quantity is what the stock is counted at. */
  set?: string;
  /** The label of the quantity field. */
  quantity?: string;
  /** The label of the reason choice. */
  reason?: string;
  /** What the reason choice shows until a reason is chosen. */
  reasonPlaceholder?: string;
  /** The label of the note field. */
  note?: string;
  /** Beside the label of the note while it may stay empty. */
  optional?: string;
  /** Beside the label of the reason, and beside the label of the note while the chosen reason asks for one. */
  required?: string;
  /** The start of the result line: the stock now. */
  onHand?: string;
  /** The end of the result line: the stock once the change is saved. */
  after?: string;
  /** In place of the number after, while the change is refused. */
  notPossible?: string;
  /** What a screen reader hears of the result line. `{onHand}` and `{after}`, with the unit. */
  announce?: string;
  /** Why a removal is refused. `{quantity}` and `{onHand}`, with the unit. */
  tooMany?: string;
  /** Why setting the stock below zero is refused. */
  belowZero?: string;
  /** When the quantity is under 1 or not a whole number. */
  quantityMin?: string;
  /** Under the reason when none is chosen. */
  reasonRequired?: string;
  /** Under the note when the chosen reason asks for one and it is empty. */
  noteRequired?: string;
  /** Under the result line when `allowNegative` lets the stock go below zero. */
  negative?: string;
}

const WORDS = {
  group: "Adjust stock",
  mode: "Adjustment",
  add: "Add",
  remove: "Remove",
  set: "Set to",
  quantity: "Quantity",
  reason: "Reason",
  reasonPlaceholder: "Choose a reason",
  note: "Note",
  optional: "optional",
  required: "required",
  onHand: "On hand",
  after: "After",
  notPossible: "Not possible",
  announce: "On hand {onHand}, after {after}",
  tooMany: "You cannot remove {quantity} when {onHand} are on hand.",
  belowZero: "Stock cannot be set below zero.",
  quantityMin: "Enter a whole number of 1 or more.",
  reasonRequired: "Choose a reason.",
  noteRequired: "Add a note to explain this adjustment.",
  negative: "This takes the stock below zero.",
} satisfies Required<StockAdjustFieldLabels>;

export interface StockAdjustFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The stock on hand now. It is the start of the result line: "On hand 24, after 36". */
  onHand: number;
  /** The adjustment as typed, to control the field. */
  value?: StockAdjustment;
  /** The adjustment to start with, when you do not control the field. Defaults to adding 1. */
  defaultValue?: StockAdjustment;
  /** Called on every change with the adjustment and what comes of it: `newOnHand` and whether it can be saved. */
  onValueChange?: (change: StockChange) => void;
  /** The reasons to choose from. The one with `requiresNote` makes the note required. Defaults to Received, Sold in store, Damaged, Count correction and Other. */
  reasons?: readonly StockReason[];
  /** Let a change take the stock below zero (back orders). Off by default: such a change is refused, with the reason. */
  allowNegative?: boolean;
  /** What is counted: "pcs", "bottles", "kg". It follows every number in the form. */
  unit?: string;
  /** Always pass your application locale, so the server and the browser write the same numbers. */
  locale?: string;
  /** The words, for another language. */
  labels?: StockAdjustFieldLabels;
}

const START: StockAdjustment = { mode: "add", quantity: 1, reason: null, note: "" };

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** What a screen reader hears of the result. While a number is being typed it follows after a short pause, so a number typed digit by digit is read out once and not once per key; any other change is read out at once. */
function useSettled(text: string, typing: boolean, delay = 500): string {
  const [settled, setSettled] = useState(text);
  if (!typing && settled !== text) setSettled(text);
  useEffect(() => {
    if (!typing || settled === text) return;
    const timer = window.setTimeout(() => setSettled(text), delay);
    return () => window.clearTimeout(timer);
  }, [text, typing, settled, delay]);
  return typing ? settled : text;
}

/**
 * The adjust-quantity form of an inventory screen, without the sums: add, remove or set the stock, say why, and
 * see "On hand 24, after 36" before saving. Each mode remembers its own quantity, so flipping from Add to Set to
 * and back never loses what was typed, and Set to starts at what is on hand. The result line and the value you get
 * back follow the number as it is typed, not only once the field is left. A change that would take the stock
 * below zero is refused in words, with the numbers, unless `allowNegative` is on. The reason is required, and the
 * note becomes required for a reason that asks for one ("Other"). The result line is announced politely, and the
 * value you get back includes the `newOnHand` already worked out.
 */
export function StockAdjustField({ onHand, value, defaultValue, onValueChange, reasons = DEFAULT_REASONS, allowNegative = false, unit, locale = "en-US", labels, className, ...props }: StockAdjustFieldProps) {
  const words: Required<StockAdjustFieldLabels> = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<StockAdjustment>(defaultValue ?? START);
  const [touched, setTouched] = useState({ reason: false, note: false });
  // The quantity is being typed: its announcement waits for a pause in the typing.
  const [typed, setTyped] = useState(false);
  // While the list of reasons is open the trigger has lost the focus to it, which is not the field being left.
  const reasonOpen = useRef(false);
  const current = value ?? own;
  // Each mode keeps its own number: Add and Remove start at 1, Set to starts at what is on hand.
  const memory = useRef<Record<StockMode, number>>({ add: 1, remove: 1, set: onHand, [current.mode]: current.quantity });
  const numbers = new Intl.NumberFormat(locale);
  const signed = new Intl.NumberFormat(locale, { signDisplay: "exceptZero" });
  const withUnit = (n: number): string => `${numbers.format(n)}${unit ? ` ${unit}` : ""}`;

  const problems = problemsOf(onHand, current, reasons, allowNegative);
  const after = stockAfter(onHand, current, allowNegative);
  const chosen = reasons.find((reason) => reason.value === current.reason);
  const noteRequired = Boolean(chosen?.requiresNote);

  function emit(next: StockAdjustment) {
    if (!value) setOwn(next);
    memory.current[next.mode] = next.quantity;
    onValueChange?.({ ...next, newOnHand: stockAfter(onHand, next, allowNegative), valid: problemsOf(onHand, next, reasons, allowNegative).length === 0 });
  }
  function chooseMode(mode: StockMode) {
    if (mode === current.mode) return;
    memory.current[current.mode] = current.quantity;
    emit({ ...current, mode, quantity: memory.current[mode] });
  }
  // The smallest quantity the mode takes: Add and Remove at least 1, Set to zero (or lower, with back orders).
  const minimum = current.mode === "set" ? (allowNegative ? Number.NEGATIVE_INFINITY : 0) : 1;
  // A whole number the field would keep counts as soon as it is typed. Half-typed text ("", "2.", "-") waits for the field to be left, when NumberInput checks it, so no error flashes while someone types.
  function typeQuantity(event: FormEvent<HTMLInputElement>) {
    setTyped(true);
    const text = event.currentTarget.value.trim();
    if (!/^-?\d+$/.test(text)) return;
    const quantity = Number(text);
    if (quantity >= minimum && quantity !== current.quantity) emit({ ...current, quantity });
  }

  let quantityError: string | undefined;
  if (problems.includes("below")) quantityError = current.mode === "set" ? words.belowZero : fill(words.tooMany, { quantity: withUnit(current.quantity), onHand: withUnit(onHand) });
  else if (problems.includes("quantity")) quantityError = words.quantityMin;
  const reasonError = touched.reason && problems.includes("reason") ? words.reasonRequired : undefined;
  const noteError = touched.note && problems.includes("note") ? words.noteRequired : undefined;

  // A refusal is announced by the error under the quantity, so the result line stays quiet instead of saying it twice.
  const spoken = useSettled(after === null ? "" : fill(words.announce, { onHand: withUnit(onHand), after: withUnit(after) }), typed);
  const hint = "text-xs font-normal text-muted-foreground";

  return (
    <div data-slot="stock-adjust-field" role="group" aria-label={words.group} className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <SegmentedControl
        label={words.mode}
        value={current.mode}
        onValueChange={(next) => chooseMode(next === "remove" ? "remove" : next === "set" ? "set" : "add")}
        options={[
          { value: "add", label: words.add },
          { value: "remove", label: words.remove },
          { value: "set", label: words.set },
        ]}
        className="flex w-full [&_button]:flex-1 [&_button]:px-2 @sm:[&_button]:px-4"
      />

      <div className="grid gap-x-4 gap-y-5 @md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]">
        <FormField error={quantityError} className="content-start">
          <FormLabel>
            {words.quantity}
            {unit ? <span className="sr-only"> ({unit})</span> : null}
          </FormLabel>
          <div className="flex items-center gap-3" onBlur={() => setTyped(false)}>
            <FormControl>
              <NumberInput
                value={current.quantity}
                onInput={typeQuantity}
                onValueChange={(quantity) => {
                  // Typing already reported a whole number; leaving the field only reports what is left to tidy.
                  if (quantity !== current.quantity) emit({ ...current, quantity });
                }}
                min={minimum}
                step={1}
                locale={locale}
                className="w-36 has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/25"
              />
            </FormControl>
            {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
          </div>
        </FormField>

        <FormField error={reasonError} className="content-start">
          <FormLabel>
            {words.reason} <span className={hint}>{words.required}</span>
          </FormLabel>
          <Select
            value={current.reason ?? ""}
            onValueChange={(reason) => emit({ ...current, reason })}
            onOpenChange={(open) => {
              reasonOpen.current = open;
              if (!open) setTouched((previous) => ({ ...previous, reason: true }));
            }}
          >
            <FormControl>
              <SelectTrigger
                className="w-full"
                // Tabbing past a reason that was never opened leaves the field too, so its message shows then as well.
                onBlur={() => {
                  if (!reasonOpen.current) setTouched((previous) => ({ ...previous, reason: true }));
                }}
              >
                <SelectValue placeholder={words.reasonPlaceholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {reasons.map((reason) => (
                <SelectItem key={reason.value} value={reason.value}>
                  {reason.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <FormField error={noteError}>
        <FormLabel>
          {words.note} <span className={hint}>{noteRequired ? words.required : words.optional}</span>
        </FormLabel>
        <FormControl>
          <Textarea
            rows={2}
            value={current.note}
            aria-required={noteRequired || undefined}
            onChange={(event) => emit({ ...current, note: event.target.value })}
            onBlur={() => setTouched((previous) => ({ ...previous, note: true }))}
            className="min-h-16"
          />
        </FormControl>
      </FormField>

      <div className="grid gap-2">
        <p role="status" className="sr-only">
          {spoken}
        </p>
        <div aria-hidden="true" className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3.5">
          <div className="grid min-w-0 gap-0.5">
            <span className="text-xs text-muted-foreground">{words.onHand}</span>
            <span className="text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums">{numbers.format(onHand)}{unit ? <span className="ml-1.5 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span> : null}</span>
          </div>
          <IconArrowRight className="size-4 text-muted-foreground" />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-xs text-muted-foreground">{words.after}</span>
            {after === null ? (
              <span className="text-sm leading-7 text-muted-foreground">{words.notPossible}</span>
            ) : (
              <span className="text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums">
                {numbers.format(after)}
                {unit ? <span className="ml-1.5 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span> : null}
                {after !== onHand ? <span className="ml-2 text-xs font-normal tracking-normal text-muted-foreground">{signed.format(after - onHand)}</span> : null}
              </span>
            )}
          </div>
        </div>
        {after !== null && after < 0 ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconWarning aria-hidden="true" className="size-3.5 shrink-0" />
            {words.negative}
          </p>
        ) : null}
      </div>
    </div>
  );
}
