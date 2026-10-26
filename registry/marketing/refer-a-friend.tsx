"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconCheck, IconCopy, IconMail, IconShare } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ReferralOffer {
  /** What your customer's friend gets, as real text: "€20". */
  give: string;
  /** What your customer gets when the friend pays: "€20". */
  get: string;
}

export interface ReferralStats {
  /** How many friends were sent the link. */
  invited: number;
  /** How many of them signed up. */
  joined: number;
  /** The credit earned so far, formatted for your currency: "€100". */
  credit: string;
}

export interface ReferralTerms {
  /** The full terms. */
  href: string;
  /** When credit arrives, in plain words: "Credit arrives 14 days after your friend's first payment." */
  creditTiming: string;
}

export interface ReferralStep {
  /** What happens: "Share your link". */
  title: string;
  /** One line that makes it concrete. */
  description?: string;
}

export interface ReferralMessage {
  /** The subject of the email, and the title of the share sheet. */
  subject: string;
  /** What goes with the link, in your customer's voice. */
  text: string;
}

/** How the link was shared, passed to onShare. */
export type ReferralChannel = "copy" | "email" | "native";

export interface ReferAFriendLabels {
  /** The heading when you do not pass a title. {give} and {get} stand for the offer. */
  title: string;
  /** The first step when you do not pass steps. {give} and {get} stand for the offer, here and in the next five. */
  step1Title: string;
  /** What the first step says under its title. */
  step1Text: string;
  /** The second step: what the friend gets. */
  step2Title: string;
  /** What the second step says under its title. */
  step2Text: string;
  /** The third step: what the customer gets. */
  step3Title: string;
  /** What the third step says under its title. */
  step3Text: string;
  /** The label of the link field. */
  linkLabel: string;
  /** The copy button. */
  copy: string;
  /** The copy button for a moment after copying. */
  copied: string;
  /** Said to a screen reader after copying. */
  copiedAnnouncement: string;
  /** Said when the browser refuses to copy. */
  copyFailed: string;
  /** The email button. */
  email: string;
  /** The button that opens the device's share sheet. It only shows where the browser has one. */
  share: string;
  /** The small line above the three numbers. */
  tallies: string;
  /** The label of the number of friends invited. */
  invited: string;
  /** The label of the number of friends who joined. */
  joined: string;
  /** The label of the credit earned. */
  credit: string;
  /** The text of the link to the full terms. */
  terms: string;
  /** The subject of the email when you do not pass a message. {give} stands for the offer. */
  shareSubject: string;
  /** The text with the link when you do not pass a message. {give} stands for the offer. */
  shareText: string;
}

const LABELS: ReferAFriendLabels = {
  title: "Give {give}, get {get}",
  step1Title: "Share your link",
  step1Text: "Send it by email or message, or copy it.",
  step2Title: "They get {give}",
  step2Text: "Your friend signs up through your link and gets {give} off their first purchase.",
  step3Title: "You get {get}",
  step3Text: "When their first payment clears, {get} is added to your credit.",
  linkLabel: "Your personal link",
  copy: "Copy link",
  copied: "Copied",
  copiedAnnouncement: "Link copied to the clipboard.",
  copyFailed: "Could not copy. Select the link and copy it by hand.",
  email: "Email a friend",
  share: "Share",
  tallies: "Your referrals so far",
  invited: "Invited",
  joined: "Joined",
  credit: "Credit earned",
  terms: "Read the full terms",
  shareSubject: "{give} off your first purchase",
  shareText: "I use this and think you will like it. Sign up with my link and you get {give} off your first purchase.",
};

export interface ReferAFriendProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** What both sides get. It fills the heading and the steps. */
  offer: ReferralOffer;
  /** This customer's personal link. It is shown in a field they can copy. */
  link: string;
  /** Their numbers so far. */
  stats: ReferralStats;
  /** The terms link and the line on when credit arrives. Both are required: a referral offer is only as trusted as its small print. */
  terms: ReferralTerms;
  /** Called when the link is shared, with how. Use it to count shares or open your own sheet. */
  onShare?: (channel: ReferralChannel) => void;
  /** The heading. "Give {give}, get {get}" from the offer when left out. */
  title?: string;
  /** One or two sentences on the offer, under the heading. */
  description?: string;
  /** The steps of how it works, usually three. Written from the offer when left out. */
  steps?: readonly ReferralStep[];
  /** The email and the share sheet. Written from the offer when left out. */
  message?: ReferralMessage;
  /** The language the numbers are written in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ReferAFriendLabels>;
}

const text = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => values[key] ?? marker);

/**
 * The pieces a link wraps between: each runs up to and including its slash, dot, question mark, ampersand, equals
 * sign or hash ("https://", "halcyon.", "example/", "r/", "maria-k4x9"). A piece is never split, so the last of
 * them, the personal one, stays whole; only a piece wider than the field breaks inside. No look-behind, so it
 * parses in every browser.
 */
const linkPieces = (link: string): string[] => link.match(/[^/.?&=#]+[/.?&=#]*|[/.?&=#]+/g) ?? [link];

/**
 * A referral section for signed-in customers: the offer in plain words, how it
 * works in three steps, the customer's own link in a field they can copy, the
 * ways to share it, and a live count of how many friends were invited, how many
 * joined and how much credit that earned. The link wraps instead of being cut
 * off, because the personal part at its end is the one thing the customer came
 * to see. The copy button confirms in words,
 * the device's share sheet is offered only where the browser has one, and the
 * terms link and a line on when credit arrives are required, because the small
 * print is what makes people believe the headline. Numbers are in tabular
 * figures with labels, never a bare figure.
 */
export function ReferAFriend({ offer, link, stats, terms, onShare, title, description, steps, message, locale = "en-US", headingLevel = 2, labels: custom, className, ...props }: ReferAFriendProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [copy, setCopy] = useState<"idle" | "copied" | "error">("idle");
  // The share sheet is known only in the browser, so the button appears after mount and the markup always matches.
  const [canShare, setCanShare] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const values = { give: offer.give, get: offer.get };
  const heading = title ?? text(labels.title, values);
  const how: readonly ReferralStep[] = steps ?? [
    { title: text(labels.step1Title, values), description: text(labels.step1Text, values) },
    { title: text(labels.step2Title, values), description: text(labels.step2Text, values) },
    { title: text(labels.step3Title, values), description: text(labels.step3Text, values) },
  ];
  const share: ReferralMessage = message ?? { subject: text(labels.shareSubject, values), text: text(labels.shareText, values) };
  const mailto = `mailto:?subject=${encodeURIComponent(share.subject)}&body=${encodeURIComponent(`${share.text}\n\n${link}`)}`;
  const number = new Intl.NumberFormat(locale);

  async function copyLink() {
    onShare?.("copy");
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(link);
      setCopy("copied");
    } catch {
      setCopy("error");
    }
    timer.current = setTimeout(() => setCopy("idle"), 2200);
  }

  async function shareNatively() {
    onShare?.("native");
    try {
      await navigator.share({ title: share.subject, text: share.text, url: link });
    } catch {
      // The reader closed the sheet: nothing to report.
    }
  }

  const tallies = [
    { label: labels.invited, value: number.format(stats.invited) },
    { label: labels.joined, value: number.format(stats.joined) },
    { label: labels.credit, value: stats.credit },
  ];

  return (
    <section data-slot="refer-a-friend" aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card break-words", className)} {...props}>
      <div className="grid gap-x-12 gap-y-9 p-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] @3xl:p-10">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @3xl:text-4xl">
            {heading}
          </Heading>
          {description ? <p className="mt-4 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          <ol role="list" className="mt-8">
            {how.map((step, index) => {
              const last = index === how.length - 1;
              return (
                <li key={`${index}-${step.title}`} className="flex gap-4">
                  <div aria-hidden="true" className="flex flex-col items-center">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-medium tabular-nums">{index + 1}</span>
                    {last ? null : <span className="my-1.5 w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("min-w-0 pt-0.5", !last && "pb-6")}>
                    <p className="text-sm leading-snug font-medium">{step.title}</p>
                    {step.description ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{step.description}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="min-w-0 self-start rounded-xl border border-border bg-muted/40 p-5 @sm:p-6">
          <p id={`${id}-link`} className="text-sm font-medium">
            {labels.linkLabel}
          </p>
          {/* One joined field when there is room; on a narrow panel the link gets the whole width and the button sits under it. Either way the link wraps, between its pieces, so its personal end is never cut or split. */}
          <div className="mt-3 flex flex-col gap-2 @sm:flex-row @sm:items-center @sm:gap-1.5 @sm:rounded-lg @sm:border @sm:border-input @sm:bg-background @sm:p-1 @sm:pl-3 @sm:shadow-xs @sm:transition-[border-color,box-shadow] @sm:duration-150 @sm:has-[[data-slot=refer-a-friend-link]:focus-visible]:border-ring @sm:has-[[data-slot=refer-a-friend-link]:focus-visible]:ring-[3px] @sm:has-[[data-slot=refer-a-friend-link]:focus-visible]:ring-ring/40 motion-reduce:transition-none">
            <div className="min-w-0 rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 has-[[data-slot=refer-a-friend-link]:focus-visible]:border-ring has-[[data-slot=refer-a-friend-link]:focus-visible]:ring-[3px] has-[[data-slot=refer-a-friend-link]:focus-visible]:ring-ring/40 motion-reduce:transition-none @sm:flex-1 @sm:rounded-none @sm:border-0 @sm:bg-transparent @sm:shadow-none @sm:has-[[data-slot=refer-a-friend-link]:focus-visible]:ring-0">
              {/* A read-only text field that wraps, which an input cannot do: assistive technology reads it as a read-only text box with the whole link as its value. Focus, or a click, selects the whole link, so Ctrl C or a long press copies it. */}
              <div
                data-slot="refer-a-friend-link"
                role="textbox"
                aria-readonly="true"
                aria-multiline="true"
                aria-labelledby={`${id}-link`}
                tabIndex={0}
                onFocus={(event) => window.getSelection()?.selectAllChildren(event.currentTarget)}
                className="px-3 py-2 text-sm leading-5 outline-none select-all selection:bg-primary selection:text-primary-foreground @sm:px-0 @sm:py-1.5"
              >
                {linkPieces(link).map((piece, index) => (
                  <span key={`${index}-${piece}`} className="inline-block max-w-full [overflow-wrap:anywhere]">
                    {piece}
                  </span>
                ))}
              </div>
            </div>
            <Button type="button" size="sm" onClick={copyLink} className="w-full shrink-0 @sm:w-auto">
              {copy === "copied" ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
              {copy === "copied" ? labels.copied : labels.copy}
            </Button>
          </div>
          {copy === "error" ? <p className="mt-2 text-xs text-destructive">{labels.copyFailed}</p> : null}
          {/* Success and failure are both said to a screen reader: a Copy that does nothing and says nothing is the worst answer. */}
          <p role="status" className="sr-only">
            {copy === "copied" ? labels.copiedAnnouncement : copy === "error" ? labels.copyFailed : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={mailto} onClick={() => onShare?.("email")}>
                <IconMail aria-hidden="true" />
                {labels.email}
              </a>
            </Button>
            {canShare ? (
              <Button type="button" variant="outline" size="sm" onClick={shareNatively}>
                <IconShare aria-hidden="true" />
                {labels.share}
              </Button>
            ) : null}
          </div>

          <div role="group" aria-labelledby={`${id}-tallies`} className="mt-6 border-t border-border pt-5">
            <p id={`${id}-tallies`} className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {labels.tallies}
            </p>
            {/* Three columns when there is room, three rows when there is not, so a long figure never wraps. */}
            <dl className="mt-3 grid divide-y divide-border rounded-lg border border-border bg-background @md:grid-cols-3 @md:divide-x @md:divide-y-0">
              {tallies.map((tally) => (
                <div key={tally.label} className="flex min-w-0 items-baseline justify-between gap-3 px-4 py-3 @md:flex-col-reverse @md:items-stretch @md:justify-start @md:gap-0 @md:px-3 @md:py-3.5 @md:text-center">
                  <dt className="text-xs leading-tight text-muted-foreground @md:mt-1">{tally.label}</dt>
                  <dd className="text-xl leading-none font-medium tracking-[-0.04em] tabular-nums @md:text-2xl">{tally.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <p className="border-t border-border pt-6 text-xs leading-relaxed text-pretty text-muted-foreground @3xl:col-span-2">
          {terms.creditTiming}{" "}
          <a
            href={terms.href}
            className="rounded-sm whitespace-nowrap text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            {labels.terms}
          </a>
        </p>
      </div>
    </section>
  );
}
