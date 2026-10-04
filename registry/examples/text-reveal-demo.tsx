import { TextReveal } from "@rhs-ui/motion/text-reveal";

export default function Demo(): React.JSX.Element {
  return (
    <div className="relative h-[30rem] w-full overflow-y-auto rounded-xl border border-border bg-muted/40">
      <div className="grid h-[32rem] place-items-center text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Scroll inside this panel</p>
      </div>
      <TextReveal
        as="blockquote"
        className="mx-auto max-w-2xl px-6 text-3xl leading-tight font-medium tracking-tight sm:text-4xl"
        text="We build the interface once, carefully, so that every screen after it can be fast, calm and unmistakably yours."
      />
      <div className="h-96" />
    </div>
  );
}
