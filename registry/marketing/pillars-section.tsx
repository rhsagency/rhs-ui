import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface Pillar {
  /** A large numeral or icon over the heading: a 36px glyph from @rhs-ui/icons, or a word such as "01". The number of the pillar when left out. It is decoration: the list carries the order. */
  marker?: ReactNode;
  /** The idea, in a few words: "Built to be repaired". */
  title: string;
  /** Three or four lines on what it means. */
  description: string;
  /** A short list of what it means in practice, three or four points. */
  points?: readonly string[];
  /** Where to read more. */
  href?: string;
  /** The link's text. "Read more" by default; a screen reader also hears which pillar it belongs to. */
  linkLabel?: string;
}

export interface PillarsSectionLabels {
  /** The link of a pillar that has an href and no linkLabel. */
  readMore: string;
}

const LABELS: PillarsSectionLabels = { readMore: "Read more" };

export interface PillarsSectionProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "How we work". */
  eyebrow?: string;
  /** The heading: "Three ideas we build everything on". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Two to four pillars. Beside each other from 672px (two), 768px (three) or 896px (four), and stacked under that. */
  pillars: readonly Pillar[];
  /** Whether the heading and the columns are set from the start or from the middle. "start" by default. */
  align?: "start" | "center";
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PillarsSectionLabels>;
}

/**
 * The list and the columns by how many pillars there are, written out so Tailwind sees every class. A pillar is a
 * grid item over five rows and passes them on (subgrid), so the markers, headings, paragraphs, lists and links
 * line up from one column to the next; the borders between them run the whole height.
 */
const LAYOUT = {
  2: {
    list: "@2xl:grid-cols-2",
    item: "@2xl:row-span-5 @2xl:grid @2xl:grid-rows-subgrid @2xl:px-10 @2xl:py-12 @2xl:not-first:border-t-0 @2xl:not-first:border-l",
    // Set from the start, the first and last columns sit flush with the heading; set from the middle, every column keeps its own padding so its text is centred in it.
    edges: "@2xl:first:pl-0 @2xl:last:pr-0",
  },
  3: {
    list: "@3xl:grid-cols-3",
    item: "@3xl:row-span-5 @3xl:grid @3xl:grid-rows-subgrid @3xl:px-8 @3xl:py-12 @3xl:not-first:border-t-0 @3xl:not-first:border-l",
    edges: "@3xl:first:pl-0 @3xl:last:pr-0",
  },
  4: {
    list: "@4xl:grid-cols-4",
    item: "@4xl:row-span-5 @4xl:grid @4xl:grid-rows-subgrid @4xl:px-7 @4xl:py-12 @4xl:not-first:border-t-0 @4xl:not-first:border-l",
    edges: "@4xl:first:pl-0 @4xl:last:pr-0",
  },
} as const;

/**
 * A few big ideas set as tall columns divided by hairlines, for brand principles, a three-product offer, or any
 * company that stands on a few ideas rather than a long feature list. Each column has a large numeral or icon, a
 * heading, a paragraph, a short list of points as hairline rows and an optional text link. The columns are rows of
 * one grid, so the headings, paragraphs, lists and links line up across them whatever their length. The markers
 * are decoration and an ordered list carries the sequence. Under the breakpoint the vertical hairlines become
 * horizontal rules. Nothing animates.
 */
export function PillarsSection({ eyebrow, title, description, pillars, align = "start", headingLevel = 2, labels: custom, className, ...props }: PillarsSectionProps) {
  const labels = { ...LABELS, ...custom };
  const centered = align === "center";
  const layout = LAYOUT[Math.min(Math.max(pillars.length, 2), 4) as 2 | 3 | 4];
  // The pillars are one level under the heading of the section.
  const PillarHeading = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="pillars-section" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} align={centered ? "center" : "left"} as={headingLevel === 3 ? "h3" : "h2"} />

      <ol role="list" className={cn("mt-10 grid border-y border-border @3xl:mt-14", layout.list)}>
        {pillars.map((pillar, index) => (
          <li key={`${index}-${pillar.title}`} className={cn("min-w-0 py-9 not-first:border-t not-first:border-border", layout.item, centered ? "text-center" : layout.edges)}>
            {/* Five rows in every column, filled or not, so each part keeps its row and lines up with its neighbours. */}
            <div aria-hidden="true" className={cn("text-5xl leading-none font-medium tracking-[-0.05em] text-foreground tabular-nums [&_svg]:size-10 [&_svg]:stroke-[1.5]", centered && "flex justify-center")}>
              {pillar.marker ?? String(index + 1).padStart(2, "0")}
            </div>
            <PillarHeading className="mt-7 text-xl leading-snug font-medium tracking-[-0.025em] text-balance">{pillar.title}</PillarHeading>
            <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{pillar.description}</p>
            {/* The space above the list and the link belongs to them, so a row that is empty in every column takes no room at all. */}
            <div>
              {pillar.points?.length ? (
                <ul role="list" className="mt-7 border-t border-border">
                  {pillar.points.map((point, at) => (
                    <li key={`${at}-${point}`} className="border-b border-border py-3 text-sm leading-snug text-pretty">
                      {point}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className={cn(centered && "flex justify-center")}>
              {pillar.href ? (
                <a
                  href={pillar.href}
                  className="group/link mt-6 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {pillar.linkLabel ?? labels.readMore}
                  <span className="sr-only">: {pillar.title}</span>
                  <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
