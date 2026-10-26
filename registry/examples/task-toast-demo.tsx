"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { IconDownload, IconInvoice, IconWarehouse } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { taskToast } from "@rhs-ui/primitives/task-toast";
import { Toaster } from "@rhs-ui/primitives/toast";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Intervals the demo started, stopped when it is really gone. React's strict mode unmounts and mounts a component straight away to check it; that is not gone. */
function useIntervals() {
  const ids = useRef(new Set<number>());
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    const own = ids.current;
    return () => {
      alive.current = false;
      window.setTimeout(() => {
        if (alive.current) return;
        for (const id of own) window.clearInterval(id);
        own.clear();
      }, 0);
    };
  }, []);
  return {
    every(ms: number, run: (stop: () => void) => void) {
      const id = window.setInterval(() => run(stop), ms);
      const stop = () => {
        window.clearInterval(id);
        ids.current.delete(id);
      };
      ids.current.add(id);
      return stop;
    },
  };
}

const ORDERS = 3000;

/**
 * One kind of task and the button that starts it. The cards stand in a column on the left, clear of the toasts, which come up at the bottom right. On a phone the toasts
 * span the width of the screen, so a card shrinks to its title and button and keeps its text for screen readers: three of them stay above the stack.
 */
function TaskCard({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action: ReactNode }): React.JSX.Element {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2.5 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs sm:items-start sm:gap-y-1">
      <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg border border-border bg-muted text-foreground sm:row-span-2 [&_svg]:size-4">
        {icon}
      </span>
      <h2 className="text-sm font-medium tracking-[-0.01em] sm:pt-1.5">{title}</h2>
      <p className="text-[0.8125rem] leading-snug text-muted-foreground max-sm:sr-only sm:col-start-2">{text}</p>
      <div className="col-span-2 sm:mt-2.5">{action}</div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const timers = useIntervals();
  const syncAttempts = useRef(0);
  const started = useRef(false);

  /** A bar that fills, a Cancel button on the way, and a file to open at the end. */
  function exportOrders(from = 0) {
    let done = Math.round(ORDERS * from);
    const stop = timers.every(700, () => {
      done = Math.min(ORDERS, done + 150);
      if (done >= ORDERS) {
        stop();
        task.success("Export ready", { description: "3,000 orders, 3.2 MB", action: { label: "Open file", onClick: () => undefined } });
        return;
      }
      task.progress(done / ORDERS, `${done.toLocaleString("en-US")} of ${ORDERS.toLocaleString("en-US")} orders`);
    });
    const task = taskToast({ title: "Exporting orders", description: "Since 1 October, as CSV", progress: from, onCancel: stop });
    if (from > 0) task.progress(from, `${done.toLocaleString("en-US")} of ${ORDERS.toLocaleString("en-US")} orders`);
  }

  /** Fails at 62% on every other run, the first one included, and finishes on the run after it: so a retry works. */
  function syncInventory(failNow = false) {
    const attempt = ++syncAttempts.current;
    const task = taskToast({ title: "Syncing inventory", description: "Rotterdam warehouse, 1,284 SKUs", progress: 0 });
    const fail = () => task.error("Inventory sync failed", { description: "The warehouse API timed out at 62%. Nothing was changed.", onRetry: () => syncInventory() });
    if (failNow) {
      fail();
      return;
    }
    let step = 0;
    timers.every(600, (stop) => {
      step += 1;
      const fraction = Math.min(1, step * 0.31);
      if (attempt % 2 === 1 && step === 2) {
        stop();
        fail();
        return;
      }
      if (fraction >= 1) {
        stop();
        task.success("Inventory synced", { description: "1,284 SKUs are up to date." });
        return;
      }
      task.progress(fraction);
    });
  }

  function generateInvoices() {
    void taskToast.promise(wait(2600).then(() => 14), {
      loading: "Generating invoices",
      description: "March billing run, 14 customers",
      success: (count) => `${count} invoices generated`,
      error: "Could not generate the invoices",
    });
  }

  // The preview opens with the three states in a stack: one task done, one failed, one on its way. The stack is 26rem wide at the bottom right, so there is room beside the cards for
  // all three only from 50rem up (the padding on the root below keeps that room); on a narrower screen it would sit on top of the cards, and only the export runs.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (window.matchMedia("(min-width: 50rem)").matches) {
      const invoices = taskToast({ title: "Generating invoices" });
      invoices.success("14 invoices generated", { description: "Ready to send from Billing.", action: { label: "Open Billing", onClick: () => undefined } });
      syncInventory(true);
    }
    exportOrders(0.62);
  }, []);

  return (
    // Below 40rem the stack is full width, so the root keeps room under the cards to scroll them clear of it.
    <div className="mx-auto grid w-full max-w-5xl gap-3 px-4 pt-6 pb-4 max-sm:pb-[22rem] sm:px-6">
      <p className="text-xs text-muted-foreground">One toast per task, changing in place: a bar while it runs, then a check or a warning with the next step</p>
      {/* From 50rem up the cards keep to the left of the stack: 26rem for the toasts and a little air. */}
      <div className="grid grid-cols-1 gap-2.5 min-[50rem]:pr-[27rem]">
        <TaskCard
          icon={<IconDownload />}
          title="Export orders"
          text="A bar and a count, Cancel on the way, and the file at the end."
          action={
            <Button variant="outline" size="sm" onClick={() => exportOrders()}>
              Start export
            </Button>
          }
        />
        <TaskCard
          icon={<IconWarehouse />}
          title="Sync inventory"
          text="Stops at 62% on every other run. The toast stays and offers Retry."
          action={
            <Button variant="outline" size="sm" onClick={() => syncInventory()}>
              Sync inventory
            </Button>
          }
        />
        <TaskCard
          icon={<IconInvoice />}
          title="Generate invoices"
          text="No progress to report? Hand taskToast.promise a promise."
          action={
            <Button variant="outline" size="sm" onClick={generateInvoices}>
              Generate invoices
            </Button>
          }
        />
      </div>
      <Toaster />
    </div>
  );
}
