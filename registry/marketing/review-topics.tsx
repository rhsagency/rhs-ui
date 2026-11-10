"use client";

import { useId, type ComponentProps } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { cn } from "@/lib/utils";

export interface ReviewSnippet {
  /** One verbatim line from a real review, without quotation marks: the list adds them. Never a summary of your own. */
  quote: string;
  /** Who wrote it and where, as the review shows them: "Ingrid S., practice manager, G2". */
  author: string;
}

export interface ReviewTopic {
  /** Identifies the topic. It is the value of the row that is open. */
  id: string;
  /** The topic: "Ease of use". */
  label: string;
  /** How many reviews mention it. */
  mentions: number;
  /** The share of those mentions that were positive, from 0 to 1. It is written as a percentage and drawn as a bar. */
  positive: number;
  /** What the row opens to. */
  snippet: ReviewSnippet;
}

export interface ReviewTopicsLabels {
  /** How often a topic comes up; `{count}` is filled in. Default "mentioned in {count} reviews". */
  mentions: string;
  /** The same for a topic mentioned once. Default "mentioned in 1 review". */
  mentionsOne: string;
  /** Written after the percentage, in small muted type (and read with it), so "94%" is not a loose number. Default "positive". */
  positive: string;
}

export interface ReviewTopicsProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Five to eight topics, most mentioned first. */
  topics: readonly ReviewTopic[];
  /** The `id` of the topic that is open, or "" for none. Pass it with `onValueChange` to control the list. */
  value?: string;
  /** The topic that starts open when you do not control `value`. Leave it out to start with every row closed. */
  defaultValue?: string;
  /** Called with the `id` of the topic that was opened, or "" when the open one was closed. */
  onValueChange?: (value: string) => void;
  /** The locale of the numbers. Default "en-US". */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ReviewTopicsLabels>;
}

const LABELS: ReviewTopicsLabels = { mentions: "mentioned in {count} reviews", mentionsOne: "mentioned in 1 review", positive: "positive" };

/** A number formatter that survives a locale the browser does not know. */
function numberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat("en-US", options);
  }
}

/**
 * What reviewers talk about most, as a list you can open: each row is a topic
 * ("Ease of use"), how often it comes up ("mentioned in 842 reviews") and a
 * bar for the share of those mentions that were positive, with the percentage
 * written beside it and followed by the word "positive", so nobody has to
 * guess what the number is the share of. A row is a disclosure: it opens to
 * one verbatim line from a real review and who wrote it, and only one row
 * stays open at a time; it answers a hover with a quiet tint. The bars are
 * decoration in the foreground tone, so the list reads the same in monochrome
 * and in dark mode, and the percentage is the content. It brings the
 * "customers say" pattern of retail pages to software and services.
 * Controlled with `value`, or uncontrolled with `defaultValue`.
 */
export function ReviewTopics({ title, description, topics, value, defaultValue, onValueChange, locale = "en-US", labels, className, ...props }: ReviewTopicsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const count = numberFormat(locale, { maximumFractionDigits: 0 });
  const percent = numberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <section data-slot="review-topics" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <Accordion type="single" collapsible value={value} defaultValue={defaultValue} onValueChange={onValueChange} className="mx-auto mt-12 max-w-4xl border-t border-border sm:mt-16">
        {topics.map((topic) => {
          const share = Math.min(1, Math.max(0, topic.positive));
          return (
            <AccordionItem key={topic.id} value={topic.id}>
              {/* The row is a little wider than its text, so the focus ring has room and the text still lines up with the heading. */}
              <AccordionTrigger className="-mx-3 w-[calc(100%+1.5rem)] cursor-pointer rounded-lg px-3 py-5 outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 max-sm:items-start motion-reduce:transition-none sm:py-6">
                <span className="grid min-w-0 flex-1 items-center gap-x-10 gap-y-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="grid gap-0.5">
                    <span className="text-base font-medium tracking-[-0.01em]">{topic.label}</span>
                    <span className="text-sm font-normal text-muted-foreground tabular-nums">
                      <span className="sr-only">, </span>
                      {topic.mentions === 1 ? words.mentionsOne : words.mentions.replace("{count}", count.format(topic.mentions))}
                    </span>
                  </span>
                  <span className="flex items-center gap-4">
                    <span aria-hidden="true" className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full rounded-full bg-foreground" style={{ width: `${share * 100}%` }} />
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-medium whitespace-nowrap tabular-nums sm:w-28">
                      <span className="sr-only">, </span>
                      {percent.format(share)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">{words.positive}</span>
                    </span>
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="data-[state=closed]:animate-rhs-topic-up data-[state=open]:animate-rhs-topic-down motion-reduce:animate-none">
                <figure className="max-w-2xl border-l-2 border-foreground/25 pl-5">
                  <blockquote>
                    <p className="text-base leading-relaxed text-pretty text-foreground">&ldquo;{topic.snippet.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-3 text-sm text-muted-foreground">{topic.snippet.author}</figcaption>
                </figure>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
