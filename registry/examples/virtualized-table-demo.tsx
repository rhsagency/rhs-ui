"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import type { TableSort } from "@rhs-ui/primitives/table";
import { VirtualizedTable, type VirtualRange, type VirtualizedColumn } from "@rhs-ui/dashboard/virtualized-table";

/** A small seeded generator, so the server and the browser draw the same 12,430 orders. */
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(list: readonly T[], roll: number): T => list[Math.floor(roll * list.length)] as T;

type OrderStatus = "Paid" | "Pending" | "Shipped" | "Refunded";

interface Order {
  id: number;
  number: string;
  customer: string;
  email: string;
  placed: number;
  status: OrderStatus;
  total: number;
}

const FIRST = ["Sofia", "Mo", "Priya", "Tom", "Hana", "Joost", "Anna", "Lena", "Ibrahim", "Mei", "Noor", "Daan", "Elif", "Marco", "Ines", "Jonas", "Freya", "Kofi", "Lucia", "Pieter"];
const LAST = ["Alvarez", "Haddad", "Nair", "Jansen", "Okafor", "de Boer", "de Vries", "Fischer", "Said", "Tanaka", "Visser", "Bakker", "Demir", "Rossi", "Costa", "Berg", "Smit", "Mensah", "Moretti", "Dekker"];
const DOMAINS = ["halcyon.example", "kestrel.example", "northwind.example", "oakline.example", "fieldnotes.example", "brightharbour.example"];
const STATUSES: readonly OrderStatus[] = ["Paid", "Paid", "Paid", "Paid", "Pending", "Shipped", "Shipped", "Refunded"];
const NEWEST = Date.UTC(2026, 9, 20, 17, 30);

const ORDER_COUNT = 12_430;

function makeOrders(count: number): Order[] {
  const roll = random(20261020);
  return Array.from({ length: count }, (_, index) => {
    const first = pick(FIRST, roll());
    const last = pick(LAST, roll());
    return {
      id: index,
      number: `#${10_000 + count - index}`,
      customer: `${first} ${last}`,
      email: `${first}.${last}`.toLowerCase().replace(/\s+/g, "") + `@${pick(DOMAINS, roll())}`,
      placed: NEWEST - index * 2_600_000 - Math.floor(roll() * 900_000),
      status: pick(STATUSES, roll()),
      total: Math.round((18 + roll() * roll() * 940) * 100) / 100,
    };
  });
}

const orders = makeOrders(ORDER_COUNT);

type OrderSortKey = "number" | "customer" | "placed" | "total";
/** Each comparator puts the column in ascending order. A smaller order number is a later row, because the data is newest first. */
const ascending: Record<OrderSortKey, (a: Order, b: Order) => number> = {
  number: (a, b) => b.id - a.id,
  customer: (a, b) => a.customer.localeCompare(b.customer, "en") || a.id - b.id,
  placed: (a, b) => a.placed - b.placed,
  total: (a, b) => a.total - b.total || a.id - b.id,
};

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const figure = new Intl.NumberFormat("en-US");

/** Every status is an outline, so the pill still shows on a selected row; the quieter ones are set in the muted colour. */
const STATUS_TONE: Record<OrderStatus, string> = { Paid: "", Shipped: "", Pending: "text-muted-foreground", Refunded: "text-muted-foreground" };

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogLine {
  id: number;
  time: string;
  level: LogLevel;
  service: string;
  message: string;
}

const LOG_COUNT = 50_000;

function makeLog(lines: number): LogLine[] {
  const roll = random(1020);
  const services = ["api-gateway", "billing", "search", "webhooks", "auth", "mailer"];
  const info = ["Request completed in", "Cache hit for session", "Job finished in", "Connection reused after", "Health check passed in"];
  const base = Date.UTC(2026, 9, 20, 14, 2, 11, 482);
  return Array.from({ length: lines }, (_, index) => {
    const chance = roll();
    // The first screen shows every weight: a WARN and an ERROR sit among the INFO lines at the top.
    const level: LogLevel = index === 2 ? "WARN" : index === 5 ? "ERROR" : chance > 0.97 ? "ERROR" : chance > 0.88 ? "WARN" : "INFO";
    const ms = Math.floor(8 + roll() * roll() * 900);
    const message =
      level === "ERROR"
        ? pick(["Upstream timed out after 5,000 ms", "Payment provider returned 502", "Could not acquire a database connection"], roll())
        : level === "WARN"
          ? pick([`Retrying webhook delivery (attempt ${2 + Math.floor(roll() * 3)} of 5)`, `Slow query: ${ms * 3} ms`, "Rate limit at 90% for this key"], roll())
          : `${pick(info, roll())} ${ms} ms`;
    return {
      id: index,
      time: new Date(base - index * 137).toISOString().replace("T", " ").replace("Z", ""),
      level,
      service: pick(services, roll()),
      message,
    };
  });
}

const log = makeLog(LOG_COUNT);

const logColumns: VirtualizedColumn<LogLine>[] = [
  { id: "time", header: "Time (UTC)", width: 210, cell: (line) => <span className="font-mono text-xs text-muted-foreground tabular-nums">{line.time}</span> },
  {
    id: "level",
    header: "Level",
    width: 90,
    cell: (line) => <span className={line.level === "ERROR" ? "font-semibold" : line.level === "WARN" ? "font-medium" : "text-muted-foreground"}>{line.level}</span>,
  },
  { id: "service", header: "Service", width: 150, cell: (line) => <span className="font-mono text-xs">{line.service}</span> },
  { id: "message", header: "Message", cell: (line) => line.message },
];

function Example({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 mb-5 max-w-3xl text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [sort, setSort] = useState<{ key: OrderSortKey; direction: "ascending" | "descending" }>({ key: "number", direction: "descending" });
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set([3, 4]));
  const [ordersRange, setOrdersRange] = useState<VirtualRange | null>(null);
  const [logRange, setLogRange] = useState<VirtualRange | null>(null);

  const sorted = useMemo(() => {
    const ordered = [...orders].sort(ascending[sort.key]);
    return sort.direction === "ascending" ? ordered : ordered.reverse();
  }, [sort]);

  const sortOn = (key: OrderSortKey): TableSort => (sort.key === key ? sort.direction : "none");
  const sortBy = (key: OrderSortKey) => (): void =>
    setSort((before) => (before.key === key ? { key, direction: before.direction === "ascending" ? "descending" : "ascending" } : { key, direction: key === "customer" ? "ascending" : "descending" }));

  const everyRow = selected.size === orders.length;
  const orderColumns: VirtualizedColumn<Order>[] = [
    {
      id: "select",
      width: 52,
      header: (
        <Checkbox
          aria-label="Select all orders"
          checked={everyRow ? true : selected.size > 0 ? "indeterminate" : false}
          onCheckedChange={(checked) => setSelected(checked === true ? new Set(orders.map((order) => order.id)) : new Set())}
        />
      ),
      cell: (order) => (
        <Checkbox
          aria-label={`Select order ${order.number}`}
          checked={selected.has(order.id)}
          onCheckedChange={(checked) =>
            setSelected((before) => {
              const next = new Set(before);
              if (checked === true) next.add(order.id);
              else next.delete(order.id);
              return next;
            })
          }
        />
      ),
    },
    { id: "number", header: "Order", width: 116, sort: sortOn("number"), onSort: sortBy("number"), cell: (order) => <span className="font-medium tabular-nums">{order.number}</span> },
    {
      id: "customer",
      header: "Customer",
      sort: sortOn("customer"),
      onSort: sortBy("customer"),
      cell: (order) => (
        <span className="block leading-tight">
          <span className="block truncate font-medium">{order.customer}</span>
          <span className="block truncate text-xs text-muted-foreground">{order.email}</span>
        </span>
      ),
    },
    { id: "placed", header: "Placed", width: 140, sort: sortOn("placed"), onSort: sortBy("placed"), cell: (order) => <span className="text-muted-foreground tabular-nums">{day.format(order.placed)}</span> },
    { id: "status", header: "Status", width: 116, cell: (order) => (
        <Badge variant="outline" className={STATUS_TONE[order.status]}>
          {order.status}
        </Badge>
      ),
    },
    { id: "total", header: "Total", width: 124, align: "right", sort: sortOn("total"), onSort: sortBy("total"), cell: (order) => <span className="tabular-nums">{euro.format(order.total)}</span> },
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:px-6">
      <Example
        title="Twelve thousand orders"
        description={
          <>
            {figure.format(ORDER_COUNT)} orders, {ordersRange ? <span className="font-medium text-foreground tabular-nums">{ordersRange.end - ordersRange.start}</span> : "a few dozen"} of them in the DOM. Sort a column, select rows and
            drag the scrollbar to the end: it is the real length of the list.
          </>
        }
      >
        <div className="grid gap-3">
          <p role="status" className="min-h-5 text-sm text-muted-foreground tabular-nums">
            {selected.size === 0 ? "No orders selected" : `${figure.format(selected.size)} ${selected.size === 1 ? "order" : "orders"} selected`}
          </p>
          <VirtualizedTable
            caption="Orders"
            rows={sorted}
            columns={orderColumns}
            height={480}
            getRowKey={(order) => order.id}
            getRowProps={(order) => ({ "data-state": selected.has(order.id) ? "selected" : undefined })}
            onRangeChange={setOrdersRange}
          />
        </div>
      </Example>

      <Example
        title="Fifty thousand log lines"
        description={
          <>
            A compact 32px row and a larger overscan, for a log you scroll fast. {logRange ? <span className="font-medium text-foreground tabular-nums">{logRange.end - logRange.start}</span> : "A few dozen"} of{" "}
            {figure.format(LOG_COUNT)} lines are rendered.
          </>
        }
      >
        <VirtualizedTable caption="Event log" rows={log} columns={logColumns} rowHeight={32} overscan={12} height={296} getRowKey={(line) => line.id} onRangeChange={setLogRange} />
      </Example>
    </div>
  );
}
