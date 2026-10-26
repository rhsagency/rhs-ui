import type { ReactNode } from "react";

import { DateTile } from "@rhs-ui/primitives/date-tile";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A tile with its name underneath, centred on the tile. */
function Labelled({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid justify-items-center gap-2">
      {children}
      <span className="text-xs text-muted-foreground">{caption}</span>
    </div>
  );
}

/** A named group of tiles. Each group is a row of its own on a phone, and a group that does not fit beside the other drops below it. */
function Group({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div role="group" aria-label={label} className="grid content-start gap-4">
      <p aria-hidden="true" className="text-xs font-medium">
        {label}
      </p>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-6">{children}</div>
    </div>
  );
}

const EVENTS = [
  { id: "review", date: "2026-10-20", tone: "today", title: "Design review: onboarding flow", meta: "10:00 to 11:00 · Room Stern" },
  { id: "kestrel", date: "2026-10-22", title: "Kestrel contract renewal call", meta: "14:30 to 15:15 · Video call" },
  { id: "summit", date: "2026-10-27", end: "2026-10-29", title: "Halcyon Summit", meta: "Rotterdam · three days" },
  { id: "planning", date: "2026-11-03", title: "Quarterly planning", meta: "All day · Amsterdam office" },
  { id: "retro", date: "2026-10-15", tone: "muted", title: "Sprint 41 retrospective", meta: "Held · 6 attendees" },
] as const;

const INVOICES = [
  { id: "INV-20418", date: "2026-10-24", client: "Kestrel Analytics", amount: "€4,280.00" },
  { id: "INV-20417", date: "2026-10-31", client: "Northwind Traders", amount: "€1,150.00" },
  { id: "INV-20409", date: "2026-11-07", client: "Brightwater Studio", amount: "€890.00" },
] as const;

const LANGUAGES = [
  { locale: "en-US", name: "English" },
  { locale: "nl-NL", name: "Nederlands" },
  { locale: "de-DE", name: "Deutsch" },
  { locale: "fr-FR", name: "Français" },
  { locale: "ja-JP", name: "日本語" },
] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-10">
      <div className="grid gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Example caption="An event list: today is inverted, a range shows “Oct 27–29”, a past date is quiet">
          <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
            {EVENTS.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-4 py-3.5">
                <DateTile date={event.date} endDate={"end" in event ? event.end : undefined} tone={"tone" in event ? event.tone : "default"} />
                <div className="min-w-0">
                  <p className={"tone" in event && event.tone === "muted" ? "truncate text-sm font-medium text-muted-foreground" : "truncate text-sm font-medium"}>{event.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{event.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </Example>

        <Example caption="Deadlines, in the small size, with the year on the last line">
          <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
            {INVOICES.map((invoice) => (
              <li key={invoice.id} className="flex items-center gap-3 px-4 py-3">
                <DateTile date={invoice.date} size="sm" showYear />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{invoice.client}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                    {invoice.id} · {invoice.amount}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Example>
      </div>

      <Example caption="Three sizes, each with a range, and three tones. Every tile of a size is as wide as the next">
        <div className="flex flex-wrap gap-x-12 gap-y-8 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Group label="Sizes">
            <Labelled caption="Small">
              <DateTile date="2026-03-12" size="sm" />
            </Labelled>
            <Labelled caption="Medium">
              <DateTile date="2026-03-12" size="md" />
            </Labelled>
            <Labelled caption="Large">
              <DateTile date="2026-03-12" size="lg" />
            </Labelled>
          </Group>
          <Group label="Ranges">
            <Labelled caption="Small">
              <DateTile date="2026-03-12" endDate="2026-03-15" size="sm" />
            </Labelled>
            <Labelled caption="Medium">
              <DateTile date="2026-03-12" endDate="2026-03-15" size="md" />
            </Labelled>
            <Labelled caption="Large">
              <DateTile date="2026-03-12" endDate="2026-03-15" size="lg" />
            </Labelled>
          </Group>
          <Group label="Tones">
            <Labelled caption="Default">
              <DateTile date="2026-03-12" tone="default" />
            </Labelled>
            <Labelled caption="Today">
              <DateTile date="2026-03-12" tone="today" />
            </Labelled>
            <Labelled caption="Muted">
              <DateTile date="2026-03-12" tone="muted" />
            </Labelled>
          </Group>
        </div>
      </Example>

      <Example caption="Months and weekdays come from Intl in the reader’s language, and a range across a month or a year keeps both ends">
        <div className="flex flex-wrap gap-x-12 gap-y-8 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Group label="Languages">
            {LANGUAGES.map((language) => (
              <Labelled key={language.locale} caption={language.name}>
                <DateTile date="2026-03-12" locale={language.locale} />
              </Labelled>
            ))}
          </Group>
          <Group label="Across a boundary">
            <Labelled caption="Months">
              <DateTile date="2026-02-27" endDate="2026-03-02" />
            </Labelled>
            <Labelled caption="Years">
              <DateTile date="2026-12-29" endDate="2027-01-03" showYear />
            </Labelled>
          </Group>
        </div>
      </Example>
    </div>
  );
}
