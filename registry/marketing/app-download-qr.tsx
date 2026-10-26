"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconPlay, IconSmartphone, IconStar } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { PhoneInput } from "@rhs-ui/primitives/phone-input";
import { cn } from "@/lib/utils";

export interface AppStore {
  /** The store's name: "App Store" or "Google Play". It also picks the icon and the small line when you pass neither. */
  name: string;
  /** Where the app is in that store. */
  href: string;
  /** The small line over the name: "Download on the". A default that suits the store is used when you leave it out. */
  caption?: string;
  /** The store's mark, as an SVG or an image you have the right to use. A phone or a play triangle in the house style stands in. */
  icon?: ReactNode;
}

export interface AppRating {
  /** The average, out of 5: 4.8. */
  value: number;
  /** How many ratings it comes from: 18300. */
  count: number;
  /** Where the rating is from: "the App Store". It is left out of the line when you do not pass it. */
  source?: string;
}

export interface AppDownloadQrLabels {
  /** The heading of the card. */
  cardTitle: string;
  /** The small line over the name of an Apple store button. */
  captionApple: string;
  /** The small line over the name of any other store button. */
  captionOther: string;
  /** The divider between the store buttons and the phone options. */
  or: string;
  /** The heading next to the QR code. */
  scan: string;
  /** The sentence under it. */
  scanText: string;
  /** The label of the phone field. */
  phone: string;
  /** The placeholder of the phone field. */
  phonePlaceholder: string;
  /** The button that sends the link. */
  send: string;
  /** The small print under it: what the text is, and what it costs. */
  note: string;
  /** Said under the field when no number was typed. */
  phoneRequired: string;
  /** Said under the field when the number is too short to be one. */
  phoneInvalid: string;
  /** Said when onSendLink fails. The typed number stays where it is. */
  failed: string;
  /** The confirmation's headline. */
  sent: string;
  /** What was sent and where. {phone} stands for the number. */
  sentTo: string;
  /** The button that goes back to the phone field. */
  another: string;
  /** The rating, with its source. {count} and {source} stand for the figures you pass. */
  ratingFrom: string;
  /** The rating, with its source, when it comes from one rating. {count} and {source} stand for the figures you pass. */
  ratingFromOne: string;
  /** The rating, without a source. {count} stands for the figure you pass. */
  ratingCount: string;
  /** The rating, without a source, when it comes from one rating. {count} stands for the figure you pass. */
  ratingOne: string;
  /** Read to a screen reader in front of the average. {value} stands for it. */
  ratingSummary: string;
}

const LABELS: AppDownloadQrLabels = {
  cardTitle: "Get the app",
  captionApple: "Download on the",
  captionOther: "Get it on",
  or: "or get it on your phone",
  scan: "Scan with your phone",
  scanText: "Point the camera at the code and tap the link that appears.",
  phone: "Or get the link by text",
  phonePlaceholder: "Mobile number",
  send: "Text me the link",
  note: "We send one text with the link and nothing else. Your carrier's message rates may apply.",
  phoneRequired: "Enter your mobile number and we text you the link.",
  phoneInvalid: "That number looks too short. Check it, including the area code.",
  failed: "We could not send the text just now. Your number is still here, so try again.",
  sent: "Link sent",
  sentTo: "We texted the download link to {phone}.",
  another: "Send to another number",
  ratingFrom: "{count} ratings on {source}",
  ratingFromOne: "{count} rating on {source}",
  ratingCount: "{count} ratings",
  ratingOne: "{count} rating",
  ratingSummary: "Rated {value} out of 5.",
};

export interface AppDownloadQrProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Take the route with you". */
  title: string;
  /** One or two sentences on what the app does for the visitor. */
  description?: string;
  /** The stores the app is in, with their links. Two is usual. */
  stores: readonly AppStore[];
  /**
   * The QR code, as an SVG or an image from your generator, for the link a phone should open. Give it an accessible
   * name (alt text or a title). It sits on a white tile, because a code scans best dark on light in both themes.
   */
  qr: ReactNode;
  /** Called with the number in international form ("+31612345678"). Resolve to say Link sent; reject to show the failure and keep the number. */
  onSendLink: (phone: string) => Promise<void> | void;
  /** The app's rating, shown as a line under the description. Pass it only when it is true and current. */
  rating?: AppRating;
  /** The country the phone field starts on, as its two-letter code. "US" by default. */
  defaultCountry?: string;
  /** Where the phone path starts. "idle" by default; "sent" shows Link sent, which repeats the number in defaultPhone. */
  defaultStatus?: "idle" | "sent";
  /** The number the phone path starts with, in international form. */
  defaultPhone?: string;
  /** The language numbers are written in. "en-US" by default. */
  locale?: string;
  /** The level of the heading: 2 by default. The card's heading sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<AppDownloadQrLabels>;
}

const PHONE = /^\+\d{8,15}$/;
const APPLE = /apple|app\s*store|ios|iphone|ipad/i;
const GOOGLE = /google|play|android/i;

const write = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** Phones and tablets: no hover and a coarse pointer. They get the store buttons only, because the app is already where they are. */
const NOT_ON_A_PHONE = "[@media(hover:none)_and_(pointer:coarse)]:hidden";

/**
 * A download section for the lower half of a page, built for the visitor who is on a computer: the pitch and a
 * rating line on one side, and a card on the other with two store buttons drawn in the house style (no copied
 * badges), a QR code to scan with the phone and a field to text the link to. It moves desktop visitors to the phone,
 * where the app belongs. A visitor who is already on a phone or tablet sees only the store buttons: the QR code and
 * the text field are hidden by a media query on hover and pointer, not by width, so a narrow desktop window still
 * gets them. The text path checks the number before sending, reports Link sent as a status message that takes
 * focus, and a failure keeps the number and hands focus back to the button.
 */
export function AppDownloadQr({
  title,
  description,
  stores,
  qr,
  onSendLink,
  rating,
  defaultCountry = "US",
  defaultStatus = "idle",
  defaultPhone = "",
  locale = "en-US",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: AppDownloadQrProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [phone, setPhone] = useState(defaultPhone);
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "sent">(defaultStatus);
  const [sentTo, setSentTo] = useState(defaultPhone);
  // The phone field is rebuilt for a new number, so the country and the digits start clean.
  const [epoch, setEpoch] = useState(0);
  // Focus only moves for something the visitor did, never on the first render of a section that starts in a state.
  const acted = useRef(false);
  const phoneRef = useRef<HTMLInputElement>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const busy = status === "busy";

  useEffect(() => {
    if (status === "sent" && acted.current) sentRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the visitor lands on it.
    else if (status === "error" && acted.current) sendRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    const mistake = !phone ? labels.phoneRequired : !PHONE.test(phone) ? labels.phoneInvalid : null;
    setProblem(mistake);
    if (mistake) {
      phoneRef.current?.focus();
      return;
    }
    setStatus("busy");
    try {
      await onSendLink(phone);
      setSentTo(phone);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setPhone("");
    setProblem(null);
    setStatus("idle");
    setEpoch((count) => count + 1);
    // The confirmation that had focus is gone and the field is new: land on it.
    window.requestAnimationFrame(() => phoneRef.current?.focus());
  }

  const number = new Intl.NumberFormat(locale);
  const average = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // One rating reads "1 rating", and a language with more forms still says its own plural.
  const single = rating ? new Intl.PluralRules(locale).select(rating.count) === "one" : false;
  const ratingText = rating
    ? write(rating.source ? (single ? labels.ratingFromOne : labels.ratingFrom) : single ? labels.ratingOne : labels.ratingCount, { count: number.format(rating.count), source: rating.source ?? "" })
    : null;

  return (
    <section data-slot="app-download-qr" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-16 gap-y-10 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] @3xl:items-center">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          {rating ? (
            <p className="mt-6 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted-foreground">
              <span className="sr-only">{write(labels.ratingSummary, { value: average.format(rating.value) })}</span>
              <span aria-hidden="true" className="inline-flex items-center gap-1.5 font-medium text-foreground tabular-nums">
                <IconStar fill="currentColor" className="size-4" />
                {average.format(rating.value)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{ratingText}</span>
            </p>
          ) : null}
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7">
          <SubHeading className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{labels.cardTitle}</SubHeading>
          <ul role="list" className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
            {stores.map((store) => {
              const apple = APPLE.test(store.name) && !GOOGLE.test(store.name);
              return (
                <li key={`${store.name}-${store.href}`} className="min-w-0">
                  <a
                    href={store.href}
                    className="group/store flex h-13 items-center gap-3 rounded-xl bg-foreground px-4 text-background outline-none transition-colors duration-150 hover:bg-foreground/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-6 [&_svg]:shrink-0"
                  >
                    {store.icon ?? (apple ? <IconSmartphone aria-hidden="true" /> : <IconPlay aria-hidden="true" />)}
                    <span className="min-w-0 text-left leading-tight">
                      <span className="block text-xs opacity-80">{store.caption ?? (apple ? labels.captionApple : labels.captionOther)}</span>
                      <span className="block truncate text-base font-medium">{store.name}</span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className={NOT_ON_A_PHONE}>
            <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
              {labels.or}
              <span aria-hidden="true" className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-[auto_minmax(0,1fr)] @sm:items-center @sm:gap-5">
              <div className="size-32 rounded-xl bg-white p-2.5 text-neutral-950 shadow-xs ring-1 ring-border [&_img]:size-full [&_svg]:size-full">{qr}</div>
              <div className="min-w-0">
                <p className="text-sm leading-snug font-semibold">{labels.scan}</p>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{labels.scanText}</p>
              </div>
            </div>

            {status === "sent" ? (
              <div ref={sentRef} tabIndex={-1} role="status" className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4 outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
                <span aria-hidden="true" className="mt-px grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck size={14} strokeWidth={2.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-6 font-semibold">{labels.sent}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-pretty text-muted-foreground">
                    {fill(labels.sentTo, { phone: <strong className="font-medium whitespace-nowrap text-foreground tabular-nums">{sentTo}</strong> })}
                  </p>
                  <Button type="button" variant="link" onClick={again} className="mt-2 h-auto rounded-sm p-0 text-[0.8125rem] underline decoration-foreground/40 hover:decoration-current">
                    {labels.another}
                  </Button>
                </div>
              </div>
            ) : (
              <form key={epoch} noValidate onSubmit={submit} aria-busy={busy || undefined} className="mt-6 grid grid-cols-1 gap-3">
                <FormField className="min-w-0 grid-cols-1 content-start" error={problem}>
                  <FormLabel>{labels.phone}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      ref={phoneRef}
                      name="phone"
                      aria-required="true"
                      placeholder={labels.phonePlaceholder}
                      defaultCountry={defaultCountry}
                      className="min-w-0"
                      value={phone}
                      onValueChange={(next) => {
                        setPhone(next);
                        if (problem) setProblem(null);
                      }}
                    />
                  </FormControl>
                </FormField>
                {status === "error" ? (
                  <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {labels.failed}
                  </p>
                ) : null}
                <Button ref={sendRef} type="submit" variant="outline" loading={busy} className="w-full">
                  {labels.send}
                </Button>
                <p className="text-xs leading-relaxed text-pretty text-muted-foreground">{labels.note}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
