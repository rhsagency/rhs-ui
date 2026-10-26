"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { InfiniteScrollStatus } from "@rhs-ui/primitives/infinite-scroll-status";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const CUSTOMERS = ["Halcyon Studio", "Kestrel & Co", "Polder Bakery", "Lumen Labs", "Northwind Outfitters", "Fernhill Garden", "Atlas Courier", "Tidewater Books"] as const;
const STATES = ["Paid", "Shipped", "Paid", "Pending", "Paid", "Shipped", "Refunded"] as const;
const euro = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

function Order({ index }: { index: number }): React.JSX.Element {
  const state = STATES[index % STATES.length] as (typeof STATES)[number];
  return (
    <li className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="truncate text-sm font-medium">{CUSTOMERS[index % CUSTOMERS.length]}</p>
        <p className="font-mono text-xs text-muted-foreground">NW-{String(2048 - index).padStart(4, "0")}</p>
      </div>
      <Badge variant={state === "Pending" ? "muted" : "outline"} className="hidden sm:inline-flex">
        {state}
      </Badge>
      <p className="w-20 text-right text-sm tabular-nums">{euro.format(38 + ((index * 137) % 910) + ((index * 13) % 100) / 100)}</p>
    </li>
  );
}

const PAGE = 8;
const TOTAL = 40;

function Live(): React.JSX.Element {
  const [count, setCount] = useState(PAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /** Pretends to fetch a page: the answer comes after a moment, and the next one can be made to fail. */
  function loadMore() {
    const fails = failNext;
    setLoading(true);
    setError(false);
    timer.current = window.setTimeout(() => {
      if (fails) {
        setFailNext(false);
        setError(true);
      } else {
        setCount((current) => Math.min(TOTAL, current + PAGE));
      }
      setLoading(false);
    }, 900);
  }

  return (
    <div className="grid gap-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium tracking-[-0.01em]">Recent orders</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {count} of {TOTAL}
          </span>
        </div>
        <div ref={scroller} tabIndex={0} role="region" aria-label="Recent orders" className="relative h-80 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
          <ul>
            {Array.from({ length: count }, (_, index) => (
              <Order key={index} index={index} />
            ))}
          </ul>
          <InfiniteScrollStatus
            root={scroller}
            // Close to the box: the next page is asked for when the footer is about to be seen, so scrolling is what loads it.
            rootMargin="96px 0px"
            hasMore={count < TOTAL}
            loading={loading}
            error={error ? "The orders service did not answer." : false}
            onLoadMore={loadMore}
            count={count}
            total={TOTAL}
            noun={{ one: "order", other: "orders" }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id="infinite-fail" checked={failNext} onCheckedChange={setFailNext} />
        <Label htmlFor="infinite-fail" className="font-normal text-muted-foreground">
          Make the next page fail
        </Label>
      </div>
    </div>
  );
}

function Frame({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid content-start gap-2">
      <p className="text-xs font-medium">{title}</p>
      <div className="rounded-xl border border-border bg-card shadow-xs">{children}</div>
    </div>
  );
}

const noop = () => undefined;

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Example caption="Try it: scroll to the end and the next page is asked for before you get there">
        <Live />
      </Example>
      <Example caption="The four states of the footer">
        <div className="grid gap-4">
          <Frame title="Waiting, with the fallback button">
            <InfiniteScrollStatus hasMore onLoadMore={noop} count={24} total={120} noun={{ one: "order", other: "orders" }} />
          </Frame>
          <Frame title="Loading the next page">
            <InfiniteScrollStatus hasMore loading onLoadMore={noop} />
          </Frame>
          <Frame title="Failed, and waiting for Retry">
            <InfiniteScrollStatus hasMore error="The orders service did not answer." onLoadMore={noop} />
          </Frame>
          <Frame title="Nothing left">
            <InfiniteScrollStatus hasMore={false} onLoadMore={noop} count={120} noun={{ one: "order", other: "orders" }} />
          </Frame>
        </div>
      </Example>
    </div>
  );
}
