"use client";

import { Fragment, useId, useMemo, useRef, useState, type ReactNode } from "react";

import { IconAlertCircle, IconArrowDown, IconArrowLeft, IconArrowRight, IconArrowUp, IconCheck, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { NavigableGrid, type NavigableGridCell, type NavigableGridColumn } from "@rhs-ui/primitives/navigable-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

type Product = { id: string; name: string; sku: string; stock: number; reorder: number; price: number; featured: boolean };

/** The main example: a grid with a number to type, a checkbox and a button in its cells, and a line under it that says where the focus is. */
function StockRoom(): React.JSX.Element {
  const [items, setItems] = useState<readonly Product[]>(STOCK);
  const [focused, setFocused] = useState<NavigableGridCell | null>(null);
  const title = useId();

  // The same array between renders, so moving the cursor (which updates the line under the grid) draws two rows and not all nine.
  // The card is the container: the quiet columns leave when it is narrow, whatever the window says. The keyboard steps over them.
  const columns = useMemo<readonly NavigableGridColumn<Product>[]>(() => {
    const change = (id: string, patch: Partial<Product>) => setItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    return [
      { key: "name", header: "Product", rowHeader: true, className: "min-w-24" },
      { key: "sku", header: "SKU", className: "hidden whitespace-nowrap @3xl:table-cell [&:is(td)]:font-mono [&:is(td)]:text-xs [&:is(td)]:text-muted-foreground" },
      { key: "stock", header: "Stock", align: "right", cell: (product) => <StockField product={product} onCommit={(stock) => change(product.id, { stock })} /> },
      { key: "status", header: "Status", className: "hidden @xl:table-cell", cell: (product) => <StatusBadge status={statusOf(product)} statuses={STATUSES} /> },
      { key: "price", header: "Price", align: "right", className: "hidden @2xl:table-cell", cell: (product) => euro.format(product.price) },
      {
        key: "featured",
        header: "Featured",
        align: "center",
        // The Table takes the right padding off a cell that holds a checkbox, for a leading selection column. This one is in the middle of the row and sits under its header.
        // Below 21rem the card has no room for it, which is narrower than any phone but the smallest.
        className: "@max-[21rem]:hidden [&:has([role=checkbox])]:pr-3 @max-[23rem]:[&:has([role=checkbox])]:pr-2",
        cell: (product) => <Checkbox aria-label={`Feature ${product.name}`} checked={product.featured} onCheckedChange={(on) => change(product.id, { featured: on === true })} />,
      },
      {
        key: "restock",
        // Where the button says what it does (from @md) the header says it too, so the cursor on it, reached with the up arrow, is never an empty box.
        // On a phone the icon is all there is room for and the header is for a screen reader only.
        header: <span className="sr-only @md:not-sr-only">Restock</span>,
        align: "right",
        cell: (product) => (
          <Button type="button" size="sm" variant="outline" aria-label={`Restock ${product.name} with 12 units`} onClick={() => change(product.id, { stock: product.stock + 12 })}>
            <IconPlus aria-hidden="true" />
            <span className="hidden @md:inline">12 units</span>
          </Button>
        ),
      },
    ];
  }, []);

  const low = items.filter((item) => statusOf(item) !== "in-stock").length;
  const where = focused ? (focused.rowIndex < 0 ? `${columnName(focused)}, column header` : `${columnName(focused)}, ${items[focused.rowIndex]?.name ?? ""}`) : null;

  return (
    <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border px-3 py-3">
        <h2 id={title} className="text-sm font-semibold tracking-[-0.01em]">
          Stock room
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {items.length} products, {low} to reorder
        </p>
      </div>
      <NavigableGrid
        aria-labelledby={title}
        // Below 23rem the cells give up some padding, so the names wrap less and the checkbox column fits on a 360px phone.
        className="@max-[23rem]:[&_:is(th,td)]:px-2"
        columns={columns}
        rows={items}
        onCellFocus={setFocused}
        // Leaving the grid by Tab or a click clears the line below; the grid passes its own events through.
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
        }}
      />
      <Strip>
        <Line hidden label="Cell">
          {where ?? <span className="font-normal text-muted-foreground">Not in the grid. Press Tab to enter it.</span>}
        </Line>
      </Strip>
    </div>
  );
}

/**
 * A number you type straight into the cell, at rest it looks like text. Enter on the cell puts the focus here with the number
 * selected, Enter saves and gives the focus back to the cell, Escape puts the old number back and the grid steps out.
 */
function StockField({ product, onCommit }: { product: Product; onCommit: (units: number) => void }): React.JSX.Element {
  const [text, setText] = useState(String(product.stock));
  const [seen, setSeen] = useState(product.stock);
  // The blur that follows Enter or Escape is not a second decision.
  const settled = useRef(false);
  // Follow the number when something else changed it, such as Restock.
  if (seen !== product.stock) {
    setSeen(product.stock);
    setText(String(product.stock));
  }

  function commit() {
    if (settled.current) {
      settled.current = false;
      return;
    }
    const units = Number.parseInt(text, 10);
    if (Number.isNaN(units)) setText(String(product.stock));
    else if (units !== product.stock) onCommit(units);
  }

  return (
    <Input
      inputMode="numeric"
      autoComplete="off"
      aria-label={`Stock of ${product.name}`}
      value={text}
      onChange={(event) => setText(event.target.value.replace(/\D/g, "").slice(0, 4))}
      onFocus={(event) => event.currentTarget.select()}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit();
          settled.current = true;
          event.currentTarget.closest("td")?.focus();
        } else if (event.key === "Escape") {
          settled.current = true;
          setText(String(product.stock));
        }
      }}
      className="-mr-2 inline-flex h-8 w-[4.5rem] border-transparent bg-transparent px-2 text-right tabular-nums shadow-none hover:border-input focus-visible:bg-background"
    />
  );
}

const STOCK: readonly Product[] = [
  { id: "p1", name: "Halcyon desk lamp", sku: "HL-204", stock: 23, reorder: 20, price: 48, featured: true },
  { id: "p2", name: "Northwind kettle", sku: "NW-118", stock: 60, reorder: 25, price: 64, featured: false },
  { id: "p3", name: "Kestrel backpack", sku: "KE-330", stock: 8, reorder: 15, price: 129, featured: true },
  { id: "p4", name: "Oak Lane tea towel", sku: "OL-072", stock: 134, reorder: 40, price: 18, featured: false },
  { id: "p5", name: "Mirror Labs speaker", sku: "ML-501", stock: 41, reorder: 20, price: 86, featured: false },
  { id: "p6", name: "Fjord thermos", sku: "FJ-219", stock: 0, reorder: 30, price: 39, featured: false },
  { id: "p7", name: "Lumen reading light", sku: "LU-147", stock: 17, reorder: 20, price: 54, featured: true },
  { id: "p8", name: "Polder tote bag", sku: "PO-088", stock: 76, reorder: 30, price: 32, featured: false },
  { id: "p9", name: "Aiko ceramic mug", sku: "AI-026", stock: 212, reorder: 60, price: 14, featured: false },
];

// Status is told by a glyph and a word, never by colour alone: only a sold out product uses the destructive token.
const STATUSES: Readonly<Record<string, StatusDefinition>> = {
  "in-stock": { label: "In stock", glyph: <IconCheck />, emphasis: "soft" },
  low: { label: "Low stock", glyph: <IconAlertCircle />, emphasis: "outline" },
  "sold-out": { label: "Sold out", glyph: <IconAlertCircle />, emphasis: "critical" },
};

const statusOf = (product: Product) => (product.stock === 0 ? "sold-out" : product.stock < product.reorder ? "low" : "in-stock");

const COLUMN_NAMES: Readonly<Record<string, string>> = {
  name: "Product",
  sku: "SKU",
  stock: "Stock",
  status: "Status",
  price: "Price",
  featured: "Featured",
  restock: "Restock",
  number: "Ticket",
  subject: "Subject",
  owner: "Owner",
  resolve: "Resolve",
};

const columnName = (cell: NavigableGridCell) => COLUMN_NAMES[cell.columnKey] ?? cell.columnKey;

/** One example: a caption and what it describes. `className` sets the width of both, so the caption never runs past the card it is about. */
function Example({ caption, className, children }: { caption: string; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3", className)}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The band under a grid, for small print: one `Line` for what the grid is on, a second for what it just did. */
function Strip({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="grid min-h-11 content-center gap-y-1 border-t border-border bg-muted/40 px-3 py-2 text-xs">{children}</div>;
}

/**
 * One line of the strip. With `hidden` it is for the eye only (a screen reader is already told where it is by the grid); without,
 * it is a polite status line, for what the grid cannot say itself. A line with a `label` is a reading that changes with every
 * arrow key, so it keeps to one row and cuts what does not fit: the card never jumps while you move.
 */
function Line({ label, hidden = false, children }: { label?: string; hidden?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <p aria-hidden={hidden || undefined} role={hidden ? undefined : "status"} className="flex min-w-0 items-center gap-x-2">
      {label ? <span className="shrink-0 text-muted-foreground">{label}</span> : null}
      <span className={cn("min-w-0 font-medium text-foreground", label ? "truncate" : undefined)}>{children}</span>
    </p>
  );
}

/** What sits between two keys: a plus when they are pressed together, a slash when either one will do. A screen reader hears the word instead. */
function Join({ chord = false }: { chord?: boolean }): React.JSX.Element {
  return (
    <>
      <span aria-hidden="true">{chord ? "+" : "/"}</span>
      <span className="sr-only">{chord ? "plus" : "or"}</span>
    </>
  );
}

/** Keys pressed together. */
function Chord({ keys }: { keys: readonly string[] }): React.JSX.Element {
  return (
    <KbdGroup>
      {keys.map((key, index) => (
        <Fragment key={key}>
          {index > 0 ? <Join chord /> : null}
          <Kbd>{key}</Kbd>
        </Fragment>
      ))}
    </KbdGroup>
  );
}

const KEYS: readonly { keys: ReactNode; does: string }[] = [
  {
    keys: (
      <KbdGroup>
        <Kbd>
          <IconArrowLeft size={12} />
          <span className="sr-only">Left arrow</span>
        </Kbd>
        <Kbd>
          <IconArrowUp size={12} />
          <span className="sr-only">Up arrow</span>
        </Kbd>
        <Kbd>
          <IconArrowDown size={12} />
          <span className="sr-only">Down arrow</span>
        </Kbd>
        <Kbd>
          <IconArrowRight size={12} />
          <span className="sr-only">Right arrow</span>
        </Kbd>
      </KbdGroup>
    ),
    does: "Move one cell",
  },
  {
    keys: (
      <>
        <Kbd>Home</Kbd>
        <Join />
        <Kbd>End</Kbd>
      </>
    ),
    does: "Start and end of the row",
  },
  {
    keys: (
      <>
        <Chord keys={["Ctrl", "Home"]} />
        <Join />
        <Chord keys={["Ctrl", "End"]} />
      </>
    ),
    does: "The two corners",
  },
  {
    keys: (
      <>
        <Kbd>PgUp</Kbd>
        <Join />
        <Kbd>PgDn</Kbd>
      </>
    ),
    does: "A screenful of rows",
  },
  {
    keys: (
      <>
        <Kbd>Enter</Kbd>
        <Join />
        <Kbd>F2</Kbd>
      </>
    ),
    does: "Go into the cell's control",
  },
  { keys: <Kbd>Esc</Kbd>, does: "Back out to the cell" },
];

function KeyLegend(): React.JSX.Element {
  return (
    <ul aria-label="Keys" className="grid grid-cols-[auto_minmax(0,1fr)] gap-y-2.5 text-xs text-muted-foreground md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
      {KEYS.map((entry) => (
        // Every row borrows the two tracks of the list, so the descriptions of a column start at one x, whichever keys come before them.
        <li key={entry.does} className="col-span-2 grid grid-cols-subgrid items-center">
          <span className="flex items-center gap-2 pr-3">{entry.keys}</span>
          <span className="md:pr-8">{entry.does}</span>
        </li>
      ))}
    </ul>
  );
}

type Ticket = { id: string; number: string; subject: string; owner: string };

const OWNERS = ["Mara Okafor", "Jonas Weber", "Priya Nair", "Unassigned"] as const;

const TICKETS: readonly Ticket[] = [
  { id: "t1", number: "#4821", subject: "Refund for order 20418", owner: "Mara Okafor" },
  { id: "t2", number: "#4820", subject: "Kettle arrived with a dented lid", owner: "Jonas Weber" },
  { id: "t3", number: "#4818", subject: "Change the delivery address", owner: "Priya Nair" },
  { id: "t4", number: "#4815", subject: "Invoice shows the wrong VAT number", owner: "Unassigned" },
  { id: "t5", number: "#4812", subject: "Is the Halcyon lamp safe with US plugs?", owner: "Mara Okafor" },
];

/** Rows that come and go under the cursor, and a select reached through the grid. */
function SupportQueue(): React.JSX.Element {
  const [tickets, setTickets] = useState<readonly Ticket[]>(TICKETS);
  const [resolved, setResolved] = useState<Ticket | null>(null);
  const [focused, setFocused] = useState<NavigableGridCell | null>(null);
  const title = useId();

  // The same array between renders: the Focus line below the grid changes with every arrow key, and a new array would draw every row each time.
  const columns = useMemo<readonly NavigableGridColumn<Ticket>[]>(() => {
    const resolve = (ticket: Ticket) => {
      setTickets((list) => list.filter((item) => item.id !== ticket.id));
      setResolved(ticket);
    };
    return [
      { key: "number", header: "Ticket", className: "hidden whitespace-nowrap @lg:table-cell [&:is(td)]:font-mono [&:is(td)]:text-xs [&:is(td)]:text-muted-foreground" },
      { key: "subject", header: "Subject", rowHeader: true, className: "min-w-28" },
      {
        key: "owner",
        header: "Owner",
        // Below 21rem the card has no room for the select, which is narrower than any phone but the smallest.
        className: "@max-[21rem]:hidden",
        cell: (ticket) => (
          <Select value={ticket.owner} onValueChange={(owner) => setTickets((list) => list.map((item) => (item.id === ticket.id ? { ...item, owner } : item)))}>
            <SelectTrigger size="sm" aria-label={`Owner of ticket ${ticket.number}`} className="-ml-3 w-36 border-transparent bg-transparent pl-[11px] shadow-none hover:border-input @max-[23rem]:w-[8.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OWNERS.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        key: "resolve",
        // Where the button says what it does (from @md) the header says it too, so the cursor on it, where it lands when the last ticket is resolved, is never an empty box.
        // On a phone the icon is all there is room for and the header is for a screen reader only.
        header: <span className="sr-only @md:not-sr-only">Resolve</span>,
        align: "right",
        cell: (ticket) => (
          <Button type="button" size="sm" variant="outline" aria-label={`Resolve ticket ${ticket.number}`} onClick={() => resolve(ticket)}>
            <IconCheck aria-hidden="true" />
            <span className="hidden @md:inline">Resolve</span>
          </Button>
        ),
      },
    ];
  }, []);

  // The grid reports the row by its id, so the line follows the ticket the cursor is on. Resolve it and the cursor moves to the ticket
  // that takes its place: the grid reports that one, and the line moves on with it. A ticket that is gone would show as an empty line.
  const ticket = focused?.rowId ? tickets.find((item) => item.id === focused.rowId) : undefined;
  const where = focused ? (focused.rowIndex < 0 ? `${columnName(focused)}, column header` : `${columnName(focused)}, ${ticket?.subject ?? ""}`) : null;

  return (
    <div className="grid gap-3">
      <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border px-3 py-3">
          <h2 id={title} className="text-sm font-semibold tracking-[-0.01em]">
            Support queue
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">{tickets.length} open</p>
        </div>
        <NavigableGrid
          aria-labelledby={title}
          // Below 23rem the cells give up some padding, so the subjects wrap less and the owner select fits on a 360px phone.
          className="@max-[23rem]:[&_:is(th,td)]:px-2"
          columns={columns}
          rows={tickets}
          empty="Inbox zero. Every ticket is resolved."
          onCellFocus={setFocused}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
          }}
        />
        <Strip>
          <Line hidden label="Focus">
            {where ?? <span className="font-normal text-muted-foreground">Not in the grid. Press Tab to enter it.</span>}
          </Line>
          <Line>{resolved ? `Resolved "${resolved.subject}". ${tickets.length} left.` : <span className="font-normal text-muted-foreground">Resolve a ticket with Enter, then Enter again.</span>}</Line>
        </Strip>
      </div>
      {tickets.length < TICKETS.length ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-fit text-muted-foreground"
          onClick={() => {
            setTickets(TICKETS);
            setResolved(null);
          }}
        >
          Reopen the sample tickets
        </Button>
      ) : null}
    </div>
  );
}

type Lane = { id: string; country: string; rates: readonly number[] };

const LANES: readonly Lane[] = [
  { id: "nl", country: "Netherlands", rates: [4.95, 6.95, 9.95] },
  { id: "be", country: "Belgium", rates: [6.5, 8.95, 13.5] },
  { id: "de", country: "Germany", rates: [7.5, 10.5, 15.95] },
  { id: "fr", country: "France", rates: [8.25, 11.5, 17.5] },
  { id: "uk", country: "United Kingdom", rates: [12.5, 17.95, 26] },
  { id: "no", country: "Norway", rates: [14.95, 21.5, 31] },
];

// A no-break space keeps the unit with its number when a header wraps on a phone.
const BANDS = ["Up to 1\xa0kg", "1 to 5\xa0kg", "5 to 20\xa0kg"] as const;

const RATE_COLUMNS: readonly NavigableGridColumn<Lane>[] = [
  { key: "country", header: "Ships to", rowHeader: true, className: "@max-xs:px-2" },
  ...BANDS.map((band, index) => ({
    key: `band-${index}`,
    header: band,
    align: "right" as const,
    className: "whitespace-normal @max-xs:px-2",
    cell: (lane: Lane) => euro.format(lane.rates[index] ?? 0),
  })),
];

// No cell holds a control, so there is nothing to enter: a screen reader is told only what the keys do here.
const READ_ONLY_LABELS = { instructions: "Use the arrow keys to move between cells." };

function ShippingRates(): React.JSX.Element {
  const [focused, setFocused] = useState<NavigableGridCell | null>(null);
  const title = useId();
  const lane = focused && focused.rowIndex >= 0 ? LANES[focused.rowIndex] : undefined;
  const band = focused ? Number(focused.columnKey.replace("band-", "")) : Number.NaN;
  const reading = lane && band >= 0 && band < BANDS.length ? `${lane.country}, ${BANDS[band]?.toLowerCase()}: ${euro.format(lane.rates[band] ?? 0)}` : lane ? lane.country : focused ? "Column header" : null;

  return (
    <div className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="border-b border-border px-3 py-3">
        <h2 id={title} className="text-sm font-semibold tracking-[-0.01em]">
          Shipping rates
        </h2>
        <p className="text-xs text-muted-foreground">Per parcel, by weight, VAT included</p>
      </div>
      <NavigableGrid
        aria-labelledby={title}
        columns={RATE_COLUMNS}
        rows={LANES}
        labels={READ_ONLY_LABELS}
        onCellFocus={setFocused}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
        }}
      />
      <Strip>
        <Line hidden label="Reads as">
          {reading ?? <span className="font-normal text-muted-foreground">Tab in and move to a price.</span>}
        </Line>
      </Strip>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 p-2 sm:p-6">
      <Example caption="Tab once to enter the grid, then move with the arrow keys. Enter or F2 on a cell goes into its control (the stock number, the checkbox, the button), Escape comes back. The whole grid is one stop in the Tab order">
        <div className="grid gap-4">
          <StockRoom />
          <KeyLegend />
        </div>
      </Example>

      <Example
        className="max-w-2xl"
        caption="Rows can come and go under the cursor: resolve a ticket from the keyboard and the focus lands on the ticket that takes its place, not at the top of the page, and the Focus line moves with it. The owner is the house select, reached the same way"
      >
        <SupportQueue />
      </Example>

      <Example className="max-w-xl" caption="Plain data needs no controls: the arrows still read it cell by cell, and a screen reader hears the row and the column with every price">
        <ShippingRates />
      </Example>
    </div>
  );
}
