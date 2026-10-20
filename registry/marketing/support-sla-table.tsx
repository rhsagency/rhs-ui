import { Fragment, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface SlaPriority {
  /** "Critical", "High", "Normal", "Low". */
  name: string;
  /** One line that says when a case gets this priority. */
  definition: string;
}

export interface SlaTarget {
  /** The first reply, as people say it: "1 hour", "Next business day". */
  response: string;
  /** The goal for solving it: "8 hours", "2 business days", "Next release". */
  resolution: string;
}

export interface SlaHours {
  /** "Monday to Friday, 09:00 to 17:00" or "24 hours, every day". */
  label: string;
  /** The IANA zone the hours are in: "Europe/Amsterdam". Leave it out for around the clock. */
  timeZone?: string;
}

export interface SlaPlan {
  /** The plan's name: a column head, or the title of its card on a small screen. */
  name: string;
  /** One short line under the name: "For small teams". */
  description?: string;
  /** Makes the plan's name a link to the plan. */
  href?: string;
  /** One entry per priority, in the order of `priorities`. A null entry says the plan does not cover that priority. */
  rows: readonly (SlaTarget | null)[];
  /** "Email", "Chat", "Phone". */
  channels: readonly string[];
  /** The plan's own support hours; the table-wide `hours` are used when this is left out. */
  hours?: SlaHours;
}

export interface SlaLabels {
  /** Head of the first column. */
  priority: string;
  /** Label for the first response time. */
  response: string;
  /** Label for the target resolution time. */
  resolution: string;
  /** Label of the channels row. */
  channels: string;
  /** Label of the support hours row. */
  hours: string;
  /** Said when a plan does not cover a priority. */
  notIncluded: string;
}

export interface SupportSlaTableProps extends Omit<ComponentProps<"section">, "children"> {
  /** The priority levels, most urgent first. Each one is a row. */
  priorities: readonly SlaPriority[];
  /** The plans to compare. Each is a pair of columns, or a card on a small screen. */
  plans: readonly SlaPlan[];
  /** Support hours shared by every plan that does not set its own. */
  hours?: SlaHours;
  /** Short notes under the table. Say whether times run in business or calendar hours, and what a target is not. */
  notes?: readonly ReactNode[];
  /** The table's caption and its accessible name: "Response and resolution targets by plan". */
  caption?: string;
  /** The level of each plan's heading in the stacked layout on a phone: 3 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Renders the plan links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the column and row labels, for a site that is not in English. */
  labels?: Partial<SlaLabels>;
}

const LABELS: SlaLabels = {
  priority: "Priority",
  response: "First response",
  resolution: "Target resolution",
  channels: "Channels",
  hours: "Support hours",
  notIncluded: "Not included",
};

const zoneName = (zone: string) => zone.replaceAll("_", " ");
const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * What support a customer gets on each plan, as the real table it is: the
 * priorities down the side, each defined in one line, the plans across, and
 * for each plan the first response and the target resolution in tabular
 * numbers, then the channels and the support hours with their time zone.
 * Narrow screens get one card per plan with the very same labels, so
 * nothing hides in a horizontal scroll: the table starts at 768px for two
 * plans, at 1024px for three and at 1280px for more, because every plan takes
 * two columns. Write times the way people say them, and say in a note whether
 * they run in business or calendar hours. For B2B support pages and
 * enterprise sales, where how fast you reply is a term of the contract.
 */
export function SupportSlaTable({
  priorities,
  plans,
  hours,
  notes = [],
  caption,
  headingLevel = 3,
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: SupportSlaTableProps) {
  const labels = { ...LABELS, ...custom };
  const PlanHeading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const hoursOf = (plan: SlaPlan) => plan.hours ?? hours;
  const showHours = plans.some((plan) => hoursOf(plan));
  // Each plan takes two columns, so the table needs more room the more plans it has; until then the cards are easier to read than squeezed cells.
  const swap = plans.length <= 2 ? { table: "md:block", cards: "md:hidden" } : plans.length === 3 ? { table: "lg:block", cards: "lg:hidden" } : { table: "xl:block", cards: "xl:hidden" };
  const planName = (plan: SlaPlan) =>
    plan.href ? (
      <Link href={plan.href} className={cn("rounded-sm underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-current motion-reduce:transition-none", FOCUS)}>
        {plan.name}
      </Link>
    ) : (
      plan.name
    );
  const hoursText = (value: SlaHours | undefined) =>
    value ? (
      <>
        <span className="block">{value.label}</span>
        {value.timeZone ? <span className="mt-0.5 block text-xs text-muted-foreground">{zoneName(value.timeZone)}</span> : null}
      </>
    ) : null;
  const channelChips = (channels: readonly string[]) =>
    channels.length ? (
      <ul role="list" className="flex flex-wrap gap-1.5">
        {channels.map((channel) => (
          <li key={channel} className="max-w-full min-w-0">
            <Badge variant="outline" className="max-w-full truncate">
              {channel}
            </Badge>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <section data-slot="support-sla-table" className={cn("w-full break-words", className)} {...props}>
      <div className={cn("hidden", swap.table)}>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table className="caption-top">
            {caption ? <TableCaption className="mt-0 px-5 pt-5 pb-4 text-left text-base font-medium tracking-[-0.01em] text-foreground">{caption}</TableCaption> : null}
            <TableHeader>
              <TableRow>
                <TableHead rowSpan={2} scope="col" className="w-[22%] pb-3 pl-5 align-bottom">
                  {labels.priority}
                </TableHead>
                {plans.map((plan) => (
                  <TableHead key={plan.name} colSpan={2} scope="colgroup" className="h-auto border-l border-border pt-3 pb-1 whitespace-normal text-foreground">
                    <span className="block text-sm font-medium">{planName(plan)}</span>
                    {plan.description ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{plan.description}</span> : null}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                {plans.map((plan) => (
                  <Fragment key={plan.name}>
                    <TableHead scope="col" className="h-auto border-l border-border pt-1 pb-3 text-xs whitespace-normal">
                      {labels.response}
                    </TableHead>
                    <TableHead scope="col" className="h-auto pt-1 pb-3 text-xs whitespace-normal">
                      {labels.resolution}
                    </TableHead>
                  </Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorities.map((priority, index) => (
                <TableRow key={priority.name}>
                  <TableHead scope="row" className="h-auto py-4 pl-5 align-top font-normal whitespace-normal text-foreground">
                    <span className="block text-sm font-medium">{priority.name}</span>
                    <span className="mt-1 block max-w-[17rem] text-xs leading-relaxed text-muted-foreground">{priority.definition}</span>
                  </TableHead>
                  {plans.map((plan) => {
                    const target = plan.rows[index];
                    return target ? (
                      <Fragment key={plan.name}>
                        <TableCell className="border-l border-border py-4 align-top font-medium tabular-nums">{target.response}</TableCell>
                        <TableCell className="py-4 align-top tabular-nums">{target.resolution}</TableCell>
                      </Fragment>
                    ) : (
                      <TableCell key={plan.name} colSpan={2} className="border-l border-border py-4 align-top text-muted-foreground">
                        {labels.notIncluded}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              <TableRow>
                <TableHead scope="row" className="h-auto py-4 pl-5 align-top text-sm font-medium whitespace-normal text-foreground">
                  {labels.channels}
                </TableHead>
                {plans.map((plan) => (
                  <TableCell key={plan.name} colSpan={2} className="border-l border-border py-4 align-top">
                    {channelChips(plan.channels)}
                  </TableCell>
                ))}
              </TableRow>
              {showHours ? (
                <TableRow>
                  <TableHead scope="row" className="h-auto py-4 pl-5 align-top text-sm font-medium whitespace-normal text-foreground">
                    {labels.hours}
                  </TableHead>
                  {plans.map((plan) => (
                    <TableCell key={plan.name} colSpan={2} className="border-l border-border py-4 align-top">
                      {hoursText(hoursOf(plan))}
                    </TableCell>
                  ))}
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className={swap.cards}>
        {caption ? <p className="mb-4 text-base font-medium tracking-[-0.01em]">{caption}</p> : null}
        <ul role="list" className="grid grid-cols-1 gap-4">
          {plans.map((plan) => (
            <li key={plan.name} className="rounded-xl border border-border bg-card p-5">
              <PlanHeading className="text-lg leading-snug font-medium tracking-[-0.02em]">{planName(plan)}</PlanHeading>
              {plan.description ? <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p> : null}
              <ul role="list" className="mt-4 divide-y divide-border border-t border-border">
                {priorities.map((priority, index) => {
                  const target = plan.rows[index];
                  return (
                    <li key={priority.name} className="py-4">
                      <p className="text-sm font-medium">{priority.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{priority.definition}</p>
                      {target ? (
                        <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                          <dt className="text-muted-foreground">{labels.response}</dt>
                          <dd className="font-medium tabular-nums">{target.response}</dd>
                          <dt className="text-muted-foreground">{labels.resolution}</dt>
                          <dd className="tabular-nums">{target.resolution}</dd>
                        </dl>
                      ) : (
                        <p className="mt-3 text-sm text-muted-foreground">{labels.notIncluded}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
              <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm">
                <div className="grid grid-cols-1 gap-1.5">
                  <dt className="text-muted-foreground">{labels.channels}</dt>
                  <dd>{channelChips(plan.channels)}</dd>
                </div>
                {hoursOf(plan) ? (
                  <div className="grid grid-cols-1 gap-1.5">
                    <dt className="text-muted-foreground">{labels.hours}</dt>
                    <dd>{hoursText(hoursOf(plan))}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      </div>

      {notes.length ? (
        <ul role="list" className="mt-6 grid grid-cols-1 gap-2.5">
          {notes.map((note, index) => (
            <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
