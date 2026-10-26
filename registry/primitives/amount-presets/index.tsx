"use client";

import { useCallback, useId, useRef, useState, type ChangeEvent, type ComponentProps } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import {
  currencyDigits,
  currencySymbol,
  DEFAULT_LABELS,
  formatAmount,
  formatPreset,
  formatWithCode,
  parseAmount,
  tidyTyping,
  type AmountPresetsLabels,
} from "@rhs-ui/primitives/amount-presets/amounts";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { AmountPresetsLabels } from "@rhs-ui/primitives/amount-presets/amounts";

/** One suggested amount. */
export interface AmountPreset {
  /** The amount in minor units: 2500 is 25.00 in euros and 2,500 in yen. */
  amount: number;
  /** One line about what this amount does, shown under the chips while it is the chosen one: "Feeds a family for a week". */
  impact?: string;
}

export interface AmountPresetsProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "dir"> {
  /** The amounts to choose from, in the order they are shown. */
  presets: readonly AmountPreset[];
  /** The chosen amount in minor units, when you control it. Null while nothing is chosen, and while the other amount is empty or refused. */
  value?: number | null;
  /** The amount to start with, when you do not control it. One that is not a preset opens the other-amount field. */
  defaultValue?: number | null;
  /** Called with the amount in minor units, or null. A custom amount outside `min` and `max` is never reported. */
  onValueChange?: (amount: number | null) => void;
  /** The ISO code of the currency. Default "EUR". */
  currency?: string;
  /** The locale that writes the amounts and decides the decimal sign. Default "en-US". */
  locale?: string;
  /** The lowest amount allowed for the other-amount field, in minor units. */
  min?: number;
  /** The highest amount allowed for the other-amount field, in minor units. */
  max?: number;
  /** The name of the group for a screen reader. Default "Amount". */
  label?: string;
  /** The amount of the preset to mark with the words "Most popular". */
  suggested?: number;
  /** Dim the group and stop it responding. */
  disabled?: boolean;
  /** The field's name for a plain form submit: the amount in minor units, or empty. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<AmountPresetsLabels>;
}

const OTHER = "other";
const keyOf = (amount: number) => `p${amount}`;

/**
 * The columns of the chips by how many there are, so a row is never left with
 * one chip on its own. What counts is the width the field has, not the
 * screen: a container query, so the same field fits a card, a sheet or a page.
 * A chip is never narrower than about 88px, enough for a checked "10,000" with
 * its check, so a narrow field falls back to two columns. Past six chips the
 * grid fills the row as far as it can.
 */
const COLUMNS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 @[18rem]:grid-cols-3",
  4: "grid-cols-2 @sm:grid-cols-4",
  5: "grid-cols-2 @[18rem]:grid-cols-3 @[30rem]:grid-cols-5",
  6: "grid-cols-2 @[18rem]:grid-cols-3 @[36rem]:grid-cols-6",
};
const AUTO_COLUMNS = "grid-cols-[repeat(auto-fit,minmax(5.25rem,1fr))]";

const CHIP = [
  "group/chip relative flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[0.9375rem] font-medium text-foreground tabular-nums shadow-xs",
  "transition-[background-color,border-color,color,box-shadow] duration-150 outline-none motion-reduce:transition-none",
  "hover:bg-muted hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_30%)]",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background",
  "data-[state=checked]:hover:bg-foreground/90 data-[state=checked]:focus-visible:border-foreground",
  "active:not-disabled:translate-y-px",
  // Disabled, the chosen chip keeps its check and a quiet fill; a black slab at half strength would be the heaviest thing in the field.
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:data-[state=checked]:border-border disabled:data-[state=checked]:bg-muted disabled:data-[state=checked]:text-foreground disabled:data-[state=checked]:opacity-100 disabled:data-[state=checked]:hover:bg-muted",
].join(" ");

/** The check that opens up in front of a chosen chip's label: it grows from nothing, so the choice never rests on the fill alone. */
const MARK = "-mr-1.5 h-4 w-0 shrink-0 opacity-0 transition-[width,margin,opacity] duration-150 group-data-[state=checked]/chip:mr-0 group-data-[state=checked]/chip:w-4 group-data-[state=checked]/chip:opacity-100 motion-reduce:transition-none";

/**
 * Pick a gift, a donation or a top-up from a few amounts, or type your own.
 * The presets are chips that work as one radio group: the arrow keys move
 * between them, the group is a single tab stop, and the chosen chip is filled
 * and carries a check, so it never rests on colour alone. The last chip,
 * Other, opens a field for any amount, written in the currency's own decimals;
 * choosing a preset clears it again. One preset can be marked "Most popular" in
 * words, and each can carry a line about what it does, shown under the chips
 * while it is chosen. An amount outside `min` and `max` is explained with both
 * limits in words and is never reported, so a form cannot submit it.
 */
export function AmountPresets({
  presets,
  value,
  defaultValue = null,
  onValueChange,
  currency = "EUR",
  locale = "en-US",
  min,
  max,
  label = "Amount",
  suggested,
  disabled,
  name,
  labels: labelOverrides,
  className,
  ...props
}: AmountPresetsProps) {
  const id = useId();
  const statusId = `${id}-status`;
  const labels: AmountPresetsLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const digits = currencyDigits(currency);
  const sign = currencySymbol(currency, locale);
  const start = value === undefined ? defaultValue : value;
  const isPreset = (amount: number | null) => amount !== null && presets.some((preset) => preset.amount === amount);
  const [own, setOwn] = useState<number | null>(defaultValue);
  const current = value === undefined ? own : value;
  const [customOpen, setCustomOpen] = useState(() => start !== null && !isPreset(start));
  const [draft, setDraft] = useState(() => (start !== null && !isPreset(start) ? formatAmount(start, digits, locale) : ""));
  const [message, setMessage] = useState<string | null>(null);
  const [synced, setSynced] = useState(value);
  // What this field last reported: a `value` that equals it is the echo of our own report, anything else came from outside.
  const [reported, setReported] = useState(start);
  const field = useRef<HTMLInputElement | null>(null);
  // An arrow key chooses the chip it moves to, and must not pull the focus into the field it opens.
  const byArrow = useRef(false);
  const attach = useCallback((node: HTMLInputElement | null) => {
    field.current = node;
  }, []);

  // An amount that arrives from outside replaces what was chosen: a preset closes the field, any other amount opens it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== reported) {
      setReported(value);
      setMessage(null);
      if (value !== null && !isPreset(value)) {
        setCustomOpen(true);
        setDraft(formatAmount(value, digits, locale));
      } else {
        setCustomOpen(false);
        setDraft("");
      }
    }
  }

  const otherOn = customOpen;
  // In a narrow field the chips fall back to two columns; an odd one out at the end (the Other chip) takes the whole row instead of sitting alone in the corner.
  const oddOne = presets.length + 1 === 3 || presets.length + 1 === 5;
  const chosen = otherOn ? OTHER : isPreset(current) && current !== null ? keyOf(current) : "";
  const impact = otherOn ? undefined : presets.find((preset) => preset.amount === current)?.impact;
  const reserve = otherOn || presets.some((preset) => preset.impact);

  /** What is wrong with this text as an amount to give, in words, or null. An empty field is not wrong yet: nothing is reported for it. */
  function problemOf(text: string, minor: number | null): string | null {
    if (!text.trim()) return null;
    if (minor === null) return labels.notAnAmount;
    if (minor <= 0) return labels.positive;
    const below = min !== undefined && minor < min;
    const above = max !== undefined && minor > max;
    if (!below && !above) return null;
    if (min !== undefined && max !== undefined) return labels.between(formatWithCode(min, currency, locale), formatWithCode(max, currency, locale));
    return min !== undefined ? labels.atLeast(formatWithCode(min, currency, locale)) : labels.atMost(formatWithCode(max ?? 0, currency, locale));
  }

  function write(next: number | null) {
    if (value === undefined) setOwn(next);
    setReported(next);
    onValueChange?.(next);
  }

  function choose(key: string) {
    if (key === OTHER) {
      setCustomOpen(true);
      const minor = parseAmount(draft, digits, locale);
      write(minor !== null && problemOf(draft, minor) === null ? minor : null);
      return;
    }
    setCustomOpen(false);
    setDraft("");
    setMessage(null);
    write(Number(key.slice(1)));
  }

  function type(event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value);
    const minor = parseAmount(text, digits, locale);
    const problem = problemOf(text, minor);
    setDraft(text);
    // A message that is already showing follows the typing and goes as soon as the amount is right. A new one waits for the field to be left.
    setMessage((now) => (now === null ? null : problem));
    write(minor !== null && problem === null ? minor : null);
  }

  function leave() {
    const minor = parseAmount(draft, digits, locale);
    const text = minor === null ? draft : formatAmount(minor, digits, locale);
    if (text !== draft) setDraft(text);
    setMessage(problemOf(text, minor));
  }

  function focusField() {
    if (byArrow.current) return;
    requestAnimationFrame(() => field.current?.focus());
  }

  return (
    <div data-slot="amount-presets" className={cn("@container w-full min-w-0", className)} {...props}>
      <RadioGroupPrimitive.Root
        aria-label={label}
        aria-describedby={reserve ? statusId : undefined}
        value={chosen}
        onValueChange={choose}
        disabled={disabled}
        onKeyDownCapture={(event) => {
          byArrow.current = event.key.startsWith("Arrow");
        }}
        onPointerDownCapture={() => {
          byArrow.current = false;
        }}
        className={cn("grid gap-x-2 gap-y-3 pt-2.5", COLUMNS[presets.length + 1] ?? AUTO_COLUMNS)}
      >
        {presets.map((preset) => (
          <RadioGroupPrimitive.Item key={preset.amount} value={keyOf(preset.amount)} className={CHIP}>
            <IconCheck aria-hidden="true" className={MARK} />
            <span>{formatPreset(preset.amount, currency, locale)}</span>
            {preset.amount === suggested ? (
              <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-background px-1.5 text-xs leading-4 font-medium whitespace-nowrap text-muted-foreground">{labels.popular}</span>
            ) : null}
          </RadioGroupPrimitive.Item>
        ))}
        <RadioGroupPrimitive.Item value={OTHER} className={cn(CHIP, oddOne && "@max-[18rem]:col-span-2")} onClick={focusField}>
          <IconCheck aria-hidden="true" className={MARK} />
          <span>{labels.other}</span>
        </RadioGroupPrimitive.Item>
      </RadioGroupPrimitive.Root>
      {/* The field is always in the page and opens by growing, so choosing Other does not jump the content below. Closed, it is inert: out of the tab order and away from assistive technology. */}
      <div
        data-state={otherOn ? "open" : "closed"}
        inert={!otherOn}
        className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out data-[state=open]:grid-rows-[1fr] data-[state=open]:opacity-100 motion-reduce:transition-none"
      >
        {/* Clipped top and bottom to collapse, but 0.25rem wider on each side, so the focus ring is not cut and nothing bleeds into the page layout. */}
        <div className="min-h-0 min-w-0 [clip-path:inset(0_-0.25rem)]">
          <div className="pt-3 pb-1">
            <InputGroup className="max-w-56">
              <InputGroupAddon aria-hidden="true" className="pr-0">
                {sign}
              </InputGroupAddon>
              <InputGroupInput
                ref={attach}
                type="text"
                inputMode={digits === 0 ? "numeric" : "decimal"}
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                aria-label={labels.customAmount}
                aria-invalid={message ? true : undefined}
                aria-describedby={statusId}
                placeholder={formatAmount(0, digits, locale)}
                value={draft}
                onChange={type}
                onBlur={leave}
                className="pl-1.5 tabular-nums"
              />
              <InputGroupAddon aria-hidden="true" className="pl-0 text-xs font-medium">
                {currency}
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>
      {reserve ? (
        <div id={statusId} aria-live="polite" className="mt-2 min-h-5 text-sm">
          {message ? (
            <p className="flex items-start gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {message}
            </p>
          ) : impact ? (
            <p className="text-muted-foreground">{impact}</p>
          ) : null}
        </div>
      ) : null}
      {name ? <input type="hidden" name={name} value={current ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
