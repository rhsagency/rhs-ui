"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps } from "react";

import { IconAlertCircle, IconArrowLeftRight, IconCheck, IconChevronsUpDown, IconLock } from "@rhs-ui/icons";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { trackPress, whenReleased } from "@rhs-ui/primitives/currency-exchange-field/blur-guard";
import {
  currencyDigits,
  currencyName,
  DEFAULT_CURRENCIES,
  DEFAULT_LABELS,
  feeOn,
  flatOf,
  formatAmount,
  formatMoneyText,
  limitOf,
  parseAmount,
  resolveValue,
  tidyTyping,
  writeRate,
  writeTime,
  type ExchangeLabels,
  type ExchangeLimit,
  type ExchangeValue,
  type FeeSource,
  type Leg,
  type Rates,
  type Side,
} from "@rhs-ui/primitives/currency-exchange-field/exchange";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { ExchangeFee, ExchangeLabels, ExchangeLimit, ExchangeValue, FeeSource, Leg, RateFunction, RateTable, Rates, Side } from "@rhs-ui/primitives/currency-exchange-field/exchange";

export interface CurrencyExchangeFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** Both amounts and the one that is fixed, when you control the field. Only the fixed amount and the two currencies are read: the other amount is always worked out from the rate. */
  value?: ExchangeValue;
  /** The amounts to start with, when you do not control the field. */
  defaultValue?: ExchangeValue;
  /**
   * Called whenever an amount, a currency or the rate changes, with both amounts in minor units (`{ send, receive, fixed }`)
   * and `valid` true once there is an amount to send, a rate, and the amount is inside `min` and `max`.
   */
  onValueChange?: (value: ExchangeValue, state: { valid: boolean }) => void;
  /** The rates: a table (`{ EUR: { USD: 1.0842 } }`, a missing pair is taken from the other way round) or a function `(from, to) => rate`. A new value is picked up at once, so live rates just work. */
  rates: Rates;
  /** The ISO codes in the two menus, in order. The first two are chosen at the start. Default: seven common ones. */
  currencies?: readonly string[];
  /**
   * What sending costs, taken off what is sent before the rate is applied: `{ percent, flat, label }`, or a function from what is sent to the fee in minor units. Shown in a row under the amounts.
   * `flat` follows the rule of `min` and `max`: a bare number is in the minor units of whichever currency is sent, so give one figure per currency code when several can be sent.
   */
  fee?: FeeSource;
  /** The locale that writes the amounts, names the currencies and decides the decimal sign. Default "en-US". */
  locale?: string;
  /** The lowest amount that can be sent. A bare number is in the minor units of whichever currency is sent (1000 is 10.00 in euros and 1,000 in yen), so give one figure per currency code when several can be sent. */
  min?: ExchangeLimit;
  /** The highest amount that can be sent, in minor units like `min`: a bare number, or one figure per currency code. */
  max?: ExchangeLimit;
  /** When the rates are from, as a Date, a timestamp or an ISO string: it is written as a time next to the rate ("updated 10:42"). */
  updatedAt?: Date | string | number;
  /** The time zone that time is written in. Default "UTC". */
  timeZone?: string;
  /** The field's name for a plain form submit: `<name>-send`, `<name>-send-currency`, `<name>-receive` and `<name>-receive-currency` go out in hidden inputs, the amounts in minor units. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<ExchangeLabels>;
}

const textOf = (leg: Leg, locale: string): string => (leg.minor === null ? "" : formatAmount(leg.minor, currencyDigits(leg.currency), locale));

/** The currency menu of one amount: a button that opens a searchable list. */
function CurrencyMenu({ side, value, currencies, onPick, locale, labels, disabled }: { side: Side; value: string; currencies: readonly string[]; onPick: (code: string) => void; locale: string; labels: ExchangeLabels; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const codes = currencies.includes(value) ? currencies : [value, ...currencies];
  // The list is only worked out while it is open: every name is a question to Intl.
  const options = open ? codes.map((code) => ({ code, name: currencyName(code, locale) })) : [];
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot={`currency-${side}`}
          disabled={disabled}
          aria-label={`${labels.currency} (${labels[side]}): ${currencyName(value, locale)} (${value})`}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-background pr-2.5 pl-3.5 text-sm font-medium tabular-nums shadow-xs outline-none transition-colors duration-150 hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none data-[state=open]:bg-muted motion-reduce:transition-none"
        >
          {value}
          <IconChevronsUpDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" collisionPadding={8} aria-label={labels.currency} className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden p-0">
        <Command loop className="rounded-none bg-transparent">
          <CommandInput placeholder={labels.search} aria-label={labels.search} />
          <CommandList>
            <CommandEmpty>{labels.empty}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.code}
                  value={option.code}
                  keywords={[option.name]}
                  onSelect={() => {
                    setOpen(false);
                    onPick(option.code);
                  }}
                  className="gap-3 pr-8"
                >
                  <span className="w-9 shrink-0 font-medium tabular-nums">{option.code}</span>
                  <span className="min-w-0 truncate text-muted-foreground">{option.name}</span>
                  {option.code === value ? (
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
  );
}

/**
 * Two amounts tied together by a rate: what you send and what they receive,
 * each with its own currency menu. Type in either and the other follows at the
 * rate you pass in, worked out on whole minor units in each currency's own
 * decimals and rounded the way money is, so a yen is never in hundredths and
 * the person at the other end is never a cent short. The amount that was typed
 * last is marked Fixed. A line between the two says the rate in words ("1 EUR =
 * 1.0842 USD, updated 10:42"), a fee passed in is taken off before the rate is
 * applied and shown in its own row, and what was worked out is told to a screen
 * reader once the typing pauses. The swap button exchanges the currencies and
 * keeps the amount sent; choosing the currency the other side already has does
 * the same. Stacked in a narrow space, side by side in a wide one. It reports
 * `{ send, receive, fixed }` in minor units.
 */
export function CurrencyExchangeField({
  value,
  defaultValue,
  onValueChange,
  rates,
  currencies = DEFAULT_CURRENCIES,
  fee,
  locale = "en-US",
  min,
  max,
  updatedAt,
  timeZone = "UTC",
  name,
  disabled = false,
  labels: labelOverrides,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ...props
}: CurrencyExchangeFieldProps) {
  const base = useId();
  const labels: ExchangeLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState<ExchangeValue>(
    () =>
      defaultValue ?? {
        send: { minor: null, currency: currencies[0] ?? "EUR" },
        receive: { minor: null, currency: currencies[1] ?? currencies[0] ?? "USD" },
        fixed: "send",
      },
  );
  const state = value ?? own;
  const { value: worked, rate } = resolveValue(state, rates, fee);
  // What is typed in the fixed amount. The other amount is never typed: it is the sum, written out.
  const [draft, setDraft] = useState(() => textOf(state[state.fixed], locale));
  const [synced, setSynced] = useState(value);
  const [showLimit, setShowLimit] = useState(false);
  const [turns, setTurns] = useState(0);
  const [said, setSaid] = useState("");
  const reported = useRef<ExchangeValue | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Amounts that arrive from outside replace what is typed; an echo of what was just reported changes nothing.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const before = reported.current;
    const same = before !== null && before.fixed === value.fixed && before[value.fixed].minor === value[value.fixed].minor && before[value.fixed].currency === value[value.fixed].currency;
    if (!same) setDraft(textOf(value[value.fixed], locale));
  }

  useEffect(trackPress, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const clear = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(clear);
  }, [said]);

  /** Why the amount sent cannot be used, in words, or null. */
  function problemOf(sent: Leg): string | null {
    if (sent.minor === null) return null;
    const lowest = limitOf(min, sent.currency);
    const highest = limitOf(max, sent.currency);
    if (lowest !== undefined && sent.minor < lowest) return labels.atLeast(formatMoneyText(lowest, sent.currency, locale));
    if (highest !== undefined && sent.minor > highest) return labels.atMost(formatMoneyText(highest, sent.currency, locale));
    return null;
  }

  function validOf(full: ExchangeValue, found: number | null): boolean {
    return found !== null && full.send.minor !== null && full.send.minor > 0 && full.receive.minor !== null && problemOf(full.send) === null;
  }

  /** Works out the amount that follows, reports both, and returns them. */
  function write(next: ExchangeValue): ExchangeValue {
    const result = resolveValue(next, rates, fee);
    reported.current = result.value;
    if (value === undefined) setOwn(result.value);
    onValueChange?.(result.value, { valid: validOf(result.value, result.rate) });
    return result.value;
  }

  function sayLater(text: string) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(text), 700);
  }

  function typeIn(side: Side, event: ChangeEvent<HTMLInputElement>) {
    const text = tidyTyping(event.target.value);
    const leg = state[side];
    const minor = parseAmount(text, currencyDigits(leg.currency), locale);
    setDraft(text);
    setSaid("");
    window.clearTimeout(timer.current);
    const full = write(side === "send" ? { ...state, fixed: side, send: { ...leg, minor } } : { ...state, fixed: side, receive: { ...leg, minor } });
    const other: Side = side === "send" ? "receive" : "send";
    const result = full[other];
    if (result.minor !== null) sayLater(labels.worked(labels[other], formatMoneyText(result.minor, result.currency, locale)));
  }

  /** The amount is left: it is written the locale's way, and a problem with the amount sent may now be said. */
  function settle(side: Side) {
    if (state.fixed === side) {
      const minor = parseAmount(draft, currencyDigits(state[side].currency), locale);
      setDraft(minor === null ? "" : formatAmount(minor, currencyDigits(state[side].currency), locale));
    }
    whenReleased(() => setShowLimit(true));
  }

  /** The currency of one side is changed. The amount that is fixed keeps the number in it, in the decimals of the new currency. */
  function pick(side: Side, code: string) {
    const other: Side = side === "send" ? "receive" : "send";
    if (code === state[side].currency) return;
    // Choosing what the other side already has would send and receive the same thing: the two currencies change places instead.
    if (code === state[other].currency) {
      swap();
      return;
    }
    const digits = currencyDigits(code);
    let leg: Leg = { ...state[side], currency: code };
    if (state.fixed === side) {
      const minor = parseAmount(draft, digits, locale);
      leg = { ...leg, minor };
      setDraft(minor === null ? "" : formatAmount(minor, digits, locale));
    }
    const full = write(side === "send" ? { ...state, send: leg } : { ...state, receive: leg });
    setShowLimit(true);
    const result = full[state.fixed === side ? other : side];
    if (result.minor !== null) setSaid(labels.worked(labels[state.fixed === side ? other : side], formatMoneyText(result.minor, result.currency, locale)));
  }

  /** The two currencies change places and the amount sent stays as a number. */
  function swap() {
    const sentText = state.fixed === "send" ? draft : textOf(worked.send, locale);
    const sendCurrency = state.receive.currency;
    const digits = currencyDigits(sendCurrency);
    const minor = parseAmount(sentText, digits, locale);
    setDraft(minor === null ? "" : formatAmount(minor, digits, locale));
    setTurns((count) => count + 1);
    const full = write({ send: { minor, currency: sendCurrency }, receive: { minor: null, currency: state.send.currency }, fixed: "send" });
    setSaid(labels.swapped(full.send.minor === null ? full.send.currency : formatMoneyText(full.send.minor, full.send.currency, locale), full.receive.minor === null ? full.receive.currency : formatMoneyText(full.receive.minor, full.receive.currency, locale)));
  }

  const fixedSide = state.fixed;
  const problem = showLimit ? problemOf(worked.send) : null;
  const when = updatedAt === undefined ? null : writeTime(updatedAt, locale, timeZone);
  const sentMinor = worked.send.minor;
  const feeMinor = fee !== undefined && sentMinor !== null ? feeOn(sentMinor, worked.send.currency, fee) : null;
  // What the fee is made of, when it is a share and a fixed part: "0.5% + 0.99".
  const parts: string[] = [];
  if (fee !== undefined && typeof fee === "object") {
    const flat = flatOf(fee, worked.send.currency);
    if (fee.percent) parts.push(`${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(fee.percent)}%`);
    if (flat) parts.push(formatMoneyText(flat, worked.send.currency, locale));
  }
  const makeup = parts.length > 1 || (parts.length === 1 && fee !== undefined && typeof fee === "object" && fee.percent) ? parts.join(" + ") : null;
  const rateText = rate === null ? null : labels.rate(worked.send.currency, worked.receive.currency, writeRate(rate, locale));
  const rateLine =
    rateText === null ? (
      <span className="flex items-center gap-1.5">
        <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
        {labels.noRate(worked.send.currency, worked.receive.currency)}
      </span>
    ) : (
      <span suppressHydrationWarning>
        <span className="font-medium text-foreground tabular-nums">{rateText}</span>
        {when ? <span>{`, ${labels.updated(when)}`}</span> : null}
      </span>
    );

  const card = (side: Side) => {
    const id = `${base}-${side}`;
    const leg = worked[side];
    const digits = currencyDigits(leg.currency);
    const isFixed = fixedSide === side;
    const flagged = side === "send" && problem !== null;
    return (
      <div
        className={cn(
          "grid grid-cols-1 gap-0.5 rounded-xl border bg-card px-4 py-3 shadow-xs @max-[17rem]:px-3 transition-[border-color,box-shadow] duration-150 has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40 motion-reduce:transition-none",
          flagged ? "border-destructive has-[input:focus-visible]:border-destructive has-[input:focus-visible]:ring-destructive/30" : "border-input",
          disabled && "opacity-50",
        )}
      >
        <div className="flex min-h-5 items-center justify-between gap-2">
          <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
            {labels[side]}
          </label>
          {isFixed ? (
            <span id={`${id}-fixed`} className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-muted-foreground">
              <IconLock aria-hidden="true" className="size-3" />
              {labels.fixed}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <input
            id={id}
            type="text"
            inputMode={digits === 0 ? "numeric" : "decimal"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={disabled}
            placeholder={formatAmount(0, digits, locale)}
            value={isFixed ? draft : textOf(leg, locale)}
            onChange={(event) => typeIn(side, event)}
            onBlur={() => settle(side)}
            aria-invalid={flagged || undefined}
            aria-describedby={[isFixed ? `${id}-fixed` : "", side === "send" ? `${base}-problem` : "", `${base}-rate`].filter(Boolean).join(" ")}
            className="h-11 w-0 min-w-0 flex-1 bg-transparent text-[1.625rem] font-medium @max-[17rem]:text-xl tracking-[-0.02em] tabular-nums outline-none placeholder:text-muted-foreground/50 disabled:cursor-not-allowed"
          />
          <CurrencyMenu side={side} value={leg.currency} currencies={currencies} onPick={(code) => pick(side, code)} locale={locale} labels={labels} disabled={disabled} />
        </div>
      </div>
    );
  };

  return (
    <div
      data-slot="currency-exchange-field"
      role="group"
      aria-label={labelledBy ? undefined : (ariaLabel ?? labels.group)}
      aria-labelledby={labelledBy}
      className={cn("@container w-full min-w-0", className)}
      {...props}
    >
      <div className="grid grid-cols-1 gap-y-2 @lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @lg:gap-x-3">
        <div className="grid min-w-0 grid-cols-1 content-start gap-1.5">
          {card("send")}
          <div id={`${base}-problem`} aria-live="polite">
            {problem ? (
              <p className="flex items-start gap-1.5 text-xs text-destructive">
                <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                {problem}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 px-1 @lg:flex-col @lg:justify-start @lg:px-0 @lg:pt-[2.3rem]">
          <button
            type="button"
            disabled={disabled}
            aria-label={labels.swap}
            onClick={swap}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-xs outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none"
          >
            <span className="grid rotate-90 place-items-center @lg:rotate-0">
              <IconArrowLeftRight aria-hidden="true" className="size-4 transition-[rotate] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none" style={{ rotate: `${turns * 180}deg` }} />
            </span>
          </button>
          <p id={`${base}-rate`} className="min-w-0 text-xs text-muted-foreground @lg:hidden">
            {rateLine}
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-1.5">{card("receive")}</div>
        <p className="hidden text-center text-xs text-muted-foreground @lg:col-span-3 @lg:block">{rateLine}</p>
      </div>
      {feeMinor !== null && fee !== undefined ? (
        <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>{typeof fee === "object" && fee.label ? fee.label : labels.fee}</span>
          <span className="tabular-nums" suppressHydrationWarning>
            <span className="font-medium text-foreground">{formatMoneyText(feeMinor, worked.send.currency, locale)}</span>
            {makeup ? ` (${makeup})` : ""}
          </span>
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? (
        <>
          <input type="hidden" name={`${name}-send`} value={worked.send.minor ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-send-currency`} value={worked.send.currency} disabled={disabled} />
          <input type="hidden" name={`${name}-receive`} value={worked.receive.minor ?? ""} disabled={disabled} />
          <input type="hidden" name={`${name}-receive-currency`} value={worked.receive.currency} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
