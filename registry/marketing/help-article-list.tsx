import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconChevronRight, IconClock, IconFileText } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface HelpArticle {
  /** The article's title. */
  title: string;
  /** Where the article lives. */
  href: string;
  /** One line on what the article answers. */
  summary: string;
}

export interface HelpSection {
  /** The section's name. */
  title: string;
  /** The section's anchor, after the prefix. The title's slug by default. */
  id?: string;
  /** The articles of this section, in the order they appear. */
  articles: readonly HelpArticle[];
}

export interface HelpArticleLabels {
  /** The noun after a count of one: "1 article". */
  article: string;
  /** The noun after any other count: "13 articles". */
  articles: string;
  /** The word before the date of the last change. */
  updated: string;
}

export interface HelpArticleListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The collection: "Billing and payments". */
  title: string;
  /** One or two sentences on what the collection covers. */
  description?: string;
  /** The number of articles in the whole collection. Counted from the sections when left out. */
  count?: number;
  /** When the collection last changed, as an ISO date: "2026-10-14". */
  updated?: string;
  /** The articles of the collection, grouped. More than three sections adds a jump row. */
  sections: readonly HelpSection[];
  /** The content of the "Can't find it?" aside: a line about support and the way to it. */
  contact?: ReactNode;
  /** The aside's heading. */
  contactTitle?: string;
  /** The level of the collection title; sections and the aside sit one level below. */
  headingLevel?: 1 | 2 | 3;
  /** Prefix of the section anchors, so two lists on one page never share an id. */
  idPrefix?: string;
  /** The accessible name of the jump row, shown when there are more than three sections. */
  jumpLabel?: string;
  /** Renders the article links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the article counts and the date, for a site that is not in English. */
  labels?: Partial<HelpArticleLabels>;
  /** Locale for numbers and the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: HelpArticleLabels = { article: "article", articles: "articles", updated: "Updated" };

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * A help centre collection: its title, how many articles it holds and when it
 * last changed, then the articles grouped by section, each a whole row with
 * a title, a one-line summary and a chevron that moves on hover. With more
 * than three sections a jump row of anchors appears above the list. Rows
 * carry no dates on purpose, because help is judged on being right today, and
 * each is at least 56px tall so it is easy to hit with a thumb. The aside at
 * the end is yours: tell people how to reach a person. It sits beside its
 * heading once its column is 768px wide, whatever the screen, and your own
 * content can use container variants such as `@3xl:` for the same reason.
 */
export function HelpArticleList({
  title,
  description,
  count,
  updated,
  sections,
  contact,
  contactTitle = "Can't find it?",
  headingLevel = 2,
  idPrefix = "help",
  jumpLabel = "Jump to a section",
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: HelpArticleListProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${headingLevel + 1}` as "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);
  const total = count ?? sections.reduce((sum, section) => sum + section.articles.length, 0);
  const anchor = (section: HelpSection) => `${idPrefix}-${section.id ?? slug(section.title)}`;
  const word = (n: number) => (n === 1 ? labels.article : labels.articles);

  return (
    <section data-slot="help-article-list" className={cn("@container w-full break-words", className)} {...props}>
      <header className="max-w-2xl">
        <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <IconFileText className="size-4" />
            <span>
              <span className="tabular-nums">{numbers.format(total)}</span> {word(total)}
            </span>
          </span>
          {updated ? (
            <span className="inline-flex items-center gap-2">
              <IconClock className="size-4" />
              <span>
                {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
              </span>
            </span>
          ) : null}
        </p>
      </header>

      {sections.length > 3 ? (
        <nav aria-label={jumpLabel} className="mt-10">
          <ul role="list" className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <li key={section.title} className="max-w-full min-w-0">
                <a
                  href={`#${anchor(section)}`}
                  className={cn(
                    "inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-border px-3.5 py-1 text-sm transition-colors duration-150 hover:bg-muted motion-reduce:transition-none",
                    FOCUS,
                  )}
                >
                  <span className="min-w-0">{section.title}</span>
                  <span aria-hidden="true" className="text-muted-foreground tabular-nums">
                    {numbers.format(section.articles.length)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className={cn("grid grid-cols-1 gap-12", sections.length > 3 ? "mt-10" : "mt-12")}>
        {sections.map((section) => (
          <section key={section.title} id={anchor(section)} className="scroll-mt-24">
            <div className="mb-3 flex items-baseline justify-between gap-4">
              <Sub className="min-w-0 text-lg leading-snug font-medium tracking-[-0.02em]">{section.title}</Sub>
              <span className="text-sm whitespace-nowrap text-muted-foreground">
                <span className="tabular-nums">{numbers.format(section.articles.length)}</span> {word(section.articles.length)}
              </span>
            </div>
            <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {section.articles.map((article) => (
                <li key={`${article.href}-${article.title}`}>
                  <Link
                    href={article.href}
                    className={cn(
                      "group flex min-h-14 items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-inset motion-reduce:transition-none sm:px-5",
                      FOCUS,
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{article.title}</span>
                      <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{article.summary}</span>
                    </span>
                    <IconChevronRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-[translate,color] duration-150 group-hover:text-foreground motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {contact ? (
        <aside aria-labelledby={`${idPrefix}-contact`} className="mt-14 grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-6 @3xl:grid-cols-[14rem_minmax(0,1fr)] @3xl:items-center @3xl:gap-8 @3xl:p-8">
          <Sub id={`${idPrefix}-contact`} className="text-lg leading-snug font-medium tracking-[-0.02em]">
            {contactTitle}
          </Sub>
          <div className="text-sm leading-relaxed text-muted-foreground">{contact}</div>
        </aside>
      ) : null}
    </section>
  );
}
