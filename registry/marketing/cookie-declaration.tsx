import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface CookieEntry {
  /** The cookie or key as the browser stores it: "_hly_id". */
  name: string;
  /** Who sets it: your own name for a first-party cookie, otherwise the third party's. */
  provider: string;
  /** What it is for, in a sentence a visitor can follow. */
  purpose: string;
  /** In words: "Session", "30 minutes", "1 year". */
  duration: string;
  /** What kind of storage it is: "HTTP", "Local storage", "Pixel". */
  type: string;
}

export interface CookieDeclarationCategory {
  /** "Necessary", "Preferences", "Analytics", "Marketing". */
  title: string;
  /** One line on what the category is for. */
  description?: string;
  /** Marks a category that cannot be switched off, with a badge that says so. */
  required?: boolean;
  /** An empty list is shown as "None" rather than dropped. */
  cookies: readonly CookieEntry[];
}

export interface CookieDeclarationLabels {
  /** Column head and label for the cookie's name. */
  name: string;
  /** Column head and label for who sets it. */
  provider: string;
  /** Column head and label for what it is for. */
  purpose: string;
  /** Column head and label for how long it lives. */
  duration: string;
  /** Column head and label for the kind of storage. */
  type: string;
  /** Said for a category without cookies. */
  none: string;
  /** The badge on a category that cannot be switched off. */
  required: string;
  /** The noun after a count of one. */
  cookie: string;
  /** The noun after any other count. */
  cookies: string;
  /** The accessible name of the consent slot. */
  consent: string;
  /** The words before the date. */
  updated: string;
}

export interface CookieDeclarationProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The categories in the order they appear. Keep the empty ones: they say None. */
  categories: readonly CookieDeclarationCategory[];
  /** The page's own heading, when the page has no other: "Cookie declaration". */
  title?: string;
  /** A short lead under the title: which site it covers and how the list was made. */
  caption?: ReactNode;
  /** When the list was last checked, as an ISO date: "2026-10-04". */
  updated?: string;
  /** The visitor's consent id and a "Change my choice" button, laid out in a row. Yours to fill: it needs your consent tool. */
  consent?: ReactNode;
  /** The level of the title. The category headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the column heads and labels, for a site that is not in English. */
  labels?: Partial<CookieDeclarationLabels>;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: CookieDeclarationLabels = {
  name: "Name",
  provider: "Provider",
  purpose: "Purpose",
  duration: "Duration",
  type: "Type",
  none: "None",
  required: "Always active",
  cookie: "cookie",
  cookies: "cookies",
  consent: "Your consent",
  updated: "Last updated",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/**
 * The full list of cookies and similar storage a site uses, by category: what
 * each one is called, who sets it, what it is for, how long it lives and what
 * kind it is. It is the document the cookie banner links to, so it is exact
 * before it is pretty: durations are written in words, an empty category says
 * None instead of vanishing, and on a phone every table turns into stacked
 * cards that keep all five labels. Pass the visitor's consent id and a Change
 * my choice button through the consent slot.
 */
export function CookieDeclaration({
  categories,
  title,
  caption,
  updated,
  consent,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: CookieDeclarationProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Category = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const word = (n: number) => (n === 1 ? labels.cookie : labels.cookies);

  return (
    <section data-slot="cookie-declaration" className={cn("w-full break-words", className)} {...props}>
      {title || caption || updated ? (
        <header className="max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {caption ? <div className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{caption}</div> : null}
          {updated ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
            </p>
          ) : null}
        </header>
      ) : null}

      {consent ? (
        <aside aria-label={labels.consent} className="mt-8 flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          {consent}
        </aside>
      ) : null}

      <div className={cn(title || caption || updated || consent ? "mt-12" : undefined)}>
        {categories.map((category) => {
          const count = category.cookies.length;
          return (
            <section key={category.title} className="border-t border-border py-9">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Category className="max-w-full min-w-0 text-xl leading-snug font-medium tracking-[-0.03em]">{category.title}</Category>
                {category.required ? <Badge variant="secondary">{labels.required}</Badge> : null}
                <p className="text-sm text-muted-foreground tabular-nums sm:ml-auto">
                  {count} {word(count)}
                </p>
              </div>
              {category.description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{category.description}</p> : null}

              {count === 0 ? (
                <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{labels.none}</p>
              ) : (
                <>
                  <div className="mt-6 hidden overflow-hidden rounded-xl border border-border md:block">
                    <Table className="table-fixed">
                      <TableCaption className="sr-only">
                        {category.title}, {count} {word(count)}
                      </TableCaption>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead scope="col" className="w-[18%] first:pl-4">
                            {labels.name}
                          </TableHead>
                          <TableHead scope="col" className="w-[16%]">
                            {labels.provider}
                          </TableHead>
                          <TableHead scope="col">{labels.purpose}</TableHead>
                          <TableHead scope="col" className="w-28">
                            {labels.duration}
                          </TableHead>
                          <TableHead scope="col" className="w-36 last:pr-4">
                            {labels.type}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.cookies.map((cookie) => (
                          <TableRow key={`${cookie.name}-${cookie.provider}`}>
                            <TableCell className="py-4 align-top font-medium break-words first:pl-4">{cookie.name}</TableCell>
                            <TableCell className="py-4 align-top">{cookie.provider}</TableCell>
                            <TableCell className="py-4 align-top leading-relaxed text-muted-foreground">{cookie.purpose}</TableCell>
                            <TableCell className="py-4 align-top tabular-nums">{cookie.duration}</TableCell>
                            <TableCell className="py-4 align-top last:pr-4">
                              <Badge variant="outline">{cookie.type}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <ul role="list" aria-label={`${category.title}, ${count} ${word(count)}`} className="mt-6 grid grid-cols-1 gap-3 md:hidden">
                    {category.cookies.map((cookie) => (
                      <li key={`${cookie.name}-${cookie.provider}`} className="rounded-xl border border-border p-4">
                        <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm">
                          <dt className="text-muted-foreground">{labels.name}</dt>
                          <dd className="font-medium break-words">{cookie.name}</dd>
                          <dt className="text-muted-foreground">{labels.provider}</dt>
                          <dd>{cookie.provider}</dd>
                          <dt className="text-muted-foreground">{labels.purpose}</dt>
                          <dd className="leading-relaxed">{cookie.purpose}</dd>
                          <dt className="text-muted-foreground">{labels.duration}</dt>
                          <dd className="tabular-nums">{cookie.duration}</dd>
                          <dt className="text-muted-foreground">{labels.type}</dt>
                          <dd>
                            <Badge variant="outline">{cookie.type}</Badge>
                          </dd>
                        </dl>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
