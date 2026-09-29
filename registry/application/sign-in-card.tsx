"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconEye, IconEyeOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface SignInValues {
  email: string;
  password: string;
}

export interface SignInCardProps {
  title?: string;
  description?: string;
  /**
   * Called with the values. Return (or resolve to) a message to show it as
   * the error; return nothing when the sign-in went through.
   */
  onSubmit: (values: SignInValues) => Promise<string | void> | string | void;
  /** Buttons for other providers, like "Continue with GitHub". Shown above the form. */
  providers?: ReactNode;
  forgotPassword?: ReactNode;
  /** Under the card: "No account yet? Create one". */
  footer?: ReactNode;
  /** The title is the page heading on a sign-in page; use h2 inside a dialog or a larger page. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * A sign-in form in a card: email and password with the right autocomplete
 * hints for password managers, a show-password toggle, a busy state on the
 * button, and one error region that is announced. Other providers sit above
 * the form, divided by "or". The form never clears what someone typed on an
 * error.
 */
export function SignInCard({ title = "Welcome back", description = "Sign in to continue where you left off.", onSubmit, providers, forgotPassword, footer, titleAs: Heading = "h1", className }: SignInCardProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const message = await onSubmit({ email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") });
      if (message) setError(message);
    } catch {
      setError("Something went wrong on our side. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="sign-in-card" className={cn("grid w-full max-w-sm gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle asChild>
            <Heading className="text-xl">{title}</Heading>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {providers ? (
            <>
              <div className="grid gap-2 *:w-full">{providers}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          ) : null}
          <form onSubmit={submit} className="grid gap-4" aria-describedby={error ? `${id}-error` : undefined}>
            <div id={`${id}-error`} role="alert" className="empty:hidden">
              {error ? (
                <p className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <IconAlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-email`}>Email</Label>
              <Input id={`${id}-email`} name="email" type="email" autoComplete="email" inputMode="email" required aria-invalid={error ? true : undefined} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`${id}-password`}>Password</Label>
                {forgotPassword ? <span className="text-xs text-muted-foreground">{forgotPassword}</span> : null}
              </div>
              <div className="relative">
                <Input
                  id={`${id}-password`}
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  aria-invalid={error ? true : undefined}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setVisible((value) => !value)}
                  aria-label="Show password"
                  aria-pressed={visible}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={busy} className="mt-1 w-full">
              {busy ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        {footer ? <CardFooter className="justify-center border-t border-border pt-6 text-sm text-muted-foreground">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}
