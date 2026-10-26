"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconPlus, IconReceipt, IconRefresh } from "@rhs-ui/icons";
import { AsyncView, type AsyncStatus } from "@rhs-ui/primitives/async-view";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";

const INVOICES = [
  { id: "INV-2041", client: "Halcyon Studio", amount: "€1,240.00", state: "Paid" },
  { id: "INV-2040", client: "Kestrel & Co", amount: "€86.50", state: "Sent" },
  { id: "INV-2039", client: "Polder Bakery", amount: "€312.00", state: "Paid" },
] as const;

function InvoiceList(): React.JSX.Element {
  return (
    <ul className="grid gap-4">
      {INVOICES.map((invoice) => (
        <li key={invoice.id} className="flex items-center gap-3">
          <Avatar className="rounded-lg">
            <AvatarFallback className="rounded-lg">{initialsOf(invoice.client)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="truncate text-sm font-medium">{invoice.client}</p>
            <p className="font-mono text-xs text-muted-foreground">{invoice.id}</p>
          </div>
          <div className="grid justify-items-end gap-1">
            <p className="text-sm font-medium tabular-nums">{invoice.amount}</p>
            <Badge variant={invoice.state === "Paid" ? "outline" : "muted"}>{invoice.state}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The frame the four views share: a title, a button for the demo, and the status the component was given. */
function Panel({ caption, status, fetching, action, children }: { caption: string; status: AsyncStatus; fetching?: boolean; action: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <Example caption={caption}>
      <section className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-xs">
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-border py-2 pr-3 pl-5">
          <h2 className="text-sm font-medium tracking-[-0.01em]">Invoices</h2>
          <div className="flex flex-wrap items-center gap-2">
            {action}
            <Badge variant="muted" className="font-mono">
              {fetching ? `${status}, fetching` : status}
            </Badge>
          </div>
        </header>
        <div className="flex-1 p-5">{children}</div>
      </section>
    </Example>
  );
}

/** A timer that is cleared when the component goes. */
function useTimer() {
  const id = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(id.current), []);
  return (run: () => void, ms: number) => {
    window.clearTimeout(id.current);
    id.current = window.setTimeout(run, ms);
  };
}

function LoadingPanel(): React.JSX.Element {
  const [status, setStatus] = useState<AsyncStatus>("loading");
  const later = useTimer();
  const load = () => {
    setStatus("loading");
    later(() => setStatus("ready"), 2800);
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <Panel
      caption="Loading: a skeleton after a 200 ms delay, then the content fades in"
      status={status}
      action={
        <Button variant="ghost" size="sm" onClick={load}>
          Reload
        </Button>
      }
    >
      <AsyncView status={status} className="min-h-56">
        <InvoiceList />
      </AsyncView>
    </Panel>
  );
}

function ErrorPanel(): React.JSX.Element {
  const [status, setStatus] = useState<AsyncStatus>("error");
  const [fetching, setFetching] = useState(false);
  const later = useTimer();
  const retry = () => {
    setFetching(true);
    later(() => {
      setFetching(false);
      setStatus("ready");
    }, 1400);
  };
  return (
    <Panel
      caption="Error: the message and Retry, which runs the request again in place"
      status={status}
      fetching={fetching}
      action={
        <Button variant="ghost" size="sm" onClick={() => setStatus("error")}>
          Break it
        </Button>
      }
    >
      <AsyncView status={status} isFetching={fetching} onRetry={retry} errorMessage="The invoices service did not answer. Nothing was lost." className="min-h-56">
        <InvoiceList />
      </AsyncView>
    </Panel>
  );
}

function EmptyPanel(): React.JSX.Element {
  const [status, setStatus] = useState<AsyncStatus>("empty");
  return (
    <Panel
      caption="Empty: a slot of its own, with the way out"
      status={status}
      action={
        <Button variant="ghost" size="sm" onClick={() => setStatus("empty")}>
          Clear
        </Button>
      }
    >
      <AsyncView
        status={status}
        className="min-h-56"
        empty={
          <EmptyState className="py-10" title="No invoices yet" description="Invoices you send show up here, with their payment status." icon={<IconReceipt className="size-6" />}>
            <Button size="sm" onClick={() => setStatus("ready")}>
              <IconPlus />
              Create an invoice
            </Button>
          </EmptyState>
        }
      >
        <InvoiceList />
      </AsyncView>
    </Panel>
  );
}

function RefreshPanel(): React.JSX.Element {
  // It starts out refreshing, so the bar is there to be seen; after that the button runs it again.
  const [fetching, setFetching] = useState(true);
  const later = useTimer();
  const refresh = () => {
    setFetching(true);
    later(() => setFetching(false), 2800);
  };
  useEffect(() => {
    refresh();
  }, []);
  return (
    <Panel
      caption="Refreshing: the old content stays put and a thin bar runs along the top"
      status="ready"
      fetching={fetching}
      action={
        <Button variant="ghost" size="sm" onClick={refresh} aria-disabled={fetching || undefined}>
          <IconRefresh />
          Refresh
        </Button>
      }
    >
      <AsyncView status="ready" isFetching={fetching} className="-m-5 min-h-56 rounded-b-xl p-5">
        <InvoiceList />
      </AsyncView>
    </Panel>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    // Two columns only when the preview itself is wide enough for two panels: the width of the page says nothing about the pane the demo gets.
    <div className="@container w-full max-w-4xl">
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 @3xl:grid-cols-2">
        <LoadingPanel />
        <ErrorPanel />
        <EmptyPanel />
        <RefreshPanel />
      </div>
    </div>
  );
}
