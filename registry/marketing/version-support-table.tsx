import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type VersionStatus = "current" | "supported" | "security-only" | "end-of-life";

export interface SupportedVersion {
  /** The version as users say it: "5.2", "v3", "2026-07-01". It is the row's heading. */
  name: string;
  /** The day it shipped, as an ISO date: "2026-06-02". */
  released?: string;
  /** The last day it gets bug fixes and new features. Leave it out when it is not decided. */
  activeUntil?: string;
  /** The last day it gets security fixes. Leave it out when it is not decided. */
  securityUntil?: string;
  /** Said in words. Without it the status is worked out from the two dates: Supported, then Security only, then End of life. Current is always your call. */
  status?: VersionStatus;
  /** Makes the version's name a link to its release notes. */
  notesHref?: string;
}

export interface VersionSupportLabels {
  /** Column head and label for the version. */
  version: string;
  /** Column head and label for the status. */
  status: string;
  /** Column head and label for the release date. */
  released: string;
  /** Column head and label for the end of active support. */
  activeUntil: string;
  /** Column head and label for the end of security fixes. */
  securityUntil: string;
  /** The status of the newest version you recommend. */
  current: string;
  /** The status of a version that still gets bug fixes and new features. */
  supported: string;
  /** The status of a version that only gets security fixes. */
  securityOnly: string;
  /** The status of a version that gets nothing any more. */
  endOfLife: string;
  /** Written before a date that has passed. */
  ended: string;
  /** Flags the next date that will change a status. */
  next: string;
  /** Said when a date has not been announced. */
  tbd: string;
  /** Read out after a version's name when it links to its release notes. */
  notes: string;
  /** Said when there are no versions to list. */
  empty: string;
}

export interface VersionSupportTableProps extends Omit<ComponentProps<"section">, "children"> {
  /** One row per version, in the order you want them. Newest first is the usual order. */
  versions: readonly SupportedVersion[];
  /** Today as an ISO date. It decides which dates are marked Ended and which date is next. Pass a fixed one for stable rendering; without it the current day in `timeZone` is used. */
  today?: string;
  /** The table's name, shown above it and read out by screen readers: "Supported versions of the Halcyon SDK". */
  caption?: string;
  /** A short note under the table: what active support and security fixes mean, and how long you support a version. */
  note?: ReactNode;
  /** How a date is written. `iso` (the default) writes 2026-10-31, which sorts, aligns and means the same in every locale; `medium` writes it the way `locale` does. */
  dateFormat?: "iso" | "medium";
  /** The level of each version's heading in the stacked layout on a phone: 3 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the release-notes links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the headings, the statuses and the markers, for a site that is not in English. */
  labels?: Partial<VersionSupportLabels>;
  /** Locale for `medium` dates. */
  locale?: string;
  /** Only decides which day "today" is when you do not pass one. The dates themselves are calendar days and are never shifted. */
  timeZone?: string;
}

const LABELS: VersionSupportLabels = {
  version: "Version",
  status: "Status",
  released: "Released",
  activeUntil: "Active support until",
  securityUntil: "Security fixes until",
  current: "Current",
  supported: "Supported",
  securityOnly: "Security only",
  endOfLife: "End of life",
  ended: "Ended",
  next: "Next change",
  tbd: "Not announced",
  notes: "release notes",
  empty: "No versions are listed yet.",
};

const BADGE: Record<VersionStatus, NonNullable<BadgeProps["variant"]>> = {
  current: "default",
  supported: "secondary",
  "security-only": "outline",
  "end-of-life": "muted",
};

const utc = (day: string) => new Date(`${day}T00:00:00Z`);

/** The calendar day of a value as "2026-10-31", or null when it is not a real day. A date-time keeps its date part. */
function dayOf(value: string | undefined): string | null {
  const day = value?.slice(0, 10) ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = utc(day);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : day;
}

/** The calendar day in a time zone, as an ISO date. */
function todayIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Supported until the active date passes, Security only until the security date passes, then End of life. */
function statusOf(version: SupportedVersion, now: string): VersionStatus {
  if (version.status) return version.status;
  const security = dayOf(version.securityUntil);
  const active = dayOf(version.activeUntil);
  if (security && security < now) return "end-of-life";
  if (active && active < now) return "security-only";
  return "supported";
}

type Field = "activeUntil" | "securityUntil";

const LINK =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * Which versions of a runtime, SDK or API you still support, and until when:
 * one row per version with its release date, the end of active support, the
 * end of security fixes and a status in words. A date that has passed says
 * Ended, and the one date that will change a status next is flagged where it
 * sits, so a reader sees at once what is about to stop. Every status is a word
 * and every date sits in a time element; nothing depends on colour. Dates are
 * written year first by default, which aligns in a column and cannot be misread
 * as day or month. Below 768px each row becomes a card that keeps every label.
 * Pass a fixed `today` and the table renders the same on every machine, which
 * is what a test wants.
 */
export function VersionSupportTable({
  versions,
  today,
  caption,
  note,
  dateFormat = "iso",
  headingLevel = 3,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: VersionSupportTableProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel}` as "h2" | "h3" | "h4";
  const now = dayOf(today) ?? todayIn(timeZone);
  const medium = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const statusWord: Record<VersionStatus, string> = { current: labels.current, supported: labels.supported, "security-only": labels.securityOnly, "end-of-life": labels.endOfLife };

  // The one date, across the whole table, that will change a status first: the earliest one that has not passed.
  let flagged: { row: number; field: Field; day: string } | null = null;
  for (const [row, version] of versions.entries()) {
    for (const field of ["activeUntil", "securityUntil"] as const) {
      const day = dayOf(version[field]);
      if (day && day >= now && (!flagged || day < flagged.day)) flagged = { row, field, day };
    }
  }

  const dateText = (day: string) => (dateFormat === "iso" ? day : medium.format(utc(day)));

  /**
   * A date in a time element. A support date that has passed says Ended in words, and the one that is next to
   * change a status is flagged and set on a soft plate. A release date is history: it never says Ended.
   */
  const when = (value: string | undefined, kind: "release" | "support", isNext = false): ReactNode => {
    const day = dayOf(value);
    if (!value) return <span className="text-muted-foreground">{labels.tbd}</span>;
    if (!day) return value;
    const ended = kind === "support" && day < now;
    return (
      // The plate is a flex column, not an inline block: a table cell lines up on its first line, and an inline block would offer its last.
      <span className={cn(isNext ? "-mx-2.5 -my-1.5 inline-flex flex-col rounded-md bg-muted px-2.5 py-1.5" : "block")}>
        <span className={cn(ended && "text-muted-foreground")}>
          {ended ? (
            <>
              <span className="font-medium">{labels.ended}</span>{" "}
            </>
          ) : null}
          <time dateTime={day} className={cn("tabular-nums", isNext && "font-medium")}>
            {dateText(day)}
          </time>
        </span>
        {isNext ? (
          <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />
            {labels.next}
          </span>
        ) : null}
      </span>
    );
  };

  const name = (version: SupportedVersion) =>
    version.notesHref ? (
      <Link href={version.notesHref} className={LINK}>
        {version.name}
        <span className="sr-only"> {labels.notes}</span>
      </Link>
    ) : (
      version.name
    );

  const isNext = (row: number, field: Field) => flagged !== null && flagged.row === row && flagged.field === field;

  if (versions.length === 0) {
    return (
      <section data-slot="version-support-table" className={cn("w-full break-words", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section data-slot="version-support-table" className={cn("w-full break-words", className)} {...props}>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
        <Table className="caption-top">
          {caption ? <TableCaption className="mt-0 px-5 pt-5 pb-4 text-left text-base font-medium tracking-[-0.01em] text-foreground">{caption}</TableCaption> : null}
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead scope="col" className="pl-5">
                {labels.version}
              </TableHead>
              <TableHead scope="col">{labels.status}</TableHead>
              <TableHead scope="col">{labels.released}</TableHead>
              <TableHead scope="col">{labels.activeUntil}</TableHead>
              <TableHead scope="col" className="pr-5">
                {labels.securityUntil}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version, row) => {
              const status = statusOf(version, now);
              return (
                <TableRow key={version.name}>
                  <TableHead scope="row" className="h-auto py-4 pl-5 align-baseline text-base font-medium tracking-[-0.01em] whitespace-normal text-foreground">
                    {name(version)}
                  </TableHead>
                  <TableCell className="py-4 align-baseline">
                    <Badge variant={BADGE[status]}>{statusWord[status]}</Badge>
                  </TableCell>
                  <TableCell className="py-4 align-baseline">{when(version.released, "release")}</TableCell>
                  <TableCell className="py-4 align-baseline">{when(version.activeUntil, "support", isNext(row, "activeUntil"))}</TableCell>
                  <TableCell className="py-4 pr-5 align-baseline">{when(version.securityUntil, "support", isNext(row, "securityUntil"))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        {caption ? <p className="mb-4 text-base font-medium tracking-[-0.01em]">{caption}</p> : null}
        <ul role="list" aria-label={caption} className="grid grid-cols-1 gap-3">
          {versions.map((version, row) => {
            const status = statusOf(version, now);
            return (
              <li key={version.name} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <Name className="min-w-0 text-lg leading-snug font-medium tracking-[-0.02em]">{name(version)}</Name>
                  <Badge variant={BADGE[status]}>{statusWord[status]}</Badge>
                </div>
                <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-x-4 gap-y-3.5 border-t border-border pt-4 text-sm">
                  <dt className="text-muted-foreground">{labels.released}</dt>
                  <dd className="text-right">{when(version.released, "release")}</dd>
                  <dt className="text-muted-foreground">{labels.activeUntil}</dt>
                  <dd className="text-right">{when(version.activeUntil, "support", isNext(row, "activeUntil"))}</dd>
                  <dt className="text-muted-foreground">{labels.securityUntil}</dt>
                  <dd className="text-right">{when(version.securityUntil, "support", isNext(row, "securityUntil"))}</dd>
                </dl>
              </li>
            );
          })}
        </ul>
      </div>

      {note ? (
        <p className="mt-5 flex max-w-3xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40">{note}</span>
        </p>
      ) : null}
    </section>
  );
}
