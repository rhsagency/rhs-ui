"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconCheck, IconChevronsUpDown } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import {
  currencyDigits,
  currencyName,
  currencySymbol,
  DEFAULT_CURRENCIES,
  DEFAULT_LABELS,
  formatAmount,
  formatMoneyText,
  parseAmount,
  rescale,
  tidyTyping,
  type MultiCurrencyLabels,
} from "@rhs-ui/primitives/multi-currency-field/amounts";
import { trackPress, whenReleased } from "@rhs-ui/primitives/multi-currency-field/blur-guard";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { MultiCurrencyLabels } from "@rhs-ui/primitives/multi-currency-field/amounts";

/** An amount and the currency it is in. */
export interface MultiCurrencyValue {
  /** The amount in minor units, as a whole number: 1250 is 12.50 in euros and 1,250 in yen. Null while the field is empty or holds no amount. */
  minor: number | null;
  /** The ISO 4217 code: "EUR", "JPY". */
  currency: string;
}

/** One limit for every currency, or one per currency code. Either way in minor units of the currency that is chosen. */
export type MultiCurrencyLimit = number | Readonly<Record<string, number>>;

export interface MultiCurrencyFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "name" | "inputMode" | "role" | "list" | "children"> {
  /** The amount and currency, when you control them. */
  value?: MultiCurrencyValue;
  /** The amount and currency to start with, when you do not control them. */
  defaultValue?: MultiCurrencyValue;
  /** Called on every change of the amount and when the currency changes, with `valid` true once there is an amount that is allowed. */
  onValueChange?: (value: MultiCurrencyValue, state: { valid: boolean }) => void;
  /** The ISO codes in the menu, in order. The first is chosen at the start. Default: eleven common ones. With a single code there is no menu, only the code. */
  currencies?: readonly string[];
  /** The locale that writes the amount, the names of the currencies and the decimal sign. Default "en-US". */
  locale?: string;
  /** The lowest amount allowed, in minor units, or one per currency code: `{ EUR: 500, JPY: 500 }`. */
  min?: MultiCurrencyLimit;
  /** The highest amount allowed, in minor units, or one per currency code. */
  max?: MultiCurrencyLimit;
  /** Accept a minus sign. Default false. */
  allowNegative?: boolean;
  /** The field's name for a plain form submit. The amount goes out in minor units, and the currency in a second hidden input named `<name>-currency`. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<MultiCurrencyLabels>;
}

const limitOf = (limit: MultiCurrencyLimit | undefined, currency: string): number | undefined => (typeof limit === "number" ? limit : limit?.[currency]);

// The group takes the focus ring when its input has focus; the currency menu is a button, so it asks for the same ring. An invalid amount keeps its error colour through both.
const RING_ON_MENU = "has-[[data-slot=currency-trigger]:focus-visible]:border-ring has-[[data-slot=currency-trigger]:focus-visible]:ring-[3px] has-[[data-slot=currency-trigger]:focus-visible]:ring-ring/40";
const STAYS_RED =
  "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30 has-[[aria-invalid=true]]:has-[[data-slot=currency-trigger]:focus-visible]:border-destructive has-[[aria-invalid=true]]:has-[[data-slot=currency-trigger]:focus-visible]:ring-destructive/30";

const TAB = "flex h-full shrink-0 items-center gap-1.5 rounded-r-[inherit] border-l border-border bg-muted/50 pr-2.5 pl-3 text-[0.8125rem] font-medium tabular-nums transition-colors duration-150";

/**
 * An amount and its currency in one field. Pick the currency from a menu you
 * can search ("yen" finds JPY) and the decimals follow it: euros have two,
 * yen none, Kuwaiti dinars three, asked of Intl so the list never goes stale.
 * `onValueChange` reports `{ minor, currency }` with `minor` a whole number, so
 * a yen is never reported in hundredths. Type "12,5" or "12.5" (the locale's
 * sign or the other one, "1.250,00" and "1,250.00" alike) and the amount is
 * written the locale's way when the field is left. Changing the currency keeps
 * the number you typed, works out the minor value again, and tells a screen
 * reader what the amount is now, rounding included. An amount outside `min` and
 * `max` is explained in words, with the limit written in the chosen currency.
 * When one currency with two decimals is all you need, Currency input is the
 * lighter choice.
 */
export function MultiCurrencyField({
  value,
  defaultValue,
  onValueChange,
  currencies = DEFAULT_CURRENCIES,
  locale = "en-US",
  min,
  max,
  allowNegative = false,
  name,
  labels: labelOverrides,
  form,
  disabled,
  placeholder,
  className,
  onBlur,
  ref,
  "aria-describedby": describedBy,
  ...props
}: MultiCurrencyFieldProps) {
  const base = useId();
  const messageId = `${base}-message`;
  const unitId = `${base}-unit`;
  const labels: MultiCurrencyLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [ownCurrency, setOwnCurrency] = useState(() => (value ?? defaultValue)?.currency ?? currencies[0] ?? "EUR");
  const currency = value?.currency ?? ownCurrency;
  const digits = currencyDigits(currency);
  const [draft, setDraft] = useState(() => {
    const start = value ?? defaultValue;
    return !start || start.minor === null ? "" : formatAmount(start.minor, currencyDigits(start.currency), locale);
  });
  const [synced, setSynced] = useState(value);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  // A currency that was just chosen hands the focus on to the amount; a menu that was dismissed gives it back to its button.
  const picked = useRef(false);
  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // An amount that arrives from outside replaces what is typed, unless it is only what the typing already means.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const nextDigits = currencyDigits(value.currency);
    if (value.minor !== parseAmount(draft, nextDigits, locale)) setDraft(value.minor === null ? "" : formatAmount(value.minor, nextDigits, locale));
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  /** What is wrong with this text as an amount in this currency, in words, or null. An empty field is not wrong: a form says what is required. */
  function problemOf(text: string, minor: number | null, code: string): string | null {
    if (!text.trim()) return null;
    const places = currencyDigits(code);
    if (minor === null) return labels.notAnAmount(formatAmount(125000, places, locale));
    if (minor < 0 && !allowNegative) return labels.negative;
    const lowest = limitOf(min, code);
    const highest = limitOf(max, code);
    if (lowest !== undefined && minor < lowest) return labels.tooLow(formatMoneyText(lowest, code, places, locale));
    if (highest !== undefined && minor > highest) return labels.tooHigh(formatMoneyText(highest, code, places, locale));
    return null;
  }

  function report(minor: number | null, code: string, text: string) {
    onValueChange?.({ minor, currency: code }, { valid: minor !== null && problemOf(text, minor, code) === null });
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value);
    const minor = parseAmount(text, digits, locale);
    setDraft(text);
    setSaid("");
    // A message that is already showing follows the typing and goes as soon as the amount is right. A new one waits for the field to be left.
    setError((now) => (now === null ? null : problemOf(text, minor, currency)));
    report(minor, currency, text);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    const minor = parseAmount(draft, digits, locale);
    const text = minor === null ? draft : formatAmount(minor, digits, locale);
    if (text !== draft) setDraft(text);
    whenReleased(() => setError(problemOf(text, minor, currency)));
  }

  function pick(next: string) {
    picked.current = true;
    setOpen(false);
    if (next === currency) return;
    const nextDigits = currencyDigits(next);
    const minor = parseAmount(draft, digits, locale);
    // The number stays and the minor value is worked out again: 12.50 is 13 in yen, 1,250 yen is 1,250.00 in euros.
    const nextMinor = minor === null ? null : rescale(minor, digits, nextDigits);
    const text = nextMinor === null ? draft : formatAmount(nextMinor, nextDigits, locale);
    // Choosing a currency is a decision, not typing: if the same number no longer fits the limits (129.00 euros become 129 yen, under a minimum of 500), that is said now and not when the field is left.
    const problem = problemOf(text, nextMinor, next);
    if (value === undefined) setOwnCurrency(next);
    setDraft(text);
    setError(problem);
    const changed = labels.changed(currencyName(next, locale), nextMinor === null ? null : formatMoneyText(nextMinor, next, nextDigits, locale));
    setSaid(problem ? `${changed} ${problem}` : changed);
    report(nextMinor, next, text);
  }

  const minorNow = parseAmount(draft, digits, locale);
  const longName = currencyName(currency, locale);
  const sign = currencySymbol(currency, locale);
  const codes = currencies.includes(currency) ? currencies : [currency, ...currencies];
  // The list is only worked out while it is open: every name is a question to Intl.
  const options = open ? codes.map((code) => ({ code, name: currencyName(code, locale) })) : [];

  return (
    <div data-slot="multi-currency-field" className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <InputGroup className={cn(RING_ON_MENU, STAYS_RED)}>
            {sign !== currency ? (
              <InputGroupAddon aria-hidden="true" className="pr-0">
                {sign}
              </InputGroupAddon>
            ) : null}
            <InputGroupInput
              ref={attach}
              type="text"
              // The number pads have no minus: where a negative amount is allowed the full keyboard is the only way to type one.
              inputMode={allowNegative ? "text" : digits === 0 ? "numeric" : "decimal"}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              form={form}
              disabled={disabled}
              placeholder={placeholder ?? formatAmount(0, digits, locale)}
              {...props}
              aria-label={props.id === undefined && props["aria-label"] === undefined && props["aria-labelledby"] === undefined ? labels.amount : props["aria-label"]}
              value={draft}
              onChange={change}
              onBlur={leave}
              aria-invalid={error ? true : undefined}
              aria-describedby={[describedBy, unitId, messageId].filter(Boolean).join(" ")}
              className={cn("tabular-nums", sign !== currency && "pl-1.5")}
            />
            {codes.length > 1 ? (
              <PopoverTrigger asChild>
                <button
                  type="button"
                  data-slot="currency-trigger"
                  disabled={disabled}
                  aria-label={`${labels.currency}: ${longName} (${currency})`}
                  className={cn(TAB, "text-foreground outline-none hover:bg-muted focus-visible:bg-muted data-[state=open]:bg-muted disabled:pointer-events-none")}
                >
                  {currency}
                  <IconChevronsUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
            ) : (
              <span data-slot="currency-label" aria-hidden="true" className={cn(TAB, "pr-3 text-muted-foreground")}>
                {currency}
              </span>
            )}
          </InputGroup>
        </PopoverAnchor>
        <PopoverContent
          align="end"
          collisionPadding={8}
          aria-label={labels.currency}
          className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden p-0"
          onCloseAutoFocus={(event) => {
            if (picked.current) {
              event.preventDefault();
              input.current?.focus();
            }
            picked.current = false;
          }}
        >
          <Command loop className="rounded-none bg-transparent">
            <CommandInput placeholder={labels.search} aria-label={labels.search} />
            <CommandList>
              <CommandEmpty>{labels.empty}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem key={option.code} value={option.code} keywords={[option.name]} onSelect={() => pick(option.code)} className="gap-3 pr-8">
                    <span className="w-9 shrink-0 font-medium tabular-nums">{option.code}</span>
                    <span className="min-w-0 truncate text-muted-foreground">{option.name}</span>
                    {option.code === currency ? (
                      <>
                        <IconCheck size={14} className="absolute right-2 text-foreground" />
                        <span className="sr-only">, selected</span>
                      </>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <span id={unitId} className="sr-only">
        {labels.unit(longName, currency, digits)}
      </span>
      <div id={messageId} aria-live="polite">
        {error ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? (
        <>
          <input type="hidden" name={name} form={form} value={minorNow ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-currency`} form={form} value={currency} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
