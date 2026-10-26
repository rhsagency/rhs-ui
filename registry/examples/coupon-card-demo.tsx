"use client";

import { useState, type ReactNode } from "react";

import { CouponCard } from "@rhs-ui/commerce/coupon-card";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-8">
      <Example caption="Active: the code copies in one press, the date is in the tooltip and the small print behind Details">
        <CouponCard
          offer="20% off"
          description="Everything in the Northwind outlet, in every size and colour."
          code="OUTLET20"
          expiresAt="2026-10-29"
          conditions={["Valid on outlet items only", "Cannot be combined with another code", "Orders from €50", "One use per customer"]}
          onCopy={setCopied}
          now="2026-10-26T09:00:00Z"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
        <p role="status" className="min-h-4 text-xs text-muted-foreground">
          {copied ? `Copied ${copied} to the clipboard.` : ""}
        </p>
      </Example>

      <Example caption="Used: muted, the code is struck through and there is nothing to copy">
        <CouponCard offer="€10 off" description="Your first order at Halcyon Home." code="WELCOME10" expiresAt="2026-12-31" status="used" now="2026-10-26T09:00:00Z" locale="en-GB" timeZone="Europe/Amsterdam" />
      </Example>

      <Example caption="Expired: the same, with the day it ended">
        <CouponCard
          offer="Free delivery"
          description="On any order, to the Netherlands and Belgium."
          code="AUTUMNSHIP"
          expiresAt="2026-10-18"
          conditions={["Standard delivery only"]}
          now="2026-10-26T09:00:00Z"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>
    </div>
  );
}
