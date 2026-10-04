import { Button } from "@rhs-ui/primitives/button";
import { BorderBeam } from "@rhs-ui/motion/border-beam";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-sm p-10">
      <BorderBeam>
        <div className="p-6">
          <p className="text-xs uppercase tracking-[.18em] text-muted-foreground">Recommended</p>
          <p className="mt-3 text-sm font-medium">Team</p>
          <p className="mt-1 text-4xl font-medium tracking-[-.05em]">€12<span className="text-sm font-normal text-muted-foreground"> / person</span></p>
          <Button className="mt-6 w-full">Choose Team</Button>
        </div>
      </BorderBeam>
    </div>
  );
}
