import type { ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface WhichOneRecommendation {
  /** What the option is called: "Shop", "Studio plan". It is the chip, in words, and the name in the row's link. */
  name: string;
  /** One line on why it suits this reader. */
  reason: string;
  /** Where to read more about it or to choose it. */
  href: string;
}

export interface WhichOneRow {
  /** The reader's situation in their own voice, first person: "I run a small shop and ship every day". */
  scenario: string;
  /** The option that fits it. */
  recommendation: WhichOneRecommendation;
}

export interface WhichOneFallback {
  /** The line before the button: "Not sure which one fits you?". Falls back to labels.notSure. */
  text?: string;
  /** The button's text: "Talk to us". */
  label: string;
  /** Where it goes: a contact page, a booking link or a mailto: link. */
  href: string;
}

export interface WhichOneGuideLabels {
  /** The visible words of each row's link. {name} stands for the option: "See {name}". */
  view: string;
  /** Said before the option's chip, so a screen reader hears the row as an answer: "I run a shop. Recommended: Shop." */
  recommended: string;
  /** The line before the fallback button when `fallback.text` is left out. */
  notSure: string;
}

export interface WhichOneGuideProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Plans". */
  eyebrow?: string;
  /** The heading: "Which plan is yours?". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The scenarios, in the order you want them read. Four to seven is a list; more is a quiz. */
  rows: readonly WhichOneRow[];
  /** The line for the reader none of the rows describes. */
  fallback?: WhichOneFallback;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<WhichOneGuideLabels>;
}

const LABELS: WhichOneGuideLabels = { view: "See {name}", recommended: "Recommended", notSure: "Not sure which one fits you?" };

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * "If you are this, pick that": a ruled list of situations in the reader's own
 * voice, each pointing at the option that fits, so a visitor finds themselves
 * in one sentence instead of comparing a feature table. A row reads scenario
 * first, then an arrow, then the recommended option as a chip with a line on
 * why and a link; on a medium block (a tablet) the row is two columns, the
 * scenario beside the answer, with the arrow leading into the chip; on a
 * narrow block the arrow turns downward and the answer sits under the
 * scenario. It is a plain list: no quiz, no state, nothing that needs
 * JavaScript, so it renders on the server and works with scripts off.
 * The chip names the option in words and the row says "Recommended" to screen
 * readers, so the arrow is only decoration. A fallback row catches the reader
 * nobody wrote a sentence for.
 */
export function WhichOneGuide({ eyebrow, title, description, rows, fallback, headingLevel = 2, labels: custom, className, ...props }: WhichOneGuideProps) {
  const labels = { ...LABELS, ...custom };

  return (
    <section data-slot="which-one-guide" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {/*
        Three shapes. On a wide block the list is one grid and every row a subgrid of it, so the arrows, the chips and
        the links line up from row to row whatever the words are. On a medium block (a tablet) a row is two columns,
        the scenario beside the answer, and the arrow leads into the chip. On a narrow block the answer sits under the
        scenario and the arrow, turned downward, still leads into the chip instead of taking a line of its own.
      */}
      <ul role="list" className="mt-10 grid border-b border-border @3xl:mt-12 @4xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.25fr)_auto] @4xl:gap-x-8">
        {rows.map((row, index) => (
          <li
            key={`${index}-${row.scenario}`}
            className="grid gap-4 border-t border-border py-7 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] @2xl:gap-x-8 @4xl:col-span-4 @4xl:grid-cols-subgrid @4xl:items-center @4xl:gap-x-4"
          >
            {/* Beside the answer, its first line is lowered to the middle of the arrow and the chip, which are 32px tall. */}
            <p className="max-w-[28ch] text-lg leading-snug font-medium tracking-[-0.02em] text-balance @2xl:pt-1 @4xl:max-w-none @4xl:pt-0">{row.scenario}</p>
            {/* The arrow of the four-column row: a column of its own between the scenario and the answer. */}
            <span aria-hidden="true" className="hidden size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground @4xl:grid">
              <IconArrowRight className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="flex items-center gap-3">
                {/* The same arrow for the narrower rows, in front of the chip: it points down while the answer is under the scenario and across once it is beside it. */}
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground @4xl:hidden">
                  <IconArrowRight className="size-4 rotate-90 @2xl:rotate-0" />
                </span>
                <span className="sr-only">{labels.recommended}: </span>
                <Badge variant="secondary" className="h-6 px-2.5 text-[0.8125rem]">
                  {row.recommendation.name}
                </Badge>
              </p>
              <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-pretty text-muted-foreground">{row.recommendation.reason}</p>
            </div>
            <a href={row.recommendation.href} className={cn(LINK, "@2xl:col-start-2 @4xl:col-start-auto @4xl:justify-self-end")}>
              {labels.view.replace("{name}", row.recommendation.name)}
              <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          </li>
        ))}
      </ul>

      {fallback ? (
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-muted/40 px-5 py-4 @xl:flex-row @xl:items-center @xl:justify-between @xl:gap-6">
          <p className="text-[0.9375rem] font-medium tracking-[-0.01em]">{fallback.text ?? labels.notSure}</p>
          <Button asChild variant="outline" className="w-full @xl:w-auto">
            <a href={fallback.href}>
              {fallback.label}
              <IconArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
