import type { ComponentProps, ReactNode } from "react";

import { BOX_STYLE, cssString, pageNumbers } from "@rhs-ui/marketing/print-letterhead/margin-boxes";
import { RunningLine } from "@rhs-ui/marketing/print-letterhead/running-line";
import { cn } from "@/lib/utils";

export interface PrintLetterheadDetails {
  /** The postal address, one line per item. */
  address?: readonly string[];
  /** The number, written the way people say it. */
  phone?: string;
  /** The address people write to. */
  email?: string;
}

export interface PrintLetterheadProps extends Omit<ComponentProps<"div">, "children"> {
  /** Your mark: a wordmark or a logo, at the left of the letterhead. Print it dark; the stylesheet turns the page to black on white. */
  brand: ReactNode;
  /** The contact details, set small at the right of the letterhead. */
  details?: PrintLetterheadDetails;
  /** The page address for the running footer, at the left of the bottom margin. Leave it out and the footer prints the address the reader is on. */
  url?: string;
  /** The word before the date in the footer. Default "Printed". */
  printedLabel?: string;
  /** The word before the page number in the footer. Default "Page". */
  pageLabel?: string;
  /** The word between the page number and the page count. Default "of". */
  pageOfLabel?: string;
  /** The locale the date is written in. Default "en-US". */
  locale?: string;
  /** The IANA time zone the date is read in. Default "UTC". */
  timeZone?: string;
  /** More CSS selectors to take off the paper, on top of the ones that always go. */
  hideSelectors?: readonly string[];
}

/**
 * What goes off the paper whatever the page: navigation, the site header and
 * footer (the ones that are not inside an article, a section or a table), dialogs
 * such as a cookie notice, a banner, and anything marked `data-print-hide`. Each
 * is its own rule, so one selector a browser does not understand cannot take the
 * others with it.
 */
const ALWAYS_HIDDEN = [
  "nav",
  '[role="navigation"]',
  '[role="banner"]',
  '[role="dialog"]',
  '[role="alertdialog"]',
  '[aria-modal="true"]',
  "[data-print-hide]",
  "body :is(header, footer):not(:is(article, main, section, aside, blockquote, figure, dialog, li, td, th) *)",
  '[data-slot="announcement-bar"]',
  '[data-slot="cookie-banner"]',
  '[data-slot="skip-link"]',
  '[data-slot="back-to-top"]',
  '[data-slot="sticky-cta-bar"]',
  '[data-slot="toaster"]',
];

/** The print stylesheet. Plain CSS, in the print medium only: on screen the page is untouched. */
function stylesheet(extra: readonly string[], url: string | undefined, pageLabel: string, pageOfLabel: string): string {
  const hidden = [...ALWAYS_HIDDEN, ...extra.map((selector) => selector.replace(/[<{}]/g, "").trim()).filter(Boolean)]
    .map((selector) => selector + ':not([data-slot^="print-letterhead"]){display:none!important}')
    .join("");
  return [
    // The running footer goes in the bottom page margin, outside the text area, so page text can never print over it. A browser that supports
    // margin boxes (Chromium does) prints them; the others ignore the rule and print no footer, which beats one over the text. The page numbers
    // (and the address, when it is passed in) are here, so they print without script; RunningLine adds the date and the address the reader is on.
    `@page{margin:20mm 18mm 26mm;@bottom-left{${url ? `content:"${cssString(url)}";` : ""}${BOX_STYLE};padding-right:6mm;overflow-wrap:anywhere}@bottom-right{content:${pageNumbers(pageLabel, pageOfLabel)};${BOX_STYLE};padding-left:6mm;white-space:nowrap}}`,
    "@media print{",
    hidden,
    // The light palette whatever the theme, so dark mode never prints white on white.
    ":root,:root.dark,.dark{color-scheme:light!important;--background:#fff!important;--foreground:#111!important;--card:#fff!important;--card-foreground:#111!important;--popover:#fff!important;--popover-foreground:#111!important;--primary:#111!important;--primary-foreground:#fff!important;--secondary:#f3f3f3!important;--secondary-foreground:#111!important;--muted:#f3f3f3!important;--muted-foreground:#444!important;--accent:#f3f3f3!important;--accent-foreground:#111!important;--border:#b5b5b5!important;--input:#b5b5b5!important}",
    "html,body{background:#fff!important;color:#111!important}",
    // No background colours and no shadows: ink and toner go on the words.
    "*,*::before,*::after{background-color:transparent!important;box-shadow:none!important;text-shadow:none!important;color:#111!important}",
    "a{text-decoration:underline!important}",
    // A printed link has no click: its address is written after it, inside the article.
    ':is(article,main) a[href^="http"]:not([data-print-no-url])::after{content:" (" attr(href) ")";font-size:.82em;font-weight:400;overflow-wrap:anywhere}',
    "h1,h2,h3,h4,h5,h6{break-after:avoid;break-inside:avoid}",
    "p,li,blockquote{orphans:3;widows:3}",
    "table{border-collapse:collapse}",
    "thead{display:table-header-group}",
    "tr,img,svg,figure,pre,blockquote{break-inside:avoid}",
    "img{max-width:100%!important}",
    "}",
  ].join("");
}

/**
 * The header and footer that appear only when a page is printed or saved as a
 * PDF. On screen it renders nothing; on paper it is a letterhead with your mark,
 * your contact details and a rule, and a running footer on every page with the
 * page address, the date it was printed and the page numbers. The footer is
 * written into the bottom page margin (margin boxes, which Chromium prints), not
 * into the page, so it sits outside the text and no list, table or paragraph can
 * run into it; a browser without margin boxes prints no footer. It also ships the
 * print stylesheet: navigation, banners, dialogs and anything marked
 * `data-print-hide` are taken off the page, background colours and shadows go, the
 * light palette is used whatever the theme, link addresses are written after the
 * link text inside the article, and headings and table rows keep clear of page
 * breaks. Everything is plain CSS, in the print medium only, with no preview mode
 * to learn; the one line of script writes the date at the moment the browser starts
 * to print, because a page cannot know that earlier. For legal pages, docs,
 * recipes, receipts and any page people actually print.
 */
export function PrintLetterhead({
  brand,
  details,
  url,
  printedLabel = "Printed",
  pageLabel = "Page",
  pageOfLabel = "of",
  locale = "en-US",
  timeZone = "UTC",
  hideSelectors = [],
  className,
  ...props
}: PrintLetterheadProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stylesheet(hideSelectors, url, pageLabel, pageOfLabel) }} />
      <div data-slot="print-letterhead" className={cn("hidden break-inside-avoid print:mb-8 print:block", className)} {...props}>
        <div className="flex items-start justify-between gap-10 border-b-[1.5pt] border-foreground pb-4">
          <div className="min-w-0 shrink-0">{brand}</div>
          {details ? (
            <address className="text-right text-[9pt] leading-[1.5] not-italic opacity-75">
              {details.address?.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              {details.phone ? <span className="block tabular-nums">{details.phone}</span> : null}
              {details.email ? <span className="block">{details.email}</span> : null}
            </address>
          ) : null}
        </div>
      </div>
      <RunningLine url={url} printedLabel={printedLabel} pageLabel={pageLabel} pageOfLabel={pageOfLabel} locale={locale} timeZone={timeZone} />
    </>
  );
}
