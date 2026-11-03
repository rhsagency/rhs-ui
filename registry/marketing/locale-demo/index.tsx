"use client";

import { useState, type ComponentProps } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { formatRows, isRightToLeft, type LocaleSample } from "@rhs-ui/marketing/locale-demo/format";
import { DEFAULT_LOCALES, messagesFor, type LocaleOption } from "@rhs-ui/marketing/locale-demo/messages";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export type { LocaleSample } from "@rhs-ui/marketing/locale-demo/format";
export type { LocaleMessages, LocaleOption } from "@rhs-ui/marketing/locale-demo/messages";

export interface LocaleDemoLabels {
  /** The name of the language switch for assistive technology. */
  switchLabel: string;
  /** Said politely when the switch changes. {label} stands for the language picked. */
  showing: string;
  /** Under a language that is written from left to right. */
  ltr: string;
  /** Under a language that is written from right to left. */
  rtl: string;
  /** The note under the card. */
  note: string;
}

export interface LocaleDemoProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue"> {
  /** The small line over the heading: "Localisation". */
  eyebrow?: string;
  /** The heading. It also names the section for assistive technology. */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** The languages in the switch. English, Dutch, German, Japanese and Arabic by default: they differ in grouping, decimal marks, symbols, date order, digits, plural forms and direction. A language without built-in words falls back to English for the row labels, so pass `messages` with it; the values are always the locale's own. */
  locales?: readonly LocaleOption[];
  /** The one price, date, number and count the card is made from. */
  sample: LocaleSample;
  /** The locale shown, when you control it. */
  locale?: string;
  /** The locale shown first, when you do not. The first of `locales` by default. */
  defaultLocale?: string;
  /** Called with the code of the locale that has been picked. */
  onLocaleChange?: (code: string) => void;
  /** The time zone the date is shown in. UTC by default, so the server and the browser agree. */
  timeZone?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LocaleDemoLabels>;
}

const LABELS: LocaleDemoLabels = {
  switchLabel: "Language",
  showing: "Showing {label}",
  ltr: "Left to right",
  rtl: "Right to left",
  note: "Every value on the card is made by the browser's own Intl API: no library, and no table of formats to keep up to date.",
};

/**
 * Localisation shown instead of claimed. A switch of languages sits above one
 * sample card, and the card is made from a single price, date, number and
 * count: pick a language and every value takes the shape of that market,
 * from the position of the currency symbol and the grouping marks to the
 * order of the date, the digits of Arabic and the plural forms of each
 * language. Under each value, in a small caption, is the raw value it was
 * made from, so it is clear nothing was typed by hand. The card turns around
 * for languages written from right to left, and changing the language is
 * announced as "Showing Deutsch". Values come from Intl.NumberFormat,
 * DateTimeFormat, RelativeTimeFormat and PluralRules with an explicit locale
 * and time zone, so the server and the browser agree. For i18n tools,
 * commerce platforms and any product that sells across borders.
 */
export function LocaleDemo({
  eyebrow,
  title,
  description,
  headingLevel = 2,
  locales = DEFAULT_LOCALES,
  sample,
  locale,
  defaultLocale,
  onLocaleChange,
  timeZone = "UTC",
  labels: custom,
  className,
  ...props
}: LocaleDemoProps) {
  const labels = { ...LABELS, ...custom };
  const [inner, setInner] = useState(defaultLocale ?? locales[0]?.code ?? "en-US");
  // Said only once the switch has been used: a first render that announces itself is noise.
  const [said, setSaid] = useState("");
  const code = locale ?? inner;
  const current = locales.find((option) => option.code === code) ?? locales[0];
  if (!current) return null;

  const rows = formatRows(current.code, sample, timeZone, messagesFor(current));
  const rtl = isRightToLeft(current.code);

  const choose = (next: string) => {
    const option = locales.find((item) => item.code === next);
    if (!option) return;
    if (locale === undefined) setInner(next);
    setSaid(labels.showing.replace("{label}", option.label));
    onLocaleChange?.(next);
  };

  return (
    <section data-slot="locale-demo" aria-label={title} className={cn("w-full break-words", className)} {...props}>
      <SectionHeading align="center" eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <div className="mt-8 flex justify-center sm:mt-10">
        {/* On a phone the options wrap, and wrap evenly: every option has one width (a third of the row, or 6rem where a third would be too narrow for the longest name), so both rows line up and the short row is centred. From sm up they sit in one row. */}
        <SegmentedControl
          label={labels.switchLabel}
          options={locales.map((option) => ({ value: option.code, label: option.label }))}
          value={current.code}
          onValueChange={choose}
          className="w-full flex-wrap justify-center sm:w-auto sm:flex-nowrap max-sm:[&>button]:flex-none max-sm:[&>button]:basis-[max(6rem,calc((100%_-_0.5rem)_/_3))] max-sm:[&>button]:px-2"
        />
      </div>

      <Card dir={rtl ? "rtl" : "ltr"} lang={current.code} data-slot="locale-demo-card" className="mx-auto mt-6 w-full max-w-2xl gap-0 overflow-hidden py-0">
        <CardHeader className="border-b border-border py-5">
          <CardTitle className="text-lg tracking-[-0.02em]">{current.label}</CardTitle>
          <CardDescription>{rtl ? labels.rtl : labels.ltr}</CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-mono">
              <bdi dir="ltr">{current.code}</bdi>
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          {/* Keyed on the locale, so the new values fade in rather than change under the reader's eye. */}
          <dl key={current.code} className="divide-y divide-border transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none">
            {rows.map((row) => (
              <div key={row.id} className="grid gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:px-6">
                <dt className="text-sm text-muted-foreground">{row.label}</dt>
                {/* Every row has the same shape: the value, then under it the raw value it was made from. */}
                <dd className="min-w-0">
                  <span className="block text-xl leading-snug font-medium tracking-[-0.02em] text-balance tabular-nums">{row.value}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    <bdi dir="ltr" className="font-mono">
                      {row.raw}
                    </bdi>
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <p className="mx-auto mt-5 max-w-xl text-center text-sm text-pretty text-muted-foreground">{labels.note}</p>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </section>
  );
}
