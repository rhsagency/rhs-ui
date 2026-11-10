import type { ComponentProps, CSSProperties, ElementType, ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { LocalTime } from "@rhs-ui/marketing/footer-inverted-contact/local-time";
import { cn } from "@/lib/utils";

export interface ContactFooterLink {
  /** The link's text: a profile's name, or a page's. */
  label: string;
  /** Where it goes. */
  href: string;
}

export interface FooterInvertedContactLabels {
  /** The heading of the address column. Default "Address". */
  address: string;
  /** The heading of the column of profiles. Default "Follow". */
  follow: string;
  /** The heading of the column of pages. Default "Sitemap". */
  sitemap: string;
  /** What a screen reader hears after a link that opens in a new tab. Default "opens in a new tab". */
  newTab: string;
  /** The accessible name of the local time, with the city in `{city}`. Default "Local time in {city}". */
  localTime: string;
}

export interface FooterInvertedContactProps extends Omit<ComponentProps<"footer">, "children"> {
  /** The address people write to. It is set as one very large link with an arrow, and a long one breaks after the @ rather than running off a phone. */
  email: string;
  /** A line above the address: "Have a project in mind? Write to us." */
  headline?: ReactNode;
  /** The studio's postal address, one line per item. */
  address?: readonly string[];
  /** Profiles, as links that open in a new tab. */
  social?: readonly ContactFooterLink[];
  /** The pages of the site, as a sitemap column. */
  links?: readonly ContactFooterLink[];
  /** The city of the local-time line: "Amsterdam". The line shows only when `timeZone` is given too. */
  city?: string;
  /** The IANA time zone of that city: "Europe/Amsterdam". The clock reads it and has no default, because a guessed zone would tell the wrong time; a name the browser does not know shows the city without a clock. */
  timeZone?: string;
  /** The locale the clock is written in. "en-GB" gives 14:32; the default "en-US" gives 02:32 PM. */
  locale?: string;
  /** The bottom row, right: "© 2026 Atelier Nord. Chamber of Commerce 12345678." */
  legal?: ReactNode;
  /** Renders the sitemap links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterInvertedContactLabels>;
}

const LABELS: FooterInvertedContactLabels = { address: "Address", follow: "Follow", sitemap: "Sitemap", newTab: "opens in a new tab", localTime: "Local time in {city}" };

const HEADING = "font-mono text-[0.6875rem] tracking-wide text-primary-foreground/60 uppercase";
const LINK =
  "inline-flex items-center gap-0.5 rounded-sm text-sm text-primary-foreground/80 underline-offset-4 outline-none transition-colors duration-150 hover:text-primary-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60 motion-reduce:transition-none";

/**
 * The page ends on an inverted surface, and the conversation starts by mail:
 * one very large email address set as a link with an arrow, a line above it
 * if you want one, then three small columns (address, follow, sitemap) and a
 * line with the studio's local time and the legal text. The colours are the
 * inverted pair of your theme (primary and primary-foreground), so contrast
 * holds in light and in dark. The local time is "Amsterdam 14:32", written in an
 * IANA time zone you name and rewritten every minute; it renders after the page
 * is live so the server and the browser never disagree, and it is a time element
 * with an accessible name, not a ticking announcement. For studios, agencies and
 * freelancers. The sitemap links are server-rendered, so a Server Component can
 * pass its router's Link as linkAs.
 */
export function FooterInvertedContact({ email, headline, address = [], social = [], links = [], city, timeZone, locale = "en-US", legal, linkAs: Link = "a", labels, className, ...props }: FooterInvertedContactProps) {
  const words = { ...LABELS, ...labels };
  const at = email.indexOf("@");
  const clock = city && timeZone ? <LocalTime city={city} timeZone={timeZone} locale={locale} label={words.localTime} /> : null;

  return (
    <footer data-slot="footer-inverted-contact" className={cn("bg-primary text-primary-foreground", className)} {...props}>
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-10">
        {headline ? <p className="mb-5 max-w-xl text-base text-pretty text-primary-foreground/70 sm:text-lg">{headline}</p> : null}
        {/*
          The size, from the width of the column and about half an em a letter: the address and its arrow on one line, as large as that allows up to 6rem,
          as long as that is 2.75rem or more. A longer address is set at 2.75rem or the largest size at which its longest piece (it breaks after the @
          and after a hyphen) fits, whichever is smaller, so it never breaks inside a word; the arrow follows the last letter on the last line.
        */}
        <div className="@container">
          <a
            href={`mailto:${email}`}
            style={
              {
                "--email-letters": email.length,
                "--email-longest": Math.max(...email.split(/(?<=[@-])/).map((piece) => piece.length)),
                fontSize: "clamp(1.5rem, max(calc(100cqw / (var(--email-letters) * 0.52 + 1.1)), min(calc(100cqw / (var(--email-longest) * 0.52 + 1.1)), 2.75rem)), 6rem)",
              } as CSSProperties
            }
            className="group/email block w-fit max-w-full rounded-xl leading-[1.04] font-medium tracking-[-0.05em] [overflow-wrap:anywhere] outline-none focus-visible:ring-[3px] focus-visible:ring-primary-foreground/60 focus-visible:ring-offset-8 focus-visible:ring-offset-primary"
          >
            <span className="underline decoration-primary-foreground/25 decoration-[0.04em] underline-offset-[0.14em] transition-[text-decoration-color] duration-200 group-hover/email:decoration-primary-foreground motion-reduce:transition-none">
              {at > 0 ? (
                <>
                  {email.slice(0, at + 1)}
                  <wbr />
                  {email.slice(at + 1)}
                </>
              ) : (
                email
              )}
            </span>
            <IconArrowUpRight
              aria-hidden="true"
              className="ml-[0.12em] inline-block size-[0.58em] align-[0.1em] transition-transform duration-200 motion-reduce:transition-none motion-safe:group-hover/email:translate-x-[0.06em] motion-safe:group-hover/email:-translate-y-[0.06em]"
            />
          </a>
        </div>

        {address.length || social.length || links.length ? (
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-primary-foreground/20 pt-10 sm:mt-20 md:grid-cols-3">
            {address.length ? (
              <div className="col-span-2 md:col-span-1">
                <h2 className={HEADING}>{words.address}</h2>
                <address className="mt-4 grid gap-0.5 text-sm text-primary-foreground/80 not-italic">
                  {address.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
              </div>
            ) : null}
            {social.length ? (
              <div>
                <h2 className={HEADING}>{words.follow}</h2>
                <ul className="mt-4 grid gap-2">
                  {social.map((profile) => (
                    <li key={`${profile.label}-${profile.href}`}>
                      <a href={profile.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                        {profile.label}
                        <IconArrowUpRight aria-hidden="true" className="size-3.5" />
                        <span className="sr-only"> ({words.newTab})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {links.length ? (
              <nav aria-label={words.sitemap}>
                <h2 className={HEADING}>{words.sitemap}</h2>
                <ul className="mt-4 grid gap-2">
                  {links.map((link) => (
                    <li key={`${link.label}-${link.href}`}>
                      <Link href={link.href} className={LINK}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
        ) : null}

        {clock || legal ? (
          <div className="mt-14 flex flex-col gap-3 border-t border-primary-foreground/20 pt-6 text-xs text-primary-foreground/70 sm:flex-row sm:items-center sm:justify-between">
            {clock ?? <span />}
            {legal ? <div>{legal}</div> : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
