import type { ComponentProps } from "react";

import { IconArrowRight, IconClock } from "@rhs-ui/icons";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export interface SupportLevel {
  /** The level as people write it in a ticket: "P1". */
  priority: string;
  /** What it is called: "Critical". Leave it out when the code says enough. */
  name?: string;
  /** One sentence that says when a case gets this level, exact enough that you could argue about it: "Production is down for every user and there is no workaround." */
  definition: string;
  /** How long until a person replies: "15 minutes". */
  firstResponse: string;
  /** How often you hear back until it is solved: "Every hour". */
  updates: string;
  /** Where you can reach us at this level: "Phone, chat and email", or a list. */
  channels?: string | readonly string[];
}

export interface AvailabilityLevel {
  /** The plan the target belongs to: "Business". Leave it out when one target covers everyone. */
  plan?: string;
  /** The uptime we commit to in a month: "99.95%". */
  target: string;
  /** What that target allows per month: "21 minutes". Say it as time, so the percentage means something. */
  downtimePerMonth: string;
  /** What you get when we miss it: "10% of the month's fee". */
  credit: string;
}

export interface ServiceLevelsLabels {
  /** The support table's title. */
  supportTitle: string;
  /** One line under the support table's title. */
  supportDescription: string;
  /** The availability table's title. */
  availabilityTitle: string;
  /** One line under the availability table's title. */
  availabilityDescription: string;
  /** Column and row label of the support table. */
  priority: string;
  /** Column and row label of the support table. */
  firstResponse: string;
  /** Column and row label of the support table. */
  updates: string;
  /** Column and row label of the support table. */
  channels: string;
  /** Column and row label of the availability table. */
  target: string;
  /** Column and row label of the availability table. */
  downtime: string;
  /** Column and row label of the availability table. */
  credit: string;
  /** The label before the support hours. */
  hours: string;
  /** The link to the full agreement, when `slaHref` is set. */
  sla: string;
}

export interface ServiceLevelsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Service levels". */
  eyebrow?: string;
  /** The heading: "Commitments, not adjectives". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The support levels, most urgent first. */
  support: readonly SupportLevel[];
  /** The uptime targets, strictest first. */
  availability: readonly AvailabilityLevel[];
  /** When the support levels apply, as people say it: "P1 around the clock, every day. P2 and P3 on business days from 08:00 to 18:00 (Europe/Amsterdam)." */
  hours?: string;
  /** The full agreement. It becomes a link beside the heading. */
  slaHref?: string;
  /** The level of the heading: 2 by default. The title of each table sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ServiceLevelsLabels>;
}

const LABELS: ServiceLevelsLabels = {
  supportTitle: "Support response",
  supportDescription: "Measured from the moment you report the issue to a person replying.",
  availabilityTitle: "Availability",
  availabilityDescription: "The share of each month the service is up, and what you get if it is not.",
  priority: "Priority",
  firstResponse: "First response",
  updates: "Updates",
  channels: "Channels",
  target: "Uptime target",
  downtime: "Downtime allowed",
  credit: "Service credit",
  hours: "Support hours",
  sla: "Read the full agreement",
};

const channelText = (channels: SupportLevel["channels"]): string => (channels === undefined ? "" : typeof channels === "string" ? channels : channels.join(", "));

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** The priority as a tag: the code in monospace on its own tile, so P1, P2 and P3 line up and read as names. */
function Priority({ level }: { level: SupportLevel }): React.JSX.Element {
  return (
    <span className="flex items-center gap-2.5">
      <span className="inline-grid h-6 min-w-8 place-items-center rounded-md border border-foreground px-1.5 font-mono text-xs font-semibold tabular-nums">{level.priority}</span>
      {level.name ? <span className="text-sm font-medium">{level.name}</span> : null}
    </span>
  );
}

/**
 * What a buyer can hold you to, in two compact tables: how fast people answer
 * at each priority, and how much downtime a month the uptime target allows
 * and what you owe if it is missed. It replaces "24/7 support" with numbers.
 * Every priority is defined in a sentence exact enough to argue about, the
 * percentage is translated into minutes, and every figure is tabular. Side by
 * side on a wide block, stacked on a narrower one; on a phone both tables
 * become lists of cards with the very same labels under the same titles, so
 * nothing hides in a horizontal scroll. Both are real tables with captions,
 * and a line under them says when support applies. No state and no script: it
 * renders on the server.
 */
export function ServiceLevels({ eyebrow, title, description, support, availability, hours, slaHref, headingLevel = 2, labels: custom, className, ...props }: ServiceLevelsProps) {
  const labels = { ...LABELS, ...custom };
  const TableTitle = `h${headingLevel + 1}` as "h3" | "h4";
  const showPlans = availability.some((level) => level.plan);

  return (
    <section data-slot="service-levels" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        as={headingLevel === 3 ? "h3" : "h2"}
        action={
          slaHref ? (
            <a href={slaHref} className={LINK}>
              {labels.sla}
              <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          ) : undefined
        }
      />

      {/*
        Side by side only from 76rem, the inside of a page container of 80rem with its padding. Narrower than that the
        support table's definition column is about 200px, so its definitions run to four lines, and the availability
        table wraps its headings and credits: the two tables stack instead and each gets the whole width.
      */}
      <div className="mt-10 grid items-start gap-6 @3xl:mt-12 @[76rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Support. The panel measures itself: a table when it is wide enough to read, cards when it is not. */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="px-5 pt-5 pb-4">
              <TableTitle className="text-lg leading-snug font-medium tracking-[-0.02em]">{labels.supportTitle}</TableTitle>
              <p className="mt-1 text-sm text-muted-foreground">{labels.supportDescription}</p>
            </header>

            <div className="hidden border-t border-border @xl:block">
              <Table>
                <TableCaption className="sr-only">{labels.supportTitle}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="h-auto w-[30%] py-3 pl-5 align-bottom text-xs whitespace-normal">
                      {labels.priority}
                    </TableHead>
                    <TableHead scope="col" className="h-auto w-[20%] py-3 align-bottom text-xs whitespace-normal">
                      {labels.firstResponse}
                    </TableHead>
                    <TableHead scope="col" className="h-auto w-[25%] py-3 align-bottom text-xs whitespace-normal">
                      {labels.updates}
                    </TableHead>
                    <TableHead scope="col" className="h-auto py-3 pr-5 align-bottom text-xs whitespace-normal">
                      {labels.channels}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {support.map((level, index) => (
                    <TableRow key={`${index}-${level.priority}`} className="hover:bg-transparent">
                      <TableHead scope="row" className="h-auto py-4 pl-5 align-top font-normal whitespace-normal text-foreground">
                        <Priority level={level} />
                        <span className="mt-2 block text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground">{level.definition}</span>
                      </TableHead>
                      <TableCell className="py-4 align-top text-[0.9375rem] font-medium tabular-nums">{level.firstResponse}</TableCell>
                      <TableCell className="py-4 align-top text-sm tabular-nums">{level.updates}</TableCell>
                      <TableCell className="py-4 pr-5 align-top text-sm text-muted-foreground">{channelText(level.channels)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul role="list" className="divide-y divide-border border-t border-border @xl:hidden">
              {support.map((level, index) => (
                <li key={`${index}-${level.priority}`} className="px-5 py-4">
                  <Priority level={level} />
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground">{level.definition}</p>
                  <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-5 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">{labels.firstResponse}</dt>
                    <dd className="font-medium tabular-nums">{level.firstResponse}</dd>
                    <dt className="text-muted-foreground">{labels.updates}</dt>
                    <dd className="tabular-nums">{level.updates}</dd>
                    {level.channels !== undefined ? (
                      <>
                        <dt className="text-muted-foreground">{labels.channels}</dt>
                        <dd>{channelText(level.channels)}</dd>
                      </>
                    ) : null}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Availability, in the same two shapes. */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="px-5 pt-5 pb-4">
              <TableTitle className="text-lg leading-snug font-medium tracking-[-0.02em]">{labels.availabilityTitle}</TableTitle>
              <p className="mt-1 text-sm text-muted-foreground">{labels.availabilityDescription}</p>
            </header>

            <div className="hidden border-t border-border @xl:block">
              <Table>
                <TableCaption className="sr-only">{labels.availabilityTitle}</TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="col" className="h-auto w-[30%] py-3 pl-5 align-bottom text-xs whitespace-normal">
                      {labels.target}
                    </TableHead>
                    <TableHead scope="col" className="h-auto w-[30%] py-3 align-bottom text-xs whitespace-normal">
                      {labels.downtime}
                    </TableHead>
                    <TableHead scope="col" className="h-auto py-3 pr-5 align-bottom text-xs whitespace-normal">
                      {labels.credit}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availability.map((level, index) => (
                    <TableRow key={`${index}-${level.target}`} className="hover:bg-transparent">
                      <TableHead scope="row" className="h-auto py-4 pl-5 align-top font-normal whitespace-normal text-foreground">
                        <span className="block text-[0.9375rem] font-medium tabular-nums">{level.target}</span>
                        {showPlans && level.plan ? <span className="mt-0.5 block text-xs text-muted-foreground">{level.plan}</span> : null}
                      </TableHead>
                      <TableCell className="py-4 align-top text-sm tabular-nums">{level.downtimePerMonth}</TableCell>
                      <TableCell className="py-4 pr-5 align-top text-sm text-muted-foreground">{level.credit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul role="list" className="divide-y divide-border border-t border-border @xl:hidden">
              {availability.map((level, index) => (
                <li key={`${index}-${level.target}`} className="px-5 py-4">
                  <p className="flex items-baseline gap-2.5">
                    <span className="text-[0.9375rem] font-medium tabular-nums">{level.target}</span>
                    {showPlans && level.plan ? <span className="text-xs text-muted-foreground">{level.plan}</span> : null}
                  </p>
                  <dl className="mt-3 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-5 gap-y-1.5 text-sm">
                    <dt className="text-muted-foreground">{labels.downtime}</dt>
                    <dd className="tabular-nums">{level.downtimePerMonth}</dd>
                    <dt className="text-muted-foreground">{labels.credit}</dt>
                    <dd>{level.credit}</dd>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {hours ? (
        <p className="mt-6 flex items-start gap-2.5 text-sm leading-relaxed">
          <IconClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="font-medium">{labels.hours}.</span> <span className="text-muted-foreground">{hours}</span>
          </span>
        </p>
      ) : null}
    </section>
  );
}
