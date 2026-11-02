"use client";

import { useId, useState, type ComponentProps } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import {
  formatAmount,
  formatMoneyText,
  formatRate,
  minorDigits,
  parseAmount,
  tidyTyping,
  vatPrice,
  type VatInput,
  type VatMode,
  type VatPrice,
} from "@rhs-ui/commerce/vat-price-field/vat";
import { cn } from "@/lib/utils";

export type { VatInput, VatMode, VatPrice } from "@rhs-ui/commerce/vat-price-field/vat";

export interface VatPriceFieldLabels {
  /** The label over the field. */
  price?: string;
  /** Names the switch between the two sides, for a screen reader. */
  youEnter?: string;
  /** The button that says the number typed is the price without VAT. */
  excluding?: string;
  /** The button that says the number typed is the price with VAT. */
  including?: string;
  /** Under the field while the price without VAT is typed. */
  enteringExcluding?: string;
  /** Under the field while the price with VAT is typed. */
  enteringIncluding?: string;
  /** The label over the rates, and the name of that group. */
  rate?: string;
  /** The row with the price without VAT. */
  net?: string;
  /** The row with the VAT. `{rate}` is the rate, "21%". */
  vat?: string;
  /** The row with the price with VAT. */
  gross?: string;
  /** Beside the row that was typed. */
  entered?: string;
  /** In place of a figure while nothing is typed, for a screen reader. */
  empty?: string;
  /** What a screen reader hears when the field is left or the switch or the rate changes. `{net}`, `{vat}`, `{gross}` and `{rate}`. */
  announce?: string;
}

const WORDS = {
  price: "Price",
  youEnter: "You enter",
  excluding: "Excl. VAT",
  including: "Incl. VAT",
  enteringExcluding: "You enter the price without VAT.",
  enteringIncluding: "You enter the price with VAT.",
  rate: "VAT rate",
  net: "Excluding VAT",
  vat: "VAT {rate}",
  gross: "Including VAT",
  entered: "You entered",
  empty: "Not entered yet",
  announce: "{net} excluding VAT. VAT at {rate} is {vat}. {gross} including VAT.",
} satisfies Required<VatPriceFieldLabels>;

/** The Dutch rates, which are the ones the demo shows. Pass your own country's. */
const DEFAULT_RATES: readonly number[] = [0, 9, 21];

export interface VatPriceFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The amount as typed, in minor units: the price without VAT in "excluding" mode, the price with VAT in "including" mode. Null is an empty field. Pass it to control the field. */
  value?: number | null;
  /** The amount to start with, when you do not control the field. */
  defaultValue?: number | null;
  /** Which side the amount is. Pass it to control the switch. */
  mode?: VatMode;
  /** The side to start with, when you do not control the switch. Defaults to "excluding". */
  defaultMode?: VatMode;
  /** The VAT rate in percent: 21 is 21%. Pass it to control the rates. */
  rate?: number;
  /** The rate to start with. Defaults to the highest of `rates`, the standard rate. */
  defaultRate?: number;
  /** The rates to choose from, in percent. A rate that is chosen but not in the list is added to it. Defaults to 0, 9 and 21. */
  rates?: readonly number[];
  /** ISO 4217 code: it sets the symbol and how many decimals the amount has (two for euros, none for yen). */
  currency?: string;
  /** Always pass your application locale, so the server and the browser write the same amounts and rates. */
  locale?: string;
  /**
   * Called on every change of the amount, the switch or the rate. `price` has both sides in minor units, worked out
   * once and rounded half up, or is null while the field is empty. `input` is what to hand back to `value`, `mode`
   * and `rate` when you control the field.
   */
  onChange?: (price: VatPrice | null, input: VatInput) => void;
  /** Submits the price with a form: `{name}-net`, `{name}-vat`, `{name}-gross` in minor units and `{name}-rate` in percent. */
  name?: string;
  /** Turns the field, the switch and the rates off. */
  disabled?: boolean;
  /** The words, for another language. */
  labels?: VatPriceFieldLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * Enter a price once and see both sides of it. Type the price without VAT or with it (a switch says which), choose
 * the rate, and a list shows the price without VAT, the VAT at that rate and the price with VAT, so a merchant sees
 * what the customer pays before saving. Everything is worked out in whole minor units and rounded half up exactly
 * once, so the three figures always add up and nothing is rounded twice. Changing the switch keeps the number you
 * typed and works out the other side; a comma or a point both work as the decimal sign. `onChange` reports
 * `{ net, vat, gross, rate }`, and a screen reader hears the result when the field is left or the switch or the rate
 * changes, not on every key.
 */
export function VatPriceField({
  value,
  defaultValue,
  mode,
  defaultMode = "excluding",
  rate,
  defaultRate,
  rates = DEFAULT_RATES,
  currency = "EUR",
  locale = "en-US",
  onChange,
  name,
  disabled = false,
  labels,
  className,
  ...props
}: VatPriceFieldProps) {
  const words: Required<VatPriceFieldLabels> = { ...WORDS, ...labels };
  const id = useId();
  const digits = minorDigits(currency, locale);
  const sign = new Intl.NumberFormat(locale, { style: "currency", currency }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;

  const [ownValue, setOwnValue] = useState<number | null>(defaultValue ?? null);
  const [ownMode, setOwnMode] = useState<VatMode>(defaultMode);
  const [ownRate, setOwnRate] = useState<number>(defaultRate ?? Math.max(0, ...rates));
  const amount = value !== undefined ? value : ownValue;
  const currentMode = mode ?? ownMode;
  const currentRate = rate ?? ownRate;

  // What is typed, as text. An amount that arrives from outside replaces it, unless it is only what the typing already means.
  const [draft, setDraft] = useState(() => (amount === null ? "" : formatAmount(amount, digits, locale)));
  const [seen, setSeen] = useState(amount);
  if (amount !== seen) {
    setSeen(amount);
    if (parseAmount(draft, digits, locale) !== amount) setDraft(amount === null ? "" : formatAmount(amount, digits, locale));
  }
  const [spoken, setSpoken] = useState("");

  const price = amount === null ? null : vatPrice(amount, currentMode, currentRate);
  const money = (minor: number): string => formatMoneyText(minor, currency, digits, locale);

  function announce(next: VatInput) {
    setSpoken(next.value === null ? "" : speak(vatPrice(next.value, next.mode, next.rate)));
  }
  function speak(result: VatPrice): string {
    return fill(words.announce, { net: money(result.net), vat: money(result.vat), gross: money(result.gross), rate: formatRate(result.rate, locale) });
  }
  function emit(next: VatInput) {
    if (value === undefined) setOwnValue(next.value);
    if (mode === undefined) setOwnMode(next.mode);
    if (rate === undefined) setOwnRate(next.rate);
    onChange?.(next.value === null ? null : vatPrice(next.value, next.mode, next.rate), next);
  }
  function type(raw: string) {
    const text = tidyTyping(raw, digits, locale);
    setDraft(text);
    emit({ value: parseAmount(text, digits, locale), mode: currentMode, rate: currentRate });
  }
  function leave() {
    const minor = parseAmount(draft, digits, locale);
    setDraft(minor === null ? "" : formatAmount(minor, digits, locale));
    announce({ value: minor, mode: currentMode, rate: currentRate });
  }
  function chooseMode(next: VatMode) {
    if (next === currentMode) return;
    const input = { value: amount, mode: next, rate: currentRate };
    emit(input);
    announce(input);
  }
  function chooseRate(next: number) {
    if (next === currentRate) return;
    const input = { value: amount, mode: currentMode, rate: next };
    emit(input);
    announce(input);
  }

  const listed = [...new Set(rates.includes(currentRate) ? rates : [...rates, currentRate])].sort((a, b) => a - b);
  const hint = currentMode === "excluding" ? words.enteringExcluding : words.enteringIncluding;

  const rows = [
    { key: "net", term: words.net, minor: price?.net, typed: currentMode === "excluding" },
    { key: "vat", term: fill(words.vat, { rate: formatRate(currentRate, locale) }), minor: price?.vat, typed: false },
  ] as const;

  return (
    <div data-slot="vat-price-field" data-mode={currentMode} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Label htmlFor={`${id}-input`}>{words.price}</Label>
          <SegmentedControl
            label={words.youEnter}
            value={currentMode}
            onValueChange={(next) => chooseMode(next === "including" ? "including" : "excluding")}
            options={[
              { value: "excluding", label: words.excluding, disabled },
              { value: "including", label: words.including, disabled },
            ]}
            className="w-fit [&_button]:px-3 [&_button]:py-1 [&_button]:text-[0.8125rem]"
          />
        </div>
        <InputGroup>
          <InputGroupAddon aria-hidden="true">{sign}</InputGroupAddon>
          <InputGroupInput
            id={`${id}-input`}
            inputMode={digits === 0 ? "numeric" : "decimal"}
            autoComplete="off"
            placeholder={formatAmount(0, digits, locale)}
            value={draft}
            disabled={disabled}
            aria-describedby={`${id}-currency ${id}-hint`}
            onChange={(event) => type(event.target.value)}
            onBlur={leave}
            className="pl-2 tabular-nums"
          />
          <InputGroupAddon id={`${id}-currency`} className="text-xs">
            {currency}
          </InputGroupAddon>
        </InputGroup>
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      </div>

      <div className="grid gap-2">
        <span className="text-sm leading-none font-medium">{words.rate}</span>
        <SegmentedControl
          label={words.rate}
          value={String(currentRate)}
          onValueChange={(next) => chooseRate(Number(next))}
          options={listed.map((item) => ({ value: String(item), label: formatRate(item, locale), disabled }))}
          className="flex w-full [&_button]:flex-1 [&_button]:py-2 [&_button]:tabular-nums"
        />
      </div>

      <dl className="grid divide-y divide-border rounded-lg border border-border bg-muted/40 px-4 text-sm">
        {rows.map((row) => (
          <div key={row.key} className="flex items-baseline justify-between gap-4 py-2.5">
            <dt className="flex flex-wrap items-baseline gap-x-2 text-muted-foreground">
              {row.term}
              {row.typed && price ? <span className="text-xs whitespace-nowrap">{words.entered}</span> : null}
            </dt>
            <dd className="font-medium tabular-nums">{row.minor === undefined ? <Blank label={words.empty} /> : money(row.minor)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-3">
          <dt className="flex flex-wrap items-baseline gap-x-2 font-medium">
            {words.gross}
            {currentMode === "including" && price ? <span className="text-xs font-normal whitespace-nowrap text-muted-foreground">{words.entered}</span> : null}
          </dt>
          <dd className="text-base font-semibold tabular-nums">{price ? money(price.gross) : <Blank label={words.empty} />}</dd>
        </div>
      </dl>

      <p role="status" className="sr-only">
        {spoken}
      </p>
      {name ? (
        <>
          <input type="hidden" name={`${name}-net`} value={price?.net ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-vat`} value={price?.vat ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-gross`} value={price?.gross ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-rate`} value={currentRate} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}

/** A figure that is not there yet: a plain dash for the eye, words for a screen reader. */
function Blank({ label }: { label: string }) {
  return (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        -
      </span>
      <span className="sr-only">{label}</span>
    </>
  );
}
