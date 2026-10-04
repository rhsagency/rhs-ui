"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconMailOpen } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface ForgotPasswordCardProps {
  /** Send the reset link. Resolve whether or not the address exists, so the form never reveals who has an account. */
  onSubmit: (email: string) => Promise<void> | void;
  /** "Back to sign in". */
  footer?: ReactNode;
  /** The title is the page heading on a reset page; use h2 inside a dialog or a larger page. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * Reset a password: one email field, then a confirmation that reads the
 * same whether or not the address has an account (no account enumeration),
 * with a resend that waits thirty seconds before it can be used again.
 */
export function ForgotPasswordCard({ onSubmit, footer, titleAs: Heading = "h1", className }: ForgotPasswordCardProps) {
  const id = useId();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  async function send(address: string) {
    setBusy(true);
    try {
      await onSubmit(address);
    } finally {
      setBusy(false);
      setEmail(address);
      setWait(30);
      const timer = setInterval(() => setWait((value) => {
        if (value <= 1) clearInterval(timer);
        return Math.max(0, value - 1);
      }), 1000);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (address) void send(address);
  }
  return (
    <div data-slot="forgot-password-card" className={cn("grid w-full max-w-sm gap-6", className)}>
      <Card>
        {email ? (
          <CardContent className="grid justify-items-center gap-4 pt-8 text-center" role="status">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-muted [&_svg]:size-6"><IconMailOpen /></span>
            <Heading className="text-xl font-medium">Check your inbox</Heading>
            <p className="text-sm text-muted-foreground">If <span className="font-medium text-foreground">{email}</span> has an account, a reset link is on its way. It works for one hour.</p>
            <Button variant="outline" className="w-full" disabled={wait > 0} loading={busy} onClick={() => void send(email)}>
              {wait > 0 ? `Resend in ${wait} s` : "Resend the link"}
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle asChild><Heading className="text-xl">Forgot your password?</Heading></CardTitle>
              <CardDescription>Enter your email and we will send you a link to choose a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={id}>Email</Label>
                  <Input id={id} name="email" type="email" autoComplete="email" inputMode="email" required />
                </div>
                <Button type="submit" className="w-full" loading={busy}>Send reset link</Button>
              </form>
            </CardContent>
          </>
        )}
        {footer ? <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter> : null}
      </Card>
    </div>
  );
}
