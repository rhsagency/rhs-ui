import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TestimonialSpotlightProps {
  quote: string;
  name: string;
  role: string;
  /** A portrait or a logo, 48px. */
  avatar?: ReactNode;
  /** A number the quote is about: "3x faster close". */
  result?: { value: string; label: string };
  className?: string;
}

/**
 * One customer, one big quote. For the testimonial that carries the page:
 * the words large and centred, the person underneath, and the result they
 * got beside it when there is one.
 */
export function TestimonialSpotlight({ quote, name, role, avatar, result, className }: TestimonialSpotlightProps) {
  return (
    <section data-slot="testimonial-spotlight" className={cn("py-16 sm:py-24", className)}>
      <figure className="mx-auto max-w-3xl text-center">
        <span aria-hidden="true" className="block font-serif text-7xl leading-none text-muted-foreground/40">&ldquo;</span>
        <blockquote className="-mt-4 text-2xl leading-snug font-medium tracking-[-.03em] text-balance sm:text-3xl">{quote}</blockquote>
        <figcaption className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-10">
          <span className="flex items-center gap-3 text-left">
            {avatar ? <span className="size-12 shrink-0 overflow-hidden rounded-full bg-muted [&_img]:size-full [&_img]:object-cover">{avatar}</span> : null}
            <span>
              <span className="block text-sm font-medium">{name}</span>
              <span className="block text-sm text-muted-foreground">{role}</span>
            </span>
          </span>
          {result ? (
            <span className="border-border text-left sm:border-l sm:pl-10">
              <span className="block text-3xl font-medium tracking-[-.05em] tabular-nums">{result.value}</span>
              <span className="block text-sm text-muted-foreground">{result.label}</span>
            </span>
          ) : null}
        </figcaption>
      </figure>
    </section>
  );
}
