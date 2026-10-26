import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconBookOpen, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface TopicFact {
  /** "Articles", "Contributors", "Last updated". */
  label: string;
  /** "42", "9", or a time element for a date. Set large, in tabular numbers. */
  value: ReactNode;
}

export interface TopicStartLink {
  /** The piece's title. */
  title: string;
  href: string;
  /** How long it takes to read, in minutes. */
  minutes?: number;
  /** One line on what the reader gets from it, and why it comes at this point. */
  blurb?: string;
}

export interface TopicRelatedLink {
  /** The related topic's name: "Hiring". */
  label: string;
  /** Its own hub. */
  href: string;
  /** How many articles it holds. */
  count?: number;
}

export interface TopicHubLabels {
  /** The heading of the reading path. */
  startHere: string;
  /** One line under that heading. */
  startHint: string;
  /** The reading time of a piece. {minutes} stands for the number. */
  minutes: string;
  /** The heading of the related topics. */
  related: string;
  /** Read out after a related topic's name when it has a count. {count} stands for the number. */
  articles: string;
}

export interface TopicHubProps extends Omit<ComponentProps<"section">, "title"> {
  /** A small line above the topic's name: "Topic". */
  eyebrow?: string;
  /** The topic's name. It is the page's own heading, so it is an h1 unless you change `headingLevel`. */
  title: string;
  /** Two or three sentences on what the topic covers and who it is for. */
  description?: string;
  /** Three or four facts about the topic: articles, contributors, last updated. */
  facts?: readonly TopicFact[];
  /** Three to five pieces to read in order. Each is numbered, with its reading time and a line about it. */
  startHere: readonly TopicStartLink[];
  /** Topics that sit next to this one, as links to their own hubs. */
  related?: readonly TopicRelatedLink[];
  /** The level of the topic's name: 1 by default, since this opens a page. The panel and the related topics sit one level below it. */
  headingLevel?: 1 | 2 | 3;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TopicHubLabels>;
  /** Whatever follows the opening: the latest articles, a newsletter form. It is placed below the related topics. */
  children?: ReactNode;
  /** Locale for the reading times. */
  locale?: string;
}

const LABELS: TopicHubLabels = {
  startHere: "Start here",
  startHint: "New to this? Read these in order.",
  minutes: "{minutes} min read",
  related: "Related topics",
  articles: "{count} articles",
};

/** Puts values into a sentence: {minutes} becomes the number. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/**
 * The top of a topic page: the topic's name, what it covers and a few facts
 * on the left, and on the right a Start here panel with a numbered path
 * through the best pieces, each with its reading time and a line about it.
 * Under them, related topics as chips that link to their own hubs. It turns a
 * tag archive into somewhere a new reader can begin. The path is an ordered
 * list, so the sequence is announced, and each row is one stretched link
 * rather than a title and a "read more". Unlike SubpageHeader it has a point
 * of view about where to start.
 */
export function TopicHub({
  eyebrow,
  title,
  description,
  facts = [],
  startHere,
  related = [],
  headingLevel = 1,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  children,
  className,
  ...props
}: TopicHubProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);
  return (
    <section data-slot="topic-hub" className={cn("w-full break-words", className)} {...props}>
      <div className={cn("grid grid-cols-1 gap-x-16 gap-y-12", startHere.length > 0 && "lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]")}>
        <header className="flex min-w-0 flex-col">
          {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
          {description ? <p className="mt-5 max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          {facts.length ? (
            // The facts follow the description at every width. Pinned to the foot of the column beside a tall panel, they sat a few hundred pixels below it.
            <div className="mt-10">
              <dl className="flex flex-wrap gap-x-12 gap-y-6 border-t border-border pt-6">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse gap-1">
                    <dt className="text-sm text-muted-foreground">{fact.label}</dt>
                    <dd className="text-2xl leading-tight font-medium tracking-[-0.03em] tabular-nums">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </header>

        {startHere.length ? (
          <div className="self-start overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
              <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted/50">
                <IconBookOpen className="size-4" />
              </span>
              <div className="min-w-0">
                <Sub className="text-base leading-snug font-semibold tracking-[-0.015em]">
                  {labels.startHere}
                </Sub>
                <p className="mt-0.5 text-sm text-muted-foreground">{labels.startHint}</p>
              </div>
            </div>
            <ol role="list" className="divide-y divide-border">
              {startHere.map((step, index) => (
                <li key={`${step.title}-${step.href}`} className="group/step relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none sm:px-6">
                  <span aria-hidden="true" className="mt-px grid size-7 place-items-center rounded-full border border-border bg-background text-xs font-medium tabular-nums transition-colors duration-150 group-hover/step:border-foreground motion-reduce:transition-none">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-pretty">
                      <Link
                        href={step.href}
                        className="rounded-sm outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 focus-visible:after:ring-inset"
                      >
                        {step.title}
                      </Link>
                    </p>
                    {step.blurb ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.blurb}</p> : null}
                    {step.minutes !== undefined ? (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <IconClock aria-hidden="true" className="size-3.5" />
                        <span className="tabular-nums">{fill(labels.minutes, { minutes: numbers.format(step.minutes) })}</span>
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      {related.length ? (
        <nav aria-labelledby={`${id}-related`} className="mt-14 border-t border-border pt-8">
          <Sub id={`${id}-related`} className="text-sm font-medium text-muted-foreground">
            {labels.related}
          </Sub>
          <ul role="list" className="mt-4 flex flex-wrap gap-2.5">
            {related.map((topic) => (
              <li key={`${topic.label}-${topic.href}`}>
                <Badge asChild variant="outline" className="h-9 gap-2 px-4 text-sm font-normal hover:border-foreground/30">
                  <Link href={topic.href}>
                    {topic.label}
                    {topic.count !== undefined ? (
                      <>
                        <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
                          {numbers.format(topic.count)}
                        </span>
                        <span className="sr-only">, {fill(labels.articles, { count: numbers.format(topic.count) })}</span>
                      </>
                    ) : null}
                  </Link>
                </Badge>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {children ? <div className="mt-16">{children}</div> : null}
    </section>
  );
}
