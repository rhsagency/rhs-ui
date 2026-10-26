"use client";

import { useEffect, useId, useMemo, useState, type ComponentProps } from "react";

import { IconClock, IconMail, IconNavigation, IconPhone, IconPin } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";
import { WEEKDAYS, clockText, fill, hoursRanges, openingStatus, weekdayName, zoneName, zonedClock, type OpeningStatus } from "@rhs-ui/marketing/office-list/hours";
import type { Office, OfficeListLabels, OfficeListLayout, Weekday } from "@rhs-ui/marketing/office-list/types";

export type { Office, OfficeHoursRange, OfficeListLabels, OfficeListLayout, Weekday } from "@rhs-ui/marketing/office-list/types";

export interface OfficeListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** Every office, in the order you want them shown. */
  offices: readonly Office[];
  /** The heading: "Find us". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** "list" shows every office at once; "tabs" shows one at a time, with its map beside it. List by default. */
  layout?: OfficeListLayout;
  /** The language of weekday names and of the time zone in words. "en-US" by default. */
  locale?: string;
  /**
   * The moment the open-now lines are worked out for. Leave it out and they follow the reader's clock, which is
   * known only after the page has mounted, so server and browser never disagree. Pass it to pin the lines for a
   * test or a screenshot.
   */
  now?: Date | string | number;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<OfficeListLabels>;
}

const LABELS: OfficeListLabels = {
  open: "Open now",
  closed: "Closed",
  until: "until {time}",
  opensAt: "opens at {time}",
  opensTomorrow: "opens tomorrow at {time}",
  opensOn: "opens {day} at {time}",
  to: "to",
  today: "today",
  hours: "Opening hours",
  zone: "Times are in {zone}.",
  localTime: "It is {time} there now.",
  directions: "Directions",
  directionsTo: "Directions to {city}",
};

const LINK =
  "rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** The reader's clock, known only after mount; a fixed moment is used as it is. */
function useNow(fixed: OfficeListProps["now"]): Date | null {
  const [current, setCurrent] = useState<Date | null>(null);
  useEffect(() => {
    if (fixed !== undefined) return undefined;
    const tick = () => setCurrent(new Date());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [fixed]);
  return fixed !== undefined ? new Date(fixed) : current;
}

function statusDetail(status: OpeningStatus, labels: OfficeListLabels, locale: string): string {
  if (status.open) return fill(labels.until, { time: status.until ?? "" });
  const next = status.next;
  if (!next) return "";
  if (next.day === "today") return fill(labels.opensAt, { time: next.time });
  if (next.day === "tomorrow") return fill(labels.opensTomorrow, { time: next.time });
  return fill(labels.opensOn, { day: weekdayName(next.day, locale), time: next.time });
}

/** Open or closed, in words with a dot beside them. It stays an empty line until the clock is known, so nothing jumps. */
function Status({ status, labels, locale }: { status: OpeningStatus | null; labels: OfficeListLabels; locale: string }) {
  if (!status) return <p aria-hidden="true" className="h-5" />;
  const detail = statusDetail(status, labels, locale);
  return (
    <p className="flex items-center gap-2.5 text-sm">
      <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", status.open ? "bg-foreground ring-4 ring-foreground/15" : "border border-muted-foreground")} />
      <span>
        <span className="font-medium">{status.open ? labels.open : labels.closed}</span>
        {detail ? <span className="text-muted-foreground">, {detail}</span> : null}
      </span>
    </p>
  );
}

/** The postal address, the phone and the email as one address element, with the directions beside them. */
function Contact({ office, labels }: { office: Office; labels: OfficeListLabels }) {
  const row = "flex items-start gap-3 [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
  return (
    <div>
      <address className="grid gap-3 text-sm leading-relaxed not-italic">
        <div className={row}>
          <IconPin aria-hidden="true" />
          <div className="min-w-0">
            {office.address.map((line, index) => (
              <span key={`${index}-${line}`} className="block">
                {line}
              </span>
            ))}
          </div>
        </div>
        {office.phone ? (
          <div className={row}>
            <IconPhone aria-hidden="true" />
            <a href={`tel:${office.phone.replace(/[^\d+]/g, "")}`} className={cn(LINK, "tabular-nums")}>
              {office.phone}
            </a>
          </div>
        ) : null}
        {office.email ? (
          <div className={row}>
            <IconMail aria-hidden="true" />
            <a href={`mailto:${office.email}`} className={cn(LINK, "min-w-0 break-all")}>
              {office.email}
            </a>
          </div>
        ) : null}
      </address>
      {office.directionsHref ? (
        <Button asChild variant="outline" size="sm" className="mt-5">
          <a href={office.directionsHref} aria-label={fill(labels.directionsTo, { city: office.city })}>
            <IconNavigation />
            {labels.directions}
          </a>
        </Button>
      ) : null}
    </div>
  );
}

/** The week with today marked in words and weight, and the time zone said in words under it. */
function Hours({ office, now, labels, locale, names }: { office: Office; now: Date | null; labels: OfficeListLabels; locale: string; names: Record<Weekday, string> }) {
  const clock = now ? zonedClock(now, office.timeZone) : null;
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.hours}</p>
      <dl className="mt-3 grid gap-0.5 text-sm">
        {WEEKDAYS.map((day) => {
          const ranges = hoursRanges(office.hours, day, labels.to);
          const today = clock?.day === day;
          return (
            <div key={day} className={cn("flex justify-between gap-4 rounded-md px-2.5 py-1", today && "bg-muted font-medium")}>
              <dt>
                {names[day]}
                {today ? <span className="sr-only"> ({labels.today})</span> : null}
              </dt>
              {/* Every range is a line of its own that never breaks, so a day with a lunch break stacks as two clean lines at any width instead of wrapping in the middle of a time. */}
              <dd className={cn("text-right tabular-nums", ranges.length === 0 && "text-muted-foreground")}>
                {ranges.length === 0
                  ? labels.closed
                  : ranges.map((range, index) => (
                      <span key={`${index}-${range}`} className="block whitespace-nowrap">
                        {range}
                        {index < ranges.length - 1 ? <span className="sr-only">,</span> : null}
                      </span>
                    ))}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="mt-3.5 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <IconClock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {fill(labels.zone, { zone: zoneName(office.timeZone, locale) })}
          {now ? ` ${fill(labels.localTime, { time: clockText(now, office.timeZone, locale) })}` : ""}
        </span>
      </p>
    </div>
  );
}

/**
 * Every office of a company with several places: city as the heading, a real
 * address element, a tap-to-call phone and a mail link, directions, and the
 * week of opening hours with an open-now line worked out in each office's own
 * time zone, so a visitor in Amsterdam sees that New York is not open yet.
 * Shown as a list, every office at once, or as tabs with a map beside the
 * details. The open-now lines are computed after mount, because the server
 * does not know the reader's clock; until then they are an empty line, and
 * every office states its time zone in words. For companies with several
 * locations, franchises and clinics.
 */
export function OfficeList({ offices, title, description, layout = "list", locale = "en-US", now: fixed, headingLevel = 2, labels: custom, className, ...props }: OfficeListProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const now = useNow(fixed);
  const names = useMemo(() => Object.fromEntries(WEEKDAYS.map((day) => [day, weekdayName(day, locale)])) as Record<Weekday, string>, [locale]);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const City = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const statusOf = (office: Office) => (now ? openingStatus(office.hours, now, office.timeZone) : null);

  const header = (office: Office) => (
    <div className="min-w-0">
      <City className="text-2xl leading-tight font-medium tracking-[-0.03em]">{office.city}</City>
      {office.name ? <p className="mt-1 text-sm text-muted-foreground">{office.name}</p> : null}
      <div className="mt-4">
        <Status status={statusOf(office)} labels={labels} locale={locale} />
      </div>
    </div>
  );

  return (
    <section data-slot="office-list" data-layout={layout} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      {layout === "tabs" ? (
        <Tabs defaultValue={offices[0]?.id} className="mt-10 gap-6 @3xl:mt-12">
          <div className="relative -mx-1 overflow-x-auto px-1">
            <TabsList aria-label={title} className="w-full min-w-max">
              {offices.map((office) => (
                <TabsTrigger key={office.id} value={office.id}>
                  {office.city}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {offices.map((office) => (
            <TabsContent key={office.id} value={office.id} className="rounded-2xl border border-border bg-card p-6 focus-visible:ring-[3px] focus-visible:ring-ring/40 @3xl:p-8">
              <div className={cn("grid gap-x-10 gap-y-8", office.map ? "@3xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : "@3xl:grid-cols-2")}>
                <div className="min-w-0">
                  {header(office)}
                  <div className="mt-6">
                    <Contact office={office} labels={labels} />
                  </div>
                  {office.map ? (
                    <div className="mt-8 border-t border-border pt-6">
                      <Hours office={office} now={now} labels={labels} locale={locale} names={names} />
                    </div>
                  ) : null}
                </div>
                {office.map ? (
                  <div className="relative min-h-72 overflow-hidden rounded-xl border border-border bg-muted">{office.map}</div>
                ) : (
                  <Hours office={office} now={now} labels={labels} locale={locale} names={names} />
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <ul role="list" className="mt-10 divide-y divide-border border-y border-border @3xl:mt-12">
          {offices.map((office) => (
            <li key={office.id} className="grid gap-x-12 gap-y-7 py-9 @2xl:grid-cols-2 @4xl:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,22rem)] @4xl:py-10">
              {/* On a wide row the city and the contact details are two columns of their own; below that they share one. */}
              <div className="grid min-w-0 content-start gap-7 @4xl:contents">
                {header(office)}
                <Contact office={office} labels={labels} />
              </div>
              <Hours office={office} now={now} labels={labels} locale={locale} names={names} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
