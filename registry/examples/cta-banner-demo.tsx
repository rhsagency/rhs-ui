import { Button } from "@rhs-ui/primitives/button";
import { CtaBanner } from "@rhs-ui/marketing/cta-banner";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <CtaBanner title="Moving from another tool?" description="Import projects, people and history in one go. It takes about four minutes." actions={<Button>Start the import</Button>} />
      <CtaBanner tone="inverted" title="Ready when your team is." actions={<Button variant="secondary">Try it free</Button>} />
    </div>
  );
}
