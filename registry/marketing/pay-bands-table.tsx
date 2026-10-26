"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconClock } from "@rhs-ui/icons";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface PayBand {
  /** The bottom of the band, per year, in whole currency units. */
  low: number;
  /** The top of the band. */
  high: number;
}

export interface PayLevel {
  /** The level as people at the company say it: "Senior engineer". */
  name: string;
  /** The band in each zone, by zone id. A zone that is left out says the level is not offered there. */
  bands: Readonly<Record<string, PayBand>>;
}

export interface PayFamily {
  /** A group of roles that are paid alike: "Engineering". */
  name: string;
  /** The levels from the first rung up. */
  levels: readonly PayLevel[];
}

export interface PayZone {
  /** What `bands` is keyed on: "zone-1". */
  id: string;
  /** What the switch says: "Zone 1". */
  label: string;
  /** Where it applies, said once for the whole table: "Amsterdam, London, Zurich". */
  description?: string;
}

export interface PayNote {
  /** "Bonus", "Equity", "Review cycle". */
  label: string;
  /** The fact, in a line or two. */
  value: ReactNode;
}

export interface PayBandsLabels {
  /** Head of the level column. */
  level: string;
  /** Head of the minimum column. */
  minimum: string;
  /** Head of the maximum column. */
  maximum: string;
  /** Head of the bar column. The bars are a picture of the numbers, hidden from screen readers. */
  range: string;
  /** Said for a level that has no band in the chosen zone. */
  notOffered: string;
  /** The accessible name of the zone switch. */
  zones: string;
  /** The table's accessible name. {zone} stands for the label of the chosen zone. */
  caption: string;
  /** Heading of the methodology. */
  methodology: string;
  /** The words before the date. */
  updated: string;
}

export interface PayBandsTableProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue"> {
  /** The role families, each with its levels. Every level carries a band per zone. */
  families: readonly PayFamily[];
  /** The pay zones. Two or three work best; with one the switch is left out. */
  zones: readonly PayZone[];
  /** The ISO 4217 code the bands are in: "EUR". */
  currency?: string;
  /** Locale for the amounts and the date. */
  locale?: string;
  /** Short facts about the rest of the package: the bonus, the equity, how often pay is reviewed. */
  notes?: readonly PayNote[];
  /** A plain paragraph on how the bands are set. */
  methodology?: ReactNode;
  /** When the bands last changed, as an ISO date: "2026-10-01". */
  updated?: string;
  /** The chosen zone, when you control it. */
  zone?: string;
  /** The zone chosen first. The first zone by default. */
  defaultZone?: string;
  /** Called when the reader picks another zone. */
  onZoneChange?: (zone: string) => void;
  /** The page's own heading, when the page has no other: "Pay bands". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The level of the title. The methodology heading sits one level below it, or takes this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the headings and terms, for a site that is not in English. */
  labels?: Partial<PayBandsLabels>;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: PayBandsLabels = {
  level: "Level",
  minimum: "Minimum",
  maximum: "Maximum",
  range: "Range",
  notOffered: "Not offered in this zone",
  zones: "Pay zone",
  caption: "Annual base salary bands by role family and level, {zone}",
  methodology: "How we set pay",
  updated: "Updated",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** The cell behind a sticky one has to be solid, or the numbers show through it as the table scrolls. */
const STICKY = "sticky left-0 z-[1] bg-card";

/** One band drawn on the shared scale: a track, and on it the stretch from the low to the high figure. Decorative: the numbers carry the meaning. */
function Bar({ band, floor, span }: { band: PayBand; floor: number; span: number }) {
  return (
    <div aria-hidden="true" className="relative h-1.5 rounded-full bg-muted">
      <div
        className="absolute inset-y-0 rounded-full bg-foreground/80 transition-[left,width] duration-300 motion-reduce:transition-none"
        style={{ left: `${((band.low - floor) / span) * 100}%`, width: `${Math.max(((band.high - band.low) / span) * 100, 1.5)}%` }}
      />
    </div>
  );
}

/**
 * Published pay, as the table it is: role families as row groups, levels as
 * rows, and for each the annual minimum and maximum in tabular numbers, with
 * a bar that draws the band on one shared scale so overlaps between levels
 * can be seen. A zone switch changes the figures without leaving the table
 * and says where the zone applies. Under it sit the rest of the package
 * (bonus, equity, review cycle) and a plain paragraph on how the bands are
 * set. Built for pay transparency: the range sits next to every role. On a
 * phone each bar moves under its level so the table fits; a table that is
 * still too wide (long names, big figures) scrolls sideways inside its own
 * container, with the level column held in place.
 */
export function PayBandsTable({
  families,
  zones,
  currency = "USD",
  locale = "en-US",
  notes = [],
  methodology,
  updated,
  zone,
  defaultZone,
  onZoneChange,
  title,
  description,
  headingLevel = 2,
  labels: custom,
  timeZone = "UTC",
  className,
  ...props
}: PayBandsTableProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const [own, setOwn] = useState(defaultZone ?? zones[0]?.id ?? "");
  const current = zone ?? own;
  const active = zones.find((entry) => entry.id === current) ?? zones[0];
  const activeId = active?.id ?? "";
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 });
  const compact = new Intl.NumberFormat(locale, { style: "currency", currency, notation: "compact", maximumFractionDigits: 0 });

  // One scale for every zone, so the bars move when the zone changes instead of always filling the track.
  const all = families.flatMap((family) => family.levels.flatMap((level) => Object.values(level.bands)));
  const floor = all.length ? Math.min(...all.map((band) => band.low)) : 0;
  const ceiling = all.length ? Math.max(...all.map((band) => band.high)) : 0;
  const span = Math.max(ceiling - floor, 1);

  const choose = (next: string) => {
    if (zone === undefined) setOwn(next);
    onZoneChange?.(next);
  };

  return (
    <section data-slot="pay-bands-table" className={cn("w-full break-words", className)} {...props}>
      {title || description || updated ? (
        <header className="mb-8 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
          {updated ? (
            <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", (title || description) && "mt-5")}>
              <IconClock aria-hidden="true" className="size-4" />
              <span>
                {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
              </span>
            </p>
          ) : null}
        </header>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        {zones.length > 1 ? (
          <SegmentedControl label={labels.zones} options={zones.map((entry) => ({ value: entry.id, label: entry.label }))} value={activeId} onValueChange={choose} />
        ) : null}
        <p aria-live="polite" className={cn("min-h-5 text-sm text-muted-foreground", zones.length > 1 && "sm:text-right")}>
          {active?.description ? (
            <>
              <span className="font-medium text-foreground">{active.label}:</span> {active.description}
            </>
          ) : null}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <Table className="sm:min-w-[34rem]">
          <TableCaption className="sr-only">{labels.caption.replace("{zone}", active?.label ?? "")}</TableCaption>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className={cn(STICKY, "bg-muted pl-5 sm:w-[32%] max-sm:pr-2 max-sm:pl-4")}>
                {labels.level}
              </TableHead>
              <TableHead scope="col" className="text-right max-sm:px-2">
                {labels.minimum}
              </TableHead>
              <TableHead scope="col" className="text-right max-sm:pr-4 max-sm:pl-2">
                {labels.maximum}
              </TableHead>
              {/* The bars are a picture of the numbers, so their column is hidden from screen readers, and from a phone, where each bar sits under its level instead. */}
              <TableHead scope="col" aria-hidden="true" className="w-[34%] min-w-48 pr-5 pl-8 max-sm:hidden">
                <span className="flex items-baseline justify-between gap-3">
                  <span>{labels.range}</span>
                  {all.length ? (
                    <span className="text-xs font-normal tabular-nums">
                      {compact.format(floor)} &ndash; {compact.format(ceiling)}
                    </span>
                  ) : null}
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          {families.map((family) => (
            <TableBody key={family.name} className="border-t border-border">
              <TableRow className="border-b-0 bg-muted/50 hover:bg-muted/50">
                <TableHead scope="rowgroup" colSpan={4} className="h-auto py-2.5 text-xs font-medium tracking-[0.06em] text-foreground uppercase">
                  <span className="sticky left-5 inline-block max-sm:left-4">{family.name}</span>
                </TableHead>
              </TableRow>
              {family.levels.map((level) => {
                const band = level.bands[activeId];
                return (
                  <TableRow key={`${family.name}-${level.name}`} className="hover:bg-transparent">
                    <TableHead scope="row" className={cn(STICKY, "h-auto py-3.5 pl-5 text-sm font-medium whitespace-normal text-foreground max-sm:pr-2 max-sm:pl-4")}>
                      {level.name}
                      {band ? (
                        <span className="mt-2.5 block sm:hidden">
                          <Bar band={band} floor={floor} span={span} />
                        </span>
                      ) : null}
                    </TableHead>
                    {band ? (
                      <>
                        <TableCell className="py-3.5 text-right text-sm tabular-nums max-sm:px-2">{money.format(band.low)}</TableCell>
                        <TableCell className="py-3.5 text-right text-sm tabular-nums max-sm:pr-4 max-sm:pl-2">{money.format(band.high)}</TableCell>
                        <TableCell aria-hidden="true" className="py-3.5 pr-5 pl-8 max-sm:hidden">
                          <Bar band={band} floor={floor} span={span} />
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell colSpan={2} className="py-3.5 text-right text-sm text-muted-foreground max-sm:pr-4 max-sm:pl-2">
                          {labels.notOffered}
                        </TableCell>
                        <TableCell aria-hidden="true" className="py-3.5 max-sm:hidden" />
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          ))}
        </Table>
      </div>

      {notes.length ? (
        <dl className="mt-6 grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {notes.map((note) => (
            <div key={note.label} className="p-5">
              <dt className="text-sm text-muted-foreground">{note.label}</dt>
              <dd className="mt-1.5 text-[0.9375rem] leading-snug font-medium text-pretty">{note.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {methodology ? (
        <section className="mt-10 grid grid-cols-1 gap-x-12 gap-y-4 border-t border-border pt-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <Sub className="text-base leading-snug font-medium tracking-[-0.01em]">
            {labels.methodology}
          </Sub>
          <div className="max-w-2xl text-[0.9375rem] leading-relaxed text-pretty text-muted-foreground">{methodology}</div>
        </section>
      ) : null}
    </section>
  );
}
