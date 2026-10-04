import { cn } from "@/lib/utils";

export interface BlogListPost {
  href: string;
  title: string;
  excerpt: string;
  category: string;
  /** Formatted: "12 March 2026". */
  date: string;
  dateTime: string;
  readingTime?: string;
}

export interface BlogListProps {
  title?: string;
  posts: readonly BlogListPost[];
  className?: string;
}

/**
 * Posts as a list instead of a grid: date in the margin, category, title and
 * one line, separated by rules. Text-first and fast to scan, for blogs that
 * publish more words than pictures.
 */
export function BlogList({ title, posts, className }: BlogListProps) {
  return (
    <section data-slot="blog-list" className={cn("py-16 sm:py-20", className)}>
      {title ? <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2> : null}
      <ol className={cn("divide-y divide-border border-y border-border", title && "mt-10")}>
        {posts.map((post) => (
          <li key={`${post.href}-${post.title}`}>
            <article className="group relative grid gap-2 py-7 sm:grid-cols-[10rem_1fr] sm:gap-8">
              <p className="text-sm text-muted-foreground"><time dateTime={post.dateTime}>{post.date}</time></p>
              <div>
                <p className="text-xs font-medium tracking-[.1em] text-muted-foreground uppercase">{post.category}{post.readingTime ? ` · ${post.readingTime}` : ""}</p>
                <h3 className="mt-2 text-xl font-medium tracking-[-.02em] text-balance">
                  <a href={post.href} className="outline-none after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4 focus-visible:underline">{post.title}</a>
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
