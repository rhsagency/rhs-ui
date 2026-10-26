"use client";

import type { ReactNode } from "react";

import { NewsletterCard } from "@rhs-ui/marketing/newsletter-card";

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const subscribe = () => new Promise<void>((resolve) => setTimeout(resolve, 700));

function Example({ caption, className, children }: { caption: string; className?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={className}>
      <p className="mb-3 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        <Example caption="In a blog sidebar, 20rem wide. Try it: an empty field is caught before anything is sent.">
          <NewsletterCard
            className="sm:max-w-xs"
            title="The Friday brief"
            description="The week's three best reads on calm software, in one short email."
            promise="Every Friday at 8:00. Leave with one click."
            privacyHref="#privacy"
            onSubmit={subscribe}
          />
        </Example>
        <Example caption="Compact, for a footer column: the name, the field and the promise">
          <NewsletterCard className="sm:max-w-xs" compact title="Halcyon Dispatch" promise="One email a month. No tracking pixels." privacyHref="#privacy" cta="Join" onSubmit={subscribe} />
        </Example>
        <Example caption="After a failed request: the address stays and the button offers a retry">
          <NewsletterCard
            className="sm:max-w-xs"
            title="Studio Notes"
            description="One design lesson from the studio, with the files, every other Tuesday."
            promise="Every other Tuesday. Leave with one click."
            privacyHref="#privacy"
            defaultValue="maria@halcyon.studio"
            defaultStatus="error"
            onSubmit={subscribe}
          />
        </Example>
        <Example caption="Subscribed: the form gives way to what happens next">
          <NewsletterCard
            className="sm:max-w-xs"
            title="The Sunday read"
            description="One long read for the weekend, chosen by the editors and sent on Sunday morning."
            promise="Every Sunday at 9:00. Leave with one click."
            privacyHref="#privacy"
            defaultValue="maria@halcyon.studio"
            defaultStatus="success"
            onSubmit={subscribe}
          />
        </Example>
        <Example caption="Full width, at the end of an article" className="md:col-span-2">
          <NewsletterCard
            title="Enjoyed this? Get the next one on Friday."
            description="The Friday brief collects the best of the week: three reads, a short note from the editor, and nothing that sells you anything."
            promise="Free, every Friday at 8:00. 12,400 people read it."
            privacyHref="#privacy"
            headingLevel={2}
            onSubmit={subscribe}
          />
        </Example>
      </div>
    </div>
  );
}
