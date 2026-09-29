import { Reveal, type RevealEffect } from "@rhs-ui/motion/reveal";

const EFFECTS: readonly { effect: RevealEffect; note: string }[] = [
  { effect: "rise", note: "Lifts and settles. The everyday choice." },
  { effect: "tilt", note: "Swings forward in 3D, like a screen lifting off the page." },
  { effect: "scale", note: "Grows into place from the centre." },
  { effect: "blur", note: "Comes into focus as it arrives." },
  { effect: "slide-left", note: "Enters from the left edge." },
  { effect: "slide-right", note: "Enters from the right edge." },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="h-[30rem] w-full overflow-y-auto rounded-xl border border-border bg-muted/40">
      <div className="grid min-h-[22rem] place-items-center px-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Scroll inside this panel</p>
          <p className="mt-3 text-2xl font-medium tracking-tight">Six ways to arrive.</p>
        </div>
      </div>
      <div className="grid gap-4 px-6 pb-24 sm:grid-cols-2">
        {EFFECTS.map(({ effect, note }, index) => (
          <Reveal key={effect} effect={effect} order={index % 2} className="rounded-xl border border-border bg-background p-6 shadow-xs">
            <p className="font-mono text-xs text-muted-foreground">effect=&quot;{effect}&quot;</p>
            <p className="mt-3 text-sm leading-relaxed">{note}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
