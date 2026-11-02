import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

export interface DeploymentFact {
  /** What the fact is about: "Runs on", "Data lives". Use the same labels, in the same order, in every option, so the rows line up across the cards. */
  label: string;
  /** The answer, in a few words. */
  value: ReactNode;
}

export interface DeploymentCta {
  /** The button's text: "Start in the cloud". */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface DeploymentOption {
  /** A stable id for the option. It keys the card, so it must be unique. */
  id: string;
  /** What the option is called: "Cloud", "Self-hosted", "Retainer". */
  name: string;
  /** Who it suits, finishing the line "Best for ...": "teams that want to be live this week". */
  bestFor: string;
  /** The facts that tell the options apart. No prices: this is about fit, not billing. */
  facts: readonly DeploymentFact[];
  /** The one action of the card. */
  cta?: DeploymentCta;
  /** Marks the option you would pick for most readers, in words and with a heavier border. One is enough. */
  recommended?: boolean;
}

export interface DeploymentOptionsLabels {
  /** The word on the recommended card. */
  recommended: string;
  /** The words before what an option is best for. */
  bestFor: string;
  /** Read out in place of a dash where an option has no answer to a fact the others have. */
  none: string;
}

export interface DeploymentOptionsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "How you run it". */
  eyebrow?: string;
  /** The heading: "Choose how Halcyon runs". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Whether the heading is set from the start or from the middle. "start" by default. */
  align?: "start" | "center";
  /** Two to four options. They sit side by side when the block is wide enough for their facts, and stack under that. */
  options: readonly DeploymentOption[];
  /** The level of the heading: 2 by default. The name of each option sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DeploymentOptionsLabels>;
}

const LABELS: DeploymentOptionsLabels = { recommended: "Recommended", bestFor: "Best for", none: "Not applicable" };

/**
 * The columns by how many options there are, and the classes that make each card a subgrid over the same rows, written
 * out so Tailwind sees every one. Two options sit side by side from 672px, three from 896px (their facts need
 * about 270px each), four go two by two and then four across from 1152px. Below that they stack and the cards
 * are plain columns: from 576px a stacked card is wide enough to set each fact as its label beside its answer,
 * where a phone keeps the label above it, and the subgrid goes back to label above answer where the cards narrow
 * again. The cards carry their own bottom margin from the breakpoint on, because a grid gap would also open up
 * between the rows inside a card.
 */
const LAYOUT = {
  1: { list: "mx-auto max-w-md", card: "", facts: "", fact: "", answer: "mt-1", action: "" },
  2: {
    list: "@2xl:grid-cols-2 @2xl:gap-y-0 @2xl:-mb-5",
    card: "@2xl:mb-5 @2xl:row-span-(--rows) @2xl:grid @2xl:grid-rows-subgrid",
    facts: "@2xl:row-span-(--facts) @2xl:grid @2xl:grid-rows-subgrid",
    fact: "@xl:grid @xl:grid-cols-[9rem_minmax(0,1fr)] @xl:items-baseline @xl:gap-x-4 @2xl:block",
    answer: "mt-1 @xl:mt-0 @2xl:mt-1",
    action: "@xl:w-auto @2xl:w-full",
  },
  3: {
    list: "@4xl:grid-cols-3 @4xl:gap-y-0 @4xl:-mb-5",
    card: "@4xl:mb-5 @4xl:row-span-(--rows) @4xl:grid @4xl:grid-rows-subgrid",
    facts: "@4xl:row-span-(--facts) @4xl:grid @4xl:grid-rows-subgrid",
    fact: "@xl:grid @xl:grid-cols-[9rem_minmax(0,1fr)] @xl:items-baseline @xl:gap-x-4 @4xl:block",
    answer: "mt-1 @xl:mt-0 @4xl:mt-1",
    action: "@xl:w-auto @4xl:w-full",
  },
  4: {
    list: "@2xl:grid-cols-2 @6xl:grid-cols-4 @2xl:gap-y-0 @2xl:-mb-5",
    card: "@2xl:mb-5 @2xl:row-span-(--rows) @2xl:grid @2xl:grid-rows-subgrid",
    facts: "@2xl:row-span-(--facts) @2xl:grid @2xl:grid-rows-subgrid",
    fact: "@xl:grid @xl:grid-cols-[9rem_minmax(0,1fr)] @xl:items-baseline @xl:gap-x-4 @2xl:block",
    answer: "mt-1 @xl:mt-0 @2xl:mt-1",
    action: "@xl:w-auto @2xl:w-full",
  },
} as const;

/**
 * Cloud, self-hosted or hybrid side by side: who runs it, where the data lives, what you manage, how it is updated
 * and who supports it. Each card has a name, a line on who it is best for, a list of facts and one action, and one
 * may be marked Recommended in words. The facts use the same labels in every card, so on a wide block the rows are
 * rows of one grid (a subgrid) and each answer lines up with its neighbours whatever their length; where the cards
 * stack, each is a column of facts, with the label beside its answer on a tablet and above it on a phone. A fact
 * that an option has no answer for shows a dash, so the rows still line up. No price appears: this is about fit, not
 * billing. It serves infrastructure choices just as well as how a studio works with you (project, retainer,
 * embedded team). Nothing animates.
 */
export function DeploymentOptions({ eyebrow, title, description, align = "start", options, headingLevel = 2, labels: custom, className, ...props }: DeploymentOptionsProps) {
  const labels = { ...LABELS, ...custom };
  const OptionName = `h${headingLevel + 1}` as "h3" | "h4";
  // Every fact label that any option has, in the order they first appear: the rows all the cards share.
  const rows = [...new Set(options.flatMap((option) => option.facts.map((fact) => fact.label)))];
  const hasAction = options.some((option) => option.cta);
  // The rows of a card: its name, its best-for line, one per fact, and the action.
  const span = 2 + rows.length + (hasAction ? 1 : 0);
  const layout = LAYOUT[Math.min(Math.max(options.length, 1), 4) as 1 | 2 | 3 | 4];

  return (
    <section data-slot="deployment-options" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} align={align === "center" ? "center" : "left"} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className={cn("mt-10 grid gap-5 @3xl:mt-12", layout.list)}>
        {options.map((option) => (
          <li
            key={option.id}
            style={{ "--rows": span, "--facts": rows.length } as CSSProperties}
            className={cn("flex min-w-0 flex-col rounded-2xl border bg-card p-6 @xl:p-7", layout.card, option.recommended ? "border-foreground" : "border-border")}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <OptionName className="text-xl leading-snug font-medium tracking-[-0.025em]">{option.name}</OptionName>
              {option.recommended ? <Badge className="h-6 px-2.5 text-[0.8125rem]">{labels.recommended}</Badge> : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-pretty">
              <span className="text-muted-foreground">{labels.bestFor}</span> {option.bestFor}
            </p>
            {rows.length ? (
              <dl className={cn("mt-6", layout.facts)}>
                {rows.map((label) => {
                  const fact = option.facts.find((entry) => entry.label === label);
                  return (
                    <div key={label} className={cn("min-w-0 border-t border-border py-3.5", layout.fact)}>
                      <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
                      <dd className={cn("text-sm leading-snug font-medium text-pretty", layout.answer)}>
                        {fact ? (
                          fact.value
                        ) : (
                          <>
                            <span aria-hidden="true">&ndash;</span>
                            <span className="sr-only">{labels.none}</span>
                          </>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            ) : null}
            {option.cta ? (
              <div className="mt-6">
                <Button asChild size="lg" variant={option.recommended ? "default" : "outline"} className={cn("w-full", layout.action)}>
                  <a href={option.cta.href}>
                    {option.cta.label}
                    <IconArrowRight aria-hidden="true" />
                  </a>
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
