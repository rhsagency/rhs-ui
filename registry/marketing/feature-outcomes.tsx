import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconInfo } from "@rhs-ui/icons";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface OutcomeMetric {
  /** The figure, with its sign when it has one: "-38%", "+31%", "11 hrs", "9 days". A leading minus or plus is read out as down or up, and a word after the number is set smaller. Keep the number itself to about five characters: it is set large. */
  value: string;
  /** What was measured, in a few words: "first reply time". */
  label: string;
}

export interface FeatureOutcome {
  /** The feature, as the product calls it: "Shared inboxes". It is the row's heading. */
  feature: string;
  /** Where the feature is explained. The whole row becomes a link, named by the feature. */
  href?: string;
  /** One line on what the feature does. */
  description: string;
  /** The number it moved. */
  metric: OutcomeMetric;
  /** The customer who measured it, by name. A figure without a named customer is not proof, so it is always asked for. */
  customer: string;
}

export interface FeatureOutcomesLabels {
  /** Read out in place of a plus sign: "up 31%". */
  up: string;
  /** Read out in place of a minus sign: "down 38%". */
  down: string;
  /** Read out before the customer's name. */
  measuredBy: string;
}

export interface FeatureOutcomesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Results". */
  eyebrow?: string;
  /** The heading: "What changed for teams that switched it on". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** One row per feature, four to six is the usual number. */
  items: readonly FeatureOutcome[];
  /** A line for the method and the period, under the list: "Median change per workspace, 90 days before and after switching on." It is what makes the figures honest, so say how and when they were measured. */
  note?: ReactNode;
  /** The level of the heading: 2 by default. The feature of each row sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FeatureOutcomesLabels>;
}

const LABELS: FeatureOutcomesLabels = { up: "up", down: "down", measuredBy: "Measured by" };

/** The typographic minus sign, U+2212, and the en dash, U+2013. */
const MINUS = String.fromCharCode(0x2212);
const EN_DASH = String.fromCharCode(0x2013);

/**
 * Splits the last word off a title, so the arrow can be held to it and never wraps onto a line of its own. A last
 * word too long to hold (it may need to break to fit a narrow row) is left in the head and the arrow simply follows.
 */
function splitLastWord(text: string): [head: string, tail: string] {
  const cut = text.trimEnd().lastIndexOf(" ") + 1;
  return text.length - cut > 18 ? [text, ""] : [text.slice(0, cut), text.slice(cut)];
}

/**
 * A figure as it is shown and as it is spoken. A leading minus or plus becomes a real minus sign or a plus on screen
 * and a word for assistive technology, because "dash 38 percent" does not say which way the number moved. A word
 * after the number ("11 hrs", "9 days") is split off so it can be set smaller than the number it measures.
 */
function figureOf(value: string, labels: FeatureOutcomesLabels): { sign: string; amount: string; unit: string; spoken: string } {
  const text = value.trim();
  const first = text.charAt(0);
  const up = first === "+";
  // A hyphen, an en dash or the minus sign itself: all three are how people type a negative figure.
  const down = first === "-" || first === MINUS || first === EN_DASH;
  const body = up || down ? text.slice(1).trim() : text;
  if (!body) return { sign: "", amount: value, unit: "", spoken: value };
  const space = body.search(/\s/);
  const rest = space > 0 ? body.slice(space).trim() : "";
  const unit = /^[A-Za-z]/.test(rest) ? rest : "";
  return {
    sign: up ? "+" : down ? MINUS : "",
    amount: unit ? body.slice(0, space) : body,
    unit,
    spoken: `${up ? `${labels.up} ` : down ? `${labels.down} ` : ""}${body}`,
  };
}

/**
 * Each feature paired with the result a named customer measured. A ruled list: the feature's name as a link, one
 * line on what it does, and on the right a large figure with what was measured and who measured it. It is proof
 * per feature, where a stats band elsewhere on the page proves nothing in particular. Honest by construction: the
 * customer is always named and the note under the list says how and over what period it was measured. Figures use
 * tabular numbers and never wrap; a signed figure is spelled out as up or down for a screen reader. Under 672px
 * of width each row stacks as feature, description, figure.
 */
export function FeatureOutcomes({ eyebrow, title, description, items, note, headingLevel = 2, labels: custom, className, ...props }: FeatureOutcomesProps) {
  const labels = { ...LABELS, ...custom };
  const RowTitle = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="feature-outcomes" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className="mt-10 border-b border-border @3xl:mt-14">
        {items.map((item) => {
          const figure = figureOf(item.metric.value, labels);
          const [head, tail] = splitLastWord(item.feature);
          return (
            <li
              key={`${item.feature}-${item.customer}`}
              className="group/row relative grid gap-x-12 gap-y-6 border-t border-border py-8 @2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @2xl:py-10"
            >
              <div className="min-w-0">
                <RowTitle className="text-xl leading-snug font-medium tracking-[-0.025em] text-balance">
                  {item.href ? (
                    // The arrow sits in the text, held to the last word, so a name on two lines ends in its arrow.
                    <a href={item.href} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg after:ring-ring/40 focus-visible:after:ring-[3px]">
                      <span className="underline decoration-transparent underline-offset-4 transition-colors duration-150 group-hover/row:decoration-foreground/40 motion-reduce:transition-none">
                        {head}
                        <span className="whitespace-nowrap">
                          {tail}
                          <IconArrowRight
                            aria-hidden="true"
                            className="ml-2 inline-block size-4 align-[-0.15em] text-muted-foreground transition-[translate,color] duration-150 group-hover/row:translate-x-0.5 group-hover/row:text-foreground motion-reduce:transition-none"
                          />
                        </span>
                      </span>
                    </a>
                  ) : (
                    item.feature
                  )}
                </RowTitle>
                <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{item.description}</p>
              </div>

              <dl className="min-w-0">
                <div className="flex flex-col-reverse">
                  <dt className="mt-2.5 text-sm leading-snug text-pretty text-muted-foreground">{item.metric.label}</dt>
                  <dd className="text-[2.75rem] leading-none font-medium tracking-[-0.045em] whitespace-nowrap tabular-nums @2xl:text-5xl">
                    <span aria-hidden="true">
                      {figure.sign}
                      {figure.amount}
                      {figure.unit ? <span className="ml-2 text-xl tracking-[-0.02em] text-muted-foreground @2xl:text-2xl">{figure.unit}</span> : null}
                    </span>
                    <span className="sr-only">{figure.spoken}</span>
                  </dd>
                </div>
                <div className="mt-3">
                  <dt className="sr-only">{labels.measuredBy}</dt>
                  <dd className="text-sm font-medium">{item.customer}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>

      {note ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{note}</span>
        </p>
      ) : null}
    </section>
  );
}
