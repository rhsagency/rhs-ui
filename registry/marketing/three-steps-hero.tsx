import type { ComponentProps, CSSProperties } from "react";

import { IconArrowRight, IconClock, IconFlag } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ThreeStepsHeroStep {
  /** Verb first: "Upload", "We check", "You receive it". */
  title: string;
  /** One line on what happens in this step. */
  description?: string;
  /** How long it takes, written so it can be quoted: "2 minutes", "Same day", "In 3 days". */
  time: string;
}

export interface ThreeStepsHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. The step titles sit one level below it. */
  titleAs?: "h1" | "h2";
  /** The promise, in a line. */
  title: string;
  /** One or two sentences beside the action. */
  description?: string;
  /** The one primary action. */
  cta: { label: string; href: string };
  /** The steps in order, each with its duration. Three is the design; two to four fit. */
  steps: readonly ThreeStepsHeroStep[];
  /** The whole promise in a line under the steps: "From start to done: about 3 days". */
  summary?: string;
}

/**
 * A hero that answers "how does this work, and how long does it take" on the
 * first screen: the promise and one action above, three numbered steps on a
 * rule below, each with its duration written out. The steps are an ordered
 * list and the durations are plain text, so the promise can be read aloud and
 * quoted. For tax, print, repair, translation and any service where the real
 * question is what happens next.
 */
export function ThreeStepsHero({ titleAs: Title = "h2", title, description, cta, steps, summary, className, ...props }: ThreeStepsHeroProps) {
  const StepTitle = Title === "h1" ? "h2" : "h3";
  // The promise row and the steps share one column count, so the action lands exactly on the last step's numeral.
  const columns = { "--steps": steps.length } as CSSProperties;
  return (
    <section data-slot="three-steps-hero" className={cn("py-16 sm:py-24", className)} {...props}>
      <div style={columns} className="grid grid-cols-1 items-end gap-8 lg:grid-cols-[repeat(var(--steps),minmax(0,1fr))] lg:gap-x-0">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:[grid-column:1/-2] lg:pr-16 lg:text-6xl">{title}</Title>
        <div className="lg:[grid-column:-2/-1]">
          {description ? <p className="max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
          <Button asChild size="lg" className={description ? "mt-7" : undefined}>
            <a href={cta.href}>
              {cta.label}
              <IconArrowRight />
            </a>
          </Button>
        </div>
      </div>
      <ol
        role="list"
        style={columns}
        className="relative mt-14 ml-1.5 max-md:before:absolute max-md:before:top-[13px] max-md:before:bottom-0 max-md:before:left-0 max-md:before:w-px max-md:before:bg-foreground/25 sm:mt-20 md:ml-0 md:grid md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:border-t md:border-foreground/25"
      >
        {steps.map((step, index) => (
          <li key={step.title} className="relative pb-12 pl-8 last:pb-0 md:pt-8 md:pr-8 md:pb-0 md:pl-0">
            <span aria-hidden="true" className="absolute top-2 -left-[4.5px] size-2.5 rounded-full bg-foreground md:-top-[5.5px] md:left-0" />
            <span aria-hidden="true" className="block text-5xl leading-none font-medium tracking-[-0.05em] text-muted-foreground tabular-nums sm:text-6xl">
              {String(index + 1).padStart(2, "0")}
            </span>
            <StepTitle className="mt-6 text-xl font-medium tracking-[-0.02em] sm:text-2xl">{step.title}</StepTitle>
            {step.description ? <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.description}</p> : null}
            <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm font-medium">
              <IconClock className="size-3.5 text-muted-foreground" />
              {step.time}
            </p>
          </li>
        ))}
      </ol>
      {summary ? (
        <p className="mt-12 flex items-center gap-2.5 text-base font-medium tracking-[-0.01em]">
          <IconFlag className="size-4 shrink-0 text-muted-foreground" />
          {summary}
        </p>
      ) : null}
    </section>
  );
}
