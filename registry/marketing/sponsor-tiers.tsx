import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface Sponsor {
  /** The sponsor's name. It is what the link is called, so it is always real text. */
  name: string;
  /** Their mark as an SVG or an image, drawn about 36px tall in a large tile and 28px in a compact cell, in the text colour. Without one the name is set as text. */
  mark?: ReactNode;
  /** An image for the supporters tier: a face or a logo. Initials stand in until it loads, and when there is none. */
  avatar?: string;
  /** Where the link goes. Without it the sponsor is shown but is not a link. */
  href?: string;
  /** One line about them, shown in a large tile: "Hosting for every preview build". */
  blurb?: string;
}

/** How much room a tier gets: `lg` large tiles with a name and a line, `md` a compact grid of marks, `sm` avatars with names in columns. */
export type SponsorTierSize = "lg" | "md" | "sm";

export interface SponsorTier {
  /** The name of the tier, which is also its heading: "Platinum", "Gold", "Supporters". */
  name: string;
  /** The weight of the tier. Put the largest first. */
  size: SponsorTierSize;
  sponsors: readonly Sponsor[];
}

export interface SponsorTiersProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One or two sentences under the title: what the money keeps going. */
  description?: string;
  /** Up to three tiers of falling visual weight, in the order they are shown. A tier without sponsors is left out, so no heading stands alone. */
  tiers: readonly SponsorTier[];
  /** The way to join, a button under the tiers: { label: "Become a sponsor", href }. */
  action?: { label: string; href: string };
  /** Mark every sponsor link `rel="sponsored"`, for sponsorships that are paid in return for a link. Default false. */
  sponsoredLinks?: boolean;
}

/** Every mark is drawn at one height, whatever shape it comes in; the width follows. */
const MARK_LG = "inline-flex h-9 items-center text-foreground [&_img]:h-9 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-9 [&_svg]:w-auto [&_svg]:max-w-full";
const MARK_MD = "inline-flex h-7 items-center [&_img]:h-7 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-7 [&_svg]:w-auto [&_svg]:max-w-full";

/** A sponsor with an address is a link; one without is a plain block, so nothing looks clickable that is not. */
function Entry({ href, rel, className, children }: { href?: string; rel?: string; className?: string; children: ReactNode }) {
  return href ? (
    <a href={href} rel={rel} className={className}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
}

/**
 * The people and companies that back a project, grouped by how much they give and shown with the weight that
 * deserves: the top tier in large tiles with a mark, a name and a line about them; the middle tier as a compact
 * hairline grid of marks; supporters as avatars with names, in columns. Tier names are real headings, so the
 * structure can be navigated, and every sponsor with an address is one link named by its text. Set
 * `sponsoredLinks` when the sponsorship is paid in return for a link and every link carries rel="sponsored".
 * Under the tiers, the way to join. It works for open-source projects, events, charities and partner programmes
 * alike. No state of its own, so it renders on the server.
 */
export function SponsorTiers({ title, description, tiers, action, sponsoredLinks = false, className, ...props }: SponsorTiersProps) {
  const heading = useId();
  const rel = sponsoredLinks ? "sponsored" : undefined;

  return (
    <section data-slot="sponsor-tiers" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <div className="mt-12 grid gap-12 sm:mt-16">
        {tiers.filter((tier) => tier.sponsors.length > 0).map((tier) => (
          <div key={tier.name} className="grid min-w-0 gap-5">
            <div className="flex items-center gap-4">
              <h3 className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{tier.name}</h3>
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>
            {tier.size === "lg" ? (
              <ul role="list" className="grid gap-4 sm:grid-cols-2">
                {tier.sponsors.map((sponsor) => (
                  <li key={sponsor.name} className="sm:last:odd:col-span-2">
                    <Entry
                      href={sponsor.href}
                      rel={rel}
                      className={cn(
                        "group/tile flex h-full min-h-44 flex-col justify-between gap-8 rounded-2xl border border-border bg-card p-6 text-card-foreground outline-none sm:p-7",
                        sponsor.href && "transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                      )}
                    >
                      {sponsor.mark ? (
                        <span aria-hidden="true" className={MARK_LG}>
                          {sponsor.mark}
                        </span>
                      ) : null}
                      <span className="mt-auto grid gap-1.5">
                        <span className="flex items-center justify-between gap-3 text-lg leading-snug font-medium tracking-[-0.02em]">
                          {sponsor.name}
                          {sponsor.href ? (
                            <IconArrowUpRight
                              aria-hidden="true"
                              className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 motion-safe:group-hover/tile:translate-x-0.5 motion-safe:group-hover/tile:-translate-y-0.5 motion-reduce:transition-none"
                            />
                          ) : null}
                        </span>
                        {sponsor.blurb ? <span className="text-sm leading-relaxed text-pretty text-muted-foreground">{sponsor.blurb}</span> : null}
                      </span>
                    </Entry>
                  </li>
                ))}
              </ul>
            ) : null}
            {tier.size === "md" ? (
              /* The rows are pushed a hairline out of their frame on the right and below, so every cell owns its right and bottom rule; the cells of a short last row grow to fill it, so no cell is ever left empty. */
              <div className="overflow-hidden rounded-2xl border border-border">
                <ul role="list" className="-mr-px -mb-px flex flex-wrap">
                  {tier.sponsors.map((sponsor) => (
                    <li key={sponsor.name} className="min-w-0 grow basis-1/2 border-r border-b border-border sm:basis-1/3 lg:basis-1/4">
                      <Entry
                        href={sponsor.href}
                        rel={rel}
                        className={cn(
                          "flex h-24 w-full items-center justify-center px-6 text-foreground/60 outline-none",
                          sponsor.href && "transition-colors duration-200 hover:bg-muted/50 hover:text-foreground focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none",
                        )}
                      >
                        {sponsor.mark ? (
                          <>
                            <span aria-hidden="true" className={MARK_MD}>
                              {sponsor.mark}
                            </span>
                            <span className="sr-only">{sponsor.name}</span>
                          </>
                        ) : (
                          <span className="text-base font-semibold tracking-[-0.02em]">{sponsor.name}</span>
                        )}
                      </Entry>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {tier.size === "sm" ? (
              <ul role="list" className="columns-1 gap-x-8 min-[380px]:columns-2 sm:columns-3 lg:columns-4">
                {tier.sponsors.map((sponsor) => (
                  <li key={sponsor.name} className="break-inside-avoid">
                    <Entry
                      href={sponsor.href}
                      rel={rel}
                      className={cn(
                        "-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-foreground outline-none",
                        sponsor.href && "transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                      )}
                    >
                      {/* Only for the eye: the name is written next to it, so the link is read as its name and never as "AM Arjun Mehta". */}
                      <Avatar aria-hidden="true">
                        {sponsor.avatar ? <AvatarImage src={sponsor.avatar} alt="" /> : null}
                        <AvatarFallback>{initialsOf(sponsor.name)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 truncate">{sponsor.name}</span>
                    </Entry>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      {action ? (
        <div className="mt-12 flex justify-center sm:mt-14">
          <Button asChild size="lg">
            <a href={action.href}>
              {action.label}
              <IconArrowRight />
            </a>
          </Button>
        </div>
      ) : null}
    </section>
  );
}
