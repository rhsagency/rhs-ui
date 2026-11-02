"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { SmsMessageField, type SmsCount } from "@rhs-ui/primitives/sms-message-field";
import { countSms } from "@rhs-ui/primitives/sms-message-field/sms";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

// The emoji and the curly apostrophe are written by code point: they are what turns this text into Unicode, and they must survive any editor.
const REMINDER = "Hi Marit, order NW-10482 is on its way \u{1F4E6} Don\u2019t forget to be home Thursday, 9:00 to 12:00. Reply STOP to opt out.";

const PAYMENT = "Paid: EUR 48,50 {ref 8F2K} [Kestrel kettle]. Total with shipping: \u20ac56,00.";

const LONG =
  "Dear customer, thank you for your order NW-10482 with Northwind. Your parcel left our warehouse this morning and will be delivered on Thursday between 9:00 and 12:00. If nobody is home, the courier leaves it with a neighbour or at the pick-up point on Harbour Lane. You can follow the parcel with the code on your confirmation email.";

function Reminder(): React.JSX.Element {
  const [message, setMessage] = useState(REMINDER);
  const [count, setCount] = useState<SmsCount>(() => countSms(REMINDER));
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Delivery reminder</h2>
        <p className="text-xs text-muted-foreground">Sent to 1,240 customers the evening before their delivery.</p>
      </div>
      <SmsMessageField
        label="Message"
        name="message"
        senderLabel="Northwind"
        maxSegments={3}
        value={message}
        onValueChange={(next, cost) => {
          setMessage(next);
          setCount(cost);
        }}
      />
      <Button type="submit">Schedule reminder</Button>
      {/* What the field reported is for the reader of the demo, so a screen reader is not read it on every key. */}
      <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground tabular-nums">
        <span>onValueChange, the cost</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify({ segments: count.segments, units: count.units })}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      {/* Two columns of about the same height, so the sheet has no empty corner. */}
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: one emoji and one curly apostrophe turn this into Unicode, and two messages. Use plain characters swaps the apostrophe; the emoji is yours to remove">
          <Reminder />
        </Example>
        <Example caption="Disabled">
          <SmsMessageField label="Order confirmed" senderLabel="Northwind" rows={2} disabled defaultValue="Thanks Marit, order NW-10482 is confirmed. We will text you when it ships." />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Standard characters: one message holds 160">
          <SmsMessageField label="Table is ready" senderLabel="Halcyon" rows={2} defaultValue="Your table for 4 is ready. Show this text at the desk and we will seat you." />
        </Example>
        <Example caption="Some characters count double, and the line names them">
          <SmsMessageField label="Payment received" rows={2} defaultValue={PAYMENT} />
        </Example>
        <Example caption="More messages than the limit allows: the bar and the counter turn to the error colour, and nothing is cut off">
          <SmsMessageField label="Parcel update" maxSegments={2} rows={4} defaultValue={LONG} />
        </Example>
      </div>
    </div>
  );
}
