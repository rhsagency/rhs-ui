import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCalendar, IconCheck, IconCheckCircle, IconClock, IconInfo, IconLink, IconMinusCircle } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";
import { PostmortemContents } from "@rhs-ui/marketing/incident-postmortem/contents";
import { anchorOf, dayKey, formatDuration, timeOf } from "@rhs-ui/marketing/incident-postmortem/format";
import type {
  ActionStatus,
  Incident,
  IncidentSeverity,
  PostmortemAction,
  PostmortemImpact,
  PostmortemLabels,
  PostmortemLessons,
  RootCause,
  TimelineEvent,
} from "@rhs-ui/marketing/incident-postmortem/types";

export type {
  ActionStatus,
  ImpactFigure,
  Incident,
  IncidentSeverity,
  PostmortemAction,
  PostmortemImpact,
  PostmortemLabels,
  PostmortemLessons,
  RootCause,
  TimelineEvent,
} from "@rhs-ui/marketing/incident-postmortem/types";

export interface IncidentPostmortemProps extends Omit<ComponentProps<"article">, "title"> {
  /** The incident itself: its title, severity, when it started and ended, what it affected and a summary. */
  incident: Incident;
  /** The numbers: customers affected, requests failed. */
  impact: PostmortemImpact;
  /** What happened and when, in any order. It is sorted by time. */
  timeline: readonly TimelineEvent[];
  /** Why it happened, in plain words. */
  rootCause: RootCause;
  /** What worked and what did not. Leave it out to skip the section. */
  lessons?: PostmortemLessons;
  /** What will change, with an owner and a date. Blameless by design: owners are teams unless you pass names. Leave it out to skip the section. */
  actions?: readonly PostmortemAction[];
  /** Renders the ticket links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The level of the title: 1 by default, because this is the page. Sections go one level below it. */
  headingLevel?: 1 | 2 | 3;
  /** Put this in front of every anchor when a page holds more than one postmortem: "inc-2417" gives #inc-2417-timeline. */
  idPrefix?: string;
  /** The note at the end. A sentence on how the review was written by default; pass null to leave it out. */
  note?: ReactNode | null;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PostmortemLabels>;
  /** Locale for dates and numbers. */
  locale?: string;
  /** The time zone every time is shown in. UTC by default, so a customer in another zone reads the same clock as your team. */
  timeZone?: string;
}

const LABELS: PostmortemLabels = {
  postmortem: "Postmortem",
  severity: "Severity",
  critical: "Critical",
  major: "Major",
  minor: "Minor",
  started: "Started",
  ended: "Ended",
  duration: "Duration",
  ongoing: "Ongoing",
  affected: "Affected",
  contents: "On this page",
  summary: "Summary",
  impact: "Impact",
  timeline: "Timeline",
  allTimes: "All times are {zone}.",
  afterStart: "{duration} after the start",
  beforeStart: "{duration} before the start",
  rootCause: "Root cause",
  contributing: "Contributing factors",
  lessons: "What we learned",
  wentWell: "What went well",
  wentPoorly: "What did not",
  actions: "Actions",
  action: "Action",
  owner: "Owner",
  due: "Due",
  status: "Status",
  done: "Done",
  inProgress: "In progress",
  planned: "Planned",
  linkTo: "Link to",
  newTab: "(opens in a new tab)",
  day: "d",
  hour: "h",
  minute: "min",
  underMinute: "Under a minute",
  blameless: "This review is blameless. It looks at how our systems and processes allowed the failure, not at who was on call, and every action has a team as its owner.",
};

const SEVERITY: Record<IncidentSeverity, { variant: NonNullable<BadgeProps["variant"]>; key: "critical" | "major" | "minor" }> = {
  critical: { variant: "destructive", key: "critical" },
  major: { variant: "default", key: "major" },
  minor: { variant: "outline", key: "minor" },
};

const STATUS: Record<ActionStatus, { variant: NonNullable<BadgeProps["variant"]>; key: "done" | "inProgress" | "planned"; icon: ReactNode }> = {
  done: { variant: "secondary", key: "done", icon: <IconCheck strokeWidth={2.25} /> },
  "in-progress": { variant: "outline", key: "inProgress", icon: <IconClock /> },
  planned: { variant: "muted", key: "planned", icon: <IconCalendar /> },
};

/** What a paragraph, a list or a link looks like when it arrives as plain markup. */
const PROSE = "text-base leading-[1.75] text-foreground/90 [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a:hover]:decoration-current [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_li+li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-4 [&_p+ul]:mt-4 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5";

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

function Section({ id, title, level, linkLabel, children }: { id: string; title: string; level: 2 | 3 | 4; linkLabel: string; children: ReactNode }) {
  const Heading = `h${level}` as "h2" | "h3" | "h4";
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 border-t border-border pt-10 first:border-t-0 first:pt-0">
      {/* The link sits beside the heading, not inside it, so the heading and the region are named by the title alone. */}
      <div className="group flex items-center gap-2">
        <Heading id={`${id}-heading`} className="min-w-0 text-2xl leading-tight font-medium tracking-[-0.03em] text-balance">
          {title}
        </Heading>
        <a
          href={`#${id}`}
          aria-label={`${linkLabel} ${title}`}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-[opacity,color] duration-150 hover:text-foreground focus-visible:text-foreground focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
            FOCUS,
          )}
        >
          <IconLink aria-hidden="true" size={16} />
        </a>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * A post-incident report that a customer can read in order: what happened in
 * one box (severity in words, when it started and ended in UTC, how long it
 * lasted, what was affected), then the summary, the impact as tabular figures,
 * a timestamped timeline, the root cause in plain words, what went well and
 * what did not, and the actions with an owner, a date and a status in words.
 * Blameless by design: owners are teams unless you pass a name. Every section
 * has an anchor and a link beside its heading, so a customer can be sent
 * straight to the timeline, and a contents list that follows the reader sits
 * beside the page on a wide screen and as a row of links above it on a phone.
 * All times are written in one zone, UTC unless you say otherwise.
 */
export function IncidentPostmortem({
  incident,
  impact,
  timeline,
  rootCause,
  lessons,
  actions = [],
  linkAs: Link = "a",
  headingLevel = 1,
  idPrefix,
  note,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: IncidentPostmortemProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const sectionLevel = (headingLevel + 1) as 2 | 3 | 4;
  const subLevel = (headingLevel + 2) as 3 | 4 | 5;
  const Sub = `h${subLevel}` as "h3" | "h4" | "h5";

  const number = new Intl.NumberFormat(locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone });
  const clockFormat = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone });
  const zoneFormat = new Intl.DateTimeFormat(locale, { timeZoneName: "short", timeZone });
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone });
  // Due dates are calendar days, so they are written in UTC and never move with a zone.
  const dueFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const zoneOf = (time: number) => zoneFormat.formatToParts(new Date(time)).find((part) => part.type === "timeZoneName")?.value ?? timeZone;
  const words = { day: labels.day, hour: labels.hour, minute: labels.minute, underMinute: labels.underMinute };

  const startAt = timeOf(incident.start);
  const endAt = incident.end ? timeOf(incident.end) : null;
  const severity = SEVERITY[incident.severity];

  /** A moment as a date over a clock time and its zone, in one time element. Text that is not a time is shown as written. */
  const moment = (value: string, time: number | null): ReactNode =>
    time === null ? (
      value
    ) : (
      <time dateTime={value} className="tabular-nums">
        <span className="block">{dateFormat.format(time)}</span>
        <span className="block text-sm font-normal text-muted-foreground">
          {clockFormat.format(time)} {zoneOf(time)}
        </span>
      </time>
    );

  const facts = [
    {
      term: labels.severity,
      value: (
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Badge variant={severity.variant}>
            {incident.severity === "critical" ? <IconAlertCircle /> : null}
            {labels[severity.key]}
          </Badge>
          {incident.severityCode ? <span className="text-sm font-normal text-muted-foreground">{incident.severityCode}</span> : null}
        </span>
      ),
    },
    { term: labels.started, value: moment(incident.start, startAt) },
    { term: labels.ended, value: incident.end ? moment(incident.end, endAt) : <span className="font-normal text-muted-foreground">{labels.ongoing}</span> },
    {
      term: labels.duration,
      value: startAt !== null && endAt !== null && endAt >= startAt ? <span className="tabular-nums">{formatDuration(endAt - startAt, words, number)}</span> : <span className="font-normal text-muted-foreground">{labels.ongoing}</span>,
    },
  ];

  const events = timeline
    .map((event) => ({ ...event, ms: timeOf(event.time) }))
    .sort((a, b) => (a.ms ?? Number.POSITIVE_INFINITY) - (b.ms ?? Number.POSITIVE_INFINITY));
  const multiDay = new Set(events.map((event) => (event.ms === null ? "" : dayKey(event.ms, timeZone)))).size > 1;

  const sections = [
    { key: "summary", title: labels.summary },
    { key: "impact", title: labels.impact },
    { key: "timeline", title: labels.timeline },
    { key: "root-cause", title: labels.rootCause },
    ...(lessons ? [{ key: "lessons", title: labels.lessons }] : []),
    ...(actions.length ? [{ key: "actions", title: labels.actions }] : []),
  ].map((section) => ({ ...section, id: anchorOf(idPrefix, section.key) }));
  const idOf = (key: string) => anchorOf(idPrefix, key);

  const ticket = (action: PostmortemAction): ReactNode =>
    action.ticket && action.href ? (
      <Link href={action.href} target="_blank" rel="noopener noreferrer" className={cn("inline-flex items-center gap-1 rounded-sm font-mono text-[0.8125rem] text-muted-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-current motion-reduce:transition-none", FOCUS)}>
        {action.ticket}
        <IconArrowUpRight aria-hidden="true" size={12} />
        <span className="sr-only">{labels.newTab}</span>
      </Link>
    ) : action.ticket ? (
      <span className="font-mono text-[0.8125rem] text-muted-foreground">{action.ticket}</span>
    ) : null;

  const statusBadge = (status: ActionStatus): ReactNode => (
    <Badge variant={STATUS[status].variant}>
      {STATUS[status].icon}
      {labels[STATUS[status].key]}
    </Badge>
  );

  const due = (value: string): ReactNode => {
    const day = /^\d{4}-\d{2}-\d{2}/.test(value) ? timeOf(`${value.slice(0, 10)}T00:00:00Z`) : null;
    return day === null ? (
      value
    ) : (
      <time dateTime={value.slice(0, 10)} className="tabular-nums">
        {dueFormat.format(day)}
      </time>
    );
  };

  const owner = (action: PostmortemAction): ReactNode => (
    <>
      <span className="block font-medium">{action.owner}</span>
      {action.person ? <span className="block text-sm text-muted-foreground">{action.person}</span> : null}
    </>
  );

  const figureCount = impact.figures.length;
  // Two or three figures share one row. Four make a two-by-two until there is room for a row of four, because seven digits do not fit
  // in a quarter of a column. Five or more run two across, then three across, and the last one fills what is left of its row.
  const figureGrid = figureCount <= 3 ? "sm:grid-flow-col sm:auto-cols-fr" : figureCount === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  const closingSpan =
    figureCount > 4
      ? cn(figureCount % 2 === 1 && "sm:col-span-2", (["lg:col-span-1", "lg:col-span-3", "lg:col-span-2"] as const)[figureCount % 3])
      : undefined;

  return (
    <article data-slot="incident-postmortem" className={cn("w-full break-words", className)} {...props}>
      <header className="max-w-3xl">
        <p className="flex items-center gap-2.5 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {labels.postmortem}
          {incident.id ? (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-border" />
              <span className="font-mono tracking-normal normal-case">{incident.id}</span>
            </>
          ) : null}
        </p>
        <Title className="mt-4 text-4xl leading-[1.06] font-medium tracking-[-0.045em] text-balance sm:text-5xl">{incident.title}</Title>
      </header>

      <div className="mt-8 max-w-[64.5rem] rounded-2xl border border-border bg-card p-5 sm:p-6">
        {/* content-start keeps the one-line facts (the badge, the duration) level with the first line of the two-line ones. */}
        <DescriptionList layout="grid" items={facts} className="sm:grid-cols-4 [&>div]:content-start" />
        {incident.affected?.length ? (
          <div className="mt-5 flex flex-col gap-2.5 border-t border-border pt-5 sm:flex-row sm:items-baseline sm:gap-6">
            <p className="shrink-0 text-sm text-muted-foreground">{labels.affected}</p>
            <ul role="list" className="flex flex-wrap gap-2">
              {incident.affected.map((part) => (
                <li key={part} className="rounded-full border border-border bg-background px-3 py-1 text-sm leading-snug">
                  {part}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <nav aria-label={labels.contents} className="mt-8 lg:hidden">
        <ul role="list" className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <li key={section.key}>
              <a href={`#${section.id}`} className={cn("inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-[0.8125rem] font-medium whitespace-nowrap transition-colors duration-150 hover:bg-muted motion-reduce:transition-none", FOCUS)}>
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 grid gap-x-16 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <PostmortemContents title={labels.contents} items={sections.map((section) => ({ id: section.id, title: section.title }))} />
          </div>
        </aside>

        <div className="grid min-w-0 max-w-3xl gap-10 lg:col-start-2 lg:row-start-1">
          <Section id={idOf("summary")} title={labels.summary} level={sectionLevel} linkLabel={labels.linkTo}>
            <div className={cn(PROSE, "text-lg")}>{incident.summary}</div>
          </Section>

          <Section id={idOf("impact")} title={labels.impact} level={sectionLevel} linkLabel={labels.linkTo}>
            {/* The rules are the 1px gaps of a grid laid on a border-coloured ground, and the last figure fills what is left of its row, so a row that is not full still closes. */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <dl className={cn("grid gap-px bg-border", figureGrid)}>
                {impact.figures.map((figure, index) => {
                  // Digits never break across two lines; a text figure with spaces in it still wraps at them.
                  const unbroken = typeof figure.value === "number" || !/\s/.test(figure.value.trim());
                  return (
                    // Each cell is its own container, so the number is sized from the room it has: 36px where there is plenty, smaller in a narrow column.
                    <div key={figure.label} className={cn("@container flex min-w-0 flex-col bg-card p-5 sm:p-6", index === figureCount - 1 && closingSpan)}>
                      {/* The number leads, the label names it, the note qualifies it: the markup keeps the label first for assistive technology. */}
                      <dt className="order-2 mt-2.5 text-sm text-muted-foreground">{figure.label}</dt>
                      <dd className={cn("order-1 leading-none font-medium tracking-[-0.045em] tabular-nums [font-size:clamp(1.5rem,18cqw,2.25rem)]", unbroken && "whitespace-nowrap [overflow-wrap:normal]")}>
                        {typeof figure.value === "number" ? number.format(figure.value) : figure.value}
                      </dd>
                      {figure.note ? <dd className="order-3 mt-3 text-sm leading-snug text-muted-foreground">{figure.note}</dd> : null}
                    </div>
                  );
                })}
              </dl>
            </div>
            {impact.body ? <div className={cn(PROSE, "mt-6")}>{impact.body}</div> : null}
          </Section>

          <Section id={idOf("timeline")} title={labels.timeline} level={sectionLevel} linkLabel={labels.linkTo}>
            <p className="-mt-2 mb-7 text-sm text-muted-foreground">{labels.allTimes.replace("{zone}", startAt === null ? timeZone : zoneOf(startAt))}</p>
            <ol role="list">
              {events.map((event, index) => {
                const previous = events[index - 1];
                const newDay = multiDay && event.ms !== null && (!previous || previous.ms === null || dayKey(previous.ms, timeZone) !== dayKey(event.ms, timeZone));
                const elapsed = event.ms !== null && startAt !== null ? event.ms - startAt : null;
                const minutes = elapsed === null ? 0 : Math.round(Math.abs(elapsed) / 60000);
                // An event before the start shows a minus; assistive technology says before, not after.
                const before = elapsed !== null && elapsed < 0 && minutes > 0;
                const offset = elapsed === null ? null : minutes === 0 ? `+0 ${labels.minute}` : `${before ? "−" : "+"}${formatDuration(Math.abs(elapsed), words, number)}`;
                const last = index === events.length - 1;
                return (
                  <li key={`${event.time}-${index}`}>
                    {newDay && event.ms !== null ? <p className={cn("mb-4 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase", index > 0 && "mt-2")}>{dayFormat.format(event.ms)}</p> : null}
                    <div className={cn("relative grid grid-cols-[4.25rem_1.25rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[5.5rem_1.5rem_minmax(0,1fr)] sm:gap-x-4", last ? "pb-0" : "pb-8")}>
                      <div className="text-right">
                        <time dateTime={event.time} className="text-sm leading-6 font-medium tabular-nums">
                          {event.ms === null ? event.time : clockFormat.format(event.ms)}
                        </time>
                        {offset ? (
                          <>
                            <span aria-hidden="true" className="block text-xs leading-4 text-muted-foreground tabular-nums">
                              {offset}
                            </span>
                            <span className="sr-only">{(before ? labels.beforeStart : labels.afterStart).replace("{duration}", offset.replace(/^[+−]/, ""))}</span>
                          </>
                        ) : null}
                      </div>
                      <div className="relative">
                        {last ? null : <span aria-hidden="true" className="absolute top-3 -bottom-8 left-1/2 w-px -translate-x-1/2 bg-border" />}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "relative z-10 mx-auto mt-[0.4375rem] block rounded-full border-2 bg-background",
                            event.milestone ? "mt-[0.3125rem] size-3.5 border-foreground bg-foreground" : "size-2.5 border-muted-foreground",
                          )}
                        />
                      </div>
                      <div className="min-w-0 pb-px">
                        {event.milestone ? <p className="text-sm leading-6 font-semibold">{event.milestone}</p> : null}
                        <div className={cn(PROSE, "text-base leading-relaxed", event.milestone ? "text-foreground/90" : "")}>{event.event}</div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Section>

          <Section id={idOf("root-cause")} title={labels.rootCause} level={sectionLevel} linkLabel={labels.linkTo}>
            <div className="border-l-2 border-foreground pl-5 text-xl leading-snug font-medium tracking-[-0.02em] text-balance sm:text-2xl">{rootCause.summary}</div>
            {rootCause.body ? <div className={cn(PROSE, "mt-6")}>{rootCause.body}</div> : null}
            {rootCause.factors?.length ? (
              <div className="mt-8">
                <Sub className="text-base font-semibold tracking-[-0.01em]">{labels.contributing}</Sub>
                <ul role="list" className="mt-3 grid gap-2.5">
                  {rootCause.factors.map((factor, index) => (
                    <li key={index} className="flex gap-3 text-base leading-relaxed text-foreground/90">
                      <span aria-hidden="true" className="mt-[0.6875rem] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                      <span className="min-w-0">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          {lessons ? (
            <Section id={idOf("lessons")} title={labels.lessons} level={sectionLevel} linkLabel={labels.linkTo}>
              <div className="grid gap-5 md:grid-cols-2">
                {(
                  [
                    { title: labels.wentWell, items: lessons.wentWell, icon: <IconCheckCircle aria-hidden="true" className="size-[1.125rem]" /> },
                    { title: labels.wentPoorly, items: lessons.wentPoorly, icon: <IconMinusCircle aria-hidden="true" className="size-[1.125rem]" /> },
                  ] as const
                ).map((group) => (
                  <div key={group.title} className="rounded-xl border border-border bg-card p-5">
                    <Sub className="flex items-center gap-2.5 text-base font-semibold tracking-[-0.01em]">
                      {group.icon}
                      {group.title}
                    </Sub>
                    <ul role="list" className="mt-4 grid gap-3">
                      {group.items.map((item, index) => (
                        <li key={index} className="flex gap-3 text-[0.9375rem] leading-relaxed text-foreground/90">
                          <span aria-hidden="true" className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          <span className="min-w-0">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {actions.length ? (
            <Section id={idOf("actions")} title={labels.actions} level={sectionLevel} linkLabel={labels.linkTo}>
              <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead scope="col" className="pl-5">
                        {labels.action}
                      </TableHead>
                      <TableHead scope="col">{labels.owner}</TableHead>
                      <TableHead scope="col">{labels.due}</TableHead>
                      <TableHead scope="col" className="pr-5">
                        {labels.status}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actions.map((action) => (
                      <TableRow key={action.title}>
                        <TableCell className="max-w-[20rem] py-4 pl-5 align-top whitespace-normal">
                          <span className="block font-medium">{action.title}</span>
                          <span className="mt-1 block">{ticket(action)}</span>
                        </TableCell>
                        <TableCell className="py-4 align-top">{owner(action)}</TableCell>
                        <TableCell className="py-4 align-top whitespace-nowrap">{due(action.due)}</TableCell>
                        <TableCell className="py-4 pr-5 align-top">{statusBadge(action.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ul role="list" className="grid gap-3 md:hidden">
                {actions.map((action) => (
                  <li key={action.title} className="rounded-xl border border-border bg-card p-4">
                    <p className="font-medium">{action.title}</p>
                    <p className="mt-1">{ticket(action)}</p>
                    <dl className="mt-4 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] items-baseline gap-x-5 gap-y-3 border-t border-border pt-4 text-sm">
                      <dt className="text-muted-foreground">{labels.owner}</dt>
                      <dd>{owner(action)}</dd>
                      <dt className="text-muted-foreground">{labels.due}</dt>
                      <dd>{due(action.due)}</dd>
                      <dt className="text-muted-foreground">{labels.status}</dt>
                      <dd>{statusBadge(action.status)}</dd>
                    </dl>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {note === null ? null : (
            <p className="flex gap-3 rounded-xl bg-muted/50 p-5 text-sm leading-relaxed text-muted-foreground">
              <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{note ?? labels.blameless}</span>
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
