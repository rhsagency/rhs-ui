"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Ref } from "react";

import { IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TableBodyState } from "@rhs-ui/primitives/table-states";

const ORDERS = [
  { number: "#1048", customer: "Kestrel Analytics", total: 1840 },
  { number: "#1047", customer: "Halcyon Labs", total: 620 },
  { number: "#1046", customer: "Northwind Traders", total: 2375.5 },
  { number: "#1045", customer: "Oak Lane Bakery", total: 310 },
  { number: "#1044", customer: "Mirror Labs", total: 4200 },
] as const;

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

/**
 * The same header over every state, and the same grid under it: it is the point of the item, that nothing moves. A fixed
 * table layout takes its column widths from the header cells, so the skeleton, the message and the rows all share them.
 * With automatic widths the columns would re-flow the moment rows replace a message.
 */
function OrdersTable({ label, focusRef, children }: { label: string; focusRef?: Ref<HTMLTableElement>; children: ReactNode }): React.JSX.Element {
  return (
    // The ring of a table that is handed the focus is drawn on the card around it: on the table itself it would be cut by the rounded corners and sit under the header.
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs has-[table:focus-visible]:border-ring has-[table:focus-visible]:ring-[3px] has-[table:focus-visible]:ring-ring/40">
      <Table
        ref={focusRef}
        // Given by script only: a table that is handed the focus when its body is swapped for rows.
        tabIndex={focusRef ? -1 : undefined}
        aria-label={label}
        className="table-fixed outline-none"
      >
        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-20">
              Order
            </TableHead>
            <TableHead scope="col">Customer</TableHead>
            <TableHead scope="col" className="w-28 text-right">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        {children}
      </Table>
    </div>
  );
}

function Rows(): React.JSX.Element {
  return (
    <TableBody>
      {ORDERS.map((order) => (
        <TableRow key={order.number}>
          <TableCell className="font-mono text-xs">{order.number}</TableCell>
          <TableCell className="truncate font-medium">{order.customer}</TableCell>
          <TableCell className="text-right tabular-nums">{euro.format(order.total)}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Press Clear filters and the rows come back, as they would when your query runs again. */
function FilteredExample(): React.JSX.Element {
  const [cleared, setCleared] = useState(false);
  const table = useRef<HTMLTableElement>(null);
  const pressed = useRef(false);
  // The button that was pressed leaves with the message and the focus on it would drop to the top of the page: the table takes it, so the next Tab goes on from here.
  useLayoutEffect(() => {
    if (!pressed.current) return;
    pressed.current = false;
    table.current?.focus({ preventScroll: true });
  }, [cleared]);
  const show = (next: boolean) => {
    pressed.current = true;
    setCleared(next);
  };
  return (
    <Example caption="No results after filtering: the filters that are on are named, and one button clears them">
      <OrdersTable label="Orders, no results after filtering" focusRef={table}>
        {cleared ? <Rows /> : <TableBodyState state="filtered-empty" columnCount={3} noun="orders" filters={["Status: Overdue", "Customer: Kestrel"]} onClear={() => show(true)} />}
      </OrdersTable>
      {cleared ? (
        <button
          type="button"
          onClick={() => show(false)}
          className="justify-self-start rounded-sm text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Filter again
        </button>
      ) : null}
    </Example>
  );
}

/** Retry loads for a moment and fails again, which is the honest thing for a preview to do. The body stays mounted, so it keeps the focus Retry had. */
function ErrorExample(): React.JSX.Element {
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    if (!retrying) return;
    const timer = window.setTimeout(() => setRetrying(false), 1600);
    return () => window.clearTimeout(timer);
  }, [retrying]);
  return (
    <Example caption="A failed load: what went wrong in plain words, and Retry. Press it to load again">
      <OrdersTable label="Orders, failed to load">
        <TableBodyState state={retrying ? "loading" : "error"} columnCount={3} rowCount={5} alignEnd={[2]} noun="orders" onRetry={() => setRetrying(true)} />
      </OrdersTable>
    </Example>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container mx-auto w-full max-w-5xl p-2 sm:p-6">
      <div className="grid gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <Example caption="Loading: skeleton rows with the table's own columns, and one polite announcement for screen readers">
          <OrdersTable label="Orders, loading">
            <TableBodyState state="loading" columnCount={3} rowCount={5} alignEnd={[2]} noun="orders" />
          </OrdersTable>
        </Example>
        <Example caption="Empty: nothing exists yet, so the message offers the first step">
          <OrdersTable label="Orders, empty">
            <TableBodyState
              state="empty"
              columnCount={3}
              noun="orders"
              description="Orders appear here as soon as a customer checks out, or you create one by hand."
              action={
                <Button type="button" size="sm">
                  <IconPlus aria-hidden="true" />
                  New order
                </Button>
              }
            />
          </OrdersTable>
        </Example>
        <FilteredExample />
        <ErrorExample />
      </div>
    </div>
  );
}
