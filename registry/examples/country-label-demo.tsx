"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { CountryLabel } from "@rhs-ui/primitives/country-label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const LOCALES = [
  { value: "en-US", label: "EN" },
  { value: "nl-NL", label: "NL" },
  { value: "de-DE", label: "DE" },
  { value: "fr-FR", label: "FR" },
  { value: "ja-JP", label: "JA" },
] as const;

const CUSTOMERS = [
  { name: "Studio Brightwater", code: "NL", orders: 48 },
  { name: "Kestrel Analytics", code: "DE", orders: 31 },
  { name: "Northwind Traders", code: "GB", orders: 27 },
  { name: "Atelier Lumière", code: "FR", orders: 19 },
  { name: "Fjordline Marine", code: "NO", orders: 12 },
  { name: "Harbour & Co", code: "US", orders: 9 },
  { name: "Sakura Supply", code: "JP", orders: 6 },
  { name: "Pending verification", code: "XX", orders: 1 },
] as const;

/** What the table says for a customer without a country: it follows the reader's language like every name beside it. */
const NOT_SET: Record<string, string> = {
  "en-US": "Not set",
  "nl-NL": "Niet ingesteld",
  "de-DE": "Nicht festgelegt",
  "fr-FR": "Non défini",
  "ja-JP": "未設定",
};

const LANGUAGES = ["nl", "pt-BR", "de", "ja", "ar"] as const;
const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF"] as const;

export default function Demo(): React.JSX.Element {
  const [locale, setLocale] = useState<string>("en-US");
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Pick the reader’s language: every name is written in it, with no data file shipped. Flags are emoji, so where the platform has no flag glyphs (Chrome and Edge on Windows) the tile shows the country code instead">
        <SegmentedControl label="Reader’s language" value={locale} onValueChange={setLocale} options={LOCALES} className="w-fit" />
        <div className="max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CUSTOMERS.map((customer) => (
                <TableRow key={customer.name}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <CountryLabel code={customer.code} locale={locale} fallback={NOT_SET[locale]} />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">{customer.orders}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <div className="grid gap-10 sm:grid-cols-3">
        <Example caption="With the code, for forms and exports">
          <ul className="grid gap-2.5 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
            {(["NL", "BE", "LU", "DE"] as const).map((code) => (
              <li key={code}>
                <CountryLabel code={code} locale={locale} showCode />
              </li>
            ))}
          </ul>
        </Example>
        <Example caption="Languages, by their code">
          <ul className="grid gap-2.5 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
            {LANGUAGES.map((code) => (
              <li key={code}>
                <CountryLabel code={code} type="language" locale={locale} />
              </li>
            ))}
          </ul>
        </Example>
        <Example caption="Currencies, with their symbol">
          <ul className="grid gap-2.5 rounded-xl border border-border bg-card p-4 text-sm shadow-xs">
            {CURRENCIES.map((code) => (
              <li key={code}>
                <CountryLabel code={code} type="currency" locale={locale} />
              </li>
            ))}
          </ul>
        </Example>
      </div>

      <Example caption="An address block: the flag is decorative and hidden from a screen reader, which hears only the name">
        <address className="grid max-w-xs gap-1 rounded-xl border border-border bg-card p-4 text-sm not-italic shadow-xs">
          <span className="font-medium">Northwind Traders Ltd</span>
          <span className="text-muted-foreground">14 Wharf Road, London N1 7GU</span>
          <CountryLabel code="GB" locale={locale} className="mt-1" />
        </address>
      </Example>
    </div>
  );
}
