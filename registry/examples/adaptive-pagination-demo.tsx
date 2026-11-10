"use client";

import { useState, type ReactNode } from "react";

import { AdaptivePagination } from "@rhs-ui/primitives/adaptive-pagination";

const CUSTOMERS = ["Mara Okafor", "Jonas Lindqvist", "Priya Raman", "Tomasz Wrona", "Lena Hartmann", "Daan Verhoeven", "Amara Nwosu", "Soren Aalto"];
const STATUS = ["Paid", "Shipped", "Paid", "Refunded", "Shipped", "Paid", "Pending", "Shipped"];

const PER_PAGE = 4;
const TOTAL = 1237;
const PAGES = Math.ceil(TOTAL / PER_PAGE);
const figure = (value: number): string => value.toLocaleString("en-US");

/** The orders of a page of the table: the numbers follow the page, so paging visibly changes something. The last page has what is left over. */
function ordersOn(page: number) {
  const first = (page - 1) * PER_PAGE;
  return Array.from({ length: Math.min(PER_PAGE, TOTAL - first) }, (_, index) => {
    const seed = first + index;
    return { id: 48210 - seed, who: CUSTOMERS[seed % CUSTOMERS.length] ?? "", status: STATUS[seed % STATUS.length] ?? "", total: 38 + ((seed * 53) % 410) + 0.9 };
  });
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Orders(): React.JSX.Element {
  const [page, setPage] = useState(4);
  const rows = ordersOn(page);
  const first = (page - 1) * PER_PAGE;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">Orders</h2>
        <p className="text-xs text-muted-foreground tabular-nums">{figure(TOTAL)} in total</p>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((order) => (
          <li key={order.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-3 text-sm sm:grid-cols-[6rem_1fr_6rem_5rem] sm:px-5">
            <span className="text-muted-foreground tabular-nums">#{order.id}</span>
            <span className="font-medium sm:col-auto">{order.who}</span>
            <span className="text-muted-foreground sm:text-left">{order.status}</span>
            <span className="text-right tabular-nums max-sm:col-start-2 max-sm:row-start-1">{order.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <p className="px-1 text-xs text-muted-foreground tabular-nums sm:shrink-0">
          Showing {figure(first + 1)} to {figure(first + rows.length)} of {figure(TOTAL)}
        </p>
        <div className="min-w-0 flex-1">
          <AdaptivePagination page={page} pageCount={PAGES} onPageChange={setPage} hrefFor={(n) => `?page=${n}`} align="end" aria-label="Orders pages" />
        </div>
      </div>
    </div>
  );
}

function Narrow(): React.JSX.Element {
  const [page, setPage] = useState(3);
  return (
    <div className="w-full max-w-[17.5rem] rounded-xl border border-border bg-card p-4 text-card-foreground">
      <p className="text-sm font-semibold tracking-[-0.01em]">Comments</p>
      <p className="mt-1 text-xs text-muted-foreground">Page {page} of 12 of the thread on the Kestrel launch.</p>
      <div className="mt-4">
        <AdaptivePagination page={page} pageCount={12} onPageChange={setPage} aria-label="Comment pages" />
      </div>
    </div>
  );
}

function Resizable(): React.JSX.Element {
  const [page, setPage] = useState(9);
  return (
    <div className="grid grid-cols-1 gap-2">
      <div className="min-w-[15rem] max-w-full resize-x overflow-hidden rounded-xl border border-border bg-card p-3 text-card-foreground" style={{ width: "32rem" }}>
        <AdaptivePagination page={page} pageCount={24} onPageChange={setPage} siblingCount={1} aria-label="Resizable pages" />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full">
      <div className="mx-auto grid w-full max-w-3xl gap-12">
        <Example caption="A table footer with room: first, previous, a window of page numbers with ellipses, next and last. The numbers are real links.">
          <Orders />
        </Example>
        <Example caption="It measures its own box, not the window: drag the corner of this box narrower and wider.">
          <Resizable />
        </Example>
        <Example caption="The same component in a narrow card: 'Page 3 of 12' opens the list of pages.">
          <Narrow />
        </Example>
      </div>
    </div>
  );
}
