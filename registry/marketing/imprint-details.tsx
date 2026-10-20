import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface ImprintEntity {
  /** "Northwind Software B.V." */
  legalName?: string;
  /** "Private limited company (B.V.)". */
  legalForm?: string;
  /** The registered address, as one line per entry or as one string. */
  address?: string | readonly string[];
  /** The register entry. The number is selectable text; the register's own name sits beside it. */
  register?: {
    number: string;
    /** "Chamber of Commerce (KVK), Amsterdam". */
    name?: string;
    /** The term for the number: "Registration number" by default, "KVK number" or "Handelsregister" where you want the local name. */
    label?: string;
  };
  /** "NL862348975B01". */
  vatId?: string;
  /** The people who represent the company, one name or several. */
  managingDirector?: string | readonly string[];
  /** Shown as a mailto: link. */
  email?: string;
  /** Shown as a tel: link. */
  phone?: string;
  /** The authority that supervises the business, where there is one. */
  authority?: { name: string; href?: string };
  /** How a customer can settle a dispute: the name of the body or portal, a link and a line of context. */
  disputes?: { label: string; href?: string; note?: string };
}

export interface ImprintSection {
  /** The group's heading. */
  title: string;
  /** The facts of the group, each a term with its value. */
  items: readonly DescriptionItem[];
}

export interface ImprintLabels {
  /** Heading of the company group. */
  company: string;
  /** Heading of the registration group. */
  registration: string;
  /** Heading of the group with the people who represent the company. */
  representation: string;
  /** Heading of the contact group. */
  contact: string;
  /** Heading of the supervision and disputes group. */
  oversight: string;
  /** Term for the legal name. */
  legalName: string;
  /** Term for the legal form. */
  legalForm: string;
  /** Term for the address. */
  address: string;
  /** Term for the register number, when the entry has no label of its own. */
  register: string;
  /** Term for the VAT ID. */
  vatId: string;
  /** Term for one managing director. */
  managingDirector: string;
  /** Term for several managing directors. */
  managingDirectors: string;
  /** Term for the email address. */
  email: string;
  /** Term for the phone number. */
  phone: string;
  /** Term for the supervisory authority. */
  authority: string;
  /** Term for dispute resolution. */
  disputes: string;
  /** The words before the date. */
  updated: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
}

export interface ImprintDetailsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** Every field is optional, and a field that is left out is left out of the page too. */
  entity: ImprintEntity;
  /** More titled lists under the entity's own: editorial responsibility, photo credits, a data protection officer. */
  sections?: readonly ImprintSection[];
  /** The page's own heading, when the page has no other: "Imprint". */
  title?: string;
  /** A line under the title: whose details these are and why they are shown. */
  description?: string;
  /** When the details were last checked, as an ISO date: "2026-03-12". */
  updated?: string;
  /** The level of the title. The group headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the headings and terms, for a site that is not in English. */
  labels?: Partial<ImprintLabels>;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Locale for the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: ImprintLabels = {
  company: "Company",
  registration: "Registration",
  representation: "Representation",
  contact: "Contact",
  oversight: "Supervision and disputes",
  legalName: "Legal name",
  legalForm: "Legal form",
  address: "Address",
  register: "Registration number",
  vatId: "VAT ID",
  managingDirector: "Managing director",
  managingDirectors: "Managing directors",
  email: "Email",
  phone: "Phone",
  authority: "Supervisory authority",
  disputes: "Dispute resolution",
  updated: "Last updated",
  newTab: "(opens in a new tab)",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

const linesOf = (value: string | readonly string[] | undefined): string[] => (typeof value === "string" ? [value] : [...(value ?? [])]).map((line) => line.trim()).filter(Boolean);

const LINK =
  "inline-flex items-center gap-1 rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * The legal facts a site is expected to show, set as a page people can read:
 * who the company is, where it is registered and for which VAT, who
 * represents it, how to reach it, and who supervises it. Each group is a
 * titled definition list; a field you leave out leaves no dash behind, the
 * mail and phone are real links, and registration numbers are plain
 * selectable text with the register's name beside them. It covers what Dutch
 * and German sites are expected to show, and it is the page behind the
 * footer's Imprint link.
 */
export function ImprintDetails({
  entity,
  sections = [],
  title,
  description,
  updated,
  headingLevel = 2,
  labels: custom,
  linkAs: Link = "a",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: ImprintDetailsProps) {
  const labels = { ...LABELS, ...custom };
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Group = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";

  const link = (href: string, children: ReactNode) =>
    /^https?:\/\//i.test(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
        {children}
        <IconArrowUpRight className="size-3.5" />
        <span className="sr-only"> {labels.newTab}</span>
      </a>
    ) : /^(?:mailto|tel):/i.test(href) ? (
      <a href={href} className={LINK}>
        {children}
      </a>
    ) : (
      <Link href={href} className={LINK}>
        {children}
      </Link>
    );
  const stack = (lines: readonly string[]) =>
    lines.map((line, index) => (
      <span key={`${index}-${line}`} className="block">
        {line}
      </span>
    ));

  const company: DescriptionItem[] = [];
  if (entity.legalName) company.push({ term: labels.legalName, value: entity.legalName });
  if (entity.legalForm) company.push({ term: labels.legalForm, value: entity.legalForm });
  const address = linesOf(entity.address);
  if (address.length) company.push({ term: labels.address, value: <address className="not-italic">{stack(address)}</address> });

  const registration: DescriptionItem[] = [];
  if (entity.register?.number) {
    registration.push({
      term: entity.register.label ?? labels.register,
      value: (
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="tabular-nums select-all">{entity.register.number}</span>
          {entity.register.name ? <span className="text-sm font-normal text-muted-foreground">{entity.register.name}</span> : null}
        </span>
      ),
    });
  }
  if (entity.vatId) registration.push({ term: labels.vatId, value: <span className="tabular-nums select-all">{entity.vatId}</span> });

  const directors = linesOf(entity.managingDirector);
  const representation: DescriptionItem[] = directors.length ? [{ term: directors.length > 1 ? labels.managingDirectors : labels.managingDirector, value: stack(directors) }] : [];

  const contact: DescriptionItem[] = [];
  if (entity.email) contact.push({ term: labels.email, value: link(`mailto:${entity.email}`, entity.email) });
  if (entity.phone) contact.push({ term: labels.phone, value: link(`tel:${entity.phone.replace(/[^\d+]/g, "")}`, entity.phone) });

  const oversight: DescriptionItem[] = [];
  if (entity.authority?.name) oversight.push({ term: labels.authority, value: entity.authority.href ? link(entity.authority.href, entity.authority.name) : entity.authority.name });
  if (entity.disputes?.label) {
    oversight.push({
      term: labels.disputes,
      value: (
        <span className="block">
          {entity.disputes.href ? link(entity.disputes.href, entity.disputes.label) : entity.disputes.label}
          {entity.disputes.note ? <span className="mt-1 block text-sm font-normal text-muted-foreground">{entity.disputes.note}</span> : null}
        </span>
      ),
    });
  }

  const groups: ImprintSection[] = [
    { title: labels.company, items: company },
    { title: labels.registration, items: registration },
    { title: labels.representation, items: representation },
    { title: labels.contact, items: contact },
    { title: labels.oversight, items: oversight },
    ...sections,
  ].filter((group) => group.items.length > 0);

  return (
    <section data-slot="imprint-details" className={cn("w-full break-words", className)} {...props}>
      {title ? (
        <header className="mb-10 max-w-2xl">
          <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
          {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        </header>
      ) : null}
      <div>
        {groups.map((group) => (
          <section key={group.title} className="grid grid-cols-1 gap-x-12 gap-y-4 border-t border-border py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
            <Group className="text-base leading-snug font-medium tracking-[-0.01em]">{group.title}</Group>
            <DescriptionList items={group.items} className="[overflow-wrap:anywhere]" />
          </section>
        ))}
      </div>
      {updated ? (
        <p className="border-t border-border pt-6 text-sm text-muted-foreground">
          {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
        </p>
      ) : null}
    </section>
  );
}
