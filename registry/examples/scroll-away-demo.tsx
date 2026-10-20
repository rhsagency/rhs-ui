import { IconArrowRight } from "@rhs-ui/icons";
import { Reveal } from "@rhs-ui/motion/reveal";
import { ScrollAway, type ScrollAwayEffect } from "@rhs-ui/motion/scroll-away";

interface Hero {
  effect: ScrollAwayEffect;
  blur?: number;
  title: string;
  note: string;
  link: string;
}

/** Three heroes in one row, so a single scroll shows all three ways out at the same moment. */
const HEROES: readonly Hero[] = [
  { effect: "fade", title: "Planning that keeps pace.", note: "Dims in place. The quietest way out.", link: "Release notes" },
  { effect: "lift", title: "Capacity you can see.", note: "Rises as it dims. The everyday hero.", link: "What is new" },
  { effect: "scale", blur: 6, title: "Reports that write themselves.", note: "Recedes and softens. Good over layered pages.", link: "Take the tour" },
];

const UPDATES: readonly { title: string; shipped: string }[] = [
  { title: "Capacity view", shipped: "14 Oct" },
  { title: "Saved filters", shipped: "30 Sep" },
  { title: "Roadmap sharing", shipped: "5 Aug" },
  { title: "Workload warnings", shipped: "22 Jul" },
  { title: "Spreadsheet import", shipped: "8 Jul" },
  { title: "Comments on rows", shipped: "24 Jun" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-6 pb-3 sm:px-6">
      <div className="mb-4 text-center">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">Scroll inside the panel</p>
        {/* Shown only where the effect cannot run (an older browser, or reduced motion), so a still panel does not look broken. */}
        <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground motion-safe:supports-[animation-timeline:view()]:hidden">
          Scroll-linked motion is off here, in an older browser or with reduced motion, so the panel stays still. Nothing is hidden.
        </p>
      </div>
      <div className="@container">
        <div
          tabIndex={0}
          role="region"
          aria-label="Halcyon 3.0 release page"
          className="relative h-[min(36rem,calc(100dvh-8rem))] min-h-[24rem] overflow-y-auto overscroll-contain rounded-xl border border-border bg-muted/40 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          <div className="grid gap-x-6 gap-y-9 px-6 pt-14 @2xl:grid-cols-3 @2xl:px-8">
            {HEROES.map(({ effect, blur, title, note, link }) => (
              <ScrollAway key={effect} effect={effect} blur={blur}>
                <p className="font-mono text-xs text-muted-foreground">
                  effect=&quot;{effect}&quot;{blur ? ` blur={${blur}}` : ""}
                </p>
                <h2 className="mt-3 text-xl leading-[1.12] font-medium tracking-[-0.03em] text-balance @3xl:text-2xl">{title}</h2>
                <p className="mt-2.5 text-sm leading-relaxed text-pretty text-muted-foreground">{note}</p>
                <a
                  href="#release-notes"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {link}
                  <IconArrowRight className="size-4" />
                </a>
              </ScrollAway>
            ))}
          </div>
          <ul className="mt-12 grid gap-3 px-6 pb-56 @2xl:px-8">
            {UPDATES.map((update) => (
              <li key={update.title} className="min-w-0">
                <Reveal effect="rise" distance={24}>
                  <ScrollAway effect="fade" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg border border-border bg-card px-4 py-3.5 shadow-xs">
                    <p className="text-sm font-medium">{update.title}</p>
                    <p className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">Shipped {update.shipped}</p>
                  </ScrollAway>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
