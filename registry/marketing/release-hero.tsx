import type { ComponentProps } from "react";

import { IconArrowRight, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ReleaseHighlight {
  /** What changed, in a few words. */
  title: string;
  /** One line on what changes for the reader. */
  description: string;
}

export interface ReleaseHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The product, set small above the version and read with it: "Kestrel". */
  product?: string;
  /** The version as shown: "v4.2". It is the picture, so keep it short. */
  version: string;
  /** When it shipped, as an ISO date: "2026-10-20". */
  releasedAt: string;
  /** The tag beside the date. */
  channel?: "new" | "lts" | "beta";
  /** Three highlights, each a title and one line. */
  highlights: readonly ReleaseHighlight[];
  /** Where the release notes live. */
  notesHref: string;
  /** Where the upgrade steps live. */
  upgradeHref: string;
  /** Defaults to "Read the notes". */
  notesLabel?: string;
  /** Defaults to "Upgrade". */
  upgradeLabel?: string;
  /** When set, a plain "Breaking changes" line with a link sits above the actions. */
  breaking?: { summary: string; href: string; linkLabel?: string };
  /** The highlights list's accessible name. */
  highlightsLabel?: string;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for the date; UTC by default so server and browser agree. */
  timeZone?: string;
}

/**
 * The numeral is sized from its own length, so "v4.2" and "v12.10.3" take the
 * same width: about 31rem on a wide screen, and two thirds of the viewport
 * below that, so it steps down with a clamp on a phone instead of overflowing.
 */
function numeralSize(version: string): string {
  const dots = (version.match(/\./g) ?? []).length;
  const em = (version.length - dots) * 0.58 + dots * 0.25 - version.length * 0.03;
  return `clamp(3rem, ${(66 / em).toFixed(2)}vw, ${(31 / em).toFixed(2)}rem)`;
}

/**
 * Announces a version: the number set huge as the picture, its date and
 * channel beside it, three highlights as a numbered list, and the notes and
 * upgrade actions, with an optional plain line for breaking changes. The
 * hierarchy comes from scale alone, so it needs no image. For frameworks,
 * SDKs and apps that ship a release worth a page of its own.
 */
export function ReleaseHero({
  titleAs: Title = "h2",
  product,
  version,
  releasedAt,
  channel,
  highlights,
  notesHref,
  upgradeHref,
  notesLabel = "Read the notes",
  upgradeLabel = "Upgrade",
  breaking,
  highlightsLabel = "Highlights",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: ReleaseHeroProps) {
  const date = new Date(releasedAt);
  const dateText = Number.isNaN(date.getTime()) ? releasedAt : new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone }).format(date);
  return (
    <section data-slot="release-hero" className={cn("grid grid-cols-1 gap-14 py-16 sm:py-20 lg:grid-cols-3 lg:gap-16", className)} {...props}>
      <div className="flex min-w-0 flex-col gap-10 lg:col-span-2">
        {product ? (
          <p aria-hidden="true" className="text-lg font-medium tracking-[-0.01em] text-muted-foreground sm:text-xl">
            {product}
          </p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-x-10 gap-y-5 [align-items:last_baseline]">
          <Title className="min-w-0 leading-[.8] font-medium tracking-[-0.03em] tabular-nums" style={{ fontSize: numeralSize(version) }}>
            {product ? <span className="sr-only">{product} </span> : null}
            {version}
          </Title>
          <p className="flex flex-col items-start gap-2">
            {channel ? (
              <Badge variant={channel === "new" ? "default" : channel === "lts" ? "outline" : "secondary"}>
                {channel === "lts" ? (
                  <abbr title="Long-term support" className="no-underline">
                    LTS
                  </abbr>
                ) : channel === "new" ? (
                  "New"
                ) : (
                  "Beta"
                )}
              </Badge>
            ) : null}
            <span className="text-sm text-muted-foreground">Released</span>
            <time dateTime={releasedAt} className="text-xl leading-none font-medium tracking-[-0.02em]">
              {dateText}
            </time>
          </p>
        </div>
      </div>
      <div className="min-w-0">
        <ol role="list" aria-label={highlightsLabel} className="divide-y divide-border border-y border-border">
          {highlights.map((highlight, index) => (
            <li key={highlight.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-4">
              <span aria-hidden="true" className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium tracking-[-0.01em]">{highlight.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{highlight.description}</p>
              </div>
            </li>
          ))}
        </ol>
        {breaking ? (
          <p className="mt-6 flex items-start gap-2.5 text-sm leading-relaxed">
            <IconWarning className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong className="font-medium">Breaking changes.</strong> <span className="text-muted-foreground">{breaking.summary}</span>{" "}
              <a href={breaking.href} className="font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {breaking.linkLabel ?? "See what to change"}
              </a>
            </span>
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3 lg:flex-col lg:items-stretch xl:flex-row xl:items-start">
          <Button asChild size="lg">
            <a href={upgradeHref}>
              {upgradeLabel}
              <IconArrowRight />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={notesHref}>{notesLabel}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
