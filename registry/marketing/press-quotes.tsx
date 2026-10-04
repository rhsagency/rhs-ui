import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PressQuote {
  /** The publication's name, and its wordmark if you have the rights to show it. */
  outlet: string;
  mark?: ReactNode;
  quote: string;
  /** Link to the article. */
  href?: string;
}

export interface PressQuotesProps {
  title?: string;
  quotes: readonly PressQuote[];
  className?: string;
}

/**
 * "As seen in", done properly: a short line from each article with the
 * outlet under it, linking to the piece. Three across, stacked on a phone,
 * with thin rules between them like a newspaper column.
 */
export function PressQuotes({ title = "In the press", quotes, className }: PressQuotesProps) {
  return (
    <section data-slot="press-quotes" className={cn("py-14 sm:py-20", className)}>
      <h2 className="text-center text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{title}</h2>
      <ul className="mt-10 grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
        {quotes.map((item) => (
          <li key={item.outlet} className="px-6 py-8 text-center md:py-2">
            <figure>
              <blockquote className="text-lg leading-snug font-medium tracking-[-.02em] text-balance">&ldquo;{item.quote}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground [&_svg]:h-5 [&_svg]:w-auto">
                {item.mark}
                {item.href ? <a href={item.href} className="underline-offset-4 hover:text-foreground hover:underline">{item.outlet}</a> : <cite className="not-italic">{item.outlet}</cite>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
