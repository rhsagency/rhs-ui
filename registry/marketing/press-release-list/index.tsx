import { useId, type ComponentProps, type ElementType } from "react";

import { IconClock, IconDownload, IconMail, IconPhone } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";
import { CopyBoilerplate } from "@rhs-ui/marketing/press-release-list/copy-boilerplate";

export interface PressRelease {
  /** The headline as it was published. */
  title: string;
  /** The release's own page. */
  href: string;
  /** How the date reads in the row: "14 Oct". Leave it out and `dateTime` is formatted with `locale`. The year is already in the group's heading. */
  date?: string;
  /** The day it went out, as an ISO date: "2026-10-14". It decides the year group and the order, newest first. A moment with a time and an offset ("2026-10-14T09:00:00Z") is filed under the year it falls in `timeZone`. */
  dateTime: string;
  /** What kind of news it is: "Product", "Funding", "People". */
  tag?: string;
  /** The release as a PDF, when there is one. */
  pdfHref?: string;
  /** The PDF's size as people say it: "214 KB". Shown next to the file type. */
  pdfSize?: string;
}

export interface PressContact {
  /** Who journalists write to. */
  name: string;
  /** "Head of communications". */
  role?: string;
  /** Shown as a mailto: link. */
  email: string;
  /** Shown as a tel: link. */
  phone?: string;
  /** How fast they usually answer, as a sentence: "Usually replies within two hours, Monday to Friday." */
  responseTime?: string;
}

export interface PressReleaseLabels {
  /** The noun after a count of one: "1 release". */
  release: string;
  /** The noun after any other count. */
  releases: string;
  /** Read out before a PDF link: "Download the headline, PDF 214 KB". */
  download: string;
  /** The copy button at rest. */
  copy: string;
  /** The copy button right after it worked. */
  copied: string;
  /** What a screen reader hears after it worked. */
  copiedStatus: string;
  /** What everyone is told when the browser refuses. */
  copyFailed: string;
  /** The accessible name of the column of cards beside the list. */
  aside: string;
  /** Said when there are no releases. */
  empty: string;
}

export interface PressReleaseListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** Your announcements, in any order. They are grouped by the year of `dateTime`, newest first. */
  releases: readonly PressRelease[];
  /** The page's own heading, when the page has no other: "Press releases". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The paragraph journalists paste under a story: what the company is, in the words you want used. */
  boilerplate?: string;
  /** The boilerplate card's heading. */
  boilerplateTitle?: string;
  /** The person who answers the press. */
  contact?: PressContact;
  /** The contact card's heading. */
  contactTitle?: string;
  /** The level of the title. Year and card headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Renders the release links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PressReleaseLabels>;
  /** Locale for numbers and for dates that you did not write out yourself. */
  locale?: string;
  /** Time zone for a `dateTime` that carries a time, for the date in its row and for the year it is filed under; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: PressReleaseLabels = {
  release: "release",
  releases: "releases",
  download: "Download",
  copy: "Copy boilerplate",
  copied: "Copied",
  copiedStatus: "The boilerplate is copied to your clipboard.",
  copyFailed: "Could not copy. Select the text and copy it yourself.",
  aside: "Press information",
  empty: "No press releases yet.",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function dayOf(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** The year a release is filed under: the one written in a date, and for a moment in time the year it falls in `timeZone`, so the heading agrees with the date in the row. */
function yearOf(value: string, timeZone: string): string {
  const written = /^\d{4}/.exec(value)?.[0] ?? "";
  if (DATE_ONLY.test(value)) return written;
  const time = Date.parse(value);
  return Number.isNaN(time) ? written : new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone }).format(time);
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toUpperCase();

/** A badge that holds your words: it wraps, even a word too long for the column, instead of widening the page. */
const CHIP = "h-auto max-w-full py-0.5 text-left whitespace-normal [overflow-wrap:anywhere]";

const LINK =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * Your own announcements, set out the way journalists use them. Releases are
 * grouped by year, newest first, each row a dated headline that goes to the
 * release page with its tag, and a PDF link that says the file type and the
 * size. Beside the list on wide screens, two cards stay in view while the list
 * scrolls, as long as the screen is tall enough to show them whole: the company
 * boilerplate with a copy button that confirms in words, and the media contact
 * with the email, the phone and how fast they answer. Where PressQuotes shows
 * what others said about you, this is what you said. Below 1024px the cards
 * follow the list.
 */
export function PressReleaseList({
  releases,
  title,
  description,
  boilerplate,
  boilerplateTitle = "About the company",
  contact,
  contactTitle = "Media contact",
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: PressReleaseListProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);
  const hasHeader = Boolean(title || description);
  const hasAside = Boolean(boilerplate || contact);

  // Newest first: by the year a release is filed under, then by the moment itself, so mixed offsets order right and a year heading never comes twice. Text that is not a date falls back to the text.
  const sorted = releases
    .map((release) => ({ release, year: yearOf(release.dateTime, timeZone), at: Date.parse(release.dateTime) }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year < b.year ? 1 : -1;
      if (Number.isNaN(a.at) || Number.isNaN(b.at)) return a.release.dateTime < b.release.dateTime ? 1 : a.release.dateTime > b.release.dateTime ? -1 : 0;
      return b.at - a.at;
    });
  const groups: { year: string; releases: PressRelease[] }[] = [];
  for (const { release, year } of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.year === year) last.releases.push(release);
    else groups.push({ year, releases: [release] });
  }

  const phoneHref = (value: string) => `tel:${value.replace(/[^\d+]/g, "")}`;

  return (
    <section data-slot="press-release-list" className={cn("w-full break-words", className)} {...props}>
      {hasHeader ? (
        <header className="mb-10 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      <div className={cn("grid grid-cols-1 gap-12", hasAside && "lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-16")}>
        <div className="grid min-w-0 grid-cols-1 content-start gap-12">
          {groups.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">{labels.empty}</p> : null}
          {groups.map((group) => (
            <div key={group.year || "undated"}>
              {group.year ? (
                <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
                  <Sub id={`${id}-${group.year}`} className="text-xl font-semibold tracking-[-0.025em] tabular-nums">
                    {group.year}
                  </Sub>
                  <p className="text-sm text-muted-foreground">
                    <span className="tabular-nums">{numbers.format(group.releases.length)}</span> {group.releases.length === 1 ? labels.release : labels.releases}
                  </p>
                </div>
              ) : null}
              <ul role="list" aria-labelledby={group.year ? `${id}-${group.year}` : undefined} className="divide-y divide-border">
                {group.releases.map((release) => (
                  <li
                    key={`${release.dateTime}-${release.title}`}
                    className="group relative isolate flex flex-col gap-3 py-5 before:absolute before:-inset-x-3 before:inset-y-0 before:-z-10 before:rounded-lg before:bg-muted/0 before:transition-colors before:duration-150 hover:before:bg-muted/50 motion-reduce:before:transition-none sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:gap-y-0"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-col sm:items-start sm:gap-2">
                      <time dateTime={release.dateTime} className="text-sm leading-6 text-muted-foreground tabular-nums">
                        {release.date ?? dayOf(release.dateTime, locale, timeZone)}
                      </time>
                      {release.tag ? <Badge variant="outline" className={CHIP}>
                          {release.tag}
                        </Badge> : null}
                    </div>
                    <p className="min-w-0 text-base leading-6 font-medium tracking-[-0.01em] text-pretty">
                      <Link
                        href={release.href}
                        className="rounded-sm decoration-foreground/40 underline-offset-4 outline-none after:absolute after:-inset-x-3 after:inset-y-0 group-hover:underline focus-visible:after:rounded-lg focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                      >
                        {release.title}
                      </Link>
                    </p>
                    {release.pdfHref ? (
                      <Button asChild variant="outline" size="sm" className="relative z-10 self-start sm:self-center">
                        <a href={release.pdfHref} download>
                          <IconDownload aria-hidden="true" />
                          <span className="sr-only">
                            {labels.download} {release.title},{" "}
                          </span>
                          PDF
                          {release.pdfSize ? <span className="font-normal text-muted-foreground tabular-nums">{release.pdfSize}</span> : null}
                        </a>
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Held in view only on a screen tall enough to show both cards whole: a sticky box taller than the screen cannot scroll inside itself, so its bottom would stay out of reach. */}
        {hasAside ? (
          <aside aria-label={labels.aside} className="grid min-w-0 grid-cols-1 content-start gap-4 lg:top-[var(--sticky-top,6rem)] lg:self-start [@media(min-height:46rem)]:lg:sticky">
            {boilerplate ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <Sub className="text-base leading-snug font-medium tracking-[-0.01em]">
                  {boilerplateTitle}
                </Sub>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{boilerplate}</p>
                <CopyBoilerplate
                  className="mt-4"
                  text={boilerplate}
                  label={labels.copy}
                  copiedLabel={labels.copied}
                  copiedStatus={labels.copiedStatus}
                  failedStatus={labels.copyFailed}
                />
              </div>
            ) : null}

            {contact ? (
              <div className="rounded-xl border border-border bg-card p-5">
                <Sub className="text-base leading-snug font-medium tracking-[-0.01em]">
                  {contactTitle}
                </Sub>
                <div className="mt-4 flex items-center gap-3">
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-medium">
                    {initialsOf(contact.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug font-medium">{contact.name}</p>
                    {contact.role ? <p className="text-sm leading-snug text-muted-foreground">{contact.role}</p> : null}
                  </div>
                </div>
                <ul role="list" className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm">
                  <li className="flex items-start gap-3">
                    <IconMail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <a href={`mailto:${contact.email}`} className={cn("min-w-0 [overflow-wrap:anywhere]", LINK)}>
                      {contact.email}
                    </a>
                  </li>
                  {contact.phone ? (
                    <li className="flex items-start gap-3">
                      <IconPhone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <a href={phoneHref(contact.phone)} className={cn("tabular-nums", LINK)}>
                        {contact.phone}
                      </a>
                    </li>
                  ) : null}
                  {contact.responseTime ? (
                    <li className="flex items-start gap-3">
                      <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 leading-snug text-muted-foreground">{contact.responseTime}</span>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
