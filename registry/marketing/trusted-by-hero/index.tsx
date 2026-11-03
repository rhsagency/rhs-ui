import type { ComponentProps, ReactNode } from "react";

import { IconStar } from "@rhs-ui/icons";
import type { Logo } from "@rhs-ui/marketing/logo-cloud";
import { ScrollStrip } from "@rhs-ui/marketing/trusted-by-hero/scroll-strip";
import { cn } from "@/lib/utils";

export interface TrustedByRating {
  /** The score, such as 4.8. It is shown with at most one decimal. */
  score: number;
  /** How many reviews it is made from. */
  count: number;
  /** Where the reviews are: "G2", "the App Store". */
  source: string;
  /** The top of the scale, 5 by default. It is only said to a screen reader: "4.8 out of 5". */
  max?: number;
}

export interface TrustedByHeroLabels {
  /** What follows the score. {count} and {source} stand for the review count and where the reviews are. */
  reviews: string;
  /** What a screen reader hears after the score. {max} stands for the top of the scale. */
  outOf: string;
}

export interface TrustedByHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The kicker over the title, set after a short rule: "Billing for teams". */
  eyebrow?: string;
  /** The promise: a wide headline, as large as the screen allows. */
  title: string;
  /** One or two sentences of support under it. */
  description?: string;
  /** One or two actions: the one you want pressed, and a quieter one. */
  actions?: ReactNode;
  /** What the strip at the foot says, in a few words: "Trusted by 4,200 teams". It also names the strip for assistive technology. */
  proofLabel: string;
  /** The customer marks, as in LogoCloud: a name, and an SVG or image for the mark, and a link if there is a story to link to. Five or six fit in a row; more scroll. */
  logos: readonly Logo[];
  /** A score, a count and where it comes from, at the far end of the strip. */
  rating?: TrustedByRating;
  /** Locale for the numbers in the rating. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TrustedByHeroLabels>;
}

const LABELS: TrustedByHeroLabels = { reviews: "from {count} reviews on {source}", outOf: "out of {max}" };

/**
 * A left-aligned promise with its proof on the first screen. A wide headline,
 * support text and two actions take the top; at the foot, under a hairline,
 * a strip says who trusts you in a line ("Trusted by 4,200 teams"), shows six
 * customer marks in the text colour and, if you have one, puts a rating at
 * the far end. The strip counts toward the height of the first screen (the
 * hero is at least 100svh tall and the strip is pinned to its foot), which is
 * what sets it apart from a logo cloud placed after the hero in the hope that
 * people scroll to it. From 1280px the label, the marks and the rating share
 * one line; below that the label and the rating share a line above the marks,
 * so the marks have the whole width. Where they still do not fit, such as on a
 * phone, the marks scroll sideways and snap instead of wrapping into a second
 * row, the edge with more past it fades out so it is plain that there is more
 * (and the other edge too, once the strip has moved), and the strip is a stop
 * for the keyboard, but only while there is something to scroll. Each mark is
 * named for a screen reader and reaches full strength on hover and focus. The
 * fades are the only change of state; nothing animates. With a bar above the
 * hero, pass a min-h class that takes its height off, such as
 * min-h-[calc(100svh-4rem)].
 */
export function TrustedByHero({
  titleAs: Title = "h2",
  eyebrow,
  title,
  description,
  actions,
  proofLabel,
  logos,
  rating,
  locale = "en-US",
  labels: custom,
  className,
  ...props
}: TrustedByHeroProps) {
  const labels = { ...LABELS, ...custom };
  const score = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(rating?.score ?? 0);
  const count = new Intl.NumberFormat(locale).format(rating?.count ?? 0);

  return (
    <section data-slot="trusted-by-hero" className={cn("flex min-h-svh flex-col", className)} {...props}>
      <div className="flex flex-1 flex-col justify-center py-16 sm:py-24">
        {eyebrow ? (
          <p className="mb-6 flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <span aria-hidden="true" className="h-px w-8 bg-foreground/40" />
            {eyebrow}
          </p>
        ) : null}
        <Title className="max-w-4xl text-5xl leading-[1.02] font-medium tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">{title}</Title>
        {description ? <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        {actions ? <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>

      <div data-slot="trusted-by-hero-strip" className="border-t border-border py-6 sm:py-8">
        <div className="grid grid-cols-1 items-center gap-x-8 gap-y-5 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[auto_minmax(0,1fr)_auto]">
          <p className="text-sm text-muted-foreground sm:col-start-1 sm:row-start-1 xl:max-w-28 xl:text-balance">{proofLabel}</p>
          {/* The strip is 4px wider than its cell on each side, with the same in padding, so the ring of a first or last link has room inside the clip. scroll-px keeps a mark that scrolls into view clear of the fade at the edges. */}
          <ScrollStrip
            aria-label={proofLabel}
            frameClassName="-mx-1 min-w-0 sm:col-span-2 sm:row-start-2 xl:col-span-1 xl:col-start-2 xl:row-start-1"
            className="relative snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-14 rounded-md px-1 py-1 outline-none [scrollbar-color:color-mix(in_oklch,var(--muted-foreground)_45%,transparent)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:scroll-auto [@media(pointer:coarse)]:[&::-webkit-scrollbar]:hidden [@media(pointer:coarse)]:[scrollbar-width:none]"
          >
            <ul role="list" className="flex w-max min-w-full items-center justify-between gap-x-6">
              {logos.map((logo) => {
                const body = logo.mark ? (
                  <span aria-hidden="true" className="block [&_img]:h-6 [&_img]:w-auto [&_svg]:h-6 [&_svg]:w-auto">
                    {logo.mark}
                  </span>
                ) : (
                  <span className="text-lg font-semibold tracking-tight whitespace-nowrap">{logo.name}</span>
                );
                return (
                  <li key={logo.name} className="shrink-0 snap-start text-foreground/60 hover:text-foreground focus-within:text-foreground">
                    {logo.href ? (
                      <a href={logo.href} aria-label={logo.name} className="flex items-center rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        {body}
                      </a>
                    ) : (
                      <>
                        {body}
                        {logo.mark ? <span className="sr-only">{logo.name}</span> : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </ScrollStrip>
          {rating ? (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm sm:col-start-2 sm:row-start-1 sm:justify-self-end xl:col-start-3 xl:grid xl:border-s xl:border-border xl:ps-6">
              <span className="flex items-center gap-1.5">
                <IconStar aria-hidden="true" className="size-4 shrink-0 fill-current" />
                <span className="font-medium tabular-nums">
                  {score}
                  <span className="sr-only"> {labels.outOf.replace("{max}", String(rating.max ?? 5))}</span>
                </span>
              </span>
              <span className="text-muted-foreground xl:text-xs xl:whitespace-nowrap">{labels.reviews.replace("{count}", count).replace("{source}", rating.source)}</span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
