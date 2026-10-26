"use client";

import type { ReactNode } from "react";

import { NewsletterPreview } from "@rhs-ui/marketing/newsletter-preview";

const shared = {
  title: "The Halcyon Dispatch",
  description: "One email on Friday morning: the three most useful things we read about building calm software, and a short note on what we are changing in our own.",
  promise: "Every Friday at 8:00. Leave with one click.",
  readers: "12,400",
  privacyHref: "#privacy",
  issue: {
    number: 148,
    title: "The quiet cost of one more dashboard",
    date: "2026-10-23",
    items: ["Why the fourth chart is where attention stops", "A one-page test for whether a metric deserves a screen", "Three teams that deleted a dashboard and kept the numbers"],
    href: "#archive/148",
  },
  locale: "en-GB",
} as const;

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const subscribe = () => new Promise<void>((resolve) => setTimeout(resolve, 800));

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
      <Example caption="Try it: the card is a link into the archive, and the form announces its result">
        <NewsletterPreview {...shared} onSubmit={subscribe} />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="After subscribing: the form gives way to what happens next, and the issue stays one click away">
          <NewsletterPreview {...shared} headingLevel={3} onSubmit={subscribe} defaultStatus="done" defaultValue="maria@halcyon.studio" />
        </Example>
      </div>
    </div>
  );
}
