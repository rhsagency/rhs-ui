import { useId, type ComponentProps } from "react";

import { IconCheck, IconClock } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface PairImage {
  /** The picture. */
  src: string;
  /** What the picture shows. Required: the comparison is the content, so it has to be readable without the image. */
  alt: string;
}

export interface ResultPair {
  /** Identifies the pair in the list. */
  id: string;
  /** The picture from before the work, taken from the same spot as `after`. */
  before: PairImage;
  /** The picture from after the work. */
  after: PairImage;
  /** What it is and where: "Kitchen, Utrecht". */
  caption: string;
  /** How long the work took, written as it should be read: "6 weeks". */
  timeframe?: string;
  /** What was done, one short line each. */
  details?: readonly string[];
}

export interface BeforeAfterPairsLabels {
  /** The label in the corner of the first picture. Default "Before". */
  before: string;
  /** The label in the corner of the second picture. Default "After". */
  after: string;
  /** What a screen reader hears before the time it took. Default "Time it took". */
  timeframe: string;
  /** The small heading over the list of what was done. Default "What was done". */
  details: string;
}

export interface BeforeAfterPairsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Two to four pairs, one row each. */
  pairs: readonly ResultPair[];
  /** Width over height of every picture, so each pair lines up. Default 4/3; use 3/4 for portraits. */
  ratio?: number;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<BeforeAfterPairsLabels>;
}

const LABELS: BeforeAfterPairsLabels = { before: "Before", after: "After", timeframe: "Time it took", details: "What was done" };

/** One picture with its label in the corner. The label is text on a solid chip, so it reads on any photo and never relies on colour; the chip keeps its fill when printed without background graphics. */
function Shot({ image, label, strong, ratio }: { image: PairImage; label: string; strong?: boolean; ratio: number }) {
  return (
    <AspectRatio ratio={ratio} className="overflow-hidden rounded-xl border border-border bg-muted">
      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" className="size-full object-cover" />
      <Badge
        variant={strong ? "default" : "outline"}
        className={cn(
          "absolute top-3 left-3 h-6 px-2.5 text-[0.8125rem] shadow-xs [-webkit-print-color-adjust:exact] [print-color-adjust:exact]",
          !strong && "bg-background",
        )}
      >
        {label}
      </Badge>
    </AspectRatio>
  );
}

/**
 * Results shown as plain evidence: for every project two pictures of the same place side by side, a Before and
 * an After label in the corner of each, and beside them the caption, the time it took and what was done. There
 * is no slider and no animation, so the comparison is immediate, nothing hides behind a drag, and it prints as
 * it looks. The labels are words on solid chips, never colour alone (After is the filled one, and both keep their
 * fill in print); both pictures share one aspect ratio so the pair lines up; alt text is required for every image.
 * On a desktop the caption sits to the left of the pair, on a phone the pair stacks with its labels intact and
 * the caption follows. For work that shows its results: renovation, skincare, landscaping. No state of its own,
 * so it renders on the server.
 */
export function BeforeAfterPairs({ title, description, pairs, ratio = 4 / 3, labels, className, ...props }: BeforeAfterPairsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="before-after-pairs" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className="mt-12 border-t border-border sm:mt-16">
        {pairs.map((pair) => (
          <li key={pair.id} className="border-b border-border py-10 print:break-inside-avoid lg:py-12">
            <figure className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-12">
              <div className="grid gap-3 sm:grid-cols-2 lg:col-start-2 lg:row-start-1">
                <Shot image={pair.before} label={words.before} ratio={ratio} />
                <Shot image={pair.after} label={words.after} ratio={ratio} strong />
              </div>
              <figcaption className="grid content-start gap-6 lg:col-start-1 lg:row-start-1 lg:py-1">
                <div className="grid gap-2.5">
                  <p className="text-xl leading-snug font-medium tracking-[-0.02em] text-balance">{pair.caption}</p>
                  {pair.timeframe ? (
                    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
                      <IconClock aria-hidden="true" className="size-4" />
                      <span>
                        <span className="sr-only">{words.timeframe}: </span>
                        {pair.timeframe}
                      </span>
                    </p>
                  ) : null}
                </div>
                {pair.details?.length ? (
                  <div>
                    <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{words.details}</p>
                    <ul role="list" className="mt-3 grid gap-2.5 text-[0.9375rem] leading-snug">
                      {pair.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-2.5">
                          <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
