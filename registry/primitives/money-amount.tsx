import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export type MoneyDirection = "credit" | "debit" | "refund" | "auto";

export interface MoneyAmountProps extends Omit<ComponentProps<"data">, "value" | "children"> {
  /** An integer in the currency's minor units: 1250 is 12.50 EUR, while 1250 JPY is 1,250 yen because yen has no minor unit. A fraction is rounded to the nearest minor unit, away from zero. */
  amount: number;
  /** ISO 4217 code: "EUR", "USD", "JPY". A code Intl rejects is written as plain digits followed by the code, so one bad value from an API never takes the page down. */
  currency: string;
  /** Defaults to "en-US". Always pass the locale you render in, so the server and the browser agree. */
  locale?: string;
  /** Which signs are written. The default writes a plus for money in, a true minus for money out and nothing for zero. */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /**
   * What the amount is. `credit` is money received (plus sign, semibold), `debit`
   * money spent (true minus, regular), `refund` money given back (plus sign,
   * medium). `auto` reads the sign of `amount`. Explicit directions take the
   * size of the amount and ignore its sign, so you can keep magnitudes in your data.
   */
  direction?: MoneyDirection;
  /** Write the currency symbol. Turn it off in a column whose header already says EUR. */
  showCurrency?: boolean;
  /** The words screen readers hear before the amount; translate them here. */
  labels?: { credit?: string; debit?: string; refund?: string };
}

type Kind = "credit" | "debit" | "refund" | "even";

const WEIGHT: Record<Kind, string> = { credit: "font-semibold", debit: "font-normal", refund: "font-medium", even: "font-normal" };
const WORDS = { credit: "Received", debit: "Spent", refund: "Refunded" } as const;
const MINUS = "−";

const cache = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    cache.set(key, format);
  }
  return format;
}

interface Figures {
  /** What is written: "+€12.50". */
  written: string;
  /** What a screen reader hears after the word: "€12.50". */
  spoken: string;
}

function figures(minor: number, kind: Kind, currency: string, locale: string, signDisplay: NonNullable<MoneyAmountProps["signDisplay"]>, showCurrency: boolean): Figures {
  try {
    const digits = numberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    const major = Math.abs(minor) / 10 ** digits;
    const signed = kind === "even" ? 0 : kind === "debit" ? -major : major;
    const options: Intl.NumberFormatOptions = showCurrency ? { style: "currency", currency } : { style: "decimal", minimumFractionDigits: digits, maximumFractionDigits: digits };
    const written = numberFormat(locale, { ...options, signDisplay })
      .formatToParts(signed)
      .map((part) => (part.type === "minusSign" ? MINUS : part.value))
      .join("");
    return { written, spoken: numberFormat(locale, { ...options, signDisplay: "never" }).format(major) };
  } catch {
    // Intl does not know this currency (a typo, or a bad code from an API): write the digits and the code as they came.
    const digits = (Math.abs(minor) / 100).toFixed(2);
    const positive = kind === "credit" || kind === "refund";
    const sign = signDisplay === "never" ? "" : kind === "debit" ? MINUS : signDisplay === "always" ? "+" : signDisplay === "exceptZero" && positive ? "+" : "";
    const code = showCurrency && currency ? ` ${currency}` : "";
    return { written: `${sign}${digits}${code}`, spoken: `${digits}${code}` };
  }
}

/**
 * An amount of money for statements and ledgers: the currency, a sign that
 * means something and a word for screen readers. A credit carries a plus and
 * is heard as "received", a debit carries a true minus (U+2212, not a hyphen)
 * and is "spent", a refund is "refunded". Meaning lives in the sign and the
 * weight, never in red and green. The amount is in minor units and Intl knows
 * how many a currency has, so yen and dinar work; a currency code Intl rejects
 * falls back to plain digits and the code, never to a crash. It renders a
 * `<data>` element holding the raw minor-unit value, in tabular figures, so
 * tests and scripts can read it directly.
 */
export function MoneyAmount({ amount, currency, locale = "en-US", signDisplay = "exceptZero", direction = "auto", showCurrency = true, labels, className, ...props }: MoneyAmountProps) {
  // Minor units are whole numbers. Rounding here, away from zero like Intl, keeps the figure, the sign and the data value in step.
  const minor = Math.sign(amount) * Math.round(Math.abs(amount));
  const kind: Kind = minor === 0 ? "even" : direction === "auto" ? (minor > 0 ? "credit" : "debit") : direction;
  const { written, spoken } = figures(minor, kind, currency, locale, signDisplay, showCurrency);
  const word = kind === "even" ? "" : (labels?.[kind] ?? WORDS[kind]);

  return (
    <data data-slot="money-amount" data-direction={kind} value={String(minor)} className={cn("whitespace-nowrap tabular-nums", WEIGHT[kind], className)} {...props}>
      <span aria-hidden="true">{written}</span>
      <span className="sr-only">{word ? `${word} ${spoken}` : spoken}</span>
    </data>
  );
}
