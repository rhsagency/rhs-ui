import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Card, CardContent, CardHeader } from "@rhs-ui/primitives/card";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface PrivacyCategory {
  /** The kind of data: "Account", "Payments", "Usage", "Support". */
  title: string;
  /** A small icon for the card, from @rhs-ui/icons. */
  icon?: ReactNode;
  /** What is collected: "Your name, email address and a hash of your password." */
  what: ReactNode;
  /** Why it is collected: "To sign you in and keep your account safe." */
  why: ReactNode;
  /** How long it is kept, as a sentence: "While your account is open, and 30 days after." */
  retention: ReactNode;
  /** Who receives it: "Nobody outside Northwind." */
  sharedWith: ReactNode;
}

export interface PrivacyRight {
  /** "See your data", "Correct it", "Delete it". */
  label: string;
  /** Where the right is used: a settings page, a form, an email. */
  href: string;
  /** One line on how it works and how fast. */
  description: string;
  /** A small icon for the tile. */
  icon?: ReactNode;
}

export interface PrivacyLabels {
  /** The label of the line about what is collected. */
  what: string;
  /** The label of the line about why. */
  why: string;
  /** The label of the line about how long it is kept. */
  retention: string;
  /** The label of the line about who receives it. */
  sharedWith: string;
  /** Heading of the rights row. */
  rights: string;
  /** One line under that heading. */
  rightsIntro: string;
  /** The sentence that says this is a summary. */
  summaryNote: string;
  /** The text of the link to the full policy. */
  policy: string;
  /** The words before the date. */
  updated: string;
}

export interface PrivacyAtAGlanceProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** One card per kind of data. */
  categories: readonly PrivacyCategory[];
  /** The rights the reader has, each linking to the way to use it. */
  rights: readonly PrivacyRight[];
  /** The full privacy policy. This summary always points to it and never replaces it. */
  policyHref: string;
  /** When the summary was last checked, as an ISO date: "2026-09-03". */
  updated?: string;
  /** The page's own heading, when the page has no other: "Privacy at a glance". */
  title?: string;
  /** A line under the title: what the reader will find here. */
  description?: string;
  /** The level of the title. The card and rights headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the card lines and the footer, for a site that is not in English. */
  labels?: Partial<PrivacyLabels>;
  /** Renders the rights and the policy link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: PrivacyLabels = {
  what: "What",
  why: "Why",
  retention: "Kept for",
  sharedWith: "Shared with",
  rights: "Your rights",
  rightsIntro: "Each one is a link to where you can use it.",
  summaryNote: "This is a summary. It does not replace the full privacy policy.",
  policy: "Read the full privacy policy",
  updated: "Last updated",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/** Three cards, five and any multiple of three sit better three across on a wide screen than as a pair with one left over. */
const threeAcross = (count: number) => count === 5 || (count >= 3 && count % 3 === 0);

/**
 * Columns for the rights, chosen from how many there are so that no row ends
 * on a tile of its own. Each step is a width of the block's own column, not of
 * the screen, so a narrow column gets fewer and wider tiles. In the two-column
 * step an odd last tile spans both columns. A count that is not listed fills
 * each row as the space allows.
 */
const RIGHTS_GRID: Record<number, string> = {
  2: "@sm:grid-cols-2",
  3: "@sm:grid-cols-2 @xl:grid-cols-3 @sm:@max-xl:[&>li:last-child]:col-span-2",
  4: "@sm:grid-cols-2 @3xl:grid-cols-4",
  5: "@sm:grid-cols-2 @xl:grid-cols-3 @[58rem]:grid-cols-5 @sm:@max-xl:[&>li:last-child]:col-span-2",
  6: "@sm:grid-cols-2 @xl:grid-cols-3",
  7: "@sm:grid-cols-2 @3xl:grid-cols-4 @sm:@max-3xl:[&>li:last-child]:col-span-2",
  8: "@sm:grid-cols-2 @3xl:grid-cols-4",
  9: "@sm:grid-cols-2 @xl:grid-cols-3 @sm:@max-xl:[&>li:last-child]:col-span-2",
  10: "@sm:grid-cols-2 @3xl:grid-cols-4 @[58rem]:grid-cols-5",
};

/**
 * Your data practices on one screen, above the full policy: a card for each
 * kind of data (account, payments, usage, support) with the same four lines,
 * what is collected, why, how long it is kept and who receives it, and under
 * them the reader's rights, each a link to the way to use it. Every card is a
 * real description list, so assistive technology reads each label together
 * with its value. It summarises the policy and never replaces it.
 */
export function PrivacyAtAGlance({
  categories,
  rights,
  policyHref,
  updated,
  title,
  description,
  headingLevel = 2,
  labels: custom,
  linkAs: Link = "a",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: PrivacyAtAGlanceProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const hasHeader = Boolean(title || description);

  return (
    <section data-slot="privacy-at-a-glance" className={cn("@container w-full break-words", className)} {...props}>
      {hasHeader ? (
        <header className="max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      {categories.length ? (
        <ul
          role="list"
          className={cn(
            "grid grid-cols-1 gap-4",
            // An odd last card spans the pair, so a tablet never shows one card alone on a row; three across it fits without.
            threeAcross(categories.length)
              ? "sm:grid-cols-2 lg:grid-cols-3 sm:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2"
              : "sm:grid-cols-2 sm:[&>li:last-child:nth-child(odd)]:col-span-2",
            hasHeader && "mt-10",
          )}
        >
          {categories.map((category) => (
            <li key={category.title} className="flex min-w-0">
              <Card className="w-full gap-5 py-5 sm:py-6">
                <CardHeader className="grid-cols-1 px-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    {category.icon ? <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-[1.125rem]">{category.icon}</span> : null}
                    <Sub className="min-w-0 text-lg leading-snug font-medium tracking-[-0.02em]">{category.title}</Sub>
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-6">
                  <DescriptionList
                    layout="stacked"
                    className="gap-5 [overflow-wrap:anywhere] [&_dd]:leading-relaxed [&_dd]:font-normal [&_dt]:text-xs [&_dt]:font-medium [&_dt]:tracking-[.12em] [&_dt]:uppercase"
                    items={[
                      { term: labels.what, value: category.what },
                      { term: labels.why, value: category.why },
                      { term: labels.retention, value: category.retention },
                      { term: labels.sharedWith, value: category.sharedWith },
                    ]}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      {rights.length ? (
        <div className="mt-14">
          <Sub className="text-xl leading-snug font-medium tracking-[-0.03em]">{labels.rights}</Sub>
          <p className="mt-2 text-sm text-muted-foreground">{labels.rightsIntro}</p>
          <ul role="list" className={cn("mt-6 grid grid-cols-1 gap-3", RIGHTS_GRID[rights.length] ?? "grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]")}>
            {rights.map((right) => (
              <li key={`${right.label}-${right.href}`} className="min-w-0">
                <Link
                  href={right.href}
                  className={cn(
                    "group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:bg-muted/50 motion-reduce:transition-none",
                    FOCUS,
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                      {right.icon ? <span className="text-muted-foreground [&_svg]:size-4">{right.icon}</span> : null}
                      <span className="min-w-0">{right.label}</span>
                    </span>
                    <IconArrowRight
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-[translate,color] duration-150 group-hover:text-foreground motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{right.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <footer className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-muted-foreground">
          {labels.summaryNote}{" "}
          <Link href={policyHref} className={cn("rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none", FOCUS)}>
            {labels.policy}
          </Link>
        </p>
        {updated ? (
          <p className="whitespace-nowrap text-muted-foreground">
            {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
          </p>
        ) : null}
      </footer>
    </section>
  );
}
