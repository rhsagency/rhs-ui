"use client";

import { useEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconInfo, IconRefresh, IconSmartphone } from "@rhs-ui/icons";
import { formatPhone, phoneProblem, type PhoneProblem } from "@rhs-ui/application/phone-sign-in/phone";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { PHONE_COUNTRIES, PhoneInput, type PhoneCountry } from "@rhs-ui/primitives/phone-input";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. `{phone}`, `{length}`, `{seconds}`, `{name}`, `{dial}`, `{digits}`, `{example}`, `{min}` and `{max}` are filled in. */
export interface PhoneSignInLabels {
  /** The first step's heading. Default "Sign in with your phone". */
  heading?: string;
  /** The line under it. Default "We will text you a code that signs you in. There is no password to remember.". */
  description?: string;
  /** The number field's label. Default "Phone number". */
  phone?: string;
  /** The button that asks for the text. Default "Text me a code". */
  send?: string;
  /** The same button while the text is on its way. Default "Sending the code". */
  sending?: string;
  /** Under the field when it is empty. Default "Enter your phone number.". */
  missing?: string;
  /** Under the field when a number is not right and its country's format is known. Default "Enter a {name} number: {digits} digits after +{dial}, like {example}.". */
  invalidKnown?: string;
  /** The same for any other country. Default "Enter the number without the country code, {min} to {max} digits.". */
  invalidGeneric?: string;
  /** Above the field when asking for the text failed. Default "We could not send the text. Check the number and your connection, then try again.". */
  failed?: string;
  /** Above the buttons when asking for another failed. Default "We could not send another text. Try again in a moment.". */
  failedAgain?: string;
  /** The second step's heading. Default "Enter your code". */
  codeHeading?: string;
  /** The line before the number. Default "We texted a {length}-digit code to". */
  codeDescription?: string;
  /** The button beside the number. Default "Change number". */
  change?: string;
  /** The name of the group of boxes. Default "Verification code". */
  code?: string;
  /** Shown while the code is checked. Default "Checking the code". */
  checking?: string;
  /** Under the boxes when the code was wrong. Default "That code is not right. Check the message and try again.". */
  wrong?: string;
  /** The same when `onVerify` threw. Default "We could not check the code. Check your connection and try again.". */
  verifyFailed?: string;
  /** The resend button at rest. Default "Resend code". */
  resend?: string;
  /** The resend button while it waits, in tabular figures. Default "Resend code in {seconds}s". */
  resendWait?: string;
  /** The resend button while it sends. Default "Sending…". */
  resendSending?: string;
  /** The link to email. Default "Use email instead". */
  useEmail?: string;
  /** Said when a text went out. Default "We texted a code to {phone}. You can ask for another in {seconds} seconds.". */
  sentSaid?: string;
  /** Said when another text went out. Default "Code sent again to {phone}. You can ask for another in {seconds} seconds.". */
  sentAgainSaid?: string;
  /** Said when the wait is over. Default "You can ask for another code now.". */
  readySaid?: string;
  /** The heading once the code was right. Default "Number verified". */
  verifiedHeading?: string;
  /** The line under it. Default "Signing you in.". */
  verifiedLine?: string;
  /** Said once the code was right. Default "Number verified. Signing you in.". */
  verifiedSaid?: string;
}

export interface PhoneSignInProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSubmit"> {
  /**
   * Asks your server to text a code to the number. It receives the number with its dialling code, "+31612345678". Resolve whether or not the
   * number has an account, so the card never shows which numbers are registered; reject only when the request itself failed, and the card
   * keeps the number and shows one retry message.
   */
  onRequestCode: (phone: string) => void | Promise<void>;
  /** Checks the code. Resolve true when it was right (this is where you sign in and navigate) and false when it was not: the boxes are then cleared, the message is announced and the first box has the focus again. A throw shows a general message. */
  onVerify: (code: string) => boolean | Promise<boolean>;
  /** The country the field starts with, as its ISO code: "NL". Default "NL". */
  defaultCountry?: string;
  /** The countries the list offers. Default the eight of the phone field. */
  countries?: readonly PhoneCountry[];
  /** How long, in seconds, before another text can be asked for. Default 30. */
  resendAfter?: number;
  /** How many digits the code has, and so how many boxes. Default 6. */
  codeLength?: number;
  /** The person wants email instead. Leave it out for no such button. */
  onUseEmail?: () => void;
  /** The line about costs under the first button: "Message and data rates may apply.". Leave it out for no notice. */
  smsNotice?: ReactNode;
  /** The number the field starts with, in the international form: "+31612345678". */
  defaultPhone?: string;
  /** Start on the code step, with the wait already running: for a preview, or a page reloaded after the text was sent. Needs `defaultPhone`. */
  defaultSent?: boolean;
  /** Start with this message under the number, as it stands after a number that cannot be right: for a preview. Typing a good number clears it. */
  defaultError?: string;
  /** Start the code step with this message under the boxes, as it stands after a wrong code: for a preview. Typing clears it. */
  defaultCodeError?: string;
  /** Under the card's actions: terms, a link to create an account. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: PhoneSignInLabels;
}

const DEFAULT_LABELS = {
  heading: "Sign in with your phone",
  description: "We will text you a code that signs you in. There is no password to remember.",
  phone: "Phone number",
  send: "Text me a code",
  sending: "Sending the code",
  missing: "Enter your phone number.",
  invalidKnown: "Enter a {name} number: {digits} digits after +{dial}, like {example}.",
  invalidGeneric: "Enter the number without the country code, {min} to {max} digits.",
  failed: "We could not send the text. Check the number and your connection, then try again.",
  failedAgain: "We could not send another text. Try again in a moment.",
  codeHeading: "Enter your code",
  codeDescription: "We texted a {length}-digit code to",
  change: "Change number",
  code: "Verification code",
  checking: "Checking the code",
  wrong: "That code is not right. Check the message and try again.",
  verifyFailed: "We could not check the code. Check your connection and try again.",
  resend: "Resend code",
  resendWait: "Resend code in {seconds}s",
  resendSending: "Sending…",
  useEmail: "Use email instead",
  sentSaid: "We texted a code to {phone}. You can ask for another in {seconds} seconds.",
  sentAgainSaid: "Code sent again to {phone}. You can ask for another in {seconds} seconds.",
  readySaid: "You can ask for another code now.",
  verifiedHeading: "Number verified",
  verifiedLine: "Signing you in.",
  verifiedSaid: "Number verified. Signing you in.",
} satisfies Required<PhoneSignInLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * Passwordless sign-in for markets where the phone number is the identity,
 * in two steps that swap in place. The first is one field with a searchable
 * list of countries for the dialling code and one button, "Text me a code";
 * a number that cannot be right is caught as soon as the field is left, with
 * the shape it should have in words ("Enter a Dutch number: 9 digits after +31,
 * like 6 12 34 56 78"), and the number reaches your code in the international
 * form. The second shows the number the text went to with "Change number"
 * beside it, and six boxes: the first asks the phone to offer the code from
 * the message, pasting fills them all, and the last digit checks the code by
 * itself. A wrong code is announced once and the boxes are cleared with the
 * focus on the first, so the next try is just typing. "Resend code" counts
 * down in tabular figures and speaks only when the wait starts and when it
 * ends, with the clock taken from timestamps so it is right after the tab
 * sleeps. An optional line says that message rates may apply.
 */
export function PhoneSignIn({
  onRequestCode,
  onVerify,
  defaultCountry = "NL",
  countries = PHONE_COUNTRIES,
  resendAfter = 30,
  codeLength = 6,
  onUseEmail,
  smsNotice,
  defaultPhone = "",
  defaultSent = false,
  defaultError,
  defaultCodeError,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: PhoneSignInProps) {
  const text: Required<PhoneSignInLabels> = { ...DEFAULT_LABELS, ...labels };
  const phoneField = useRef<HTMLDivElement>(null);
  const boxes = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const working = useRef(false);
  const moved = useRef(false);
  const refocus = useRef(false);
  const endsAt = useRef(0);
  const [step, setStep] = useState<"number" | "code" | "verified">(defaultSent && defaultPhone ? "code" : "number");
  const [phone, setPhone] = useState(defaultPhone);
  const [invalid, setInvalid] = useState(defaultError ?? "");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [problem, setProblem] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(defaultCodeError ?? "");
  const [waiting, setWaiting] = useState(defaultSent && Boolean(defaultPhone));
  const [left, setLeft] = useState(resendAfter);
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const shown = formatPhone(phone, countries);

  const focusFirstBox = () => boxes.current?.querySelector("input")?.focus();
  const focusNumber = () => phoneField.current?.querySelector("input")?.focus();

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

  // Focus follows the swap, but never on the first paint: the first box on the way in (the person types next), the number on the way back.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    if (step === "code") focusFirstBox();
    else if (step === "number") focusNumber();
    else heading.current?.focus();
  }, [step]);

  // A wrong code clears the boxes, but they are disabled while the code is checked, and a disabled box cannot take the focus; so it waits for them.
  useEffect(() => {
    if (verifying || !refocus.current) return;
    refocus.current = false;
    focusFirstBox();
  }, [verifying]);

  function describe(found: PhoneProblem | null): string {
    if (!found) return "";
    if (found.kind === "empty") return text.missing;
    if (found.kind === "known") return fill(text.invalidKnown, { name: found.name, dial: found.dial, digits: found.digits, example: found.example });
    return fill(text.invalidGeneric, { min: String(found.min), max: String(found.max) });
  }

  function check(value: string): boolean {
    const message = describe(phoneProblem(value, countries));
    setInvalid(message);
    return message === "";
  }

  async function request(again: boolean) {
    if (working.current) return;
    if (!again && !check(phone)) {
      focusNumber();
      return;
    }
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      await onRequestCode(phone);
      endsAt.current = Date.now() + resendAfter * 1000;
      setLeft(resendAfter);
      setWaiting(true);
      say(fill(again ? text.sentAgainSaid : text.sentSaid, { phone: shown, seconds: String(resendAfter) }));
      setCode("");
      setCodeError("");
      if (!again) {
        moved.current = true;
        setStep("code");
      } else {
        focusFirstBox();
      }
    } catch {
      setProblem(again ? text.failedAgain : text.failed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function verify(entered: string) {
    if (working.current) return;
    working.current = true;
    setVerifying(true);
    setCodeError("");
    try {
      if (await onVerify(entered)) {
        moved.current = true;
        setStep("verified");
        say(text.verifiedSaid);
      } else {
        setCode("");
        setCodeError(text.wrong);
        refocus.current = true;
      }
    } catch {
      setCode("");
      setCodeError(text.verifyFailed);
      refocus.current = true;
    } finally {
      working.current = false;
      setVerifying(false);
    }
  }

  function back() {
    moved.current = true;
    setProblem("");
    setCode("");
    setCodeError("");
    // The wait belongs to the step that is left: stop the clock and clear what was said ("We texted a code to...", and later "You can ask for
    // another code now."), so nothing is read out about a step the person is no longer on. Asking for a new code starts a new wait.
    setWaiting(false);
    endsAt.current = 0;
    say("");
    setStep("number");
  }

  const shell = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";
  const titleClass = "text-xl leading-tight font-semibold tracking-[-0.03em] text-balance outline-none";
  const mark = (icon: ReactNode) => (
    <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-5">
      {icon}
    </span>
  );

  if (step === "verified") {
    return (
      <div data-slot="phone-sign-in" data-step="verified" className={cn(shell, className)} {...props}>
        <div className="grid justify-items-start gap-4">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-5" />
          </span>
          <div className="grid gap-1.5">
            <Title ref={heading} tabIndex={-1} className={titleClass}>
              {text.verifiedHeading}
            </Title>
            <p className="flex items-center gap-2 text-sm leading-relaxed text-muted-foreground">
              <Spinner size={14} label="" role="presentation" aria-hidden="true" />
              {text.verifiedLine}
            </p>
          </div>
        </div>
        <span role="status" className="sr-only">
          <span key={said.id}>{said.text}</span>
        </span>
      </div>
    );
  }

  return (
    <div data-slot="phone-sign-in" data-step={step} className={cn(shell, className)} {...props}>
      {step === "number" ? (
        <>
          <div className="grid justify-items-start gap-4">
            {mark(<IconSmartphone />)}
            <div className="grid gap-1.5">
              <Title className={titleClass}>{text.heading}</Title>
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{text.description}</p>
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
              <FormLabel>{text.phone}</FormLabel>
              <div ref={phoneField}>
                <FormControl>
                  <PhoneInput
                    countries={countries}
                    defaultCountry={defaultCountry}
                    value={phone}
                    onValueChange={(next) => {
                      setPhone(next);
                      if (invalid && phoneProblem(next, countries) === null) setInvalid("");
                    }}
                    onBlur={(event) => {
                      // Moving to the country button is still the same field: the number is judged when the whole field is left.
                      if (event.relatedTarget instanceof Node && phoneField.current?.contains(event.relatedTarget)) return;
                      if (phone) check(phone);
                    }}
                    // The country button joins the field when the number is wrong, so the whole box reads as one thing that needs fixing. The input has no width of its own, so on a 320px phone it shrinks instead of pushing the card wider.
                    className="[&_input]:h-11 [&_input]:w-0 [&_input]:text-[0.9375rem] [&_button]:h-11 has-[input[aria-invalid=true]]:[&>button]:border-destructive"
                  />
                </FormControl>
              </div>
            </FormField>

            <div className="grid gap-3">
              <Button type="submit" size="lg" loading={busy} className="w-full">
                {busy ? text.sending : text.send}
              </Button>
              {smsNotice ? (
                <p className="flex items-start justify-center gap-2 text-center text-[0.8125rem] leading-snug text-muted-foreground">
                  <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                  <span>{smsNotice}</span>
                </p>
              ) : null}
            </div>
          </form>

          {onUseEmail ? (
            <Button type="button" variant="ghost" onClick={onUseEmail} className="-mt-2 w-full text-muted-foreground hover:text-foreground">
              {text.useEmail}
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <div className="grid justify-items-start gap-4">
            {mark(<IconSmartphone />)}
            <div className="grid gap-2">
              <Title className={titleClass}>{text.codeHeading}</Title>
              <div className="grid gap-1.5">
                <p className="text-sm leading-relaxed text-muted-foreground">{fill(text.codeDescription, { length: String(codeLength) })}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong className="text-base font-medium tracking-[-0.01em] tabular-nums">{shown}</strong>
                  <Button type="button" variant="ghost" size="sm" onClick={back} className="-ml-2 h-7 px-2 text-muted-foreground hover:text-foreground">
                    {text.change}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div ref={boxes} aria-busy={verifying || undefined} className="grid gap-3">
              <OtpInput length={codeLength} value={code} onValueChange={(next) => {
                  setCode(next);
                  if (codeError) setCodeError("");
                }}
                onComplete={(entered) => void verify(entered)} label={text.code} name="code" invalid={codeError !== ""} disabled={verifying} />
              <div role="alert" className="empty:hidden">
                {codeError ? (
                  <p className={cn("flex items-start gap-2 text-[0.8125rem] leading-snug font-medium", DANGER_TEXT)}>
                    <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
                    {codeError}
                  </p>
                ) : null}
              </div>
              {verifying ? (
                <p className="flex items-center gap-2 text-[0.8125rem] leading-snug text-muted-foreground">
                  <Spinner size={14} label="" role="presentation" aria-hidden="true" />
                  {text.checking}
                </p>
              ) : null}
            </div>

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
                // While it waits the name stays "Resend code": the seconds are for the eye, and a name that changed every second would be read out again by a screen reader that stays on the button.
                aria-label={waiting ? text.resend : undefined}
                aria-disabled={waiting || busy || verifying || undefined}
                aria-busy={busy || undefined}
                onClick={() => {
                  if (!waiting && !busy && !verifying) void request(true);
                }}
                className="w-full tabular-nums aria-disabled:cursor-default aria-disabled:bg-muted/50 aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted/50"
              >
                {busy ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : waiting ? <IconClock /> : <IconRefresh />}
                {/* While it waits, the countdown is drawn by CSS: the name stays the resend words (the aria-label above), and words in the button that the name lacks fail label-in-name (WCAG 2.5.3). */}
                {busy ? text.resendSending : waiting ? <span data-label={fill(text.resendWait, { seconds: String(left) })} className="before:content-[attr(data-label)]" /> : text.resend}
              </Button>
              {onUseEmail ? (
                <Button type="button" variant="ghost" size="sm" onClick={onUseEmail} className="justify-self-center text-muted-foreground hover:text-foreground">
                  {text.useEmail}
                </Button>
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
