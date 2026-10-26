"use client";

import type { ReactNode } from "react";

import { ContactFormCentered } from "@rhs-ui/marketing/contact-form-centered";

const topics = [
  { value: "sales", label: "Talk to sales", description: "Pricing, demos and quotes" },
  { value: "support", label: "Get help", description: "Something is not working as expected" },
  { value: "billing", label: "Billing", description: "Invoices, refunds and VAT" },
  { value: "press", label: "Press", description: "Interviews, facts and images" },
  { value: "other", label: "Something else" },
];

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

const copy = {
  description: "Questions about pricing, a rollout or something that is not working? Write to us and a person answers.",
  promise: "We reply within one working day.",
  privacyHref: "#privacy",
  topics,
  onSubmit: send,
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
      <div className="grid gap-x-12 gap-y-16 lg:grid-cols-2">
        <Example caption="Try it: send it empty to see the mistakes, then fill it in to see the busy and sent states">
          <ContactFormCentered {...copy} title="Get in touch" headingLevel={2} />
        </Example>
        <Example caption="After a first attempt: each mistake is said in words next to its field, and the first one takes focus">
          <ContactFormCentered {...copy} title="Talk to us" headingLevel={2} defaultStatus="invalid" defaultValues={{ name: "Maria Jansen", email: "maria@halcyon" }} />
        </Example>
        <Example caption="When sending fails: everything typed is kept, and the button tries again">
          <ContactFormCentered
            {...copy}
            title="Write to us"
            headingLevel={2}
            defaultStatus="error"
            defaultValues={{
              name: "Maria Jansen",
              email: "maria@halcyon.studio",
              topic: "billing",
              message: "Our March invoice shows 14 seats, but we only had 12 active at the end of the month. Could you check?",
              consent: true,
            }}
          />
        </Example>
        <Example caption="Sent: the form gives way to a status message that repeats the address it will answer">
          <ContactFormCentered {...copy} title="Say hello" headingLevel={2} defaultStatus="done" defaultValues={{ name: "Maria Jansen", email: "maria@halcyon.studio", topic: "billing" }} />
        </Example>
      </div>
    </div>
  );
}
