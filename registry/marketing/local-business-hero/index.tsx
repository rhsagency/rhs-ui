import type { ComponentProps } from "react";

import { IconChevronDown, IconClock, IconMail, IconNavigation, IconPhone, IconPin } from "@rhs-ui/icons";
import { canTellStatus, fill, LABELS, type LocalBusinessLabels, type OpeningDay } from "@rhs-ui/marketing/local-business-hero/hours";
import { OpenStatus, TodayHours, WeekHours } from "@rhs-ui/marketing/local-business-hero/status";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { LocalBusinessLabels, OpeningDay } from "@rhs-ui/marketing/local-business-hero/hours";

export interface LocalBusinessImage {
  /** The address of the picture. A data: URI works too. */
  src: string;
  /** What the picture shows: "The shopfront on Kerkstraat, with bikes in the window". */
  alt: string;
  /** Intrinsic size, so the browser can reserve the space. */
  width?: number;
  height?: number;
  /** Candidate files for the browser to choose from, as in an <img srcset>. */
  srcSet?: string;
  /** How wide the picture is shown, as in an <img sizes>. Set it with `srcSet`. The default is half the screen from lg, the whole width below. */
  sizes?: string;
  /** A tiny picture, as a data: URI of a few hundred bytes, that stands in blurred while the real one loads. */
  blurDataUrl?: string;
}

export interface LocalBusinessHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The name's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The business's name. */
  name: string;
  /** One line on what it does. */
  tagline?: string;
  /** The number as people read it: "024 123 45 67". The call button and its tel: link are made from it, so a phone dials it with one tap. */
  phone: string;
  /** An email address. It becomes a mailto: link in the card. */
  email?: string;
  /** The address, as lines ("Kerkstraat 14", "6511 AB Nijmegen") or as one string. */
  address: string | readonly string[];
  /** The week as seven days in the shape of OpeningHours: a name and the hours, null for a closed day. The status is worked out from the hours text, written as 24-hour times: "09:00 to 18:00", or "09:00 to 12:30, 13:30 to 18:00" with a break. Hours it cannot read (12-hour times, fewer than seven days) show the card and the week as written, and no status. */
  hours: readonly OpeningDay[];
  /** Where the directions link leads: a map link for the address. */
  directionsHref: string;
  /** The photo at the top of the card. Leave it out for a card without one. */
  image?: LocalBusinessImage;
  /** The business's own time zone as an IANA name: "Europe/Amsterdam". Required, because "open now" is a statement about the clock where the business is, not where the visitor is. */
  timeZone: string;
  /** Which day `hours` starts on: 1 for Monday (the default), 0 for Sunday. */
  weekStartsOn?: 0 | 1;
  /** A fixed moment to work the status out for, for previews and tests. Leave it out and the visitor's own clock is read in the browser, so the server never prints a stale "Open". */
  now?: Date | string | number;
  /** Words for the fixed text and the status sentences, for a site that is not in English. `{time}`, `{day}` and `{phone}` are filled in. */
  labels?: Partial<LocalBusinessLabels>;
}

/** "+31 (0)24 123 45 67" -> "+31241234567": what a tel: link wants. */
function telOf(phone: string): string {
  return phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");
}

/**
 * The front of a local business: its name, whether it is open right now, and
 * a call button, all on the first screen. Beside them a card with a photo, the
 * address in an address element, today's hours and the full week folded into
 * a details element. The status ("Open now, closes 18:00", "Closed now, opens
 * tomorrow 13:00") is worked out in the business's time zone in the browser
 * while the server renders only the hours, so there is never a wrong "Open"
 * flash; the pill holds its place and fades in. Phone and email are real tel:
 * and mailto: links. For shops, garages, salons and practices, where the first
 * question is whether you are open and where you are.
 */
export function LocalBusinessHero({
  titleAs: Title = "h2",
  name,
  tagline,
  phone,
  email,
  address,
  hours,
  directionsHref,
  image,
  timeZone,
  weekStartsOn = 1,
  now,
  labels,
  className,
  ...props
}: LocalBusinessHeroProps) {
  const words = { ...LABELS, ...labels };
  const lines = typeof address === "string" ? [address] : address;
  const clock = { days: hours, timeZone, weekStartsOn, now, labels: words };
  // Decided here, on the server: hours the block cannot read (12-hour times, fewer than seven days) never give a status, so no pill is drawn and no space is kept for one.
  const tells = canTellStatus(hours, timeZone);

  return (
    <section data-slot="local-business-hero" className={cn("grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16", className)} {...props}>
      <div className="min-w-0">
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{name}</Title>
        {tagline ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{tagline}</p> : null}
        {tells ? <OpenStatus {...clock} className="mt-7" /> : null}
        <div className={cn("flex flex-wrap items-center gap-3", tells ? "mt-5" : "mt-8")}>
          <Button asChild size="lg" className="max-sm:grow">
            <a href={`tel:${telOf(phone)}`}>
              <IconPhone />
              {fill(words.call, { phone })}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="max-sm:grow">
            <a href={directionsHref}>
              <IconNavigation />
              {words.directions}
            </a>
          </Button>
        </div>
      </div>

      <div data-slot="local-business-hero-card" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
        {image ? (
          <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-muted">
            {image.blurDataUrl ? <span aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.blurDataUrl}")` }} /> : null}
            {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is any URL or data URI */}
            <img
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              srcSet={image.srcSet}
              sizes={image.sizes ?? "(min-width: 1024px) 48vw, 100vw"}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
          </div>
        ) : null}
        <div className="divide-y divide-border">
          <div className="flex gap-4 px-5 py-4">
            <IconPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <address className="text-sm leading-relaxed not-italic">
              <span className="sr-only">{words.address}: </span>
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </div>
          {hours.length ? (
            <div className="flex gap-4 px-5 py-4">
              <IconClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <TodayHours {...clock} />
            </div>
          ) : null}
          {email ? (
            <div className="flex gap-4 px-5 py-4">
              <IconMail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <a href={`mailto:${email}`} className="min-w-0 rounded-sm text-sm underline-offset-4 outline-none [overflow-wrap:anywhere] hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                {email}
              </a>
            </div>
          ) : null}
          {hours.length ? (
            <details className="group/week">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium transition-colors duration-150 outline-none select-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none [&::-webkit-details-marker]:hidden">
                {words.week}
                <IconChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open/week:rotate-180 motion-reduce:transition-none" />
              </summary>
              <div className="px-5 pb-5">
                <WeekHours {...clock} />
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
