"use client";

import type { ReactNode } from "react";

import { FreeAuditForm } from "@rhs-ui/marketing/free-audit-form";

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const requestAudit = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

const copy = {
  title: "Find out what is holding your site back",
  description: "Send us your address and we review speed, search visibility and the basics of accessibility. A person reads every result before it reaches you.",
  points: [
    "Page speed on a phone and on a laptop",
    "Search basics: titles, headings, redirects and indexing",
    "Accessibility problems a quick scan can catch",
    "Three fixes, ranked by how much they would change",
  ],
  turnaround: "Report within 24 hours",
  consent: (
    <>
      We use your email to send the report and one follow-up. No newsletter.{" "}
      <a href="#privacy" className="rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Privacy policy
      </a>
    </>
  ),
  onSubmit: requestAudit,
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: type northwind.co/pricing and leave the field, and the address is tidied to what will be sent">
        <FreeAuditForm {...copy} />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="After sending: what was received, and when the report arrives">
          <FreeAuditForm {...copy} headingLevel={3} defaultStatus="done" defaultValues={{ url: "https://northwind.co/pricing", email: "maria@halcyon.studio" }} />
        </Example>
      </div>
    </div>
  );
}
