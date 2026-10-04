import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TestimonialHeroProps {
  /** The title's element: "h2" (the default) inside a page, "h1" when this opens the page. */
  titleAs?: "h1" | "h2";
  title: string;
  description?: string;
  actions?: ReactNode;
  /** One customer's words carry the opening. */
  quote: string;
  name: string;
  role: string;
  /** The person's portrait, always visible. */
  photo?: ReactNode;
  className?: string;
}

/**
 * An opening that lets a customer make the promise: the headline and the
 * action on the left, a large quote card with a portrait on the right. For
 * services where trust sells more than features: coaching, care, agencies.
 */
export function TestimonialHero({ titleAs: Title = "h2", title, description, actions, quote, name, role, photo, className }: TestimonialHeroProps) {
  return (
    <section data-slot="testimonial-hero" className={cn("grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16", className)}>
      <div>
        <Title className="text-4xl leading-[1.05] font-medium tracking-[-.05em] text-balance sm:text-6xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <figure className="rounded-3xl bg-muted p-8 sm:p-10">
        <blockquote className="text-2xl leading-snug font-medium tracking-[-.02em] text-balance">“{quote}”</blockquote>
        <figcaption className="mt-8 flex items-center gap-4">
          {photo ? <span className="size-14 shrink-0 overflow-clip rounded-full bg-background [&_img]:size-full [&_img]:object-cover">{photo}</span> : null}
          <span><span className="block font-medium">{name}</span><span className="block text-sm text-muted-foreground">{role}</span></span>
        </figcaption>
      </figure>
    </section>
  );
}
