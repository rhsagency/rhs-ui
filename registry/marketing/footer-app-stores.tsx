import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconPlay, IconSmartphone } from "@rhs-ui/icons";
import type { AppStoreLink } from "@rhs-ui/marketing/app-download-hero";
import type { FooterColumn, FooterLink } from "@rhs-ui/marketing/footer-section";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface FooterAppStoresLabels {
  /** The small line on the App Store button. {app} is your app's name. Read together with the store's name it names the link. */
  getAppStore: string;
  /** The small line on the Google Play button. {app} is your app's name. */
  getGooglePlay: string;
  /** The name of the list of store links. */
  stores: string;
  /** The line under the QR code. */
  scan: string;
  /** What a screen reader hears after a link that opens in a new tab. */
  newTab: string;
}

export interface FooterAppStoresProps extends Omit<ComponentProps<"footer">, "children"> {
  /** Your mark. */
  brand: ReactNode;
  /** One or two sentences under the mark. */
  tagline?: string;
  /** The name of the app. It goes into the name of each store link: "Get Atlas on the App Store". */
  appName: string;
  /** The stores the app is in, in the order they show. Each button is a real link to the store page. */
  stores: readonly AppStoreLink[];
  /** A QR code for visitors on a desktop, so they can scan their way to the phone: an img or an svg, dark on a clear ground. Shown from lg. */
  qr?: ReactNode;
  /** The link columns. */
  columns: readonly FooterColumn[];
  /** The bottom row, left: "© 2026 Atlas Labs B.V." */
  legal: ReactNode;
  /** The bottom row, right: privacy, terms, cookies. */
  legalLinks?: readonly FooterLink[];
  /** Renders the internal links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The name of the navigation landmark, for a site that is not in English or a page with two footers. */
  navLabel?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FooterAppStoresLabels>;
}

const LABELS: FooterAppStoresLabels = {
  getAppStore: "Get {app} on the",
  getGooglePlay: "Get {app} on",
  stores: "Get the app",
  scan: "Scan to get the app",
  newTab: "opens in a new tab",
};

const STORE = {
  "app-store": { icon: <IconSmartphone className="size-6" />, name: "App Store", line: "getAppStore" },
  "google-play": { icon: <IconPlay className="size-6" />, name: "Google Play", line: "getGooglePlay" },
} as const;

const linkClass =
  "rounded-sm text-sm text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A footer for a product whose real home is on a phone: the mark and a line
 * about the app on the left with the App Store and Google Play buttons under
 * them, the link columns on the right and a legal row. The buttons are drawn
 * in the house style, with the store's name as text and no borrowed badges,
 * and each one is a real link whose name says both the app and the store.
 * On a phone they stack at the full width and a 48px height; from lg a slot
 * shows a QR code, so a visitor at a desk can scan their way to the phone.
 * No state of its own, so it renders on the server.
 */
export function FooterAppStores({ brand, tagline, appName, stores, qr, columns, legal, legalLinks = [], linkAs: Link = "a", navLabel = "Footer", labels: custom, className, ...props }: FooterAppStoresProps) {
  const words = { ...LABELS, ...custom };
  const renderLink = (link: FooterLink, extra?: string) =>
    link.external ? (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cn(linkClass, extra)}>
        {link.label}
        <span className="sr-only"> ({words.newTab})</span>
      </a>
    ) : (
      <Link href={link.href} className={cn(linkClass, extra)}>
        {link.label}
      </Link>
    );

  return (
    <footer data-slot="footer-app-stores" className={cn("border-t border-border bg-background", className)} {...props}>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
        <div className="grid content-start gap-4">
          <div>{brand}</div>
          {tagline ? <p className="max-w-xs text-sm leading-relaxed text-pretty text-muted-foreground">{tagline}</p> : null}

          <div className="grid gap-5 pt-2 lg:grid-cols-[max-content_max-content] lg:items-start lg:gap-6">
            <ul aria-label={words.stores} className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,11rem))] lg:grid-cols-[minmax(0,11rem)]">
              {stores.map((link) => {
                const store = STORE[link.store];
                return (
                  <li key={`${link.store}-${link.href}`}>
                    <Button asChild size="lg" className="h-12 w-full justify-start gap-3 rounded-xl px-4 text-left">
                      <a href={link.href}>
                        {store.icon}
                        <span className="grid min-w-0 leading-tight">
                          <span className="truncate text-[0.6875rem] font-normal opacity-80">{words[store.line].replace("{app}", appName)}</span>
                          <span className="text-base font-medium tracking-[-0.01em]">{store.name}</span>
                        </span>
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>

            {/* The code only repeats the links for someone at a desk, so a screen reader skips it. White on purpose: a scanner needs a light margin in both themes. */}
            {qr ? (
              <figure aria-hidden="true" className="hidden gap-2 lg:grid">
                <div className="size-[6.75rem] rounded-xl border border-border bg-white p-2.5 text-black [&>*]:size-full">{qr}</div>
                <figcaption className="text-center text-xs text-muted-foreground">{words.scan}</figcaption>
              </figure>
            ) : null}
          </div>
        </div>

        <nav aria-label={navLabel} className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
          {columns.map((column) => (
            <div key={column.title} className="grid content-start gap-3">
              <h2 className="font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{column.title}</h2>
              <ul className="grid gap-2.5">
                {column.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>{legal}</div>
          {legalLinks.length ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>{renderLink(link, "text-xs")}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
