import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl space-y-14 p-8">
      <SectionHeading eyebrow="Recent work" title="Projects we shipped this year" description="A few of the launches we are proudest of." action={<Button variant="outline">All projects</Button>} />
      <SectionHeading align="center" eyebrow="Pricing" title="One plan, everything in it" description="No seats to count, no features held back." />
    </div>
  );
}
