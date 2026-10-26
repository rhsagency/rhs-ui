"use client";

import type { ReactNode } from "react";

import { ContactFaqSplit, type ContactFaq } from "@rhs-ui/marketing/contact-faq-split";

const faqs: ContactFaq[] = [
  {
    question: "Where is my order?",
    answer: "Every order gets a tracking link by email as soon as it ships, usually within one working day. If it is more than five working days late, write to us and we will chase the carrier.",
    keywords: ["tracking", "parcel", "package", "shipped", "delivery", "late", "arrive"],
  },
  {
    question: "How do I change or cancel an order?",
    answer: "Until it ships you can change or cancel it yourself from Orders in your account. Once it has shipped, send it back when it arrives and we refund it in full.",
    keywords: ["cancel", "change", "edit", "mistake"],
  },
  {
    question: "How do returns and refunds work?",
    answer: "Send back anything unused within 30 days, free of charge, and we refund the original payment method within five working days of the parcel reaching us.",
    keywords: ["refund", "return", "money back", "exchange", "send back"],
  },
  {
    question: "Can I change my delivery address?",
    answer: "Yes, until the order ships. After that the carrier can redirect the parcel for you from the tracking page.",
    keywords: ["address", "move", "moved", "redirect"],
  },
  {
    question: "Which payment methods do you accept?",
    answer: "Cards, iDEAL, PayPal and Apple Pay. You are charged when the order ships, never before.",
    keywords: ["pay", "card", "ideal", "paypal", "invoice", "charged"],
  },
  {
    question: "How do I reset my password?",
    answer: "Choose Forgot password on the sign-in page and we email you a link that works for one hour.",
    keywords: ["login", "log in", "sign in", "account", "locked"],
  },
];

/** A request that takes a moment and works, so the busy and success states can be seen by trying it. */
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 900));

const shared = {
  title: "How can we help?",
  description: "Most questions have a quick answer below. If yours does not, write to us and a person will reply.",
  promise: "We reply within one working day.",
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
      <Example caption="Try it: write a line about a late parcel or a refund, then pause, and the closest question is offered">
        <ContactFaqSplit {...shared} faqs={faqs} />
      </Example>

      <div className="mt-16 grid gap-x-12 gap-y-16 border-t border-border pt-12 lg:grid-cols-2">
        <Example caption="One polite hint opens the answer; the send button stays free">
          <ContactFaqSplit
            {...shared}
            headingLevel={3}
            faqs={faqs.slice(0, 3)}
            defaultOpen={null}
            defaultValues={{ message: "I would like my money back for the jacket, it does not fit me." }}
          />
        </Example>
        <Example caption="After sending: who will answer, where and when">
          <ContactFaqSplit
            {...shared}
            headingLevel={3}
            faqs={faqs.slice(0, 3)}
            defaultStatus="done"
            defaultValues={{ name: "Maria Janssen", email: "maria@halcyon.studio" }}
          />
        </Example>
      </div>
    </div>
  );
}
