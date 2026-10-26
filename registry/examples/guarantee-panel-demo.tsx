import { GuaranteePanel } from "@rhs-ui/marketing/guarantee-panel";
import { Button } from "@rhs-ui/primitives/button";

const terms = [
  { term: "What is covered", detail: "Every plan, monthly or yearly, and every add-on you bought with it." },
  { term: "How to ask", detail: "Reply to any receipt or write to billing@halcyon.example. No form, and you do not have to say why." },
  { term: "How fast", detail: "The money is back on the card you paid with within five working days." },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-6 text-xs text-muted-foreground">Before the final call to action: the promise as a heading, three plain terms, the action and the policy</p>
      <GuaranteePanel
        title="full refund, no questions"
        period={{ value: 30, unit: "days" }}
        terms={terms}
        policyHref="#refund-policy"
        action={<Button size="lg">Start free for 14 days</Button>}
      />

      <div className="mt-16 max-w-md border-t border-border pt-10">
        <p className="mb-6 text-xs text-muted-foreground">Beside pricing, in a narrow column: the seal sits on top and the terms stack</p>
        <GuaranteePanel
          headingLevel={3}
          title="A full refund within {period}, however you ask"
          period={{ value: 60, unit: "days" }}
          terms={terms.slice(0, 2)}
          policyHref="#refund-policy"
        />
      </div>
    </div>
  );
}
