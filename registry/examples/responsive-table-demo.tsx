import type { ReactNode } from "react";

import { IconCheck, IconClock, IconTruck } from "@rhs-ui/icons";
import { ResponsiveTable, type ResponsiveColumn } from "@rhs-ui/primitives/responsive-table";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

type Shipment = { id: string; customer: string; destination: string; carrier: string; kilos: number; status: "in-transit" | "delivered" | "delayed"; total: number };

const SHIPMENTS: readonly Shipment[] = [
  { id: "SH-20418", customer: "Kestrel Analytics", destination: "Rotterdam, NL", carrier: "Fjord Freight", kilos: 412, status: "in-transit", total: 1840 },
  { id: "SH-20417", customer: "Halcyon Labs", destination: "Antwerp, BE", carrier: "Polder Logistics", kilos: 96, status: "delivered", total: 620 },
  { id: "SH-20414", customer: "Northwind Traders", destination: "Lille, FR", carrier: "Fjord Freight", kilos: 1280, status: "delayed", total: 2375.5 },
  { id: "SH-20409", customer: "Oak Lane Bakery", destination: "Utrecht, NL", carrier: "Atlas Rail", kilos: 38, status: "delivered", total: 310 },
  { id: "SH-20406", customer: "Mirror Labs", destination: "Ghent, BE", carrier: "Polder Logistics", kilos: 224, status: "in-transit", total: 4200 },
];

const STATUSES: Readonly<Record<string, StatusDefinition>> = {
  "in-transit": { label: "In transit", glyph: <IconTruck />, emphasis: "outline" },
  delivered: { label: "Delivered", glyph: <IconCheck />, emphasis: "soft" },
  delayed: { label: "Delayed", glyph: <IconClock />, emphasis: "critical" },
};

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const weight = new Intl.NumberFormat("en-IE");

const COLUMNS: readonly ResponsiveColumn<Shipment>[] = [
  { key: "id", header: "Shipment", cell: (row) => <span className="font-mono">{row.id}</span> },
  { key: "customer", header: "Customer" },
  { key: "destination", header: "Destination", priority: 2, className: "text-muted-foreground" },
  { key: "carrier", header: "Carrier", priority: 3, className: "text-muted-foreground" },
  { key: "kilos", header: "Weight", priority: 3, align: "right", className: "tabular-nums", cell: (row) => `${weight.format(row.kilos)} kg` },
  { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} statuses={STATUSES} /> },
  { key: "total", header: "Total", align: "right", className: "tabular-nums", cell: (row) => euro.format(row.total) },
];

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 p-2 sm:p-6">
      <Example caption="In a wide box it is a table: every column that matters shows. As the box narrows the carrier and the weight step aside first, then the destination">
        <ResponsiveTable columns={COLUMNS} rows={SHIPMENTS} caption="Shipments this week" />
      </Example>

      {/* Under sm the page is narrower than this box, so it would be a second stack of cards under the first: the third example is the card layout, on purpose. */}
      <Example className="hidden sm:grid" caption="The same table in a box 44rem wide: the container decides, not the window, so a sidebar or a dialog behaves like this one">
        <div className="max-w-[44rem]">
          <ResponsiveTable columns={COLUMNS} rows={SHIPMENTS.slice(0, 4)} caption="Shipments this week" />
        </div>
      </Example>

      <Example caption="In a box 20rem wide every row is a card: the shipment is the title, each value keeps its column heading, and the whole card is the link">
        <div className="max-w-80">
          <ResponsiveTable columns={COLUMNS} rows={SHIPMENTS.slice(0, 3)} getRowHref={(row) => `#${row.id}`} caption="Shipments this week" />
        </div>
      </Example>
    </div>
  );
}
