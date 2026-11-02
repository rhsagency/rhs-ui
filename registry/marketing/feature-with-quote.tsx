import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface FeatureWithQuoteFeature {
  /** The small line over the title: "Shared inboxes". */
  eyebrow?: string;
  /** The feature, said as what it does for the reader. */
  title: string;
  /** A short paragraph on how it works. */
  description: string;
  /** Three short points, each with a check. */
  points?: readonly string[];
  /** Where to read more. It becomes a button under the points. */
  href?: string;
  /** The button's text. "Learn more" by default; a screen reader also hears the title. */
  linkLabel?: string;
}

export interface FeatureWithQuoteQuote {
  /** What the customer said, without quotation marks. It is set large. */
  text: string;
  /** Who said it. */
  name: string;
  /** Their job: "Head of Support". */
  role?: string;
  /** Where they work. It is part of why the quote counts, so it is never left out. */
  company: string;
  /** The address of their picture. Their initials show without one, and until it loads. */
  avatar?: string;
  /** What changed, said as one line that stands as a fact outside the quote: "Cut support replies from 4 hours to 40 minutes". */
  result?: string;
}

export interface FeatureWithQuoteLabels {
  /** The small word over the result line. */
  result: string;
  /** The button's text when the feature has an href and no linkLabel. */
  learnMore: string;
}

export interface FeatureWithQuoteProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The feature on one side: eyebrow, title, a paragraph, three points and a link. */
  feature: FeatureWithQuoteFeature;
  /** The customer on the other side, with the result they got. */
  quote: FeatureWithQuoteQuote;
  /** Puts the quote on the left and the feature on the right from 768px. On a phone the feature always comes first. */
  reverse?: boolean;
  /** The level of the feature's title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FeatureWithQuoteLabels>;
}

const LABELS: FeatureWithQuoteLabels = { result: "Result", learnMore: "Learn more" };

/**
 * One feature explained on one side and the customer who proves it on the other. On the left an eyebrow, the title,
 * a paragraph, three points and a link; on the right a card with the customer's words set large, their picture,
 * name, job and company, and underneath the result they got as one bold line. Evidence beside the claim it supports
 * persuades more than a wall of testimonials further down the page. The words are a blockquote with the person in
 * its caption, and the result sits outside the quote on a band of its own, so it reads as a fact the customer
 * measured and not as something they said. Under 768px of width the two stack, feature first; `reverse` swaps the
 * sides above that. The card sizes its type and padding from its own width, so it holds in a narrow column too.
 */
export function FeatureWithQuote({ feature, quote, reverse = false, headingLevel = 2, labels: custom, className, ...props }: FeatureWithQuoteProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const who = quote.role ? `${quote.role}, ${quote.company}` : quote.company;

  return (
    <section data-slot="feature-with-quote" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-10 @3xl:grid-cols-2 @3xl:items-center @3xl:gap-16">
        <div className={cn("min-w-0", reverse && "@3xl:order-2")}>
          {feature.eyebrow ? <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{feature.eyebrow}</p> : null}
          <Heading id={`${id}-title`} className={cn("text-3xl leading-[1.1] font-medium tracking-[-0.035em] text-balance @3xl:text-4xl", feature.eyebrow && "mt-3")}>
            {feature.title}
          </Heading>
          <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground">{feature.description}</p>
          {feature.points?.length ? (
            <ul role="list" className="mt-7 grid gap-3.5">
              {feature.points.map((point, index) => (
                <li key={`${index}-${point}`} className="flex items-start gap-3 text-[0.9375rem] leading-snug">
                  <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground">
                    <IconCheck className="size-3 stroke-[2.5]" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          ) : null}
          {feature.href ? (
            <div className="mt-8">
              <Button asChild variant="outline" size="lg">
                <a href={feature.href}>
                  {feature.linkLabel ?? labels.learnMore}
                  {feature.linkLabel ? null : <span className="sr-only">: {feature.title}</span>}
                  <IconArrowRight aria-hidden="true" />
                </a>
              </Button>
            </div>
          ) : null}
        </div>

        {/* A container of its own: the card sets its padding and type from its width, not from the width of the block. */}
        <div className={cn("@container min-w-0 overflow-hidden rounded-2xl border border-border bg-card", reverse && "@3xl:order-1")}>
          <figure className="p-6 @sm:p-9">
            <span aria-hidden="true" className="block h-9 text-7xl leading-[0.9] font-medium text-foreground/20 select-none">
              &ldquo;
            </span>
            <blockquote className="mt-4 text-xl leading-snug font-medium tracking-[-0.02em] text-balance @sm:text-2xl">
              <p>{quote.text}</p>
            </blockquote>
            <figcaption className="mt-7 flex items-center gap-3.5 @sm:mt-9">
              <Avatar size="lg">
                {quote.avatar ? <AvatarImage src={quote.avatar} alt="" /> : null}
                <AvatarFallback>{initialsOf(quote.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 text-sm leading-snug">
                <cite className="block font-medium not-italic">{quote.name}</cite>
                <span className="mt-0.5 block text-muted-foreground">{who}</span>
              </div>
            </figcaption>
          </figure>
          {quote.result ? (
            <dl className="border-t border-border bg-muted/50 px-6 py-5 @sm:px-9">
              <dt className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.result}</dt>
              <dd className="mt-1.5 text-base leading-snug font-semibold tracking-[-0.01em] text-balance @sm:text-lg">{quote.result}</dd>
            </dl>
          ) : null}
        </div>
      </div>
    </section>
  );
}
