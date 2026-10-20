import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowUpRight, IconCheck, IconClock, IconClose, IconLink, IconLock, IconMail, IconMessageText, IconPhone } from "@rhs-ui/icons";
import { Callout } from "@rhs-ui/primitives/callout";
import { cn } from "@/lib/utils";

export interface ConductBehaviour {
  /** The behaviour in a few words: "Assume good intent". */
  title: string;
  /** One line that shows what it looks like: "Ask what someone meant before you answer what you heard." */
  example: string;
}

export interface ConductConsequence {
  /** "Warning", "Temporary ban", "Permanent ban". */
  title: string;
  /** What happens at this step, and what the person can do about it. */
  description: string;
}

export interface ConductReport {
  /** Where a report goes: an email address as a mailto: link, or a form. */
  contact: { label: string; href: string };
  /** How fast someone answers: "Within 48 hours, weekends included." */
  response: string;
  /** What happens to the reporter's identity. */
  confidentiality: string;
}

export interface ConductLabels {
  /** Heading of the list of expected behaviour. */
  expected: string;
  /** Heading of the list of behaviour that is not accepted. */
  unacceptable: string;
  /** Heading of the reporting panel. */
  reporting: string;
  /** Heading of the ladder of consequences. */
  consequences: string;
  /** Title of the scope note. */
  scope: string;
  /** Label for the reporting contact. */
  contact: string;
  /** Label for the response time. */
  response: string;
  /** Label for the confidentiality promise. */
  confidentiality: string;
  /** The lead-in to the contact right under the promise. */
  quickReport: string;
  /** The link from that line down to the reporting panel. */
  howHandled: string;
  /** The accessible name of the permalink on each heading; the heading's title follows it. */
  permalink: string;
  /** The words before the date. */
  updated: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
}

export interface CodeOfConductProps extends Omit<ComponentProps<"article">, "title" | "children"> {
  /** The page's own heading, when the page has no other: "Code of conduct". */
  title?: string;
  /** The promise: two or three sentences on what you want the place to be. */
  promise: ReactNode;
  /** What you expect from everyone. */
  expected: readonly ConductBehaviour[];
  /** What you do not accept, in the same shape. */
  unacceptable: readonly ConductBehaviour[];
  /** How to report, how fast you answer and who will know. */
  report: ConductReport;
  /** The ladder of consequences, mildest first. */
  consequences: readonly ConductConsequence[];
  /** Where and when the code applies. Set apart as a note. */
  scope?: ReactNode;
  /** When the code last changed, as an ISO date: "2026-09-12". */
  updated?: string;
  /** The level of the title. The sections sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Prefix of the section anchors, so moderators can link to a clause: #conduct-reporting. */
  idPrefix?: string;
  /** Words for the headings and labels, for a community that is not in English. */
  labels?: Partial<ConductLabels>;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: ConductLabels = {
  expected: "Expected",
  unacceptable: "Not accepted",
  reporting: "Reporting",
  consequences: "What happens next",
  scope: "Where this applies",
  contact: "Contact",
  response: "Response time",
  confidentiality: "Confidentiality",
  quickReport: "Need to report something?",
  howHandled: "How reports are handled",
  permalink: "Link to this section",
  updated: "Last updated",
  newTab: "(opens in a new tab)",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
const PILL = cn(
  "inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-muted motion-reduce:transition-none",
  FOCUS,
);
const LINK = cn("rounded-sm underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-current motion-reduce:transition-none", FOCUS);

type Tag = "h1" | "h2" | "h3" | "h4";

/** A section heading with a permalink that shows on hover and focus, so a moderator can copy the link to a clause. */
function SectionHeading({ as: Heading, id, title, permalink }: { as: Tag; id: string; title: string; permalink: string }) {
  return (
    <div className="group/heading flex items-center gap-1.5">
      <Heading className="min-w-0 text-xl leading-snug font-medium tracking-[-0.03em]">{title}</Heading>
      <a
        href={`#${id}`}
        aria-label={`${permalink}: ${title}`}
        className={cn(
          "grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-[opacity,color] duration-150 hover:text-foreground focus-visible:opacity-100 group-hover/heading:opacity-100 pointer-coarse:opacity-70 motion-reduce:transition-none",
          FOCUS,
        )}
      >
        <IconLink className="size-4" />
      </a>
    </div>
  );
}

/** One list of behaviours: a heading with a permalink, then each behaviour with a check or a cross and its one-line example. Every behaviour has its own anchor. */
function BehaviourList({ as, id, title, items, allowed, permalink }: { as: Tag; id: string; title: string; items: readonly ConductBehaviour[]; allowed: boolean; permalink: string }) {
  if (!items.length) return null;
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-border bg-card p-6 sm:p-8">
      <SectionHeading as={as} id={id} title={title} permalink={permalink} />
      <ul role="list" className="mt-6 grid grid-cols-1 gap-5">
        {items.map((item) => (
          <li key={item.title} id={`${id}-${slug(item.title)}`} className="flex scroll-mt-24 gap-3.5">
            <span
              aria-hidden="true"
              className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", allowed ? "bg-foreground text-background" : "border border-foreground/40 text-foreground")}
            >
              {allowed ? <IconCheck className="size-3.5" /> : <IconClose className="size-3.5" />}
            </span>
            <div className="min-w-0">
              <p className="text-[0.9375rem] leading-6 font-medium">{item.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{item.example}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A code of conduct people will actually read: a short promise, then what is
 * expected and what is not accepted side by side, each behaviour with a one-line
 * example, how to report with the contact, the response time and the
 * confidentiality promise, and a ladder of consequences as an ordered list. The
 * two lists use words and icons together, never colour alone, and the reporting
 * contact is the first link after the promise, so it is easy to find on a bad
 * day. Every section and every behaviour has an anchor, so a moderator can link
 * to a clause. The layout follows the width of its column, not the screen, so
 * the contact never breaks across lines in a narrow column. For open-source
 * projects, communities, events and clubs.
 */
export function CodeOfConduct({
  title,
  promise,
  expected,
  unacceptable,
  report,
  consequences,
  scope,
  updated,
  headingLevel = 2,
  idPrefix = "conduct",
  labels: custom,
  linkAs: Link = "a",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: CodeOfConductProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Sub = `h${title ? headingLevel + 1 : headingLevel}` as Tag;
  const id = (part: string) => `${idPrefix}-${part}`;

  // The channel decides the icon: an address, a phone number or a form.
  const ContactIcon = /^mailto:/i.test(report.contact.href) ? IconMail : /^tel:/i.test(report.contact.href) ? IconPhone : IconMessageText;

  const contact = (linkClass: string, withIcon = false) => {
    const { href, label } = report.contact;
    const external = /^https?:\/\//i.test(href);
    const content = (
      <>
        {withIcon ? <ContactIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
        <span className="min-w-0">{label}</span>
        {external ? <IconArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" /> : null}
      </>
    );
    // A new tab is shown by the arrow as well as read out. The pill is already a flex row; a text link becomes one so the arrow sits on the label's line.
    const externalClass = cn(linkClass, !withIcon && "inline-flex max-w-full items-center gap-1.5");
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={externalClass}>
        {content}
        <span className="sr-only"> {labels.newTab}</span>
      </a>
    ) : /^(?:mailto|tel):/i.test(href) ? (
      <a href={href} className={linkClass}>
        {content}
      </a>
    ) : (
      <Link href={href} className={linkClass}>
        {content}
      </Link>
    );
  };

  return (
    <article data-slot="code-of-conduct" className={cn("@container w-full break-words", className)} {...props}>
      <header className="max-w-3xl">
        {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
        <div className={cn("text-xl leading-relaxed tracking-[-0.01em] text-pretty sm:text-2xl sm:leading-snug", title && "mt-6")}>{promise}</div>
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-6 text-sm">
          <span className="text-muted-foreground">{labels.quickReport}</span>
          {contact(PILL, true)}
          <a href={`#${id("reporting")}`} className={cn(LINK, "text-muted-foreground hover:text-foreground")}>
            {labels.howHandled}
          </a>
        </div>
      </header>

      {expected.length || unacceptable.length ? (
        <div className={cn("mt-14 grid grid-cols-1 gap-6", expected.length && unacceptable.length ? "@2xl:grid-cols-2" : "max-w-2xl")}>
          <BehaviourList as={Sub} id={id("expected")} title={labels.expected} items={expected} allowed permalink={labels.permalink} />
          <BehaviourList as={Sub} id={id("unacceptable")} title={labels.unacceptable} items={unacceptable} allowed={false} permalink={labels.permalink} />
        </div>
      ) : null}

      {scope ? (
        <div id={id("scope")} className="mt-14 scroll-mt-24">
          <Callout title={labels.scope}>{scope}</Callout>
        </div>
      ) : null}

      <section id={id("reporting")} className="mt-14 scroll-mt-24 rounded-xl border border-border bg-muted/40 p-6 sm:p-8">
        <SectionHeading as={Sub} id={id("reporting")} title={labels.reporting} permalink={labels.permalink} />
        <dl className="mt-6 grid grid-cols-1 gap-8 @4xl:grid-cols-3 @4xl:gap-10">
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium tracking-[.12em] text-muted-foreground uppercase">
              <ContactIcon aria-hidden="true" className="size-4" />
              {labels.contact}
            </dt>
            <dd className="mt-3 text-lg leading-snug font-medium [overflow-wrap:anywhere]">{contact(LINK)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium tracking-[.12em] text-muted-foreground uppercase">
              <IconClock aria-hidden="true" className="size-4" />
              {labels.response}
            </dt>
            <dd className="mt-3 text-[0.9375rem] leading-relaxed">{report.response}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs font-medium tracking-[.12em] text-muted-foreground uppercase">
              <IconLock aria-hidden="true" className="size-4" />
              {labels.confidentiality}
            </dt>
            <dd className="mt-3 text-[0.9375rem] leading-relaxed">{report.confidentiality}</dd>
          </div>
        </dl>
      </section>

      {consequences.length ? (
        <section id={id("consequences")} className="mt-14 scroll-mt-24">
          <SectionHeading as={Sub} id={id("consequences")} title={labels.consequences} permalink={labels.permalink} />
          <ol role="list" className="mt-8 max-w-2xl">
            {consequences.map((step, index) => {
              const last = index === consequences.length - 1;
              return (
                <li key={step.title} id={`${id("consequences")}-${slug(step.title)}`} className="relative flex scroll-mt-24 gap-5 pb-8 last:pb-0">
                  {last ? null : <span aria-hidden="true" className="absolute top-9 bottom-1 left-[0.9375rem] w-px bg-border" />}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative grid size-8 shrink-0 place-items-center rounded-full border text-sm font-medium tabular-nums",
                      last ? "border-foreground bg-foreground text-background" : "border-border bg-background",
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 pt-1">
                    <p className="text-base leading-6 font-medium">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {updated ? (
        <p className="mt-14 border-t border-border pt-6 text-sm text-muted-foreground">
          {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
        </p>
      ) : null}
    </article>
  );
}
