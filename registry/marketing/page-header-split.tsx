import type { ComponentProps, ReactNode } from "react";

import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface PageHeaderSplitFact {
  /** What the fact is about: "Founded", "Team", "Based in". It is set on one line, so keep it to a word or two. */
  label: string;
  /** The fact itself: "2011", "24 people", "Rotterdam". */
  value: ReactNode;
}

/**
 * The facts are sized by the column they sit in, not by the window: four share a row once their column is wide enough for the longest
 * value to stay on one line, and until then they keep two to a row, so the last one is never left alone under the others. Three need less
 * room than four. The sm class cancels the three-column default of DescriptionList, which looks at the window. Every class is written
 * out, because Tailwind only generates what it can read.
 */
const FACT_COLUMNS = {
  1: "grid-cols-1 sm:grid-cols-1",
  2: "grid-cols-2 sm:grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-2 @sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 @md:grid-cols-4",
} as const;

export interface PageHeaderSplitProps extends Omit<ComponentProps<"header">, "title"> {
  /** A short line over the title: the section, the category, "Our studio". */
  eyebrow?: string;
  /** The title of the page, set very large and tight. */
  title: string;
  /** The title's element: "h1" (the default) because this header opens an inner page, "h2" inside a preview or under another heading. */
  titleAs?: "h1" | "h2";
  /** Two or three sentences in the right column: what the page is about, in plain words. */
  lede?: ReactNode;
  /** Up to four labelled facts under the lede, as a description list. More than four are left out. */
  facts?: readonly PageHeaderSplitFact[];
  /** The one thing to do next: a Button, or a link styled as one. */
  action?: ReactNode;
  /** A slot under the closing hairline, full width: tabs, a filter row, a search field. */
  children?: ReactNode;
}

/**
 * The opening of an inner page that deserves more presence than a muted
 * band: the title set very large and tight on the left as the page's h1, and
 * on the right the lede, up to four facts as a description list (founded,
 * team size, based in) and one action. Below lg it stacks, title first. The
 * facts follow the width of their column, not of the window: they share one
 * row when it is wide enough for every value to stay on one line, and keep
 * two to a row when it is not. Fact labels are set on one line and never
 * wrap, a hairline closes the header, and a slot under it takes tabs or a
 * filter row. For about, services and category pages. No state of its own,
 * so it renders on the server.
 */
export function PageHeaderSplit({ eyebrow, title, titleAs: Title = "h1", lede, facts = [], action, children, className, ...props }: PageHeaderSplitProps) {
  const shown = facts.slice(0, 4);

  return (
    <header data-slot="page-header-split" className={cn("w-full", className)} {...props}>
      <div className="grid gap-10 border-b border-border pt-12 pb-10 sm:pt-16 sm:pb-14 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-16 lg:pt-20 lg:pb-16">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-5 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
          <Title className="text-[clamp(2.75rem,7.2vw,5.25rem)] leading-[0.97] font-medium tracking-[-0.05em] text-balance">{title}</Title>
        </div>

        {lede || shown.length || action ? (
          <div className="@container grid min-w-0 gap-8">
            {lede ? <div className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground sm:text-xl sm:leading-relaxed">{lede}</div> : null}
            {shown.length ? (
              <DescriptionList
                layout="grid"
                items={shown.map((fact) => ({ term: fact.label, value: fact.value }))}
                className={cn("gap-x-5 gap-y-6 border-t border-border pt-6 [&_dd]:text-xl [&_dd]:tracking-[-0.03em] [&_dd]:tabular-nums [&_dd]:break-words [&_dt]:text-[0.8125rem] [&_dt]:whitespace-nowrap", FACT_COLUMNS[shown.length as keyof typeof FACT_COLUMNS])}
              />
            ) : null}
            {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
          </div>
        ) : null}
      </div>
      {children ? <div data-slot="page-header-split-slot">{children}</div> : null}
    </header>
  );
}
