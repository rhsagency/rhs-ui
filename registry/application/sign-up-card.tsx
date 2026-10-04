"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { PasswordInput } from "@rhs-ui/primitives/password-input";
import { cn } from "@/lib/utils";

export interface SignUpValues {
  name: string;
  email: string;
  password: string;
  updates: boolean;
}

export interface SignUpCardProps {
  title?: string;
  description?: string;
  /** Return (or resolve to) a message to show it as the error; nothing when the account was made. */
  onSubmit: (values: SignUpValues) => Promise<string | void> | string | void;
  /** "Continue with Google" buttons, above the form. */
  providers?: ReactNode;
  /** The terms line under the button, with links. */
  terms?: ReactNode;
  /** Under the card: "Already have an account? Sign in". */
  footer?: ReactNode;
  /** The title is the page heading on a sign-up page; use h2 inside a dialog or a larger page. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Create an account in a card: name, email and a new password with its
 * rules and strength shown as you type, an opt-in for product updates that
 * starts unticked, and one announced error region. Autocomplete hints are
 * the ones password managers expect for a new account.
 */
export function SignUpCard({ title = "Create your account", description = "Free for up to three people. No card needed.", onSubmit, providers, terms, footer, titleAs: Heading = "h1", className }: SignUpCardProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const message = await onSubmit({ name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), password: String(data.get("password") ?? ""), updates: data.get("updates") === "on" });
      if (message) setError(message);
    } catch {
      setError("Something went wrong on our side. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div data-slot="sign-up-card" className={cn("grid w-full max-w-sm gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle asChild><Heading className="text-xl">{title}</Heading></CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {providers ? (
            <>
              <div className="grid gap-2 *:w-full">{providers}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
            </>
          ) : null}
          <form onSubmit={submit} className="grid gap-4" aria-describedby={error ? `${id}-error` : undefined}>
            <div id={`${id}-error`} role="alert" className="empty:hidden">
              {error ? <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"><IconAlertCircle size={16} className="mt-0.5 shrink-0" />{error}</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-name`}>Name</Label>
              <Input id={`${id}-name`} name="name" autoComplete="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-email`}>Work email</Label>
              <Input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={error ? true : undefined} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-password`}>Password</Label>
              <PasswordInput id={`${id}-password`} name="password" autoComplete="new-password" required rules />
            </div>
            <div className="flex items-start gap-2.5">
              <Checkbox id={`${id}-updates`} name="updates" className="mt-0.5" />
              <Label htmlFor={`${id}-updates`} className="text-sm leading-snug font-normal text-muted-foreground">Send me product updates, about once a month.</Label>
            </div>
            <Button type="submit" className="w-full" loading={busy}>Create account</Button>
            {terms ? <p className="text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4">{terms}</p> : null}
          </form>
        </CardContent>
        {footer ? <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}
