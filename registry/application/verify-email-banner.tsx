"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconCheck, IconClock, IconEdit, IconMail, IconRefresh, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** The words the banner uses, for translation. `{email}` and `{seconds}` are filled in. */
export interface VerifyEmailBannerLabels {
  /** The sentence, with the address in bold; your `reason` follows it. Default "Verify {email}". */
  message?: string;
  /** The line under it. Default "We sent a link to your inbox. It can take a minute to arrive.". */
  hint?: string;
  /** The button at rest. Default "Resend email". */
  resend?: string;
  /** While the send is under way. Default "Sending…". */
  sending?: string;
  /** For a moment after a send worked. Default "Email sent". */
  sent?: string;
  /** While waiting; `{seconds}` is the time left. Default "Resend in {seconds}s". */
  wait?: string;
  /** The button that turns the address into a field. Default "Change address". */
  change?: string;
  /** The label of that field. Default "New email address". */
  newEmail?: string;
  /** Sends to the new address. Default "Send link". */
  sendToNew?: string;
  /** Cancels the change. Default "Cancel". */
  cancel?: string;
  /** Under the field when the address is not one. Default "Enter a valid email address, like name@company.com.". */
  invalid?: string;
  /** Under the field when `onChangeEmail` threw instead of returning a message. Default "We could not send the email. Check your connection and try again.". */
  changeFailed?: string;
  /** Under the buttons when a resend failed and the error has no message of its own. Default "We could not send the email. Try again in a moment.". */
  failed?: string;
  /** Said when a send worked. Default "Email sent. You can ask for another in {seconds} seconds.". */
  sentSpoken?: string;
  /** Said when the wait is over. Default "You can resend the email now.". */
  readySpoken?: string;
  /** Said when the address was changed. Default "We sent a new verification email to {email}.". */
  changedSpoken?: string;
  /** The heading of the short confirmation. Default "Email verified". */
  verifiedTitle?: string;
  /** Under it. Default "{email} is confirmed.". */
  verifiedBody?: string;
  /** The name of the banner for a screen reader; `{email}` is the address, so two banners on a page keep different names. Default "Verify {email}". */
  region?: string;
}

export interface VerifyEmailBannerProps extends Omit<ComponentProps<"div">, "children"> {
  /** The address that needs verifying. It is shown in bold, and "Change address" turns it into a field. */
  email: string;
  /** What verifying unlocks, as the end of the sentence: "to start sending invites". It follows the address. Leave it out for the bare "Verify jane@acme.com". */
  reason?: string;
  /** Set it to true when your app knows the address is confirmed (it polls, or the link was opened in another tab). The banner swaps to a short "Email verified" confirmation and then folds away. If it is true on first render, nothing is drawn. */
  verified?: boolean;
  /** Sends the verification email again. Return the promise: the button waits for it, a rejection shows its message in words and does not start the wait. */
  onResend: () => unknown;
  /**
   * Turns the address into a field and, on submit, sends the verification email to the new address. Return an error message
   * ("That address already has an account.") or nothing: once it resolves the banner shows the new address and the wait starts
   * again. Leave it out and there is no Change address button.
   */
  onChangeEmail?: (address: string) => string | void | Promise<string | void>;
  /** Seconds before another email can be asked for, counted from a send. It is kept in sessionStorage, so a reload does not reset it. Default 60; 0 means no wait. */
  cooldownSeconds?: number;
  /** Where the end of the wait is kept in sessionStorage. Default one key for the page; give each banner its own if there are several. */
  storageKey?: string;
  /** The words the banner uses, for translation. */
  labels?: VerifyEmailBannerLabels;
}

const DEFAULT_LABELS = {
  message: "Verify {email}",
  hint: "We sent a link to your inbox. It can take a minute to arrive.",
  resend: "Resend email",
  sending: "Sending…",
  sent: "Email sent",
  wait: "Resend in {seconds}s",
  change: "Change address",
  newEmail: "New email address",
  sendToNew: "Send link",
  cancel: "Cancel",
  invalid: "Enter a valid email address, like name@company.com.",
  changeFailed: "We could not send the email. Check your connection and try again.",
  failed: "We could not send the email. Try again in a moment.",
  sentSpoken: "Email sent. You can ask for another in {seconds} seconds.",
  readySpoken: "You can resend the email now.",
  changedSpoken: "We sent a new verification email to {email}.",
  verifiedTitle: "Email verified",
  verifiedBody: "{email} is confirmed.",
  region: "Verify {email}",
} satisfies Required<VerifyEmailBannerLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** How long "Email verified" stays before the banner folds away, in ms. */
const VERIFIED_MS = 2600;
/** How long the banner takes to fold away, in ms: the length of its transition. */
const LEAVE_MS = 240;
/** How long "Email sent" shows on the button before the countdown takes over, in ms. */
const SENT_MS = 1800;

const WAIT_KEY = "rhs-ui-verify-email-until";

function readUntil(key: string): number {
  try {
    return Number(window.sessionStorage.getItem(key)) || 0;
  } catch {
    // Storage can be blocked: the wait then starts again on a reload, which is the safe way to be wrong.
    return 0;
  }
}

function writeUntil(key: string, until: number | null): void {
  try {
    if (until === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, String(until));
  } catch {
    // Nothing to remember it with: the wait is not kept across a reload.
  }
}

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(address: string) {
  return (address.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [address]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/** A sentence with the address picked out wherever `{email}` stands. */
function WithEmail({ template, email, className }: { template: string; email: string; className?: string }) {
  const [before = "", ...rest] = template.split("{email}");
  if (!rest.length) return <>{before}</>;
  return (
    <>
      {before}
      <strong className={cn("font-semibold [overflow-wrap:anywhere]", className)}>{breakable(email)}</strong>
      {rest.join("{email}")}
    </>
  );
}

const VIEWS = ["ready", "sending", "sent", "waiting"] as const;

/**
 * A banner for an account whose email address is not verified yet. It says
 * what to do and why ("Verify jane@acme.com to start sending invites"),
 * resends the email, and lets people fix a typo in the address without leaving
 * the page. After a send the button counts down ("Resend in 42s") in tabular
 * figures, and the end of that wait is kept in sessionStorage, so refreshing
 * the page does not hand out a fresh minute. A send is confirmed by a polite
 * status ("Email sent") and a failure is written under the buttons in words,
 * without starting the wait. Change address turns the sentence into a field;
 * the new address gets its own email and its own wait. When `verified` turns
 * true the banner swaps to a short "Email verified" and folds away by itself.
 * The countdown is worked out from timestamps and is spoken only when it starts
 * and ends, so a screen reader is not told the time every second.
 */
export function VerifyEmailBanner({
  email,
  reason,
  verified = false,
  onResend,
  onChangeEmail,
  cooldownSeconds = 60,
  storageKey = WAIT_KEY,
  labels,
  className,
  ...props
}: VerifyEmailBannerProps) {
  const text: Required<VerifyEmailBannerLabels> = { ...DEFAULT_LABELS, ...labels };
  const draftField = useRef<HTMLInputElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const working = useRef(false);
  const moved = useRef(false);
  const sentTimer = useRef<number | undefined>(undefined);

  // The address on show follows the prop; "Change address" moves it on until the prop says otherwise.
  const [sourceEmail, setSourceEmail] = useState(email);
  const [address, setAddress] = useState(email);
  if (email !== sourceEmail) {
    setSourceEmail(email);
    setAddress(email);
  }

  // The banner's own life: open, the short confirmation, folding away, gone. It starts gone for an address that is already verified.
  const [phase, setPhase] = useState<"open" | "verified" | "leaving" | "gone">(verified ? "gone" : "open");
  const [seen, setSeen] = useState(verified);
  if (verified !== seen) {
    setSeen(verified);
    setPhase(verified ? "verified" : "open");
  }

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(email);
  const [draftError, setDraftError] = useState("");
  const [changing, setChanging] = useState(false);

  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });
  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  const left = until > 0 ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  const waiting = left > 0;
  const view: (typeof VIEWS)[number] = sending ? "sending" : justSent ? "sent" : waiting ? "waiting" : "ready";
  const blocked = view !== "ready";

  const latest = useRef(text);
  useEffect(() => {
    latest.current = text;
  });
  useEffect(() => () => window.clearTimeout(sentTimer.current), []);

  // A wait that was running before a reload is picked up again where it was.
  useEffect(() => {
    const stored = readUntil(storageKey);
    if (stored > Date.now()) {
      setNow(Date.now());
      setUntil(stored);
    }
  }, [storageKey]);

  // The clock is the timestamp, not a count of ticks: a tab in the background runs the timer slowly, and the next tick still tells the truth.
  useEffect(() => {
    if (until <= 0) return;
    const tick = () => {
      const at = Date.now();
      setNow(at);
      if (at >= until) {
        setUntil(0);
        writeUntil(storageKey, null);
        say(latest.current.readySpoken);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [until, storageKey]);

  // Focus follows the swap, but never on the first paint: the new field when "Change address" opens, the button it came from when it closes.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    (editing ? draftField.current : changeButton.current)?.focus();
  }, [editing]);

  // The confirmation is said once, stays long enough to be read, and then the banner folds away.
  useEffect(() => {
    if (phase === "verified") {
      writeUntil(storageKey, null);
      say(fill(latest.current.verifiedTitle, {}));
      const timer = window.setTimeout(() => setPhase("leaving"), VERIFIED_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase === "leaving") {
      const timer = window.setTimeout(() => setPhase("gone"), LEAVE_MS);
      return () => window.clearTimeout(timer);
    }
  }, [phase, storageKey]);

  /** A send has gone out: the wait starts, and is written down so a reload keeps it. */
  function startWaiting() {
    if (cooldownSeconds <= 0) {
      say(latest.current.sent);
      return;
    }
    const end = Date.now() + cooldownSeconds * 1000;
    writeUntil(storageKey, end);
    setNow(Date.now());
    setUntil(end);
    say(fill(latest.current.sentSpoken, { seconds: String(cooldownSeconds) }));
  }

  async function resend() {
    if (blocked) return;
    setProblem("");
    setSending(true);
    try {
      await onResend();
    } catch (error) {
      setSending(false);
      setProblem(error instanceof Error && error.message ? error.message : text.failed);
      return;
    }
    setSending(false);
    setJustSent(true);
    window.clearTimeout(sentTimer.current);
    sentTimer.current = window.setTimeout(() => setJustSent(false), SENT_MS);
    startWaiting();
  }

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
    // The same address again is not a change: Resend email is the way to send it once more.
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
      setProblem("");
      startWaiting();
      say(fill(text.changedSpoken, { email: next }));
      stopEditing();
    } catch {
      setDraftError(text.changeFailed);
    } finally {
      working.current = false;
      setChanging(false);
    }
  }

  if (phase === "gone") return null;

  const done = phase !== "open";
  const contents: Record<(typeof VIEWS)[number], ReactNode> = {
    ready: (
      <>
        <IconRefresh /> {text.resend}
      </>
    ),
    sending: (
      <>
        <IconSpinner /> {text.sending}
      </>
    ),
    sent: (
      <>
        <IconCheck /> {text.sent}
      </>
    ),
    waiting: (
      <>
        <IconClock /> {fill(text.wait, { seconds: String(left) })}
      </>
    ),
  };

  return (
    <>
      <div
        data-slot="verify-email-banner"
        data-state={phase}
        inert={phase === "leaving" || undefined}
        // A grid row folds from 1fr to 0fr, which animates height without measuring anything.
        className={cn("@container grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none", phase === "leaving" ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100", className)}
        {...props}
      >
        {/* The padding gives the focus ring room inside the clip; the negative margin takes it back out of the layout. */}
        <div className="-m-1 min-h-0 overflow-hidden p-1">
          <section aria-label={fill(text.region, { email: address })} className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs @2xl:px-5">
            {done ? (
              <div className="flex items-start gap-3.5">
                <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-foreground text-background [&_svg]:size-5">
                  <IconCheck />
                </span>
                <div className="min-w-0 pt-px">
                  <p className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">{text.verifiedTitle}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    <WithEmail template={text.verifiedBody} email={address} className="font-medium text-foreground" />
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-center @2xl:gap-6">
                <div className="flex min-w-0 items-start gap-3.5">
                  <span aria-hidden="true" className="relative grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/60 text-foreground [&_svg]:size-5">
                    <IconMail />
                    {/* An unread dot, not a check: the email is waiting, and nothing has been verified yet. */}
                    <span className="absolute -top-1 -right-1 size-3 rounded-full bg-primary ring-2 ring-card" />
                  </span>
                  <div className="min-w-0 flex-1 pt-px">
                    {editing ? (
                      <form
                        noValidate
                        aria-busy={changing || undefined}
                        onSubmit={(event) => void changeEmail(event)}
                        onKeyDown={(event) => {
                          // Escape gives the field up, the way it closes any other little editor.
                          if (event.key === "Escape" && !changing) stopEditing();
                        }}
                      >
                        <FormField error={draftError}>
                          <FormLabel>{text.newEmail}</FormLabel>
                          <div className="flex flex-wrap items-start gap-2">
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
                                className="min-w-56 flex-1 basis-56"
                              />
                            </FormControl>
                            <Button type="submit" loading={changing}>
                              {text.sendToNew}
                            </Button>
                            <Button type="button" variant="ghost" disabled={changing} onClick={stopEditing}>
                              {text.cancel}
                            </Button>
                          </div>
                        </FormField>
                      </form>
                    ) : (
                      <>
                        <p className="text-[0.9375rem] leading-snug tracking-[-0.01em] text-balance">
                          <WithEmail template={text.message} email={address} />
                          {reason ? ` ${reason}` : ""}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text.hint}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* While the address is a field nothing else offers to send. The actions are hidden, not removed: the wait keeps running, so Cancel never hands out a fresh minute. */}
                <div className={cn("flex flex-col gap-2 @md:flex-row @md:items-center", editing && "hidden")}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    // While it waits the name is what is on screen ("Resend in 28s"), so that someone who says what they see to a voice-control tool can reach it (WCAG 2.5.3). The status speaks the wait at its start and at its end; the name follows the count, which a screen reader that stays on the button may read out again, and that is the price of a name that matches.
                    aria-disabled={blocked || undefined}
                    aria-busy={sending || undefined}
                    data-state={view}
                    onClick={() => void resend()}
                    className="tabular-nums aria-disabled:cursor-default aria-disabled:hover:border-border aria-disabled:hover:bg-background data-[state=waiting]:bg-muted/50 data-[state=waiting]:text-muted-foreground data-[state=waiting]:hover:bg-muted/50 @max-md:w-full"
                  >
                    {/* Every state sits in the same cell, so the button is as wide as the longest and nothing moves when the words change. */}
                    <span className="inline-grid">
                      {VIEWS.map((item) => (
                        <span
                          key={item}
                          aria-hidden={item === view ? undefined : true}
                          className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-3.5", item === view ? "opacity-100" : "opacity-0")}
                        >
                          {contents[item]}
                        </span>
                      ))}
                      {/* The widest the waiting text will ever be, kept invisible, so the countdown never narrows the button. */}
                      <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap">
                        <IconClock className="size-3.5" /> {fill(text.wait, { seconds: String(Math.max(cooldownSeconds, 10)) })}
                      </span>
                    </span>
                  </Button>
                  {onChangeEmail ? (
                    <Button ref={changeButton} type="button" variant="ghost" size="sm" onClick={startEditing} className="text-muted-foreground hover:text-foreground @max-md:w-full">
                      <IconEdit />
                      {text.change}
                    </Button>
                  ) : null}
                </div>
              </div>
            )}

            {problem && !done && !editing ? (
              <p role="alert" className="mt-3 text-[0.8125rem] leading-snug text-destructive @2xl:pl-[3.375rem]">
                {problem}
              </p>
            ) : null}
          </section>
        </div>
      </div>
      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </>
  );
}
