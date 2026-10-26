"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { ApprovalButtons } from "@rhs-ui/application/approval-buttons";
import { IconReceipt } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const ITEMS = [
  { label: "Flights, Amsterdam to Lisbon", amount: "€642.00" },
  { label: "Hotel, 2 nights", amount: "€512.60" },
  { label: "Team dinner", amount: "€130.00" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Presses Approve inside it once, so a decision with its Change decision button is on show without a click. */
function ApproveOnce({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const press = window.setTimeout(() => box.current?.querySelector<HTMLButtonElement>("button[aria-label^='Approve']")?.click(), 40);
    // The control moves focus to Change decision, as it should for a keyboard; nobody pressed anything here, so no ring is left on show.
    const release = window.setTimeout(() => (box.current?.contains(document.activeElement) ? (document.activeElement as HTMLElement).blur() : undefined), 160);
    return () => {
      window.clearTimeout(press);
      window.clearTimeout(release);
    };
  }, []);
  return <div ref={box}>{children}</div>;
}

function ExpenseReport(): React.JSX.Element {
  // The first rejection fails, so the error can be seen.
  const failed = useRef(false);
  return (
    <div className="w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-[1_1_9rem] items-start gap-3.5">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/60">
            <IconReceipt className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base leading-snug font-semibold tracking-[-0.02em]">Lisbon offsite</h2>
            <p className="mt-1 text-xs text-muted-foreground">Tomas Brandt &middot; Travel &middot; 3 receipts</p>
          </div>
        </div>
        <p className="text-lg font-semibold tracking-[-0.02em] tabular-nums">€1,284.60</p>
      </div>
      <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-sm">
        {ITEMS.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="tabular-nums">{item.amount}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 border-t border-border pt-5">
        <ApprovalButtons
          subject="expense"
          decidedBy="Dana Whitfield"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          undoWindow={30}
          onApprove={() => wait(700)}
          onReject={async () => {
            await wait(700);
            if (!failed.current) {
              failed.current = true;
              throw new Error("offline");
            }
          }}
        />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Approve, or reject with a reason. After either, a status line with Change decision stays for 30 seconds. The first rejection fails, to show the error.">
        <div className="max-w-lg">
          <ExpenseReport />
        </div>
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
        <Example caption="Decided a moment ago: Change decision stays for 30 seconds, under the words in a narrow space">
          <ApproveOnce>
            <ApprovalButtons subject="pull request" decidedBy="Ines Kowalski" locale="en-GB" timeZone="Europe/Amsterdam" />
          </ApproveOnce>
        </Example>
        <Example caption="Already approved (the window has closed)">
          <ApprovalButtons subject="expense" status="approved" decidedBy="Dana Whitfield" decidedAt="2026-10-19T12:20:00Z" locale="en-GB" timeZone="Europe/Amsterdam" />
        </Example>
        <Example caption="Already rejected, with the reason">
          <ApprovalButtons
            subject="expense"
            status="rejected"
            decidedBy="Dana Whitfield"
            decidedAt="2026-10-19T12:20:00Z"
            reason="The hotel receipt is missing. Attach it and send the report again."
            locale="en-GB"
            timeZone="Europe/Amsterdam"
          />
        </Example>
        <Example caption="A leave request: the reason is optional, and the buttons are small">
          <ApprovalButtons subject="leave request" size="sm" requireReason={false} decidedBy="Dana Whitfield" locale="en-GB" timeZone="Europe/Amsterdam" onApprove={() => wait(500)} onReject={() => wait(500)} />
        </Example>
      </div>
    </div>
  );
}
