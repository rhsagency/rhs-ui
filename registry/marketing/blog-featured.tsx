import { cn } from "@/lib/utils";

export interface FeaturedPost {
  id: string;
  title: string;
  excerpt?: string;
  href: string;
  category?: string;
  date: string;
  dateTime: string;
  author?: string;
  image?: { src: string; alt: string };
}

export interface BlogFeaturedProps {
  title: string;
  /** The first post leads, large; the rest list beside it. */
  posts: readonly FeaturedPost[];
  className?: string;
}

/**
 * An editorial front page: one lead story with a large image, and a numbered
 * list of the next ones beside it. Built for a journal, a changelog with
 * essays, or a resources hub.
 */
export function BlogFeatured({ title, posts, className }: BlogFeaturedProps) {
  const [lead, ...rest] = posts;
  if (!lead) return null;
  return (
    <section data-slot="blog-featured" className={cn("py-16 sm:py-24", className)}>
      <h2 className="mb-10 border-b border-border pb-5 text-sm font-medium uppercase tracking-[.18em] text-muted-foreground">{title}</h2>
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr]">
        <article className="group relative">
          <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {lead.image ? <img src={lead.image.src} alt={lead.image.alt} className="size-full object-cover" /> : null}
          </div>
          <p className="mt-6 flex gap-3 text-xs text-muted-foreground">
            {lead.category ? <span className="font-medium text-foreground">{lead.category}</span> : null}
            <time dateTime={lead.dateTime}>{lead.date}</time>
          </p>
          <h3 className="mt-3 text-3xl font-medium leading-tight tracking-[-.04em] text-balance sm:text-4xl">
            <a href={lead.href} className="outline-none after:absolute after:inset-0 focus-visible:after:rounded-2xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 group-hover:underline group-hover:underline-offset-4">{lead.title}</a>
          </h3>
          {lead.excerpt ? <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">{lead.excerpt}</p> : null}
          {lead.author ? <p className="mt-4 text-sm">By {lead.author}</p> : null}
        </article>
        <ol className="flex flex-col divide-y divide-border">
          {rest.map((post, index) => (
            <li key={post.id} className="group relative flex gap-5 py-6 first:pt-0">
              <span aria-hidden="true" className="font-mono text-xs text-muted-foreground tabular-nums">{String(index + 2).padStart(2, "0")}</span>
              <div>
                <p className="text-xs text-muted-foreground">{post.category ? `${post.category} · ` : ""}<time dateTime={post.dateTime}>{post.date}</time></p>
                <h3 className="mt-2 text-base font-medium leading-snug">
                  <a href={post.href} className="outline-none after:absolute after:inset-0 focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 group-hover:underline group-hover:underline-offset-4">{post.title}</a>
                </h3>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
