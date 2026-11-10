"use client";

import { useId, useMemo, useState } from "react";

import { IconChevronDown, IconGlobe } from "@rhs-ui/icons";
import { countryName, countryOptions } from "@rhs-ui/marketing/footer-region-selector/countries";
import type { Region, RegionLabels, RegionOptions } from "@rhs-ui/marketing/footer-region-selector/types";
import { Button } from "@rhs-ui/primitives/button";
import { Combobox } from "@rhs-ui/primitives/combobox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface RegionPickerProps {
  /** The region, when you control it. Pair with onRegionChange. */
  region?: Region;
  /** The region it starts with, when you do not control it. */
  defaultRegion?: Region;
  /** The countries, languages and currencies on offer. */
  options: RegionOptions;
  /** Called with all three codes every time one of the controls changes. Nothing navigates by itself. */
  onRegionChange?: (region: Region) => void;
  /** The language of the country names, in the list and in the summary. */
  locale: string;
  /** The fixed words. */
  labels: RegionLabels;
  /** Classes for the group. */
  className?: string;
}

interface RegionFieldsProps {
  idBase: string;
  region: Region;
  options: RegionOptions;
  locale: string;
  labels: RegionLabels;
  onChange: (patch: Partial<Region>) => void;
  className?: string;
}

const caption = "text-xs font-normal text-muted-foreground";

interface CountryFieldProps {
  id: string;
  value: string;
  onValueChange: (country: string) => void;
  options: RegionOptions;
  locale: string;
  labels: RegionLabels;
}

/**
 * The searchable country list on the house combobox. CountrySelect would do the same, but it says "Suggested", "All countries", "Search
 * countries" and "No country found" in English whatever the page speaks, so the list is built here with the words of the footer's labels.
 */
function CountryField({ id, value, onValueChange, options, locale, labels }: CountryFieldProps) {
  const list = useMemo(
    () => countryOptions({ only: options.countries, suggested: options.suggestedCountries, locale, suggestedLabel: labels.suggested, allLabel: labels.allCountries }),
    [options.countries, options.suggestedCountries, locale, labels.suggested, labels.allCountries],
  );
  return (
    <Combobox
      id={id}
      options={list}
      value={value}
      onValueChange={onValueChange}
      label={labels.country}
      placeholder={labels.chooseCountry}
      searchPlaceholder={labels.searchCountries}
      emptyText={labels.noCountry}
    />
  );
}

/** The three labelled fields, shared by the bar and the dialog, so neither can drift from the other. */
function RegionFields({ idBase, region, options, locale, labels, onChange, className }: RegionFieldsProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idBase}-country`} className={caption}>
          {labels.country}
        </Label>
        <CountryField id={`${idBase}-country`} value={region.country} onValueChange={(country) => onChange({ country })} options={options} locale={locale} labels={labels} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idBase}-language`} className={caption}>
          {labels.language}
        </Label>
        <Select value={region.language} onValueChange={(language) => onChange({ language })}>
          <SelectTrigger id={`${idBase}-language`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.languages.map((choice) => (
              <SelectItem key={choice.value} value={choice.value} description={choice.hint}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`${idBase}-currency`} className={caption}>
          {labels.currency}
        </Label>
        <Select value={region.currency} onValueChange={(currency) => onChange({ currency })}>
          <SelectTrigger id={`${idBase}-currency`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.currencies.map((choice) => (
              <SelectItem key={choice.value} value={choice.value} description={choice.hint}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/**
 * The Region group of the footer: from md up a labelled group with the three
 * fields and a summary line that says the current choice in words; below md one
 * button that shows the same summary and opens a dialog with the same three
 * fields, which keeps the footer short. Changing a control calls
 * onRegionChange with the full triple and nothing else happens.
 */
export function RegionPicker({ region, defaultRegion, options, onRegionChange, locale, labels, className }: RegionPickerProps) {
  const id = useId();
  const [own, setOwn] = useState<Region>(
    defaultRegion ?? { country: options.countries?.[0] ?? "US", language: options.languages[0]?.value ?? "en", currency: options.currencies[0]?.value ?? "USD" },
  );
  const current = region ?? own;
  const change = (patch: Partial<Region>) => {
    const next = { ...current, ...patch };
    if (region === undefined) setOwn(next);
    onRegionChange?.(next);
  };
  const summary = [
    countryName(current.country, locale),
    options.languages.find((choice) => choice.value === current.language)?.label ?? current.language,
    options.currencies.find((choice) => choice.value === current.currency)?.label ?? current.currency,
  ].join(", ");

  return (
    <div data-slot="footer-region-picker" className={className}>
      <div role="group" aria-labelledby={`${id}-heading`} className="hidden gap-5 md:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
        <div className="grid content-start gap-2">
          <h2 id={`${id}-heading`} className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
            <IconGlobe aria-hidden="true" className="size-3.5" />
            {labels.region}
          </h2>
          <p aria-live="polite" className="text-sm font-medium">
            {summary}
          </p>
        </div>
        <RegionFields idBase={`${id}-bar`} region={current} options={options} locale={locale} labels={labels} onChange={change} className="md:grid-cols-3 lg:grid-cols-[repeat(3,12rem)]" />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="h-auto min-h-11 w-full justify-between px-3.5 py-2 font-normal md:hidden">
            {/* The summary wraps instead of being cut: the currency is the last of its three values, and the one a narrow screen would lose. */}
            <span className="flex min-w-0 items-center gap-2.5">
              <IconGlobe aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="sr-only">{labels.region}: </span>
              <span className="text-left whitespace-normal">{summary}</span>
            </span>
            <IconChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{labels.region}</DialogTitle>
            <DialogDescription>{labels.description}</DialogDescription>
          </DialogHeader>
          <RegionFields idBase={`${id}-dialog`} region={current} options={options} locale={locale} labels={labels} onChange={change} />
          <DialogFooter>
            <DialogClose asChild>
              <Button>{labels.done}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
