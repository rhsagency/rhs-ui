import { cn } from "@/lib/utils";

export interface PullQuoteProps {
  quote: string;
  /** Who said it. */
  cite?: string;
  /** Their role or the source. */
  source?: string;
  align?: "center" | "left";
  className?: string;
}

/**
 * A line lifted out of an article and set large, with a rule above and the
 * person underneath. A figure with a blockquote and a caption, so the
 * attribution belongs to the quote.
 */
export function PullQuote({ quote, cite, source, align = "center", className }: PullQuoteProps) {
  return (
    <figure data-slot="pull-quote" className={cn("my-10 border-t-2 border-foreground pt-6", align === "center" ? "text-center" : "text-left", className)}>
      <blockquote className="text-2xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-3xl">{quote}</blockquote>
      {cite ? (
        <figcaption className="mt-4 text-sm">
          <span className="font-medium">{cite}</span>
          {source ? <span className="text-muted-foreground">, {source}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
