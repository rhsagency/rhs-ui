"use client";

import { useState } from "react";

import { CallLogRow, type CallLogEntry } from "@rhs-ui/application/call-log-row";
import { IconCheck } from "@rhs-ui/icons";

// A fixed "now" keeps "Yesterday" the same on every load (a Monday). In an app, leave `now` out and the rows read the browser's clock.
const NOW = Date.parse("2026-10-26T15:30:00Z");

// Drawn portraits as data URIs, so the preview needs no image host.
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${background}"/><circle cx="48" cy="38" r="17" fill="${figure}"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="${figure}"/></svg>`);

const CALLS: readonly CallLogEntry[] = [
  { id: "anna", name: "Anna de Vries", image: portrait("#d9d6cf", "#3a3733"), number: "+31612345678", direction: "missed", at: "2026-10-26T14:32:00Z" },
  { id: "unknown", number: "+14155550132", direction: "missed", at: "2026-10-26T11:08:00Z", voicemail: { duration: 42 } },
  { id: "tom", name: "Tom Brandt", number: "+442079460958", direction: "incoming", at: "2026-10-25T17:45:00Z", duration: 201 },
  { id: "mia", name: "Mia Jansen", image: portrait("#2c2f33", "#e9e7e2"), number: "+31 20 123 4567", direction: "outgoing", at: "2026-10-23T09:10:00Z", duration: 725 },
  { id: "bare", number: "4155550199", direction: "outgoing", at: "2026-10-20T16:20:00Z", duration: 95 },
  {
    id: "priya",
    name: "Priya Nair",
    number: "+31 6 5555 0147",
    direction: "incoming",
    at: "2026-10-14T10:00:00Z",
    duration: 1860,
    note: "Asked for the renewal quote. Send it before Friday and copy finance.",
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const label = (call: CallLogEntry) => call.name ?? call.number ?? "this caller";

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-8">
      <section aria-labelledby="call-log-row-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
          <h2 id="call-log-row-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
            Recent calls
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">2 missed today</p>
        </div>
        <ul className="divide-y divide-border">
          {CALLS.map((call) => (
            <CallLogRow
              key={call.id}
              call={call}
              now={NOW}
              locale="en-GB"
              showNote={call.id === "priya"}
              onOpen={(entry) => setNote(`Opening the history with ${label(entry)}.`)}
              onCallBack={async (entry) => {
                await wait(1100);
                setNote(`Call to ${label(entry)} connected.`);
              }}
              onNote={(entry) => setNote(`Writing a note about the call with ${label(entry)}.`)}
              onPlayVoicemail={(entry) => setNote(`Playing the voicemail from ${label(entry)}.`)}
            />
          ))}
        </ul>
        <p aria-live="polite" className="flex min-h-11 items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
          {note ? (
            <>
              <IconCheck className="size-3.5 shrink-0 text-foreground" />
              {note}
            </>
          ) : (
            "Press a call-back button, play the voicemail, or open a row."
          )}
        </p>
      </section>

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">In a narrow panel the time moves up beside the name, the length joins the arrow, and the number gives way.</p>
        <ul className="w-full max-w-sm divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs" aria-label="Calls in a side panel">
          {[CALLS[0], CALLS[1], CALLS[2]].map((call) =>
            call ? <CallLogRow key={call.id} call={call} now={NOW} locale="en-GB" onOpen={() => undefined} onCallBack={() => undefined} onPlayVoicemail={() => undefined} /> : null,
          )}
        </ul>
      </div>
    </div>
  );
}
