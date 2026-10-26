"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCalendar, IconCheck, IconClock, IconListOrdered } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface CourseLesson {
  /** Which day it arrives on: 1. It is written as "Day 1" and numbers the list item. */
  day: number;
  /** What the lesson is called: "The one metric that matters". */
  title: string;
  /** One line on what the reader takes away: "Pick the single number that tells you if the week went well." */
  takeaway: string;
}

/** What onSubmit may resolve with, when your server already knows when the first lesson will arrive. */
export interface EmailCourseStart {
  /** When Day 1 reaches this address, as an ISO 8601 time with its offset or a Z ("2026-10-29T07:00:00+01:00"), or a plain day ("2026-10-29"). */
  firstLessonAt?: string;
}

export interface EmailCourseSignupLabels {
  /** The pill in front of a lesson. {day} stands for the number. */
  day: string;
  /** The length of the course when it has one lesson. */
  lessonOne: string;
  /** The length of the course. {count} stands for the number of lessons. */
  lessonOther: string;
  /** The heading of the card. */
  cardTitle: string;
  /** The label of the email field. */
  email: string;
  /** The placeholder of the email field. */
  emailPlaceholder: string;
  /** The button. */
  submit: string;
  /** The note beside the button. */
  unsubscribe: string;
  /** When the course starts, under the button. It is also what the confirmation says when it has no date. */
  start: string;
  /** The privacy line. {link} stands for the link to the policy; without a privacyHref it is left out. */
  privacy: string;
  /** The text of the link to the policy. */
  privacyLink: string;
  /** Said under the field when it is empty. */
  emailRequired: string;
  /** Said under the field when it is not an address. */
  emailInvalid: string;
  /** Said when onSubmit fails. The typed address stays where it is. */
  failed: string;
  /** The headline of the confirmation. */
  doneTitle: string;
  /** What happens next. {email} stands for the address the lessons will reach. */
  done: string;
  /** The small line over the first lesson in the confirmation. {day} stands for its number. */
  first: string;
  /** When the first lesson arrives, when the response gave a date. {when} stands for the day and time. */
  arrives: string;
  /** The button that goes back to the field. */
  another: string;
}

const LABELS: EmailCourseSignupLabels = {
  day: "Day {day}",
  lessonOne: "{count} lesson",
  lessonOther: "{count} lessons",
  cardTitle: "Get the course by email",
  email: "Email address",
  emailPlaceholder: "you@company.com",
  submit: "Start the course",
  unsubscribe: "Unsubscribe any time",
  start: "Starts the day after you sign up",
  privacy: "We use your email for this course only. {link}",
  privacyLink: "Privacy policy",
  emailRequired: "Enter your email address so the lessons know where to go.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  failed: "We could not sign you up just now. Your address is still here, so try again.",
  doneTitle: "You are signed up",
  done: "The lessons will arrive at {email}.",
  first: "Your first lesson",
  arrives: "Arrives {when}",
  another: "Use a different address",
};

export interface EmailCourseSignupProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** The outline, in the order the lessons arrive: five is a good number. */
  lessons: readonly CourseLesson[];
  /** Called with the checked address. Resolve to confirm (optionally with the time of Day 1); reject to show the error and keep the address. */
  onSubmit: (email: string) => Promise<EmailCourseStart | void> | EmailCourseStart | void;
  /** The heading: "Learn pricing in five days". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** How much time it takes a day: "5 minutes a day". Shown with the number of lessons. */
  duration?: string;
  /** Your privacy policy. It becomes the link in the privacy line. */
  privacyHref?: string;
  /** The address the field starts with. */
  defaultValue?: string;
  /** Where the card starts. "idle" by default; "done" shows the confirmation, which repeats the address in defaultValue. */
  defaultStatus?: "idle" | "done";
  /** The start the confirmation names when it begins in the "done" state, as onSubmit would have resolved it. */
  defaultStart?: EmailCourseStart;
  /** The language dates and numbers are written in. "en-US" by default. */
  locale?: string;
  /** The time zone the time of Day 1 is written in, and the one it names. "UTC" by default. */
  timeZone?: string;
  /** The level of the heading: 2 by default. The card's heading sits one level below it. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<EmailCourseSignupLabels>;
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

/** The hour as the locale writes it: two digits on a 24-hour clock ("07:00"), one on a 12-hour clock ("7:00 AM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

/** The moment of Day 1 as a person says it: the day, and the time with its zone when the moment has one. */
function describeStart(moment: string, locale: string, timeZone: string): string | null {
  const date = new Date(moment);
  if (Number.isNaN(date.getTime())) return null;
  const hasTime = /T\d{2}:\d{2}/.test(moment);
  const day = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: hasTime ? timeZone : "UTC" }).format(date);
  if (!hasTime) return day;
  return `${day}, ${new Intl.DateTimeFormat(locale, { ...clockOptions(locale), timeZoneName: "short", timeZone }).format(date)}`;
}

const TEXT_LINK =
  "rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A short email course that sells itself by showing the lessons: the outline day by day on one side, as a real
 * ordered list with each lesson's title and the one thing the reader takes away, and on the other a card with one
 * email field, the start rule under the button, an Unsubscribe any time note beside it and the privacy line. The
 * promise is concrete before the address is given. The confirmation replaces the form, says where the lessons will
 * arrive and when Day 1 comes: as a day and time in the time zone you name when your server tells it, and
 * as your own start rule when it does not. It is a status message that takes focus, so a screen reader reads it.
 * For creators, consultants and educators who build lists with sequences.
 */
export function EmailCourseSignup({
  lessons,
  onSubmit,
  title,
  description,
  duration,
  privacyHref,
  defaultValue = "",
  defaultStatus = "idle",
  defaultStart,
  locale = "en-US",
  timeZone = "UTC",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: EmailCourseSignupProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [email, setEmail] = useState(defaultValue);
  const [problem, setProblem] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "error" | "done">(defaultStatus);
  const [signedUp, setSignedUp] = useState<{ email: string; arrival: string | null }>(() => ({
    email: defaultValue.trim(),
    arrival: defaultStart?.firstLessonAt ? describeStart(defaultStart.firstLessonAt, locale, timeZone) : null,
  }));
  // Focus only moves for something the visitor did, never on the first render of a block that starts in a state.
  const acted = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const SubHeading = `h${headingLevel + 1}` as "h3" | "h4";
  const busy = status === "busy";
  const count = new Intl.NumberFormat(locale).format(lessons.length);
  const length = write(new Intl.PluralRules(locale).select(lessons.length) === "one" ? labels.lessonOne : labels.lessonOther, { count });
  const first = lessons[0];

  useEffect(() => {
    if (status === "done" && acted.current) doneRef.current?.focus();
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the visitor lands on it.
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
      const start = await onSubmit(address);
      const moment = start && typeof start === "object" ? start.firstLessonAt : undefined;
      setSignedUp({ email: address, arrival: moment ? describeStart(moment, locale, timeZone) : null });
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

  const privacy = privacyHref ? (
    <a href={privacyHref} className={TEXT_LINK}>
      {labels.privacyLink}
    </a>
  ) : null;

  return (
    <section data-slot="email-course-signup" data-status={status} aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-16 gap-y-12 @4xl:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] @4xl:items-start">
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          <ul role="list" className="mt-6 flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
              <IconListOrdered aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className="tabular-nums">{length}</span>
            </li>
            {duration ? (
              <li className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
                <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                {duration}
              </li>
            ) : null}
          </ul>

          <ol role="list" className="mt-10">
            {lessons.map((lesson, index) => {
              const last = index === lessons.length - 1;
              const day = write(labels.day, { day: lesson.day });
              return (
                <li key={`${lesson.day}-${lesson.title}`} value={lesson.day} className="grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-4">
                  <div aria-hidden="true" className="flex flex-col items-center">
                    <span className="grid h-7 w-full place-items-center rounded-full border border-border bg-card text-xs font-medium tabular-nums">{day}</span>
                    {last ? null : <span className="my-1.5 w-px flex-1 bg-border" />}
                  </div>
                  <div className={cn("min-w-0 pt-0.5", !last && "pb-7")}>
                    <p className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
                      <span className="sr-only">{day}: </span>
                      {lesson.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{lesson.takeaway}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="w-full max-w-xl min-w-0 rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-7 @4xl:sticky @4xl:top-8">
          {status === "done" ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="outline-none transition-[opacity,translate] duration-300 motion-reduce:transition-none starting:translate-y-1 starting:opacity-0">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
                <IconCheck size={22} strokeWidth={2.25} />
              </span>
              <SubHeading className="mt-5 text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">{labels.doneTitle}</SubHeading>
              <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                {fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{signedUp.email}</strong> })}
              </p>
              {first ? (
                <div className="mt-5 rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{write(labels.first, { day: first.day })}</p>
                  <p className="mt-2 text-sm leading-snug font-semibold">{first.title}</p>
                  <p className="mt-2 flex items-start gap-2 text-sm leading-snug text-pretty text-muted-foreground">
                    <IconCalendar aria-hidden="true" className="mt-px size-4 shrink-0" />
                    {signedUp.arrival ? write(labels.arrives, { when: signedUp.arrival }) : labels.start}
                  </p>
                </div>
              ) : null}
              <Button type="button" variant="outline" onClick={again} className="mt-6">
                {labels.another}
              </Button>
            </div>
          ) : (
            <>
              <SubHeading id={`${id}-card`} className="text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">
                {labels.cardTitle}
              </SubHeading>
              <form noValidate onSubmit={submit} aria-labelledby={`${id}-card`} aria-busy={busy || undefined} className="mt-5 grid gap-4">
                <FormField className="content-start" error={problem}>
                  <FormLabel>{labels.email}</FormLabel>
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
                      className="h-11"
                    />
                  </FormControl>
                </FormField>
                {status === "error" ? (
                  <p role="alert" className="flex items-start gap-2 text-sm leading-snug font-medium text-destructive">
                    <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    {labels.failed}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* The minimum width holds the room of the spinner (1rem and a gap), so the button does not grow and push the note beside it when it turns busy. */}
                  <Button ref={submitRef} type="submit" size="lg" loading={busy} className="w-full min-w-47 @md:w-auto">
                    {labels.submit}
                  </Button>
                  <p className="text-xs text-muted-foreground">{labels.unsubscribe}</p>
                </div>
                <p className="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
                  <IconCalendar aria-hidden="true" className="mt-px size-4 shrink-0" />
                  {labels.start}
                </p>
                <p className="border-t border-border pt-4 text-xs leading-relaxed text-pretty text-muted-foreground">{fill(labels.privacy, { link: privacy })}</p>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
