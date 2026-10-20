"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { IconAlertCircle, IconCheckCircle } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { CountrySelect } from "@rhs-ui/primitives/country-select";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Switch } from "@rhs-ui/primitives/switch";
import {
  DEFAULT_LANGUAGES,
  DEFAULT_TIME_ZONES,
  SAMPLE_MOMENT,
  cityOf,
  formatDate,
  formatNumber,
  formatOffset,
  formatTime,
  localeTag,
  offsetMinutes,
  weekdayNames,
  zoneOptions,
  type DateOrder,
  type FirstDay,
  type LanguageOption,
  type LanguageRegionValue,
} from "@rhs-ui/application/language-region-section/format";
import { cn } from "@/lib/utils";

export type { DateOrder, FirstDay, LanguageOption, LanguageRegionValue } from "@rhs-ui/application/language-region-section/format";

export interface LanguageRegionSectionProps {
  /** The saved setting. The draft lives inside until Save; pass the new value back after onSave. */
  value: LanguageRegionValue;
  /** The languages on offer, each written in its own name. */
  languages?: readonly LanguageOption[];
  /** IANA time zone ids to choose from, grouped by their offset. */
  timeZones?: readonly string[];
  /** Called with the draft when Save is pressed. May return a promise; the button shows it is working. */
  onSave: (value: LanguageRegionValue) => void | Promise<void>;
  /** Locale of this card itself: the language the country names are written in. */
  locale?: string;
  /** The moment the preview is formatted at. Fixed by default so server and browser print the same text; pass new Date() on the client for the real time. */
  sampleDate?: Date | string;
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

const ORDERS: readonly { value: DateOrder; label: string }[] = [
  { value: "dmy", label: "Day, month, year" },
  { value: "mdy", label: "Month, day, year" },
  { value: "ymd", label: "Year, month, day" },
];

const FIRST_DAYS = [
  { value: "monday", label: "Monday" },
  { value: "sunday", label: "Sunday" },
  { value: "saturday", label: "Saturday" },
] as const;

const FIRST_DAY_NAME: Record<FirstDay, string> = { monday: "Monday", sunday: "Sunday", saturday: "Saturday" };

/**
 * Language, country, time zone and the formats that go with them, in one
 * card: a combobox for each language in its own name, the country, a
 * searchable time zone list grouped by offset, the order of day, month and
 * year, the first day of the week and a 24-hour switch. A preview under the
 * fields is formatted with Intl from the draft, always with a time zone, so
 * the effect of a change is seen before it is saved. Save lights up only when
 * something changed, and a polite status line says Saved.
 */
export function LanguageRegionSection({
  value,
  languages = DEFAULT_LANGUAGES,
  timeZones = DEFAULT_TIME_ZONES,
  onSave,
  locale = "en-US",
  sampleDate = SAMPLE_MOMENT,
  title = "Language and region",
  description = "Set the language you read in and the formats you expect, so dates, times and numbers read the way you write them.",
  headingLevel = 2,
  className,
}: LanguageRegionSectionProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const incoming = JSON.stringify(value);
  const [seen, setSeen] = useState(incoming);
  const [baseline, setBaseline] = useState(value);
  const [draft, setDraft] = useState(value);
  const [phase, setPhase] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveButton = useRef<HTMLButtonElement>(null);
  const statusLine = useRef<HTMLParagraphElement>(null);
  const focusAfterSave = useRef<"save" | "status" | null>(null);

  // A new saved value from outside replaces the draft.
  if (incoming !== seen) {
    setSeen(incoming);
    setBaseline(value);
    setDraft(value);
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const stamp = typeof sampleDate === "string" ? sampleDate : sampleDate.getTime();
  const at = useMemo(() => {
    const date = new Date(stamp);
    return Number.isNaN(date.getTime()) ? new Date(SAMPLE_MOMENT) : date;
  }, [stamp]);

  const languageOptions = useMemo<ComboboxOption[]>(() => {
    const list = languages.some((item) => item.code === draft.language) ? languages : [...languages, { code: draft.language, name: draft.language }];
    return list.map((item) => ({
      value: item.code,
      label: item.name,
      description: item.english && item.english !== item.name ? item.english : undefined,
      keywords: [item.code, ...(item.english ? [item.english] : [])],
    }));
  }, [languages, draft.language]);

  const zoneChoices = useMemo(() => zoneOptions(timeZones.includes(draft.timeZone) ? timeZones : [...timeZones, draft.timeZone], at), [timeZones, draft.timeZone, at]);

  const zone = offsetMinutes(draft.timeZone, at) === null ? "UTC" : draft.timeZone;
  const offset = formatOffset(offsetMinutes(zone, at) ?? 0);
  const tag = localeTag(draft.language, draft.country);
  const week = weekdayNames(tag, draft.firstDay);

  const change = (patch: Partial<LanguageRegionValue>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setPhase("idle");
  };

  // Save disables itself while it works and again once nothing is left to save, which drops its focus: hand it on.
  useEffect(() => {
    if (phase !== "saved" && phase !== "error") return;
    const target = focusAfterSave.current;
    focusAfterSave.current = null;
    (target === "save" ? saveButton.current : target === "status" ? statusLine.current : null)?.focus();
  }, [phase]);

  async function save() {
    const hadFocus = document.activeElement === saveButton.current;
    setPhase("saving");
    try {
      await onSave(draft);
      setBaseline(draft);
      if (hadFocus) focusAfterSave.current = "status";
      setPhase("saved");
    } catch {
      if (hadFocus) focusAfterSave.current = "save";
      setPhase("error");
    }
  }

  return (
    <Card data-slot="language-region-section" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <div className="grid gap-x-6 gap-y-6 border-t border-border px-6 py-6 @md:grid-cols-2">
        <FormField className="content-start" described>
          <FormLabel>Language</FormLabel>
          <FormControl>
            <Combobox label="Language" options={languageOptions} value={draft.language} onValueChange={(language) => change({ language })} searchPlaceholder="Search languages" emptyText="No language found" />
          </FormControl>
          <FormDescription>Each language is listed in its own name.</FormDescription>
        </FormField>
        <FormField className="content-start" described>
          <FormLabel>Country or region</FormLabel>
          <FormControl>
            <CountrySelect value={draft.country} onValueChange={(country) => change({ country })} locale={locale} />
          </FormControl>
          <FormDescription>Sets the number format and currency style.</FormDescription>
        </FormField>
        <FormField className="content-start @md:col-span-2" described>
          <FormLabel>Time zone</FormLabel>
          <FormControl>
            <Combobox label="Time zone" options={zoneChoices} value={draft.timeZone} onValueChange={(timeZone) => change({ timeZone })} searchPlaceholder="Search cities or offsets" emptyText="No time zone found" />
          </FormControl>
          <FormDescription>Grouped by offset from UTC, so you can find yours by city or by hours.</FormDescription>
        </FormField>
        <div className="grid gap-2 @md:col-span-2">
          <p id={`${id}-order`} className="text-sm leading-none font-medium">Date order</p>
          <RadioGroup aria-labelledby={`${id}-order`} value={draft.dateOrder} onValueChange={(next) => change({ dateOrder: next as DateOrder })} className="grid gap-2 @md:grid-cols-3">
            {ORDERS.map((order) => (
              <label
                key={order.value}
                htmlFor={`${id}-order-${order.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/40 motion-reduce:transition-none"
              >
                <RadioGroupItem id={`${id}-order-${order.value}`} value={order.value} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{order.label}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">{formatDate(at, tag, order.value, zone)}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
        {/* Side by side only once each half is wide enough for the three days; before that each takes a row. */}
        <div className="grid content-start gap-2 @md:col-span-2 @xl:col-span-1">
          <p className="text-sm leading-none font-medium">First day of the week</p>
          <SegmentedControl
            label="First day of the week"
            value={draft.firstDay}
            options={FIRST_DAYS}
            className="justify-self-start [&>button]:px-2 [&>button]:text-[0.8125rem] @sm:[&>button]:px-3 @sm:[&>button]:text-sm"
            onValueChange={(firstDay) => change({ firstDay: firstDay as FirstDay })}
          />
        </div>
        <div className="grid content-start gap-2 @md:col-span-2 @xl:col-span-1">
          <p className="text-sm leading-none font-medium">Clock</p>
          <label htmlFor={`${id}-clock`} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3">
            <span className="min-w-0">
              <span className="block text-sm font-medium">24-hour clock</span>
              <span id={`${id}-clock-example`} className="block text-xs text-muted-foreground tabular-nums">{draft.hour24 ? "On: " : "Off: "}{formatTime(at, tag, draft.hour24, zone)}</span>
            </span>
            <Switch id={`${id}-clock`} aria-label="24-hour clock" aria-describedby={`${id}-clock-example`} checked={draft.hour24} onCheckedChange={(hour24) => change({ hour24 })} />
          </label>
        </div>
        <div data-slot="language-region-preview" className="rounded-lg border border-border bg-muted/40 p-4 @md:col-span-2">
          <p className="text-xs font-medium text-muted-foreground">Preview</p>
          <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 @[22rem]:grid-cols-2 @md:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Date</dt>
              <dd className="mt-0.5 text-base font-medium tracking-[-0.01em] tabular-nums">{formatDate(at, tag, draft.dateOrder, zone)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Time</dt>
              <dd className="mt-0.5 text-base font-medium tracking-[-0.01em] tabular-nums">{formatTime(at, tag, draft.hour24, zone, true)}</dd>
            </div>
            <div className="@[22rem]:col-span-2 @md:col-span-1">
              <dt className="text-xs text-muted-foreground">Number</dt>
              <dd className="mt-0.5 text-base font-medium tracking-[-0.01em] tabular-nums">{formatNumber(tag)}</dd>
            </div>
          </dl>
          <div aria-hidden="true" className="mt-4 grid grid-cols-7 gap-1">
            {week.map((day, index) => (
              <span key={`${day}-${index}`} className={cn("rounded-md border py-1 text-center text-[0.6875rem] font-medium", index === 0 ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground")}>
                {day}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Weeks start on {FIRST_DAY_NAME[draft.firstDay]}. Times are shown for {cityOf(zone)} ({offset}).
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5">
        <Button ref={saveButton} type="button" disabled={!dirty} loading={phase === "saving"} onClick={() => void save()}>
          Save changes
        </Button>
        <p
          ref={statusLine}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          className={cn("flex items-center gap-2 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring", phase === "error" ? "font-medium text-destructive" : "text-muted-foreground")}
        >
          {phase === "saved" ? <IconCheckCircle className="size-4 shrink-0 text-foreground" /> : null}
          {phase === "error" ? <IconAlertCircle className="size-4 shrink-0" /> : null}
          {phase === "saving" ? "Saving…" : phase === "saved" ? "Saved" : phase === "error" ? "Could not save. Try again." : dirty ? "You have unsaved changes." : ""}
        </p>
      </div>
    </Card>
  );
}
