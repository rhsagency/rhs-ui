"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { dateIn, lengthText, monthsBetween, toMoment, type DateInput, type Moment } from "@rhs-ui/application/experience-list/format";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

/** One role of a CV: a job, or a degree. */
export interface ExperienceEntry {
  /** The title, and the heading of the entry: "Senior Product Designer", "MSc Computer Science". */
  role: string;
  /** The company or the school. Entries with the same organisation next to each other are grouped under it. */
  organisation: string;
  /** The organisation's logo, as an image address. Without one the tile shows the initials of its name. */
  logo?: string;
  /** When it began: a Date, a timestamp or an ISO string. A string such as "2022-03" is a month and "2022-03-14" a calendar day; neither shifts with the time zone. */
  start: DateInput;
  /** When it ended, in the same forms. Leave it out, or pass `null`, for a role that is still going on: it says "Present" in words. */
  end?: DateInput | null;
  /** Where: "Rotterdam, Netherlands" or "Remote". */
  location?: string;
  /** What was done, one line each. */
  bullets?: readonly string[];
  /** What it used or taught, as tags. */
  skills?: readonly string[];
}

/** The words the list uses, for translation. `{count}` is filled in. */
export interface ExperienceListLabels {
  /** The end of a role that is still going on. Default "Present". */
  present?: string;
  /** Said to screen readers between the two dates. Default "to". */
  to?: string;
  /** The name of the list of skills. Default "Skills". */
  skills?: string;
  /** Length of time, one year. Default "{count} yr". */
  year?: string;
  /** Length of time, several years. Default "{count} yrs". */
  years?: string;
  /** Length of time, one month. Default "{count} mo". */
  month?: string;
  /** Length of time, several months. Default "{count} mos". */
  months?: string;
  /** Length of time, under a month. Default "Less than a month". */
  less?: string;
}

export interface ExperienceListProps extends Omit<ComponentProps<"ol">, "children"> {
  /** The roles, newest first. Entries with the same organisation next to each other group under it. */
  entries: readonly ExperienceEntry[];
  /** `work` writes months and how long each role lasted; `education` writes years only. Default "work". */
  variant?: "work" | "education";
  /** Heading level of each entry (the role, or the organisation of a group, whose roles are one level deeper). Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment a role that is still going on is measured to. Leave it out to use the browser's clock, read once the page is live; pass it to get the lengths in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Calendar dates ("2022-03") ignore it. Default "UTC". */
  timeZone?: string;
  /** The words the list uses, for translation. */
  labels?: ExperienceListLabels;
}

const DEFAULT_LABELS = {
  present: "Present",
  to: "to",
  skills: "Skills",
  year: "{count} yr",
  years: "{count} yrs",
  month: "{count} mo",
  months: "{count} mos",
  less: "Less than a month",
};

interface Role {
  entry: ExperienceEntry;
  start: Moment;
  /** Null while it is still going on. */
  end: Moment | null;
}

/** The browser's clock, once the page is live and then every hour while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 3_600_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

const sameOrganisation = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** What the tile holds: the logo, or the initials of the organisation while it loads or when there is none. */
function Logo({ name, logo }: { name: string; logo?: string }) {
  return (
    <Avatar className="rounded-lg border border-border bg-background data-[size=default]:size-10">
      {logo ? <AvatarImage src={logo} alt="" className="object-contain p-1" /> : null}
      <AvatarFallback className="rounded-lg bg-muted text-[0.8125rem] font-semibold tracking-[-0.02em]">{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );
}

function Bullets({ items }: { items?: readonly string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/50 [&>li]:pl-1">
      {items.map((item, index) => (
        <li key={`${index}-${item}`} className="[overflow-wrap:anywhere]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Skills({ items, label }: { items?: readonly string[]; label: string }) {
  if (!items?.length) return null;
  return (
    <ul aria-label={label} className="mt-3.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <Badge variant="secondary">{item}</Badge>
        </li>
      ))}
    </ul>
  );
}

/**
 * A CV section as a list of articles: each role (or degree) is an article
 * with a heading, its dates in a quiet column on the left ("Mar 2022 –
 * Present" and how long that was) and what happened on the right: the
 * organisation with its logo, the place, a few lines of what was done and the
 * skills as tags. On a phone the dates move above the details. A role that
 * is still going on says "Present" in words; several roles at one
 * organisation next to each other share one heading and a thin timeline, with
 * the time at the organisation added up. Dates are written in months (years
 * for `education`) and may be as coarse as "2022-03".
 */
export function ExperienceList({ entries, variant = "work", headingLevel = 3, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: ExperienceListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const uid = useId();
  const roles: Role[] = entries.flatMap((entry) => {
    const start = toMoment(entry.start);
    if (!start) return [];
    return [{ entry, start, end: entry.end === undefined || entry.end === null ? null : toMoment(entry.end) }];
  });
  const work = variant === "work";
  const clock = useNow(now, work && roles.some((role) => role.end === null));
  const today: Moment | null = clock === null ? null : { at: clock, calendar: false, monthOnly: false, iso: new Date(clock).toISOString() };

  const Top = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Nested = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const options: Intl.DateTimeFormatOptions = work ? { month: "short", year: "numeric" } : { year: "numeric" };

  const length = (start: Moment, end: Moment | null): string => {
    if (!work) return "";
    const to = end ?? today;
    return to ? lengthText(monthsBetween(start, to, timeZone), { ...text }) : "";
  };

  /** "Mar 2022 – Present", every date a `time` element and the dash said as "to". */
  const range = (start: Moment, end: Moment | null): ReactNode => {
    const from = dateIn(start, locale, timeZone, options);
    // One month, or one year, is written once: "Jun 2020", not "Jun 2020 – Jun 2020".
    if (end && dateIn(end, locale, timeZone, options) === from) return <time dateTime={start.iso}>{from}</time>;
    return (
      <>
        <time dateTime={start.iso}>{from}</time>
        <span aria-hidden="true"> – </span>
        <span className="sr-only"> {text.to} </span>
        {end ? <time dateTime={end.iso}>{dateIn(end, locale, timeZone, options)}</time> : <span>{text.present}</span>}
      </>
    );
  };

  const dates = (start: Moment, end: Moment | null): ReactNode => {
    const spent = length(start, end);
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 text-sm leading-6 tabular-nums @xl:block @xl:leading-5">
        <p className="font-medium text-foreground">{range(start, end)}</p>
        {spent ? (
          <p className="text-muted-foreground">
            <span aria-hidden="true" className="@xl:hidden">
              ·{" "}
            </span>
            <span className="sr-only">, </span>
            {spent}
          </p>
        ) : null}
      </div>
    );
  };

  // Entries with the same organisation next to each other share one heading.
  const groups: Role[][] = [];
  for (const role of roles) {
    const last = groups[groups.length - 1];
    if (last?.[0] && sameOrganisation(last[0].entry.organisation, role.entry.organisation)) last.push(role);
    else groups.push([role]);
  }

  const grid = "grid gap-x-8 gap-y-2.5 @xl:grid-cols-[10.5rem_minmax(0,1fr)]";

  return (
    <ol data-slot="experience-list" data-variant={variant} className={cn("@container divide-y divide-border", className)} {...props}>
      {groups.map((group, index) => {
        const first = group[0];
        if (!first) return null;
        const id = `${uid}-${index}`;

        if (group.length === 1) {
          const { entry, start, end } = first;
          return (
            <li key={id} className="py-7 first:pt-0 last:pb-0">
              <article aria-labelledby={id} className={grid}>
                {dates(start, end)}
                <div className="min-w-0">
                  <div className="flex items-center gap-3.5">
                    <Logo name={entry.organisation} logo={entry.logo} />
                    <div className="min-w-0">
                      <Top id={id} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
                        {entry.role}
                      </Top>
                      <p className="mt-0.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">
                        {entry.organisation}
                        {entry.location ? ` · ${entry.location}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="@md:pl-[3.375rem]">
                    <Bullets items={entry.bullets} />
                    <Skills items={entry.skills} label={text.skills} />
                  </div>
                </div>
              </article>
            </li>
          );
        }

        // One organisation, several roles: the span of them all, and the roles on a thin timeline.
        const earliest = group.reduce((a, b) => (b.start.at < a.start.at ? b : a)).start;
        const open = group.some((role) => role.end === null);
        const latest = open ? null : group.reduce<Moment | null>((a, b) => (b.end && (!a || b.end.at > a.at) ? b.end : a), null);
        const place = group.map((role) => role.entry.location).find(Boolean);
        return (
          <li key={id} className="py-7 first:pt-0 last:pb-0">
            <section aria-labelledby={id} className={grid}>
              {dates(earliest, latest)}
              <div className="min-w-0">
                <div className="flex items-center gap-3.5">
                  <Logo name={first.entry.organisation} logo={group.find((role) => role.entry.logo)?.entry.logo} />
                  <div className="min-w-0">
                    <Top id={id} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
                      {first.entry.organisation}
                    </Top>
                    {place ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{place}</p> : null}
                  </div>
                </div>
                <ol className="mt-5 ml-5 space-y-7 border-l border-border pl-7">
                  {group.map(({ entry, start, end }, position) => {
                    const roleId = `${id}-${position}`;
                    const spent = length(start, end);
                    return (
                      <li key={roleId} className="relative">
                        <span aria-hidden="true" className={cn("absolute top-[0.4375rem] -left-[32.5px] size-2 rounded-full border-2", end === null ? "border-foreground bg-foreground" : "border-border bg-background")} />
                        <article aria-labelledby={roleId}>
                          <Nested id={roleId} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
                            {entry.role}
                          </Nested>
                          <p className="mt-0.5 text-sm leading-5 text-muted-foreground tabular-nums">
                            {range(start, end)}
                            {spent ? (
                              <>
                                <span aria-hidden="true"> · </span>
                                <span className="sr-only">, </span>
                                {spent}
                              </>
                            ) : null}
                            {entry.location && entry.location !== place ? ` · ${entry.location}` : ""}
                          </p>
                          <Bullets items={entry.bullets} />
                          <Skills items={entry.skills} label={text.skills} />
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          </li>
        );
      })}
    </ol>
  );
}
