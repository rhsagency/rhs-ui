import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconCalendar, IconChevronDown, IconClock } from "@rhs-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@rhs-ui/primitives/breadcrumb";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";
import { OnThisPage, type TocItem } from "@rhs-ui/marketing/docs-page-layout/on-this-page";

export type { TocItem };

export interface DocsCrumb {
  label: string;
  /** Leave it out for a crumb that is only a label. The last crumb is the page itself and never links. */
  href?: string;
}

export interface DocsPageLayoutProps extends Omit<ComponentProps<"div">, "title"> {
  /** Your navigation, usually a SidebarNav. From lg up it sticks below the header and scrolls on its own; below that, put it in your own mobile menu. */
  sidebar?: ReactNode;
  /** The trail to this page. */
  breadcrumbs?: readonly DocsCrumb[];
  title: string;
  /** The title's element: "h1" (the default) because this is the page, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** One or two sentences under the title. */
  description?: string;
  /** When the page last changed: the words ("Updated 12 October 2026") and the ISO value for the time element. */
  updated?: { label: string; dateTime: string };
  /** "6 min read". */
  readingTime?: string;
  /** The headings of the article, for the on-this-page rail. Each `id` must match a heading in `children`. */
  toc?: readonly TocItem[];
  /** The rail's heading and accessible name. */
  tocTitle?: string;
  /** The article: plain h2, h3, p, ul, ol, pre, table and blockquote elements, which are styled for you, or Markdown output. */
  children: ReactNode;
  /** The end of the page: an edit link, a feedback question and a PagerNav. */
  footer?: ReactNode;
  /** Renders the breadcrumb links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
}

/**
 * Typography for the article, written as variants on the container so plain
 * elements need no classes: Markdown, MDX and hand-written JSX all land well.
 * Block spacing targets direct children, so a Callout or CodeBlock inside the
 * text keeps its own rhythm. The container is `relative` so the code scrollers
 * contain their own overflow. A plain `pre` that scrolls needs tabIndex={0}
 * for the keyboard to reach it; CodeBlock sets it for you.
 *
 * Ordinary docs content must never widen the page on a phone. Text breaks
 * anywhere it has to (a long URL or API key), a chip that wraps keeps its
 * border on every line, and a table wider than the screen scrolls on its own
 * (give it tabIndex={0} too) with its last column stretched, so a short table
 * still spans the width. Inside a table words break only as a last resort, and
 * the identifiers in the first column never do: a table scrolls, it does not
 * squeeze its code into broken chips.
 */
const PROSE = [
  "relative text-base leading-7 [overflow-wrap:anywhere] text-foreground/85 [&>pre]:overflow-x-auto max-sm:[&>table]:relative max-sm:[&>table]:block max-sm:[&>table]:max-w-full max-sm:[&>table]:overflow-x-auto",
  "[&_[id]]:scroll-mt-[calc(var(--sticky-top,4rem)_+_1.5rem)]",
  "[&>h2]:mt-14 [&>h2]:text-2xl [&>h2]:leading-tight [&>h2]:font-semibold [&>h2]:tracking-[-.03em] [&>h2]:text-foreground",
  "[&>h3]:mt-10 [&>h3]:text-lg [&>h3]:leading-snug [&>h3]:font-semibold [&>h3]:tracking-[-.02em] [&>h3]:text-foreground",
  "[&>h4]:mt-8 [&>h4]:font-semibold [&>h4]:text-foreground",
  "[&>p]:mt-5 [&>ul]:mt-5 [&>ol]:mt-5 [&>blockquote]:mt-6 [&>figure]:mt-6 [&>aside]:mt-6 [&>img]:mt-6 [&>hr]:my-10 [&>hr]:border-border",
  "[&_ul]:list-disc [&_ol]:list-decimal [&>ul]:pl-6 [&>ol]:pl-6 [&_li>ul]:mt-2 [&_li>ol]:mt-2 [&_li]:mt-2 [&_li]:pl-1.5 [&_li::marker]:text-muted-foreground",
  "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:decoration-foreground",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_code]:rounded-md [&_code]:border [&_code]:border-border [&_code]:bg-muted/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-foreground",
  "[&_code]:box-decoration-clone",
  "[&_kbd]:rounded-md [&_kbd]:border [&_kbd]:border-border [&_kbd]:bg-muted [&_kbd]:px-1.5 [&_kbd]:py-0.5 [&_kbd]:font-mono [&_kbd]:text-xs [&_kbd]:text-foreground",
  "[&>pre]:mt-6 [&>pre]:rounded-xl [&>pre]:border [&>pre]:border-border [&>pre]:bg-muted/40 [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-[0.8125rem] [&>pre]:leading-6 [&>pre]:text-foreground",
  "[&>pre]:outline-none [&>pre:focus-visible]:ring-[3px] [&>pre:focus-visible]:ring-ring/40",
  "[&>:first-child]:mt-0",
  "[&_pre_code]:border-0 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[inherit]",
  "[&>table]:mt-6 [&>table]:w-full [&>table]:border-collapse [&>table]:text-sm [&_table]:break-words [&_td:first-child_code]:whitespace-nowrap",
  "max-sm:[&>table]:outline-none max-sm:[&>table:focus-visible]:ring-[3px] max-sm:[&>table:focus-visible]:ring-ring/40 max-sm:[&>table_th:last-child]:w-full max-sm:[&>table_td:last-child]:w-full",
  "[&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-foreground [&_th:first-child]:pl-0",
  "[&_td]:border-b [&_td]:border-border [&_td]:px-3 [&_td]:py-3 [&_td]:align-top [&_td]:break-words [&_td]:text-muted-foreground [&_td:first-child]:pl-0",
  "[&>blockquote]:border-l-2 [&>blockquote]:border-foreground/60 [&>blockquote]:pl-5 [&>blockquote]:text-muted-foreground",
  "[&>img]:rounded-xl [&>img]:border [&>img]:border-border",
].join(" ");

/** The grid per combination of sidebar and rail, written out so Tailwind sees every class. */
const COLUMNS = {
  both: "lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]",
  sidebar: "lg:grid-cols-[15rem_minmax(0,1fr)]",
  rail: "xl:grid-cols-[minmax(0,1fr)_14rem]",
  none: "",
} as const;

/**
 * The whole documentation page in one frame: your navigation on the left
 * (sticky, scrolling on its own), the article in a readable measure in the
 * middle with breadcrumbs, title, description and a meta row, and on the
 * right an on-this-page rail that marks the section in view. Below xl the
 * rail becomes a plain "On this page" disclosure above the article, and
 * below lg the sidebar belongs in your own mobile menu. Headings clear a
 * sticky header: set `--sticky-top` (for example `className="[--sticky-top:4rem]"`)
 * to its height. Where ArticleLayout is a post and LegalLayout a single
 * contents list, this is the full docs frame; the `footer` slot takes the
 * page footer with an edit link and a pager.
 */
export function DocsPageLayout({
  sidebar,
  breadcrumbs = [],
  title,
  titleAs: Title = "h1",
  description,
  updated,
  readingTime,
  toc = [],
  tocTitle = "On this page",
  children,
  footer,
  linkAs: Link = "a",
  className,
  ...props
}: DocsPageLayoutProps) {
  const hasRail = toc.length > 0;
  const columns = sidebar ? (hasRail ? COLUMNS.both : COLUMNS.sidebar) : hasRail ? COLUMNS.rail : COLUMNS.none;
  return (
    <div data-slot="docs-page-layout" className={cn("grid gap-x-10", columns, className)} {...props}>
      {sidebar ? (
        <div data-slot="docs-page-layout-sidebar" className="hidden lg:block">
          <div className="sticky top-[var(--sticky-top,4rem)] -mx-1 h-[calc(100svh_-_var(--sticky-top,4rem))]">
            <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:block!">
              <div className="py-10 pr-3 pl-1">{sidebar}</div>
            </ScrollArea>
          </div>
        </div>
      ) : null}
      <div className="min-w-0 pt-8 pb-16 lg:pt-12 lg:pb-24">
        <article data-slot="docs-page-layout-article" className="mx-auto max-w-[46rem]">
          <header className="border-b border-border pb-8">
            {breadcrumbs.length ? (
              <Breadcrumb className="mb-5">
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => {
                    const last = index === breadcrumbs.length - 1;
                    return (
                      <Fragment key={`${crumb.label}-${index}`}>
                        <BreadcrumbItem>
                          {last ? (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          ) : crumb.href ? (
                            <BreadcrumbLink asChild>
                              <Link href={crumb.href}>{crumb.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <span>{crumb.label}</span>
                          )}
                        </BreadcrumbItem>
                        {last ? null : <BreadcrumbSeparator />}
                      </Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
            <Title className="text-4xl leading-[1.08] font-semibold tracking-[-.045em] text-balance sm:text-5xl">{title}</Title>
            {description ? <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
            {updated || readingTime ? (
              <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                {updated ? (
                  <span className="inline-flex items-center gap-1.5">
                    <IconCalendar size={16} />
                    <time dateTime={updated.dateTime}>{updated.label}</time>
                  </span>
                ) : null}
                {readingTime ? (
                  <span className="inline-flex items-center gap-1.5">
                    <IconClock size={16} />
                    {readingTime}
                  </span>
                ) : null}
              </p>
            ) : null}
          </header>
          {hasRail ? (
            <Collapsible className="mt-8 rounded-xl border border-border xl:hidden">
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {tocTitle}
                <IconChevronDown size={16} className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border px-4 py-3">
                  <OnThisPage items={toc} title={tocTitle} className="[&>p]:sr-only" />
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
          <div data-slot="docs-page-layout-prose" className={cn("mt-10", PROSE)}>
            {children}
          </div>
          {footer ? (
            <footer data-slot="docs-page-layout-footer" className="mt-16 border-t border-border pt-8">
              {footer}
            </footer>
          ) : null}
        </article>
      </div>
      {hasRail ? (
        <div data-slot="docs-page-layout-rail" className="hidden xl:block">
          <div className="sticky top-[calc(var(--sticky-top,4rem)_+_3rem)] mt-12 max-h-[calc(100svh_-_var(--sticky-top,4rem)_-_6rem)] overflow-y-auto">
            <OnThisPage items={toc} title={tocTitle} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
