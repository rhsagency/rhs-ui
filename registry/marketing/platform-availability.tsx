import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClock, IconFlask, IconInfo } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

/** available: it can be installed or opened today. beta: it can, and it is still being tested. soon: it cannot yet. */
export type PlatformStatus = "available" | "beta" | "soon";

export interface Platform {
  /** A stable id for the platform. It keys the tile, so it must be unique. */
  id: string;
  /** The platform's name: "iOS", "Android", "Web". */
  label: string;
  /** A glyph from @rhs-ui/icons, drawn at 20px in a small tile. It is decoration: the name says it all. The first letter of the name stands in when there is none. */
  icon?: ReactNode;
  /** Said in words on the tile, and drawn with a shape of its own, so it never depends on colour. */
  status: PlatformStatus;
  /** The current version, as people say it: "4.2.0". Leave it out for a platform that is always current, such as the web. */
  version?: string;
  /** The day that version shipped, as an ISO date: "2026-10-14". It is written in the `locale` and `timeZone` you pass. */
  releasedAt?: string;
  /** Where to get it. On a coming-soon platform it is a plain link to a waiting list instead, if you have one. */
  href?: string;
  /** The link's text: "Open the app", "App Store", "Download". A screen reader also hears the platform's name. */
  linkLabel?: string;
  /** One line more: "Requires iOS 17 or later". */
  note?: string;
}

export interface PlatformAvailabilityLabels {
  /** The word for an available platform. */
  available: string;
  /** The word for a platform in beta. */
  beta: string;
  /** The word for a platform that is on its way. */
  soon: string;
  /** The label before the version number. */
  version: string;
  /** The label before the release date. */
  released: string;
  /** The link's text on an available or beta platform that gives no linkLabel. */
  get: string;
  /** The link's text on a coming-soon platform that has an href and no linkLabel. */
  tellMe: string;
}

export interface PlatformAvailabilityProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Get the app". */
  eyebrow?: string;
  /** The heading: "Where Halcyon runs". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** One tile per platform, in the order you want them. The tiles are a list, so a screen reader hears how many there are. */
  platforms: readonly Platform[];
  /** A line under the tiles: how long old versions keep working, what the dates mean. */
  footnote?: ReactNode;
  /** The level of the heading: 2 by default. The name of each platform sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PlatformAvailabilityLabels>;
  /** Locale for the release dates. */
  locale?: string;
  /** Time zone for the release dates. A release date is a calendar day, so UTC (the default) shows the day you wrote. */
  timeZone?: string;
}

const LABELS: PlatformAvailabilityLabels = {
  available: "Available",
  beta: "Beta",
  soon: "Coming soon",
  version: "Version",
  released: "Released",
  get: "Get it",
  tellMe: "Tell me when it is ready",
};

/** Each status has a shape and a fill as well as its word: a check on a solid pill, a flask on an outline, a clock on a soft one. */
const STATUS: Record<PlatformStatus, { icon: typeof IconCheck; variant: NonNullable<BadgeProps["variant"]> }> = {
  available: { icon: IconCheck, variant: "default" },
  beta: { icon: IconFlask, variant: "outline" },
  soon: { icon: IconClock, variant: "muted" },
};

/** A release date as the reader's locale writes it. A date-only value is a calendar day and is read as one; anything else is shown as it came. */
function dateOf(value: string, locale: string, timeZone: string): string {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }).format(date);
}

/**
 * Where it runs: web, iOS, Android, desktop and the API as tiles, each with its status in words, the current
 * version with the day it shipped, and a link to get it. A coming-soon tile carries no download link; if you pass
 * an href it becomes a plain link to a waiting list ("Tell me when it is ready"). The status is always written and
 * also has a shape and a fill of its own, never colour alone. The tiles are a list, so the count is read out, and
 * a tile with a link is a whole-tile link named after its platform. A product team keeps it honest by editing data,
 * and visitors stop asking whether there is an Android app. The tiles come in 1, 2 or 3 columns by the width of
 * the block, not of the screen.
 */
export function PlatformAvailability({ eyebrow, title, description, platforms, footnote, headingLevel = 2, labels: custom, locale = "en-US", timeZone = "UTC", className, ...props }: PlatformAvailabilityProps) {
  const labels = { ...LABELS, ...custom };
  const PlatformName = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="platform-availability" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @3xl:mt-12">
        {platforms.map((platform) => {
          const status = STATUS[platform.status];
          const StatusIcon = status.icon;
          const soon = platform.status === "soon";
          const word = labels[platform.status];
          const whole = Boolean(platform.href) && !soon;
          return (
            <li
              key={platform.id}
              data-status={platform.status}
              className={cn(
                "relative flex min-w-0 flex-col rounded-xl border bg-card p-5 transition-colors duration-150 motion-reduce:transition-none @xl:p-6",
                soon ? "border-dashed border-border" : "border-border",
                whole && "hover:border-foreground/30",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background text-base font-medium [&_svg]:size-5", soon ? "text-muted-foreground" : "text-foreground")}>
                  {platform.icon ?? platform.label.charAt(0).toUpperCase()}
                </span>
                <Badge variant={status.variant} className="h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5">
                  <StatusIcon aria-hidden="true" />
                  {word}
                </Badge>
              </div>
              <PlatformName className="mt-5 text-lg leading-snug font-medium tracking-[-0.02em]">{platform.label}</PlatformName>
              {platform.version || platform.releasedAt ? (
                <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5 text-sm">
                  {platform.version ? (
                    <>
                      <dt className="text-muted-foreground">{labels.version}</dt>
                      <dd className="font-medium tabular-nums">{platform.version}</dd>
                    </>
                  ) : null}
                  {platform.releasedAt ? (
                    <>
                      <dt className="text-muted-foreground">{labels.released}</dt>
                      <dd className="tabular-nums">
                        <time dateTime={platform.releasedAt}>{dateOf(platform.releasedAt, locale, timeZone)}</time>
                      </dd>
                    </>
                  ) : null}
                </dl>
              ) : null}
              {platform.note ? <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">{platform.note}</p> : null}
              {platform.href ? (
                <div className="mt-auto pt-6">
                  <a
                    href={platform.href}
                    className={cn(
                      "group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium underline underline-offset-4 outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                      soon ? "text-muted-foreground decoration-muted-foreground/40 hover:text-foreground hover:decoration-current" : "text-foreground decoration-foreground/30 after:absolute after:inset-0 after:rounded-xl after:ring-inset after:ring-ring/50 hover:decoration-current focus-visible:ring-0 focus-visible:after:ring-[3px]",
                    )}
                  >
                    {platform.linkLabel ?? (soon ? labels.tellMe : labels.get)}
                    <span className="sr-only"> ({platform.label})</span>
                    <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                  </a>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {footnote ? (
        <p className="mt-6 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">{footnote}</span>
        </p>
      ) : null}
    </section>
  );
}
