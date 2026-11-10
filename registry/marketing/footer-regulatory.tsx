import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight } from "@rhs-ui/icons";
import type { FooterColumn, FooterLink } from "@rhs-ui/marketing/footer-section";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export interface FooterRegulatoryRegistration {
  /** The register, as people know it: "Trade register", "VAT ID", "Licence", "Registered office". */
  label: string;
  /** The number or the address. It is plain text that selects whole in one click, so it can be copied into a form. */
  value: string;
}

export interface FooterRegulatoryStatement {
  /** What the statement is: "Regulated by", "Risk warning", "Liability". */
  title: string;
  /** The wording the sector requires, in sentences. It may hold a link, for the regulator's register entry. */
  body: ReactNode;
  /** An icon of 16px in front of the title: a shield for the regulator, a warning triangle for a risk notice. The title carries the meaning, so the icon is decoration. */
  icon?: ReactNode;
}

export interface FooterRegulatoryLabels {
  /** The heading over the list of registration numbers. */
  registration: string;
  /** The heading over the statements. */
  statements: string;
  /** The heading over the complaint and dispute links. */
  complaints: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface FooterRegulatoryProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your name or mark. */
  brand?: ReactNode;
  /** One sentence under the mark. */
  tagline?: string;
  /** The link columns on top. Compact ones read best: three or four, with a few links each. */
  columns: readonly FooterColumn[];
  /** What the law makes you print: the trade register number, VAT ID, licence number, registered office. One row each, as a definition list. */
  registration: readonly FooterRegulatoryRegistration[];
  /** The regulator statement, a risk or liability notice. They stay in normal text, never fine print. */
  statements: readonly FooterRegulatoryStatement[];
  /** The complaint and dispute links: your complaints procedure, the ombudsman, the register entry of the regulator. */
  links?: readonly FooterLink[];
  /** When the legal wording was last checked: the words ("Wording last reviewed 4 March 2026", formatted on your side) and the same day as a valid date string for the time element. */
  reviewed?: { label: string; dateTime: string };
  /** The bottom row, left: "© 2026 Halcyon Mutual N.V." */
  legal: ReactNode;
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterRegulatoryLabels>;
}

const LABELS: FooterRegulatoryLabels = {
  registration: "Registration",
  statements: "Regulatory information",
  complaints: "Complaints and disputes",
  newTab: "opens in a new tab",
};

const columnLink =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
const noticeLink =
  "group/link inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/25 underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
const heading = "font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase";

/**
 * A footer for the sectors that have to print things: finance, insurance,
 * healthcare, legal and education. Compact link columns on top and, under a
 * rule, what the law asks for, set to be read: the registration numbers as a
 * definition list (each value selects whole in one click), the regulator
 * statement and the risk or liability notice in normal text, never fine print,
 * and the complaint and dispute links. The wording carries a last-reviewed
 * date in a time element, so a legal team can see how fresh it is. No state of
 * its own, so it renders on the server.
 */
export function FooterRegulatory({
  brand,
  tagline,
  columns,
  registration,
  statements,
  links = [],
  reviewed,
  legal,
  linkAs: Link = "a",
  navLabel = "Footer",
  labels: custom,
  className,
  ...props
}: FooterRegulatoryProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();

  const renderLink = (link: FooterLink, className: string, arrow?: ReactNode) =>
    link.external ? (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
        {link.label}
        {arrow}
        <span className="sr-only"> ({words.newTab})</span>
      </a>
    ) : (
      <Link href={link.href} className={className}>
        {link.label}
        {arrow}
      </Link>
    );

  return (
    <footer data-slot="footer-regulatory" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          {brand || tagline ? (
            <div className="grid content-start gap-3">
              {brand ? <div>{brand}</div> : null}
              {tagline ? <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
            </div>
          ) : null}
          <nav aria-label={navLabel} className={cn("grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-4", !brand && !tagline && "lg:col-span-2")}>
            {columns.map((column) => (
              <div key={column.title} className="grid content-start gap-3">
                <h2 className={heading}>{column.title}</h2>
                <ul className="grid gap-2.5">
                  {column.links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>{renderLink(link, columnLink)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="grid gap-12 border-t border-border py-12 sm:py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="grid content-start gap-10">
            <section aria-labelledby={`${id}-registration`} className="grid gap-4">
              <h2 id={`${id}-registration`} className={heading}>
                {words.registration}
              </h2>
              <DescriptionList
                aria-labelledby={`${id}-registration`}
                items={registration.map((item) => ({ term: item.label, value: <span className="tabular-nums select-all">{item.value}</span> }))}
                className="[&_dd]:break-words"
              />
            </section>

            {links.length ? (
              <section aria-labelledby={`${id}-complaints`} className="grid gap-4">
                <h2 id={`${id}-complaints`} className={heading}>
                  {words.complaints}
                </h2>
                <ul className="grid gap-3">
                  {links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      {renderLink(
                        link,
                        noticeLink,
                        link.external ? (
                          <IconArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                        ) : (
                          <IconArrowRight aria-hidden="true" className="size-3.5 text-muted-foreground transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                        ),
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <section aria-labelledby={`${id}-statements`} className="grid content-start gap-4">
            <h2 id={`${id}-statements`} className={heading}>
              {words.statements}
            </h2>
            <div className="grid gap-6">
              {statements.map((statement) => (
                <div key={statement.title} className="grid gap-2 border-t border-border pt-6 first:border-t-0 first:pt-0">
                  <h3 className="flex items-center gap-2 text-[0.9375rem] font-medium [&_svg]:size-4 [&_svg]:shrink-0">
                    {statement.icon ? <span aria-hidden="true">{statement.icon}</span> : null}
                    {statement.title}
                  </h3>
                  <div className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-pretty text-foreground/80 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/30 [&_a]:underline-offset-4 [&_a:hover]:decoration-foreground">
                    {statement.body}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>{legal}</div>
          {reviewed ? (
            <p>
              <time dateTime={reviewed.dateTime}>{reviewed.label}</time>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
