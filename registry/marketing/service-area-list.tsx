import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowRight, IconPin } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ServicePlace {
  /** The town or village as people write it: "Amersfoort". */
  name: string;
  /** The page about working there. Leave it out for a place without one: it is then plain text, never a dead link. */
  href?: string;
  /** Any number that says how big the place is, such as its population. Where a region has one, the places that carry it come first, largest first, and the rest follow alphabetically. */
  priority?: number;
}

export interface ServiceRegion {
  /** The region, province or county: "Utrecht". */
  name: string;
  /** The places in it, in any order. They are sorted for you. */
  places: readonly ServicePlace[];
}

export interface ServiceRadius {
  /** How far you travel, in words: "Within 40 km". */
  label: string;
  /** Where the distance is measured from: "Amersfoort". */
  from?: string;
}

export interface ServiceAreaLabels {
  /** Joins the reach to its origin: "Within 40 km of Amersfoort". */
  of: string;
  /** The question that opens the closing line. */
  otherTitle: string;
  /** What follows it. */
  otherText: string;
  /** The text of the contact link. */
  contactLabel: string;
  /** The noun after a count of one: "1 place". */
  place: string;
  /** The noun after any other count: "9 places". */
  places: string;
}

export interface ServiceAreaListProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A heading for the list: "Where we work". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** How far from your base you work. Shown as a note under the title, and stated in text so it is read by people and crawlers alike. */
  radius?: ServiceRadius;
  /** The regions, in the order they appear, each with the places you serve. */
  regions: readonly ServiceRegion[];
  /** Where "Other places?" leads, normally your contact page. The closing line only shows when this is set. */
  contactHref?: string;
  /** The level of the title. Region headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Renders the place links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ServiceAreaLabels>;
  /** Locale for sorting the places and for numbers. */
  locale?: string;
}

const LABELS: ServiceAreaLabels = {
  of: "of",
  otherTitle: "Other places?",
  otherText: "We regularly work further out. Tell us where the job is.",
  contactLabel: "Get in touch",
  place: "place",
  places: "places",
};

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/** Priority first, largest on top, then the alphabet. Without any priority this is just the alphabet. */
function ordered(places: readonly ServicePlace[], collator: Intl.Collator): ServicePlace[] {
  return [...places].sort((a, b) => {
    const rankA = a.priority ?? Number.NEGATIVE_INFINITY;
    const rankB = b.priority ?? Number.NEGATIVE_INFINITY;
    if (rankA !== rankB) return rankA > rankB ? -1 : 1;
    return collator.compare(a.name, b.name);
  });
}

/**
 * The places you work, written out: each region is a heading with its towns
 * as links in balanced columns, so a visitor finds their own town at a glance
 * and a crawler finds a route to every local page. A place without a page is
 * plain text, which means the list never ships a dead link. The reach goes
 * under the title as a sentence ("Within 40 km of Amersfoort"), and an
 * "Other places?" line closes the list with the way to ask. Places are
 * alphabetical, or largest first when you give them a priority. Built for
 * local SEO: the area is stated in text, not hidden in a map.
 */
export function ServiceAreaList({
  title,
  description,
  radius,
  regions,
  contactHref,
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  locale = "en-US",
  className,
  ...props
}: ServiceAreaListProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Region = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const collator = new Intl.Collator(locale);
  const numbers = new Intl.NumberFormat(locale);
  const hasHeader = Boolean(title || description || radius);

  const place = (item: ServicePlace): ReactNode =>
    item.href ? (
      <Link
        href={item.href}
        className={cn("rounded-sm underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none", FOCUS)}
      >
        {item.name}
      </Link>
    ) : (
      item.name
    );

  return (
    <section data-slot="service-area-list" className={cn("w-full break-words", className)} {...props}>
      {hasHeader ? (
        <header className="max-w-2xl">
          {title ? <Title className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground", title && "mt-4")}>{description}</p> : null}
          {radius ? (
            <p className={cn("inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-muted/40 py-1.5 pr-4 pl-3 text-sm font-medium", (title || description) && "mt-6")}>
              <IconPin aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                {radius.label}
                {radius.from ? ` ${labels.of} ${radius.from}` : null}
              </span>
            </p>
          ) : null}
        </header>
      ) : null}

      <div className={cn("border-t border-border", hasHeader && "mt-10")}>
        {regions.map((region, index) => {
          const places = ordered(region.places, collator);
          return (
            <div key={region.name} className="grid grid-cols-1 gap-x-12 gap-y-4 border-b border-border py-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
              <div>
                <Region id={`${id}-${index}`} className="text-lg leading-snug font-medium tracking-[-0.02em]">
                  {region.name}
                </Region>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="tabular-nums">{numbers.format(places.length)}</span> {places.length === 1 ? labels.place : labels.places}
                </p>
              </div>
              <ul role="list" aria-labelledby={`${id}-${index}`} className="columns-2 gap-x-8 sm:columns-3">
                {places.map((item) => (
                  <li key={item.name} className="break-inside-avoid py-1.5 text-[0.9375rem] leading-snug">
                    {place(item)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {contactHref ? (
        <aside className="mt-10 flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          <p className="text-sm leading-relaxed">
            <span className="font-medium">{labels.otherTitle}</span> <span className="text-muted-foreground">{labels.otherText}</span>
          </p>
          <Link
            href={contactHref}
            className={cn(
              "group self-start rounded-sm text-sm font-medium [overflow-wrap:anywhere] underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none sm:self-auto",
              FOCUS,
            )}
          >
            {labels.contactLabel}
            <IconArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-0.2em] transition-transform duration-150 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </Link>
        </aside>
      ) : null}
    </section>
  );
}
