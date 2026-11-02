import { useId, type ComponentProps, type CSSProperties } from "react";

import { IconArrowRight, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface AffiliateFact {
  /** The figure, set large: "30%", "90 days", "Monthly". */
  value: string;
  /** What it is, in a few words under the figure: "recurring commission". */
  label: string;
}

export interface AffiliateStep {
  /** What the partner does: "Apply". */
  title: string;
  /** One or two lines that make it concrete. */
  description: string;
}

export interface AffiliateAction {
  /** The button's text: "Apply to join". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface AffiliateOfferLabels {
  /** The link to the terms, next to the button. */
  terms: string;
  /** The name of the list of figures for assistive technology. */
  facts: string;
  /** The name of the list of steps for assistive technology. */
  steps: string;
}

const LABELS: AffiliateOfferLabels = { terms: "Read the programme terms", facts: "The programme in numbers", steps: "How it works" };

export interface AffiliateOfferProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Partner programme". */
  eyebrow?: string;
  /** The heading: "Earn 30% on every customer you send". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The headline terms, three read best: the commission, how long a link counts, when you are paid. */
  facts: readonly AffiliateFact[];
  /** How it works, three steps: apply, share your link, get paid. */
  steps: readonly AffiliateStep[];
  /** Who the programme suits, in one sentence: "Built for newsletter writers, YouTubers and consultants whose readers run small teams." */
  audience: string;
  /** The button that starts the application. */
  action: AffiliateAction;
  /** The programme's terms. It is required and sits next to the button: a claim about earnings is only as believable as its conditions. */
  termsHref: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AffiliateOfferLabels>;
}

/** How wide a word is set, in digit widths: a lowercase letter a little less than a digit, a percent sign more, a separator much less. */
const widthOf = (word: string): number => [...word].reduce((sum, char) => sum + (/[.,:;'\u2019-]/.test(char) ? 0.4 : char === "%" ? 1.4 : /\p{Ll}/u.test(char) ? 0.9 : 1), 0);

/**
 * The public page for people who might become partners, not the screen a customer sees: the commission in large
 * figures (a description list), how it works in three numbered steps (an ordered list), and one button to apply
 * with a line on who the programme suits. The link to the terms sits right next to the button, because a claim
 * about earnings needs its conditions beside it, so it is a required prop. From 768px the figures run in a row and
 * the steps are joined by a line from one number to the next; under that both stack and the line runs down. The
 * figures share one size, the largest that lets the longest word of any of them fit its cell, so a word is never
 * broken in two however many figures there are. Nothing animates.
 */
export function AffiliateOffer({ eyebrow, title, description, facts, steps, audience, action, termsHref, headingLevel = 2, labels: custom, className, ...props }: AffiliateOfferProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;
  // The size is worked out from the longest word, and each cell is a container, so the figure is sized from the cell it sits in (0.6 of the size is a generous width for one digit). The cell, not the figure, carries the largest size per breakpoint (--cap): a container query inside the cell would ask the cell, not the section.
  const longest = Math.max(1, ...facts.flatMap((fact) => fact.value.split(/\s+/).map(widthOf)));
  const fit = `${(100 / (0.6 * longest)).toFixed(1)}cqi`;

  return (
    <section data-slot="affiliate-offer" aria-labelledby={`${id}-title`} className={cn("@container w-full overflow-hidden rounded-2xl border border-border bg-card break-words", className)} {...props}>
      <div className="p-6 @2xl:p-10">
        {eyebrow ? <p className="mb-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Heading id={`${id}-title`} className="max-w-2xl text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      {/* The figures: one per cell, with hairlines between. The label is written first in the markup so a screen reader hears "recurring commission, 30%". */}
      <dl aria-label={labels.facts} style={{ "--fit": fit } as CSSProperties} className="grid divide-y divide-border border-y border-border @3xl:grid-flow-col @3xl:auto-cols-fr @3xl:divide-x @3xl:divide-y-0">
        {facts.map((fact) => (
          <div key={`${fact.value}-${fact.label}`} className="@container flex min-w-0 flex-col-reverse justify-end gap-2 px-6 py-7 [--cap:3rem] @2xl:px-10 @3xl:px-8 @3xl:py-10 @4xl:px-10 @4xl:[--cap:3.75rem]">
            <dt className="text-sm leading-snug text-pretty text-muted-foreground">{fact.label}</dt>
            <dd className="text-[length:min(var(--cap),var(--fit))] leading-none font-medium tracking-[-0.05em] tabular-nums [overflow-wrap:normal]">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <ol role="list" aria-label={labels.steps} className="grid gap-x-10 p-6 @2xl:p-10 @3xl:grid-flow-col @3xl:auto-cols-fr">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step.title}`}
            className={cn(
              "relative min-w-0 pb-8 pl-12 last:pb-0",
              // The line from this number to the next: down on a narrow section, across on a wide one.
              "not-last:after:absolute not-last:after:top-10 not-last:after:bottom-2 not-last:after:left-4 not-last:after:w-px not-last:after:bg-border",
              "@3xl:pt-12 @3xl:pb-0 @3xl:pl-0 @3xl:not-last:after:top-4 @3xl:not-last:after:right-[-2rem] @3xl:not-last:after:bottom-auto @3xl:not-last:after:left-10 @3xl:not-last:after:h-px @3xl:not-last:after:w-auto",
            )}
          >
            <span aria-hidden="true" className="absolute top-0 left-0 grid size-8 place-items-center rounded-full border border-border bg-background text-sm font-medium tabular-nums">
              {index + 1}
            </span>
            <p className="text-base leading-snug font-medium tracking-[-0.01em]">{step.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{step.description}</p>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-6 border-t border-border bg-muted/40 p-6 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-10 @2xl:px-10 @2xl:py-7">
        <p className="flex max-w-md items-start gap-3 text-sm leading-relaxed text-pretty text-muted-foreground">
          <IconUsers aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{audience}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          {action.href ? (
            <Button asChild size="lg">
              <a href={action.href} onClick={action.onClick}>
                {action.label}
                {arrow}
              </a>
            </Button>
          ) : (
            <Button type="button" size="lg" onClick={action.onClick}>
              {action.label}
              {arrow}
            </Button>
          )}
          <a
            href={termsHref}
            className="rounded-sm text-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            {labels.terms}
          </a>
        </div>
      </div>
    </section>
  );
}
