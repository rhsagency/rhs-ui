"use client";

import { Fragment, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconFingerprint, IconInfo } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** Why a passkey sign-in did not happen, as your own WebAuthn code found out: the person closed the prompt, there was no passkey for this site, or the browser cannot do it at all. */
export type PasskeyError = "cancelled" | "not-found" | "unsupported";

/** Another way in, offered quietly below the passkey button: a password, an email link, single sign-on. */
export interface PasskeyFallback {
  /** A stable identity. */
  id: string;
  /** What it says: "Use a password instead". */
  label: string;
  /** A page to open. */
  href?: string;
  /** An action instead of a page. */
  onSelect?: () => void;
}

/** The title and the next step of one message. */
export interface PasskeyMessage {
  /** What happened, in a few words: "Sign-in was cancelled". */
  title: string;
  /** What to do next, in a sentence: "Try again when you are ready, or use another way below." */
  body: string;
}

/** The words the card uses, for translation. `{term}` is replaced by the word with the tooltip. */
export interface PasskeySignInLabels {
  /** The line under the heading, with the term in the middle: `{term}` becomes a word with a tooltip. Default "Sign in with your fingerprint, face or screen lock. No password needed, thanks to a {term}.". */
  lead?: string;
  /** The line under the heading in a browser without passkeys, where the explanation above would not apply. Default "Choose how you would like to sign in.". */
  leadUnsupported?: string;
  /** The word that carries the explanation. Default "passkey". */
  term?: string;
  /** What a passkey is, in one line, in the tooltip. Default "A passkey replaces your password. It stays on your device, opens with your fingerprint, face or screen lock, and cannot be phished or reused.". */
  definition?: string;
  /** The big button. Default "Sign in with a passkey". */
  passkey?: string;
  /** The big button while the browser's own prompt is open. Default "Waiting for your device". */
  waiting?: string;
  /** Said when the prompt opens. Default "Waiting for your device. Follow the prompt to sign in.". */
  waitingSaid?: string;
  /** The words on the line between the button and the email field. Default "or enter your email". */
  divider?: string;
  /** The email field's label. Default "Email address". */
  email?: string;
  /** Under the email field. Default "Optional. It helps your browser find the right passkey.". */
  emailHint?: string;
  /** The messages for each error, each a title and the next step. */
  errors?: Partial<Record<PasskeyError | "failed", PasskeyMessage>>;
}

export interface PasskeySignInProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /**
   * Runs the passkey sign-in. You own the WebAuthn call (the block never touches `navigator.credentials`): start it here and resolve when it is done.
   * It receives the address typed in the field, which may be empty. Report what went wrong through `error`; a rejection with no `error` set shows a general message.
   */
  onPasskey: (context: { email: string }) => void | Promise<void>;
  /** Other ways in, as quiet text actions under the field. When `supported` is false they lead instead, as full buttons. */
  fallbacks?: readonly PasskeyFallback[];
  /** What went wrong, in plain words with the next step, announced once. Clear it (null) when the person tries again. */
  error?: PasskeyError | null;
  /** Whether this browser can do passkeys at all. False removes the button and the field and leads with the fallbacks. Default true. */
  supported?: boolean;
  /** Treat the prompt as open even when this card did not start it, for a redirect or a preview. */
  busy?: boolean;
  /** Under the card's actions: terms, a link to create an account. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The heading. Default "Welcome back". */
  heading?: string;
  /** The address the field starts with. */
  defaultEmail?: string;
  /** The words the card uses, for translation. */
  labels?: PasskeySignInLabels;
}

const DEFAULT_MESSAGES = {
  cancelled: { title: "Sign-in was cancelled", body: "Nothing was changed. Try again when you are ready, or use another way below." },
  "not-found": { title: "No passkey found for this device", body: "Use your password or an email link instead. You can add a passkey in your account settings after you sign in." },
  unsupported: { title: "This browser cannot use passkeys", body: "Use your password or an email link instead." },
  failed: { title: "Something went wrong with your passkey", body: "Try again, or use another way below." },
} satisfies Record<PasskeyError | "failed", PasskeyMessage>;

const DEFAULT_LABELS = {
  lead: "Sign in with your fingerprint, face or screen lock. No password needed, thanks to a {term}.",
  leadUnsupported: "Choose how you would like to sign in.",
  term: "passkey",
  definition: "A passkey replaces your password. It stays on your device, opens with your fingerprint, face or screen lock, and cannot be phished or reused.",
  passkey: "Sign in with a passkey",
  waiting: "Waiting for your device",
  waitingSaid: "Waiting for your device. Follow the prompt to sign in.",
  divider: "or enter your email",
  email: "Email address",
  emailHint: "Optional. It helps your browser find the right passkey.",
};

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const SHELL = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";

function FallbackAction({ item, lead = false, primary = false }: { item: PasskeyFallback; lead?: boolean; primary?: boolean }) {
  const common = lead ? { size: "lg" as const, variant: primary ? ("default" as const) : ("outline" as const), className: "w-full" } : { size: "sm" as const, variant: "ghost" as const, className: "min-h-11 text-muted-foreground hover:text-foreground" };
  return item.href ? (
    <Button asChild {...common}>
      <a href={item.href} onClick={item.onSelect}>
        {item.label}
      </a>
    </Button>
  ) : (
    <Button type="button" onClick={item.onSelect} {...common}>
      {item.label}
    </Button>
  );
}

/**
 * A passkey-first sign-in. One large button, "Sign in with a passkey", starts
 * your own WebAuthn call; while the browser's prompt is open it reads "Waiting
 * for your device" with a spinner and stays put, and the same press cannot run
 * twice. Under it sits an optional email field marked for passkey autofill, and
 * a quiet pair of fallbacks (a password, an email link). What went wrong comes
 * back as `error`: a cancelled prompt, no passkey on this device, no support in
 * this browser, each in plain words with the next step, announced once. In a
 * browser without support the button goes and the fallbacks lead. A word
 * with a tooltip explains what a passkey is for first-timers. Every target is
 * large, and nothing depends on a pointer.
 */
export function PasskeySignIn({
  onPasskey,
  fallbacks = [],
  error = null,
  supported = true,
  busy: busyProp = false,
  footer,
  titleAs: Title = "h1",
  heading = "Welcome back",
  defaultEmail = "",
  labels,
  className,
  ...props
}: PasskeySignInProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const messages = { ...DEFAULT_MESSAGES, ...labels?.errors };
  const id = useId();
  const working = useRef(false);
  const [running, setRunning] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [failed, setFailed] = useState(false);
  const busy = running || busyProp;

  async function run(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (working.current || busyProp) return;
    working.current = true;
    setRunning(true);
    setFailed(false);
    try {
      await onPasskey({ email: email.trim() });
    } catch {
      setFailed(true);
    } finally {
      working.current = false;
      setRunning(false);
    }
  }

  const shown: PasskeyError | "failed" | null = supported ? (busy ? null : (error ?? (failed ? "failed" : null))) : "unsupported";
  const message = shown ? messages[shown] : null;
  const [before = "", after = ""] = text.lead.split("{term}");

  // The word "passkey" opens a small named panel that says what one is, on click, tap or Enter: not on hover alone, so it works on a phone and with a keyboard.
  const term = (
    <Popover>
      {/* The padded `before` is only hit area: a word in a sentence cannot grow, but a thumb should not have to hit its 23px exactly. */}
      <PopoverTrigger className="relative cursor-help rounded-sm underline decoration-dotted decoration-from-font underline-offset-4 outline-none before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] hover:decoration-solid focus-visible:ring-[3px] focus-visible:ring-ring/40">{text.term}</PopoverTrigger>
      <PopoverContent side="top" aria-labelledby={`${id}-term`} className="w-72 text-sm">
        <p id={`${id}-term`} className="font-medium">
          {text.term.charAt(0).toUpperCase() + text.term.slice(1)}
        </p>
        <p className="mt-1 leading-relaxed text-muted-foreground">{text.definition}</p>
      </PopoverContent>
    </Popover>
  );

  const header = (
    <div className="grid gap-2">
      <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{heading}</Title>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {supported ? (
          <>
            {before}
            {term}
            {after}
          </>
        ) : (
          text.leadUnsupported
        )}
      </p>
    </div>
  );

  if (!supported) {
    return (
      <div data-slot="passkey-sign-in" data-supported="false" className={cn(SHELL, className)} {...props}>
        {header}
        <Alert tone="info" role="status">
          <IconInfo />
          <AlertTitle>{messages.unsupported.title}</AlertTitle>
          <AlertDescription>{messages.unsupported.body}</AlertDescription>
        </Alert>
        {fallbacks.length ? (
          <div className="grid gap-2.5">
            {fallbacks.map((item, index) => (
              <FallbackAction key={item.id} item={item} lead primary={index === 0} />
            ))}
          </div>
        ) : null}
        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div data-slot="passkey-sign-in" data-supported="true" data-busy={busy || undefined} className={cn(SHELL, className)} {...props}>
      {header}

      <form noValidate onSubmit={(event) => void run(event)} aria-busy={busy || undefined} className="grid gap-5">
        <div role="alert" className="empty:hidden">
          {message ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{message.title}</AlertTitle>
              <AlertDescription className="text-inherit">{message.body}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          onClick={(event) => {
            // The press that is already working is ignored, but the button stays reachable, so focus is never lost to a disabled control.
            if (busy) event.preventDefault();
          }}
          className="h-14 w-full justify-start gap-3.5 rounded-xl px-3 text-base font-semibold tracking-[-0.01em] aria-disabled:cursor-progress"
        >
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
            {busy ? <Spinner size={20} label="" role="presentation" aria-hidden="true" /> : <IconFingerprint className="size-5" />}
          </span>
          <span className="flex-1 text-start">{busy ? text.waiting : text.passkey}</span>
        </Button>

        <LabeledDivider>{text.divider}</LabeledDivider>

        <div className="grid gap-2">
          <Label htmlFor={`${id}-email`}>{text.email}</Label>
          <Input
            id={`${id}-email`}
            type="email"
            name="username"
            // `webauthn` is what lets the browser offer a saved passkey in this very field.
            autoComplete="username webauthn"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-describedby={`${id}-hint`}
            className="h-12"
          />
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">
            {text.emailHint}
          </p>
        </div>

        <span role="status" className="sr-only">
          {busy ? text.waitingSaid : ""}
        </span>
      </form>

      {fallbacks.length ? (
        <div className="-mt-3.5 flex flex-col items-center gap-0.5 @xs:flex-row @xs:justify-center @xs:gap-x-1">
          {fallbacks.map((item, index) => (
            <Fragment key={item.id}>
              {index > 0 ? (
                <span aria-hidden="true" className="hidden text-muted-foreground @xs:inline">
                  ·
                </span>
              ) : null}
              <FallbackAction item={item} />
            </Fragment>
          ))}
        </div>
      ) : null}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
