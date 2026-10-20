import type { ComponentProps, ReactNode } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconCircleDot, IconFolder, IconGitBranch, IconStar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface OpenSourceLanguage {
  /** The language as written in the legend: "TypeScript". */
  name: string;
  /** Share of the code in percent, 0 to 100. */
  share: number;
}

export interface OpenSourceContributor {
  /** The person's name; it labels the avatar and gives the initials. */
  name: string;
  /** Avatar image. The initials show until it loads, or when it is left out. */
  src?: string;
}

export interface OpenSourceRepo {
  /** Stars, shown in compact notation: 18402 reads "18.4K". */
  stars: number;
  /** Forks, shown in compact notation. */
  forks: number;
  /** Open issues. */
  issues: number;
  /** The latest release tag: "v2.4.0". */
  release: string;
  /** When that release shipped, as an ISO date: "2026-10-12". */
  releasedAt: string;
  /** The licence as a short identifier: "MIT", "Apache-2.0". */
  license: string;
  /** Languages by share of the code, largest first. Five show; any more are folded into "Other". */
  languages: readonly OpenSourceLanguage[];
  /** The total, and the faces to stack (the first five are drawn). */
  contributors: { total: number; people: readonly OpenSourceContributor[] };
}

export interface OpenSourceHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The project name, set large. */
  name: string;
  /** One line on what it does. */
  description: string;
  /** The install command, copied as written: "npm install halcyon". */
  install: string;
  /** Two actions: the way in, and a link to the source named in words. */
  actions?: ReactNode;
  /** The numbers on the card. Pass real ones from your forge's API at build time. */
  repo: OpenSourceRepo;
  /** The card's accessible name. */
  factsLabel?: string;
  /** Locale for numbers, percentages and the date. */
  locale?: string;
  /** Time zone for the release date; UTC by default so server and browser agree. */
  timeZone?: string;
}

/* Tones for the language bar: one ink at falling strength, so the bar stays monochrome and the legend carries the names. */
const TONES = ["bg-foreground", "bg-foreground/70", "bg-foreground/50", "bg-foreground/35", "bg-foreground/22"] as const;
const toneOf = (index: number) => TONES[Math.min(index, TONES.length - 1)];

function Row({ term, align = "center", children }: { term: string; align?: "center" | "start"; children: ReactNode }) {
  return (
    <div
      className={cn(
        "col-span-3 flex flex-col gap-2 border-b border-border px-4 py-3.5 last:border-b-0 sm:grid sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-4 sm:px-6",
        align === "center" ? "sm:items-center" : "sm:items-start",
      )}
    >
      <dt className={cn("text-sm text-muted-foreground", align === "start" && "sm:pt-px")}>{term}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  );
}

/**
 * The opening for an open-source project: its name, one line, an install
 * command to copy and two actions on the left, and on the right a card of the
 * project's own activity (stars, forks, open issues, the latest release,
 * licence, languages and contributors) instead of a stock illustration. The
 * card is one labelled region and one description list; the language bar is
 * decoration and its legend carries the data.
 */
export function OpenSourceHero({
  titleAs: Title = "h2",
  name,
  description,
  install,
  actions,
  repo,
  factsLabel = "Repository facts",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: OpenSourceHeroProps) {
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const whole = new Intl.NumberFormat(locale);
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const released = new Date(repo.releasedAt);
  const releasedText = Number.isNaN(released.getTime()) ? repo.releasedAt : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(released);
  const languages = repo.languages.length > 5 ? [...repo.languages.slice(0, 4), { name: "Other", share: repo.languages.slice(4).reduce((sum, language) => sum + language.share, 0) }] : repo.languages;
  const { total, people } = repo.contributors;
  const stats = [
    { term: "Stars", value: repo.stars, icon: <IconStar /> },
    { term: "Forks", value: repo.forks, icon: <IconGitBranch /> },
    { term: "Open issues", value: repo.issues, icon: <IconCircleDot /> },
  ];

  return (
    <section data-slot="open-source-hero" className={cn("grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16", className)} {...props}>
      <div className="min-w-0">
        <Title className="text-5xl leading-none font-medium tracking-[-0.045em] sm:text-6xl lg:text-7xl">{name}</Title>
        <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p>
        {/* CopyField scrolls a long value sideways, which hides the end of the command on a phone. Here the command wraps instead, so all of it stays readable at any width. */}
        <CopyField value={install} label="Copy install command" className="mt-8 max-w-md [&_code]:whitespace-normal [&_code]:[overflow-wrap:anywhere]" />
        {actions ? <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      <section aria-label={factsLabel} data-slot="open-source-hero-card" className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        <p aria-hidden="true" className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm font-medium sm:px-6">
          <IconFolder className="size-4 text-muted-foreground" />
          {factsLabel}
        </p>
        <dl className="grid grid-cols-3">
          {stats.map((stat, index) => (
            <div key={stat.term} className={cn("flex flex-col justify-between gap-1.5 border-b border-border px-4 py-4 sm:px-6", index < 2 && "border-r")}>
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground [&>svg]:hidden sm:[&>svg]:block sm:[&>svg]:size-4">
                {stat.icon}
                {stat.term}
              </dt>
              <dd title={whole.format(stat.value)} className="text-2xl font-medium tracking-[-0.03em] tabular-nums sm:text-3xl">
                {compact.format(stat.value)}
              </dd>
            </div>
          ))}
          <Row term="Latest release">
            <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="font-mono text-[0.8125rem] font-medium">{repo.release}</span>
              <time dateTime={repo.releasedAt} className="text-muted-foreground">
                {releasedText}
              </time>
            </span>
          </Row>
          <Row term="Licence">
            <Badge variant="outline">{repo.license}</Badge>
          </Row>
          {languages.length ? (
            <Row term="Languages" align="start">
              <div aria-hidden="true" className="mt-1.5 flex h-2 gap-0.5 overflow-hidden rounded-full sm:mt-[0.3125rem]">
                {languages.map((language, index) => (
                  <span key={language.name} className={cn("min-w-1 rounded-full", toneOf(index))} style={{ flexGrow: Math.max(language.share, 0.4), flexBasis: 0 }} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {languages.map((language, index) => (
                  <li key={language.name} className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className={cn("size-2 rounded-full", toneOf(index))} />
                    {language.name}
                    <span className="text-muted-foreground tabular-nums">{percent.format(language.share / 100)}</span>
                  </li>
                ))}
              </ul>
            </Row>
          ) : null}
          <Row term="Contributors">
            <span className="flex items-center gap-3">
              <AvatarGroup role="group" aria-label="Top contributors" className="*:data-[slot=avatar]:ring-card">
                {people.slice(0, 5).map((person) => (
                  <Avatar key={person.name} size="sm" title={person.name}>
                    {person.src ? <AvatarImage src={person.src} alt={person.name} /> : null}
                    <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
              <span className="tabular-nums">
                {whole.format(total)} {total === 1 ? "contributor" : "contributors"}
              </span>
            </span>
          </Row>
        </dl>
      </section>
    </section>
  );
}
