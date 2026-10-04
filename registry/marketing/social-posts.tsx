import { cn } from "@/lib/utils";

export interface SocialPost {
  id: string;
  author: string;
  handle: string;
  /** Where it was posted, shown as text: "LinkedIn", "Instagram". */
  network: string;
  text: string;
  /** Machine date for the time element. */
  date: string;
  dateLabel: string;
  href?: string;
  avatar?: string;
}

export interface SocialPostsProps {
  title: string;
  description?: string;
  posts: readonly SocialPost[];
  className?: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * What people post about you, as cards in columns: the person, their
 * handle, the network as a word (no brand logos to licence), the text and
 * the date. A card with a link opens the original post.
 */
export function SocialPosts({ title, description, posts, className }: SocialPostsProps) {
  return (
    <section data-slot="social-posts" className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {posts.map((post) => {
          const body = (
            <>
              <span className="flex items-center gap-3">
                {post.avatar ? (
                  <img src={post.avatar} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium">{initials(post.author)}</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{post.author}</span>
                  <span className="block truncate text-xs text-muted-foreground">{post.handle}</span>
                </span>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">{post.network}</span>
              </span>
              <span className="mt-4 block text-sm leading-relaxed whitespace-pre-line">{post.text}</span>
              <time dateTime={post.date} className="mt-4 block text-xs text-muted-foreground">{post.dateLabel}</time>
            </>
          );
          return (
            <li key={post.id} className="mb-5 break-inside-avoid">
              {post.href ? (
                <a href={post.href} className="block rounded-2xl border border-border bg-card p-5 outline-none hover:border-foreground/30 focus-visible:ring-[3px] focus-visible:ring-ring/40">{body}</a>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
