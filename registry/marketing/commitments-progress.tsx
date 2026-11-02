import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCheckCircle, IconClock, IconTrendUp, IconWarning, IconXCircle } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export type CommitmentStatus = "done" | "on-track" | "at-risk" | "missed";

export interface Commitment {
  /** A stable key for the commitment: "packaging". */
  id: string;
  /** The commitment as you published it: "100% recycled packaging by 2028". */
  title: string;
  /** Where you are now, in `unit`: 62. State a goal as something that grows towards the target (a cut achieved, not a level left). */
  current: number;
  /** Where you promised to get, in `unit`: 100. */
  target: number;
  /** What the numbers count: "%", "trees", "warehouses", "t CO₂e". A symbol such as % sits against both numbers ("62% of 100%"); a word comes once, after the target ("4 of 6 warehouses"). */
  unit?: string;
  /** When it is due, as an ISO date or part of one: "2028", "2028-06" or "2028-12-31". Write only the precision you promised. */
  deadline: string;
  /** Where it stands, said in a word with an icon: done, on track, at risk or missed. Your call, not worked out from the numbers. */
  status: CommitmentStatus;
  /** One line on how it is measured, or why it is where it is: "Scope 1 and 2, against our 2019 baseline." */
  note?: string;
}

export interface CommitmentGroup {
  /** The heading of the group: "Climate", "People", "Supply chain". */
  label: string;
  /** The commitments in it, most important first. */
  items: readonly Commitment[];
}

export interface CommitmentsProgressLabels {
  /** Written in the status chip of a finished commitment. */
  done: string;
  /** Written in the status chip of a commitment that is on schedule. */
  onTrack: string;
  /** Written in the status chip of a commitment that is behind. */
  atRisk: string;
  /** Written in the status chip of a commitment whose deadline passed unmet. */
  missed: string;
  /** Read out before the status of a commitment. */
  status: string;
  /** The current and the target value. {current} and {target} stand for the numbers, with their unit when it is a symbol. */
  figures: string;
  /** The deadline. {date} stands for the date. */
  by: string;
  /** The line with the date of the last update. {date} stands for the date. */
  updated: string;
  /** The link to the full report. */
  report: string;
  /** The name of the status summary for assistive technology. */
  summary: string;
  /** The note shown when the figures are older than `staleAfterDays`. {age} stands for how long ago, such as "9 months ago". */
  stale: string;
  /** The size of a group of one commitment. {count} stands for the number. */
  countOne: string;
  /** The size of a group of several commitments. {count} stands for the number. */
  countOther: string;
}

const LABELS: CommitmentsProgressLabels = {
  done: "Done",
  onTrack: "On track",
  atRisk: "At risk",
  missed: "Missed",
  status: "Status",
  figures: "{current} of {target}",
  by: "by {date}",
  updated: "Last updated {date}",
  report: "Read the full report",
  summary: "Commitments by status",
  stale: "This report was last updated {age}, so the figures may be out of date.",
  countOne: "{count} commitment",
  countOther: "{count} commitments",
};

export interface CommitmentsProgressProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Our commitments, and where they stand". */
  title: string;
  /** One or two sentences under the heading: what is counted and how often it is checked. */
  description?: string;
  /** The commitments, grouped under headings such as Climate, People and Supply chain. */
  groups: readonly CommitmentGroup[];
  /** When the figures were last checked, as an ISO date or date-time. It is required: a claim with no date cannot be judged, and an old date shows the claim is old. */
  updatedAt: string;
  /** Where the full report is. It becomes a link beside the date. */
  reportHref?: string;
  /**
   * The moment the age of the report is judged against. Pass it for stable rendering; without it the current time is used.
   * That time is the moment the section renders: on a page that is generated once (a static export, a cached route) it is
   * the day of the build, so a report that goes out of date later never gets its note until the page is built again. Revalidate
   * such a page on a schedule, or pass `now` from something that does. The date of the last update is shown either way.
   */
  now?: Date | string | number;
  /** After this many days the report says in words that it is out of date. 180 by default. */
  staleAfterDays?: number;
  /** The level of the heading: 2 by default. The group headings sit one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the report link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CommitmentsProgressLabels>;
  /** Locale for the numbers and dates. "en-US" by default. */
  locale?: string;
  /** The time zone an update written with a time is shown in, so the server and the browser agree. "UTC" by default. A date on its own, such as a deadline or "2026-10-14", is a calendar day and is never shifted. */
  timeZone?: string;
}

const STATUS_ORDER: readonly CommitmentStatus[] = ["done", "on-track", "at-risk", "missed"];

/**
 * Weight does the telling, not colour: the exceptions are the heavy chips. Done is a soft fill, on track a plain outline,
 * at risk a solid chip that draws the eye, and missed the destructive tone, each with its own icon and its own word.
 */
const STATUS_BADGE: Record<CommitmentStatus, NonNullable<BadgeProps["variant"]>> = { done: "secondary", "on-track": "outline", "at-risk": "default", missed: "destructive" };
/**
 * The destructive tone is plain red text on its own pale tint, which is only 3.9:1 in the light theme (AA asks for 4.5:1
 * at this size) and is the chip for the most important bad news. In the light theme its text is mixed 15% towards black
 * (5.5:1 on the page, 5.0:1 on a muted surface); the dark theme is already above 4.5:1 and keeps the token as it is.
 * It is this chip only, so the Badge and its other users stay as they are.
 */
const STATUS_CLASS: Partial<Record<CommitmentStatus, string>> = { missed: "text-[color:color-mix(in_oklch,var(--destructive),black_15%)] dark:text-destructive" };
const STATUS_ICON = { done: IconCheckCircle, "on-track": IconTrendUp, "at-risk": IconWarning, missed: IconXCircle } as const;

const LINK =
  "inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** Fills {name} markers in a sentence with text or nodes. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** A symbol sits against its number; a word comes once, after the pair. */
const SYMBOL_UNIT = /^[%‰°]/;

/** How long ago, in the coarsest whole unit that is not zero: months until a year, then years. */
function ago(days: number, locale: string): string {
  const months = Math.floor(days / 30.44);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  return months >= 12 ? formatter.format(-Math.floor(months / 12), "year") : formatter.format(-Math.max(1, months), "month");
}

/** A deadline as a calendar date: a year, a month or a day. It is never shifted by a time zone. Anything else is shown as it was written. */
function whenDue(value: string, locale: string): { iso: string | null; label: string } {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value.trim());
  if (!match) return { iso: null, label: value };
  const [, year, month, day] = match;
  if (!month) return { iso: year ?? null, label: year ?? value };
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day ?? 1)));
  if (Number.isNaN(date.getTime())) return { iso: null, label: value };
  const style: Intl.DateTimeFormatOptions = day ? { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" } : { month: "short", year: "numeric", timeZone: "UTC" };
  return { iso: value.trim(), label: new Intl.DateTimeFormat(locale, style).format(date) };
}

/**
 * Public goals as a report, not a boast: each commitment is a row with its
 * target, where it stands today, the deadline and a status written in a word
 * with an icon (Done, On track, At risk, Missed). Rows sit under group headings
 * such as Climate, People and Supply chain, and a tally says how many are in
 * each state. The progress is a real progressbar named after its commitment,
 * with the same figures as its value text ("62% of 100%"), so a screen reader
 * hears what the bar shows. A date of the last update is required and shown
 * beside the link to the full report, and when it is older than
 * `staleAfterDays` the section says so in words, so an old claim is visible as
 * old. The age is judged when the section renders, so a page that is generated
 * once needs revalidating, or a `now` that is kept fresh. Weight, icons and
 * words tell the statuses apart, never colour alone, and a missed goal is
 * listed with its reason instead of being dropped. Rows are stacked on a phone
 * and in three columns (commitment, progress, status) from 768px of width. For
 * sustainability pages, charters and annual reviews that would rather be
 * checked than believed.
 */
export function CommitmentsProgress({
  title,
  description,
  groups,
  updatedAt,
  reportHref,
  now,
  staleAfterDays = 180,
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: CommitmentsProgressProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const GroupHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const statusWord: Record<CommitmentStatus, string> = { done: labels.done, "on-track": labels.onTrack, "at-risk": labels.atRisk, missed: labels.missed };
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  const counts = new Map<CommitmentStatus, number>();
  for (const group of groups) for (const item of group.items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);

  const updated = Date.parse(updatedAt);
  const known = !Number.isNaN(updated);
  const moment = now === undefined ? Date.now() : new Date(now).getTime();
  const ageDays = known && !Number.isNaN(moment) ? (moment - updated) / 86_400_000 : 0;
  const stale = ageDays > staleAfterDays;
  // "9 months ago", or "2 years ago" from a year on. Only worked out when it is going to be said.
  const age = stale ? ago(ageDays, locale) : "";
  // A date on its own ("2026-10-14") is a calendar day and is never shifted; a date with a time is shown in the zone you name.
  const calendarDay = /^\d{4}-\d{2}-\d{2}$/.test(updatedAt.trim());
  const updatedText = known ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: calendarDay ? "UTC" : timeZone }).format(updated) : updatedAt;

  return (
    <section data-slot="commitments-progress" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <header className="max-w-2xl">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        <p className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <IconClock aria-hidden="true" className="size-4 shrink-0" />
            <span>{known ? fill(labels.updated, { date: <time dateTime={updatedAt}>{updatedText}</time> }) : text(labels.updated, { date: updatedText })}</span>
          </span>
          {reportHref ? (
            <Link href={reportHref} className={LINK}>
              {labels.report}
              <IconArrowUpRight aria-hidden="true" className="size-3.5" />
            </Link>
          ) : null}
        </p>
      </header>

      {stale ? (
        <div role="note" className="mt-6 flex max-w-2xl items-start gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-pretty">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{text(labels.stale, { age })}</p>
        </div>
      ) : null}

      {counts.size > 0 ? (
        <ul role="list" aria-label={labels.summary} className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-border py-4 text-sm @xl:flex @xl:flex-wrap @xl:gap-x-8 @3xl:mt-10">
          {STATUS_ORDER.filter((status) => counts.has(status)).map((status) => {
            const Icon = STATUS_ICON[status];
            return (
              <li key={status} className="flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium tabular-nums">{counts.get(status)}</span> {statusWord[status].toLocaleLowerCase(locale)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-12 grid gap-12">
        {groups.map((group, groupIndex) => (
          <div key={`${groupIndex}-${group.label}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-3">
              <GroupHeading className="text-lg leading-snug font-medium tracking-[-0.02em]">{group.label}</GroupHeading>
              <p className="text-sm text-muted-foreground tabular-nums">{text(group.items.length === 1 ? labels.countOne : labels.countOther, { count: group.items.length })}</p>
            </div>
            <ul role="list" className="divide-y divide-border">
              {group.items.map((item) => {
                const ratio = item.target > 0 ? Math.min(100, Math.max(0, (item.current / item.target) * 100)) : 0;
                const symbol = SYMBOL_UNIT.test(item.unit ?? "");
                const pair = text(labels.figures, { current: number.format(item.current) + (symbol ? (item.unit ?? "") : ""), target: number.format(item.target) + (symbol ? (item.unit ?? "") : "") });
                const figures = item.unit && !symbol ? `${pair} ${item.unit}` : pair;
                const due = whenDue(item.deadline, locale);
                const Icon = STATUS_ICON[item.status];
                const titleId = `${id}-${groupIndex}-${item.id}`;
                return (
                  <li key={item.id} data-status={item.status} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 py-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_6rem] @3xl:gap-x-10 @3xl:gap-y-1">
                    <p id={titleId} className="text-base leading-6 font-medium tracking-[-0.01em] text-balance @3xl:col-start-1 @3xl:row-start-1">
                      {item.title}
                    </p>
                    {item.note ? <p className="col-span-2 text-sm leading-relaxed text-pretty text-muted-foreground @3xl:col-span-1 @3xl:col-start-1 @3xl:row-start-2">{item.note}</p> : null}

                    <div className="col-start-2 row-start-1 self-start @3xl:col-start-3 @3xl:row-span-2 @3xl:mt-0.5 @3xl:justify-self-end">
                      <Badge variant={STATUS_BADGE[item.status]} className={STATUS_CLASS[item.status]}>
                        <Icon aria-hidden="true" />
                        <span className="sr-only">{labels.status}: </span>
                        {statusWord[item.status]}
                      </Badge>
                    </div>

                    <div className="col-span-2 @3xl:col-span-1 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1 @3xl:pt-[9px]">
                      {/* The words are passed as the value text, not as a function: this module renders on the server, and a function cannot be passed to the client Progress. */}
                      <Progress
                        value={ratio}
                        aria-labelledby={titleId}
                        aria-valuetext={figures}
                        className={cn("h-1.5", item.status === "missed" && "[&>[data-slot=progress-indicator]]:bg-destructive")}
                      />
                      <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm tabular-nums">
                        <p className="font-medium">{figures}</p>
                        <p className="text-muted-foreground">{fill(labels.by, { date: due.iso ? <time dateTime={due.iso}>{due.label}</time> : due.label })}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
