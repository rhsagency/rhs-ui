"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconInbox, IconMail, IconMailOpen, IconRefresh } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** What the form hands to `onRequestLink`. */
export interface MagicLinkRequest {
  /** The address, trimmed. */
  email: string;
  /** Whether "Keep me signed in on this device" is ticked. */
  remember: boolean;
}

/** The words the card uses, for translation. `{email}`, `{minutes}` and `{seconds}` are filled in. */
export interface MagicLinkSignInLabels {
  /** The form's heading. Default "Sign in with email". */
  heading?: string;
  /** The line under it. Default "We will email you a link that signs you in. There is no password to remember.". */
  description?: string;
  /** Default "Email address". */
  email?: string;
  /** Default "Keep me signed in on this device". */
  remember?: string;
  /** The submit button. Default "Email me a link". */
  submit?: string;
  /** The submit button while the request runs. Default "Sending the link". */
  sending?: string;
  /** Under the field when the address is not one. Default "Enter a valid email address, like name@company.com." */
  invalid?: string;
  /** Above the form when the request failed. Default "We could not send the link. Check your connection and try again." */
  failed?: string;
  /** Above the buttons when asking again failed. Default "We could not send another link. Try again in a moment." */
  failedAgain?: string;
  /** The confirmation's heading. Default "Check your inbox". */
  sentHeading?: string;
  /** The first line of the confirmation. It never says whether an account exists. Default "If {email} has an account, a sign-in link is on its way." */
  sentLine?: string;
  /** What to expect. Default "The link works once and expires in {minutes} minutes." */
  expires?: string;
  /** Where to look. Default "Nothing yet? Check your spam folder. It can take a minute to arrive." */
  lookHere?: string;
  /** The resend button at rest. Default "Resend link". */
  resend?: string;
  /** The resend button while it waits, in tabular figures. Default "Resend link in {seconds}s". */
  resendWait?: string;
  /** The resend button while it sends. Default "Sending…". */
  resendSending?: string;
  /** The button back to the form. Default "Use a different email". */
  differentEmail?: string;
  /** The button to the password page. Default "Sign in with a password". */
  usePassword?: string;
  /** Said when a link went out. Default "We sent a sign-in link to {email}. You can ask for another in {seconds} seconds." */
  sentSaid?: string;
  /** Said when another link went out. Default "Link sent again to {email}. You can ask for another in {seconds} seconds." */
  sentAgainSaid?: string;
  /** Said when the wait is over. Default "You can ask for another link now." */
  readySaid?: string;
  /** The heading once the link was opened. Default "You are signed in". */
  signedInHeading?: string;
  /** The line under it. Default "The link worked.". */
  signedInLine?: string;
  /** The button after it. Default "Continue". */
  continue?: string;
}

export interface MagicLinkSignInProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /**
   * Asks your server to email a link. Resolve whether or not the address has an account, so the card never shows which addresses are registered;
   * reject only when the request itself failed, and the card keeps the address and shows one retry message.
   */
  onRequestLink: (request: MagicLinkRequest) => void | Promise<void>;
  /** How long, in seconds, before another link can be asked for. Default 30. */
  resendAfter?: number;
  /** How long the link works, in minutes, as the confirmation says it. Default 15. */
  expiresInMinutes?: number;
  /** The person wants a password instead. Leave it out for no such button. */
  onUsePassword?: () => void;
  /** Set it to true when your app notices that the link was opened (in another tab, say): the card then says so and offers Continue. */
  signedIn?: boolean;
  /** Continue was pressed on the signed-in card. */
  onSignedIn?: () => void;
  /** Under the card's actions: terms, a link to create an account. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The address the field starts with, for a person who typed it elsewhere. */
  defaultEmail?: string;
  /** Start on the confirmation, with the wait already running: for a preview, or a page reloaded after the link was sent. Needs `defaultEmail`. */
  defaultSent?: boolean;
  /** The words the card uses, for translation. */
  labels?: MagicLinkSignInLabels;
}

const DEFAULT_LABELS = {
  heading: "Sign in with email",
  description: "We will email you a link that signs you in. There is no password to remember.",
  email: "Email address",
  remember: "Keep me signed in on this device",
  submit: "Email me a link",
  sending: "Sending the link",
  invalid: "Enter a valid email address, like name@company.com.",
  failed: "We could not send the link. Check your connection and try again.",
  failedAgain: "We could not send another link. Try again in a moment.",
  sentHeading: "Check your inbox",
  sentLine: "If {email} has an account, a sign-in link is on its way.",
  expires: "The link works once and expires in {minutes} minutes.",
  lookHere: "Nothing yet? Check your spam folder. It can take a minute to arrive.",
  resend: "Resend link",
  resendWait: "Resend link in {seconds}s",
  resendSending: "Sending…",
  differentEmail: "Use a different email",
  usePassword: "Sign in with a password",
  sentSaid: "We sent a sign-in link to {email}. You can ask for another in {seconds} seconds.",
  sentAgainSaid: "Link sent again to {email}. You can ask for another in {seconds} seconds.",
  readySaid: "You can ask for another link now.",
  signedInHeading: "You are signed in",
  signedInLine: "The link worked.",
  continue: "Continue",
} satisfies Required<MagicLinkSignInLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Passwordless sign-in in one card. The first view is a single email field, a
 * "keep me signed in" tick and one button; a malformed address is caught as
 * soon as the field is left, with the message tied to the field, and a failed
 * request keeps what was typed and shows one retry message. On success the
 * card swaps in place to "Check your inbox", which names the address without
 * ever saying whether it has an account, says the link works once and for how
 * long, says where to look, and offers three ways on: send another link
 * (after a wait that counts down in tabular figures and is announced only when
 * it starts and when it ends), use a different email, or use a password. The
 * wait is worked out from timestamps, so it is right after the tab sleeps.
 */
export function MagicLinkSignIn({
  onRequestLink,
  resendAfter = 30,
  expiresInMinutes = 15,
  onUsePassword,
  signedIn = false,
  onSignedIn,
  footer,
  titleAs: Title = "h1",
  defaultEmail = "",
  defaultSent = false,
  labels,
  className,
  ...props
}: MagicLinkSignInProps) {
  const text: Required<MagicLinkSignInLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const emailField = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const working = useRef(false);
  const moved = useRef(false);
  const endsAt = useRef(0);
  const [step, setStep] = useState<"form" | "sent">(defaultSent && defaultEmail ? "sent" : "form");
  const [email, setEmail] = useState(defaultEmail);
  const [remember, setRemember] = useState(false);
  const [invalid, setInvalid] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [waiting, setWaiting] = useState(defaultSent && Boolean(defaultEmail));
  const [left, setLeft] = useState(resendAfter);
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const address = email.trim();
  const [sentBefore = "", sentAfter = ""] = text.sentLine.split("{email}");

  // Only the start and the end of the wait are spoken. The seconds on the button are for the eye, and the clock is the timestamp, not a count of ticks.
  useEffect(() => {
    if (!waiting) return;
    if (!endsAt.current) endsAt.current = Date.now() + resendAfter * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        endsAt.current = 0;
        setWaiting(false);
        say(text.readySaid);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the ready line is read when the wait ends; a later change of wording must not restart the clock
  }, [waiting, resendAfter]);

  // Focus follows the swap, but never on the first paint: the confirmation's heading, or the address field on the way back.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    (step === "sent" ? heading.current : emailField.current)?.focus();
  }, [step]);

  function check(): boolean {
    const ok = EMAIL.test(address);
    setInvalid(ok ? "" : text.invalid);
    return ok;
  }

  async function request(again: boolean) {
    if (working.current) return;
    if (!again && !check()) {
      emailField.current?.focus();
      return;
    }
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      await onRequestLink({ email: address, remember });
      endsAt.current = Date.now() + resendAfter * 1000;
      setLeft(resendAfter);
      setWaiting(true);
      say(fill(again ? text.sentAgainSaid : text.sentSaid, { email: address, seconds: String(resendAfter) }));
      if (!again) {
        moved.current = true;
        setStep("sent");
      }
    } catch {
      setProblem(again ? text.failedAgain : text.failed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  function back() {
    moved.current = true;
    setProblem("");
    setStep("form");
  }

  const shell = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";
  const titleClass = "text-xl leading-tight font-semibold tracking-[-0.03em] text-balance outline-none";
  const mark = (icon: ReactNode) => (
    <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-5">
      {icon}
    </span>
  );

  if (signedIn) {
    return (
      <div data-slot="magic-link-sign-in" data-step="signed-in" className={cn(shell, className)} {...props}>
        <div className="grid justify-items-start gap-4">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-5" />
          </span>
          <div className="grid gap-1.5">
            <Title ref={heading} tabIndex={-1} className={titleClass}>
              {text.signedInHeading}
            </Title>
            <p role="status" className="text-sm leading-relaxed text-muted-foreground">
              {text.signedInLine}
            </p>
          </div>
        </div>
        <Button type="button" size="lg" onClick={onSignedIn} className="w-full">
          {text.continue}
        </Button>
      </div>
    );
  }

  return (
    <div data-slot="magic-link-sign-in" data-step={step} className={cn(shell, className)} {...props}>
      {step === "form" ? (
        <>
          <div className="grid justify-items-start gap-4">
            {mark(<IconMail />)}
            <div className="grid gap-1.5">
              <Title className={titleClass}>{text.heading}</Title>
              <p className="text-sm leading-relaxed text-muted-foreground">{text.description}</p>
            </div>
          </div>

          <form
            noValidate
            aria-busy={busy || undefined}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void request(false);
            }}
            className="grid gap-5"
          >
            <div role="alert" className="empty:hidden">
              {problem ? (
                <Alert tone="destructive" role="none" className={DANGER_TEXT}>
                  <IconAlertCircle />
                  <AlertTitle>{problem}</AlertTitle>
                </Alert>
              ) : null}
            </div>

            <FormField error={invalid}>
              <FormLabel>{text.email}</FormLabel>
              <FormControl>
                <Input
                  ref={emailField}
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (invalid && EMAIL.test(event.target.value.trim())) setInvalid("");
                  }}
                  onBlur={() => {
                    if (address) check();
                  }}
                  className="h-10"
                />
              </FormControl>
            </FormField>

            <div className="flex items-center gap-2.5">
              <Checkbox id={`${id}-remember`} checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
              <Label htmlFor={`${id}-remember`} className="font-normal">
                {text.remember}
              </Label>
            </div>

            <Button type="submit" size="lg" loading={busy} className="w-full">
              {busy ? text.sending : text.submit}
            </Button>
          </form>

          {onUsePassword ? (
            <Button type="button" variant="ghost" onClick={onUsePassword} className="-mt-2 w-full text-muted-foreground hover:text-foreground">
              {text.usePassword}
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <div className="grid justify-items-start gap-4">
            {mark(<IconMailOpen />)}
            <div className="grid gap-2">
              <Title ref={heading} tabIndex={-1} className={titleClass}>
                {text.sentHeading}
              </Title>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {sentBefore}
                <strong className="font-medium break-all text-foreground">{address}</strong>
                {sentAfter}
              </p>
            </div>
          </div>

          <ul className="grid gap-2.5 text-[0.8125rem] leading-snug text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <IconClock aria-hidden="true" className="mt-px size-4 shrink-0" />
              {fill(text.expires, { minutes: String(expiresInMinutes) })}
            </li>
            <li className="flex items-start gap-2.5">
              <IconInbox aria-hidden="true" className="mt-px size-4 shrink-0" />
              {text.lookHere}
            </li>
          </ul>

          <div className="grid gap-2.5">
            <div role="alert" className="empty:hidden">
              {problem ? (
                <Alert tone="destructive" role="none" className={DANGER_TEXT}>
                  <IconAlertCircle />
                  <AlertTitle>{problem}</AlertTitle>
                </Alert>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              // While it waits the name stays "Resend link": the seconds are for the eye, and a name that changed every second would be read out again by a screen reader that stays on the button.
              aria-label={waiting ? text.resend : undefined}
              aria-disabled={waiting || busy || undefined}
              aria-busy={busy || undefined}
              onClick={() => {
                if (!waiting && !busy) void request(true);
              }}
              className="w-full tabular-nums aria-disabled:cursor-default aria-disabled:bg-muted/50 aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted/50"
            >
              {busy ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : waiting ? <IconClock /> : <IconRefresh />}
              {busy ? text.resendSending : waiting ? fill(text.resendWait, { seconds: String(left) }) : text.resend}
            </Button>
            <div className="flex flex-col items-center gap-0.5 @xs:flex-row @xs:justify-center @xs:gap-x-1">
              <Button type="button" variant="ghost" size="sm" onClick={back} className="text-muted-foreground hover:text-foreground">
                {text.differentEmail}
              </Button>
              {onUsePassword ? (
                <>
                  <span aria-hidden="true" className="hidden text-muted-foreground @xs:inline">
                    ·
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={onUsePassword} className="text-muted-foreground hover:text-foreground">
                    {text.usePassword}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </>
      )}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
