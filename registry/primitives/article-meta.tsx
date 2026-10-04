import { IconClock } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ArticleMetaProps {
  author: string;
  authorHref?: string;
  avatar?: string;
  /** Machine date for the time element. */
  date: string;
  /** The date as readers see it: "4 October 2026". */
  dateLabel: string;
  /** Minutes to read. */
  readingTime?: number;
  category?: string;
  categoryHref?: string;
  className?: string;
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

/**
 * The line under an article title: who wrote it, when, how long it takes
 * and where it is filed. One row on wide screens, wrapping cleanly on a
 * phone, with a real time element for the date.
 */
export function ArticleMeta({ author, authorHref, avatar, date, dateLabel, readingTime, category, categoryHref, className }: ArticleMetaProps) {
  const link = "rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40";
  return (
    <div data-slot="article-meta" className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground", className)}>
      <span className="flex items-center gap-2.5 text-foreground">
        {avatar ? (
          <img src={avatar} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{initials(author)}</span>
        )}
        {authorHref ? <a href={authorHref} className={cn("font-medium", link)}>{author}</a> : <span className="font-medium">{author}</span>}
      </span>
      <time dateTime={date}>{dateLabel}</time>
      {readingTime ? (
        <span className="inline-flex items-center gap-1.5"><IconClock aria-hidden="true" className="size-3.5" />{readingTime} min read</span>
      ) : null}
      {category ? (
        categoryHref ? <a href={categoryHref} className={cn("rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground", link)}>{category}</a> : <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground">{category}</span>
      ) : null}
    </div>
  );
}
