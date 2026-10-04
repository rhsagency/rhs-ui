import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CustomerStoryProps {
  /** The company and its mark. */
  company: string;
  logo?: ReactNode;
  quote: string;
  name: string;
  role: string;
  /** A photo of the person or their place, tall. */
  photo: ReactNode;
  /** Two or three results: value and label. */
  results: readonly { value: string; label: string }[];
  /** "Read the story" link or button. */
  action?: ReactNode;
  className?: string;
}

/**
 * One customer told big: a tall photo, their words, and the numbers that
 * back the words in a row underneath. For the story that should carry the
 * page, on a dark band so it reads as a chapter of its own.
 */
export function CustomerStory({ company, logo, quote, name, role, photo, results, action, className }: CustomerStoryProps) {
  return (
    <section data-slot="customer-story" className={cn("dark overflow-hidden rounded-3xl bg-background text-foreground", className)}>
      <div className="grid lg:grid-cols-[2fr_3fr]">
        <div className="aspect-[4/3] bg-muted lg:aspect-auto [&_img]:size-full [&_img]:object-cover">{photo}</div>
        <div className="flex flex-col p-8 sm:p-12">
          <p className="flex items-center gap-2 text-sm font-medium [&_svg]:size-5">{logo}{company}</p>
          <figure className="mt-8">
            <blockquote className="text-2xl leading-snug font-medium tracking-[-.03em] text-balance sm:text-3xl">&ldquo;{quote}&rdquo;</blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground"><span className="text-foreground">{name}</span>, {role}</figcaption>
          </figure>
          <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-3">
            {results.map((result) => (
              <div key={result.label} className="flex flex-col">
                <dt className="text-xs text-muted-foreground">{result.label}</dt>
                <dd className="order-first text-3xl font-medium tracking-[-.05em] tabular-nums">{result.value}</dd>
              </div>
            ))}
          </dl>
          {action ? <div className="mt-8">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}
