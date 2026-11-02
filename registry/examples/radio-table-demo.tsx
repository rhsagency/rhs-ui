"use client";

import { useState, type ReactNode } from "react";

import { RadioTable, type RadioTableColumn, type RadioTableRow } from "@rhs-ui/primitives/radio-table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const euro = (value: unknown) => `€${value}`;

const SERVERS: readonly RadioTableColumn[] = [
  { key: "name", label: "Size" },
  { key: "memory", label: "Memory", format: (value) => `${value} GB`, speak: (value) => `${value} GB memory` },
  { key: "cpus", label: "vCPUs", speak: (value) => `${value} ${value === 1 ? "CPU" : "CPUs"}` },
  { key: "disk", label: "Disk", format: (value) => `${value} GB`, speak: (value) => `${value} GB disk` },
  { key: "price", label: "Per month", format: euro, speak: (value) => `${value} euros per month` },
];

const SERVER_ROWS: readonly RadioTableRow[] = [
  { value: "starter", cells: { name: "Starter", memory: 2, cpus: 1, disk: 40, price: 12 }, note: "Side projects and staging" },
  { value: "standard", cells: { name: "Standard", memory: 8, cpus: 4, disk: 160, price: 48 }, note: "Most popular for production" },
  { value: "performance", cells: { name: "Performance", memory: 16, cpus: 8, disk: 320, price: 96 } },
  { value: "dedicated", cells: { name: "Dedicated", memory: 64, cpus: 16, disk: 1000, price: 380 }, disabled: "Sold out until 14 November" },
];

const SLOTS: readonly RadioTableColumn[] = [
  { key: "slot", label: "Delivery" },
  { key: "arrives", label: "Arrives", align: "end" },
  { key: "cost", label: "Cost", format: (value) => (value === 0 ? "Free" : `€${(value as number).toFixed(2)}`), speak: (value) => (value === 0 ? "free" : `${(value as number).toFixed(2)} euros`) },
];

const SLOT_ROWS: readonly RadioTableRow[] = [
  { value: "standard", cells: { slot: "Standard", arrives: "Thu 5 Nov", cost: 0 } },
  { value: "tomorrow", cells: { slot: "Tomorrow", arrives: "Wed 4 Nov", cost: 4.95 } },
  { value: "morning", cells: { slot: "Tomorrow morning", arrives: "Wed 4 Nov, by 12:00", cost: 9.5 } },
  { value: "sunday", cells: { slot: "Sunday", arrives: "Sun 8 Nov", cost: 7.5 }, disabled: "Not offered to your postcode" },
];

export default function Demo(): React.JSX.Element {
  const [server, setServer] = useState<string | null>("standard");
  const [slot, setSlot] = useState<string | null>("tomorrow");
  const chosen = SERVER_ROWS.find((row) => row.value === server);
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-12 px-5 py-10 sm:px-8">
      <Example caption="Try it: the rows are one radio group, so the arrow keys move and choose. A screen reader reads each row's figures with its radio.">
        <div className="grid gap-4">
          <RadioTable
            legend="Choose a server size"
            description="Northwind Cloud bills by the hour and caps at the monthly price. You can resize later."
            columns={SERVERS}
            rows={SERVER_ROWS}
            value={server}
            onValueChange={setServer}
            name="server"
          />
          <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify(server)}</code>
            {chosen ? <span className="basis-full text-sm text-foreground">{chosen.cells.name} is €{chosen.cells.price} a month.</span> : null}
          </p>
        </div>
      </Example>

      <div className="grid gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
        <Example caption="Narrower than 560px each row becomes a card, with the headings beside the values">
          <RadioTable legend="Delivery" columns={SLOTS} rows={SLOT_ROWS} value={slot} onValueChange={setSlot} />
        </Example>
        <Example caption="Disabled: every row is off">
          <RadioTable legend="Delivery" columns={SLOTS} rows={SLOT_ROWS.slice(0, 3)} disabled defaultValue="standard" />
        </Example>
      </div>
    </div>
  );
}
