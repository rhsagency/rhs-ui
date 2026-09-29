import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  /** "Head of design, Studio North" */
  role: string;
  avatar?: string;
}

export interface TestimonialGridProps {
  eyebrow?: string;
  title: string;
  testimonials: readonly Testimonial[];
  /** The id of one testimonial to set larger, first in reading order. */
  featured?: string;
  className?: string;
}

/**
 * Proof in the words of the people who use it: quotes in columns that keep
 * their natural height, each with a name, a role and a face or initials.
 * One quote can be featured; it leads the grid and spans two columns.
 */
export function TestimonialGrid({ eyebrow, title, testimonials, featured, className }: TestimonialGridProps) {
  const ordered = featured ? [...testimonials].sort((a, b) => Number(b.id === featured) - Number(a.id === featured)) : testimonials;
  return (
    <section data-slot="testimonial-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((item) => {
          const lead = item.id === featured;
          return (
            <li key={item.id} className={cn("flex", lead && "sm:col-span-2")}>
              <figure className={cn("flex w-full flex-col justify-between gap-8 rounded-2xl border border-border bg-card p-7", lead && "bg-muted/40")}>
                <blockquote className={cn("leading-relaxed text-pretty text-foreground", lead ? "text-xl tracking-[-.01em] sm:text-2xl" : "text-[0.9375rem]")}>
                  <p>{item.quote}</p>
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <Avatar>
                    {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
                    <AvatarFallback>{initialsOf(item.name)}</AvatarFallback>
                  </Avatar>
                  <span className="grid text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
