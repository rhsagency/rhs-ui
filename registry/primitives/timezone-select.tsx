"use client";

import { useMemo } from "react";

import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";

export interface TimezoneSelectProps {
  /** An IANA zone: "Europe/Amsterdam". */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (zone: string) => void;
  /** Where the offsets are measured; now by default. Pass a fixed date for stable output. */
  at?: Date;
  locale?: string;
  name?: string;
  id?: string;
  className?: string;
}

/** "GMT+2" for a zone at a moment, from the browser's own time zone data. */
export function zoneOffset(zone: string, at: Date, locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "";
}

/**
 * Pick a time zone by city, the way people think about it: every IANA zone
 * the browser knows (nothing hard-coded), grouped by region, with its
 * current offset, and searchable by city, region or offset ("GMT+2").
 * Offsets follow daylight saving for the moment you pass.
 */
export function TimezoneSelect({ value, defaultValue, onValueChange, at, locale = "en-GB", name, id, className }: TimezoneSelectProps) {
  const options = useMemo<ComboboxOption[]>(() => {
    const moment = at ?? new Date();
    const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];
    return zones.map((zone) => {
      const [region, ...rest] = zone.split("/");
      const city = (rest.length ? rest.join(" / ") : zone).replace(/_/g, " ");
      const offset = zoneOffset(zone, moment, locale);
      return { value: zone, label: `${city} (${offset})`, keywords: [zone, offset, region ?? ""], group: rest.length ? region : "Other" };
    });
  }, [at, locale]);
  return <Combobox options={options} value={value} defaultValue={defaultValue} onValueChange={onValueChange} label="Time zone" placeholder="Choose a time zone" searchPlaceholder="Search a city or offset" emptyText="No time zone found" name={name} id={id} className={className} />;
}
