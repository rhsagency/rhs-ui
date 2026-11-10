"use client";

import { useId, useState, type ReactNode } from "react";

import { RecordLookup, type LookupColumn, type LookupPage, type LookupQuery, type LookupRecord } from "@rhs-ui/application/record-lookup";
import { RecordLookupPanel } from "@rhs-ui/application/record-lookup/panel";
import { Label } from "@rhs-ui/primitives/label";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const COLUMNS: readonly LookupColumn[] = [
  { key: "name", label: "Customer", width: "14rem" },
  { key: "account", label: "Account", width: "7.5rem" },
  { key: "city", label: "City", width: "8.5rem" },
  { key: "manager", label: "Account manager", width: "11rem" },
];

const CUSTOMERS: readonly LookupRecord[] = [
  { id: "c01", name: "Halcyon Interiors BV", account: "NL-1042", city: "Rotterdam", manager: "Mara Keller" },
  { id: "c02", name: "Halcyon Interiors NV", account: "BE-2210", city: "Antwerp", manager: "Jonas Verhoeven" },
  { id: "c03", name: "Kestrel Outdoor", account: "NL-1057", city: "Utrecht", manager: "Amara Okafor" },
  { id: "c04", name: "Kestrel Outdoor Ltd", account: "GB-3301", city: "Leeds", manager: "Priya Raman" },
  { id: "c05", name: "Northwind Traders", account: "NL-1078", city: "Amsterdam", manager: "Mara Keller" },
  { id: "c06", name: "Lindqvist & Sons", account: "SE-4120", city: "Gothenburg", manager: "Tomás Herrera" },
  { id: "c07", name: "Fischer Maschinenbau GmbH", account: "DE-5008", city: "Stuttgart", manager: "Noah Fischer" },
  { id: "c08", name: "Moreau Atelier", account: "FR-6120", city: "Lyon", manager: "Lucas Moreau" },
  { id: "c09", name: "Tanaka Ceramics", account: "NL-1109", city: "Delft", manager: "Mei Tanaka" },
  { id: "c10", name: "Solberg Marine AS", account: "NO-7014", city: "Bergen", manager: "Ingrid Solberg" },
  { id: "c11", name: "Alvarez Logistics SL", account: "ES-8031", city: "Valencia", manager: "Diego Alvarez" },
  { id: "c12", name: "Cohen & Partners", account: "GB-3342", city: "London", manager: "Hannah Cohen" },
  { id: "c13", name: "Mensah Coffee Roasters", account: "NL-1133", city: "Haarlem", manager: "Kofi Mensah" },
  { id: "c14", name: "Petrova Studio", account: "DE-5044", city: "Berlin", manager: "Elena Petrova" },
  { id: "c15", name: "Okafor Architects", account: "NL-1150", city: "Eindhoven", manager: "Amara Okafor" },
  { id: "c16", name: "Raman Digital", account: "GB-3377", city: "Manchester", manager: "Priya Raman" },
  { id: "c17", name: "Verhoeven Bakery", account: "NL-1166", city: "Nijmegen", manager: "Jonas Verhoeven" },
  { id: "c18", name: "Al-Sayed Textiles", account: "NL-1181", city: "Tilburg", manager: "Fatima Al-Sayed" },
  { id: "c19", name: "Herrera Cycles", account: "ES-8066", city: "Seville", manager: "Tomás Herrera" },
  { id: "c20", name: "Lindgren Timber", account: "SE-4155", city: "Malmö", manager: "Tomás Herrera" },
  { id: "c21", name: "Brandt Optics", account: "DE-5090", city: "Munich", manager: "Noah Fischer" },
  { id: "c22", name: "Dubois Fromagerie", account: "FR-6177", city: "Dijon", manager: "Lucas Moreau" },
  { id: "c23", name: "Nakamura Tea House", account: "NL-1207", city: "The Hague", manager: "Mei Tanaka" },
  { id: "c24", name: "Haugen Fisheries", account: "NO-7060", city: "Tromsø", manager: "Ingrid Solberg" },
  { id: "c25", name: "Navarro Tiles", account: "ES-8102", city: "Málaga", manager: "Diego Alvarez" },
  { id: "c26", name: "Whitfield Printers", account: "GB-3410", city: "Bristol", manager: "Hannah Cohen" },
  { id: "c27", name: "Boateng Foods", account: "NL-1224", city: "Rotterdam", manager: "Kofi Mensah" },
  { id: "c28", name: "Kowalski Metalworks", account: "DE-5121", city: "Hamburg", manager: "Elena Petrova" },
  { id: "c29", name: "Dijkstra Bikes", account: "NL-1240", city: "Groningen", manager: "Amara Okafor" },
  { id: "c30", name: "Sinclair Gallery", account: "GB-3452", city: "Edinburgh", manager: "Priya Raman" },
];

const ADDRESS_COLUMNS: readonly LookupColumn[] = [
  { key: "street", label: "Address", width: "12.5rem" },
  { key: "city", label: "City", width: "8.5rem" },
  { key: "country", label: "Country", width: "9.5rem" },
  { key: "contact", label: "Contact on site", width: "10.5rem" },
];

const ADDRESSES: readonly LookupRecord[] = [
  { id: "a01", street: "Havenstraat 12", city: "Rotterdam", country: "Netherlands", contact: "Joost de Vries" },
  { id: "a02", street: "Scheldekaai 40", city: "Antwerp", country: "Belgium", contact: "Pieter Janssens" },
  { id: "a03", street: "Industrieweg 21", city: "Utrecht", country: "Netherlands", contact: "Sanne Bakker" },
  { id: "a04", street: "Kirkstall Road 118", city: "Leeds", country: "United Kingdom", contact: "Oliver Hughes" },
  { id: "a05", street: "Prinsengracht 540", city: "Amsterdam", country: "Netherlands", contact: "Fleur Dekker" },
  { id: "a06", street: "Kungsgatan 22", city: "Gothenburg", country: "Sweden", contact: "Linnea Berg" },
  { id: "a07", street: "Königstraße 76", city: "Stuttgart", country: "Germany", contact: "Matthias Roth" },
  { id: "a08", street: "Rue de la République 14", city: "Lyon", country: "France", contact: "Camille Laurent" },
  { id: "a09", street: "Oude Delft 99", city: "Delft", country: "Netherlands", contact: "Daan Visser" },
  { id: "a10", street: "Strandgaten 6", city: "Bergen", country: "Norway", contact: "Henrik Dahl" },
  { id: "a11", street: "Calle Colón 31", city: "Valencia", country: "Spain", contact: "Lucía Navarro" },
  { id: "a12", street: "Bermondsey Street 52", city: "London", country: "United Kingdom", contact: "Grace Whitaker" },
  { id: "a13", street: "Zijlstraat 15", city: "Haarlem", country: "Netherlands", contact: "Bram Smit" },
  { id: "a14", street: "Oranienstraße 190", city: "Berlin", country: "Germany", contact: "Katja Wolf" },
  { id: "a15", street: "Torenallee 20", city: "Eindhoven", country: "Netherlands", contact: "Yara Mulder" },
  { id: "a16", street: "Deansgate 201", city: "Manchester", country: "United Kingdom", contact: "Imran Shah" },
  { id: "a17", street: "Waalkade 7", city: "Nijmegen", country: "Netherlands", contact: "Eva Peters" },
  { id: "a18", street: "Hoogstraat 33", city: "Tilburg", country: "Netherlands", contact: "Rik Jansen" },
  { id: "a19", street: "Calle Betis 12", city: "Seville", country: "Spain", contact: "Carmen Ortega" },
  { id: "a20", street: "Slottsgatan 9", city: "Malmö", country: "Sweden", contact: "Elias Nyström" },
];

/** Lower case, without accents, so "malaga" finds "Málaga". */
const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** A wait that ends early, with the signal's reason, when the question is dropped. */
function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/** A stand-in for a server that holds some records: it searches, sorts and cuts a page, after a short wait. */
function serverFor(records: readonly LookupRecord[], columns: readonly LookupColumn[]) {
  return async ({ search, page, pageSize, sort }: LookupQuery, signal: AbortSignal): Promise<LookupPage> => {
    await wait(250, signal);
    const words = fold(search).split(/\s+/).filter(Boolean);
    const found = records.filter((record) => {
      const text = fold(columns.map((column) => String(record[column.key] ?? "")).join(" "));
      return words.every((word) => text.includes(word));
    });
    if (sort) {
      const sign = sort.direction === "ascending" ? 1 : -1;
      found.sort((a, b) => sign * String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), "en-US"));
    }
    return { rows: found.slice((page - 1) * pageSize, page * pageSize), total: found.length };
  };
}

const loadCustomers = serverFor(CUSTOMERS, COLUMNS);
const loadAddresses = serverFor(ADDRESSES, ADDRESS_COLUMNS);

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

export default function Demo(): React.JSX.Element {
  const customerId = useId();
  const shipId = useId();
  const [customer, setCustomer] = useState<LookupRecord | null>(CUSTOMERS[0] ?? null);
  const [shipTo, setShipTo] = useState<LookupRecord | null>(null);
  const [picked, setPicked] = useState<LookupRecord | null>(CUSTOMERS[4] ?? null);

  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="Try it: press Look up and search for halcyon. Two customers share the name, so the table tells them apart by account and city. Sort a column, page on, then press Select. Ship to has a table of its own: delivery addresses.">
        <div className={card}>
          <h2 className="text-base font-semibold tracking-[-0.02em]">New invoice</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid min-w-0 content-start gap-2">
              <Label id={customerId}>Customer</Label>
              <RecordLookup role="group" aria-labelledby={customerId} columns={COLUMNS} loadRows={loadCustomers} value={customer} onValueChange={setCustomer} title="Choose a customer" />
            </div>
            <div className="grid min-w-0 content-start gap-2">
              <Label id={shipId}>Ship to</Label>
              <RecordLookup role="group" aria-labelledby={shipId} columns={ADDRESS_COLUMNS} loadRows={loadAddresses} value={shipTo} onValueChange={setShipTo} title="Choose a delivery address" />
            </div>
          </div>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify({ customer: customer?.account ?? null, shipTo: shipTo?.id ?? null }).replace(/,/g, ", ")}</code>
          </p>
        </div>
      </Example>

      <Example caption="The panel on its own, as it fills the dialog: it can sit in a split view, beside a form. Searching, sorting and paging all go through the one loader.">
        <div className="overflow-hidden rounded-xl border border-border bg-card py-4 text-card-foreground shadow-xs">
          <RecordLookupPanel columns={COLUMNS} loadRows={loadCustomers} picked={picked} onPickedChange={setPicked} title="Customers" autoFocus={false} />
        </div>
      </Example>
    </div>
  );
}
