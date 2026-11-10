"use client";

import { useState, type ReactNode } from "react";

import { PageJump } from "@rhs-ui/primitives/page-jump";

const CUSTOMERS = ["Mara Okafor", "Jonas Lindqvist", "Priya Raman", "Tomasz Wrona", "Lena Hartmann", "Daan Verhoeven", "Amara Nwosu", "Soren Aalto", "Ines Duarte", "Kofi Mensah"];
const STATUS = ["Paid", "Shipped", "Paid", "Refunded", "Shipped", "Paid", "Pending"];
const PAGE_SIZE = 5;
const PAGE_COUNT = 480;

/** Five orders for a page of the archive. The numbers follow the page, so jumping visibly changes something. */
function ordersOn(page: number) {
  return Array.from({ length: PAGE_SIZE }, (_, index) => {
    const seed = page * PAGE_SIZE + index;
    return { id: 52000 - seed, who: CUSTOMERS[seed % CUSTOMERS.length] ?? "", status: STATUS[seed % STATUS.length] ?? "", total: 24 + ((seed * 47) % 380) + 0.5 };
  });
}

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 grid-cols-1 content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Archive(): React.JSX.Element {
  const [page, setPage] = useState(12);
  const first = (page - 1) * PAGE_SIZE + 1;
  return (
    <section aria-label="Order archive" className="w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">Order archive</h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {first.toLocaleString("en-US")} to {(first + PAGE_SIZE - 1).toLocaleString("en-US")} of {(PAGE_COUNT * PAGE_SIZE).toLocaleString("en-US")}
        </p>
      </header>
      <ul className="divide-y divide-border">
        {ordersOn(page).map((order) => (
          <li key={order.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 px-4 py-3 text-sm sm:grid-cols-[6rem_1fr_6rem_5rem] sm:px-5">
            <span className="text-muted-foreground tabular-nums">#{order.id}</span>
            <span className="font-medium">{order.who}</span>
            <span className="text-muted-foreground">{order.status}</span>
            <span className="text-right tabular-nums max-sm:col-start-2 max-sm:row-start-1">{order.total.toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <footer className="flex justify-center border-t border-border px-4 py-4">
        <PageJump page={page} pageCount={PAGE_COUNT} onPageChange={setPage} label="Order archive pages" />
      </footer>
    </section>
  );
}

function Links(): React.JSX.Element {
  const [page, setPage] = useState(37);
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
      <p className="mb-3 text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground tabular-nums">page {page}</span> of the changelog.
      </p>
      <PageJump page={page} pageCount={120} onPageChange={setPage} hrefFor={(target) => `#changelog-page-${target}`} label="Changelog pages" />
    </div>
  );
}

// The pagers below only show a state; they own no pages.
function noop() {}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Type a page and press Enter. Try 900: it goes to the last page and says so. Clear the field and press Enter, or press Escape to put the number back.">
          <Archive />
        </Example>
      </div>

      <Example caption="On the first page the back buttons dim, and their tooltip says why.">
        <PageJump page={1} pageCount={480} onPageChange={noop} label="First page example" className="justify-start" />
      </Example>

      <Example caption="On the last page the forward buttons do.">
        <PageJump page={480} pageCount={480} onPageChange={noop} label="Last page example" className="justify-start" />
      </Example>

      <Example caption="Disabled, for the moment the next page is loading.">
        <PageJump page={13} pageCount={480} disabled onPageChange={noop} label="Loading example" className="justify-start" />
      </Example>

      <Example caption="With hrefFor the four buttons are real links: crawlable, and they open in a new tab.">
        <Links />
      </Example>
    </div>
  );
}
