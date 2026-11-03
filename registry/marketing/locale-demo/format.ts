import type { LocaleMessages } from "@rhs-ui/marketing/locale-demo/messages";

export interface LocaleSample {
  /** The amount of the price row. */
  amount: number;
  /** The currency of the price row, as an ISO 4217 code: "EUR". */
  currency: string;
  /** The moment of the date row, as an ISO 8601 instant: "2026-11-02T14:30:00Z". It is shown in the time zone you pass, with its time. */
  date: string;
  /** The count of the plural row: 3 reads "3 items", and in Arabic, with its own form for few, "٣ عناصر". */
  count: number;
  /** The figure of the number row, shown with the grouping and decimal marks of the locale. It is the amount when left out. */
  number?: number;
  /** How many days from now the relative time row says: -3 reads "3 days ago", 3 reads "in 3 days". It is -3 when left out. */
  days?: number;
}

export interface LocaleRow {
  /** Which of the five rows this is. */
  id: "price" | "date" | "number" | "relative" | "plural";
  /** The row's label, in the language of the card. */
  label: string;
  /** The value, formatted for the locale. */
  value: string;
  /** What the value was made from, in a form that does not change with the locale. */
  raw: string;
}

/** Languages written from right to left. The card turns around for these. */
const RIGHT_TO_LEFT = new Set(["ar", "he", "fa", "ur", "ps", "sd", "ug", "yi", "dv", "ckb"]);

export function isRightToLeft(code: string): boolean {
  return RIGHT_TO_LEFT.has((code.split("-")[0] ?? "").toLowerCase());
}

/**
 * The five rows of the card for one locale. Every value comes from the browser's own Intl: a price from
 * NumberFormat with a currency, a date from DateTimeFormat in the time zone you give, a number from
 * NumberFormat, a relative time from RelativeTimeFormat and a count from PluralRules, which picks the word
 * form. Nothing here depends on the reader's own locale or time zone, so the server and the browser agree.
 */
export function formatRows(code: string, sample: LocaleSample, timeZone: string, messages: LocaleMessages): LocaleRow[] {
  const days = sample.days ?? -3;
  const figure = sample.number ?? sample.amount;
  const moment = new Date(sample.date);
  const form = new Intl.PluralRules(code).select(sample.count);
  const template = messages.items[form] ?? messages.items.other;
  return [
    {
      id: "price",
      label: messages.price,
      value: new Intl.NumberFormat(code, { style: "currency", currency: sample.currency }).format(sample.amount),
      raw: `${sample.amount} ${sample.currency}`,
    },
    {
      id: "date",
      label: messages.date,
      value: Number.isNaN(moment.getTime()) ? sample.date : new Intl.DateTimeFormat(code, { dateStyle: "long", timeStyle: "short", timeZone }).format(moment),
      raw: `${sample.date} in ${timeZone}`,
    },
    {
      id: "number",
      label: messages.number,
      value: new Intl.NumberFormat(code, { maximumFractionDigits: 3 }).format(figure),
      raw: String(figure),
    },
    {
      id: "relative",
      label: messages.relative,
      value: new Intl.RelativeTimeFormat(code, { numeric: "always" }).format(days, "day"),
      raw: `${days} day`,
    },
    {
      id: "plural",
      label: messages.plural,
      value: template.replace("{count}", new Intl.NumberFormat(code).format(sample.count)),
      raw: `${sample.count} → ${form}`,
    },
  ];
}
