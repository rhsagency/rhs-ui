"use client";

import type { ReactNode } from "react";

import { NewsletterLists, type NewsletterList } from "@rhs-ui/marketing/newsletter-lists";

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const subscribe = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

const lists: NewsletterList[] = [
  { id: "weekly-digest", name: "Weekly digest", description: "The five best things we read, shipped or learned this week.", frequency: "Every Friday" },
  { id: "product-updates", name: "Product updates", description: "What is new in Halcyon, and what it means for your workflow.", frequency: "Twice a month" },
  { id: "engineering-notes", name: "Engineering notes", description: "Long reads from the team on performance, reliability and tooling.", frequency: "Monthly" },
  { id: "customer-stories", name: "Customer stories", description: "How other teams run their projects, with their numbers.", frequency: "Every quarter" },
];

const copy = {
  title: "Choose what you get",
  description: "Four newsletters, and you pick. Every one has an unsubscribe link, and you can change your mind later.",
  onSubmit: subscribe,
  privacyHref: "#privacy",
};

/** The same lists with the ones a reader already asked for marked as defaults. */
const chosen = (...ids: string[]) => lists.map((list) => ({ ...list, defaultChecked: ids.includes(list.id) }));

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
      <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
        <Example caption="Try it: nothing is checked and the button is off. Choose two lists, add an address, and subscribe">
          <NewsletterLists {...copy} lists={lists} />
        </Example>
        <div className="grid min-w-0 content-start gap-16">
          <Example caption="When sending fails: the choices and the address are kept, and the button tries again">
            <NewsletterLists {...copy} headingLevel={3} lists={chosen("product-updates")} defaultEmail="maria@halcyon.studio" defaultStatus="error" />
          </Example>
          <Example caption="After subscribing: the confirmation takes the form's place, repeats the chosen lists and says what happens next">
            <NewsletterLists {...copy} headingLevel={3} lists={chosen("weekly-digest", "product-updates")} defaultEmail="maria@halcyon.studio" defaultStatus="done" />
          </Example>
        </div>
      </div>
    </div>
  );
}
