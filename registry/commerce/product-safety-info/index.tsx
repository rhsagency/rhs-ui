import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconDownload, IconFileText, IconInfo, IconMail, IconPhone, IconShieldAlert, IconWarning } from "@rhs-ui/icons";
import {
  WORDS,
  dateText,
  fill,
  isoOf,
  linesOf,
  sizeText,
  type ProductSafetyLabels,
  type SafetyDocument,
  type SafetyIdentifier,
  type SafetyMark,
  type SafetyMoment,
  type SafetyParty,
  type SafetySeverity,
  type SafetyWarning,
} from "@rhs-ui/commerce/product-safety-info/safety";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export type {
  ProductSafetyLabels,
  SafetyDocument,
  SafetyIdentifier,
  SafetyMark,
  SafetyMoment,
  SafetyParty,
  SafetySeverity,
  SafetyWarning,
} from "@rhs-ui/commerce/product-safety-info/safety";

export interface ProductSafetyInfoProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Who makes the product: its name, postal address and a way to write to them. */
  manufacturer?: SafetyParty;
  /** Who answers for the product in the EU, when the maker is based elsewhere. */
  euContact?: SafetyParty;
  /** The model, the batch or lot and the serial number, each with where it is printed. */
  identifiers?: readonly SafetyIdentifier[];
  /** What to look out for, most serious first. Every warning has a severity, and the severity is written as a word. */
  warnings?: readonly SafetyWarning[];
  /** The compliance marks the product carries (CE, UKCA), each linking to its declaration when you give one. */
  marks?: readonly SafetyMark[];
  /** The manuals and declarations to download, with their type and size. */
  documents?: readonly SafetyDocument[];
  /** When this information was last checked. */
  updatedAt?: SafetyMoment;
  /** The heading. Defaults to "Product safety information". */
  title?: string;
  /** A line under it: which product this is about. */
  description?: string;
  /** Something at the right of the heading: the close button when the panel sits in a dialog, so nothing lies over the panel's own text. */
  action?: ReactNode;
  /** Pins the heading, and the action beside it, to the top of whatever scrolls the panel: for a panel in a dialog or a drawer, so the close button is never scrolled out of reach. The scroll stays yours (the body of the dialog); the panel only holds its header to it. */
  stickyHeader?: boolean;
  /** Renders the links to declarations and the download buttons. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Always pass your application locale, so the server and the browser write the same sizes and dates. */
  locale?: string;
  /** The time zone the date of the last check is read in. Defaults to "UTC". */
  timeZone?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: ProductSafetyLabels;
}

/** How each severity looks: heavier for graver, and always with its word. Whole class names, because Tailwind reads the source text. */
const SEVERITY: Record<SafetySeverity, { row: string; chip: string; Icon: typeof IconWarning }> = {
  danger: { row: "border-destructive/40 bg-destructive/5", chip: "bg-destructive text-destructive-foreground", Icon: IconShieldAlert },
  warning: { row: "border-foreground/25 bg-muted/60", chip: "bg-foreground text-background", Icon: IconWarning },
  caution: { row: "border-border bg-card", chip: "border border-foreground/40 text-foreground", Icon: IconAlertCircle },
  notice: { row: "border-border bg-card", chip: "bg-muted text-muted-foreground", Icon: IconInfo },
};

/** A sentence with a node where `{date}` is, so the date can be a `<time>` whatever the language puts around it. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after}
    </>
  );
}

interface RowProps {
  id: string;
  title: string;
  hint: string;
  /** The heading's element: one level under the panel's own. */
  as: "h3" | "h4";
  children: ReactNode;
}

/** One section of the panel: its title and a line about it on the left on a wide panel, above on a narrow one, so the content always has room to breathe. */
function Row({ id, title, hint, as: Title, children }: RowProps) {
  return (
    <div role="group" aria-labelledby={id} className="grid gap-x-12 gap-y-4 px-5 py-6 @2xl:px-7 @4xl:grid-cols-[12rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <Title id={id} className="text-sm font-medium">
          {title}
        </Title>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-muted-foreground">{hint}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

const hrefOf = (website: string): string => (/^https?:\/\//i.test(website) ? website : `https://${website}`);
const bare = (website: string): string => website.replace(/^https?:\/\//i, "").replace(/\/$/, "");

const contactLink = "inline-flex max-w-full items-center gap-2 rounded-sm text-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/** A company, written the way the law asks: in an address element, with the ways to reach it under. */
function Party({ party, title }: { party: SafetyParty; title: string }) {
  const lines = linesOf(party.address);
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{party.role ?? title}</p>
      <address className="mt-2 text-sm leading-relaxed not-italic">
        <span className="block font-medium">{party.name}</span>
        {lines.map((line, index) => (
          <span key={`${index}-${line}`} className="block text-muted-foreground">
            {line}
          </span>
        ))}
        {party.email || party.phone || party.website ? (
          <span className="mt-3 grid justify-items-start gap-1.5">
            {party.email ? (
              <a href={`mailto:${party.email}`} className={contactLink}>
                <IconMail aria-hidden="true" />
                <span className="[overflow-wrap:anywhere]">{party.email}</span>
              </a>
            ) : null}
            {party.phone ? (
              <a href={`tel:${party.phone.replace(/[^+\d]/g, "")}`} className={contactLink}>
                <IconPhone aria-hidden="true" />
                <span className="tabular-nums">{party.phone}</span>
              </a>
            ) : null}
            {party.website ? (
              <a href={hrefOf(party.website)} className={contactLink}>
                <IconArrowUpRight aria-hidden="true" />
                <span className="[overflow-wrap:anywhere]">{bare(party.website)}</span>
              </a>
            ) : null}
          </span>
        ) : null}
      </address>
    </div>
  );
}

/**
 * The product safety facts a shop has to show, in one panel that is easy to read: any warnings, each with a word
 * for how serious it is, the compliance marks with a link to the declaration behind them, who makes the product and
 * who answers for it in the EU (each written in an address element), the model and batch with where they are
 * printed, and the manuals and declarations to download with their type and size. A field that is not known is left
 * out, never shown empty, and no warning relies on an icon or a colour alone. It has no width of its own, so it sits
 * as well in a tab or a dialog as on the page, and it keeps no state, so it renders on the server.
 */
export function ProductSafetyInfo({
  manufacturer,
  euContact,
  identifiers,
  warnings,
  marks,
  documents,
  updatedAt,
  title,
  description,
  action,
  stickyHeader = false,
  linkAs: Link = "a",
  locale = "en-US",
  timeZone = "UTC",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: ProductSafetyInfoProps) {
  const words = { ...WORDS, ...labels, severity: { ...WORDS.severity, ...labels?.severity } };
  const id = useId();
  const Sub = Heading === "h2" ? "h3" : "h4";
  const updated = updatedAt === undefined ? null : dateText(updatedAt, locale, timeZone);
  const updatedIso = updatedAt === undefined ? null : isoOf(updatedAt);

  const shownWarnings = (warnings ?? []).filter((warning) => warning.text.trim() !== "");
  const shownMarks = (marks ?? []).filter((mark) => mark.name.trim() !== "");
  const shownDocuments = (documents ?? []).filter((document) => document.title.trim() !== "" && document.href.trim() !== "");
  const parties = [manufacturer && { party: manufacturer, title: words.manufacturer }, euContact && { party: euContact, title: words.euContact }].filter((entry): entry is { party: SafetyParty; title: string } => Boolean(entry));
  const facts: DescriptionItem[] = (identifiers ?? [])
    .filter((identifier) => identifier.label.trim() !== "" && identifier.value.trim() !== "")
    .map((identifier) => ({
      term: identifier.label,
      value: (
        <span className="block min-w-0">
          <span className="font-mono text-[0.8125rem] tracking-tight [overflow-wrap:anywhere]">{identifier.value}</span>
          {identifier.where ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{identifier.where}</span> : null}
        </span>
      ),
    }));

  return (
    <section
      data-slot="product-safety-info"
      aria-labelledby={`${id}-title`}
      className={cn(
        "@container min-w-0 divide-y divide-border rounded-xl border border-border bg-card text-card-foreground shadow-xs",
        // A sticky header sticks to the nearest ancestor that scrolls, and overflow: hidden would make the panel itself that ancestor; clip rounds the corners the same without being one.
        stickyHeader ? "overflow-clip" : "overflow-hidden",
        className,
      )}
      {...props}
    >
      <header className={cn("flex items-start justify-between gap-x-6 px-5 py-6 @2xl:px-7", stickyHeader && "sticky top-0 z-10 bg-card")}>
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-xl leading-tight font-medium tracking-[-0.03em] text-balance @2xl:text-2xl">
            {title ?? words.title}
          </Heading>
          {description ? <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">{description}</p> : null}
          {updated ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {withDate(
                words.updated,
                <time dateTime={updatedIso ?? undefined} className="font-medium text-foreground tabular-nums">
                  {updated}
                </time>,
              )}
            </p>
          ) : null}
        </div>
        {action ? <div className="-mt-1 -mr-1.5 shrink-0">{action}</div> : null}
      </header>

      {shownWarnings.length > 0 ? (
        <Row id={`${id}-warnings`} title={words.warnings} hint={words.warningsHint} as={Sub}>
          <ul role="list" className="grid gap-2.5">
            {shownWarnings.map((warning, index) => {
              const look = SEVERITY[warning.severity] ?? SEVERITY.notice;
              return (
                <li key={`${index}-${warning.severity}`} data-severity={warning.severity} className={cn("flex flex-col gap-2 rounded-lg border px-4 py-3.5 @md:flex-row @md:items-start @md:gap-3.5", look.row)}>
                  <span className={cn("inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold @md:mt-px @md:w-24 @md:justify-center", look.chip)}>
                    <look.Icon aria-hidden="true" className="size-3.5" />
                    {words.severity[warning.severity] ?? words.severity.notice}
                  </span>
                  <p className="min-w-0 text-sm leading-relaxed">
                    {warning.title ? <strong className="font-semibold">{warning.title}. </strong> : null}
                    {warning.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </Row>
      ) : null}

      {shownMarks.length > 0 ? (
        <Row id={`${id}-marks`} title={words.marks} hint={words.marksHint} as={Sub}>
          <ul role="list" className="grid gap-2.5 @xl:grid-cols-2">
            {shownMarks.map((mark) => (
              <li key={mark.name} className="flex items-start gap-3.5 rounded-lg border border-border bg-background px-3.5 py-3">
                <span className="grid h-10 min-w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted px-2 text-sm font-semibold tracking-wide">{mark.name}</span>
                <span className="min-w-0 pt-0.5">
                  {mark.description ? <span className="block text-sm leading-snug text-pretty">{mark.description}</span> : null}
                  {mark.href ? (
                    <Link
                      href={mark.href}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-sm text-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                        mark.description && "mt-1.5",
                      )}
                    >
                      {words.declaration}
                      <span className="sr-only"> ({mark.name})</span>
                      <IconArrowUpRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Row>
      ) : null}

      {parties.length > 0 ? (
        <Row id={`${id}-responsible`} title={words.responsible} hint={words.responsibleHint} as={Sub}>
          <div className={cn("grid gap-x-10 gap-y-8", parties.length > 1 && "@xl:grid-cols-2")}>
            {parties.map((entry) => (
              <Party key={entry.party.name} party={entry.party} title={entry.title} />
            ))}
          </div>
        </Row>
      ) : null}

      {facts.length > 0 ? (
        <Row id={`${id}-identifiers`} title={words.identifiers} hint={words.identifiersHint} as={Sub}>
          <DescriptionList items={facts} />
        </Row>
      ) : null}

      {shownDocuments.length > 0 ? (
        <Row id={`${id}-documents`} title={words.documents} hint={words.documentsHint} as={Sub}>
          <ul role="list" className="divide-y divide-border rounded-lg border border-border bg-background">
            {shownDocuments.map((document) => {
              const size = document.size === undefined ? null : sizeText(document.size, locale);
              const details = [document.type, size, document.language].filter(Boolean).join(" · ");
              return (
                <li key={`${document.title}-${document.href}`} className="flex items-center gap-3.5 px-3.5 py-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <IconFileText className="size-[1.125rem]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-medium text-pretty">{document.title}</span>
                    {details ? <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">{details}</span> : null}
                  </span>
                  <Button asChild variant="outline" size="sm" className="shrink-0 @max-sm:w-8 @max-sm:px-0">
                    <Link href={document.href} download aria-label={fill(details ? words.downloadName : words.downloadNamePlain, { title: document.title, details })}>
                      <IconDownload />
                      <span className="@max-sm:sr-only">{words.download}</span>
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </Row>
      ) : null}
    </section>
  );
}
