"use client";

import { FaqTabs } from "@rhs-ui/marketing/faq-tabs";

export default function Demo(): React.JSX.Element {
  return (
    <div className="px-6">
      <FaqTabs
        title="Frequently asked"
        description="Pick a topic. Still stuck? We answer email within a working day."
        groups={[
          { id: "billing", label: "Billing", items: [{ question: "Can I pay by invoice?", answer: "Yes, annual plans can be paid by bank transfer with a 30-day term." }, { question: "Do you charge VAT?", answer: "Prices exclude VAT for businesses in the EU with a valid VAT number." }] },
          { id: "account", label: "Account", items: [{ question: "Can I change my email address?", answer: "Yes, under Settings, Profile. We send a confirmation to the new address." }] },
          { id: "security", label: "Security", items: [{ question: "Where is my data stored?", answer: "In the EU, in two regions, encrypted at rest and in transit." }, { question: "Do you support two-step sign-in?", answer: "Yes, with an authenticator app or a security key." }] },
        ]}
      />
    </div>
  );
}
