import { cn } from "@/lib/utils";

export interface WallQuote {
  id: string;
  quote: string;
  name: string;
  handle?: string;
  /** Initials are drawn when no image is given. */
  avatar?: string;
}

export interface TestimonialWallProps {
  eyebrow?: string;
  title: string;
  quotes: readonly WallQuote[];
  className?: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0] ?? "").join("").slice(0, 2).toUpperCase();
}

/**
 * Many short quotes in balanced columns, the way people talk about a product
 * in public. Columns flow with CSS, so a long quote never leaves a hole.
 */
export function TestimonialWall({ eyebrow, title, quotes, className }: TestimonialWallProps) {
  return (
    <section data-slot="testimonial-wall" className={cn("py-16 sm:py-24", className)}>
      <header className="mx-auto max-w-2xl text-center">
        {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      </header>
      <ul className="mt-14 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {quotes.map((item) => (
          <li key={item.id} className="mb-4 break-inside-avoid rounded-2xl border border-border bg-card p-6">
            <figure>
              <blockquote className="text-sm leading-relaxed">{item.quote}</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium">
                  {item.avatar ? <img src={item.avatar} alt="" className="size-full object-cover" /> : initials(item.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.name}</span>
                  {item.handle ? <span className="block truncate text-xs text-muted-foreground">{item.handle}</span> : null}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
