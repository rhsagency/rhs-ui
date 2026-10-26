"use client";

import { useEffect, useRef, useState } from "react";

import { DashboardShell } from "@rhs-ui/application/dashboard-shell";
import { IconAlertCircle, IconClock, IconDownload, IconPin, IconRefresh, IconTrendDown, IconTrendUp } from "@rhs-ui/icons";
import { AutoGrid } from "@rhs-ui/primitives/auto-grid";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Progress } from "@rhs-ui/primitives/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const EURO_CENTS = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const COUNT = new Intl.NumberFormat("en-IE");

/** The figures per period: revenue, orders, average order, return rate, and each one's change on the period before. */
const PERIODS = {
  "7d": { label: "Last 7 days", revenue: 11840, orders: 312, aov: 37.95, returns: 3.1, change: [4.2, 1.8, 2.4, -0.2] },
  "30d": { label: "Last 30 days", revenue: 48230, orders: 1284, aov: 37.56, returns: 2.8, change: [12.4, 3.1, -1.2, -0.4] },
  quarter: { label: "This quarter", revenue: 131900, orders: 3562, aov: 37.03, returns: 2.9, change: [8.7, 6.2, -0.9, 0.1] },
} as const;
type Period = keyof typeof PERIODS;

const ISSUES: Record<string, StatusDefinition> = {
  "payment-failed": { label: "Payment failed", glyph: <IconAlertCircle />, emphasis: "critical" },
  "address-check": { label: "Address needs a check", glyph: <IconPin />, emphasis: "outline" },
  "carrier-delay": { label: "Carrier delay, 2 days", glyph: <IconClock />, emphasis: "outline" },
};

const FLAGGED = [
  { id: "#4824", who: "Marlow & Finch", issue: "payment-failed", amount: 214.5 },
  { id: "#4817", who: "Orchard & Pine", issue: "address-check", amount: 89 },
  { id: "#4809", who: "Brightwater Clinic", issue: "carrier-delay", amount: 342.9 },
  { id: "#4803", who: "Kestrel Labs", issue: "payment-failed", amount: 1180 },
  { id: "#4796", who: "Larkspur Foods", issue: "address-check", amount: 56.2 },
] as const;

const LOW_STOCK = [
  { name: "Ridgeline shell, M", left: 3, of: 40 },
  { name: "Day 22 pack, olive", left: 5, of: 60 },
  { name: "Moraine boot, 43", left: 6, of: 30 },
  { name: "Basin 2P tent", left: 8, of: 25 },
];

const ORDERS = [
  { id: "#4826", who: "Halcyon Studio", channel: "Online", placed: "Today, 09:41", total: 412.8, status: "paid" },
  { id: "#4825", who: "Northwind Outfitters", channel: "Stores", placed: "Today, 09:12", total: 1260, status: "paid" },
  { id: "#4824", who: "Marlow & Finch", channel: "Online", placed: "Today, 08:57", total: 214.5, status: "failed" },
  { id: "#4823", who: "Larkspur Foods", channel: "Online", placed: "Yesterday, 17:30", total: 96, status: "pending" },
  { id: "#4822", who: "Orchard & Pine", channel: "Stores", placed: "Yesterday, 16:05", total: 58.4, status: "paid" },
  { id: "#4821", who: "Kestrel Labs", channel: "Online", placed: "Yesterday, 14:48", total: 733, status: "refunded" },
];

function Kpi({ label, value, change, unit = "%", note }: { label: string; value: string; change: number; unit?: string; note: string }) {
  const up = change >= 0;
  return (
    <Card className="gap-2 py-5 shadow-none">
      <CardContent className="grid gap-1.5 px-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">{value}</p>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-foreground tabular-nums">
            {up ? <IconTrendUp className="size-3.5" /> : <IconTrendDown className="size-3.5" />}
            {up ? "Up" : "Down"} {Math.abs(change).toLocaleString("en-IE")}
            {unit}
          </span>
          <span className="whitespace-nowrap">{note}</span>
        </p>
      </CardContent>
    </Card>
  );
}

export default function Demo(): React.JSX.Element {
  const [period, setPeriod] = useState<Period>("30d");
  const [channel, setChannel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const figures = PERIODS[period];

  // Set after mount, so the server and the browser never disagree about "now".
  useEffect(() => {
    setUpdatedAt(Date.now() - 2 * 60_000);
    return () => window.clearTimeout(timer.current);
  }, []);

  const refresh = () => {
    setLoading(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setUpdatedAt(Date.now());
      setLoading(false);
    }, 1600);
  };

  return (
    <DashboardShell
      className="min-h-[calc(100dvh-3rem)]"
      titleAs="h2"
      title="Store overview"
      description="How the Northwind shop is doing over the period you pick."
      loading={loading}
      updatedAt={updatedAt ?? undefined}
      timeZone="Europe/Amsterdam"
      actions={
        <>
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <IconRefresh />
            Refresh
          </Button>
          <Button>
            <IconDownload />
            Export report
          </Button>
        </>
      }
      filters={
        <>
          <Select value={period} onValueChange={(next) => setPeriod(next as Period)}>
            <SelectTrigger size="sm" aria-label="Period" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIODS) as Period[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {PERIODS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup type="single" size="sm" aria-label="Channel" value={channel} onValueChange={(next) => next && setChannel(next)}>
            <ToggleGroupItem value="all">All channels</ToggleGroupItem>
            <ToggleGroupItem value="online">Online</ToggleGroupItem>
            <ToggleGroupItem value="stores">Stores</ToggleGroupItem>
          </ToggleGroup>
        </>
      }
      kpis={
        <AutoGrid min={10} mode="fit" gap="md">
          <Kpi label="Revenue" value={EURO.format(figures.revenue)} change={figures.change[0]} note="vs last period" />
          <Kpi label="Orders" value={COUNT.format(figures.orders)} change={figures.change[1]} note="vs last period" />
          <Kpi label="Average order" value={EURO_CENTS.format(figures.aov)} change={figures.change[2]} note="vs last period" />
          <Kpi label="Return rate" value={`${figures.returns.toLocaleString("en-IE", { minimumFractionDigits: 1 })}%`} change={figures.change[3]} unit=" pts" note="vs last period" />
        </AutoGrid>
      }
      main={
        <Card className="gap-4 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle>Orders to look at</CardTitle>
            <CardDescription>Flagged by the payment, address and carrier checks.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ul className="divide-y divide-border border-t border-border">
              {FLAGGED.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-medium">
                      {order.id} <span className="font-normal text-muted-foreground">· {order.who}</span>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">{EURO_CENTS.format(order.amount)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.issue} statuses={ISSUES} />
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      }
      side={
        <Card className="gap-4 py-5 shadow-none">
          <CardHeader className="px-5">
            <CardTitle>Low stock</CardTitle>
            <CardDescription>Under a fifth of the usual level.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-5 px-5">
            {LOW_STOCK.map((item) => (
              <div key={item.name} className="grid gap-2">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{item.left} left</span>
                </div>
                <Progress value={item.left} max={item.of} aria-label={`${item.name}: ${item.left} of ${item.of} left`} className="h-1.5" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="mt-auto w-full">
              Reorder these
            </Button>
          </CardContent>
        </Card>
      }
      table={
        <Card className="gap-0 overflow-hidden py-0 shadow-none">
          <CardHeader className="px-5 py-5">
            <CardTitle>Recent orders</CardTitle>
            <CardDescription>The last six, newest first.</CardDescription>
          </CardHeader>
          <Table className="border-t border-border">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5 max-sm:hidden">Order</TableHead>
                <TableHead className="max-sm:pl-5">Customer</TableHead>
                <TableHead className="max-sm:hidden">Channel</TableHead>
                <TableHead className="max-md:hidden">Placed</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-5">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORDERS.filter((order) => channel === "all" || order.channel.toLowerCase() === channel).map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="pl-5 font-medium whitespace-nowrap max-sm:hidden">{order.id}</TableCell>
                  <TableCell className="max-sm:pl-5">
                    {order.who}
                    <span className="block text-xs text-muted-foreground sm:hidden">{order.id}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-sm:hidden">{order.channel}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground max-md:hidden">{order.placed}</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">{EURO_CENTS.format(order.total)}</TableCell>
                  <TableCell className="pr-5">
                    <StatusBadge status={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      }
    />
  );
}
