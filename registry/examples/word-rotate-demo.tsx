import { WordRotate } from "@rhs-ui/motion/word-rotate";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-3xl p-10 text-center">
      <h2 className="text-4xl font-medium tracking-[-.045em] sm:text-5xl">
        Interfaces for <WordRotate words={["founders", "studios", "agencies", "product teams"]} className="text-muted-foreground" />
      </h2>
    </div>
  );
}
