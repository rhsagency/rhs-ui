"use client";

import { useId, useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

interface Zone {
  value: string;
  city: string;
  offset: string;
}

const ZONES: readonly { region: string; zones: readonly Zone[] }[] = [
  {
    region: "Europe",
    zones: [
      { value: "Europe/Amsterdam", city: "Amsterdam", offset: "UTC+1, summer UTC+2" },
      { value: "Europe/London", city: "London", offset: "UTC, summer UTC+1" },
      { value: "Europe/Lisbon", city: "Lisbon", offset: "UTC, summer UTC+1" },
    ],
  },
  {
    region: "Americas",
    zones: [
      { value: "America/New_York", city: "New York", offset: "UTC-5, summer UTC-4" },
      { value: "America/Sao_Paulo", city: "São Paulo", offset: "UTC-3" },
    ],
  },
  {
    region: "Asia and Pacific",
    zones: [
      { value: "Asia/Tokyo", city: "Tokyo", offset: "UTC+9" },
      { value: "Australia/Sydney", city: "Sydney", offset: "UTC+10, summer UTC+11" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const id = useId();
  const [zone, setZone] = useState<string>();
  const city = ZONES.flatMap((group) => group.zones).find((item) => item.value === zone)?.city;

  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor={id}>Time zone</Label>
      <Select value={zone} onValueChange={setZone}>
        <SelectTrigger id={id} aria-describedby={`${id}-hint`}>
          <SelectValue placeholder="Choose a time zone" />
        </SelectTrigger>
        <SelectContent>
          {ZONES.map((group, index) => (
            <SelectGroup key={group.region}>
              {index > 0 ? <SelectSeparator /> : null}
              <SelectLabel>{group.region}</SelectLabel>
              {group.zones.map((item) => (
                <SelectItem key={item.value} value={item.value} description={item.offset}>
                  {item.city}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground" aria-live="polite">
        {city ? `Reminders now follow ${city}.` : "Used for reminders and reports."}
      </p>
    </div>
  );
}
