import { TypewriterText } from "@rhs-ui/motion/typewriter-text";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-10">
      <h2 className="text-4xl font-medium tracking-[-.045em]">
        <TypewriterText text="Ship the page before the coffee gets cold." />
      </h2>
      <p className="mt-4 font-mono text-sm text-muted-foreground">
        <TypewriterText text="$ npx shadcn add https://rhsui.com/r/typewriter-text.json" speed={20} delay={1600} />
      </p>
    </div>
  );
}
