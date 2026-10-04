import { Button } from "@rhs-ui/primitives/button";
import { CtaChecklist } from "@rhs-ui/marketing/cta-checklist";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <CtaChecklist
        eyebrow="Start today"
        title="Everything you need for your first hundred customers."
        description="Try every feature for 14 days. Keep your data if you leave."
        actions={<><Button size="lg">Start free trial</Button><Button size="lg" variant="outline">Talk to sales</Button></>}
        note="No card needed for the trial."
        points={["Unlimited projects and guests", "Invoices in 24 languages", "Bank feeds for 2,400 banks", "Export to your accountant in one click", "Support from real people, 7 days a week"]}
      />
    </div>
  );
}
