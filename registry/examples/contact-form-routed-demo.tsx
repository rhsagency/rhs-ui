"use client";

import type { ReactNode } from "react";

import { ContactFormRouted, type ContactRoute } from "@rhs-ui/marketing/contact-form-routed";
import { IconBriefcase, IconHeadphones, IconNewspaper, IconReceipt } from "@rhs-ui/icons";

const routes: ContactRoute[] = [
  {
    id: "sales",
    label: "Sales",
    description: "Pricing, demos and rollouts",
    icon: <IconBriefcase />,
    promise: "A person from sales replies within one working day, usually sooner.",
    messagePlaceholder: "Tell us about your team and what you would like to change.",
    fields: [
      {
        name: "companySize",
        label: "Company size",
        type: "select",
        required: true,
        options: [
          { value: "1-10", label: "1 to 10 people" },
          { value: "11-50", label: "11 to 50 people" },
          { value: "51-200", label: "51 to 200 people" },
          { value: "201-1000", label: "201 to 1,000 people" },
          { value: "1000+", label: "More than 1,000 people" },
        ],
      },
      { name: "role", label: "Your role", placeholder: "e.g. Head of operations", autoComplete: "organization-title" },
      { name: "useCase", label: "What do you want to solve?", type: "textarea", placeholder: "For example: replace three spreadsheets and a shared inbox." },
    ],
  },
  {
    id: "support",
    label: "Support",
    description: "Something is not working",
    icon: <IconHeadphones />,
    promise: "A support engineer replies within 4 working hours. Anything that blocks your work goes first.",
    messagePlaceholder: "What happened, and what did you expect to happen?",
    fields: [
      { name: "orderId", label: "Order or account ID", required: true, placeholder: "NW-48213", hint: "Printed on your invoice and in the top corner of the app." },
      {
        name: "urgency",
        label: "How urgent is it?",
        type: "select",
        options: [
          { value: "blocking", label: "It blocks my work" },
          { value: "workaround", label: "Annoying, with a workaround" },
          { value: "question", label: "Just a question" },
        ],
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Invoices, refunds and VAT",
    icon: <IconReceipt />,
    promise: "Finance answers within two working days and can fix most invoices on the spot.",
    messagePlaceholder: "Which invoice, and what should be different?",
    fields: [
      { name: "invoice", label: "Invoice number", placeholder: "INV-2026-0412" },
      {
        name: "about",
        label: "What is it about?",
        type: "select",
        required: true,
        options: [
          { value: "invoice", label: "A question about an invoice" },
          { value: "refund", label: "A refund" },
          { value: "plan", label: "Changing my plan" },
          { value: "vat", label: "VAT or company details" },
        ],
      },
    ],
  },
  {
    id: "press",
    label: "Press",
    description: "Interviews, facts and images",
    icon: <IconNewspaper />,
    promise: "Our press lead replies within a day, and always before your deadline.",
    messagePlaceholder: "What is the story, and what do you need from us?",
    fields: [
      { name: "deadline", label: "Deadline", type: "date", required: true, hint: "The day you need an answer by." },
      { name: "outlet", label: "Outlet or publication", required: true, placeholder: "The Northern Review", autoComplete: "organization" },
    ],
  },
];

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

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
      <Example caption="Try it: change the topic and the questions, the promise and the button change with it, while name, email and message stay as typed">
        <ContactFormRouted
          title="Talk to the right team"
          description="One form for everything. Pick what it is about and it goes straight to the people who can answer."
          routes={routes}
          onSubmit={send}
          privacyHref="#privacy"
        />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="After a first attempt on the Press topic: each mistake is said in words next to its field, and the first one takes focus">
          <ContactFormRouted
            title="Press enquiries"
            headingLevel={3}
            routes={routes}
            onSubmit={send}
            defaultRoute="press"
            defaultStatus="invalid"
            defaultValues={{ name: "Elif Demir", email: "elif@northernreview" }}
            privacyHref="#privacy"
          />
        </Example>
      </div>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="Sent: the form gives way to a status message that names the team and repeats the address it will answer">
          <ContactFormRouted
            title="Write to us"
            headingLevel={3}
            routes={routes}
            onSubmit={send}
            defaultRoute="support"
            defaultStatus="done"
            defaultValues={{ name: "Maria Jansen", email: "maria@halcyon.studio" }}
          />
        </Example>
      </div>
    </div>
  );
}
