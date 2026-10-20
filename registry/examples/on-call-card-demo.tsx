"use client";

import { useState, type ReactNode } from "react";

import { OnCallCard, type OnCallEscalation, type OnCallPerson, type OnCallShift } from "@rhs-ui/dashboard/on-call-card";

const ZONE = "Europe/Amsterdam";
const REASONS = ["Checkout is failing", "Database alerts firing", "Customer escalation"];

const escalation: OnCallEscalation = { name: "Sofia Marin", role: "Head of Engineering", phone: "+31 20 555 0142" };

const priya: OnCallShift = { name: "Priya Nair", role: "Backend, primary", start: "2026-10-20T08:00:00+02:00", end: "2026-10-20T18:00:00+02:00" };
const tom: OnCallShift = { name: "Tom de Vries", role: "Platform", start: "2026-10-20T18:00:00+02:00", end: "2026-10-21T08:00:00+02:00" };
const aiko: OnCallShift = { name: "Aiko Tanaka", role: "Backend, secondary", start: "2026-10-20T08:00:00+02:00", end: "2026-10-20T18:00:00+02:00" };
const priyaTomorrow: OnCallShift = { name: "Priya Nair", role: "Backend, primary", start: "2026-10-21T08:00:00+02:00", end: "2026-10-21T18:00:00+02:00" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [sent, setSent] = useState<string[]>([]);
  // A real page would call your paging service here. This one takes a moment, then succeeds.
  const page = async (person: OnCallPerson, reason: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSent((list) => [`${person.name}: ${reason}`, ...list].slice(0, 3));
  };
  const common = { timeZone: ZONE, locale: "en-GB", escalation, reasons: REASONS, scheduleHref: "#rota", onPage: page } as const;

  return (
    <div className="grid w-full max-w-5xl gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,21rem),1fr))]">
      <Example caption="A handover within the hour">
        <OnCallCard {...common} now="2026-10-20T17:25:00+02:00" current={priya} next={tom} />
      </Example>
      <Example caption="Mid-shift, nothing to flag">
        <OnCallCard {...common} now="2026-10-20T11:10:00+02:00" current={aiko} next={priyaTomorrow} />
      </Example>
      <Example caption="Nobody on call">
        <OnCallCard {...common} now="2026-10-20T07:40:00+02:00" current={null} next={priya} />
      </Example>
      <p role="status" className="col-span-full min-h-5 text-sm text-muted-foreground">
        {sent.length ? `Last page sent: ${sent[0]}` : ""}
      </p>
    </div>
  );
}
