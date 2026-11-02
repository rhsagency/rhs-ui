"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCalendar, IconCheck, IconFileSignature, IconFileText } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { Separator } from "@rhs-ui/primitives/separator";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** One thing that is different, said plainly. */
export interface TermsChange {
  /** What changed, in one sentence a person can read in a breath: "Deleted projects are kept for 30 days before they are removed for good." */
  text: string;
  /** Where the full wording is. The sentence is then followed by a link. */
  href?: string;
  /** The link's words: "Section 6.2". Default "Read more". */
  linkLabel?: string;
}

/** A full document the changes come from. */
export interface TermsDocument {
  /** What it is called: "Terms of service". */
  label: string;
  /** Where it is. It opens in a new tab, so the gate stays where it is. */
  href: string;
}

/** The words the card uses, for translation. `{date}`, `{version}` and `{product}` are filled in. */
export interface TermsUpdateGateLabels {
  /** The heading. Default "We have updated our terms". */
  heading?: string;
  /** The line under it. Default "Here is what is different, in plain words. Read it, then make your choice.". */
  description?: string;
  /** The date chip. Default "Effective {date}". */
  effective?: string;
  /** The heading of the list of changes. Default "What changed". */
  whatChanged?: string;
  /** The words above the document links. Default "Read the full text". */
  documents?: string;
  /** The link after a change that has an `href` and no `linkLabel`. Default "Read more". */
  readMore?: string;
  /** Read out after each document link. Default "opens in a new tab". */
  newTab?: string;
  /** The label above the excerpt when `excerptTitle` is not given. Default "An excerpt of the new terms". */
  excerpt?: string;
  /** The checkbox's label. Default "I have read and accept the new terms". */
  consent?: string;
  /** The line under the buttons while the box is empty. Default "Tick the box above to continue.". */
  needTick?: string;
  /** The button that refuses. Default "Decline". */
  decline?: string;
  /** The refuse button once it worked. Default "Declined". */
  declined?: string;
  /** The button that agrees. Default "Continue". */
  continue?: string;
  /** The agree button while it saves. Default "Saving". */
  saving?: string;
  /** The agree button once it worked. Default "Accepted". */
  accepted?: string;
  /** The title of the note about declining. Default "If you decline". */
  declineTitle?: string;
  /** The note about declining. Default "You will be signed out. Nothing is deleted, and you can accept later.". */
  declineNote?: string;
  /** The heading once the terms are accepted. Default "Thank you, you are all set". */
  doneHeading?: string;
  /** The line under it. Default "Your choice is saved. Taking you on.". */
  doneLine?: string;
  /** Above the buttons when `onAccept` or `onDecline` threw. Default "We could not save your choice. Nothing has changed. Try again.". */
  failed?: string;
  /** Said when Continue is pressed with the box empty. Default "Tick the box to accept the new terms, then continue.". */
  needTickSaid?: string;
  /** Said once the terms are accepted. Default "Terms accepted. Taking you on.". */
  acceptedSaid?: string;
  /** Said once they are declined. Default "You declined the new terms.". */
  declinedSaid?: string;
}

export interface TermsUpdateGateProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** When the new terms apply: a Date, an ISO string or a timestamp. A date-only string such as "2026-12-01" is a calendar day, so it is written as that day in any `timeZone`; a full timestamp is written in the zone you give. */
  effectiveDate: Date | string | number;
  /** What changed, three to five plain sentences. This is the part people read, so keep it short and say what it means for them. */
  changes: readonly TermsChange[];
  /** The full documents, as links that open in a new tab. */
  documents: readonly TermsDocument[];
  /** Which version this is, as a chip: "Terms v4.2". */
  versionLabel?: string;
  /** An excerpt of the new wording, such as the one section that matters most, in a box that scrolls. Leave it out for no box. */
  excerpt?: ReactNode;
  /** What the excerpt is: "Terms of service, section 6: Your content". Default is the label `excerpt`. */
  excerptTitle?: string;
  /**
   * Record the consent. It runs when Continue is pressed with the box ticked. Return a promise and the card waits, with the button busy;
   * a rejection shows a message and nothing is lost. Keep the version and the time on your server.
   */
  onAccept: () => void | Promise<void>;
  /** Refuse. A button of the same size as Continue, never a hidden link. This is usually where you sign the person out. */
  onDecline: () => void | Promise<void>;
  /** Called a moment after the acceptance was shown and announced, so a screen reader has said it before the page changes. Navigate here, not in `onAccept`. */
  onAccepted?: () => void;
  /** How long, in ms, that moment is. Default 1200. */
  acceptedDelay?: number;
  /** Start on the accepted state: for a preview. */
  defaultDone?: boolean;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Under the card's buttons: a link to help, to contact. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: TermsUpdateGateLabels;
}

const DEFAULT_LABELS = {
  heading: "We have updated our terms",
  description: "Here is what is different, in plain words. Read it, then make your choice.",
  effective: "Effective {date}",
  whatChanged: "What changed",
  documents: "Read the full text",
  readMore: "Read more",
  newTab: "opens in a new tab",
  excerpt: "An excerpt of the new terms",
  consent: "I have read and accept the new terms",
  needTick: "Tick the box above to continue.",
  decline: "Decline",
  declined: "Declined",
  continue: "Continue",
  saving: "Saving",
  accepted: "Accepted",
  declineTitle: "If you decline",
  declineNote: "You will be signed out. Nothing is deleted, and you can accept later.",
  doneHeading: "Thank you, you are all set",
  doneLine: "Your choice is saved. Taking you on.",
  failed: "We could not save your choice. Nothing has changed. Try again.",
  needTickSaid: "Tick the box to accept the new terms, then continue.",
  acceptedSaid: "Terms accepted. Taking you on.",
  declinedSaid: "You declined the new terms.",
} satisfies Required<TermsUpdateGateLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The box the excerpt scrolls in. The scrollbar is always drawn, with a thumb strong enough to see (3:1), so a first-time reader and a touch screen
 * can tell it scrolls. The keyboard ring is on the box and not on the viewport inside it: the ScrollArea clips its own children, so the viewport's
 * own ring never shows, and a tab stop with no ring is invisible. The empty horizontal track is let through, since it would otherwise take a swipe
 * that starts on the bottom edge of the box without scrolling anything.
 */
const EXCERPT_BOX = cn(
  "h-40 rounded-lg border border-border bg-muted/30",
  "has-[:focus-visible]:border-ring has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40",
  "[&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/70",
  "[&_[data-slot=scroll-area-scrollbar][data-orientation=horizontal]]:pointer-events-none",
);

/** A date-only string such as "2026-12-01": a calendar day, which belongs to no time zone. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The date in the locale and zone. A calendar day is written as the day it says: `new Date("2026-12-01")` is midnight UTC, which in a zone west of
 * UTC is still the day before, so a date-only string is written in UTC whatever zone is asked for. An unknown locale or zone falls back to US
 * English and UTC instead of taking the page down.
 */
function writtenDate(input: Date | string | number, locale: string, timeZone: string): string {
  const at = new Date(input);
  if (Number.isNaN(at.getTime())) return "";
  const zone = typeof input === "string" && CALENDAR_DAY.test(input) ? "UTC" : timeZone;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: zone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(at);
  }
}

/**
 * The moment a company's legal text changes, made something a person can pass
 * in ten seconds without being tricked. It says what changed in three to five
 * plain sentences, each able to link to the exact section, names the version
 * and the day it applies, offers the full documents (in new tabs, so the gate
 * stays put) and, if you give one, an excerpt in a box that scrolls. Then comes
 * one box, unticked, "I have read and accept the new terms". Continue stays
 * reachable while the box is empty, but pressing it only moves the focus to the
 * box, and a line under the buttons says why in words, so a grey button is
 * never the whole explanation. Decline is a button of the same size, not a
 * link, with a note beside it saying what it does. A saved choice is shown and
 * announced politely, with the focus moved to it so it does not fall to the
 * page, and `onAccepted` follows a moment later, so nobody hears nothing before
 * the page changes. A failure keeps the box ticked and says so. The excerpt box
 * always draws its scrollbar and shows a ring while the keyboard is in it.
 */
export function TermsUpdateGate({
  effectiveDate,
  changes,
  documents,
  versionLabel,
  excerpt,
  excerptTitle,
  onAccept,
  onDecline,
  onAccepted,
  acceptedDelay = 1200,
  defaultDone = false,
  locale = "en-US",
  timeZone = "UTC",
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: TermsUpdateGateProps) {
  const text: Required<TermsUpdateGateLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  // One level under the title, so the outline never skips a step whichever element the title is.
  const Sub = Title === "h1" ? "h2" : Title === "h2" ? "h3" : "h4";
  const box = useRef<HTMLButtonElement>(null);
  const done = useRef<HTMLDivElement>(null);
  const arrived = useRef(false);
  const working = useRef(false);
  const [checked, setChecked] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [outcome, setOutcome] = useState<"accepted" | "declined" | null>(defaultDone ? "accepted" : null);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  // The hand-over to the page is a timer; it must not outlive the card.
  const handOver = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(handOver.current), []);

  // Continue is replaced by the thank-you, which would drop the focus on the page: it goes to the thank-you instead, but only when the person got there, never on the first paint of a preview.
  useEffect(() => {
    if (outcome !== "accepted" || !arrived.current) return;
    arrived.current = false;
    done.current?.focus();
  }, [outcome]);

  const date = writtenDate(effectiveDate, locale, timeZone);
  const locked = busy !== null || outcome !== null;

  async function accept() {
    if (working.current || outcome) return;
    if (!checked) {
      // Not a dead button: it takes the person to the thing that is missing.
      setNudged(true);
      say(text.needTickSaid);
      box.current?.focus();
      return;
    }
    working.current = true;
    setBusy("accept");
    setProblem("");
    try {
      await onAccept();
      arrived.current = true;
      setOutcome("accepted");
      say(text.acceptedSaid);
      if (onAccepted) handOver.current = window.setTimeout(onAccepted, acceptedDelay);
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  async function decline() {
    if (working.current || outcome) return;
    working.current = true;
    setBusy("decline");
    setProblem("");
    try {
      await onDecline();
      setOutcome("declined");
      say(text.declinedSaid);
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  const needsTick = !checked && !locked;
  const settled = "aria-busy:cursor-progress aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:bg-primary aria-disabled:active:translate-y-0";

  return (
    <div data-slot="terms-update-gate" data-outcome={outcome ?? undefined} className={cn("@container mx-auto grid w-full max-w-lg gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)} {...props}>
      <div className="grid gap-4">
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-5">
          <IconFileSignature />
        </span>
        <div className="grid gap-1.5">
          <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{text.heading}</Title>
          {/* Once the choice is made there is nothing left to read and decide, so the invitation goes. */}
          {outcome === "accepted" ? null : <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{text.description}</p>}
        </div>
        {versionLabel || date ? (
          <p className="flex flex-wrap items-center gap-2">
            {versionLabel ? (
              <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-[0.8125rem] text-foreground [&>svg]:size-3.5">
                <IconFileText />
                {versionLabel}
              </Badge>
            ) : null}
            {date ? (
              <Badge variant="muted" className="h-6 gap-1.5 px-2.5 text-[0.8125rem] tabular-nums [&>svg]:size-3.5">
                <IconCalendar />
                {fill(text.effective, { date })}
              </Badge>
            ) : null}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3">
        <Sub id={`${id}-changes`} className="text-sm leading-snug font-medium">
          {text.whatChanged}
        </Sub>
        <ul aria-labelledby={`${id}-changes`} className="grid gap-3.5">
          {changes.map((change) => (
            <li key={change.text} className="flex items-start gap-3 text-[0.9375rem] leading-snug">
              <span aria-hidden="true" className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-foreground" />
              <span className="min-w-0">
                {change.text}
                {change.href ? (
                  <>
                    {" "}
                    <a
                      href={change.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 rounded-sm font-medium whitespace-nowrap text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      {change.linkLabel ?? text.readMore}
                      <IconArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                      <span className="sr-only">{`, ${text.newTab}`}</span>
                    </a>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {documents.length > 0 ? (
        <div className="grid gap-2.5">
          <p className="text-xs text-muted-foreground">{text.documents}</p>
          <ul className="flex flex-wrap gap-2">
            {documents.map((document) => (
              <li key={`${document.label}-${document.href}`}>
                <a
                  href={document.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-[0.8125rem] font-medium transition-colors duration-150 outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {document.label}
                  <IconArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
                  <span className="sr-only">{`, ${text.newTab}`}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {excerpt ? (
        <div className="grid gap-2">
          <p id={`${id}-excerpt`} className="text-xs text-muted-foreground">
            {excerptTitle ?? text.excerpt}
          </p>
          <ScrollArea type="always" role="region" aria-labelledby={`${id}-excerpt`} className={EXCERPT_BOX}>
            <div className="grid gap-3 px-4 py-3.5 text-[0.8125rem] leading-relaxed text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">{excerpt}</div>
          </ScrollArea>
        </div>
      ) : null}

      <Separator />

      {outcome === "accepted" ? (
        <div ref={done} tabIndex={-1} className="grid gap-1.5 rounded-lg border border-border bg-muted/40 p-4 outline-none">
          <p className="flex items-center gap-2.5 text-sm leading-snug font-medium">
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <IconCheck className="size-3.5" />
            </span>
            {text.doneHeading}
          </p>
          <p className="pl-[2.125rem] text-[0.8125rem] leading-relaxed text-muted-foreground">{text.doneLine}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className={cn("relative flex items-start gap-3 rounded-lg border bg-background p-4 transition-colors duration-150 motion-reduce:transition-none", locked ? "border-border" : "hover:bg-muted/40", nudged && !checked ? "border-destructive/60" : "border-border")}>
            <Checkbox
              ref={box}
              id={`${id}-consent`}
              checked={checked}
              disabled={locked}
              aria-invalid={nudged && !checked ? true : undefined}
              aria-describedby={needsTick ? `${id}-hint` : undefined}
              onCheckedChange={(value) => {
                setChecked(value === true);
                if (value === true) setNudged(false);
              }}
              className="mt-px"
            />
            {/* The label stretches over the whole row, so a tap anywhere on it ticks the box; the box alone shows the focus. */}
            <Label htmlFor={`${id}-consent`} className="text-sm leading-snug font-medium after:absolute after:inset-0">
              {text.consent}
            </Label>
          </div>

          <div role="alert" className="empty:hidden">
            {problem ? (
              <Alert tone="destructive" role="none" className={DANGER_TEXT}>
                <IconAlertCircle />
                <AlertTitle>{problem}</AlertTitle>
              </Alert>
            ) : null}
          </div>

          {/* Two filled buttons of one size: refusing is as visible and as easy as agreeing, and it comes first in the tab order. */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              aria-busy={busy === "decline" || undefined}
              aria-disabled={(locked && busy !== "decline" && outcome !== "declined") || undefined}
              onClick={() => void decline()}
              className="aria-busy:cursor-progress aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:bg-secondary"
            >
              {busy === "decline" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : outcome === "declined" ? <IconCheck /> : null}
              {outcome === "declined" ? text.declined : text.decline}
            </Button>
            <Button
              type="button"
              size="lg"
              aria-busy={busy === "accept" || undefined}
              aria-disabled={needsTick || (locked && busy !== "accept") || undefined}
              aria-describedby={needsTick ? `${id}-hint` : undefined}
              onClick={() => void accept()}
              className={settled}
            >
              {busy === "accept" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : null}
              {busy === "accept" ? text.saving : text.continue}
            </Button>
          </div>

          {needsTick ? (
            <p id={`${id}-hint`} className={cn("flex items-center justify-end gap-1.5 text-[0.8125rem] leading-snug", nudged ? cn("font-medium", DANGER_TEXT) : "text-muted-foreground")}>
              {nudged ? <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" /> : null}
              {text.needTick}
            </p>
          ) : null}

          <Callout tone="note" title={text.declineTitle}>
            {text.declineNote}
          </Callout>
        </div>
      )}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
