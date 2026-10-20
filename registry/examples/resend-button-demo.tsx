"use client";

import { useState, type ReactNode } from "react";

import { IconMail } from "@rhs-ui/icons";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { ResendButton } from "@rhs-ui/primitives/resend-button";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Stands in for the request that mails a new code. */
function useFakeMailer() {
  const [failNext, setFailNext] = useState(false);
  const send = () =>
    new Promise<void>((resolve, reject) => {
      window.setTimeout(() => (failNext ? reject(new Error("The mail service is busy. Try again in a moment.")) : resolve()), 900);
    });
  return { send, failNext, setFailNext };
}

function VerifyCard(): React.JSX.Element {
  const mailer = useFakeMailer();
  const [status, setStatus] = useState("Enter the six digits from your email.");
  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
      <div className="mb-4 grid size-10 place-items-center rounded-full border border-border bg-muted/60">
        <IconMail className="size-5" />
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.02em]">Check your email</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        We sent a six-digit code to <span className="font-medium text-foreground">mara@halcyon.example</span>. It expires in ten minutes.
      </p>

      <div className="mt-5">
        <OtpInput groupAfter={3} onComplete={(code) => setStatus(code === "123456" ? "Code accepted. Signing you in." : `${code} did not match. Try 123456 in this preview.`)} />
        <p className="mt-2.5 text-xs text-muted-foreground" aria-live="polite">
          {status}
        </p>
      </div>

      <div className="mt-6 grid items-start gap-x-4 gap-y-2 border-t border-border pt-5 sm:grid-cols-[auto_minmax(0,1fr)]">
        <p className="text-sm text-muted-foreground sm:pt-2">Did not get it?</p>
        <ResendButton startCooling cooldown={20} maxAttempts={3} onResend={mailer.send} />
      </div>

      <label className="mt-5 flex items-center gap-2.5 text-xs text-muted-foreground">
        <Switch checked={mailer.failNext} onCheckedChange={mailer.setFailNext} />
        Make the next send fail, to see the error
      </label>
    </div>
  );
}

function QuickLimit(): React.JSX.Element {
  const [reached, setReached] = useState(false);
  return (
    <div className="grid gap-3">
      {/* The button has its own padding; pulling it back by that much lines its text up with the caption. */}
      <div className="-ml-3">
        <ResendButton variant="ghost" size="sm" cooldown={3} maxAttempts={2} onResend={() => new Promise((resolve) => window.setTimeout(resolve, 500))} onLimitReached={() => setReached(true)} />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {reached ? "onLimitReached ran. The button stays off." : "A 3 second wait and two resends, so the limit is quick to reach."}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Straight after the first send it is already counting down. Press it when it is ready; the next send can be made to fail.">
          <VerifyCard />
        </Example>
      </div>

      <Example caption="Ready: nothing is waiting">
        <ResendButton cooldown={30} onResend={() => new Promise((resolve) => window.setTimeout(resolve, 700))} />
      </Example>

      <Example caption="As a line of text in a sentence">
        <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <span>No email yet?</span>
          <ResendButton variant="link" startCooling cooldown={45} onResend={() => Promise.resolve()} />
        </div>
      </Example>

      <Example caption="Ghost and small, with an attempt limit">
        <QuickLimit />
      </Example>
    </div>
  );
}
