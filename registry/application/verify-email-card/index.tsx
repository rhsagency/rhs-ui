"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { DEFAULT_MAIL_LINKS, mailLinksFor, type MailLink } from "@rhs-ui/application/verify-email-card/mail-links";
import { IconArrowUpRight, IconAtSign, IconCheck, IconClock, IconEdit, IconHourglass, IconInbox, IconMail } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { ResendButton } from "@rhs-ui/primitives/resend-button";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

export type { MailLink };

/** The words the card uses, for translation. `{email}`, `{duration}` and `{seconds}` are filled in. */
export interface VerifyEmailCardLabels {
  /** The heading. Default "Verify your email". */
  heading?: string;
  /** The line above the address in link mode. Default "We sent a verification link to". */
  sentLink?: string;
  /** The line above the address in code mode. Default "We sent a 6-digit code to". */
  sentCode?: string;
  /** How long the link works. Default "The link works for {duration}.". */
  expiresLink?: string;
  /** How long the code works. Default "The code and the link work for {duration}.". */
  expiresCode?: string;
  /** The unit for one hour. Default "hour". */
  hour?: string;
  /** The unit for other numbers of hours. Default "hours". */
  hours?: string;
  /** The button that turns the address into a field. Default "Change email". */
  change?: string;
  /** The label of that field. Default "New email address". */
  newEmail?: string;
  /** The button that sends to the new address. Default "Send to this address". */
  sendToNew?: string;
  /** Cancels the change. Default "Cancel". */
  cancel?: string;
  /** Under the field when the address is not one. Default "Enter a valid email address, like name@company.com.". */
  invalid?: string;
  /** Under the field when `onChangeEmail` threw instead of returning a message. Default "We could not send the email. Check your connection and try again.". */
  changeFailed?: string;
  /** Said when the new address was saved. Default "We sent a new verification email to {email}.". */
  changedSaid?: string;
  /** The label above the six boxes. Default "Enter the 6-digit code". */
  code?: string;
  /** The name of the group of boxes, for screen readers. Default "Verification code". */
  codeName?: string;
  /** The submit button in code mode. Default "Verify email". */
  verify?: string;
  /** Under the boxes when the code was wrong and `onVerify` gave no message. Default "That code is not right. Check the email and try again.". */
  wrongCode?: string;
  /** Under the boxes when `onVerify` threw. Default "We could not check the code just now. Try again in a moment.". */
  codeFailed?: string;
  /** The resend button at rest. Default "Resend email". */
  resend?: string;
  /** While the send is under way. Default "Sending…". */
  resendSending?: string;
  /** For a moment after a send worked. Default "Email sent". */
  resendSent?: string;
  /** While waiting; `{seconds}` is the time left, in tabular figures. Default "Resend email in {seconds}s". */
  resendWait?: string;
  /** Under the button when a send failed. Default "We could not send another email. Try again in a moment.". */
  resendFailed?: string;
  /** Said when the wait starts and at ten seconds. Default "You can ask for another email in {seconds} seconds.". */
  resendWaitSpoken?: string;
  /** Said when the wait is over. Default "You can ask for another email now.". */
  resendReadySpoken?: string;
  /** Read out after a mail shortcut's name. Default "opens in a new tab". */
  newTab?: string;
  /** The heading of the help list. Default "Didn't get it?". */
  helpHeading?: string;
  /** Default "Check your spam or promotions folder.". */
  helpSpam?: string;
  /** Default "Make sure {email} is spelled correctly.". */
  helpTypo?: string;
  /** Default "Give it a minute. It can take a little while to arrive.". */
  helpWait?: string;
  /** The heading once the address is verified. Default "Email verified". */
  verifiedHeading?: string;
  /** The line under it. Default "{email} is confirmed. You are all set.". */
  verifiedLine?: string;
  /** The button after it. Default "Continue". */
  continue?: string;
}

export interface VerifyEmailCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The address the email went to. It is shown in bold, and "Change email" turns it into a field. */
  email: string;
  /** `link` waits for the click in the email; `code` adds six boxes for the digits in it. Default `link`. */
  mode?: "link" | "code";
  /** Sends the email again. Return the promise: the button waits for it, and a rejection shows its message and does not restart the wait. */
  onResend: () => unknown;
  /**
   * Turns the address into a field and, on submit, sends the verification email to the new address. Return an error message
   * ("That address already has an account.") or nothing: once it resolves the card shows the new address and the wait starts
   * again. Leave it out and there is no Change email button.
   */
  onChangeEmail?: (address: string) => string | void | Promise<string | void>;
  /** Code mode: checks the six digits, on the last digit and on Verify. Return an error message, or nothing when the code was right. */
  onVerify?: (code: string) => string | void | Promise<string | void>;
  /** Seconds before another email can be asked for. The wait starts as the card appears, because the first email has just gone out. Default 30; 0 means no wait. */
  resendAfter?: number;
  /** How long the email works, in hours, as the card says it. Default 24. */
  expiresInHours?: number;
  /** The webmail shortcuts. One shows only when the address's domain belongs to it; `false` shows none. Default Gmail, Outlook and Yahoo Mail. */
  mailLinks?: readonly MailLink[] | false;
  /** Set it to true when your app notices the address was confirmed (it polls, or the link was opened in another tab): the card swaps to "Email verified". */
  verified?: boolean;
  /** Continue was pressed on the verified card. */
  onVerified?: () => void;
  /** Start with the address already turned into a field: for a preview, or a page that reopens mid-change. */
  defaultEditing?: boolean;
  /** Under the card's actions: "Wrong account? Sign out", a link to support. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: VerifyEmailCardLabels;
}

const DEFAULT_LABELS = {
  heading: "Verify your email",
  sentLink: "We sent a verification link to",
  sentCode: "We sent a 6-digit code to",
  expiresLink: "The link works for {duration}.",
  expiresCode: "The code and the link work for {duration}.",
  hour: "hour",
  hours: "hours",
  change: "Change email",
  newEmail: "New email address",
  sendToNew: "Send to this address",
  cancel: "Cancel",
  invalid: "Enter a valid email address, like name@company.com.",
  changeFailed: "We could not send the email. Check your connection and try again.",
  changedSaid: "We sent a new verification email to {email}.",
  code: "Enter the 6-digit code",
  codeName: "Verification code",
  verify: "Verify email",
  wrongCode: "That code is not right. Check the email and try again.",
  codeFailed: "We could not check the code just now. Try again in a moment.",
  resend: "Resend email",
  resendSending: "Sending…",
  resendSent: "Email sent",
  resendWait: "Resend email in {seconds}s",
  resendFailed: "We could not send another email. Try again in a moment.",
  resendWaitSpoken: "You can ask for another email in {seconds} seconds.",
  resendReadySpoken: "You can ask for another email now.",
  newTab: "opens in a new tab",
  helpHeading: "Didn't get it?",
  helpSpam: "Check your spam or promotions folder.",
  helpTypo: "Make sure {email} is spelled correctly.",
  helpWait: "Give it a minute. It can take a little while to arrive.",
  verifiedHeading: "Email verified",
  verifiedLine: "{email} is confirmed. You are all set.",
  continue: "Continue",
} satisfies Required<VerifyEmailCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CODE_LENGTH = 6;

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(address: string) {
  return (address.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [address]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/** A sentence with the address picked out in bold wherever `{email}` stands. */
function WithEmail({ template, email }: { template: string; email: string }) {
  const [before = "", after = ""] = template.split("{email}");
  return (
    <>
      {before}
      <strong className="font-medium text-foreground [overflow-wrap:anywhere]">{breakable(email)}</strong>
      {after}
    </>
  );
}

/**
 * The "check your inbox" step after sign-up, as a whole step rather than a
 * banner. An envelope tile, "Verify your email", the address in bold and how
 * long the link works; then the way on: a shortcut to the person's webmail
 * when the address is at Gmail, Outlook or Yahoo (a plain link, never for a
 * domain it does not know), a resend button that counts its wait down in
 * tabular figures instead of vanishing, and a short "Didn't get it?" list
 * for spam, typos and patience. "Change email" turns the address into a field
 * that sends the email to the new one and restarts the wait. In `code` mode
 * six boxes take the digits from the email and check them as the last one is
 * typed. The card never leaves a dead end: whatever fails says so in words and
 * keeps what was typed.
 */
export function VerifyEmailCard({
  email,
  mode = "link",
  onResend,
  onChangeEmail,
  onVerify,
  resendAfter = 30,
  expiresInHours = 24,
  mailLinks,
  verified = false,
  onVerified,
  defaultEditing = false,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: VerifyEmailCardProps) {
  const text: Required<VerifyEmailCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const draftField = useRef<HTMLInputElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const codeBoxes = useRef<HTMLDivElement>(null);
  const working = useRef(false);
  const moved = useRef(false);

  // The address on show follows the prop; "Change email" moves it on until the prop says otherwise.
  const [sourceEmail, setSourceEmail] = useState(email);
  const [address, setAddress] = useState(email);
  if (email !== sourceEmail) {
    setSourceEmail(email);
    setAddress(email);
  }

  const [editing, setEditing] = useState(defaultEditing);
  const [draft, setDraft] = useState(email);
  const [draftError, setDraftError] = useState("");
  const [changing, setChanging] = useState(false);
  const [resendRun, setResendRun] = useState(0);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "wrong" | "failed" | "done">("idle");
  const [codeProblem, setCodeProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const isVerified = verified || status === "done";
  const shortcuts = mailLinks === false ? [] : mailLinksFor(address, mailLinks ?? DEFAULT_MAIL_LINKS);
  const duration = `${expiresInHours} ${expiresInHours === 1 ? text.hour : text.hours}`;

  // Focus follows the swap, but never on the first paint: the new field when "Change email" opens, the button it came from when it closes.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    (editing ? draftField.current : changeButton.current)?.focus();
  }, [editing]);

  // The card is replaced when the address is verified, by a right code or by the app saying so, so the confirmation's heading takes the focus and is read out.
  const wasVerified = useRef(isVerified);
  useEffect(() => {
    if (isVerified && !wasVerified.current) heading.current?.focus();
    wasVerified.current = isVerified;
  }, [isVerified]);

  // After a wrong code the boxes are enabled again and emptied, and the first one is ready for the next try.
  useEffect(() => {
    if (status === "wrong" || status === "failed") codeBoxes.current?.querySelector("input")?.focus();
  }, [status]);

  function startEditing() {
    setDraft(address);
    setDraftError("");
    moved.current = true;
    setEditing(true);
  }

  function stopEditing() {
    setDraftError("");
    moved.current = true;
    setEditing(false);
  }

  async function changeEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current) return;
    const next = draft.trim();
    if (!EMAIL.test(next)) {
      setDraftError(text.invalid);
      draftField.current?.focus();
      return;
    }
    // The same address again is not a change: the resend button is the way to send it once more.
    if (next.toLowerCase() === address.toLowerCase()) {
      stopEditing();
      return;
    }
    working.current = true;
    setChanging(true);
    setDraftError("");
    try {
      const result = await onChangeEmail?.(next);
      if (typeof result === "string" && result) {
        setDraftError(result);
        draftField.current?.focus();
        return;
      }
      setAddress(next);
      setResendRun((run) => run + 1);
      setCode("");
      setStatus("idle");
      setCodeProblem("");
      say(fill(text.changedSaid, { email: next }));
      stopEditing();
    } catch {
      setDraftError(text.changeFailed);
    } finally {
      working.current = false;
      setChanging(false);
    }
  }

  async function verify(digits: string) {
    if (digits.length < CODE_LENGTH || working.current || !onVerify) return;
    working.current = true;
    setStatus("verifying");
    setCodeProblem("");
    try {
      const result = await onVerify(digits);
      if (typeof result === "string" && result) {
        setCodeProblem(result);
        setCode("");
        setStatus("wrong");
        return;
      }
      setStatus("done");
    } catch {
      setCodeProblem(text.codeFailed);
      setCode("");
      setStatus("failed");
    } finally {
      working.current = false;
    }
  }

  const shell = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";
  const titleClass = "text-xl leading-tight font-semibold tracking-[-0.03em] text-balance outline-none";

  if (isVerified) {
    return (
      <div data-slot="verify-email-card" data-step="verified" className={cn(shell, className)} {...props}>
        <div className="grid justify-items-start gap-4">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-5" />
          </span>
          <div className="grid gap-1.5">
            <Title ref={heading} tabIndex={-1} className={titleClass}>
              {text.verifiedHeading}
            </Title>
            <p role="status" className="text-sm leading-relaxed text-muted-foreground">
              <WithEmail template={text.verifiedLine} email={address} />
            </p>
          </div>
        </div>
        {onVerified ? (
          <Button type="button" size="lg" onClick={onVerified} className="w-full">
            {text.continue}
          </Button>
        ) : null}
        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    );
  }

  const codeMode = mode === "code";
  const verifying = status === "verifying";
  const resend = (
    <ResendButton
      key={resendRun}
      startCooling={resendAfter > 0}
      cooldown={Math.max(resendAfter, 1)}
      onResend={onResend}
      variant="outline"
      size="lg"
      labels={{
        ready: text.resend,
        sending: text.resendSending,
        sent: text.resendSent,
        wait: text.resendWait,
        error: text.resendFailed,
        waitSpoken: text.resendWaitSpoken,
        readySpoken: text.resendReadySpoken,
      }}
      className="w-full [&>[data-slot=button]]:w-full"
    />
  );

  return (
    <div data-slot="verify-email-card" data-step={codeMode ? "code" : "link"} data-editing={editing || undefined} className={cn(shell, className)} {...props}>
      <div className="grid gap-4">
        <span aria-hidden="true" className="relative grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground">
          <IconMail className="size-5" />
          {/* An unread dot, not a check: the email is waiting, and nothing has been verified yet. */}
          <span className="absolute top-0 right-0 size-3 rounded-full bg-primary ring-2 ring-card" />
        </span>
        <div className="grid gap-3">
          <Title className={titleClass}>{text.heading}</Title>
          {editing ? (
            <form noValidate aria-busy={changing || undefined} onSubmit={(event) => void changeEmail(event)} className="grid gap-3.5">
              <FormField error={draftError}>
                <FormLabel>{text.newEmail}</FormLabel>
                <FormControl>
                  <Input
                    ref={draftField}
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={draft}
                    // Read-only, not disabled, while the request runs: a disabled field drops the focus, and it would not come back after a failure.
                    readOnly={changing}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (draftError) setDraftError("");
                    }}
                    className="h-10"
                  />
                </FormControl>
              </FormField>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" loading={changing}>
                  {text.sendToNew}
                </Button>
                <Button type="button" variant="ghost" disabled={changing} onClick={stopEditing}>
                  {text.cancel}
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-2">
                <p className="text-sm leading-relaxed text-muted-foreground">{codeMode ? text.sentCode : text.sentLink}</p>
                {/* The address has a row of its own: no sentence around it can break it in the middle of a word, and Change email sits beside it. */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/60 py-1 pr-1 pl-3.5">
                  <strong className="min-w-0 py-1.5 text-[0.9375rem] font-medium text-foreground [overflow-wrap:anywhere]">{breakable(address)}</strong>
                  {onChangeEmail ? (
                    <Button ref={changeButton} type="button" variant="ghost" size="sm" onClick={startEditing} className="-ml-2.5 shrink-0 text-muted-foreground hover:bg-background hover:text-foreground">
                      <IconEdit />
                      {text.change}
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="flex items-center gap-2 text-[0.8125rem] leading-snug text-muted-foreground">
                <IconClock aria-hidden="true" className="size-4 shrink-0" />
                {fill(codeMode ? text.expiresCode : text.expiresLink, { duration })}
              </p>
            </>
          )}
        </div>
      </div>

      {codeMode && !editing ? (
        <form
          noValidate
          aria-busy={verifying || undefined}
          onSubmit={(event) => {
            event.preventDefault();
            void verify(code);
          }}
          className="grid gap-4"
        >
          <div ref={codeBoxes} className="grid gap-2.5">
            <p className="text-sm leading-none font-medium">{text.code}</p>
            <OtpInput
              label={text.codeName}
              length={CODE_LENGTH}
              groupAfter={3}
              value={code}
              onValueChange={(digits) => {
                setCode(digits);
                if (status === "wrong" || status === "failed") {
                  setStatus("idle");
                  setCodeProblem("");
                }
              }}
              onComplete={(digits) => void verify(digits)}
              invalid={status === "wrong" || status === "failed"}
              disabled={verifying}
            />
            <p role="alert" className="text-sm leading-snug text-destructive empty:hidden">
              {codeProblem || (status === "wrong" ? text.wrongCode : "")}
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            loading={verifying}
            disabled={code.length < CODE_LENGTH}
            // Waiting for six digits is not an error: it is quiet rather than faded out, and keeps its words readable. Verifying is busy, not waiting, so it keeps the solid look.
            className={cn("w-full", !verifying && "disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100")}
          >
            {text.verify}
          </Button>
        </form>
      ) : null}

      {/* While the address is a field nothing else offers to send. The actions are hidden, not removed: the resend button's wait keeps running, so Cancel never gives anyone a fresh 30 seconds. */}
      <div className={cn("grid gap-2.5", editing && "hidden")}>
        {shortcuts.map((link, index) => (
          <Button key={link.id} asChild size="lg" variant={!codeMode && index === 0 ? "default" : "outline"} className="w-full">
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
              <IconArrowUpRight />
              <span className="sr-only">({text.newTab})</span>
            </a>
          </Button>
        ))}
        {resend}
      </div>

      <Separator />

      <div role="group" aria-labelledby={`${id}-help`} className="grid gap-3">
        <p id={`${id}-help`} className="text-sm leading-none font-medium">
          {text.helpHeading}
        </p>
        <ul className="grid gap-2.5 text-[0.8125rem] leading-snug text-muted-foreground">
          <li className="flex items-start gap-2.5">
            <IconInbox aria-hidden="true" className="mt-px size-4 shrink-0" />
            {text.helpSpam}
          </li>
          <li className="flex items-start gap-2.5">
            <IconAtSign aria-hidden="true" className="mt-px size-4 shrink-0" />
            <span>
              <WithEmail template={text.helpTypo} email={address} />
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <IconHourglass aria-hidden="true" className="mt-px size-4 shrink-0" />
            {text.helpWait}
          </li>
        </ul>
      </div>

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
