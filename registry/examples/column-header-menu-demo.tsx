"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { ColumnHeaderMenu, type ColumnPin } from "@rhs-ui/primitives/column-header-menu";
import { Table, TableBody, TableCell, TableHeader, TableRow, type TableSort } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

type Plan = "Starter" | "Team" | "Business" | "Enterprise";
type Account = { id: string; name: string; plan: Plan; seats: number; mrr: number; renews: string };
type Key = "name" | "plan" | "seats" | "mrr" | "renews";
type SortState = { key: Key; direction: "ascending" | "descending" } | null;

const ACCOUNTS: readonly Account[] = [
  { id: "a1", name: "Kestrel Analytics", plan: "Enterprise", seats: 240, mrr: 18420, renews: "2027-03-01" },
  { id: "a2", name: "Halcyon Labs", plan: "Business", seats: 64, mrr: 5120, renews: "2026-12-14" },
  { id: "a3", name: "Northwind Traders", plan: "Business", seats: 88, mrr: 7040, renews: "2027-01-22" },
  { id: "a4", name: "Oak Lane Bakery", plan: "Starter", seats: 6, mrr: 114, renews: "2026-11-30" },
  { id: "a5", name: "Mirror Labs", plan: "Team", seats: 22, mrr: 1760, renews: "2027-02-09" },
  { id: "a6", name: "Fjord Freight", plan: "Team", seats: 31, mrr: 2480, renews: "2026-12-02" },
  { id: "a7", name: "Lumen Energy", plan: "Enterprise", seats: 410, mrr: 29800, renews: "2027-05-18" },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const day = new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeZone: "UTC" });
const PLAN_RANK: Record<Plan, number> = { Starter: 0, Team: 1, Business: 2, Enterprise: 3 };

interface Column {
  key: Key;
  label: string;
  width: number;
  align?: "left" | "right";
  className?: string;
  compare: (a: Account, b: Account) => number;
  cell: (row: Account) => ReactNode;
}

const COLUMNS: readonly Column[] = [
  { key: "name", label: "Customer", width: 224, className: "font-medium", compare: (a, b) => a.name.localeCompare(b.name, "en"), cell: (row) => row.name },
  { key: "plan", label: "Plan", width: 136, compare: (a, b) => PLAN_RANK[a.plan] - PLAN_RANK[b.plan], cell: (row) => row.plan },
  { key: "seats", label: "Seats", width: 120, align: "right", className: "tabular-nums", compare: (a, b) => a.seats - b.seats, cell: (row) => row.seats },
  { key: "mrr", label: "MRR", width: 140, align: "right", className: "tabular-nums", compare: (a, b) => a.mrr - b.mrr, cell: (row) => euro.format(row.mrr) },
  { key: "renews", label: "Renews", width: 140, className: "text-muted-foreground", compare: (a, b) => a.renews.localeCompare(b.renews), cell: (row) => day.format(new Date(row.renews)) },
];

/** True on a phone-sized screen (below the sm breakpoint). The server and the first paint say false, and the browser corrects it. */
function useCompact(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(max-width: 639px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
}

const START_SORT: SortState = { key: "mrr", direction: "descending" };
const START_PINS: Partial<Record<Key, ColumnPin>> = { name: "left" };

/** Every group on one header, with a real table behind it: sorting, hiding and pinning all change what is drawn. */
function AccountsTable(): React.JSX.Element {
  const [sort, setSort] = useState<SortState>(START_SORT);
  const [hidden, setHidden] = useState<readonly Key[]>([]);
  const [pins, setPins] = useState<Partial<Record<Key, ColumnPin>>>(START_PINS);
  const [said, setSaid] = useState("Open a column menu to sort, hide or pin it.");
  const region = useRef<HTMLDivElement>(null);
  // The pinned name column is narrower on a phone, so more of the columns that scroll past it stay in view.
  const compact = useCompact();
  const widthOf = (column: Column) => (compact && column.key === "name" ? 160 : column.width);

  const rows = useMemo(() => {
    const column = sort ? COLUMNS.find((item) => item.key === sort.key) : undefined;
    if (!sort || !column) return ACCOUNTS;
    const sign = sort.direction === "ascending" ? 1 : -1;
    return [...ACCOUNTS].sort((a, b) => column.compare(a, b) * sign);
  }, [sort]);

  // Pinned columns move to their edge, and stay there when the table scrolls sideways.
  const shown = COLUMNS.filter((column) => !hidden.includes(column.key));
  const lefts = shown.filter((column) => pins[column.key] === "left");
  const rights = shown.filter((column) => pins[column.key] === "right");
  const ordered = [...lefts, ...shown.filter((column) => !pins[column.key]), ...rights];
  const total = ordered.reduce((sum, column) => sum + widthOf(column), 0);

  const offset = (column: Column): CSSProperties => {
    if (pins[column.key] === "left") return { left: lefts.slice(0, lefts.indexOf(column)).reduce((sum, item) => sum + widthOf(item), 0) };
    if (pins[column.key] === "right") return { right: rights.slice(rights.indexOf(column) + 1).reduce((sum, item) => sum + widthOf(item), 0) };
    return {};
  };
  const edge = (column: Column) => cn(column === lefts.at(-1) && "border-r border-border", column === rights[0] && "border-l border-border");
  const nameOf = (key: Key) => COLUMNS.find((column) => column.key === key)?.label ?? key;

  function changeSort(key: Key, next: TableSort) {
    if (next === "none") {
      setSort(null);
      setSaid("Sort cleared. The rows are back in their original order.");
    } else {
      setSort({ key, direction: next });
      setSaid(`Sorted by ${nameOf(key)}, ${next}.`);
    }
  }

  function hide(key: Key) {
    setHidden((list) => [...list, key]);
    setSort((current) => (current?.key === key ? null : current));
    setSaid(`${nameOf(key)} hidden.`);
    // The button that was pressed leaves with its column: put the focus on the table, not on the page.
    region.current?.focus();
  }

  function pin(key: Key, side: ColumnPin | null) {
    setPins((current) => {
      const next = { ...current };
      if (side) next[key] = side;
      else delete next[key];
      return next;
    });
    setSaid(side ? `${nameOf(key)} pinned ${side}.` : `${nameOf(key)} unpinned.`);
  }

  function reset() {
    setSort(START_SORT);
    setHidden([]);
    setPins(START_PINS);
    setSaid("The view is back as it was.");
  }

  const untouched = sort?.key === START_SORT?.key && sort?.direction === START_SORT?.direction && hidden.length === 0 && Object.keys(pins).length === 1 && pins.name === "left";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div ref={region} role="region" aria-label="Customer accounts" tabIndex={-1} className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        <Table
          className="min-w-full table-fixed border-separate border-spacing-0 [&_td]:border-b [&_td]:border-border [&_th]:border-b [&_th]:border-border [&_tbody_tr:last-child_td]:border-b-0"
          style={{ width: total }}
        >
          <TableHeader>
            <TableRow>
              {ordered.map((column) => (
                <ColumnHeaderMenu
                  key={column.key}
                  label={column.label}
                  align={column.align}
                  sort={sort?.key === column.key ? sort.direction : "none"}
                  onSortChange={(next) => changeSort(column.key, next)}
                  onHide={shown.length > 1 ? () => hide(column.key) : undefined}
                  pinned={pins[column.key] ?? null}
                  onPinChange={(side) => pin(column.key, side)}
                  className={cn(pins[column.key] && "sticky z-20 bg-card", edge(column))}
                  style={{ width: widthOf(column), ...offset(column) }}
                />
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="hover:bg-transparent">
                {ordered.map((column) => (
                  <TableCell
                    key={column.key}
                    className={cn("truncate", column.align === "right" && "text-right", column.className, pins[column.key] && "sticky z-10 bg-card", edge(column))}
                    style={offset(column)}
                  >
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex min-h-12 items-center justify-between gap-3 border-t border-border px-4 py-2">
        <p role="status" className="min-w-0 text-xs text-muted-foreground">
          {said}
        </p>
        <Button type="button" variant="ghost" size="sm" disabled={untouched} onClick={reset} className="shrink-0">
          Reset view
        </Button>
      </div>
    </div>
  );
}

type Stock = { sku: string; product: string; onHand: number; supplier: string };

const STOCK: readonly Stock[] = [
  { sku: "NW-1207", product: "Halcyon desk lamp", onHand: 23, supplier: "Fjord Supply" },
  { sku: "NW-1214", product: "Kestrel backpack", onHand: 97, supplier: "Kestrel Goods" },
  { sku: "NW-1221", product: "Oak Lane tea towel", onHand: 134, supplier: "Oak & Ash" },
  { sku: "NW-1228", product: "Mirror Labs speaker", onHand: 41, supplier: "Polder Trading" },
];

/** Only the callbacks you pass show up: each header offers a different set. */
function StockTable(): React.JSX.Element {
  const [sort, setSort] = useState<{ key: "product" | "onHand"; direction: "ascending" | "descending" } | null>(null);
  const [hidden, setHidden] = useState<readonly ("onHand" | "supplier")[]>([]);

  const rows = useMemo(() => {
    if (!sort) return STOCK;
    const sign = sort.direction === "ascending" ? 1 : -1;
    return [...STOCK].sort((a, b) => (sort.key === "product" ? a.product.localeCompare(b.product, "en") : a.onHand - b.onHand) * sign);
  }, [sort]);

  const stateOf = (key: "product" | "onHand"): TableSort => (sort?.key === key ? sort.direction : "none");
  const change = (key: "product" | "onHand") => (next: TableSort) => setSort(next === "none" ? null : { key, direction: next });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <ColumnHeaderMenu label="Product" sort={stateOf("product")} onSortChange={change("product")} />
            {hidden.includes("onHand") ? null : (
              <ColumnHeaderMenu
                label="On hand"
                align="right"
                sort={stateOf("onHand")}
                onSortChange={change("onHand")}
                onHide={() => {
                  setHidden((list) => [...list, "onHand"]);
                  setSort((current) => (current?.key === "onHand" ? null : current));
                }}
              />
            )}
            {hidden.includes("supplier") ? null : <ColumnHeaderMenu label="Supplier" className="hidden sm:table-cell" onHide={() => setHidden((list) => [...list, "supplier"])} />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.sku}>
              <TableCell className="font-medium">{row.product}</TableCell>
              {hidden.includes("onHand") ? null : <TableCell className="text-right tabular-nums">{row.onHand}</TableCell>}
              {hidden.includes("supplier") ? null : <TableCell className="hidden text-muted-foreground sm:table-cell">{row.supplier}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hidden.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">{hidden.length === 1 ? "1 column hidden" : `${hidden.length} columns hidden`}</p>
          <Button type="button" variant="ghost" size="sm" onClick={() => setHidden([])}>
            Show all columns
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10">
      <Example caption="Every group on one header; pinned columns stay put when the table scrolls sideways">
        <AccountsTable />
      </Example>
      <Example caption="Each header offers only the callbacks you pass: sort, sort and hide, or hide only">
        <StockTable />
      </Example>
    </div>
  );
}
