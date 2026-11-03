"use client";

import { useState, type ReactNode } from "react";

import { PaymentFailedBanner } from "@rhs-ui/application/payment-failed-banner";

// Amsterdam is the account's billing zone here, and the instant is 23:59 there, so the banner and its title agree on the day.
const ZONE = "Europe/Amsterdam";
const GRACE_ENDS = "2026-11-14T22:59:00Z";

/** A small app to put the banner in, the way it sits above the content of a billing page. */
function AppWindow({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Schedule</span>
          <span>Members</span>
          <span className="font-medium text-foreground">Billing</span>
        </span>
      </div>
      <div className="grid gap-5 px-4 py-5 sm:px-6 sm:py-6">
        <p className="text-lg font-semibold tracking-[-0.02em]">Billing</p>
        {children}
        <div aria-hidden="true" className="grid gap-2.5">
          <div className="h-2.5 w-1/4 rounded-full bg-muted" />
          <div className="h-2.5 w-1/2 rounded-full bg-muted" />
          <div className="h-2.5 w-2/5 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [presses, setPresses] = useState(0);

  /** A real app asks its server for a billing portal link here. The demo only waits, so the spinner can be seen, and counts. */
  async function openPortal() {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setPresses((count) => count + 1);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <Case caption="In the grace period the plan still works. The sentence names the card and the day, and the date is a time element: hover it for the full day, time and zone.">
        <AppWindow>
          <PaymentFailedBanner cardLabel="Visa ending 4242" graceEndsAt={GRACE_ENDS} timeZone={ZONE} locale="en-GB" invoiceHref="#invoice" onUpdate={openPortal} labels={{ region: "Payment failed, plan still active" }} />
        </AppWindow>
      </Case>

      <Case caption="Once the grace period is over the banner turns destructive and says that access is paused. The action stays the same: update the card.">
        <AppWindow>
          <PaymentFailedBanner status="overdue" cardLabel="Visa ending 4242" graceEndsAt={GRACE_ENDS} timeZone={ZONE} locale="en-GB" invoiceHref="#invoice" onUpdate={openPortal} labels={{ region: "Payment failed, access paused" }} />
        </AppWindow>
      </Case>

      <div className="grid items-start gap-x-8 gap-y-3 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <Case caption="In a narrow column the actions stack. No invoice link, no card label.">
          <PaymentFailedBanner graceEndsAt={GRACE_ENDS} timeZone={ZONE} locale="en-GB" onUpdate={openPortal} labels={{ region: "Payment failed, narrow column" }} />
        </Case>
        <p className="text-xs leading-relaxed text-muted-foreground tabular-nums md:pt-7">
          Update payment method was pressed {presses} {presses === 1 ? "time" : "times"}. Here it waits a moment and counts; in an app it opens your billing portal. There is no close button: the banner stays until your app stops rendering it.
        </p>
      </div>
    </div>
  );
}
