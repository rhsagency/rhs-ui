import { Button } from "@rhs-ui/primitives/button";
import { NotFoundSection } from "@rhs-ui/marketing/not-found-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <NotFoundSection
        actions={<><Button>Back to home</Button><Button variant="outline">Search the docs</Button></>}
        suggestions={[
          { label: "Getting started", href: "#", description: "Install and ship your first page" },
          { label: "Pricing", href: "#", description: "Plans for every team size" },
          { label: "Support", href: "#", description: "Talk to a person" },
        ]}
      />
    </div>
  );
}
