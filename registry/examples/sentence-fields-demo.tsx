"use client";

import { useState, type ReactNode } from "react";

import { SentenceFields, type SentencePiece, type SentenceSlot, type SentenceText } from "@rhs-ui/application/sentence-fields";
import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

const hours = Array.from({ length: 13 }, (_, i) => `${String(i + 6).padStart(2, "0")}:00`);

const DIGEST_TEMPLATE: readonly SentencePiece[] = ["Email me", { slot: "frequency" }, { text: "at", withSlot: "time" }, { slot: "time" }, "about", { slot: "topic" }, "."];

const DIGEST_SLOTS: readonly SentenceSlot[] = [
  {
    id: "frequency",
    label: "Frequency",
    placeholder: "how often",
    options: [
      { value: "instant", label: "as it happens" },
      { value: "daily", label: "every day" },
      { value: "weekdays", label: "every weekday" },
      { value: "monday", label: "every Monday" },
      { value: "monthly", label: "on the first of the month" },
    ],
  },
  { id: "time", label: "Time", placeholder: "what time", options: hours, when: { slot: "frequency", not: "instant" } },
  {
    id: "topic",
    label: "Topic",
    placeholder: "what about",
    options: [
      { value: "orders", label: "new orders" },
      { value: "refunds", label: "refunds" },
      { value: "stock", label: "low stock" },
      { value: "payments", label: "failed payments" },
      { value: "all", label: "everything in the shop" },
    ],
  },
];

const ALERT_TEMPLATE = "Post to {channel} when {event} for more than {duration}.";

const ALERT_SLOTS: readonly SentenceSlot[] = [
  { id: "channel", label: "Channel", placeholder: "a channel", options: ["#ops", "#sales", "#support", "#launch-room"] },
  {
    id: "event",
    label: "Event",
    placeholder: "an event",
    options: [
      { value: "payment", label: "a payment fails" },
      { value: "stock", label: "stock runs low" },
      { value: "build", label: "a build breaks" },
      { value: "uptime", label: "uptime drops below 99%" },
    ],
  },
  {
    id: "duration",
    label: "Duration",
    placeholder: "a duration",
    options: [
      { value: "1m", label: "1 minute" },
      { value: "5m", label: "5 minutes" },
      { value: "15m", label: "15 minutes" },
      { value: "1h", label: "an hour" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const [digest, setDigest] = useState<SentenceText>({ text: "", complete: false });
  const [saved, setSaved] = useState<string | null>(null);
  const [alert, setAlert] = useState<SentenceText>({ text: "", complete: false });

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Try it: open a word and choose. Pick “as it happens” and the time goes away with its “at”; pick a day again and it comes back with what you had.">
        <div className={card}>
          <SentenceFields
            template={DIGEST_TEMPLATE}
            slots={DIGEST_SLOTS}
            defaultValue={{ frequency: "monday", time: "09:00", topic: "orders" }}
            onSentenceChange={(sentence) => {
              setDigest(sentence);
              setSaved(null);
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border pt-4">
            <div className="grid min-w-0 gap-0.5">
              <p className="text-xs text-muted-foreground">As plain text, for a confirmation step</p>
              <p className="text-sm leading-5 font-medium text-pretty">{digest.text || "\u00a0"}</p>
            </div>
            <Button type="button" disabled={!digest.complete} onClick={() => setSaved(digest.text)} className="shrink-0">
              {saved ? <IconCheck aria-hidden="true" /> : null}
              {saved ? "Rule saved" : "Save rule"}
            </Button>
          </div>
        </div>
      </Example>

      <Example caption="An unfinished sentence shows its blanks in a dashed, lighter word, and the plain text says so. The button waits for the last one.">
        <div className={card}>
          <SentenceFields template={ALERT_TEMPLATE} slots={ALERT_SLOTS} defaultValue={{ channel: "#ops" }} onSentenceChange={setAlert} />
          <p role="status" className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
            {alert.complete ? <span className="font-medium text-foreground">{alert.text}</span> : <>Still to choose: <span className="text-foreground">{alert.text}</span></>}
          </p>
        </div>
      </Example>
    </div>
  );
}
