"use client";

import { useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { LabeledDivider } from "@rhs-ui/primitives/labeled-divider";
import { PasswordInput } from "@rhs-ui/primitives/password-input";
import { cn } from "@/lib/utils";

/** What the form hands to `onSubmit`. */
export interface SignInCredentials {
  /** The address, trimmed. */
  email: string;
  /** The password as typed. */
  password: string;
  /** Whether "Remember me" is ticked. */
  remember: boolean;
}

/** The words the form uses, for translation. */
export interface TwoColumnSignInLabels {
  /** Default "Email address". */
  email?: string;
  /** Default "Password". */
  password?: string;
  /** Default "Forgot password?". */
  forgot?: string;
  /** Default "Remember me". */
  remember?: string;
  /** Said under the email field when it is empty or not an address. Default "Enter your email address, like name@company.com." */
  emailInvalid?: string;
  /** Said under the password field when it is empty. Default "Enter your password." */
  passwordMissing?: string;
  /** Shown above the fields when `onSubmit` throws instead of returning a message. Default "Something went wrong. Check your connection and try again." */
  failed?: string;
}

export interface TwoColumnSignInProps extends Omit<ComponentProps<"section">, "children" | "onSubmit" | "title"> {
  /**
   * Signs the person in. Return the message to show above the fields when it did not work ("That email and password do not match."), or nothing when it did.
   * A thrown error shows a general message instead. While it runs the button is busy and a second submit is ignored.
   */
  onSubmit: (credentials: SignInCredentials) => string | void | Promise<string | void>;
  /** The provider buttons: single sign-on, a passkey, the identity providers you support. They sit above a divider. Leave it out for the form alone. */
  providers?: ReactNode;
  /** The other column: a customer quote, a product shot, a photo. It is hidden below `lg`, and it is decorative (hidden from assistive technology) unless you give it `asideLabel`. Its top edge is level with the form column's, so a row of your own that is 2.5rem high (`h-10`) lines up with the brand. */
  aside?: ReactNode;
  /** A name for the aside, which turns it into a labelled landmark. Leave it out when it is only decoration. */
  asideLabel?: string;
  /** Under the form: "New here? Create an account". */
  footer?: ReactNode;
  /** The page that resets a password. Leave it out and there is no link. */
  forgotHref?: string;
  /** Your logo, top left of the form column. */
  brand?: ReactNode;
  /** The element of the heading: "h1" (the default) when the form is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2";
  /** The heading. Default "Welcome back". */
  heading?: string;
  /** The line under the heading. Default "Sign in to pick up where you left off.". */
  description?: string;
  /** The submit button's text. Default "Sign in". */
  submitLabel?: string;
  /** The words on the line between the provider buttons and the fields. Default "or continue with email". */
  dividerLabel?: string;
  /** The words the form uses, for translation. */
  labels?: TwoColumnSignInLabels;
}

const DEFAULT_LABELS = {
  email: "Email address",
  password: "Password",
  forgot: "Forgot password?",
  remember: "Remember me",
  emailInvalid: "Enter your email address, like name@company.com.",
  passwordMissing: "Enter your password.",
  failed: "Something went wrong. Check your connection and try again.",
} satisfies Required<TwoColumnSignInLabels>;

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A full-page sign-in in two columns: the form on one side, and on the other a
 * quiet panel for a customer quote, a product shot or a photo. The form holds
 * the heading, a slot for provider buttons, a labelled divider, an email field,
 * a password field with a show toggle and a "Forgot password?" link, a
 * remember-me checkbox and the submit button. Mistakes are told where they
 * are: a missing or malformed field under the field, and the answer of your
 * `onSubmit` (the wrong password, a locked account) in one announced message
 * above the fields. What was typed survives a failed attempt, and the button is
 * busy while it works, so a second press does nothing. Below `lg` the other
 * column goes and the form stays alone, centred in a column no wider than 24rem.
 */
export function TwoColumnSignIn({
  onSubmit,
  providers,
  aside,
  asideLabel,
  footer,
  forgotHref,
  brand,
  titleAs: Title = "h1",
  heading = "Welcome back",
  description = "Sign in to pick up where you left off.",
  submitLabel = "Sign in",
  dividerLabel = "or continue with email",
  labels,
  className,
  ...props
}: TwoColumnSignInProps) {
  const text: Required<TwoColumnSignInLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const emailField = useRef<HTMLInputElement>(null);
  const passwordField = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current) return;
    const address = email.trim();
    const errors = { email: EMAIL.test(address) ? undefined : text.emailInvalid, password: password ? undefined : text.passwordMissing };
    setFieldErrors(errors);
    if (errors.email || errors.password) {
      setProblem("");
      (errors.email ? emailField : passwordField).current?.focus();
      return;
    }
    working.current = true;
    setBusy(true);
    setProblem("");
    try {
      const result = await onSubmit({ email: address, password, remember });
      if (typeof result === "string" && result) {
        setProblem(result);
        passwordField.current?.focus();
        passwordField.current?.select();
      }
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  return (
    <section data-slot="two-column-sign-in" className={cn("grid min-h-svh bg-background text-foreground lg:grid-cols-2", className)} {...props}>
      <div className="flex min-w-0 flex-col px-6 py-8 sm:px-10 lg:px-14">
        {brand ? <div className="flex h-10 items-center">{brand}</div> : null}
        <div className="flex flex-1 justify-center pt-[clamp(2rem,9vh,5.5rem)] pb-10">
          {/* `content-start` keeps the rows their own height: without it the spare height of a tall window is shared out between them, and the form jumps when an error appears. */}
          <div className="grid w-full max-w-sm content-start gap-7">
            <div className="grid content-start gap-2">
              <Title className="text-[1.75rem] leading-tight font-semibold tracking-[-0.04em] text-balance">{heading}</Title>
              {description ? <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</p> : null}
            </div>

            {providers ? (
              <div className="grid gap-5">
                {providers}
                <LabeledDivider>{dividerLabel}</LabeledDivider>
              </div>
            ) : null}

            <form noValidate onSubmit={(event) => void submit(event)} aria-busy={busy || undefined} className="grid gap-5">
              <div role="alert" className="empty:hidden">
                {problem ? (
                  <Alert tone="destructive" role="none" className={DANGER_TEXT}>
                    <IconAlertCircle />
                    <AlertTitle>{problem}</AlertTitle>
                  </Alert>
                ) : null}
              </div>

              <FormField error={fieldErrors.email}>
                <FormLabel>{text.email}</FormLabel>
                <FormControl>
                  <Input
                    ref={emailField}
                    type="email"
                    name="email"
                    autoComplete="username"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-10"
                  />
                </FormControl>
              </FormField>

              <FormField error={fieldErrors.password}>
                <div className="flex items-center justify-between gap-3">
                  <FormLabel>{text.password}</FormLabel>
                  {forgotHref ? (
                    <a href={forgotHref} className="rounded-sm text-[0.8125rem] font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      {text.forgot}
                    </a>
                  ) : null}
                </div>
                <FormControl>
                  <PasswordInput ref={passwordField} name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="[&_input]:h-10" />
                </FormControl>
              </FormField>

              <div className="flex items-center gap-2.5">
                <Checkbox id={`${id}-remember`} checked={remember} onCheckedChange={(value) => setRemember(value === true)} />
                <Label htmlFor={`${id}-remember`} className="font-normal">
                  {text.remember}
                </Label>
              </div>

              <Button type="submit" size="lg" loading={busy} className="w-full">
                {submitLabel}
              </Button>
            </form>

            {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </div>
      </div>

      {aside ? (
        <aside aria-hidden={asideLabel ? undefined : true} aria-label={asideLabel} className="hidden min-w-0 border-s border-border bg-muted/60 px-12 pt-8 pb-12 lg:flex lg:flex-col xl:px-16 xl:pb-16">
          {aside}
        </aside>
      ) : null}
    </section>
  );
}
