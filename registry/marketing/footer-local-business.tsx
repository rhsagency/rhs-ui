import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconClock, IconList, IconMail, IconNavigation, IconPhone, IconPin } from "@rhs-ui/icons";
import type { FooterLink } from "@rhs-ui/marketing/footer-section";
import { Button } from "@rhs-ui/primitives/button";
import type { OpeningHoursProps } from "@rhs-ui/primitives/opening-hours";
import { cn } from "@/lib/utils";

export interface FooterLocalBusinessRegistration {
  /** The register, as people know it: "KvK", "BTW", "HRB", "USt-IdNr.". */
  label: string;
  /** The number. It is set in figures that line up, and is plain text, so it can be copied. */
  value: string;
}

export interface FooterLocalBusinessLabels {
  /** The heading over the address and the contact details. */
  visit: string;
  /** The heading over the opening hours, which also names that block for a screen reader. */
  hours: string;
  /** Read out after today's weekday, in brackets: "today". Nothing shows on screen, today is marked in weight and ground. */
  today: string;
  /** What a day without opening hours says. */
  closed: string;
  /** The heading over the list of pages. */
  links: string;
  /** The heading over the route block. */
  route: string;
  /** The text of the route button. */
  routeCta: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
  /** The name of the list of trade register and VAT numbers. */
  registration: string;
}

export interface FooterLocalBusinessProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your name or mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** The postal address, a line each: street and number, postcode and city, country. */
  address: readonly string[];
  /** The number, written the way people say it: "030 555 0142". It is the text of the link as well as the number dialled. */
  phone: string;
  /** The tel: address when it is not the digits of phone, for a number with a bracket or an extension. */
  phoneHref?: string;
  email: string;
  /** The week, in the shape OpeningHours takes: the days, today's index and the open-now line, worked out on your side in the business's time zone. The footer draws the week itself, so labels can translate its words. */
  hours: OpeningHoursProps;
  /** Your address in a maps app: the route button opens it in a new tab. */
  routeHref: string;
  /** A line beside the button: where to park, how to find the door. */
  routeNote?: string;
  /** A picture of the spot above the button: a static map or a drawing. It is decoration, so give it no text a visitor needs. */
  map?: ReactNode;
  /** The services or pages, as a short list. */
  links: readonly FooterLink[];
  /** The trade register and VAT numbers that a Dutch or German site is expected to show. They sit in the legal row. */
  registration?: readonly FooterLocalBusinessRegistration[];
  /** The bottom row, left: "© 2026 Kestrel Cycles". */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterLocalBusinessLabels>;
}

const LABELS: FooterLocalBusinessLabels = {
  visit: "Visit us",
  hours: "Opening hours",
  today: "today",
  closed: "Closed",
  links: "Explore",
  route: "Find us",
  routeCta: "Plan your route",
  newTab: "opens in a new tab",
  registration: "Registration",
};

const heading = "flex items-center gap-2 text-sm font-medium [&_svg]:size-4 [&_svg]:shrink-0";
const linkClass =
  "-my-1 inline-block rounded-sm py-1 text-sm text-muted-foreground underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:decoration-foreground/40 focus-visible:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
const contactClass =
  "-my-1 inline-flex items-start gap-2 rounded-sm py-1 text-sm break-words underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground/40 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

/**
 * The footer for a shop, a practice or a tradesperson, the sites that turn a
 * visit into a phone call. Four blocks on one grid: the address with tap-to-
 * call and mail links, the opening hours with today marked in words, the
 * services or pages as links, and a button that opens your route in a maps
 * app. The legal row carries the trade register and VAT numbers. Every contact
 * detail is plain text as well as a link, so it can be read out, copied and
 * printed. The address is a real address element. Every fixed word, the heading
 * of the hours, today and Closed included, is in labels, so the footer speaks
 * the language of the page. No state of its own, so it renders on the server.
 */
export function FooterLocalBusiness({
  brand,
  tagline,
  address,
  phone,
  phoneHref,
  email,
  hours,
  routeHref,
  routeNote,
  map,
  links,
  registration = [],
  legal,
  legalLinks = [],
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: FooterLocalBusinessProps) {
  const words = { ...LABELS, ...custom };
  const id = useId();

  return (
    <footer data-slot="footer-local-business" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid max-w-md gap-3 py-10">
          <div>{brand}</div>
          {tagline ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}
        </div>

        <div className="grid gap-x-8 gap-y-10 border-t border-border py-10 sm:grid-cols-2 lg:grid-cols-4">
          <section aria-labelledby={`${id}-visit`} className="grid content-start gap-4">
            <h2 id={`${id}-visit`} className={heading}>
              <IconPin aria-hidden="true" />
              {words.visit}
            </h2>
            <address className="grid gap-4 not-italic">
              <p className="text-sm leading-relaxed">
                {address.map((line, index) => (
                  <span key={`${line}-${index}`} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <ul className="grid gap-1.5">
                <li>
                  <a href={phoneHref ?? `tel:${phone.replace(/[^\d+]/g, "")}`} className={contactClass}>
                    <IconPhone aria-hidden="true" />
                    <span className="tabular-nums">{phone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} className={contactClass}>
                    <IconMail aria-hidden="true" />
                    {email}
                  </a>
                </li>
              </ul>
            </address>
          </section>

          {/* The week is drawn here, not by OpeningHours: that primitive's heading, its "today" and its "Closed" are fixed English words, and a footer on a Dutch or German site has to speak the language of the page. No card either: the grid is the frame. */}
          <section aria-labelledby={`${id}-hours`} className={hours.className}>
            <h2 id={`${id}-hours`} className={heading}>
              <IconClock aria-hidden="true" />
              {words.hours}
            </h2>
            {hours.status ? (
              <p className="mt-2 flex items-center gap-2 text-sm">
                <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", hours.status.open ? "bg-foreground" : "border border-muted-foreground")} />
                {hours.status.text}
              </p>
            ) : null}
            <dl className="-mx-2 mt-4 grid gap-1.5 text-sm">
              {hours.days.map((day, index) => (
                <div key={`${day.day}-${index}`} className={cn("flex justify-between gap-4 rounded-md px-2 py-1", index === hours.today && "bg-muted font-medium")}>
                  <dt>
                    {day.day}
                    {index === hours.today ? <span className="sr-only"> ({words.today})</span> : null}
                  </dt>
                  <dd className={cn("tabular-nums", !day.hours && "text-muted-foreground")}>{day.hours ?? words.closed}</dd>
                </div>
              ))}
            </dl>
            {hours.note ? <p className="mt-3 text-xs text-muted-foreground">{hours.note}</p> : null}
          </section>

          <nav aria-labelledby={`${id}-links`} className="grid content-start gap-4">
            <h2 id={`${id}-links`} className={heading}>
              <IconList aria-hidden="true" />
              {words.links}
            </h2>
            <ul className="grid gap-2.5">
              {links.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}
                      <span className="sr-only"> ({words.newTab})</span>
                    </a>
                  ) : (
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby={`${id}-route`} className="grid content-start gap-4">
            <h2 id={`${id}-route`} className={heading}>
              <IconNavigation aria-hidden="true" />
              {words.route}
            </h2>
            {map ? (
              <div aria-hidden="true" className="aspect-[16/10] overflow-hidden rounded-xl border border-border bg-muted [&>*]:size-full">
                {map}
              </div>
            ) : null}
            {routeNote ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{routeNote}</p> : null}
            <Button asChild variant="outline" className="w-full sm:w-fit">
              <a href={routeHref} target="_blank" rel="noopener noreferrer">
                <IconNavigation aria-hidden="true" />
                {words.routeCta}
                <span className="sr-only"> ({words.newTab})</span>
              </a>
            </Button>
          </section>
        </div>

        <div className="flex flex-col gap-4 border-t border-border py-6 text-xs text-muted-foreground md:flex-row md:items-start md:justify-between">
          <div className="grid gap-2">
            <div>{legal}</div>
            {registration.length ? (
              <dl aria-label={words.registration} className="flex flex-wrap gap-x-5 gap-y-1">
                {registration.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="flex gap-1.5">
                    <dt>{item.label}</dt>
                    <dd className="text-foreground tabular-nums">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          {legalLinks.length ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, "text-xs")}>
                      {link.label}
                      <span className="sr-only"> ({words.newTab})</span>
                    </a>
                  ) : (
                    <Link href={link.href} className={cn(linkClass, "text-xs")}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
