"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconClock } from "@rhs-ui/icons";
import { daysText, zoneIndexOf, type ShippingMethod, type ShippingZone } from "@rhs-ui/commerce/shipping-rates-table/rates";
import { Badge } from "@rhs-ui/primitives/badge";
import { Callout } from "@rhs-ui/primitives/callout";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { ShippingDays, ShippingMethod, ShippingZone } from "@rhs-ui/commerce/shipping-rates-table/rates";

export interface ShippingNote {
  /** "Customs and duties", "Public holidays". */
  title: string;
  /** What to know. May hold a link. */
  body: ReactNode;
}

export interface ShippingRatesLabels {
  /** The heading. */
  title?: string;
  /** The label of the country picker. */
  country?: string;
  /** The picker before a country is chosen. */
  placeholder?: string;
  /** The search field inside the picker. */
  search?: string;
  /** The picker's answer when nothing matches. */
  empty?: string;
  /** The badge on the rates that apply to the person. */
  yourRegion?: string;
  /** Said when a country is chosen. `{country}` and `{region}`. */
  regionIs?: string;
  /** Said when only a region is known. `{region}`. */
  regionOnly?: string;
  /** The table's column heads. */
  columns?: { region?: string; method?: string; price?: string; delivery?: string; freeFrom?: string };
  /** In the price column when the method costs nothing. */
  free?: string;
  /** In the free-from column when the method costs nothing whatever the order comes to. The phone card leaves that row out. */
  alwaysFree?: string;
  /** In the free-from column when a paid method has no order amount that makes it free. The phone card leaves that row out. */
  never?: string;
  /** One working day. `{count}`. */
  daysOne?: string;
  /** Several working days. `{count}`. */
  daysOther?: string;
  /** A range of working days. `{from}` and `{to}`. */
  daysRange?: string;
}

const WORDS = {
  title: "Shipping rates",
  country: "Where are we sending it?",
  placeholder: "Choose your country",
  search: "Search countries",
  empty: "We do not know that country yet.",
  yourRegion: "Your region",
  regionIs: "Your rates for {country} are marked below: {region}.",
  regionOnly: "Your rates are marked below: {region}.",
  columns: { region: "Region", method: "Method", price: "Price", delivery: "Delivery", freeFrom: "Free from" },
  free: "Free",
  alwaysFree: "Always free",
  never: "No free option",
  daysOne: "{count} working day",
  daysOther: "{count} working days",
  daysRange: "{from} to {to} working days",
} satisfies Required<ShippingRatesLabels>;

export interface ShippingRatesTableProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The regions you ship to, each with its methods. In the order they should be listed. */
  zones: readonly ShippingZone[];
  /** ISO 4217 code for every amount. */
  currency?: string;
  /** Locale for the amounts and the numbers. Always passed, so server and browser agree. */
  locale?: string;
  /** The cut-off for dispatch, in a sentence: "Order before 15:00 for same-day dispatch". */
  cutoff?: string;
  /** A country, or a region, to mark as "Your region" to begin with: what you know from the address on file. */
  highlight?: string;
  /** Short notes under the table: customs, public holidays, cut-off times. Each is a callout. */
  notes?: readonly ShippingNote[];
  /** A line under the heading. */
  description?: string;
  /** The heading's element: "h2" (the default) inside a page, "h1" when this is the page. */
  headingAs?: "h1" | "h2";
  /** The words, for another language. */
  labels?: ShippingRatesLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Where you ship and what it costs, in one table: a row for every method of every region with its price, how
 * long it takes in working days and the order amount above which it is free. A country picker (the house
 * combobox) finds the person's region, marks its rows "Your region" in words as well as a tint, and brings them
 * into view; the cut-off for same-day dispatch and short notes on customs and holidays sit around it. On a
 * phone every region becomes a card with its methods and a description list, so nothing hides in a sideways
 * scroll. It answers the question that stops most purchases before the checkout.
 */
export function ShippingRatesTable({ zones, currency = "EUR", locale = "en-US", cutoff, highlight, notes = [], description, headingAs: Heading = "h2", labels, className, ...props }: ShippingRatesTableProps) {
  const words = { ...WORDS, ...labels, columns: { ...WORDS.columns, ...labels?.columns } };
  const Sub = Heading === "h1" ? "h2" : "h3";
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const [picked, setPicked] = useState<string | null>(highlight ?? null);

  const hasCountries = zones.some((zone) => zone.countries?.length);
  const options: ComboboxOption[] = hasCountries
    ? zones.flatMap((zone) => (zone.countries ?? []).map((country) => ({ value: country, label: country, description: country === zone.region ? undefined : zone.region, keywords: [zone.region] })))
    : zones.map((zone) => ({ value: zone.region, label: zone.region }));
  const value = options.some((option) => option.value === picked) ? picked : null;
  const active = zoneIndexOf(zones, picked);
  const activeRegion = zones[active]?.region;

  const money = (amount: number, whole = false) =>
    new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: whole && amount % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(amount / 100);
  const days = (method: ShippingMethod) => daysText(method.days, locale, words);
  const countriesOf = (zone: ShippingZone) => (zone.countries && !(zone.countries.length === 1 && zone.countries[0] === zone.region) ? zone.countries.join(", ") : null);
  const priceOf = (method: ShippingMethod) => (method.price === 0 ? words.free : money(method.price));
  const freeFrom = (method: ShippingMethod) => (method.freeFrom === undefined ? null : money(method.freeFrom, true));
  // What the free-from column says: the amount, "Always free" for a method that costs nothing anyway, or null for a paid method that is never free.
  const freeFromText = (method: ShippingMethod) => (method.price === 0 ? words.alwaysFree : freeFrom(method));

  const choose = (next: string) => {
    setPicked(next);
    const index = zoneIndexOf(zones, next);
    // Bring the region's rows into view, whichever of the table and the cards is on show.
    requestAnimationFrame(() => {
      const targets = root.current?.querySelectorAll<HTMLElement>(`[data-zone-index="${index}"]`) ?? [];
      const visible = [...targets].find((target) => target.getClientRects().length > 0);
      visible?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
  };

  const status = active < 0 ? "" : value && value !== activeRegion ? fill(words.regionIs, { country: value, region: activeRegion ?? "" }) : fill(words.regionOnly, { region: activeRegion ?? "" });
  const yours = (
    <Badge>
      <IconCheck />
      {words.yourRegion}
    </Badge>
  );

  return (
    <section ref={root} data-slot="shipping-rates-table" className={cn("py-12 sm:py-16", className)} {...props}>
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="max-w-2xl">
          <Heading className="text-3xl leading-[1.1] font-medium tracking-[-.04em] text-balance sm:text-4xl">{words.title}</Heading>
          {description ? <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{description}</p> : null}
        </div>
        {cutoff ? (
          <p className="inline-flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm">
            <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0">{cutoff}</span>
          </p>
        ) : null}
      </header>

      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="grid w-full gap-2 sm:w-80">
          <label htmlFor={`${id}-country`} className="text-sm font-medium">
            {words.country}
          </label>
          <Combobox id={`${id}-country`} label={words.country} options={options} value={value} onValueChange={choose} placeholder={words.placeholder} searchPlaceholder={words.search} emptyText={words.empty} />
        </div>
        <p role="status" className="min-w-0 flex-1 basis-60 text-sm leading-relaxed text-muted-foreground empty:hidden sm:pb-2">
          {status}
        </p>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table className="caption-top">
          <TableCaption className="sr-only">{words.title}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-[28%] pl-5">
                {words.columns.region}
              </TableHead>
              <TableHead scope="col">{words.columns.method}</TableHead>
              <TableHead scope="col" className="text-right">
                {words.columns.price}
              </TableHead>
              <TableHead scope="col" className="pl-10">
                {words.columns.delivery}
              </TableHead>
              <TableHead scope="col" className="pr-5 text-right">
                {words.columns.freeFrom}
              </TableHead>
            </TableRow>
          </TableHeader>
          {zones.map((zone, index) => (
            <TableBody key={zone.region} data-zone-index={index} className="border-b border-border last:border-0">
              {zone.methods.map((method, row) => (
                <TableRow key={method.name} data-state={index === active ? "selected" : undefined} className="border-border/50">
                  <TableHead scope="row" className={cn("h-auto py-3.5 pl-5 align-top font-normal whitespace-normal text-foreground", index === active && "shadow-[inset_3px_0_0_0_var(--foreground)]")}>
                    {row === 0 ? (
                      <>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm font-medium">
                          {zone.region}
                          {index === active ? yours : null}
                        </span>
                        {countriesOf(zone) ? <span className="mt-1 block max-w-[16rem] text-xs leading-relaxed text-muted-foreground">{countriesOf(zone)}</span> : null}
                      </>
                    ) : (
                      <span className="sr-only">{zone.region}</span>
                    )}
                  </TableHead>
                  <TableCell className="py-3.5 align-top font-medium">{method.name}</TableCell>
                  <TableCell className="py-3.5 text-right align-top tabular-nums">{priceOf(method)}</TableCell>
                  <TableCell className="py-3.5 pl-10 align-top tabular-nums">{days(method)}</TableCell>
                  <TableCell className="py-3.5 pr-5 text-right align-top tabular-nums">
                    {freeFromText(method) ?? (
                      <>
                        <span aria-hidden="true" className="text-muted-foreground">
                          –
                        </span>
                        <span className="sr-only">{words.never}</span>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ))}
        </Table>
      </div>

      <ul className="mt-6 grid gap-4 md:hidden">
        {zones.map((zone, index) => (
          <li key={zone.region} data-zone-index={index} className={cn("rounded-xl border bg-card p-5", index === active ? "border-foreground" : "border-border")}>
            <Sub className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-base font-medium tracking-[-.01em]">
              {zone.region}
              {index === active ? yours : null}
            </Sub>
            {countriesOf(zone) ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{countriesOf(zone)}</p> : null}
            <ul className="mt-4 divide-y divide-border border-t border-border">
              {zone.methods.map((method) => {
                // The row only says something when there is an amount to reach: a free method and a method that is never free leave it out.
                const threshold = method.price === 0 ? null : freeFrom(method);
                return (
                  <li key={method.name} className="py-4 last:pb-0">
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{method.name}</span>
                      <span className="text-sm font-medium tabular-nums">{priceOf(method)}</span>
                    </p>
                    <DescriptionList
                      layout="grid"
                      className="mt-3 gap-y-3 [&_dd]:text-sm [&_dt]:text-xs"
                      items={[{ term: words.columns.delivery, value: days(method) }, ...(threshold === null ? [] : [{ term: words.columns.freeFrom, value: threshold }])]}
                    />
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      {notes.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Callout key={note.title} tone="note" title={note.title}>
              {note.body}
            </Callout>
          ))}
        </div>
      ) : null}
    </section>
  );
}
