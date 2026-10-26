import type { ComponentProps, ReactNode } from "react";

import { IconArrowUpRight, IconCheck, IconClock, IconMail, IconMessage, IconPhone, IconShieldAlert, IconShieldCheck, IconShieldX } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export type ConformanceStatus = "full" | "partial" | "none";

export interface DatedLabel {
  /** The date as it reads on the page: "12 September 2026". */
  label: string;
  /** The same day as an ISO date, for the time element: "2026-09-12". */
  dateTime?: string;
}

export interface AccessibilityLimitation {
  /** The part of the site that is affected: "Captions on older videos". */
  area: string;
  /** What goes wrong and for whom, in plain words. */
  issue: string;
  /** What a person can do in the meantime. */
  workaround?: string;
  /** When it will be fixed. A plain string works; pass the object to get a time element. */
  fixBy?: string | DatedLabel;
}

export interface AccessibilityContact {
  /** Shown as a mailto: link. */
  email: string;
  /** Shown as a tel: link. */
  phone?: string;
  /** A feedback form, next to the address. */
  form?: { href: string; label: string };
  /** How fast you answer: "We reply within five working days." */
  responseTime?: string;
  /** A line before the details: what helps you fix it, such as the page, the device and the assistive technology. */
  note?: ReactNode;
}

export interface AccessibilityEnforcement {
  /** The body that handles complaints: "the Dutch Authority for Digital Infrastructure". */
  body: string;
  /** The body's own page about complaints. */
  href?: string;
  /** When and how to escalate: "If our answer does not solve it, you can complain to ...". */
  text?: ReactNode;
}

export interface AccessibilityStatementLabels {
  /** What each status says about the standard. It is the middle of the heading: "partially conforms with". */
  conformance: Record<ConformanceStatus, string>;
  /** Writes the heading of the panel. The status is in these words, so it never depends on a badge. */
  heading: (subject: string, conformance: string, standard: string, level: string) => string;
  /** The sentence under the heading, per status. */
  summary: Record<ConformanceStatus, string>;
  /** Term for the standard. */
  standard: string;
  /** Term for the conformance level. */
  level: string;
  /** Term for the assessment date. */
  assessed: string;
  /** Term for how it was tested. */
  method: string;
  /** Heading of the list of what works. */
  works: string;
  /** Heading of the list of known limitations. */
  limitations: string;
  /** Said when there are no known limitations. */
  noLimitations: string;
  /** Term for what is wrong. */
  problem: string;
  /** Term for the workaround. */
  workaround: string;
  /** Term for the planned fix date. */
  fixBy: string;
  /** Heading of the technologies. */
  technologies: string;
  /** Heading of the section on reporting a problem. */
  report: string;
  /** Heading of the enforcement section. */
  enforcement: string;
}

export interface AccessibilityStatementProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** What the statement covers, as the start of the heading: "This website" or "northwind.example". */
  subject?: string;
  /** The standard assessed against: "WCAG 2.2". */
  standard: string;
  /** The level aimed for: "AA". */
  level: string;
  /** Where the site stands. It is written out in the heading. */
  status: ConformanceStatus;
  /** When it was assessed. A statement without a date cannot be trusted. */
  assessed: DatedLabel;
  /** How it was tested: "Self-assessment with automated checks and manual tests with NVDA and VoiceOver". */
  method: string;
  /** What works, one statement each. */
  works?: readonly string[];
  /** What does not, with a workaround and a date. Pass an empty list to say there are none. */
  limitations?: readonly AccessibilityLimitation[];
  /** The technologies the site relies on: "HTML", "WAI-ARIA", "CSS", "JavaScript". */
  technologies?: readonly string[];
  /** How to report a problem. */
  contact: AccessibilityContact;
  /** Who to turn to when your answer is not enough. */
  enforcement?: AccessibilityEnforcement;
  /** The page's own heading: "Accessibility statement". */
  title?: string;
  /** A line under the title. */
  description?: ReactNode;
  /** The level of the title. The status heading and the section headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the headings and terms, for a site that is not in English. */
  labels?: Partial<AccessibilityStatementLabels>;
}

const LABELS: AccessibilityStatementLabels = {
  conformance: { full: "fully conforms with", partial: "partially conforms with", none: "does not conform with" },
  heading: (subject, conformance, standard, level) => `${subject} ${conformance} ${standard} level ${level}`,
  summary: {
    full: "Every page we assessed meets the requirements.",
    partial: "Most of the site meets the requirements. What does not is listed below, with a workaround and a date for each.",
    none: "The site does not meet the requirements yet. What we know is listed below, with the work we are doing about it.",
  },
  standard: "Standard",
  level: "Level",
  assessed: "Assessed on",
  method: "How we tested",
  works: "What works",
  limitations: "Known limitations",
  noLimitations: "We know of no limitations at the moment.",
  problem: "Problem",
  workaround: "Workaround",
  fixBy: "Planned fix",
  technologies: "Technologies we rely on",
  report: "Report a problem",
  enforcement: "If you are not satisfied",
};

const STATUS_ICON = { full: IconShieldCheck, partial: IconShieldAlert, none: IconShieldX } as const;

const LINK =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

function Dated({ value }: { value: string | DatedLabel }): ReactNode {
  if (typeof value === "string") return value;
  return value.dateTime ? <time dateTime={value.dateTime}>{value.label}</time> : value.label;
}

/**
 * The accessibility statement a site is expected to publish, kept honest by
 * a date. A panel opens the page with the verdict written into its heading
 * ("This website partially conforms with WCAG 2.2 level AA"), so the status
 * never depends on a badge or a colour, then the standard, the level, the day
 * it was assessed and how. Under it come what works, the known limitations
 * with a workaround and a planned fix date each, the technologies relied on,
 * how to report a problem and who to turn to when the answer is not enough.
 * It follows the structure of the European model statement.
 */
export function AccessibilityStatement({
  subject = "This website",
  standard,
  level,
  status,
  assessed,
  method,
  works,
  limitations,
  technologies,
  contact,
  enforcement,
  title,
  description,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: AccessibilityStatementProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const StatusIcon = STATUS_ICON[status];

  const section = (key: string, heading: string, children: ReactNode) => (
    <section key={key} className="grid grid-cols-1 gap-x-12 gap-y-4 border-t border-border py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <Sub className="text-base leading-snug font-medium tracking-[-0.01em]">
        {heading}
      </Sub>
      <div className="max-w-2xl min-w-0">{children}</div>
    </section>
  );

  const facts: DescriptionItem[] = [
    { term: labels.standard, value: standard },
    { term: labels.level, value: level },
    // A date does not split across two lines.
    { term: labels.assessed, value: <span className="whitespace-nowrap"><Dated value={assessed} /></span> },
  ];

  return (
    <section data-slot="accessibility-statement" data-status={status} className={cn("w-full break-words", className)} {...props}>
      {title || description ? (
        <header className="mb-10 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <div className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</div> : null}
        </header>
      ) : null}

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:gap-6 sm:p-8">
          <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted">
            <StatusIcon className="size-6" />
          </span>
          <div className="min-w-0">
            <Sub className="text-2xl leading-[1.15] font-medium tracking-[-0.03em] text-balance sm:text-3xl">
              {labels.heading(subject, labels.conformance[status], standard, level)}
            </Sub>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{labels.summary[status]}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 border-t border-border p-6 sm:p-8">
          {/* On a phone the facts sit in two columns and the date, the last one, takes the whole row below them. */}
          <DescriptionList layout="grid" items={facts} className="tabular-nums [overflow-wrap:anywhere] max-sm:[&>div:last-child]:col-span-2" />
          <DescriptionList layout="stacked" className="[overflow-wrap:anywhere]" items={[{ term: labels.method, value: <span className="block max-w-2xl text-sm leading-relaxed font-normal">{method}</span> }]} />
        </div>
      </section>

      <div className="mt-6">
        {works?.length
          ? section(
              "works",
              labels.works,
              <ul role="list" className="grid grid-cols-1 gap-3">
                {works.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed">
                    <IconCheck aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>,
            )
          : null}

        {limitations
          ? section(
              "limitations",
              labels.limitations,
              limitations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{labels.noLimitations}</p>
              ) : (
                <ul role="list" className="divide-y divide-border">
                  {limitations.map((item) => (
                    <li key={item.area} className="py-6 first:pt-0 last:pb-0">
                      <p className="text-base leading-snug font-medium tracking-[-0.01em]">{item.area}</p>
                      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                        <dt className="text-muted-foreground">{labels.problem}</dt>
                        <dd className="leading-relaxed">{item.issue}</dd>
                        {item.workaround ? (
                          <>
                            <dt className="text-muted-foreground">{labels.workaround}</dt>
                            <dd className="leading-relaxed">{item.workaround}</dd>
                          </>
                        ) : null}
                        {item.fixBy ? (
                          <>
                            <dt className="text-muted-foreground">{labels.fixBy}</dt>
                            <dd className="font-medium tabular-nums">
                              <Dated value={item.fixBy} />
                            </dd>
                          </>
                        ) : null}
                      </dl>
                    </li>
                  ))}
                </ul>
              ),
            )
          : null}

        {technologies?.length
          ? section(
              "technologies",
              labels.technologies,
              <ul role="list" className="flex flex-wrap gap-2">
                {technologies.map((item) => (
                  <li key={item}>
                    <Badge variant="outline" className="h-auto min-h-6 max-w-full px-2.5 py-0.5 text-left text-[0.8125rem] whitespace-normal [overflow-wrap:anywhere]">
                      {item}
                    </Badge>
                  </li>
                ))}
              </ul>,
            )
          : null}

        {section(
          "report",
          labels.report,
          <>
            {contact.note ? <div className="mb-4 text-[0.9375rem] leading-relaxed text-muted-foreground">{contact.note}</div> : null}
            <ul role="list" className="grid grid-cols-1 gap-3 text-[0.9375rem]">
              <li className="flex items-start gap-3">
                <IconMail aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <a href={`mailto:${contact.email}`} className={cn("[overflow-wrap:anywhere]", LINK)}>
                  {contact.email}
                </a>
              </li>
              {contact.phone ? (
                <li className="flex items-start gap-3">
                  <IconPhone aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className={cn("tabular-nums", LINK)}>
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.form ? (
                <li className="flex items-start gap-3">
                  <IconMessage aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <a href={contact.form.href} className={LINK}>
                    {contact.form.label}
                  </a>
                </li>
              ) : null}
              {contact.responseTime ? (
                <li className="flex items-start gap-3">
                  <IconClock aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 leading-relaxed text-muted-foreground">{contact.responseTime}</span>
                </li>
              ) : null}
            </ul>
          </>,
        )}

        {enforcement
          ? section(
              "enforcement",
              labels.enforcement,
              <div className="text-[0.9375rem] leading-relaxed">
                {enforcement.text ? <div className="text-muted-foreground">{enforcement.text}</div> : null}
                <p className={cn(enforcement.text && "mt-3")}>
                  {enforcement.href ? (
                    <a href={enforcement.href} className={cn("font-medium", LINK)}>
                      {enforcement.body}
                      <IconArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5 align-[-0.1em] text-muted-foreground" />
                    </a>
                  ) : (
                    <span className="font-medium">{enforcement.body}</span>
                  )}
                </p>
              </div>,
            )
          : null}
      </div>
    </section>
  );
}
