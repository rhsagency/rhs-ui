import { Button } from "@rhs-ui/primitives/button";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-5 p-8">
      <Button variant="outline" className="w-full">Continue with Google</Button>
      <LabeledDivider>or with email</LabeledDivider>
      <Button className="w-full">Send me a link</Button>
      <LabeledDivider align="left">Older</LabeledDivider>
    </div>
  );
}
