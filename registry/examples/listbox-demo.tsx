"use client";

import { useState, type ReactNode } from "react";

import { IconFileCode, IconFileSheet, IconFileText } from "@rhs-ui/icons";
import { Listbox, type ListboxOption } from "@rhs-ui/primitives/listbox";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Reported({ value }: { value: unknown }): React.JSX.Element {
  return (
    <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span>Reported</span>
      <code className="max-w-full font-mono text-[0.6875rem] break-words text-foreground">{JSON.stringify(value).replace(/,/g, ", ")}</code>
    </p>
  );
}

const person = (name: string, role: string, group: string, extra?: Partial<ListboxOption>): ListboxOption => ({
  value: name.toLowerCase().replace(/\s+/g, "-"),
  label: name,
  description: role,
  group,
  ...extra,
});

const PEOPLE: readonly ListboxOption[] = [
  person("Ada Okafor", "Design lead", "Design"),
  person("Ines Kowalski", "Product designer", "Design"),
  person("Marcus Lindqvist", "Design systems", "Design"),
  person("Tomas Brandt", "Staff engineer", "Engineering"),
  person("Priya Nair", "Frontend engineer", "Engineering"),
  person("Jonas Weber", "Platform engineer", "Engineering"),
  person("Sofia Marin", "Mobile engineer", "Engineering"),
  person("Leo Fischer", "Security", "Engineering", { disabled: true, description: "On leave until 9 November" }),
  person("Hana Sato", "People and culture", "Operations"),
  person("Mara Okafor", "Finance", "Operations"),
  person("Dmitri Volkov", "Legal", "Operations"),
];

const ZONES: readonly ListboxOption[] = [
  { value: "europe-amsterdam", label: "Amsterdam", description: "UTC+01:00", group: "Europe" },
  { value: "europe-berlin", label: "Berlin", description: "UTC+01:00", group: "Europe" },
  { value: "europe-lisbon", label: "Lisbon", description: "UTC+00:00", group: "Europe" },
  { value: "europe-london", label: "London", description: "UTC+00:00", group: "Europe" },
  { value: "europe-zurich", label: "Zürich", description: "UTC+01:00", group: "Europe" },
  { value: "america-new-york", label: "New York", description: "UTC-05:00", group: "Americas" },
  { value: "america-chicago", label: "Chicago", description: "UTC-06:00", group: "Americas" },
  { value: "america-los-angeles", label: "Los Angeles", description: "UTC-08:00", group: "Americas" },
  { value: "america-sao-paulo", label: "São Paulo", description: "UTC-03:00", group: "Americas" },
  { value: "asia-singapore", label: "Singapore", description: "UTC+08:00", group: "Asia and Pacific" },
  { value: "asia-tokyo", label: "Tokyo", description: "UTC+09:00", group: "Asia and Pacific" },
  { value: "pacific-sydney", label: "Sydney", description: "UTC+11:00", group: "Asia and Pacific" },
];

const FORMATS: readonly ListboxOption[] = [
  { value: "csv", label: "CSV", description: "Opens in any spreadsheet", icon: <IconFileSheet /> },
  { value: "json", label: "JSON", description: "For scripts and other tools", icon: <IconFileCode /> },
  { value: "pdf", label: "PDF report", description: "Needs the Business plan", icon: <IconFileText />, disabled: true },
];

const CHANNELS: readonly ListboxOption[] = [
  { value: "email", label: "Email" },
  { value: "inbox", label: "In-app inbox" },
  { value: "phone", label: "Phone call" },
  { value: "push", label: "Push notification" },
  { value: "sms", label: "SMS" },
  { value: "webhook", label: "Webhook" },
];

export default function Demo(): React.JSX.Element {
  const [people, setPeople] = useState<string[]>(["ada-okafor", "tomas-brandt"]);
  const [zone, setZone] = useState<string | null>("europe-amsterdam");
  const [format, setFormat] = useState<string | null>("csv");
  const [channels, setChannels] = useState<string[]>(["email", "push"]);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: Tab in once. Type to filter, arrows move, Enter toggles, Shift with the arrows or a click chooses a range.">
          <div className="grid gap-4">
            <h2 id="share-title" className="text-sm font-medium tracking-[-0.01em]">
              Share the Q3 roadmap with
            </h2>
            <Listbox aria-labelledby="share-title" selectionMode="multiple" searchable searchPlaceholder="Search people" name="people" height="18rem" options={PEOPLE} value={people} onValueChange={setPeople} />
            <Reported value={people} />
          </div>
        </Example>
        <Example caption="No search: Space toggles, Shift with the arrows or a click chooses a range, Control A chooses all, a letter jumps to it">
          <div className="grid gap-3">
            <h2 id="channels-title" className="text-sm font-medium tracking-[-0.01em]">
              Send alerts to
            </h2>
            <Listbox aria-labelledby="channels-title" selectionMode="multiple" name="channels" options={CHANNELS} value={channels} onValueChange={setChannels} />
            <Reported value={channels} />
          </div>
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="One choice, with a search that ignores accents: try zurich">
          <div className="grid gap-3">
            <h2 id="zone-title" className="text-sm font-medium tracking-[-0.01em]">
              Time zone
            </h2>
            <Listbox aria-labelledby="zone-title" searchable searchPlaceholder="Search cities" height="14rem" options={ZONES} value={zone} onValueChange={setZone} />
            <Reported value={zone} />
          </div>
        </Example>
        <Example caption="No search, with icons: a row that is off is skipped by the arrow keys">
          <div className="grid gap-3">
            <h2 id="format-title" className="text-sm font-medium tracking-[-0.01em]">
              Export as
            </h2>
            <Listbox aria-labelledby="format-title" options={FORMATS} value={format} onValueChange={setFormat} />
          </div>
        </Example>
        <Example caption="Disabled">
          <Listbox disabled aria-label="Locked formats" options={FORMATS.slice(0, 2)} defaultValue="json" />
        </Example>
      </div>
    </div>
  );
}
