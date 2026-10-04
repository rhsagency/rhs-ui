import { IconArrowRight, IconHeart, IconShare } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Magnetic } from "@rhs-ui/motion/magnetic";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-64 flex-wrap items-center justify-center gap-10 p-10">
      <Magnetic>
        <Button size="lg">Get started <IconArrowRight /></Button>
      </Magnetic>
      <Magnetic strength={0.45}>
        <Button size="icon" variant="outline" aria-label="Like"><IconHeart /></Button>
      </Magnetic>
      <Magnetic strength={0.45}>
        <Button size="icon" variant="outline" aria-label="Share"><IconShare /></Button>
      </Magnetic>
    </div>
  );
}
