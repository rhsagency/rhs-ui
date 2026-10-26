"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconInfo, IconTag } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import {
  convertQuantity,
  formatPerPiece,
  formatWeight,
  isAvailable,
  lineTotal,
  nounsOf,
  pricePerPiece,
  rulesOf,
  savingOnLine,
  savingPercent,
  snapQuantity,
  weightTotal,
  type QuantityRules,
  type RuleHit,
  type SalesUnit,
  type UnitNouns,
} from "@rhs-ui/commerce/sales-unit-picker/units";
import { Badge } from "@rhs-ui/primitives/badge";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { cn } from "@/lib/utils";

export type { SalesUnit, UnitNouns } from "@rhs-ui/commerce/sales-unit-picker/units";

/** What `onChange` hands back whenever the unit or the quantity moves. */
export interface SalesUnitChange {
  /** The chosen unit's id, or "g" in weight mode. */
  unit: string;
  /** How many of that unit; grams in weight mode. Always a quantity the unit's rules allow. */
  quantity: number;
  /** All the pieces together (units mode only). */
  pieces?: number;
  /** The line total in minor units, ready for the cart. */
  total: number;
}

export interface SalesUnitPickerLabels {
  /** The heading over the units. */
  buyBy?: string;
  /** The name of the quantity field. */
  quantity?: string;
  /** The heading of the total. */
  total?: string;
  /** Under a unit's name. `{price}` and `{piece}`: "0.80 per can". */
  perPiece?: string;
  /** On a unit that is cheaper per piece. `{percent}`. */
  saves?: string;
  /** On a unit with nothing left. */
  outOfStock?: string;
  /** Under the total. `{pieces}` and `{price}`: "36 cans at 0.80 each". */
  breakdown?: string;
  /** The saving in words. `{amount}` and `{pieces}`: "36 cans". */
  saving?: string;
  /** What a screen reader hears after a change. `{quantity}` is "3 trays (36 cans)" and `{total}` the line total. */
  status?: string;
  /** Under the field, for a unit that holds several pieces. `{unit}` and `{pieces}`: "Each tray holds 12 cans." */
  holds?: string;
  /** The rules under the field. `{rules}` is a list built from the three phrases below. */
  hint?: string;
  hintFrom?: string;
  hintStep?: string;
  hintMax?: string;
  /** A quantity below the minimum. `{units}` and `{min}`. */
  minNote?: string;
  /** A quantity that is not a multiple of the step. `{units}` and `{step}`. */
  stepNote?: string;
  /** A quantity that is not a whole number, when the step is 1. */
  wholeNote?: string;
  /** A quantity above the maximum. `{units}` and `{max}`. */
  maxNote?: string;
  /** After switching unit, when the same pieces fit exactly. `{from}` and `{to}`: "3 boxes is 36 cans". */
  convertedExact?: string;
  /** After switching unit, when it had to be rounded up. `{from}` is what the shopper asked for, in pieces ("24 cans"), and `{to}` the quantity of the new unit. */
  convertedUp?: string;
  /** Weight mode: the heading over the amounts. */
  weight?: string;
  /** Weight mode: the name of the field for any other amount. */
  customAmount?: string;
  /** Weight mode: the price of a kilo. `{price}`. */
  perKilo?: string;
  /** Weight mode: under the total. `{weight}` and `{price}`: "750 g at 18.40 per kg". */
  weightBreakdown?: string;
  /** Weight mode: what a screen reader hears. `{weight}` and `{total}`. */
  weightStatus?: string;
  /** Weight mode: the rules under the field. `{rules}`. */
  weightHint?: string;
  weightFrom?: string;
  weightStep?: string;
  weightMax?: string;
  /** Weight mode: a notes for an amount outside the rules. `{min}`, `{step}`, `{max}`. */
  weightMinNote?: string;
  weightStepNote?: string;
  weightMaxNote?: string;
}

const WORDS = {
  buyBy: "Buy by",
  quantity: "Quantity",
  total: "Total",
  perPiece: "{price} per {piece}",
  saves: "Saves {percent}",
  outOfStock: "Out of stock",
  breakdown: "{pieces} at {price} each",
  saving: "You save {amount} compared with buying {pieces} one by one.",
  status: "{quantity}, {total} in total.",
  holds: "Each {unit} holds {pieces}.",
  hint: "Sold {rules}.",
  hintFrom: "from {min}",
  hintStep: "in multiples of {step}",
  hintMax: "up to {max}",
  minNote: "{units} are sold from {min}.",
  stepNote: "{units} are sold in multiples of {step}.",
  wholeNote: "Enter a whole number.",
  maxNote: "Only {max} {units} available.",
  convertedExact: "{from} is {to}.",
  convertedUp: "Rounded up to {to}, so you get at least {from}.",
  weight: "Weight",
  customAmount: "Custom amount",
  perKilo: "{price} per kg",
  weightBreakdown: "{weight} at {price} per kg",
  weightStatus: "{weight}, {total} in total.",
  weightHint: "Sold {rules}.",
  weightFrom: "from {min}",
  weightStep: "in steps of {step}",
  weightMax: "up to {max}",
  weightMinNote: "We cut from {min}.",
  weightStepNote: "We cut in steps of {step}.",
  weightMaxNote: "We cut up to {max} at a time.",
} satisfies Required<SalesUnitPickerLabels>;

type Words = typeof WORDS;

interface SalesUnitPickerBase extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** The quantity, when you control it: how many of the chosen unit, or grams in weight mode. Pair it with `onChange`. */
  quantity?: number;
  /** The quantity to start with when the picker keeps it itself. Defaults to the unit's minimum. */
  defaultQuantity?: number;
  /** Called after the shopper changes the unit or the quantity, with the unit, a quantity its rules allow, and the line total. */
  onChange?: (next: SalesUnitChange) => void;
  /** ISO 4217 code for every price. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same text. */
  locale?: string;
  /** Locks the whole picker and dims it. */
  disabled?: boolean;
  /** The words, for another language. */
  labels?: SalesUnitPickerLabels;
}

export interface SalesUnitPickerUnitsProps extends SalesUnitPickerBase {
  /** Units mode (the default): a product sold as a piece, a box, a pallet. */
  mode?: "units";
  /** The ways to buy it, in the order they are shown. */
  units: readonly SalesUnit[];
  /** The id of the chosen unit, when you control it. Pair it with `onChange`. */
  value?: string;
  /** The id of the unit to start with when the picker keeps it itself. Defaults to the first one that is in stock. */
  defaultValue?: string;
  /** What one piece is called, for sentences: `{ one: "can", other: "cans" }`. Defaults to the name of the one-piece unit. */
  pieceLabel?: UnitNouns;
}

export interface SalesUnitPickerWeightProps extends SalesUnitPickerBase {
  /** Weight mode: a product cut or scooped to order, priced by the kilo. */
  mode: "weight";
  /** The price of one kilogram, in minor units: 1840 is 18.40. */
  pricePerKilo: number;
  /** The amounts to offer as one-tap choices, in grams. Defaults to 250, 500 and 1000. */
  presets?: readonly number[];
  /** The least that can be bought, in grams. Defaults to 100. */
  minWeight?: number;
  /** Amounts are multiples of this, in grams. Defaults to 50. */
  weightStep?: number;
  /** The most that can be bought, in grams. Defaults to 5000. */
  maxWeight?: number;
}

export type SalesUnitPickerProps = SalesUnitPickerUnitsProps | SalesUnitPickerWeightProps;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
const capitalise = (text: string, locale: string): string => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

/**
 * Says a sentence once things settle: what a screen reader hears after a change. Holding a key to step a number
 * reads out the last value, not every number on the way. The first render says nothing.
 */
function useCalmStatus(text: string, delay = 400): string {
  const [said, setSaid] = useState("");
  const spoken = useRef(text);
  useEffect(() => {
    if (spoken.current === text) return;
    spoken.current = text;
    const timeout = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);
  return said;
}

/** The rules as one sentence under the field: "Sold from 6, in multiples of 6, up to 120." Nothing when the rules are only "at least 1". */
function hintText(rules: QuantityRules, words: { hint: string; from: string; step: string; max: string }, format: (value: number) => string): string | null {
  const parts = [
    rules.min > 1 && rules.min !== rules.step ? fill(words.from, { min: format(rules.min) }) : null,
    rules.step > 1 ? fill(words.step, { step: format(rules.step) }) : null,
    rules.max !== null ? fill(words.max, { max: format(rules.max) }) : null,
  ].filter((part): part is string => part !== null);
  return parts.length ? fill(words.hint, { rules: parts.join(", ") }) : null;
}

interface Note {
  text: string;
  /** True for an answer to something the shopper just did; false for a standing rule. */
  fresh: boolean;
}

interface QuantityRowProps {
  id: string;
  label: string;
  /** What the number counts, for the accessible name: "boxes". */
  unitName: string;
  value: number;
  rules: QuantityRules;
  disabled: boolean;
  /** Called with the new number; `typed` is what the shopper typed when it came from typing, and `pushed` says a key or a button moved it. */
  onCommit: (next: number, typed: number | null, pushed: boolean) => void;
  /** What follows the field: "boxes · 36 pieces". */
  suffix: ReactNode;
  note: Note | null;
  noteId: string;
}

/**
 * The number field and the line under it. The number input rounds and clamps by itself; what it cannot say is
 * why, so the typed text is kept on the way in (`onInput` is not used by the input itself) and compared with
 * the result.
 */
function QuantityRow({ id, label, unitName, value, rules, disabled, onCommit, suffix, note, noteId }: QuantityRowProps) {
  const typed = useRef<string | null>(null);
  const pushed = useRef(false);
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2"
        // A key or a button moves the number without typing: whatever was typed before is no longer what the number came from.
        onKeyDownCapture={(event: KeyboardEvent) => {
          if (!/^(Arrow|Page|Home|End)/.test(event.key)) return;
          typed.current = null;
          pushed.current = true;
        }}
        onClickCapture={(event) => {
          if (!(event.target instanceof Element) || !event.target.closest("button")) return;
          typed.current = null;
          pushed.current = true;
        }}
        onBlur={() => {
          typed.current = null;
          pushed.current = false;
        }}
      >
        <NumberInput
          id={id}
          aria-label={`${label} (${unitName})`}
          aria-describedby={noteId}
          value={value}
          min={rules.min}
          max={rules.max ?? undefined}
          step={rules.step}
          disabled={disabled}
          onInput={(event) => {
            typed.current = event.currentTarget.value;
          }}
          onValueChange={(next) => {
            const raw = typed.current;
            const moved = pushed.current;
            typed.current = null;
            pushed.current = false;
            onCommit(next, raw === null ? null : Number(raw.replace(",", ".")), moved);
          }}
        />
        <p className="min-w-0 text-sm text-muted-foreground tabular-nums">{suffix}</p>
      </div>
      <p id={noteId} className={cn("flex min-h-4 items-start gap-1.5 text-xs", note?.fresh ? "font-medium text-foreground" : "text-muted-foreground")}>
        {note?.fresh ? <IconInfo size={14} className="mt-px shrink-0" /> : null}
        <span className="min-w-0">{note?.text}</span>
      </p>
    </div>
  );
}

interface TotalPanelProps {
  words: Words;
  total: number;
  currency: string;
  locale: string;
  breakdown: string;
  saving: ReactNode;
}

function TotalPanel({ words, total, currency, locale, breakdown, saving }: TotalPanelProps) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted-foreground">{words.total}</p>
        <AnimatedPrice value={total / 100} currency={currency} locale={locale} className="text-xl leading-none font-semibold tracking-[-0.02em]" />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">{breakdown}</p>
      {saving ? (
        <p className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-sm">
          <IconTag aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 text-pretty">{saving}</span>
        </p>
      ) : null}
    </div>
  );
}

function UnitsPicker({
  units,
  value,
  defaultValue,
  quantity: quantityProp,
  defaultQuantity,
  onChange,
  currency = "EUR",
  locale = "en-US",
  disabled = false,
  labels,
  pieceLabel,
  className,
  ...props
}: Omit<SalesUnitPickerUnitsProps, "mode">) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const fallback = units.find((unit) => isAvailable(rulesOf(unit))) ?? units[0];
  const [ownUnit, setOwnUnit] = useState(defaultValue ?? fallback?.id ?? "");
  const [ownQuantity, setOwnQuantity] = useState(() => defaultQuantity ?? rulesOf(units.find((unit) => unit.id === (defaultValue ?? fallback?.id)) ?? {}).min);
  const [note, setNote] = useState<Note | null>(null);
  // What the shopper asked for, in pieces, and the line it was recorded against. Only typing, stepping or pushing against a limit replaces it.
  const [ask, setAsk] = useState<{ pieces: number; unit: string; quantity: number } | null>(null);

  const unit = units.find((entry) => entry.id === (value ?? ownUnit)) ?? fallback;
  const quantity = quantityProp ?? ownQuantity;
  const rules = rulesOf(unit ?? {});
  // A unit switch rounds the line up, so the line can hold more pieces than were asked for. Converting from the line would grow
  // the order with every look at another unit; converting from the ask makes browsing the units free. The ask only counts while
  // the line is the one it was recorded against: a parent that moved the line has changed what the shopper wants.
  const asked = unit ? (ask && ask.unit === unit.id && ask.quantity === quantity ? ask.pieces : unit.pieces * quantity) : 0;
  const smallest = units.reduce<SalesUnit | undefined>((best, entry) => (best === undefined || entry.pieces < best.pieces ? entry : best), undefined);
  const piece: UnitNouns = pieceLabel ?? (smallest?.pieces === 1 ? nounsOf(smallest) : { one: "piece", other: "pieces" });
  const nouns = unit ? nounsOf(unit) : piece;

  const number = (amount: number): string => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const count = (amount: number, noun: UnitNouns): string => `${number(amount)} ${amount === 1 ? noun.one : noun.other}`;
  const holds = unit && unit.pieces > 1 ? fill(words.holds, { unit: nouns.one, pieces: count(unit.pieces, piece) }) : null;
  const hint = [holds, hintText(rules, { hint: words.hint, from: words.hintFrom, step: words.hintStep, max: words.hintMax }, number)].filter(Boolean).join(" ") || null;
  // "3 trays (36 cans)": the pieces are only worth saying when the unit is not the piece itself.
  const phrase = unit ? `${count(quantity, nouns)}${unit.pieces > 1 ? ` (${count(unit.pieces * quantity, piece)})` : ""}` : "";
  const calm = useCalmStatus(unit ? [note?.fresh ? note.text : null, fill(words.status, { quantity: phrase, total: money(lineTotal(unit, quantity)) })].filter(Boolean).join(" ") : "");
  if (!unit) return null;

  const total = lineTotal(unit, quantity);
  const pieces = unit.pieces * quantity;
  const saving = savingOnLine(units, unit, quantity);

  function commit(next: SalesUnit, nextQuantity: number, askedPieces: number) {
    setAsk({ pieces: askedPieces, unit: next.id, quantity: nextQuantity });
    if (value === undefined) setOwnUnit(next.id);
    if (quantityProp === undefined) setOwnQuantity(nextQuantity);
    onChange?.({ unit: next.id, quantity: nextQuantity, pieces: nextQuantity * next.pieces, total: lineTotal(next, nextQuantity) });
  }

  function ruleNote(hit: RuleHit): string {
    if (hit === "min") return fill(words.minNote, { units: capitalise(nouns.other, locale), min: number(rules.min) });
    if (hit === "max") return fill(words.maxNote, { units: nouns.other, max: number(rules.max ?? quantity) });
    return rules.step === 1 ? words.wholeNote : fill(words.stepNote, { units: capitalise(nouns.other, locale), step: number(rules.step) });
  }

  function chooseUnit(nextId: string) {
    const next = units.find((entry) => entry.id === nextId);
    if (!next || !unit || next.id === unit.id) return;
    // From what the shopper asked for, not from the line as it stands: the line may have been rounded up on the way here.
    const converted = convertQuantity({ pieces: 1 }, asked, next);
    const to = count(converted.quantity, nounsOf(next));
    // Equal pieces make the sentence true as it stands; fewer than asked means the stock stopped it; more means it was rounded up.
    // Landing exactly on the ask after a rounded-up line is the shopper's own number coming back, which needs no sentence.
    const message =
      converted.pieces === pieces
        ? fill(words.convertedExact, { from: count(quantity, nouns), to })
        : converted.pieces < asked
          ? fill(words.maxNote, { units: nounsOf(next).other, max: number(converted.quantity) })
          : converted.pieces > asked
            ? fill(words.convertedUp, { from: count(asked, piece), to })
            : null;
    setNote(message ? { text: message, fresh: true } : null);
    commit(next, converted.quantity, asked);
  }

  function changeQuantity(next: number, typed: number | null, pushed: boolean) {
    const { quantity: fixed, hit } = snapQuantity(rules, typed ?? next);
    // A key that pushed against a limit changes nothing, but the shopper should hear why.
    const bumped = pushed && fixed === quantity ? (fixed === rules.max ? "max" : fixed === rules.min && rules.min > 1 ? "min" : null) : null;
    const reason = hit ?? bumped;
    setNote(reason ? { text: ruleNote(reason), fresh: true } : null);
    // Typing, stepping and pushing against a limit are the shopper saying how many they want: the ask becomes this line.
    const own = unit as SalesUnit;
    if (fixed !== quantity) commit(own, fixed, fixed * own.pieces);
    else setAsk({ pieces: fixed * own.pieces, unit: own.id, quantity: fixed });
  }

  return (
    <div data-slot="sales-unit-picker" data-mode="units" aria-disabled={disabled || undefined} className={cn("grid w-full gap-5", className)} {...props}>
      <div className="grid gap-2.5">
        <p aria-hidden="true" className="text-sm font-medium">
          {words.buyBy}
        </p>
        <RadioCards
          label={words.buyBy}
          value={unit.id}
          onValueChange={chooseUnit}
          options={units.map((entry) => {
            const percent = savingPercent(units, entry);
            const available = isAvailable(rulesOf(entry));
            return {
              value: entry.id,
              title: entry.label,
              description: fill(words.perPiece, { price: formatPerPiece(pricePerPiece(entry), currency, locale), piece: piece.one }),
              disabled: disabled || !available,
              aside: (
                <span className="grid justify-items-end gap-1">
                  <span className="font-medium tabular-nums">{money(entry.price)}</span>
                  {!available ? (
                    // The card is dimmed as a whole, so the badge takes the darkest tone: the reason must stay readable inside the dimming.
                    <Badge variant="outline">{words.outOfStock}</Badge>
                  ) : percent > 0 ? (
                    <Badge variant="secondary" className="tabular-nums">
                      {fill(words.saves, { percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(percent / 100) })}
                    </Badge>
                  ) : null}
                </span>
              ),
            };
          })}
        />
      </div>

      <QuantityRow
        id={`${id}-quantity`}
        noteId={`${id}-note`}
        label={words.quantity}
        unitName={nouns.other}
        value={quantity}
        rules={rules}
        disabled={disabled || !isAvailable(rules)}
        onCommit={changeQuantity}
        suffix={
          <>
            {quantity === 1 ? nouns.one : nouns.other}
            {unit.pieces > 1 ? <span>{`\u00a0· ${count(pieces, piece)}`}</span> : null}
          </>
        }
        note={note ?? (hint ? { text: hint, fresh: false } : null)}
      />

      <TotalPanel
        words={words}
        total={total}
        currency={currency}
        locale={locale}
        breakdown={fill(words.breakdown, { pieces: count(pieces, piece), price: formatPerPiece(pricePerPiece(unit), currency, locale) })}
        saving={
          saving
            ? fill(words.saving, { amount: money(saving.amount), pieces: count(pieces, piece) })
            : null
        }
      />
      <p role="status" className="sr-only">
        {calm}
      </p>
    </div>
  );
}

const PRESET_WEIGHTS = [250, 500, 1000] as const;

function WeightPicker({
  pricePerKilo,
  presets = PRESET_WEIGHTS,
  minWeight = 100,
  weightStep = 50,
  maxWeight = 5000,
  quantity: quantityProp,
  defaultQuantity,
  onChange,
  currency = "EUR",
  locale = "en-US",
  disabled = false,
  labels,
  className,
  ...props
}: Omit<SalesUnitPickerWeightProps, "mode">) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const rules = rulesOf({ min: minWeight, step: weightStep, max: maxWeight });
  const [own, setOwn] = useState(() => defaultQuantity ?? presets[1] ?? rules.min);
  const [note, setNote] = useState<Note | null>(null);
  const grams = quantityProp ?? own;
  const total = weightTotal(pricePerKilo, grams);

  const money = (amount: number): string => formatMoney({ amount, currency }, locale);
  const weight = (amount: number): string => formatWeight(amount, locale);
  const kilo = money(pricePerKilo);
  const hint = hintText(rules, { hint: words.weightHint, from: words.weightFrom, step: words.weightStep, max: words.weightMax }, weight);
  const calm = useCalmStatus([note?.fresh ? note.text : null, fill(words.weightStatus, { weight: weight(grams), total: money(total) })].filter(Boolean).join(" "));

  function commit(next: number) {
    if (quantityProp === undefined) setOwn(next);
    onChange?.({ unit: "g", quantity: next, total: weightTotal(pricePerKilo, next) });
  }

  function ruleNote(hit: RuleHit): string {
    if (hit === "min") return fill(words.weightMinNote, { min: weight(rules.min) });
    if (hit === "max") return fill(words.weightMaxNote, { max: weight(rules.max ?? grams) });
    return fill(words.weightStepNote, { step: weight(rules.step) });
  }

  function changeWeight(next: number, typed: number | null, pushed: boolean) {
    const { quantity: fixed, hit } = snapQuantity(rules, typed ?? next);
    const bumped = pushed && fixed === grams ? (fixed === rules.max ? "max" : fixed === rules.min ? "min" : null) : null;
    const reason = hit ?? bumped;
    setNote(reason ? { text: ruleNote(reason), fresh: true } : null);
    if (fixed !== grams) commit(fixed);
  }

  const choices = presets.filter((preset, index) => presets.indexOf(preset) === index && snapQuantity(rules, preset).hit === null);
  const matching = choices.includes(grams) ? String(grams) : "";

  return (
    <div data-slot="sales-unit-picker" data-mode="weight" aria-disabled={disabled || undefined} className={cn("grid w-full gap-5", className)} {...props}>
      <div className="grid gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <p aria-hidden="true" className="text-sm font-medium">
            {words.weight}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">{fill(words.perKilo, { price: kilo })}</p>
        </div>
        <RadioGroupPrimitive.Root
          aria-label={words.weight}
          value={matching}
          disabled={disabled}
          onValueChange={(next) => {
            setNote(null);
            commit(Number(next));
          }}
          className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2"
        >
          {choices.map((preset) => (
            <RadioGroupPrimitive.Item
              key={preset}
              value={String(preset)}
              className="flex flex-col items-start gap-0.5 rounded-xl border border-border px-3.5 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40 motion-reduce:transition-none"
            >
              <span className="text-sm font-medium tabular-nums">{weight(preset)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{money(weightTotal(pricePerKilo, preset))}</span>
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
      </div>

      <QuantityRow
        id={`${id}-amount`}
        noteId={`${id}-note`}
        label={words.customAmount}
        unitName="g"
        value={grams}
        rules={rules}
        disabled={disabled}
        onCommit={changeWeight}
        suffix={<>g</>}
        note={note ?? (hint ? { text: hint, fresh: false } : null)}
      />

      <TotalPanel words={words} total={total} currency={currency} locale={locale} breakdown={fill(words.weightBreakdown, { weight: weight(grams), price: kilo })} saving={null} />
      <p role="status" className="sr-only">
        {calm}
      </p>
    </div>
  );
}

/**
 * How you buy, when a product is sold in more than one unit: a piece, a box of 12, a pallet of 240, or by
 * weight. Each unit shows its price and its price per piece, so the cheaper ones are easy to find, and larger
 * units say in words what they save. Switching unit converts the quantity to the pieces the shopper asked for,
 * rounded up so they are never left short, and says so; looking at another unit never changes what they asked
 * for, so switching back gives the same quantity again. Minimum, step and maximum are rules of the unit: a
 * typed number is corrected to the nearest allowed one with a plain message. The line total is a polite
 * status. Weight mode swaps the units for one-tap amounts (250 g, 500 g, 1 kg) and a custom amount, priced by
 * the kilo.
 */
export function SalesUnitPicker(props: SalesUnitPickerProps) {
  // `mode` only chooses the picker; it must not travel on to the element as an attribute.
  if (props.mode === "weight") {
    const { mode, ...rest } = props;
    void mode;
    return <WeightPicker {...rest} />;
  }
  const { mode, ...rest } = props;
  void mode;
  return <UnitsPicker {...rest} />;
}
