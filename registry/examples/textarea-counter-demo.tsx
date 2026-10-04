import { Label } from "@rhs-ui/primitives/label";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-md gap-2 p-8">
      <Label htmlFor="bio-demo">Short bio</Label>
      <TextareaCounter id="bio-demo" limit={160} rows={4} defaultValue="Designer in Utrecht. I make calm software for small teams and write about it on Sundays." />
    </div>
  );
}
