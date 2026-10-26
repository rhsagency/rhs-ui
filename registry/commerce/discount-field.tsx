"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { InputGroup, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

/** How the number is read: an `amount` of money (in minor units) or a `percent` of the price. */
export type DiscountType = "amount" | "percent";

/** What the field reports: an amount in minor units (1500 is 15.00), or a percentage as a plain number (12.5 is 12.5%). */
export type DiscountValue = { type: "amount"; value: number } | { type: "percent"; value: number };

export interface DiscountFieldLabels {
  /** The label over the field. */
  label?: string;
  /** Names the switch for a screen reader. */
  group?: string;
  /** Under the field while nothing is entered. `{price}`. */
  price?: string;
  /** Under the field once a discount is entered. `{price}` is the new price, `{percent}` the discount in percent. */
  result?: string;
  /** A percentage that is too big. `{max}`. */
  tooMuchPercent?: string;
  /** An amount that is bigger than the price. `{price}`. */
  tooMuchAmount?: string;
  /** The text in the empty field when the switch is on a percentage. */
  percentPlaceholder?: string;
}

const WORDS = {
  label: "Discount",
  group: "Discount type",
  price: "Price {price}",
  result: "New price {price}, {percent}% off",
  tooMuchPercent: "A discount cannot be more than {max}%.",
  tooMuchAmount: "A discount cannot be more than the price, {price}.",
  percentPlaceholder: "0",
} satisfies Required<DiscountFieldLabels>;

export interface DiscountFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The discount, to control the field. `null` is an empty field. An amount is in minor units, a percentage a plain number. */
  value?: DiscountValue | null;
  /** The discount the field starts with, when you do not control it. */
  defaultValue?: DiscountValue | null;
  /** Called with `{ type, value }` while the person types or flips the switch, and with `null` when the field is empty or the discount is refused. */
  onValueChange?: (value: DiscountValue | null) => void;
  /** The price the discount comes off, in minor units. With it the field prints the new price under itself and refuses an amount above it. */
  price?: number;
  /** ISO 4217 code: it is the name of the amount side of the switch. */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same numbers. */
  locale?: string;
  /** The most a percentage may be. Defaults to 100. */
  maxPercent?: number;
  /** Submits the discount with a form: the number goes under this name (minor units for an amount) and its type under `{name}-type`. */
  name?: string;
  /** Which side of the switch is on while the field is empty and nothing says otherwise. Defaults to "percent". */
  defaultType?: DiscountType;
  /** Keep the label for screen readers only, for a field in a table cell or a row of fields. */
  hideLabel?: boolean;
  /** Turns the field and its switch off. */
  disabled?: boolean;
  /** The words, for another language. */
  labels?: DiscountFieldLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** How many minor-unit digits the currency has in this locale: 2 for euros, 0 for yen. */
function minorDigits(currency: string, locale: string): number {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

/** Keeps digits and one decimal separator, with no more decimals than the side of the switch has. */
function sanitize(raw: string, decimals: number): string {
  let out = "";
  let separated = false;
  let after = 0;
  for (const char of raw) {
    if (char >= "0" && char <= "9") {
      if (separated) {
        if (after >= decimals) continue;
        after += 1;
      }
      out += char;
    } else if ((char === "." || char === ",") && !separated && decimals > 0) {
      separated = true;
      out += char;
    }
  }
  return out;
}

/** "12,5" and "12.50" are both 12.5, whichever the person's keyboard types. `null` for nothing at all. */
function parseDecimal(text: string): number | null {
  const cleaned = text.replace(/[^\d.,]/g, "");
  if (!/\d/.test(cleaned)) return null;
  const last = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
  const whole = last === -1 ? cleaned : cleaned.slice(0, last).replace(/[.,]/g, "");
  const fraction = last === -1 ? "" : cleaned.slice(last + 1);
  const number = Number(`${whole || "0"}.${fraction || "0"}`);
  return Number.isFinite(number) ? number : null;
}

const sameValue = (a: DiscountValue | null | undefined, b: DiscountValue | null | undefined): boolean => (a ?? null) === (b ?? null) || (!!a && !!b && a.type === b.type && a.value === b.value);

/** A sentence with the new price in bold: the parts of the template that are not placeholders stay as they are. */
function sentence(template: string, price: string, percent: string): ReactNode {
  return template.split(/(\{price\}|\{percent\})/).map((part, index) => {
    if (part === "{price}") {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {price}
        </strong>
      );
    }
    return part === "{percent}" ? percent : part;
  });
}

/**
 * A discount as either an amount or a percentage, with the switch inside the field: type a number, flip between
 * "EUR" and "%" and it is read the other way. Each side keeps its own number, so flipping never loses what was typed.
 * Give it the price and it prints "New price 38.40 EUR, 20% off" under the field, and refuses a percentage above the
 * maximum or an amount above the price in words. It reports `{ type, value }`, with an amount in minor units and a
 * percentage as a plain number, or `null` when the field is empty or the discount is refused, so a form never holds
 * an impossible discount. The switch is a radio group with arrow keys and a name for screen readers.
 */
export function DiscountField({
  value,
  defaultValue,
  onValueChange,
  price,
  currency = "EUR",
  locale = "en-US",
  maxPercent = 100,
  name,
  defaultType = "percent",
  hideLabel = false,
  disabled = false,
  labels,
  className,
  ...props
}: DiscountFieldProps) {
  const words: Required<DiscountFieldLabels> = { ...WORDS, ...labels };
  const id = useId();
  const digits = minorDigits(currency, locale);
  const controlled = value !== undefined;
  const [own, setOwn] = useState<DiscountValue | null>(defaultValue ?? null);
  const current = controlled ? value : own;

  /** A number written the way the field shows it once the person has left it. */
  const written = (type: DiscountType, number: number): string =>
    type === "amount"
      ? new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false }).format(number / 10 ** digits)
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 2, useGrouping: false }).format(number);
  const amountText = (minor: number): string => `${new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits)} ${currency}`;

  const [mode, setMode] = useState<DiscountType>(current?.type ?? defaultType);
  const [texts, setTexts] = useState<Record<DiscountType, string>>(() => ({
    amount: current?.type === "amount" ? written("amount", current.value) : "",
    percent: current?.type === "percent" ? written("percent", current.value) : "",
  }));
  const emitted = useRef<DiscountValue | null>(current ?? null);

  // The page changed the value (a reset, a saved discount): follow it, unless it is only the echo of what the field just said.
  useEffect(() => {
    if (value === undefined || sameValue(value, emitted.current)) return;
    emitted.current = value;
    if (value === null) {
      setTexts({ amount: "", percent: "" });
      return;
    }
    setMode(value.type);
    setTexts((previous) => ({ ...previous, [value.type]: written(value.type, value.value) }));
  }, [value?.type, value?.value, value === null]);

  const decimals = { amount: digits, percent: 2 } as const;
  const parse = (type: DiscountType, text: string): number | null => {
    const number = parseDecimal(text);
    return number === null ? null : type === "amount" ? Math.round(number * 10 ** digits) : number;
  };
  /** Why a number is refused, in words, or `null` when it is fine. */
  const refusal = (type: DiscountType, number: number): string | null => {
    if (type === "percent" && number > maxPercent) return fill(words.tooMuchPercent, { max: new Intl.NumberFormat(locale).format(maxPercent) });
    if (type === "amount" && price !== undefined && number > price) return fill(words.tooMuchAmount, { price: amountText(price) });
    return null;
  };

  function emit(next: DiscountValue | null) {
    emitted.current = next;
    if (!controlled) setOwn(next);
    onValueChange?.(next);
  }
  function report(type: DiscountType, text: string) {
    const number = parse(type, text);
    if (number === null || refusal(type, number) !== null) emit(null);
    else emit({ type, value: number });
  }
  function onType(raw: string) {
    const text = sanitize(raw, decimals[mode]);
    setTexts((previous) => ({ ...previous, [mode]: text }));
    report(mode, text);
  }
  function choose(next: DiscountType) {
    if (next === mode) return;
    setMode(next);
    report(next, texts[next]);
  }
  function tidy() {
    const number = parse(mode, texts[mode]);
    if (number !== null) setTexts((previous) => ({ ...previous, [mode]: written(mode, number) }));
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: DiscountType = event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "Home" ? "amount" : "percent";
    choose(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-type="${next}"]`)?.focus();
  }

  const text = texts[mode];
  const number = parse(mode, text);
  const error = number === null ? null : refusal(mode, number);
  let note: ReactNode = null;
  if (error) {
    note = (
      <span className="flex items-start gap-1.5 text-destructive">
        <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
        {error}
      </span>
    );
  } else if (price !== undefined) {
    if (number !== null) {
      const percent = mode === "percent" ? number : price > 0 ? (number / price) * 100 : 0;
      const off = mode === "percent" ? Math.round((price * number) / 100) : number;
      note = <span className="text-muted-foreground">{sentence(words.result, amountText(price - off), new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(percent))}</span>;
    } else {
      note = <span className="text-muted-foreground">{fill(words.price, { price: amountText(price) })}</span>;
    }
  }

  const options: { type: DiscountType; text: string }[] = [
    { type: "amount", text: currency },
    { type: "percent", text: "%" },
  ];

  return (
    <div data-slot="discount-field" data-type={mode} className={cn("grid grid-cols-[minmax(0,1fr)] gap-2", className)} {...props}>
      <Label htmlFor={`${id}-input`} className={cn(hideLabel && "sr-only")}>
        {words.label}
      </Label>
      <InputGroup>
        <InputGroupInput
          id={`${id}-input`}
          inputMode="decimal"
          autoComplete="off"
          placeholder={mode === "amount" ? new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(0) : words.percentPlaceholder}
          value={text}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-note`}
          onChange={(event) => onType(event.target.value)}
          onBlur={tidy}
          className="tabular-nums"
        />
        <div role="radiogroup" aria-label={words.group} onKeyDown={onKeyDown} className="mr-1 flex h-7 shrink-0 items-center rounded-[5px] bg-muted p-0.5">
          {options.map((option) => (
            <button
              key={option.type}
              type="button"
              role="radio"
              data-type={option.type}
              aria-checked={mode === option.type}
              tabIndex={mode === option.type ? 0 : -1}
              disabled={disabled}
              onClick={() => choose(option.type)}
              className={cn(
                "h-6 min-w-9 rounded-[4px] px-2.5 text-xs font-medium outline-none transition-[background-color,color,box-shadow] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed motion-reduce:transition-none",
                mode === option.type ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.text}
            </button>
          ))}
        </div>
      </InputGroup>
      <p id={`${id}-note`} role="status" className="text-sm tabular-nums empty:-mt-2">
        {note}
      </p>
      {name ? (
        <>
          <input type="hidden" name={name} value={current ? String(current.value) : ""} />
          <input type="hidden" name={`${name}-type`} value={current ? current.type : mode} />
        </>
      ) : null}
    </div>
  );
}
