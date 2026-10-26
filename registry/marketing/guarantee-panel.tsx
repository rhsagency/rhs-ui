import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface GuaranteePeriod {
  /** The number: 30. */
  value: number;
  /** The unit, in the right form for the number: "days", "day", "months". */
  unit: string;
}

export interface GuaranteeTerm {
  /** What the term answers, in a few words: "What is covered", "How to ask", "How fast". */
  term: string;
  /** The answer, in a sentence or two of plain words. */
  detail: ReactNode;
}

export interface GuaranteePanelLabels {
  /** The small line above the heading. */
  eyebrow: string;
  /** The link to the full policy. */
  policy: string;
}

export interface GuaranteePanelProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /**
   * The promise that follows the period: "full refund, no questions". The heading reads "30 days, full refund, no
   * questions". Write {period} inside it to put the period elsewhere: "A full refund within {period}".
   */
  title: string;
  /** How long the guarantee lasts. It is part of the heading, so the promise reads without the graphic. */
  period: GuaranteePeriod;
  /** The terms, usually three: what is covered, how to ask, how fast the money comes back. */
  terms: readonly GuaranteeTerm[];
  /** The full policy. It becomes a link under the terms. */
  policyHref?: string;
  /** An action beside the policy link: a Button or a link styled as one. */
  action?: ReactNode;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<GuaranteePanelLabels>;
}

const LABELS: GuaranteePanelLabels = { eyebrow: "Our guarantee", policy: "Read the full policy" };

/** Forty-eight ticks around the seal, the way a stamp is milled at its edge. */
const TICKS = Array.from({ length: 48 }, (_, index) => {
  const angle = (index / 48) * Math.PI * 2;
  const long = index % 4 === 0;
  const from = long ? 49 : 51;
  return {
    index,
    x1: Number((60 + Math.sin(angle) * from).toFixed(2)),
    y1: Number((60 - Math.cos(angle) * from).toFixed(2)),
    x2: Number((60 + Math.sin(angle) * 55).toFixed(2)),
    y2: Number((60 - Math.cos(angle) * 55).toFixed(2)),
  };
});

/** A seal drawn from concentric rings and a check, inline so it takes the page's colours in both themes. It is decoration: the promise is in the heading. */
function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false" className={cn("text-foreground", className)}>
      <g stroke="currentColor" strokeLinecap="round" fill="none">
        {TICKS.map((tick) => (
          <line key={tick.index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} strokeWidth={tick.index % 4 === 0 ? 2 : 1.25} opacity={tick.index % 4 === 0 ? 0.55 : 0.3} />
        ))}
        <circle cx="60" cy="60" r="44" strokeWidth="1.5" opacity="0.55" />
        <circle cx="60" cy="60" r="38" strokeWidth="1" opacity="0.25" />
      </g>
      <circle cx="60" cy="60" r="31" fill="currentColor" />
      <path d="M46 61.5l10.5 10.5L75 49" fill="none" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-background" />
    </svg>
  );
}

/**
 * Takes the risk out of the decision: a clear promise, such as 30 days and a
 * full refund, with the terms in three plain lines. A seal drawn from
 * concentric rings and a check sits beside the promise; it is decorative, and
 * because the period is part of the heading the promise reads without it. The
 * terms are a real description list (what is covered, how to ask, how fast the
 * money comes back) and a link leads to the full policy. Place it beside
 * pricing or just before the final call to action.
 */
export function GuaranteePanel({ title, period, terms, policyHref, action, headingLevel = 2, labels: custom, className, ...props }: GuaranteePanelProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  // A no-break space, so the number never ends a line without its unit: "60 days", not "60" over "days".
  const length = `${period.value}\u00a0${period.unit}`;
  const heading = title.includes("{period}") ? title.replace("{period}", length) : `${length}, ${title}`;
  return (
    <section data-slot="guarantee-panel" aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card break-words", className)} {...props}>
      <div className="grid gap-x-10 gap-y-6 p-6 @xl:grid-cols-[auto_minmax(0,1fr)] @2xl:p-9">
        <Seal className="size-[5.5rem] shrink-0 @xl:size-28" />
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{labels.eyebrow}</p>
          <Heading id={`${id}-title`} className="mt-3 text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance @2xl:text-3xl">
            {heading}
          </Heading>
          {/* The terms sit beside each other only when each column has about 200px: the seal takes a share of the panel's width, so that is from 896px, not 672px. */}
          <dl className="mt-7 grid gap-x-8 gap-y-5 border-t border-border pt-6 @4xl:grid-cols-3">
            {terms.map((entry) => (
              <div key={entry.term} className="min-w-0">
                <dt className="text-sm leading-snug font-medium">{entry.term}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{entry.detail}</dd>
              </div>
            ))}
          </dl>
          {policyHref || action ? (
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
              {action}
              {policyHref ? (
                <a
                  href={policyHref}
                  className="group inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {labels.policy}
                  <IconArrowRight aria-hidden="true" size={15} className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
