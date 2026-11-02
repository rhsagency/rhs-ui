"use client";

import { useId, useState, useSyncExternalStore, type ComponentProps } from "react";

import { dateIn, fill, type DateInput } from "@rhs-ui/application/certificate-card/format";
import { CopyField } from "@rhs-ui/application/copy-field";
import { IconAward, IconClock, IconDownload, IconExternal } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. `{recipient}`, `{title}` and `{date}` are filled in. */
export interface CertificateCardLabels {
  /** The small line at the top, and the start of the heading for screen readers. Default "Certificate of completion". */
  eyebrow?: string;
  /** The line above the recipient. Default "This certifies that". */
  certifies?: string;
  /** The line between the recipient and the title. Default "has successfully completed". */
  completed?: string;
  /** The label of the issuer. Default "Issued by". */
  issuedBy?: string;
  /** The label of the issue date. Default "Issued". */
  issued?: string;
  /** The label of the end date, while the certificate is valid. Once it has lapsed the badge says when and the list leaves the date out. Default "Expires". */
  expires?: string;
  /** The badge of a lapsed certificate. Default "Expired on {date}". */
  expiredOn?: string;
  /** The badge of a lapsed certificate that has no end date to state. Default "Expired". */
  expired?: string;
  /** The label of the credential ID. Default "Credential ID". */
  credentialId?: string;
  /** The name of the copy button. Default "Copy credential ID". */
  copyId?: string;
  /** The download button. Default "Download". */
  download?: string;
  /** The name of the download button, so a list of them is not a list of "Download". Default "Download certificate, {title}". */
  downloadFor?: string;
  /** The verify link. Default "Verify credential". */
  verify?: string;
  /** Said to screen readers after the verify link. Default "(opens in a new tab)". */
  newTab?: string;
  /** Printed under a certificate in place of the buttons. Default "Verify this certificate at {url}". */
  verifyPrint?: string;
}

export interface CertificateCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** Who earned it: "Priya Ramanathan". Set large. */
  recipient: string;
  /** What it is for: "Advanced Accessibility Engineering". Set large, and it is the heading of the card. */
  title: string;
  /** Who issued it: "Northwind Academy". */
  issuer?: string;
  /** When it was issued. A day such as "2026-01-12" never shifts with the time zone. */
  issuedAt?: DateInput;
  /** The credential's ID, as the issuer prints it. It is set in mono and can be copied. */
  credentialId?: string;
  /** When it stops being valid. A date in the past makes the certificate read as expired: the frame goes quiet and a badge says "Expired on …". */
  expiresAt?: DateInput;
  /** Where anyone can check it. Opens in a new tab, and says so. */
  verifyHref?: string;
  /** The download button was pressed. May return a promise: the button shows a spinner and keeps its width until it settles. Leave it out and there is no download button. */
  onDownload?: () => void | Promise<void>;
  /**
   * Whether the certificate has lapsed. Leave it out to work it out from `expiresAt` and the browser's clock, read once
   * the page is live (until then it reads as valid, so the server and the browser agree); pass it when you know.
   */
  expired?: boolean;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: CertificateCardLabels;
}

const DEFAULT_LABELS = {
  eyebrow: "Certificate of completion",
  certifies: "This certifies that",
  completed: "has successfully completed",
  issuedBy: "Issued by",
  issued: "Issued",
  expires: "Expires",
  expiredOn: "Expired on {date}",
  expired: "Expired",
  credentialId: "Credential ID",
  copyId: "Copy credential ID",
  download: "Download",
  downloadFor: "Download certificate, {title}",
  verify: "Verify credential",
  newTab: "(opens in a new tab)",
  verifyPrint: "Verify this certificate at {url}",
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const subscribeNever = (): (() => void) => () => undefined;

/** Whether a date has passed, by the instant it names: a day on the calendar ends when its own day does. */
function passed(input: DateInput, now: number): boolean {
  const at = new Date(DAY.test(String(input)) ? `${input}T23:59:59Z` : input).getTime();
  return !Number.isNaN(at) && at < now;
}

/**
 * A certificate of completion as a card: the recipient and the title set large
 * inside a double frame, as on a certificate, in black and white alone, so the
 * card holds on paper. The details are a labelled list, the credential ID is a
 * mono value you can copy, and there is a download button and a link that
 * verifies it. The link opens in a new tab and says so. An expired certificate
 * states "Expired on 3 Mar 2026" and mutes its frame and its seal. The card is
 * an article whose heading is the title; when printed the buttons give way to
 * the address that verifies it.
 */
export function CertificateCard({
  recipient,
  title,
  issuer,
  issuedAt,
  credentialId,
  expiresAt,
  verifyHref,
  onDownload,
  expired: stated,
  headingLevel = 3,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: CertificateCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [busy, setBusy] = useState(false);
  const day = { day: "numeric", month: "short", year: "numeric" } as const;
  const issuedText = issuedAt === undefined ? null : dateIn(issuedAt, locale, timeZone, day);
  const expiresText = expiresAt === undefined ? null : dateIn(expiresAt, locale, timeZone, day);
  // Whether it has lapsed by the reader's clock is known only in the browser, so the server reads it as valid and nothing mismatches.
  const lapsed = useSyncExternalStore(subscribeNever, () => expiresAt !== undefined && passed(expiresAt, Date.now()), () => false);
  const expired = stated ?? lapsed;

  async function download() {
    if (busy || !onDownload) return;
    setBusy(true);
    try {
      await onDownload();
    } finally {
      setBusy(false);
    }
  }

  const rows = [
    issuer ? { term: text.issuedBy, value: issuer } : null,
    issuedText ? { term: text.issued, value: issuedText } : null,
    // Once it has lapsed the badge says when, so the list does not say it again in another tense.
    expiresText && !expired ? { term: text.expires, value: expiresText } : null,
  ].filter((row): row is { term: string; value: string } => row !== null);

  return (
    <article
      data-slot="certificate-card"
      data-expired={expired ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "@container w-full rounded-2xl border border-border bg-card p-2 text-card-foreground shadow-xs print:break-inside-avoid print:border-black print:bg-white print:text-black print:shadow-none",
        // A page that is dark stays dark while it prints: on paper every colour of the card is black or white, whatever the theme, so the muted words, the dashed frame and the credential box keep their ink.
        "print:[--background:#fff] print:[--border:#000] print:[--card:#fff] print:[--foreground:#000] print:[--muted-foreground:#000] print:[--muted:#fff]",
        className,
      )}
      {...props}
    >
      <div className={cn("flex flex-col items-center rounded-xl border px-4 py-9 text-center @sm:px-8", expired ? "border-dashed border-border" : "border-foreground/25 print:border-black")}>
        <span aria-hidden="true" className={cn("grid size-14 place-items-center rounded-full border", expired ? "border-dashed border-border" : "border-foreground/25 print:border-black")}>
          <span className={cn("grid size-11 place-items-center rounded-full border-2", expired ? "border-dashed border-muted-foreground/50 text-muted-foreground" : "border-foreground text-foreground print:border-black print:text-black")}>
            <IconAward className="size-5" />
          </span>
        </span>

        <p aria-hidden="true" className="mt-5 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase print:text-black">
          {text.eyebrow}
        </p>
        <p className="mt-7 text-sm text-muted-foreground print:text-black">{text.certifies}</p>
        <p className={cn("mt-1.5 max-w-full text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance [overflow-wrap:anywhere]", expired && "text-muted-foreground print:text-black")}>{recipient}</p>
        <p className="mt-4 text-sm text-muted-foreground print:text-black">{text.completed}</p>
        <Heading id={titleId} className={cn("mt-1.5 max-w-prose text-xl leading-snug font-semibold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]", expired && "text-muted-foreground print:text-black")}>
          <span className="sr-only">{text.eyebrow}: </span>
          {title}
        </Heading>

        {expired ? (
          <Badge variant="outline" className="mt-5 gap-1.5 border-dashed pr-2.5 print:border-black print:text-black">
            <IconClock />
            {expiresText ? fill(text.expiredOn, { date: expiresText }) : text.expired}
          </Badge>
        ) : null}

        {rows.length ? (
          <dl className="mt-8 w-full max-w-sm divide-y divide-border border-y border-border text-left text-sm print:divide-black print:border-black">
            {rows.map((row) => (
              <div key={row.term} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 whitespace-nowrap text-muted-foreground print:text-black">{row.term}</dt>
                <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere] tabular-nums">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {credentialId ? (
          <div className={cn("w-full max-w-sm text-left", rows.length ? "mt-4" : "mt-8")}>
            <p className="mb-1.5 text-xs text-muted-foreground print:text-black">
              {text.credentialId}
            </p>
            <CopyField value={credentialId} label={text.copyId} className="[&_code]:text-[0.8125rem] @max-[20rem]:[&>div]:flex-col @max-[20rem]:[&>div]:items-stretch @max-[20rem]:[&>div]:pl-2 @max-[20rem]:[&_button]:justify-center print:[&_button]:hidden" />
          </div>
        ) : null}

        {onDownload || verifyHref ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 print:hidden">
            {onDownload ? (
              <Button type="button" size="default" loading={busy} aria-label={fill(text.downloadFor, { title, recipient })} onClick={() => void download()} className="min-w-32">
                {busy ? null : <IconDownload />}
                {text.download}
              </Button>
            ) : null}
            {verifyHref ? (
              <Button asChild variant="outline">
                <a href={verifyHref} target="_blank" rel="noopener noreferrer">
                  {text.verify}
                  <IconExternal />
                  <span className="sr-only">{text.newTab}</span>
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}

        {verifyHref ? <p className="mt-6 hidden text-xs [overflow-wrap:anywhere] print:block">{fill(text.verifyPrint, { url: verifyHref })}</p> : null}
      </div>
    </article>
  );
}
