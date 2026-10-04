import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FaqEntry {
  question: string;
  answer: ReactNode;
}

export interface FaqColumnsProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  faqs: readonly FaqEntry[];
  className?: string;
}

/**
 * Questions and answers all open, in two columns: for the short FAQ where
 * clicking to reveal every answer would only slow people down. The heading
 * sits beside the list on wide screens.
 */
export function FaqColumns({ eyebrow, title, description, faqs, className }: FaqColumnsProps) {
  return (
    <section data-slot="faq-columns" className={cn("grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_2fr] lg:gap-20", className)}>
      <header>
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <div className="mt-5 text-sm leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">{description}</div> : null}
      </header>
      <dl className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <dt className="text-base font-medium">{faq.question}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
