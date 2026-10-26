"use client";

import { Fragment, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconFingerprint, IconLock, IconSpinner } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { PasswordInput } from "@rhs-ui/primitives/password-input";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. */
export interface ReauthenticateCardLabels {
  /** The heading. Default "Confirm it is you". */
  heading?: string;
  /** Read out before the address, for screen readers. Default "Signed in as". */
  signedInAs?: string;
  /** The small line above the action. Default "You are about to". */
  intro?: string;
  /** The password field's label. Default "Password". */
  password?: string;
  /** The main button. Default "Confirm". */
  confirm?: string;
  /** The main button once it worked. Default "Confirmed". */
  confirmed?: string;
  /** The button beside it. Default "Cancel". */
  cancel?: string;
  /** The word on the line between the two routes. Default "or". */
  or?: string;
  /** The passkey button. Default "Use a passkey instead". */
  passkey?: string;
  /** The passkey button while the browser's own prompt is open. Default "Waiting for your device". */
  passkeyWaiting?: string;
  /** Under the field when it was left empty. Default "Enter your password.". */
  missing?: string;
  /** Under the field when `onConfirm` threw instead of returning a message. Default "We could not check your password. Try again.". */
  failed?: string;
  /** Above the field when the passkey did not work and gave no message. Default "The passkey did not work. Use your password instead.". */
  passkeyFailed?: string;
}

export interface ReauthenticateCardProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSubmit"> {
  /** The address of the person who is signed in. It is shown beside an initials avatar, so they know which account is asking. */
  email: string;
  /** What is about to happen, in a few words: "Change your email address", "Delete this workspace". */
  action: string;
  /**
   * Checks the password. Return the message to show when it was wrong ("That password is not right.") or nothing when it was right. The message
   * is announced once against the field, which keeps the focus and empties itself for the next try. Counting attempts and locking are the
   * server's job: the card shows whatever message comes back. A thrown error shows a general one.
   */
  onConfirm: (password: string) => string | void | Promise<string | void>;
  /** Confirms with a passkey instead; you own the WebAuthn call. Return a message when it did not work, or nothing when it did. Leave it out and there is no second route. */
  onPasskey?: () => string | void | Promise<string | void>;
  /** Backs out. It shows as a button beside Confirm; leave it out when the dialog around the card has its own. */
  onCancel?: () => void;
  /** What happens afterwards, so nobody feels nagged: "You will not be asked again for 10 minutes." Shown under the buttons. */
  grace?: ReactNode;
  /** The person's picture, as an image address. Without one the avatar shows their initials. */
  avatar?: string;
  /** An id for the heading, so a dialog around the card can name itself with `aria-labelledby`. */
  titleId?: string;
  /** Start with this message under the password field, as it stands after a wrong password: for a preview. Typing clears it, as it would any other. */
  defaultError?: string;
  /** The heading's element: "h2" by default. Use "p" inside a dialog that has its own title, so the page has one heading for it, not two. */
  titleAs?: "h1" | "h2" | "h3" | "p";
  /** The words the card uses, for translation. */
  labels?: ReauthenticateCardLabels;
}

const DEFAULT_LABELS = {
  heading: "Confirm it is you",
  signedInAs: "Signed in as",
  intro: "You are about to",
  password: "Password",
  confirm: "Confirm",
  confirmed: "Confirmed",
  cancel: "Cancel",
  or: "or",
  passkey: "Use a passkey instead",
  passkeyWaiting: "Waiting for your device",
  missing: "Enter your password.",
  failed: "We could not check your password. Try again.",
  passkeyFailed: "The passkey did not work. Use your password instead.",
} satisfies Required<ReauthenticateCardLabels>;

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** The look of a button that is busy or finished: it keeps its fill and does not react to the pointer, since pressing it does nothing. */
const SETTLED = "aria-busy:cursor-progress aria-busy:hover:bg-primary aria-busy:active:translate-y-0 aria-disabled:cursor-default aria-disabled:hover:bg-primary aria-disabled:active:translate-y-0";

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(address: string) {
  return (address.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [address]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/**
 * "Confirm it is you" before something that cannot be undone, in a compact card
 * that sits as well inside a dialog as on a page. It opens with the person who
 * is signed in (an initials avatar and the address) and names what is about to
 * happen, then asks for the password, with "Use a passkey instead" as the
 * second route. A wrong password is announced once, against the field: the
 * field keeps the focus and empties itself, so the next try is just typing.
 * Counting attempts and locking are the server's job; the card shows whatever
 * message you return. The two main buttons stay focusable while they work, so
 * the one that was pressed keeps the focus through a failed passkey or the
 * finished "Confirmed". A line under the buttons says how long the answer holds,
 * so people do not feel nagged.
 */
export function ReauthenticateCard({
  email,
  action,
  onConfirm,
  onPasskey,
  onCancel,
  grace,
  avatar,
  titleId,
  defaultError,
  titleAs: Title = "h2",
  labels,
  className,
  ...props
}: ReauthenticateCardProps) {
  const text: Required<ReauthenticateCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const passwordField = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState(defaultError ?? "");
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState<"password" | "passkey" | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current || confirmed) return;
    if (!password) {
      setFieldError(text.missing);
      passwordField.current?.focus();
      return;
    }
    working.current = true;
    setBusy("password");
    setFieldError("");
    setProblem("");
    try {
      const result = await onConfirm(password);
      if (typeof result === "string" && result) {
        // The wrong password is not kept: the field is empty and still has the focus, so the next try is just typing.
        setFieldError(result);
        setPassword("");
        passwordField.current?.focus();
        return;
      }
      setConfirmed(true);
    } catch {
      setFieldError(text.failed);
      setPassword("");
      passwordField.current?.focus();
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  async function usePasskey() {
    if (working.current || confirmed || !onPasskey) return;
    working.current = true;
    setBusy("passkey");
    setFieldError("");
    setProblem("");
    try {
      const result = await onPasskey();
      if (typeof result === "string" && result) {
        setProblem(result);
        return;
      }
      setConfirmed(true);
    } catch {
      setProblem(text.passkeyFailed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  return (
    <div
      data-slot="reauthenticate-card"
      data-state={confirmed ? "confirmed" : undefined}
      className={cn("@container mx-auto grid w-full max-w-sm gap-5 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs", className)}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        <Avatar size="lg">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback aria-hidden="true">{initialsOf(email.split("@")[0]?.replace(/[._+-]+/g, " ") ?? "") || "?"}</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 gap-0.5">
          <Title id={titleId} className="text-lg leading-tight font-semibold tracking-[-0.03em]">
            {text.heading}
          </Title>
          <p className="text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">
            <span className="sr-only">{text.signedInAs} </span>
            {breakable(email)}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-foreground [&_svg]:size-4">
          <IconLock />
        </span>
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs leading-snug text-muted-foreground">{text.intro}</span>
          <span className="text-sm leading-snug font-medium text-balance">{action}</span>
        </div>
      </div>

      <form noValidate aria-busy={busy !== null || undefined} onSubmit={(event) => void submit(event)} className="grid gap-4">
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        {/* A password manager wants the username before it fills or saves a password; this one is present but never seen or tabbed to. */}
        <input type="text" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" className="sr-only" />

        <FormField error={fieldError}>
          <FormLabel>{text.password}</FormLabel>
          <FormControl>
            <PasswordInput
              ref={passwordField}
              name="password"
              autoComplete="current-password"
              value={password}
              // Read-only, not disabled, while it is checked: a disabled field would drop the focus, and a wrong password has to hand it back.
              readOnly={busy !== null || confirmed}
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldError) setFieldError("");
              }}
              className="[&_input]:h-10"
            />
          </FormControl>
        </FormField>

        <div className="flex gap-2.5">
          <Button
            type="submit"
            size="lg"
            // aria-disabled and aria-busy, not disabled: a disabled button gives up the focus, and the button that was pressed keeps it
            // through the check, a failed passkey and the finished "Confirmed". While the passkey runs it steps back; once confirmed it stays solid.
            aria-disabled={busy === "passkey" || confirmed || undefined}
            aria-busy={busy === "password" || undefined}
            // The grace line is what the button promises, so a screen reader says it with the button.
            aria-describedby={grace ? `${id}-grace` : undefined}
            className={cn(SETTLED, "flex-1", busy === "passkey" && "opacity-50")}
          >
            {busy === "password" ? <IconSpinner /> : confirmed ? <IconCheck /> : null}
            {confirmed ? text.confirmed : text.confirm}
          </Button>
          {onCancel ? (
            <Button type="button" variant="outline" size="lg" disabled={busy !== null} onClick={onCancel}>
              {text.cancel}
            </Button>
          ) : null}
        </div>
      </form>

      {onPasskey ? (
        <div className="grid gap-4">
          <LabeledDivider>{text.or}</LabeledDivider>
          <Button
            type="button"
            variant="outline"
            size="lg"
            // Not disabled while the browser's prompt is open, so a prompt that is dismissed leaves the focus on this button for another try.
            aria-disabled={busy === "password" || confirmed || undefined}
            aria-busy={busy === "passkey" || undefined}
            onClick={() => void usePasskey()}
            className="w-full aria-busy:cursor-progress aria-busy:active:translate-y-0 aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:bg-background aria-disabled:active:translate-y-0"
          >
            {busy === "passkey" ? <IconSpinner /> : <IconFingerprint />}
            {busy === "passkey" ? text.passkeyWaiting : text.passkey}
          </Button>
        </div>
      ) : null}

      {grace ? (
        <p id={`${id}-grace`} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <IconClock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{grace}</span>
        </p>
      ) : null}
    </div>
  );
}
