"use client";

import { useState, type ReactNode } from "react";

import { IconAlertCircle, IconShieldCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { cn } from "@/lib/utils";

export interface TwoFactorCardProps {
  /** Where the code went: "your authenticator app", "+31 6 •• •• 12 34". */
  destination: string;
  /** Resolve to true when the code is right; false shows the error and clears the boxes. */
  onVerify: (code: string) => Promise<boolean> | boolean;
  /** "Use a recovery code" or "Send a text instead". */
  alternative?: ReactNode;
  /** The title is the page heading on this step; use h2 inside a dialog or a larger page. */
  titleAs?: "h1" | "h2" | "h3";
  className?: string;
}

/**
 * The second step of sign-in: a six-box code that submits itself when the
 * last digit lands (pasting a whole code works), a busy state while it is
 * checked, a wrong code announced and cleared, and the way out underneath.
 */
export function TwoFactorCard({ destination, onVerify, alternative, titleAs: Heading = "h1", className }: TwoFactorCardProps) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  async function verify(value: string) {
    setBusy(true);
    setWrong(false);
    try {
      const ok = await onVerify(value);
      if (!ok) {
        setWrong(true);
        setCode("");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div data-slot="two-factor-card" className={cn("grid w-full max-w-sm gap-6", className)}>
      <Card>
        <CardHeader className="justify-items-center text-center">
          <span className="mb-2 inline-flex size-12 items-center justify-center rounded-full bg-muted [&_svg]:size-6"><IconShieldCheck /></span>
          <CardTitle asChild><Heading className="text-xl">Enter your code</Heading></CardTitle>
          <CardDescription>We sent a six-digit code to {destination}.</CardDescription>
        </CardHeader>
        <CardContent className="grid justify-items-center gap-4">
          <OtpInput value={code} onValueChange={setCode} onComplete={(value) => void verify(value)} groupAfter={3} invalid={wrong} disabled={busy} />
          <div role="alert" className="min-h-5 text-sm">
            {wrong ? <span className="inline-flex items-center gap-1.5 text-destructive"><IconAlertCircle className="size-4" />That code did not match. Try again.</span> : null}
          </div>
          <Button className="w-full" loading={busy} disabled={code.length < 6} onClick={() => void verify(code)}>Verify</Button>
        </CardContent>
        {alternative ? <CardFooter className="justify-center text-sm text-muted-foreground">{alternative}</CardFooter> : null}
      </Card>
    </div>
  );
}
