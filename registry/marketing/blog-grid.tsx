import { cn } from "@/lib/utils";

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  href: string;
  category?: string;
  /** Already formatted for the reader: "12 March 2026". */
  date: string;
  /** ISO date for the time element. */
  dateTime: string;
  readingTime?: string;
  image?: { src: string; alt: string };
}

export interface BlogGridProps {
  eyebrow?: string;
  title: string;
  posts: readonly BlogPost[];
  /** A link to the full archive. */
  allPosts?: { label: string; href: string };
  className?: string;
}

/**
 * Recent writing as cards: image, category and date, title and excerpt. The
 * whole card is one link, made with a stretched title link so the text stays
 * selectable and the outline reads well.
 */
export function BlogGrid({ eyebrow, title, posts, allPosts, className }: BlogGridProps) {
  return (
    <section data-slot="blog-grid" className={cn("py-16 sm:py-24", className)}>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          {eyebrow ? <p className="mb-4 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
          <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{title}</h2>
        </div>
        {allPosts ? <a href={allPosts.href} className="text-sm font-medium underline-offset-4 hover:underline">{allPosts.label}</a> : null}
      </header>
      <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <article className="group relative flex h-full flex-col">
              <div className="aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                {post.image ? <img src={post.image.src} alt={post.image.alt} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" /> : null}
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                {post.category ? <span className="font-medium text-foreground">{post.category}</span> : null}
                <time dateTime={post.dateTime}>{post.date}</time>
                {post.readingTime ? <span>{post.readingTime}</span> : null}
              </p>
              <h3 className="mt-3 text-lg font-medium leading-snug tracking-[-.02em]">
                <a href={post.href} className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40 group-hover:underline group-hover:underline-offset-4">{post.title}</a>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
