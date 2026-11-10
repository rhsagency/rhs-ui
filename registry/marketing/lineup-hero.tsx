import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconTicket } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface LineupName {
  /** The act or the speaker. */
  name: string;
  /** What they do there, in a word or two: "Live", "DJ set", "Keynote". It is set small after the name and read after it. */
  role?: string;
  /** A page for this name. A name with an address is a link. */
  href?: string;
}

export interface LineupTier {
  /** The tier in words: "Headliners", "Featured", "And more". It is the heading of the names under it for assistive technology, and it is written on the page when `showTierLabels` is on. */
  label: string;
  /** The names in this tier, in the order they are set. */
  names: readonly LineupName[];
}

export interface LineupVenue {
  /** The city, set large under the dates. */
  city: string;
  /** The place and the country, set small: "Minnewater Park, Belgium". */
  name?: string;
}

/** The words the hero says. */
export interface LineupHeroLabels {
  /** Names the dates for assistive technology. */
  when: string;
  /** Names the place for assistive technology. */
  where: string;
  tickets: string;
  programme: string;
}

export interface LineupHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. The tiers' headings sit one level below it. */
  titleAs?: "h1" | "h2";
  /** The name of the festival or the conference. It is the heading, set small like the mark on a poster. */
  title: string;
  /** The dates as they should be set: "12–14 June 2027". */
  dates: string;
  /** Where it is: a city, or a city with the place. */
  venue: string | LineupVenue;
  /** The billing, largest first. The first tier is set largest, the second in the middle and every other tier small, so three read best. */
  tiers: readonly LineupTier[];
  /** Where to buy tickets. Leave it out for no button. */
  ticketsHref?: string;
  /** Where to read the programme. Leave it out for no button. */
  programmeHref?: string;
  /** Write the tier labels on the page, in a column beside the names, instead of leaving them to assistive technology. */
  showTierLabels?: boolean;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LineupHeroLabels>;
}

const LABELS: LineupHeroLabels = {
  when: "When",
  where: "Where",
  tickets: "Get tickets",
  programme: "Full programme",
};

/* Written out whole: Tailwind only generates the classes it can read in the source. The sizes follow the width of the names' own column. */
const SIZES = [
  "text-[clamp(2.5rem,calc(0.8rem_+_8.3cqi),7rem)] leading-[0.96] tracking-[-0.05em] text-foreground",
  "text-[clamp(1.5rem,calc(0.75rem_+_4.3cqi),3.75rem)] leading-[1.04] tracking-[-0.035em] text-foreground",
  "text-[clamp(1.0625rem,calc(0.7rem_+_1.7cqi),1.875rem)] leading-[1.2] tracking-[-0.02em] text-muted-foreground",
];

/** One name: plain, or a link with a thin rule under it that thickens on hover. The role is small and follows it. */
function Name({ name, role, href }: LineupName) {
  const text = <span className="[overflow-wrap:anywhere]">{name}</span>;
  return (
    <>
      {href ? (
        <a
          href={href}
          className="rounded-[0.08em] underline decoration-current/25 decoration-[max(1px,0.02em)] underline-offset-[0.14em] outline-none transition-[text-decoration-color] duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          {text}
        </a>
      ) : (
        text
      )}
      {role ? (
        <>
          <span className="sr-only">, </span>
          <span className="ml-[0.45em] text-[max(0.75rem,0.26em)] leading-none font-normal tracking-[0.14em] whitespace-nowrap text-muted-foreground uppercase">{role}</span>
        </>
      ) : null}
    </>
  );
}

/**
 * A festival or conference poster set in type. The dates and the city are
 * display type across the top, the festival's own name sits small above them
 * like the mark on a poster, and the names run underneath in three sizes by
 * billing: headliners large, the middle tier at half that, the rest small
 * and quiet. Names are separated by thin slashes and wrap like a poster; a
 * name with an address is a link, a role is set small after the name, and
 * every tier is a heading for assistive technology. The sizes follow the width
 * of the names' own column, so the poster reflows in a narrow column as well
 * as a wide page and a long name wraps instead of overflowing. There are no
 * portraits to load, which is the point: for festivals, conferences and
 * symposia.
 */
export function LineupHero({ titleAs: Title = "h2", title, dates, venue, tiers, ticketsHref, programmeHref, showTierLabels = false, labels: custom, className, ...props }: LineupHeroProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();
  const place: LineupVenue = typeof venue === "string" ? { city: venue } : venue;
  // The tiers are headings one level under the title, whichever level the title is.
  const Sub = Title === "h1" ? "h2" : "h3";

  return (
    <section data-slot="lineup-hero" aria-labelledby={`${id}-title`} className={cn("@container w-full py-14 sm:py-20", className)} {...props}>
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t-2 border-foreground pt-4">
        <Title id={`${id}-title`} className="text-lg leading-tight font-medium tracking-[-0.02em] sm:text-xl [overflow-wrap:anywhere]">
          {title}
        </Title>
        {ticketsHref || programmeHref ? (
          <div className="flex flex-wrap items-center gap-3">
            {ticketsHref ? (
              <Button asChild>
                <a href={ticketsHref}>
                  <IconTicket />
                  {words.tickets}
                </a>
              </Button>
            ) : null}
            {programmeHref ? (
              <Button asChild variant="outline">
                <a href={programmeHref}>
                  {words.programme}
                  <IconArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </header>

      <dl className="mt-8 text-[clamp(2.75rem,calc(1.85rem_+_8.3cqi),8.25rem)] leading-[0.92] font-medium tracking-[-0.05em] sm:mt-10">
        <div>
          <dt className="sr-only">{words.when}</dt>
          <dd className="text-balance [overflow-wrap:anywhere]">{dates}</dd>
        </div>
        <div>
          <dt className="sr-only">{words.where}</dt>
          <dd className="text-balance text-muted-foreground [overflow-wrap:anywhere]">{place.city}</dd>
          {place.name ? <dd className="mt-[0.4em] text-[max(0.8125rem,0.2em)] leading-tight font-normal tracking-[-0.01em] text-muted-foreground [overflow-wrap:anywhere]">{place.name}</dd> : null}
        </div>
      </dl>

      <div className="mt-10 border-t-2 border-foreground sm:mt-12">
        {tiers.map((tier, tierIndex) => (
          <div key={`${tierIndex}-${tier.label}`} className={cn("border-border py-6 sm:py-8 not-first:border-t", showTierLabels && "@3xl:grid @3xl:grid-cols-[9rem_minmax(0,1fr)] @3xl:gap-8")}>
            <Sub className={cn(showTierLabels ? "mb-3 text-sm font-medium text-muted-foreground @3xl:mt-[0.4em] @3xl:mb-0" : "sr-only")}>{tier.label}</Sub>
            <div className="@container min-w-0">
              <ul className={cn("flex flex-wrap items-baseline gap-x-[0.28em] gap-y-[0.08em] font-medium", SIZES[Math.min(tierIndex, SIZES.length - 1)])}>
                {tier.names.map((item, nameIndex) => (
                  <li key={`${item.name}-${nameIndex}`} className="max-w-full min-w-0">
                    <Name {...item} />
                    {nameIndex < tier.names.length - 1 ? (
                      <span aria-hidden="true" className="ml-[0.28em] font-extralight text-muted-foreground/50">
                        /
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
