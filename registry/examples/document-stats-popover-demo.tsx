"use client";

import { useState, type ReactNode } from "react";

import { DocumentStatsPanel, DocumentStatsPopover } from "@rhs-ui/application/document-stats-popover";
import { countText } from "@rhs-ui/application/document-stats-popover/stats";
import { IconCheck } from "@rhs-ui/icons";

const LETTER = `Dear customers,

Autumn is our busiest season, and this year it arrived early. Orders in September were up by a third on last year, and most of you were kind enough to wait while we caught up with the workshop. Thank you for that. We know a delayed parcel is never a small thing when it holds a gift or a tool you need for the weekend, so this letter explains what happened and what we are changing.

The short version is that we grew faster than our packing line. Until August every order was picked, wrapped and labelled by the same four people in Veenendaal. When the weekly volume doubled, the first hour of each morning went to finding things rather than sending them. We have since moved the fast sellers to the front, added a second packing table and hired two people who start on Monday.

Delivery times are already shorter. Orders placed before noon now leave the same day, and the average time from payment to the carrier has dropped from three days to one and a half. We will keep publishing that number on the shipping page every Friday, including the weeks when it is worse than we would like.

Two things will change in November. First, every parcel gets a tracking link the moment it leaves, not the next morning. Second, if something is out of stock we will tell you at checkout instead of after you have paid, and we will say when it is expected back. Both were on your list of requests, and both are done.

If your order is still late, reply to this email and a person will answer within a working day. We read every message. Thank you again for your patience, and for choosing to buy from a small team that cares how the box looks when it arrives.

Warm regards,
Mara and the whole Halcyon crew`;

// The second paragraph, as if it were selected with the mouse.
const SELECTED = LETTER.split("\n\n")[2] ?? "";

// Counted once, outside any render: the flat panels below show numbers, they do not change.
const WHOLE = countText(LETTER, "en-US");
const PART = countText(SELECTED, "en-US");
const LONG = countText(`${LETTER}\n\n${LETTER}\n\n${LETTER}\n\n${LETTER}`, "en-US");

export default function Demo(): React.JSX.Element {
  const [text, setText] = useState(LETTER);
  const [selected, setSelected] = useState("");

  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Case caption="Type in the letter, or select a few words, and open the count in the footer: the numbers follow, the tag says whether they are for the document or the selection, and the bar tracks the goal. A screen reader hears the new count only after you stop typing.">
        <section aria-labelledby="doc-stats-editor" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <h2 id="doc-stats-editor" className="truncate text-sm font-semibold tracking-[-0.01em]">
              Letter to customers
            </h2>
            <p className="shrink-0 text-xs text-muted-foreground">Draft</p>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onSelect={(event) => {
              const field = event.currentTarget;
              setSelected(field.value.slice(field.selectionStart, field.selectionEnd));
            }}
            aria-label="Letter to customers"
            spellCheck={false}
            className="block h-[26rem] w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed outline-none focus-visible:bg-muted/30"
          />
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-3 py-1.5">
            <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
              <IconCheck aria-hidden="true" className="size-3.5" />
              Saved just now
            </p>
            <DocumentStatsPopover text={text} selectionText={selected} goal={{ words: 500 }} align="end" defaultOpen />
          </div>
        </section>
      </Case>

      <div className="grid gap-x-8 gap-y-10 md:grid-cols-3 md:items-start">
        <Case caption="With a paragraph selected: its numbers, a tag that says Selection, and the whole document kept in sight.">
          <Surface>
            <DocumentStatsPanel stats={WHOLE} selection={PART} goal={{ words: 500 }} />
          </Surface>
        </Case>
        <Case caption="A goal that is passed says by how much, in words, with a check.">
          <Surface>
            <DocumentStatsPanel stats={LONG} goal={{ words: 500 }} />
          </Surface>
        </Case>
        <Case caption="A very long text is counted in idle time: the numbers it has stay, and the panel says it is counting.">
          <Surface>
            <DocumentStatsPanel stats={LONG} counting />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">{children}</div>;
}
