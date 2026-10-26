"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconArrowLeft, IconCheck, IconInfo } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Label } from "@rhs-ui/primitives/label";
import { DEFAULT_PASSWORD_RULES, PasswordInput, type PasswordRule } from "@rhs-ui/primitives/password-input";
import { cn } from "@/lib/utils";

/** What the form hands to `onSubmit`. */
export interface SetNewPasswordValues {
  /** The new password as typed. */
  password: string;
  /** Whether "Sign out of all other devices" is ticked. */
  signOutOthers: boolean;
}

/** The words the card uses, for translation. `{count}` is filled in. */
export interface SetNewPasswordLabels {
  /** The heading. Default "Set a new password". */
  heading?: string;
  /** The line under it. Default "Choose a password you have not used anywhere else.". */
  description?: string;
  /** The small line above the account's address. Default "Resetting the password for". */
  account?: string;
  /** How the masked address is read out; `{first}`, `{last}` and `{domain}` are filled in. Default "{first}, hidden characters, {last}, at {domain}". */
  maskedSpoken?: string;
  /** The new password's label. Default "New password". */
  password?: string;
  /** The confirm field's label. Default "Confirm new password". */
  confirm?: string;
  /** Under the confirm field when it was left and the two differ. Default "The two passwords do not match.". */
  mismatch?: string;
  /** The checkbox. Default "Sign out of all other devices". */
  signOutOthers?: string;
  /** The line under the checkbox. Default "Anyone signed in elsewhere has to sign in again. Worth doing if someone else may have known your old password.". */
  signOutOthersHint?: string;
  /** The submit button. Default "Update password". */
  submit?: string;
  /** Why the button waits, before anything is typed. Default "Choose a new password to continue.". */
  reasonEmpty?: string;
  /** Why the button waits, with one rule left. Default "1 requirement left to meet.". */
  reasonRule?: string;
  /** Why the button waits, with several rules left; `{count}` is how many. Default "{count} requirements left to meet.". */
  reasonRules?: string;
  /** Why the button waits, once the rules pass and the confirm field is empty. Default "Type the new password again to confirm it.". */
  reasonConfirm?: string;
  /** Why the button waits, when the two differ. Default "The two passwords need to match.". */
  reasonMismatch?: string;
  /** What the line says when nothing is in the way. Default "Your password meets every requirement.". */
  reasonReady?: string;
  /** The quiet button under the form. Default "Back to sign in". */
  backToSignIn?: string;
  /** Above the form when `onSubmit` threw instead of returning a message. Default "Something went wrong and your password was not changed. Check your connection and try again.". */
  failed?: string;
  /** The done panel's heading. Default "Password updated". */
  doneTitle?: string;
  /** The line under it. Default "Your password has been changed. Use it the next time you sign in.". */
  doneLine?: string;
  /** Added to it when the other devices were signed out. Default "Every other device has been signed out.". */
  doneOthers?: string;
  /** The button in the done panel. Default "Continue to sign in". */
  continue?: string;
}

export interface SetNewPasswordProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSubmit"> {
  /** The account being reset. It is shown with an initials avatar and partly masked: `a•••••a@northwind.studio`. */
  email: string;
  /**
   * Saves the new password. Return the message to show when it did not work ("This password has appeared in a data breach.") or nothing when it did.
   * A thrown error shows a general message. While it runs the button is busy and a second submit is ignored.
   */
  onSubmit: (values: SetNewPasswordValues) => string | void | Promise<string | void>;
  /** The rules the new password must meet, ticked off live under the field. Default: at least 12 characters, upper and lower case, a number or a symbol. */
  rules?: readonly PasswordRule[];
  /** The way back: a quiet button under the form and the button of the done panel. Leave it out and neither shows. */
  onBackToSignIn?: () => void;
  /** Show the address in full. Masked by default, because the page can be open on a shared screen. */
  showFullEmail?: boolean;
  /** Whether "Sign out of all other devices" starts ticked. Default true: this is the moment people care. */
  defaultSignOutOthers?: boolean;
  /** Start on the done panel: for a preview. */
  defaultDone?: boolean;
  /** Under the card's actions: a link to support. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: SetNewPasswordLabels;
}

const DEFAULT_LABELS = {
  heading: "Set a new password",
  description: "Choose a password you have not used anywhere else.",
  account: "Resetting the password for",
  maskedSpoken: "{first}, hidden characters, {last}, at {domain}",
  password: "New password",
  confirm: "Confirm new password",
  mismatch: "The two passwords do not match.",
  signOutOthers: "Sign out of all other devices",
  signOutOthersHint: "Anyone signed in elsewhere has to sign in again. Worth doing if someone else may have known your old password.",
  submit: "Update password",
  reasonEmpty: "Choose a new password to continue.",
  reasonRule: "1 requirement left to meet.",
  reasonRules: "{count} requirements left to meet.",
  reasonConfirm: "Type the new password again to confirm it.",
  reasonMismatch: "The two passwords need to match.",
  reasonReady: "Your password meets every requirement.",
  backToSignIn: "Back to sign in",
  failed: "Something went wrong and your password was not changed. Check your connection and try again.",
  doneTitle: "Password updated",
  doneLine: "Your password has been changed. Use it the next time you sign in.",
  doneOthers: "Every other device has been signed out.",
  continue: "Continue to sign in",
} satisfies Required<SetNewPasswordLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * `ana.costa@northwind.studio` becomes `a•••••a@northwind.studio`. The number of dots is fixed, so the mask does not
 * give away how long the name is; the domain stays whole, because it is what tells people which account this is.
 */
function maskAddress(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 1) return { shown: email, first: email, last: "", domain: "" };
  const name = email.slice(0, at);
  const domain = email.slice(at + 1);
  const first = name.charAt(0);
  const last = name.length > 2 ? name.charAt(name.length - 1) : "";
  return { shown: `${first}${name.length > 2 ? "•••••" : "•"}${last}@${domain}`, first, last, domain };
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

/** "ana.costa@northwind.studio" gives "AC": the first and the last word of the name part. */
const initialsOfAddress = (email: string) => initialsOf(email.split("@")[0]?.replace(/[._+-]+/g, " ") ?? "") || "?";

/**
 * The second half of a password reset, in one card. It names the account being
 * reset (an initials avatar and the address, partly masked), then asks for the
 * new password with its rules ticked off as they are met, and for it again in a
 * confirm field that only reports a mismatch when the field is left, never on
 * every keystroke. "Sign out of all other devices" is ticked by default: the
 * control teams forget, at the moment people care most. The button waits until
 * every rule passes and both fields match, and a line under it says why in
 * words, so a grey button is never the only explanation. Pressing it early
 * moves the focus to what is missing. On success the card becomes a done panel
 * (the look of the result state, under the card's own heading so the page keeps
 * its h1), with the way back to sign in.
 */
export function SetNewPassword({
  email,
  onSubmit,
  rules = DEFAULT_PASSWORD_RULES,
  onBackToSignIn,
  showFullEmail = false,
  defaultSignOutOthers = true,
  defaultDone = false,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: SetNewPasswordProps) {
  const text: Required<SetNewPasswordLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const passwordField = useRef<HTMLInputElement>(null);
  const confirmField = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const working = useRef(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(defaultSignOutOthers);
  const [confirmError, setConfirmError] = useState("");
  const [confirmLeft, setConfirmLeft] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [done, setDone] = useState(defaultDone);
  const [signedOutOthers, setSignedOutOthers] = useState(defaultSignOutOthers);

  // The form is replaced by the done panel, so the panel takes the focus and is read out; never on the first paint.
  const wasDone = useRef(done);
  useEffect(() => {
    if (done && !wasDone.current) doneRef.current?.focus();
    wasDone.current = done;
  }, [done]);

  const unmet = rules.filter((rule) => !rule.test(password)).length;
  const matches = password === confirm;
  const ready = password.length > 0 && unmet === 0 && confirm.length > 0 && matches;
  const reason = !password
    ? text.reasonEmpty
    : unmet > 0
      ? unmet === 1
        ? text.reasonRule
        : fill(text.reasonRules, { count: String(unmet) })
      : !confirm || (!matches && !confirmLeft)
        ? text.reasonConfirm
        : !matches
          ? text.reasonMismatch
          : text.reasonReady;

  const masked = maskAddress(email);
  const shownEmail = showFullEmail ? email : masked.shown;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current) return;
    if (!ready) {
      // The button was pressed (or Enter typed) too early: say what is wrong where it is, and go there.
      if (confirm) setConfirmLeft(true);
      if (confirm && !matches) setConfirmError(text.mismatch);
      (password.length > 0 && unmet === 0 ? confirmField : passwordField).current?.focus();
      return;
    }
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      const result = await onSubmit({ password, signOutOthers });
      if (typeof result === "string" && result) {
        setProblem(result);
        passwordField.current?.focus();
        passwordField.current?.select();
        return;
      }
      setSignedOutOthers(signOutOthers);
      setDone(true);
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  const shell = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";

  if (done) {
    return (
      <div data-slot="set-new-password" data-step="done" className={cn(shell, className)} {...props}>
        {/* The look of the result state, but the heading is the card's own, so the page keeps its h1 (or h2) and the outline does not drop to an h3. */}
        <div ref={doneRef} tabIndex={-1} className="outline-none">
          <div role="status" className="flex flex-col items-center py-2 text-center">
            <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-5">
              <IconCheck />
            </span>
            <Title className="mt-5 text-xl font-medium tracking-[-0.02em] text-balance">{text.doneTitle}</Title>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{`${text.doneLine}${signedOutOthers ? ` ${text.doneOthers}` : ""}`}</p>
            {onBackToSignIn ? (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button type="button" size="lg" onClick={onBackToSignIn}>
                  {text.continue}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div data-slot="set-new-password" data-step="form" className={cn(shell, className)} {...props}>
      <div className="grid gap-2">
        <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{text.heading}</Title>
        <p className="text-sm leading-relaxed text-muted-foreground">{text.description}</p>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Avatar>
          <AvatarFallback aria-hidden="true">{initialsOfAddress(email)}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs leading-snug text-muted-foreground">{text.account}</span>
          <span className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">
            <span aria-hidden={showFullEmail ? undefined : true}>{breakable(shownEmail)}</span>
            {showFullEmail ? null : <span className="sr-only">{fill(text.maskedSpoken, { first: masked.first, last: masked.last, domain: masked.domain })}</span>}
          </span>
        </div>
      </div>

      <form noValidate aria-busy={busy || undefined} onSubmit={(event) => void submit(event)} className="grid gap-5">
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        {/* A password manager looks for the username before it saves a new password; this one is present but never seen or tabbed to. */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />

        {/* Not inside a FormControl: the rules list under the field is the field's description, and FormControl would replace that link. */}
        <div className="grid gap-2">
          <Label htmlFor={`${id}-password`}>{text.password}</Label>
          <PasswordInput
            ref={passwordField}
            id={`${id}-password`}
            name="new-password"
            autoComplete="new-password"
            rules={rules}
            value={password}
            readOnly={busy}
            onChange={(event) => {
              setPassword(event.target.value);
              if (confirmError && event.target.value === confirm) setConfirmError("");
            }}
            className="[&_input]:h-10"
          />
        </div>

        <FormField error={confirmError}>
          <FormLabel>{text.confirm}</FormLabel>
          <FormControl>
            <PasswordInput
              ref={confirmField}
              name="confirm-password"
              autoComplete="new-password"
              value={confirm}
              readOnly={busy}
              onChange={(event) => {
                setConfirm(event.target.value);
                if (confirmError && event.target.value === password) setConfirmError("");
              }}
              onBlur={() => {
                // A mismatch is told once the field is left, not while the second password is still being typed.
                if (confirm) setConfirmLeft(true);
                if (confirm && confirm !== password) setConfirmError(text.mismatch);
              }}
              className="[&_input]:h-10"
            />
          </FormControl>
        </FormField>

        <div className="flex items-start gap-3 rounded-lg border border-border p-3.5">
          <Checkbox id={`${id}-others`} checked={signOutOthers} onCheckedChange={(value) => setSignOutOthers(value === true)} aria-describedby={`${id}-others-hint`} className="mt-px" />
          <div className="grid gap-1">
            <Label htmlFor={`${id}-others`} className="leading-snug">
              {text.signOutOthers}
            </Label>
            <p id={`${id}-others-hint`} className="text-xs leading-relaxed text-muted-foreground">
              {text.signOutOthersHint}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <Button
            type="submit"
            size="lg"
            loading={busy}
            // Not disabled while it waits: a disabled button cannot be reached, and the reason below it is the point. Pressing it early only moves the focus.
            aria-disabled={!ready || undefined}
            aria-describedby={`${id}-reason`}
            className="w-full aria-disabled:cursor-not-allowed aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:hover:bg-muted"
          >
            {text.submit}
          </Button>
          {/* The icon sits in the text and not beside it, so when a narrow card wraps the line it stays with the first words instead of hanging at the far edge. */}
          <p id={`${id}-reason`} className="text-center text-[0.8125rem] leading-snug text-balance text-muted-foreground">
            {ready ? <IconCheck aria-hidden="true" className="mr-2 inline size-4 align-text-bottom text-foreground" /> : <IconInfo aria-hidden="true" className="mr-2 inline size-4 align-text-bottom" />}
            {reason}
          </p>
        </div>
      </form>

      {onBackToSignIn ? (
        <Button type="button" variant="ghost" onClick={onBackToSignIn} className="-mt-2 w-full text-muted-foreground hover:text-foreground">
          <IconArrowLeft />
          {text.backToSignIn}
        </Button>
      ) : null}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
