"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconArrowRight, IconCheck, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface NewsletterIssue {
  /** The issue's number: 148. */
  number: number | string;
  /** What the issue is called: "The quiet cost of one more dashboard". */
  title: string;
  /** When it went out: a day such as "2026-10-23", or a time with its offset or a Z. */
  date: string;
  /** What is in it, three short headlines. */
  items: readonly string[];
  /** Where the issue lives in your archive. The whole card is a link to it. */
  href: string;
}

export interface NewsletterPreviewLabels {
  /** The label of the email field. It is read to a screen reader and not shown. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The button. */
  subscribe: string;
  /** Said under the field when it is empty. */
  emailRequired: string;
  /** Said under the field when it is not an address. */
  emailInvalid: string;
  /** Said when onSubmit fails. The typed address stays where it is. */
  failed: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** What happens next. {email} stands for the address the next issue will reach. */
  done: string;
  /** The button that goes back to the field. */
  another: string;
  /** The number of readers, as a sentence. {count} stands for the figure you pass. */
  readers: string;
  /** The privacy line. {link} stands for the link to the policy; without a privacyHref it is left out. */
  privacy: string;
  /** The text of the link to the policy. */
  privacyLink: string;
  /** The issue's number on the card. {number} stands for it. */
  issue: string;
  /** The small line over the issue's title. */
  latest: string;
  /** The small line over its headlines. */
  inside: string;
  /** The link that opens the issue. */
  read: string;
}

const LABELS: NewsletterPreviewLabels = {
  email: "Email address",
  emailPlaceholder: "you@company.com",
  subscribe: "Subscribe",
  emailRequired: "Enter your email address so we know where to send it.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  failed: "We could not subscribe you just now. Your address is still here, so try again.",
  doneTitle: "You are on the list",
  done: "The next issue goes to {email}.",
  another: "Use a different address",
  readers: "{count} people read it",
  privacy: "We use your address for this email only. {link}",
  privacyLink: "Privacy policy",
  issue: "Issue {number}",
  latest: "The latest issue",
  inside: "In this issue",
  read: "Read this issue",
};

export interface NewsletterPreviewProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** Called with the checked address. Resolve to confirm; reject to show the error and keep the address. */
  onSubmit: (email: string) => Promise<void> | void;
  /** The latest issue, shown beside the form as what the reader will get. */
  issue: NewsletterIssue;
  /** What the newsletter is called, or the promise in a line: "The Friday brief". */
  title: string;
  /** One or two sentences on what arrives and why it is worth the inbox space. */
  description?: string;
  /** How often and how to leave, under the button: "Every Friday at 8:00. Leave with one click." */
  promise?: string;
  /**
   * How many people read it, as the figure you would say aloud: "12,400". It appears as a sentence under the form.
   * Pass it only when it is true and recent; leave it out rather than round it up.
   */
  readers?: string;
  /** Your privacy policy. It becomes the link in the privacy line. */
  privacyHref?: string;
  /** The button's text. Subscribe by default. */
  cta?: string;
  /** The address the field starts with. */
  defaultValue?: string;
  /** Where the form starts. "idle" by default; "done" shows the confirmation, which repeats the address in defaultValue. */
  defaultStatus?: "idle" | "done";
  /** The language the date is written in. "en-US" by default. */
  locale?: string;
  /** The time zone the date is written in, when `issue.date` carries a time. "UTC" by default. A plain day is written as that day. */
  timeZone?: string;
  /** The level of the heading: 2 by default. The issue's title sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<NewsletterPreviewLabels>;
}

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const write = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

const TEXT_LINK =
  "rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A newsletter sign-up that shows what it signs you up for: the form on one side with the promise and, if it is
 * true, how many people read it, and on the other the latest issue as a card with its number, date, title and
 * three headlines. Showing a sample is the strongest argument a newsletter has, and the card is a real link into
 * the archive, so it doubles as an entry to it: the whole card is clickable, and the link inside it carries the
 * issue's title for a screen reader. The address is checked in words when the form is sent, a failure keeps what
 * was typed, and success replaces the form with a status message that takes focus so a screen reader reads it.
 */
export function NewsletterPreview({
  onSubmit,
  issue,
  title,
  description,
  promise,
  readers,
  privacyHref,
  cta,
  defaultValue = "",
  defaultStatus = "idle",
  locale = "en-US",
  timeZone = "UTC",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: NewsletterPreviewProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [email, setEmail] = useState(defaultValue);
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [sentTo, setSentTo] = useState(defaultValue.trim());
  // Focus only moves for something the reader did, never on the first render of a section that starts in a state.
  const acted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const IssueHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const busy = status === "busy";

  useEffect(() => {
    if (status === "done" && acted.current) doneRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    else if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    const address = email.trim();
    const mistake = !address ? labels.emailRequired : !ADDRESS.test(address) ? labels.emailInvalid : null;
    setProblem(mistake);
    if (mistake) {
      inputRef.current?.focus();
      return;
    }
    setStatus("busy");
    try {
      await onSubmit(address);
      setSentTo(address);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  function again() {
    acted.current = true;
    setEmail("");
    setProblem(null);
    setStatus("idle");
    // The confirmation that had focus is gone and the form is back: land on its field.
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  // A plain day ("2026-10-23") is that day everywhere; a moment is written in the zone you name.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(issue.date);
  const moment = new Date(issue.date);
  const written = Number.isNaN(moment.getTime()) ? issue.date : new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: dateOnly ? "UTC" : timeZone }).format(moment);
  const privacy = privacyHref ? (
    <a href={privacyHref} className={TEXT_LINK}>
      {labels.privacyLink}
    </a>
  ) : null;

  return (
    <section data-slot="newsletter-preview" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-16 gap-y-12 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] @4xl:items-center">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

          {status === "done" ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="mt-8 flex max-w-md items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
              <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                <IconCheck size={14} strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6 font-semibold">{labels.doneTitle}</p>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
                  {fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{sentTo}</strong> })}
                </p>
                <Button type="button" variant="link" onClick={again} className="mt-2 h-auto rounded-sm p-0 text-[0.8125rem] underline decoration-foreground/40 hover:decoration-current">
                  {labels.another}
                </Button>
              </div>
            </div>
          ) : (
            <form noValidate onSubmit={submit} aria-labelledby={`${id}-title`} aria-busy={busy || undefined} className="mt-8 max-w-md">
              <FormField className="content-start" error={problem}>
                <FormLabel className="sr-only">{labels.email}</FormLabel>
                <div className="flex flex-col gap-2 @md:flex-row">
                  <FormControl>
                    <Input
                      ref={inputRef}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-required="true"
                      placeholder={labels.emailPlaceholder}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (problem) setProblem(null);
                      }}
                      className="h-11 @md:flex-1"
                    />
                  </FormControl>
                  {/* The minimum width holds the room of the spinner (1rem and a gap), so the button does not grow and push the field when it turns busy. */}
                  <Button ref={submitRef} type="submit" size="lg" loading={busy} className="w-full min-w-37 @md:w-auto @md:shrink-0">
                    {cta ?? labels.subscribe}
                  </Button>
                </div>
              </FormField>
              {status === "error" ? (
                <p role="alert" className="mt-3 flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {labels.failed}
                </p>
              ) : null}
              {promise ? <p className="mt-3 text-sm leading-snug text-pretty text-muted-foreground">{promise}</p> : null}
              {privacy ? <p className="mt-2 text-xs leading-relaxed text-pretty text-muted-foreground">{fill(labels.privacy, { link: privacy })}</p> : null}
            </form>
          )}

          {readers ? (
            <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
              <IconUsers aria-hidden="true" className="size-4 shrink-0" />
              <span className="tabular-nums">{write(labels.readers, { count: readers })}</span>
            </p>
          ) : null}
        </div>

        {/* Two sheets of paper behind the card say "an archive of issues"; they are decoration and carry no content. */}
        <div className="relative isolate w-full max-w-xl min-w-0 pb-4">
          <span aria-hidden="true" className="absolute inset-x-8 -bottom-0 -z-20 h-1/2 rounded-2xl border border-border bg-card" />
          <span aria-hidden="true" className="absolute inset-x-4 bottom-2 -z-10 h-2/3 rounded-2xl border border-border bg-card" />
          <article className="group relative rounded-2xl border border-border bg-card shadow-xs transition-[border-color,box-shadow,translate] duration-200 has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40 hover:border-foreground/30 hover:shadow-sm motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none">
            <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5 text-xs text-muted-foreground @sm:px-6">
              <p className="font-medium text-foreground tabular-nums">{write(labels.issue, { number: issue.number })}</p>
              <time dateTime={issue.date} className="tabular-nums">
                {written}
              </time>
            </header>
            <div className="p-5 @sm:p-6">
              <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.latest}</p>
              <IssueHeading className="mt-3 text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance">{issue.title}</IssueHeading>
              <p className="mt-6 text-xs font-medium text-muted-foreground">{labels.inside}</p>
              <ul role="list" className="mt-3 grid gap-3 text-sm leading-snug">
                {issue.items.map((item, index) => (
                  <li key={`${index}-${item}`} className="flex gap-3 text-pretty">
                    <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-foreground/40" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={issue.href}
                className="mt-7 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium outline-none after:absolute after:inset-0 after:rounded-2xl after:content-['']"
              >
                {labels.read}
                <span className="sr-only">: {issue.title}</span>
                <IconArrowRight aria-hidden="true" size={15} className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
