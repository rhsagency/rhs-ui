import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ArticleLayoutProps {
  category?: string;
  title: string;
  lede?: string;
  author?: { name: string; role?: string; avatar?: string };
  /** Formatted for the reader, plus the ISO value for the time element. */
  date?: { label: string; dateTime: string };
  readingTime?: string;
  /** A wide image under the header. */
  cover?: { src: string; alt: string; caption?: string };
  /** The body: paragraphs, h3 subheads, lists, quotes, figures. */
  children: ReactNode;
  className?: string;
}

/**
 * A reading layout for a post, a case study or a legal page: the header with
 * byline, an optional cover, and prose set at a comfortable measure. Styles
 * the plain elements you pass, so Markdown output works as is.
 */
export function ArticleLayout({ category, title, lede, author, date, readingTime, cover, children, className }: ArticleLayoutProps) {
  return (
    <article data-slot="article-layout" className={cn("py-16 sm:py-20", className)}>
      <header className="mx-auto max-w-2xl">
        {category ? <p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{category}</p> : null}
        <h2 className="mt-4 text-4xl font-medium leading-tight tracking-[-.045em] text-balance sm:text-5xl">{title}</h2>
        {lede ? <p className="mt-6 text-lg leading-relaxed text-pretty text-muted-foreground">{lede}</p> : null}
        {author || date ? (
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6 text-sm">
            {author?.avatar ? <img src={author.avatar} alt="" className="size-10 rounded-full object-cover" /> : null}
            <div>
              {author ? <p className="font-medium">{author.name}{author.role ? <span className="font-normal text-muted-foreground">, {author.role}</span> : null}</p> : null}
              <p className="text-muted-foreground">
                {date ? <time dateTime={date.dateTime}>{date.label}</time> : null}
                {date && readingTime ? " · " : null}
                {readingTime}
              </p>
            </div>
          </div>
        ) : null}
      </header>
      {cover ? (
        <figure className="mx-auto mt-12 max-w-4xl">
          <img src={cover.src} alt={cover.alt} className="aspect-[16/9] w-full rounded-2xl bg-muted object-cover" />
          {cover.caption ? <figcaption className="mt-3 text-center text-xs text-muted-foreground">{cover.caption}</figcaption> : null}
        </figure>
      ) : null}
      <div
        className={cn(
          "mx-auto mt-12 max-w-2xl text-base leading-[1.75] text-foreground/90",
          "[&_p]:mt-5 [&_h3]:mt-12 [&_h3]:text-xl [&_h3]:font-medium [&_h3]:tracking-[-.02em] [&_h3]:text-foreground",
          "[&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-foreground",
          "[&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-2",
          "[&_blockquote]:mt-8 [&_blockquote]:border-l-2 [&_blockquote]:border-foreground [&_blockquote]:pl-5 [&_blockquote]:text-lg [&_blockquote]:italic",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm",
          "[&_figure]:mt-8 [&_hr]:my-12 [&_hr]:border-border",
        )}
      >
        {children}
      </div>
    </article>
  );
}
