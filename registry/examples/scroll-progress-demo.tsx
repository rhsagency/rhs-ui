import { ScrollProgress } from "@rhs-ui/motion/scroll-progress";

const PARAGRAPHS = [
  "A reading bar tells people how much is left, which is often the one thing that keeps them reading.",
  "It sits at the top of the page or, as here, of any scrolling panel, and fills as they go.",
  "Where the browser has scroll timelines, the bar is pure CSS. Where it does not, a passive listener takes over.",
  "It carries no meaning of its own, so assistive technology does not announce it.",
  "Keep it thin and in the text colour. It is a hint, not a feature.",
  "That is all there is to it. You made it to the end.",
];

export default function Demo(): React.JSX.Element {
  return (
    <div tabIndex={0} role="region" aria-label="Scroll progress demo, scroll inside" className="relative h-[30rem] w-full overflow-y-auto rounded-xl border border-border bg-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
      <ScrollProgress source="nearest" />
      <article className="mx-auto max-w-prose px-6 py-10">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Scroll inside this panel</p>
        <h3 className="mt-3 text-2xl font-medium tracking-tight">How far along are you?</h3>
        {PARAGRAPHS.map((text) => (
          <p key={text} className="mt-8 text-base leading-relaxed text-muted-foreground">
            {text}
          </p>
        ))}
        <div className="h-64" />
      </article>
    </div>
  );
}
