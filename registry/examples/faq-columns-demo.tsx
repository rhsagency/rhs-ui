import { FaqColumns } from "@rhs-ui/marketing/faq-columns";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <FaqColumns
        eyebrow="FAQ"
        title="Good questions, short answers"
        description={<>Something else? <a href="#contact">Write to us</a> and a person answers.</>}
        faqs={[
          { question: "Can I cancel at any time?", answer: "Yes. Cancel from your account; you keep access until the end of the period you paid for." },
          { question: "Where is my data stored?", answer: "In Frankfurt and Amsterdam, encrypted at rest. Nothing leaves the EU." },
          { question: "Do you offer discounts?", answer: "Nonprofits and schools get 50% off. Ask us with a link to your organisation." },
          { question: "Is there an API?", answer: "A REST API and webhooks on every plan, documented with examples." },
          { question: "Can I import from another tool?", answer: "From CSV and from the five most used tools, with history." },
          { question: "How does billing work for teams?", answer: "Per active member per month. Guests are always free." },
        ]}
      />
    </div>
  );
}
