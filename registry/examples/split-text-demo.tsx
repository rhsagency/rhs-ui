import { SplitText } from "@rhs-ui/motion/split-text";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl space-y-10 p-10">
      <SplitText as="h2" text="Good design is quiet until it matters." className="text-4xl font-medium tracking-[-.045em] sm:text-5xl" />
      <SplitText as="p" text="Sharpening from a blur, one word at a time." effect="blur" className="text-xl text-muted-foreground" />
      <SplitText as="p" text="LETTERS" by="letter" className="font-mono text-3xl tracking-[.3em]" />
    </div>
  );
}
