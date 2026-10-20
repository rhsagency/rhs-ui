import type { ComponentProps, ReactNode } from "react";

import { NumberTip } from "@rhs-ui/primitives/formatted-number/tip";
import { cn } from "@/lib/utils";

interface FormattedNumberBase extends Omit<ComponentProps<"data">, "value" | "children"> {
  /** The number. `null`, `undefined` and `NaN` show the placeholder instead. */
  value: number | null | undefined;
  /** `compact` writes 1,284,300 as 1.3M; the full number stays in the accessible name and the tooltip. */
  notation?: "standard" | "compact";
  /** At least this many digits after the decimal point. */
  minimumFractionDigits?: number;
  /** At most this many digits after the decimal point. */
  maximumFractionDigits?: number;
  /** Which signs are written. Negative numbers always use a true minus (U+2212), never a hyphen. */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /** Defaults to "en-US". Always pass the locale you render in, so the server and the browser agree. */
  locale?: string;
  /** Shown for a missing number. Defaults to an en dash, and screen readers hear "No value". */
  placeholder?: ReactNode;
  /** Show the full number in a tooltip when compact notation shortened it. On by default. It opens on hover and, with `focusable`, on keyboard focus; a tap or a click toggles it, so it works on a touch screen too. */
  tooltip?: boolean;
  /** Make a shortened figure a tab stop, so its full number opens on keyboard focus too. Off by default: a table of figures would otherwise add a tab stop to every cell. Needs the tooltip. */
  focusable?: boolean;
}

/**
 * What the number measures. A currency and a unit need the code they are
 * written in, so leaving it out is a type error and not a crash. Keep one in
 * your data to say how each figure is written, and spread it on the component.
 */
export type FormattedNumberKind =
  | {
      /** The Intl number style, named `format` because `style` already belongs to CSS. `decimal` is the default; `percent` takes a fraction: 0.124 is 12%. */
      format?: "decimal" | "percent";
      currency?: never;
      unit?: never;
      unitDisplay?: never;
    }
  | {
      /** A currency amount in major units: 12.5 is 12.50. */
      format: "currency";
      /** An ISO 4217 code such as "EUR". */
      currency: string;
      unit?: never;
      unitDisplay?: never;
    }
  | {
      /** A quantity with a unit. */
      format: "unit";
      /** An Intl unit such as "kilometer", "megabyte" or "kilometer-per-hour". */
      unit: string;
      /** How the unit is written: "5 MB" (short, the default), "5 megabytes" (long) or "5MB" (narrow). */
      unitDisplay?: "short" | "long" | "narrow";
      currency?: never;
    };

export type FormattedNumberProps = FormattedNumberBase & FormattedNumberKind;

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

const write = (format: Intl.NumberFormat, value: number) =>
  format
    .formatToParts(value)
    .map((part) => (part.type === "minusSign" ? MINUS : part.value))
    .join("");

interface Figures {
  /** The figure as it is shown. */
  shown: string;
  /** The same number in full, for the tooltip and the accessible name. */
  full: string;
}

function figures(value: number, locale: string, options: Intl.NumberFormatOptions, notation: "standard" | "compact", minimumFractionDigits: number | undefined, maximumFractionDigits: number | undefined): Figures {
  const shaped: Intl.NumberFormatOptions = { ...options, notation };
  if (minimumFractionDigits !== undefined || maximumFractionDigits !== undefined) {
    // Intl throws when the minimum is above the default maximum, so start from what it would have used.
    const base = numberFormat(locale, shaped).resolvedOptions();
    const min = minimumFractionDigits ?? Math.min(base.minimumFractionDigits ?? 0, maximumFractionDigits ?? Number.POSITIVE_INFINITY);
    shaped.minimumFractionDigits = min;
    shaped.maximumFractionDigits = Math.max(maximumFractionDigits ?? base.maximumFractionDigits ?? min, min);
  }
  const shown = write(numberFormat(locale, shaped), value);
  // The full figure is the standard notation at its own precision: what compact notation left out.
  const full = notation === "compact" ? write(numberFormat(locale, options), value) : shown;
  return { shown, full };
}

/**
 * A number written for the reader: compact (1.3M), percent, a unit or a
 * currency, in tabular figures so columns line up. It renders a `<data>`
 * element carrying the raw value. When compact notation shortens a figure the
 * full number stays in the accessible name and in a tooltip ("1,284,300") that
 * a hover, a tap or, with `focusable`, keyboard focus opens, so nothing is lost
 * for a screen reader or a phone. Negative numbers use a true minus, and a
 * missing number shows a placeholder. If Intl refuses the options (a currency
 * or unit code it does not know) the number is written as a plain decimal with
 * the code after it, never as a crash. It never animates, which makes it the
 * right choice for tables, lists and running text. Only the tooltip is a client
 * module, so a plain number stays a Server Component.
 */
export function FormattedNumber({
  value,
  notation = "standard",
  format = "decimal",
  currency,
  unit,
  unitDisplay,
  minimumFractionDigits,
  maximumFractionDigits,
  signDisplay = "auto",
  locale = "en-US",
  placeholder = "–",
  tooltip = true,
  focusable = false,
  className,
  ...props
}: FormattedNumberProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <data data-slot="formatted-number" data-empty="true" value="" className={cn("whitespace-nowrap text-muted-foreground", className)} {...props}>
        <span aria-hidden="true">{placeholder}</span>
        <span className="sr-only">No value</span>
      </data>
    );
  }

  const options: Intl.NumberFormatOptions = { style: format, signDisplay };
  if (format === "currency") options.currency = currency;
  if (format === "unit") {
    options.unit = unit;
    options.unitDisplay = unitDisplay ?? "short";
  }
  let result: Figures;
  try {
    result = figures(value, locale, options, notation, minimumFractionDigits, maximumFractionDigits);
  } catch {
    // Intl refused: a currency or unit it does not know, often straight from data. A plain number with its code beats a crashed page.
    const code = format === "currency" ? currency : format === "unit" ? unit : undefined;
    const plain = (figure: Figures): Figures => (code ? { shown: `${figure.shown} ${code}`, full: `${figure.full} ${code}` } : figure);
    try {
      result = plain(figures(value, locale, { style: "decimal", signDisplay }, notation, minimumFractionDigits, maximumFractionDigits));
    } catch {
      const bare = String(value).replace("-", MINUS);
      result = plain({ shown: bare, full: bare });
    }
  }
  const { shown, full } = result;
  const shortened = notation === "compact" && shown !== full;
  const tip = shortened && tooltip;

  const data = (
    <data
      data-slot="formatted-number"
      data-notation={notation}
      value={String(value)}
      className={cn("whitespace-nowrap tabular-nums", tip && "underline decoration-muted-foreground/60 decoration-dotted underline-offset-4", tip && focusable && "-mx-0.5 rounded-sm px-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
      {...props}
    >
      {shortened ? (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{full}</span>
        </>
      ) : (
        shown
      )}
    </data>
  );
  if (!tip) return data;
  return (
    <NumberTip content={full} focusable={focusable}>
      {data}
    </NumberTip>
  );
}
