import type { ComponentProps } from "react";

import { IconArrowRight, IconCheck, IconMinus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface GoodFitAlternative {
  /** What to use instead, said as a whole line: "For one-person shops, a spreadsheet is enough." */
  text: string;
  /** Where the alternative is explained. The whole line becomes a link. */
  href?: string;
}

export interface GoodFitCta {
  /** The button's text: "Start your free trial". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface GoodFitSectionLabels {
  /** The heading over the list of who it suits. */
  fit: string;
  /** The heading over the list of who it does not. */
  notFit: string;
}

export interface GoodFitSectionProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Is it for you?". */
  eyebrow?: string;
  /** The heading: "Who Kestrel is for, and who it is not". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Whether the heading is set from the start or from the middle. "start" by default. */
  align?: "start" | "center";
  /** Four to six short lines on who it suits, each a situation and not a compliment: "Work passes through three or more people". */
  fit: readonly string[];
  /** Four to six short lines on who it does not suit. Naming them is what makes the other column believable. */
  notFit: readonly string[];
  /** What to use instead, under the second list. */
  alternative?: GoodFitAlternative;
  /** The action, under the first list. */
  cta?: GoodFitCta;
  /** The level of the heading: 2 by default. The two column heads sit one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<GoodFitSectionLabels>;
}

const LABELS: GoodFitSectionLabels = { fit: "A good fit if", notFit: "Probably not if" };

/** The box the line about what to use instead sits in: dashed, so it reads as a pointer elsewhere and not as one more point in the list. */
const ALTERNATIVE = "rounded-xl border border-dashed border-border bg-card px-4 py-3.5 text-[0.9375rem] leading-snug text-balance";

/**
 * Who it suits and who it does not: two honest columns on one bordered surface, "A good fit if" with checks and
 * "Probably not if" with dashes. It saves the wrong customers a trial and reassures the right ones, because a
 * visitor who sees their own situation named as not a fit believes the other column. A line under the second list
 * points to what to use instead, and the action sits under the first. Both are real lists under real headings,
 * and the check and the dash repeat what the headings already say, so they are decoration. The good-fit column
 * comes first on a phone, where the two stack.
 */
export function GoodFitSection({ eyebrow, title, description, align = "start", fit, notFit, alternative, cta, headingLevel = 2, labels: custom, className, ...props }: GoodFitSectionProps) {
  const labels = { ...LABELS, ...custom };
  const ColumnTitle = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="good-fit-section" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} align={align === "center" ? "center" : "left"} as={headingLevel === 3 ? "h3" : "h2"} />

      <div className="mt-10 grid overflow-hidden rounded-2xl border border-border bg-card @3xl:mt-12 @3xl:grid-cols-2">
        <div className="flex min-w-0 flex-col p-6 @xl:p-9 @3xl:p-10">
          <ColumnTitle className="flex items-center gap-3 text-lg leading-snug font-medium tracking-[-0.02em]">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <IconCheck className="size-4 stroke-[2.25]" />
            </span>
            {labels.fit}
          </ColumnTitle>
          <ul role="list" className="mt-6 grid gap-3.5">
            {fit.map((line, index) => (
              <li key={`${index}-${line}`} className="flex items-start gap-3 text-[0.9375rem] leading-snug">
                <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground" />
                {line}
              </li>
            ))}
          </ul>
          {cta ? (
            <div className="mt-auto pt-9">
              <Button asChild size="lg" className="w-full @xl:w-auto">
                <a href={cta.href}>
                  {cta.label}
                  <IconArrowRight aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col border-t border-border bg-muted/40 p-6 @xl:p-9 @3xl:border-t-0 @3xl:border-l @3xl:p-10">
          <ColumnTitle className="flex items-center gap-3 text-lg leading-snug font-medium tracking-[-0.02em]">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-foreground/30 text-foreground">
              <IconMinus className="size-4 stroke-[2.25]" />
            </span>
            {labels.notFit}
          </ColumnTitle>
          <ul role="list" className="mt-6 grid gap-3.5">
            {notFit.map((line, index) => (
              <li key={`${index}-${line}`} className="flex items-start gap-3 text-[0.9375rem] leading-snug text-muted-foreground">
                <IconMinus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
          {alternative ? (
            <div className="mt-auto pt-9">
              {alternative.href ? (
                <a
                  href={alternative.href}
                  className={cn(ALTERNATIVE, "group/link flex items-center justify-between gap-4 font-medium outline-none transition-colors duration-150 hover:border-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none")}
                >
                  <span className="min-w-0 underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 group-hover/link:decoration-current motion-reduce:transition-none">{alternative.text}</span>
                  <IconArrowRight aria-hidden="true" className="size-4 shrink-0 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              ) : (
                <p className={ALTERNATIVE}>{alternative.text}</p>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
