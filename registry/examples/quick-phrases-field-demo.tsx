"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { QuickPhrasesField } from "@rhs-ui/primitives/quick-phrases-field";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const COURIER = ["Leave at the door", "Ring twice", "Call on arrival", "Use the side entrance", "Fragile, handle with care", "No plastic bag"];
const TAGS = ["Fast delivery", "Great packaging", "Exactly as described", "Good value", "Would buy again", "Easy to assemble"];
const REPLIES = ["Thanks for getting in touch.", "I have refunded your order.", "The money arrives within 3 to 5 working days.", "Is there anything else I can help with?"];
const VISITS = ["Morning", "Afternoon", "First visit", "Wheelchair access", "Interpreter"];

function Delivery(): React.JSX.Element {
  const [note, setNote] = useState("Leave at the door\nRing twice");
  const [saved, setSaved] = useState<string | null>(null);
  const lines = saved === null ? 0 : saved.split("\n").filter(Boolean).length;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(note);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Delivery to 14 Harbour Lane</h2>
        <p className="text-xs text-muted-foreground">Order NW-10482 arrives on Thursday between 9:00 and 12:00.</p>
      </div>
      <QuickPhrasesField
        label="Note for the courier"
        name="courier-note"
        phrases={COURIER}
        value={note}
        onValueChange={(next) => {
          setNote(next);
          setSaved(null);
        }}
        placeholder="Anything the courier should know?"
      />
      <Button type="submit">Save delivery note</Button>
      <div className="grid border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">{saved === null ? null : lines === 0 ? "Saved an empty note" : `Saved ${lines} ${lines === 1 ? "line" : "lines"} for the courier`}</p>
        {saved === null ? (
          // What the field reported is for the reader of the demo, so a screen reader is not read it on every tap.
          <p aria-hidden="true" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>onValueChange</span>
            <code className="font-mono text-[0.6875rem] break-all text-foreground">{JSON.stringify(note)}</code>
          </p>
        ) : null}
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      {/* Two columns of about the same height, so the sheet has no empty corner. */}
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: tap a phrase to add it, tap it again to take it out. Typing a phrase by hand presses its chip too">
          <Delivery />
        </Example>
        <Example caption="Appointment requests, joined with commas">
          <QuickPhrasesField label="Anything we should know?" phrases={VISITS} separator=", " rows={2} defaultValue="Morning, First visit" />
        </Example>
        <Example caption="Disabled">
          <QuickPhrasesField label="Note for the driver" phrases={COURIER.slice(0, 3)} disabled defaultValue="Call on arrival" rows={2} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A limit: phrases that no longer fit are disabled, and the line says why">
          <QuickPhrasesField label="Review tags" phrases={TAGS} separator=", " maxLength={64} rows={2} defaultValue="Fast delivery, Great packaging, Exactly as described" />
        </Example>
        <Example caption="Support replies run on as sentences, and the phrases keep their full stops">
          <QuickPhrasesField label="Reply to Marit" phrases={REPLIES} separator=" " rows={3} defaultValue="Thanks for getting in touch." />
        </Example>
        <Example caption="Or as paragraphs, a blank line apart: taking a phrase out takes its gap with it">
          <QuickPhrasesField label="Reply to Jonas" phrases={REPLIES} separator={"\n\n"} rows={5} defaultValue={"Thanks for getting in touch.\n\nI have refunded your order."} />
        </Example>
      </div>
    </div>
  );
}
