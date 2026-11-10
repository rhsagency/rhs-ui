import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowLeft, IconArrowRight, IconArrowUpRight, IconEdit } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface DocsPageFooterContributor {
  /** Their name. It is the fallback initials of the avatar and an entry in the list a screen reader gets. */
  name: string;
  /** A picture of them, as an address or a data URI. Leave it out and the initials are drawn instead. */
  image?: string;
}

export interface DocsPageFooterLink {
  /** Where the page is. */
  href: string;
  /** The title of the page, as it is in your navigation. */
  title: string;
}

export interface DocsPageFooterLabels {
  /** The text of the edit link. */
  edit: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
  /** The name of the list of contributors that only a screen reader gets. */
  contributors: string;
  /** The count beside the avatars when there is one person. {count} is the number. */
  contributorOne: string;
  /** The count beside the avatars for any other number. {count} is the number. */
  contributorMany: string;
  /** The small line over the previous title. {noun} is the noun below. It stays on screen, so it is also what a screen reader hears. */
  previous: string;
  /** The small line over the next title. {noun} is the noun below. */
  next: string;
  /** The name of the navigation with the previous and next cards. */
  pager: string;
}

export interface DocsPageFooterProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Where the page can be edited, usually its file in your repository. It opens in a new tab and says so. */
  editHref?: string;
  /** When the page last changed: the words ("Last updated 12 March 2026", formatted on your side in the language and time zone of the page) and the same moment as a valid date string for the time element. */
  updated?: { label: string; dateTime: string };
  /** The people who wrote the page. A few avatars are drawn with the total beside them, and every name is in a list only a screen reader gets. */
  contributors?: readonly DocsPageFooterContributor[];
  /** A slot between the meta row and the cards for "Was this page helpful?" or a link to open an issue. */
  feedback?: ReactNode;
  /** The page before this one in the reading order. A missing side leaves its half empty, so the other card stays where people expect it. */
  previous?: DocsPageFooterLink;
  /** The page after this one. */
  next?: DocsPageFooterLink;
  /** What the pages are: "page", "guide", "lesson". It fills the direction words, "Previous guide". */
  noun?: string;
  /** Renders the previous and next links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DocsPageFooterLabels>;
}

const LABELS: DocsPageFooterLabels = {
  edit: "Edit this page",
  newTab: "opens in a new tab",
  contributors: "Contributors",
  contributorOne: "{count} contributor",
  contributorMany: "{count} contributors",
  previous: "Previous {noun}",
  next: "Next {noun}",
  pager: "Page navigation",
};

/** How many avatars are drawn: more than this would crowd the row, and the count beside them says the rest. */
const SHOWN = 4;

const card =
  "group/card flex flex-col gap-1.5 rounded-2xl border border-border p-5 outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
const direction = "flex items-center gap-1.5 text-xs text-muted-foreground";

/**
 * The same landing at the end of every documentation page: a meta row with
 * an edit link, when the page last changed and who wrote it, a slot for
 * feedback, and the previous and next pages as two cards that say where each
 * one goes. The direction words stay on screen ("Next guide" over the
 * title), so a screen reader hears them with the title and nobody has to
 * guess what an arrow means. Contributors are drawn as a short stack with the
 * total beside it and listed by name for assistive technology. No state of
 * its own, so it renders on the server.
 */
export function DocsPageFooter({
  editHref,
  updated,
  contributors = [],
  feedback,
  previous,
  next,
  noun = "page",
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: DocsPageFooterProps) {
  const words = { ...LABELS, ...custom };
  const fill = (text: string) => text.replace("{noun}", noun);
  const count = (contributors.length === 1 ? words.contributorOne : words.contributorMany).replace("{count}", String(contributors.length));
  const hasMeta = Boolean(editHref || updated || contributors.length);

  return (
    <footer data-slot="docs-page-footer" className={cn("grid gap-8 border-t border-border pt-8", className)} {...props}>
      {hasMeta ? (
        <div className="flex flex-col gap-4 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-8">
          {editHref ? (
            <a
              href={editHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group/edit -mx-1 inline-flex w-fit items-center gap-2 rounded-md px-1 py-0.5 font-medium text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <IconEdit aria-hidden="true" className="size-4 text-muted-foreground" />
              <span className="underline decoration-foreground/25 underline-offset-4 transition-colors duration-150 group-hover/edit:decoration-foreground motion-reduce:transition-none">{words.edit}</span>
              <IconArrowUpRight aria-hidden="true" className="-ml-0.5 size-3.5 text-muted-foreground" />
              <span className="sr-only"> ({words.newTab})</span>
            </a>
          ) : (
            <span aria-hidden="true" className="hidden sm:block" />
          )}

          {updated || contributors.length ? (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground">
              {updated ? (
                <p>
                  <time dateTime={updated.dateTime}>{updated.label}</time>
                </p>
              ) : null}
              {contributors.length ? (
                <div className="relative flex items-center gap-2.5">
                  {/* The names are in the list below, so the faces are decoration for a screen reader. */}
                  <AvatarGroup aria-hidden="true" className="-space-x-1">
                    {contributors.slice(0, SHOWN).map((person, index) => (
                      <Avatar key={`${person.name}-${index}`} size="sm" title={person.name}>
                        {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                        <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  <p className="tabular-nums">{count}</p>
                  <ul aria-label={words.contributors} className="sr-only">
                    {contributors.map((person, index) => (
                      <li key={`${person.name}-${index}`}>{person.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {feedback ? <div data-slot="docs-page-footer-feedback">{feedback}</div> : null}

      {previous || next ? (
        <nav aria-label={words.pager} className="grid gap-3 sm:grid-cols-2">
          {previous ? (
            <Link href={previous.href} rel="prev" className={card}>
              <span className={direction}>
                <IconArrowLeft aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/card:-translate-x-0.5 motion-reduce:transition-none" />
                {fill(words.previous)}
              </span>
              <span className="text-base font-medium tracking-[-0.01em] text-balance">{previous.title}</span>
            </Link>
          ) : (
            <span aria-hidden="true" className="hidden sm:block" />
          )}
          {next ? (
            <Link href={next.href} rel="next" className={cn(card, "sm:items-end sm:text-right")}>
              <span className={direction}>
                {fill(words.next)}
                <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/card:translate-x-0.5 motion-reduce:transition-none" />
              </span>
              <span className="text-base font-medium tracking-[-0.01em] text-balance">{next.title}</span>
            </Link>
          ) : null}
        </nav>
      ) : null}
    </footer>
  );
}
