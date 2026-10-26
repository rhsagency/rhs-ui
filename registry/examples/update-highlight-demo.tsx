"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { UpdateHighlight } from "@rhs-ui/primitives/update-highlight";

interface Product {
  sku: string;
  name: string;
  stock: number;
  price: number;
}

const PRODUCTS: readonly Product[] = [
  { sku: "KE-0418", name: "Kestrel pour-over kettle", stock: 42, price: 79 },
  { sku: "HA-2210", name: "Halcyon ceramic mug", stock: 118, price: 18.5 },
  { sku: "NW-0731", name: "Northwind burr grinder", stock: 23, price: 129 },
  { sku: "NW-0902", name: "Northwind coffee beans, 1 kg", stock: 64, price: 24.9 },
  { sku: "KE-0555", name: "Kestrel travel tumbler", stock: 9, price: 32 },
];

/** Sales and restocks in turn, so the stock drifts and comes back and the feed can run for as long as the page is open. */
const STEPS = [
  { row: 2, change: -1 },
  { row: 4, change: -2 },
  { row: 0, change: -1 },
  { row: 3, change: -3 },
  { row: 2, change: 1 },
  { row: 4, change: 2 },
  { row: 0, change: 1 },
  { row: 3, change: 3 },
] as const;

const TICKETS = [18, 16, 17, 19, 18, 17] as const;

const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const FACTS = ["The first value is never marked, so nothing flashes on load", "A burst of changes restarts one highlight instead of stacking", "A screen reader hears an update you asked for, in one polite message; the live feed stays quiet"] as const;

export default function Demo(): React.JSX.Element {
  const [products, setProducts] = useState(PRODUCTS);
  const [sales, setSales] = useState(12480.5);
  const [tickets, setTickets] = useState(17);
  const [live, setLive] = useState(true);
  // Only an update somebody pressed for is announced. A feed that talked every few seconds would bury a page, so it stays quiet.
  const [asked, setAsked] = useState(false);
  const ticks = useRef(0);

  /** One event from the warehouse: a sale or a restock, and the day's numbers move with it. */
  const tick = useCallback((byHand = false) => {
    const index = ticks.current;
    ticks.current += 1;
    setAsked(byHand);
    const step = STEPS[index % STEPS.length] ?? STEPS[0];
    setProducts((current) => current.map((product, row) => (row === step.row ? { ...product, stock: product.stock + step.change } : product)));
    if (step.change < 0) setSales((total) => total - step.change * (PRODUCTS[step.row]?.price ?? 0));
    setTickets(TICKETS[index % TICKETS.length] ?? 17);
  }, []);

  // The first event comes right after the page opens, so a highlight is already in view; the rest follow every few seconds.
  useEffect(() => {
    if (!live) return;
    const first = ticks.current === 0 ? window.setTimeout(() => tick(), 150) : undefined;
    const every = window.setInterval(() => tick(), 2600);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(every);
    };
  }, [live, tick]);

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
      <Example caption="Whole rows light up when a count changes. Pause the feed, or push an update yourself">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
            <div className="grid gap-0.5">
              <h2 className="text-sm font-medium tracking-[-0.01em]">Warehouse stock</h2>
              <p className="text-xs text-muted-foreground">Halcyon, Rotterdam</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch id="update-highlight-live" checked={live} onCheckedChange={setLive} />
                <Label htmlFor="update-highlight-live" className="text-xs text-muted-foreground">
                  Live
                </Label>
              </div>
              <Button variant="outline" size="sm" onClick={() => tick(true)}>
                Update now
              </Button>
            </div>
          </div>
          <Table>
            <TableCaption className="sr-only">Stock per product. A row lights up when its count changes.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <UpdateHighlight key={product.sku} asChild changeKey={product.stock} announce={asked ? `${product.name}: ${product.stock} in stock` : ""}>
                  <TableRow>
                    <TableCell className="py-3">
                      <span className="block font-medium">{product.name}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">{product.sku}</span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{product.stock}</TableCell>
                    <TableCell className="text-right tabular-nums">{MONEY.format(product.price)}</TableCell>
                  </TableRow>
                </UpdateHighlight>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="A number in a card fades the same way">
          <div className="grid gap-1 rounded-xl border border-border bg-card p-5 shadow-xs">
            <p className="text-xs text-muted-foreground">Sales today</p>
            <p className="text-3xl font-medium tracking-[-0.04em] tabular-nums">
              <UpdateHighlight inline changeKey={sales} announce={asked ? `Sales today ${MONEY.format(sales)}` : ""} className="-mx-2 rounded-md px-2">
                {MONEY.format(sales)}
              </UpdateHighlight>
            </p>
          </div>
        </Example>

        <Example caption="Under reduced motion there is no fade: a short marker says it changed">
          <div className="grid gap-1 rounded-xl border border-border bg-card p-5 shadow-xs">
            <p className="text-xs text-muted-foreground">Open tickets</p>
            <p className="text-3xl font-medium tracking-[-0.04em] tabular-nums">
              <UpdateHighlight inline reduceMotion changeKey={tickets} announce={asked ? `${tickets} open tickets` : ""}>
                {tickets}
              </UpdateHighlight>
            </p>
          </div>
        </Example>

        <ul className="grid gap-2.5 text-sm text-muted-foreground">
          {FACTS.map((fact) => (
            <li key={fact} className="flex items-start gap-2.5">
              <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" className="mt-1 shrink-0 text-foreground" />
              {fact}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
