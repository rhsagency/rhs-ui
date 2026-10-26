import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconBadgeCheck, IconDroplet, IconPin, IconRepeat, IconShieldCheck, IconWrench } from "@rhs-ui/icons";
import {
  WORDS,
  dateText,
  isoOf,
  segmentsOf,
  type PassportCertificate,
  type PassportFootprint,
  type PassportGroup,
  type PassportMaterial,
  type PassportMoment,
  type PassportOrigin,
  type PassportRow,
  type ProductPassportLabels,
} from "@rhs-ui/commerce/product-passport/passport";
import { PassportGroups } from "@rhs-ui/commerce/product-passport/groups";
import { Badge } from "@rhs-ui/primitives/badge";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export type {
  PassportCertificate,
  PassportFootprint,
  PassportGroup,
  PassportMaterial,
  PassportMoment,
  PassportOrigin,
  PassportRow,
  ProductPassportLabels,
} from "@rhs-ui/commerce/product-passport/passport";

export interface ProductPassportProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** What the product is made of, with each material's share in percent. Drawn as one bar and listed in words under it. Left out when empty. */
  materials?: readonly PassportMaterial[];
  /** Where it was made. Left out when there is none. */
  origin?: PassportOrigin;
  /** The certifications, each a link to the certificate. Left out when empty. */
  certificates?: readonly PassportCertificate[];
  /** How to look after it, one short line each. Left out when empty. */
  care?: readonly PassportRow[];
  /** How to have it repaired, and by whom. */
  repair?: readonly PassportRow[];
  /** Where to return or recycle it when it has done its work. */
  endOfLife?: readonly PassportRow[];
  /** The product's footprint: one figure and, in one line, how it was worked out. */
  footprint?: PassportFootprint;
  /** When the passport was last checked. */
  updatedAt?: PassportMoment;
  /** The product's name. It is the heading, with the words "Product passport" above it. Without it the heading says "Product passport". */
  title?: string;
  /** A line under the heading: the style, the colour, the batch. */
  description?: string;
  /** The passport's own identifier, in the typeface for codes: "DPP-KM-2210-0042". */
  identifier?: string;
  /** Which of care, repair and end of life start open. All three by default; pass an empty list to start them closed. */
  defaultOpen?: readonly PassportGroup[];
  /** Always pass your application locale, so the server and the browser write the same percentages and dates. */
  locale?: string;
  /** The time zone the date of the last check is read in. Defaults to "UTC". */
  timeZone?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: ProductPassportLabels;
}

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

/** The tones of the bar, from the strongest to the faintest and, after the sixth, two that sit between them, so neighbours differ without a second colour. Whole class names, because Tailwind reads the source text. */
const TONES = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/28", "bg-foreground/15", "bg-foreground/8", "bg-foreground/85", "bg-foreground/36"] as const;

interface SectionProps {
  id: string;
  title: string;
  /** The title's element: one level under the passport's own heading. */
  as: "h3" | "h4";
  className?: string;
  children: ReactNode;
}

/** One section of the passport: its title, then its content, under a hairline. */
function Section({ id, title, as: Title, className, children }: SectionProps) {
  return (
    <div role="group" aria-labelledby={id} className={cn("min-w-0 px-5 py-6 @2xl:px-7", className)}>
      <Title id={id} className="text-sm font-medium">
        {title}
      </Title>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * The digital product passport: what a product is made of (a stacked bar with every share also written out as a
 * list), where it was made, its certifications as links to the certificates, its footprint, and how to care for it,
 * repair it and let go of it. Every section is optional and a section without content is left out, never shown
 * empty. It carries the information shoppers and regulators increasingly expect on a product page, in one panel that
 * can sit in a tab, a drawer or a page. It keeps no state of its own, so it renders on the server.
 */
export function ProductPassport({
  materials,
  origin,
  certificates,
  care,
  repair,
  endOfLife,
  footprint,
  updatedAt,
  title,
  description,
  identifier,
  defaultOpen,
  locale = "en-US",
  timeZone = "UTC",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: ProductPassportProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const Sub = Heading === "h2" ? "h3" : "h4";
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const segments = segmentsOf(materials ?? [], words.other);
  const certified = (certificates ?? []).filter((certificate) => certificate.name.trim() !== "" && certificate.href.trim() !== "");
  const updated = updatedAt === undefined ? null : dateText(updatedAt, locale, timeZone);
  const updatedIso = updatedAt === undefined ? null : isoOf(updatedAt);

  const originFacts: DescriptionItem[] = origin
    ? [
        ...(origin.factory ? [{ term: words.factory, value: origin.factory }] : []),
        ...(origin.year !== undefined && String(origin.year).trim() !== "" ? [{ term: words.year, value: <span className="tabular-nums">{origin.year}</span> }] : []),
      ]
    : [];

  const groups: { key: PassportGroup; title: string; rows: readonly PassportRow[]; icon: ReactNode }[] = [
    { key: "care", title: words.care, rows: care ?? [], icon: <IconDroplet /> },
    { key: "repair", title: words.repair, rows: repair ?? [], icon: <IconWrench /> },
    { key: "end-of-life", title: words.endOfLife, rows: endOfLife ?? [], icon: <IconRepeat /> },
  ];
  const shownGroups = groups.filter((group) => group.rows.length > 0);

  const hasOrigin = Boolean(origin && origin.place.trim() !== "");
  const hasFootprint = Boolean(footprint && footprint.value.trim() !== "");

  return (
    <section
      data-slot="product-passport"
      aria-labelledby={`${id}-title`}
      className={cn("@container min-w-0 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)}
      {...props}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 px-5 py-6 @2xl:px-7 @2xl:py-7">
        <div className="min-w-0">
          {title ? (
            <Badge variant="outline" className="mb-3">
              <IconShieldCheck aria-hidden="true" />
              {words.eyebrow}
            </Badge>
          ) : null}
          <Heading id={`${id}-title`} className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance @2xl:text-3xl">
            {title ?? words.title}
          </Heading>
          {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
          {identifier ? <p className="mt-2 font-mono text-xs tracking-tight text-muted-foreground">{identifier}</p> : null}
        </div>
        {updated ? (
          <p className="text-xs text-muted-foreground">
            {withDate(
              words.updated,
              <time dateTime={updatedIso ?? undefined} className="font-medium text-foreground tabular-nums">
                {updated}
              </time>,
            )}
          </p>
        ) : null}
      </header>

      {segments.length > 0 ? (
        <Section id={`${id}-materials`} title={words.materials} as={Sub}>
          <div aria-hidden="true" className="flex h-3 gap-0.5 overflow-hidden rounded-full">
            {segments.map((segment) => (
              <span
                key={`${segment.name}-${segment.tone}`}
                style={{ flexGrow: segment.share }}
                className={cn("min-w-1 basis-0", segment.other ? "border border-dashed border-foreground/35" : TONES[segment.tone % TONES.length])}
              />
            ))}
          </div>
          <ul aria-label={words.materialsList} role="list" className="mt-5 grid gap-x-10 gap-y-3.5 @xl:grid-cols-2">
            {segments.map((segment) => (
              <li key={`${segment.name}-${segment.tone}`} className="flex items-start justify-between gap-4 text-sm">
                <span className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn("mt-[0.3125rem] size-2.5 shrink-0 rounded-[3px]", segment.other ? "border border-dashed border-foreground/40" : TONES[segment.tone % TONES.length])}
                  />
                  <span className="min-w-0">
                    <span className={cn("block leading-snug font-medium", segment.other && "font-normal text-muted-foreground")}>{segment.name}</span>
                    {segment.note ? <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{segment.note}</span> : null}
                  </span>
                </span>
                <span className="font-medium tabular-nums">{percent.format(segment.share / 100)}</span>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {hasOrigin || hasFootprint ? (
        <div className={cn("grid", hasOrigin && hasFootprint && "@2xl:grid-cols-2")}>
          {hasOrigin && origin ? (
            <Section id={`${id}-origin`} title={words.origin} as={Sub} className={hasFootprint ? "border-b border-border @2xl:border-r @2xl:border-b-0" : undefined}>
              <p className="flex items-start gap-2.5 text-lg leading-snug font-medium tracking-[-0.02em]">
                <IconPin aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                {origin.place}
              </p>
              {originFacts.length > 0 ? <DescriptionList items={originFacts} className="mt-3" /> : null}
              {origin.note ? <p className="mt-3 text-sm text-muted-foreground">{origin.note}</p> : null}
            </Section>
          ) : null}
          {hasFootprint && footprint ? (
            <Section id={`${id}-footprint`} title={words.footprint} as={Sub}>
              <p className="text-2xl leading-none font-medium tracking-[-0.035em] tabular-nums">{footprint.value}</p>
              {footprint.label ? <p className="mt-2 text-sm text-muted-foreground">{footprint.label}</p> : null}
              {footprint.method ? <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{footprint.method}</p> : null}
            </Section>
          ) : null}
        </div>
      ) : null}

      {certified.length > 0 ? (
        <Section id={`${id}-certificates`} title={words.certificates} as={Sub}>
          <ul role="list" className="grid gap-2.5 @xl:grid-cols-2">
            {certified.map((certificate) => (
              <li key={`${certificate.name}-${certificate.href}`}>
                <a
                  href={certificate.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group/certificate flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-3 outline-none transition-[border-color,background-color] duration-150 hover:border-foreground/30 hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted">
                    <IconBadgeCheck className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-medium">{certificate.name}</span>
                    {certificate.issuer || certificate.number ? (
                      <span className="mt-0.5 block text-xs leading-snug text-muted-foreground [overflow-wrap:anywhere]">
                        {[certificate.issuer, certificate.number].filter(Boolean).join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover/certificate:translate-x-0.5 group-hover/certificate:-translate-y-0.5 motion-reduce:transition-none" />
                  <span className="sr-only">({words.newTab})</span>
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {shownGroups.length > 0 ? (
        <PassportGroups
          as={Sub}
          defaultOpen={defaultOpen ?? shownGroups.map((group) => group.key)}
          groups={shownGroups.map((group) => ({
            key: group.key,
            title: group.title,
            content: (
              <ul role="list" className="grid gap-x-10 gap-y-5 @2xl:grid-cols-2">
                {group.rows.map((row) => (
                  <li key={row.title} className="flex items-start gap-3.5">
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-background text-foreground [&_svg]:size-[1.375rem]">
                      {row.icon ?? group.icon}
                    </span>
                    <span className="min-w-0 pt-px">
                      <span className="block text-sm leading-snug font-medium text-foreground">{row.title}</span>
                      {row.detail ? <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">{row.detail}</span> : null}
                      {row.href ? (
                        <a
                          href={row.href}
                          className="mt-1.5 inline-flex items-center gap-1 rounded-sm text-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                        >
                          {row.linkLabel ?? row.title}
                          <IconArrowUpRight aria-hidden="true" className="size-3.5" />
                        </a>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ),
          }))}
        />
      ) : null}
    </section>
  );
}
