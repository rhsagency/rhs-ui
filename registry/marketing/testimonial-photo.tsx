import type { ReactNode } from "react";

import { IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TestimonialPhotoProps {
  quote: string;
  name: string;
  role?: string;
  /** A portrait or a photo of their work: always visible, never animated in. */
  photo: ReactNode;
  /** Out of five; shown as stars with the number for screen readers. */
  rating?: number;
  /** Put the photo on the right instead. */
  reverse?: boolean;
  className?: string;
}

/**
 * One customer, big: their photo filling half the section and their words
 * set large next to it, with an optional star rating. A figure with a
 * blockquote and caption, so the name belongs to the quote.
 */
export function TestimonialPhoto({ quote, name, role, photo, rating, reverse = false, className }: TestimonialPhotoProps) {
  return (
    <figure data-slot="testimonial-photo" className={cn("grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2 md:gap-16", className)}>
      <div className={cn("aspect-[4/5] overflow-clip rounded-3xl bg-muted [&_img]:size-full [&_img]:object-cover", reverse && "md:order-2")}>{photo}</div>
      <div>
        {rating !== undefined ? (
          <p className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <IconStar key={index} aria-hidden="true" className={cn("size-4", index < Math.round(rating) ? "fill-current" : "opacity-30")} />
            ))}
            <span className="sr-only">Rated {rating} out of 5</span>
          </p>
        ) : null}
        <blockquote className="mt-5 text-2xl leading-snug font-medium tracking-[-.025em] text-balance sm:text-3xl">“{quote}”</blockquote>
        <figcaption className="mt-8 border-t border-border pt-5 text-sm">
          <span className="block font-medium">{name}</span>
          {role ? <span className="block text-muted-foreground">{role}</span> : null}
        </figcaption>
      </div>
    </figure>
  );
}
