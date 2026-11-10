import { useId, type ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface ClaimFigure {
  /** The number as you want it written: "11 min", "0", "99.98%". */
  value: string;
  /** What it counts, in a short phrase: "median time to first project". */
  label: string;
}

export interface Claim {
  /** Identifies the claim in the row. */
  id: string;
  /** The promise, as a short heading: "Set up in an afternoon.". */
  claim: string;
  /** The number that backs it. Optional: a claim without one keeps its place and the figure's row stays empty. */
  figure?: ClaimFigure;
  /** The customer's words, without quotation marks: the block adds them. */
  quote: string;
  /** Who said it. */
  name: string;
  /** Their job and company: "Head of operations, Northwind". */
  role: string;
}

export interface ClaimQuotesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** Three or four claims. Two work and five or more fall back to three columns. */
  claims: readonly Claim[];
}

/** The columns by the number of claims, written out so Tailwind sees every class whole. */
const COLUMNS: Record<number, string> = {
  1: "max-w-md",
  2: "md:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

/**
 * A pile of praise turned into an argument: each column opens with a promise
 * as a short heading, shows the number that proves it, and then lets a
 * customer say it in their own words. Every claim is an article with a
 * heading, a description list for the figure and a blockquote, so a screen
 * reader hears the claim, then the number, then the evidence. From 768px the
 * claims share rows (a subgrid), so the headings, the figures, the quotes and
 * the attributions line up across the row however long any quote runs or how
 * many lines a figure's label takes (every number sits at the top of its row);
 * on a phone each claim is a full-width block under its own rule. No state of
 * its own, so it renders on the server.
 */
export function ClaimQuotes({ title, claims, className, ...props }: ClaimQuotesProps) {
  const heading = useId();

  return (
    <section data-slot="claim-quotes" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <h2 id={heading} className="mx-auto max-w-2xl text-center text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
        {title}
      </h2>
      <div className={cn("mt-12 grid gap-x-10 sm:mt-16", COLUMNS[claims.length] ?? COLUMNS[3])}>
        {claims.map((item, index) => (
          <article
            key={item.id}
            aria-labelledby={`${heading}-${index}`}
            className="grid min-w-0 content-start border-t border-border pt-8 pb-12 md:row-span-4 md:grid-rows-subgrid"
          >
            <h3 id={`${heading}-${index}`} className="text-xl leading-snug font-medium tracking-[-0.025em] text-balance md:row-start-1 sm:text-2xl">
              {item.claim}
            </h3>
            {item.figure ? (
              // The number is shown above its label, so the column runs in reverse and flex-end is its top: every number stays on one line when the labels wrap to different lengths.
              <dl className="flex flex-col-reverse justify-end pt-6 md:row-start-2">
                <dt className="mt-2 text-sm text-pretty text-muted-foreground">{item.figure.label}</dt>
                <dd className="text-5xl leading-none font-medium tracking-[-0.05em] tabular-nums">{item.figure.value}</dd>
              </dl>
            ) : null}
            <blockquote className="max-w-[46ch] pt-6 md:row-start-3">
              <p className="text-[0.9375rem] leading-relaxed text-pretty">&ldquo;{item.quote}&rdquo;</p>
            </blockquote>
            <footer className="grid content-start pt-5 text-sm leading-snug md:row-start-4">
              <cite className="font-medium not-italic">{item.name}</cite>
              <span className="text-muted-foreground">{item.role}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
