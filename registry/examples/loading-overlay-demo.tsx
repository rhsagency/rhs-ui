"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconRefresh } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LoadingOverlay } from "@rhs-ui/primitives/loading-overlay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

function Example({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-1 content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ORDERS = [
  { id: "NW-1048", customer: "Halcyon Studio", total: "€1,240.00", status: "Paid" },
  { id: "NW-1047", customer: "Kestrel & Co", total: "€86.50", status: "Shipped" },
  { id: "NW-1046", customer: "Polder Bakery", total: "€312.00", status: "Paid" },
  { id: "NW-1045", customer: "Lumen Labs", total: "€2,980.00", status: "Pending" },
] as const;

/**
 * The card is its own container, so the columns follow the room the card has, not the width of the page: below 26rem the status goes, below 20rem the order number goes,
 * and every row stays on one line in a column of any width.
 */
function OrdersTable(): React.JSX.Element {
  return (
    <div className="@container rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Recent orders</h2>
        <Button variant="outline" size="sm">
          Export
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 @max-[20rem]:hidden">Order</TableHead>
            <TableHead className="@max-[20rem]:pl-5">Customer</TableHead>
            <TableHead className="pr-5 text-right @[26rem]:pr-3">Total</TableHead>
            <TableHead className="hidden pr-5 @[26rem]:table-cell">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ORDERS.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="pl-5 font-mono text-[0.8125rem] whitespace-nowrap @max-[20rem]:hidden">{order.id}</TableCell>
              <TableCell className="@max-[20rem]:pl-5">{order.customer}</TableCell>
              <TableCell className="pr-5 text-right tabular-nums @[26rem]:pr-3">{order.total}</TableCell>
              <TableCell className="hidden pr-5 @[26rem]:table-cell">
                <Badge variant={order.status === "Pending" ? "muted" : "outline"}>{order.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function AddressForm(): React.JSX.Element {
  return (
    <form className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs" onSubmit={(event) => event.preventDefault()}>
      <h2 className="text-sm font-medium tracking-[-0.01em]">Delivery address</h2>
      <div className="grid gap-1.5">
        <Label htmlFor="overlay-name">Full name</Label>
        <Input id="overlay-name" defaultValue="Mara de Vries" autoComplete="off" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="overlay-street">Street and number</Label>
        <Input id="overlay-street" defaultValue="Keizersgracht 214" autoComplete="off" />
      </div>
      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="overlay-postcode">Postcode</Label>
          <Input id="overlay-postcode" defaultValue="1016 EA" autoComplete="off" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="overlay-city">City</Label>
          <Input id="overlay-city" defaultValue="Amsterdam" autoComplete="off" />
        </div>
      </div>
      <Button type="submit" className="w-fit">
        Save address
      </Button>
    </form>
  );
}

const REGIONS = [
  { value: "emea", label: "EMEA" },
  { value: "americas", label: "Americas" },
  { value: "apac", label: "Asia Pacific" },
] as const;
type Region = (typeof REGIONS)[number]["value"];

const SPEEDS = [
  { value: "slow", label: "Slow, 2.4 s" },
  { value: "fast", label: "Fast, 120 ms" },
] as const;
type Speed = (typeof SPEEDS)[number]["value"];

const REVENUE: Record<Region, readonly { line: string; orders: number; revenue: number }[]> = {
  emea: [
    { line: "Trail bottles", orders: 1284, revenue: 31840 },
    { line: "Camp stoves", orders: 612, revenue: 48210 },
    { line: "Merino base layers", orders: 934, revenue: 52780 },
    { line: "Headlamps", orders: 1471, revenue: 28940 },
  ],
  americas: [
    { line: "Trail bottles", orders: 2210, revenue: 55120 },
    { line: "Camp stoves", orders: 1098, revenue: 86400 },
    { line: "Merino base layers", orders: 1560, revenue: 91350 },
    { line: "Headlamps", orders: 2043, revenue: 40220 },
  ],
  apac: [
    { line: "Trail bottles", orders: 804, revenue: 19760 },
    { line: "Camp stoves", orders: 377, revenue: 30190 },
    { line: "Merino base layers", orders: 692, revenue: 40040 },
    { line: "Headlamps", orders: 1189, revenue: 23610 },
  ],
};

const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const count = new Intl.NumberFormat("en-US");

function LiveCard(): React.JSX.Element {
  // What the person picked shows at once; the data on screen is swapped when the "response" arrives.
  const [selected, setSelected] = useState<Region>("emea");
  const [shown, setShown] = useState<Region>("emea");
  const [speed, setSpeed] = useState<Speed>("slow");
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Pretends to fetch: the old rows stay under the overlay and are swapped when the response arrives. */
  function load(next: Region) {
    window.clearTimeout(timer.current);
    setSelected(next);
    setLoading(true);
    timer.current = window.setTimeout(
      () => {
        setShown(next);
        setLoading(false);
      },
      speed === "slow" ? 2400 : 120,
    );
  }

  const rows = REVENUE[shown];
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="grid gap-1.5">
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            Region
          </span>
          <SegmentedControl label="Region" value={selected} onValueChange={(next) => load(next as Region)} options={REGIONS} />
        </div>
        <div className="grid gap-1.5">
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            Network
          </span>
          <SegmentedControl label="Network speed" value={speed} onValueChange={(next) => setSpeed(next as Speed)} options={SPEEDS} />
        </div>
        {/* The height of the segmented controls beside it, so the labels sit on one line. */}
        <Button variant="outline" className="h-[2.875rem]" aria-disabled={loading || undefined} onClick={() => (loading ? undefined : load(selected))}>
          <IconRefresh />
          Refresh
        </Button>
      </div>
      <LoadingOverlay loading={loading} label="Updating results" delay={200} minDuration={500} className="rounded-xl">
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Revenue by product line</h2>
            <p className="text-xs text-muted-foreground">Q3 2026, {REGIONS.find((item) => item.value === shown)?.label}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Product line</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Orders</TableHead>
                <TableHead className="pr-5 text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.line}>
                  <TableCell className="pl-5">{row.line}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{count.format(row.orders)}</TableCell>
                  <TableCell className="pr-5 text-right tabular-nums">{euro.format(row.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </LoadingOverlay>
      <p className="text-xs text-muted-foreground">With a 200 ms delay a fast refresh never shows the overlay, and a slow one stays up for at least half a second once it appears.</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    // Two columns only when the preview itself is wide enough for two tables: the page's width says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Example caption="A table while it refreshes: the rows stay put under a scrim and cannot be clicked">
          <LoadingOverlay loading delay={0} label="Updating results" className="rounded-xl">
            <OrdersTable />
          </LoadingOverlay>
        </Example>
        <Example caption="A form while it saves, with blur on">
          <LoadingOverlay loading delay={0} blur label="Saving address" className="rounded-xl">
            <AddressForm />
          </LoadingOverlay>
        </Example>
        <Example caption="Try it: pick a region, or press Refresh" className="@3xl:col-span-2">
          <LiveCard />
        </Example>
      </div>
    </div>
  );
}
