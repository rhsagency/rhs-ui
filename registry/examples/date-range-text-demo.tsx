"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { DateRangeText, type DateRangeTextProps } from "@rhs-ui/primitives/date-range-text";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const LOCALES = [
  { value: "en-GB", label: "GB" },
  { value: "en-US", label: "US" },
  { value: "nl-NL", label: "NL" },
  { value: "de-DE", label: "DE" },
  { value: "fr-FR", label: "FR" },
] as const;

type Labels = NonNullable<DateRangeTextProps["labels"]>;

/** Words Intl has no name for: the open ends and the nights of a stay. */
const WORDS: Record<string, Labels> = {
  "en-GB": {},
  "en-US": {},
  "nl-NL": { from: "vanaf", until: "tot", nights: (count) => (count === 1 ? "1 nacht" : `${count} nachten`) },
  "de-DE": { from: "ab", until: "bis", nights: (count) => (count === 1 ? "1 Nacht" : `${count} Nächte`) },
  "fr-FR": { from: "dès le", until: "jusqu’au", nights: (count) => `${count} nuit${count > 1 ? "s" : ""}` },
  "es-ES": { from: "desde el", until: "hasta el", nights: (count) => (count === 1 ? "1 noche" : `${count} noches`) },
};

const LANGUAGES = [
  { locale: "en-GB", name: "English" },
  { locale: "en-US", name: "English (US)" },
  { locale: "nl-NL", name: "Nederlands" },
  { locale: "de-DE", name: "Deutsch" },
  { locale: "fr-FR", name: "Français" },
  { locale: "es-ES", name: "Español" },
] as const;

export default function Demo(): React.JSX.Element {
  const [locale, setLocale] = useState<string>("en-GB");
  const common = { locale, labels: WORDS[locale] } as const;
  const rows: readonly (readonly [string, ReactNode])[] = [
    ["A stay", <DateRangeText key="stay" start="2026-03-12" end="2026-03-15" nights {...common} />],
    ["Across a month", <DateRangeText key="month" start="2026-02-28" end="2026-03-03" {...common} />],
    ["Across a year", <DateRangeText key="year" start="2026-12-30" end="2027-01-02" {...common} />],
    ["A single day", <DateRangeText key="day" start="2026-03-12" end="2026-03-12" {...common} />],
    ["A meeting", <DateRangeText key="meeting" start="2026-03-12T09:00:00Z" end="2026-03-12T10:30:00Z" timeZone="Europe/Amsterdam" includeTime year={false} {...common} />],
    ["A workshop", <DateRangeText key="workshop" start="2026-03-12T08:00:00Z" end="2026-03-14T16:00:00Z" timeZone="Europe/Amsterdam" includeTime {...common} />],
    ["Short, with weekdays", <DateRangeText key="short" start="2026-03-12" end="2026-03-15" month="short" weekday {...common} />],
    ["Without the year", <DateRangeText key="no-year" start="2026-06-18" end="2026-06-21" year={false} {...common} />],
    ["Starts, no end yet", <DateRangeText key="from" start="2026-04-14" {...common} />],
    ["Ends, no start", <DateRangeText key="until" end="2026-06-30" {...common} />],
    ["No dates yet", <DateRangeText key="none" {...common} />],
  ];

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Pick a language: the order, the shared month and the year follow it. Times are written in Europe/Amsterdam">
        <div className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <SegmentedControl label="Language" value={locale} onValueChange={setLocale} options={LOCALES} className="w-fit" />
          <dl className="divide-y divide-border text-sm">
            {rows.map(([term, value]) => (
              <div key={term} className="grid gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="text-muted-foreground">{term}</dt>
                <dd className="min-w-0 font-medium" lang={locale}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Example>

      <Example caption="One stay in six languages, written by Intl: no table of formats to keep">
        <ul className="max-w-xl divide-y divide-border rounded-xl border border-border bg-card px-4 text-sm shadow-xs sm:px-5">
          {LANGUAGES.map((language) => (
            <li key={language.locale} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
              <span className="text-muted-foreground">{language.name}</span>
              <span className="min-w-0 font-medium" lang={language.locale}>
                <DateRangeText start="2026-11-06" end="2026-11-09" nights locale={language.locale} labels={WORDS[language.locale]} />
              </span>
            </li>
          ))}
        </ul>
      </Example>
    </div>
  );
}
