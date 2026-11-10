import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconMail, IconPhone } from "@rhs-ui/icons";
import type { OpeningHoursProps } from "@rhs-ui/primitives/opening-hours";
import { cn } from "@/lib/utils";

/** The open-now line, in the shape OpeningHours takes: your words, worked out from your clock in the business's time zone. */
export type UtilityBarStatus = NonNullable<OpeningHoursProps["status"]>;

export interface UtilityBarLink {
  label: string;
  href: string;
  /** An icon in front of the label, 14px: a person for the customer portal, a globe for the language. */
  icon?: ReactNode;
  /** The language of the label when it is not the page's ("Nederlands"): sets lang and hreflang, so it is read out right. */
  lang?: string;
  /** Opens in a new tab with rel="noopener noreferrer", and says so to a screen reader. */
  external?: boolean;
}

export interface UtilityBarLabels {
  /** The name of the list of contact details. */
  contact: string;
  /** The name of the navigation with the utility links. */
  links: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface UtilityBarProps extends Omit<ComponentProps<"div">, "children"> {
  /** The number, written the way people say it: "030 555 0142". It is the text of the link as well as the number dialled. */
  phone?: string;
  /** The tel: address when it is not the digits of phone, for a number with a bracket or an extension. */
  phoneHref?: string;
  /** The address, as the text of the mailto: link. Hidden below sm, and, when there are links, between md and lg, where the links take its place. */
  email?: string;
  /** "Open until 17:30" or "Closed, opens Monday 08:00": a dot and your words. The words carry the meaning, the dot only repeats it. */
  status?: UtilityBarStatus;
  /** Customer portal, language, help. They sit on the right from md up; on a phone they belong in the main menu. */
  links?: readonly UtilityBarLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<UtilityBarLabels>;
}

const LABELS: UtilityBarLabels = { contact: "Contact", links: "Utility", newTab: "opens in a new tab" };

const item =
  "inline-flex min-h-8 items-center gap-1.5 rounded-sm outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-3.5 [&_svg]:shrink-0";

/**
 * The slim bar above the header with what a visitor needs to reach you today:
 * your phone and email as tap-to-call and mail links, an open-now line in
 * words, and on the right the utility links (customer portal, language, help).
 * The status is text first and a dot second, so it never leans on colour. On a
 * phone only the phone link and the status stay; the rest belong in the main
 * menu, and a bar left with nothing to show on a phone is not drawn at all. The
 * bar stays one row from a tablet up: the email makes way for the links between
 * md and lg. It is deliberately not an announcement: it is calm, not inverted,
 * and holds only what is true every day. No state of its own, so it renders on
 * the server.
 */
export function UtilityBar({ phone, phoneHref, email, status, links = [], linkAs: Link = "a", labels: custom, className, ...props }: UtilityBarProps) {
  const words = { ...LABELS, ...custom };
  // The phone and the status are always on show. Without them the bar holds only what a wider screen shows: the email from sm, the links from md. Below that it would be an empty strip.
  const showFrom = phone || status ? "" : email ? "hidden sm:block" : links.length ? "hidden md:block" : "";

  return (
    <div data-slot="utility-bar" className={cn("border-b border-border bg-muted/50 text-[0.8125rem] text-muted-foreground", showFrom, className)} {...props}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-0.5 px-4 py-1.5 sm:px-6 md:py-0.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-0.5">
          {phone || email ? (
            <ul aria-label={words.contact} className="flex flex-wrap items-center gap-x-5">
              {phone ? (
                <li>
                  <a href={phoneHref ?? `tel:${phone.replace(/[^\d+]/g, "")}`} className={cn(item, "font-medium whitespace-nowrap text-foreground tabular-nums")}>
                    <IconPhone aria-hidden="true" />
                    {phone}
                  </a>
                </li>
              ) : null}
              {email ? (
                <li className={links.length ? "hidden sm:block md:hidden lg:block" : "hidden sm:block"}>
                  <a href={`mailto:${email}`} className={item}>
                    <IconMail aria-hidden="true" />
                    {email}
                  </a>
                </li>
              ) : null}
            </ul>
          ) : null}

          {status ? (
            <p role="status" className="flex min-h-8 items-center gap-2">
              <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", status.open ? "bg-foreground" : "border border-muted-foreground")} />
              <span className={cn("tabular-nums", status.open && "font-medium text-foreground")}>{status.text}</span>
            </p>
          ) : null}
        </div>

        {links.length ? (
          <nav aria-label={words.links} className="ml-auto hidden md:block">
            <ul className="flex items-center divide-x divide-border">
              {links.map((link) => (
                <li key={`${link.label}-${link.href}`} className="px-3.5 first:pl-0 last:pr-0">
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" lang={link.lang} hrefLang={link.lang} className={item}>
                      {link.icon}
                      {link.label}
                      <span className="sr-only"> ({words.newTab})</span>
                    </a>
                  ) : (
                    <Link href={link.href} lang={link.lang} hrefLang={link.lang} className={item}>
                      {link.icon}
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}
