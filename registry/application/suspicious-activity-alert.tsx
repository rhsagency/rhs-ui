"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconShieldAlert } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

/** The facts about the sign-in that make it possible to judge it. */
export interface SuspiciousActivityEvent {
  /** What signed in, as a person would say it: "Chrome on Windows". */
  device: string;
  /** Where it seems to be, as far as the IP address says: "Utrecht, Netherlands". It is labelled approximate. Leave it out when you do not know. */
  place?: string;
  /** When it happened, as a Date or an ISO moment. Written in `timeZone`. */
  at: Date | string | number;
  /** The IP address. It is hidden in part before it is shown ("203.0.x.x"), whatever you pass, because an address is personal data. */
  ip?: string;
}

/** One thing to do after "No, secure my account". */
export interface SuspiciousActivityStep {
  /** A stable key: "password". */
  id: string;
  /** What to do, as a short instruction: "Change your password". */
  label: string;
  /** Why or how, in a line. */
  description?: string;
  /** The button's words: "Change password". The step has a button only when it also has `href` or `onSelect`; without either it is an instruction to read. */
  actionLabel?: string;
  /** Where the button goes, for a step that is a page: your password settings. */
  href?: string;
  /** Called when the button is pressed. Return a promise and the button shows a spinner meanwhile. */
  onSelect?: () => unknown;
}

/** The words the alert uses, for translation. */
export interface SuspiciousActivityAlertLabels {
  /** The question. Default "Was this you?". */
  title?: string;
  /** Under it. Default "We noticed a sign-in to your account from a device we do not recognise.". */
  body?: string;
  /** The name of the row with the device. Default "Device". */
  device?: string;
  /** The name of the row with the place. Default "Approximate location". */
  place?: string;
  /** The name of the row with the time. Default "Time". */
  time?: string;
  /** The name of the row with the IP address. Default "IP address". */
  ip?: string;
  /** Under the facts. Default "The location is approximate, worked out from the IP address, which is partly hidden.". */
  note?: string;
  /** The harmless answer. Default "Yes, it was me". */
  confirm?: string;
  /** The other one. Default "No, secure my account". */
  secure?: string;
  /** Under the buttons when `onConfirm` or `onSecure` threw. Default "That did not go through. Try again.". */
  failed?: string;
  /** The heading after "No". Default "Let us secure your account". */
  securedTitle?: string;
  /** Under it. Default "Thanks for telling us. Do these now:". */
  securedBody?: string;
  /** Said when the alert was dismissed with "Yes". Default "Thanks for letting us know.". */
  confirmedSpoken?: string;
}

export interface SuspiciousActivityAlertProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The sign-in: device, approximate place, time and IP address. */
  event: SuspiciousActivityEvent;
  /** The time zone the time is written in, so the server and the browser agree. Pass the zone the person lives in. Default "UTC". */
  timeZone?: string;
  /** Called when "Yes, it was me" is pressed. Return a promise and the button waits; once it settles the alert folds away. A rejection keeps the alert and says so. */
  onConfirm?: () => unknown;
  /** Called when "No, secure my account" is pressed. Do the urgent part here (flag the session, lock it); once it settles the alert shows the next steps. A rejection keeps the alert and says so. */
  onSecure?: () => unknown;
  /** The next steps, in order. Default two instructions, to change the password and to sign out other sessions; give them an `href` or an `onSelect` and they become buttons. */
  steps?: readonly SuspiciousActivityStep[];
  /** Start on the next steps, for a page that reopens after "No" or a preview. Default "ask". */
  defaultStep?: "ask" | "secured";
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The words the alert uses, for translation. */
  labels?: SuspiciousActivityAlertLabels;
}

const DEFAULT_LABELS = {
  title: "Was this you?",
  body: "We noticed a sign-in to your account from a device we do not recognise.",
  device: "Device",
  place: "Approximate location",
  time: "Time",
  ip: "IP address",
  note: "The location is approximate, worked out from the IP address, which is partly hidden.",
  confirm: "Yes, it was me",
  secure: "No, secure my account",
  failed: "That did not go through. Try again.",
  securedTitle: "Let us secure your account",
  securedBody: "Thanks for telling us. Do these now:",
  confirmedSpoken: "Thanks for letting us know.",
} satisfies Required<SuspiciousActivityAlertLabels>;

const DEFAULT_STEPS: readonly SuspiciousActivityStep[] = [
  { id: "password", label: "Change your password", description: "Pick one you have not used on any other site." },
  { id: "sessions", label: "Sign out other sessions", description: "Anyone who is signed in somewhere else will have to sign in again." },
];

/** How long the alert takes to fold away, in ms: the length of its transition. */
const LEAVE_MS = 220;

/** The last two parts of an IPv4 address and everything after the first two groups of an IPv6 one, hidden. An address that is already hidden stays as it is. */
function hideIp(address: string): string {
  const value = address.trim();
  if (/[x*•]/i.test(value)) return value;
  const four = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(value);
  if (four) return `${four[1]}.${four[2]}.x.x`;
  if (value.includes(":")) return [...value.split(":").filter(Boolean).slice(0, 2), "x", "x"].join(":");
  return "x.x.x.x";
}

function written(date: Date, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/** A step has a button only when it says what the button is called and has somewhere to go or something to run. */
const hasAction = (step: SuspiciousActivityStep) => Boolean(step.actionLabel && (step.href || step.onSelect));

/** The button of a step: a link when it has a place to go, a button with a spinner when it runs something. */
function StepAction({ step }: { step: SuspiciousActivityStep }) {
  const [busy, setBusy] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  // A disabled button cannot keep the focus, so the browser lets go of it while the step runs. When the button is back the focus returns to it, unless the person has moved on by then.
  useEffect(() => {
    if (busy || !refocus.current) return;
    refocus.current = false;
    if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
  }, [busy]);
  if (!hasAction(step)) return null;
  if (step.href) {
    return (
      <Button asChild size="sm" variant="outline" className="shrink-0">
        <a href={step.href} onClick={() => void step.onSelect?.()}>
          {step.actionLabel}
        </a>
      </Button>
    );
  }
  return (
    <Button
      ref={button}
      type="button"
      size="sm"
      variant="outline"
      loading={busy}
      className="shrink-0"
      onClick={async () => {
        const result = step.onSelect?.();
        if (!isThenable(result)) return;
        refocus.current = document.activeElement === button.current;
        setBusy(true);
        try {
          await result;
        } catch {
          // Your app shows its own error; the button just comes back.
        } finally {
          setBusy(false);
        }
      }}
    >
      {step.actionLabel}
    </Button>
  );
}

/**
 * The "was this you?" alert for a sign-in from a device nobody has seen
 * before. It shows what is needed to judge it, as a description list: the
 * device, the approximate place (called approximate, because it is guessed
 * from the IP address), the time, and the IP address with its last part
 * hidden, since an address is personal data. Two clear answers follow: "Yes,
 * it was me" folds the alert away, and "No, secure my account" runs your
 * `onSecure` and then shows the next steps (change the password, sign out
 * other sessions), which become buttons when you give them somewhere to go.
 * The destructive answer is never the one that has the focus: nothing is
 * focused when the alert appears, it is announced once as an alert, and focus
 * moves only when the next steps take the place of the answers, or back to the
 * button that was pressed when its answer failed.
 */
export function SuspiciousActivityAlert({ event, timeZone = "UTC", onConfirm, onSecure, steps = DEFAULT_STEPS, defaultStep = "ask", locale = "en-US", labels, className, ...props }: SuspiciousActivityAlertProps) {
  const text: Required<SuspiciousActivityAlertLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const heading = useRef<HTMLParagraphElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const secureButton = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  const refocus = useRef<"confirm" | "secure" | null>(null);
  const leave = useRef<number | undefined>(undefined);

  const [step, setStep] = useState<"ask" | "secured">(defaultStep);
  const [phase, setPhase] = useState<"open" | "leaving" | "gone">("open");
  const [working, setWorking] = useState<"confirm" | "secure" | null>(null);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");

  useEffect(() => () => window.clearTimeout(leave.current), []);

  // "No" replaces the answers with the next steps, so the heading of the steps takes the focus: the button that was pressed is gone.
  useEffect(() => {
    if (step !== "secured" || !moved.current) return;
    moved.current = false;
    heading.current?.focus();
  }, [step]);

  // A disabled button cannot keep the focus, so the browser lets go of it while the answer is sent. If the answer fails the button is back, and the focus returns to it unless the person has moved on by then. After a success there is nothing to return to: the steps take the focus, or the alert folds away.
  useEffect(() => {
    if (working !== null || refocus.current === null) return;
    const button = refocus.current === "confirm" ? confirmButton : secureButton;
    refocus.current = null;
    if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
  }, [working]);

  async function answer(which: "confirm" | "secure") {
    if (working) return;
    const held = document.activeElement === (which === "confirm" ? confirmButton : secureButton).current;
    setWorking(which);
    setProblem("");
    try {
      await (which === "confirm" ? onConfirm : onSecure)?.();
    } catch {
      setProblem(text.failed);
      refocus.current = held ? which : null;
      setWorking(null);
      return;
    }
    setWorking(null);
    if (which === "secure") {
      moved.current = true;
      setStep("secured");
      return;
    }
    setSaid(text.confirmedSpoken);
    setPhase("leaving");
    leave.current = window.setTimeout(() => setPhase("gone"), LEAVE_MS);
  }

  const moment = new Date(event.at);
  const dated = !Number.isNaN(moment.getTime());
  const facts = [
    { term: text.device, value: event.device },
    ...(event.place ? [{ term: text.place, value: event.place }] : []),
    ...(dated
      ? [
          {
            term: text.time,
            value: (
              // The words of a date can differ a little between the engines that render the server's HTML and the browser's; the server's stay, and the tree is kept.
              <time dateTime={moment.toISOString()} title={written(moment, locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })} suppressHydrationWarning className="tabular-nums">
                {written(moment, locale, timeZone, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
              </time>
            ),
          },
        ]
      : []),
    ...(event.ip ? [{ term: text.ip, value: <span className="font-mono text-[0.8125rem] tracking-tight">{hideIp(event.ip)}</span> }] : []),
  ];

  const asking = step === "ask";
  const status = (
    <span role="status" className="sr-only">
      {said}
    </span>
  );
  if (phase === "gone") return status;

  return (
    <>
      <div
        data-slot="suspicious-activity-alert"
        data-step={step}
        inert={phase === "leaving" || undefined}
        // A grid row folds from 1fr to 0fr, which animates height without measuring anything.
        className={cn(
          "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
          phase === "open" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          className,
        )}
        {...props}
      >
        <div className="-m-1 min-h-0 overflow-hidden p-1">
          <Alert
            // The question is announced once, the moment it appears. The next steps are a region the focus moves to, so they are not read twice.
            role={asking ? "alert" : "region"}
            aria-labelledby={`${id}-title`}
            tone="default"
            className={cn("flex items-start gap-3.5 p-4 text-card-foreground shadow-xs sm:gap-4 sm:p-5", asking ? "bg-card" : "border-destructive/40 bg-destructive/5")}
          >
            <span
              aria-hidden="true"
              className={cn("grid size-10 shrink-0 place-items-center rounded-lg [&_svg]:size-5", asking ? "border border-border bg-muted text-foreground" : "bg-destructive text-destructive-foreground")}
            >
              <IconShieldAlert />
            </span>
            <div className="@container grid min-w-0 flex-1 gap-1">
              {/* The alert's own grid puts a title in its second column, after an icon; here the icon is a tile beside this column, so both start in the first. */}
              <AlertTitle ref={heading} id={`${id}-title`} tabIndex={-1} className="col-start-1 pt-px text-[0.9375rem] font-semibold tracking-[-0.01em] outline-none">
                {asking ? text.title : text.securedTitle}
              </AlertTitle>
              <AlertDescription className="col-start-1 gap-0 text-sm">{asking ? text.body : text.securedBody}</AlertDescription>

              {asking ? (
                <>
                  <div className="mt-3 rounded-lg border border-border bg-background px-3.5 py-3 sm:px-4">
                    <DescriptionList items={facts} />
                  </div>
                  <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{text.note}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button ref={confirmButton} type="button" variant="outline" loading={working === "confirm"} disabled={working === "secure"} onClick={() => void answer("confirm")}>
                      {text.confirm}
                    </Button>
                    <Button ref={secureButton} type="button" variant="destructive" loading={working === "secure"} disabled={working === "confirm"} onClick={() => void answer("secure")}>
                      {text.secure}
                    </Button>
                  </div>
                  {problem ? (
                    <p role="alert" className="mt-1 text-[0.8125rem] leading-snug text-destructive">
                      {problem}
                    </p>
                  ) : null}
                </>
              ) : (
                <ol className="mt-3.5 grid gap-3.5">
                  {steps.map((item, index) => (
                    // Number, words, button on one row where there is room, and the button under the words where there is not.
                    <li key={item.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2.5 @md:grid-cols-[1.25rem_minmax(0,1fr)_auto]">
                      <span aria-hidden="true" className="mt-px grid size-5 place-items-center rounded-full border border-border bg-background text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug font-medium">{item.label}</p>
                        {item.description ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">{item.description}</p> : null}
                      </div>
                      {hasAction(item) ? (
                        <div className="col-start-2 justify-self-start @md:col-start-3 @md:row-start-1 @md:justify-self-end">
                          <StepAction step={item} />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Alert>
        </div>
      </div>
      {status}
    </>
  );
}
