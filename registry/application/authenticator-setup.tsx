"use client";

import { Fragment, useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconCheck, IconCopy, IconSmartphone } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { cn } from "@/lib/utils";

export interface AuthenticatorSetupProps {
  /** The QR code, as your own SVG or image: the block draws no code itself. It sits on a white tile, so keep it dark on light. */
  qr: ReactNode;
  /** The shared secret as the app needs it (base32). Shown in groups of four. */
  secret: string;
  /** Who the account is with, "Kestrel". */
  issuer: string;
  /** Which account it is, "ada@northwind.example". */
  accountLabel: string;
  /** The otpauth:// address. With it, a link opens the authenticator app straight from a phone. */
  otpauthUri?: string;
  /** Checks the six digits. Resolve to true when the code was right, to false when it was not. */
  onVerify: (code: string) => Promise<boolean> | boolean;
  /** Shows a Cancel button next to Verify. */
  onCancel?: () => void;
  /** Shown once the code was right, usually a button on to the recovery codes. */
  next?: ReactNode;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

type Status = "idle" | "verifying" | "wrong" | "failed" | "done";

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(text: string) {
  return (text.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [text]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/** "jbswy3dpehpk3pxp" becomes ["JBSW", "Y3DP", "EHPK", "3PXP"]. */
function groupsOf(secret: string): string[] {
  return secret.replace(/\s+/g, "").toUpperCase().match(/.{1,4}/g) ?? [];
}

/**
 * The key to type by hand: groups of four that wrap by group, never by
 * character, so all of it is in view at any width, beside a button that
 * copies it without the spaces an app might not expect.
 */
function SetupKey({ groups }: { groups: string[] }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(groups.join(""));
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = window.setTimeout(() => setState("idle"), 2200);
  }
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-muted/40 p-2 pl-4">
        <p className="flex min-w-0 flex-1 basis-44 flex-wrap gap-x-3.5 gap-y-0.5 py-1 font-mono text-[0.9375rem] tracking-[0.12em] select-all">
          {groups.map((group, index) => (
            <span key={`${index}-${group}`}>{group}</span>
          ))}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void copy()} className="ml-auto">
          {state === "copied" ? <IconCheck /> : <IconCopy />}
          {state === "copied" ? "Copied" : "Copy"}
        </Button>
      </div>
      <p role="status" className="mt-2 min-h-4 text-xs text-muted-foreground">
        {state === "copied" ? "Key copied to the clipboard." : null}
        {state === "failed" ? "Could not copy. Select the key and copy it by hand." : null}
      </p>
    </div>
  );
}

function Step({ number, title, as: Title, children }: { number: number; title: string; as: "h3" | "h4"; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4 before:absolute before:top-9 before:-bottom-6 before:left-3.5 before:w-px before:bg-border last:before:hidden">
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-border bg-muted text-xs font-medium tabular-nums">
        {number}
      </span>
      <div className="min-w-0 pt-0.5">
        <Title className="text-sm leading-6 font-medium">
          <span className="sr-only">Step {number}: </span>
          {title}
        </Title>
        <div className="mt-3">{children}</div>
      </div>
    </li>
  );
}

/**
 * Two-step sign-in, set up in one card: scan the QR code, or type the key by
 * hand, then prove it worked with the first six-digit code. The QR is your
 * own image or SVG, wrapped with alt text that carries the key, so nobody
 * needs a camera to finish. The key is shown in groups of four beside a copy
 * button, and a link opens the app on a phone. A wrong code is announced and
 * cleared so the next one can be typed at once; a right one swaps the card to
 * a done state with whatever should come next, and moves the focus there.
 */
export function AuthenticatorSetup({ qr, secret, issuer, accountLabel, otpauthUri, onVerify, onCancel, next, title = "Set up an authenticator app", description = "Use any app that makes six-digit codes. It takes about a minute.", headingLevel = 2, className }: AuthenticatorSetupProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const StepHeading = headingLevel === 3 ? "h4" : "h3";
  const id = useId();
  const boxes = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const groups = groupsOf(secret);
  const key = groups.join(" ");

  // The form, with the box and the button that had the focus, is replaced when the code is right, so the focus goes
  // to the confirmation (it is read out there) and the next action is one Tab away. After a wrong code the first box
  // gets it back; this runs once the boxes are enabled again, which a timer set earlier would not wait for.
  useEffect(() => {
    if (status === "done") doneRef.current?.focus();
    else if (status === "wrong") boxes.current?.querySelector("input")?.focus();
  }, [status]);

  async function verify(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (code.length < 6 || status === "verifying") return;
    setStatus("verifying");
    let right = false;
    try {
      right = (await onVerify(code)) === true;
    } catch {
      setStatus("failed");
      return;
    }
    if (right) {
      setStatus("done");
      return;
    }
    setStatus("wrong");
    setCode("");
  }

  return (
    <section data-slot="authenticator-setup" aria-labelledby={status === "done" ? undefined : `${id}-title`} aria-label={status === "done" ? "Authenticator setup complete" : undefined} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        {status === "done" ? (
          <div ref={doneRef} tabIndex={-1} className="outline-none">
            <ResultState
              tone="success"
              title="Authenticator app added"
              description={`From now on, signing in to ${issuer} asks for a six-digit code from your app, as well as your password.`}
              actions={next}
              className="py-14"
            />
          </div>
        ) : (
          <>
            <CardHeader className="px-6 pt-6 pb-6">
              <CardTitle asChild className="text-lg tracking-[-0.02em]">
                <Heading id={`${id}-title`}>{title}</Heading>
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <ol className="grid grid-cols-1 gap-8">
                <Step number={1} as={StepHeading} title="Scan this code">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                    <div
                      role="img"
                      aria-label={`QR code for ${issuer}, ${accountLabel}. If you cannot scan it, enter this key instead: ${key}.`}
                      className="grid size-40 shrink-0 place-items-center rounded-xl border border-border bg-white p-3 text-neutral-950 [&_img]:size-full [&_svg]:size-full"
                    >
                      <div aria-hidden="true" className="grid size-full place-items-center">
                        {qr}
                      </div>
                    </div>
                    <div className="min-w-0 text-sm text-muted-foreground">
                      <p>Open your authenticator app, choose Add account and point the camera at this code.</p>
                      <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                        <dt>Service</dt>
                        <dd className="font-medium text-foreground [overflow-wrap:anywhere]">{breakable(issuer)}</dd>
                        <dt>Account</dt>
                        <dd className="font-medium text-foreground [overflow-wrap:anywhere]">{breakable(accountLabel)}</dd>
                      </dl>
                    </div>
                  </div>
                </Step>

                <Step number={2} as={StepHeading} title="Or enter this key">
                  <p className="mb-3 text-sm text-muted-foreground">Cannot scan? Enter this setup key in your app instead.</p>
                  <SetupKey groups={groups} />
                  {otpauthUri ? (
                    <a href={otpauthUri} className="mt-1 inline-flex items-start gap-2 rounded-sm text-sm underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      <IconSmartphone className="mt-0.5 size-4 shrink-0" />
                      On your phone? Open it in your authenticator app
                    </a>
                  ) : null}
                </Step>

                <Step number={3} as={StepHeading} title="Enter the 6-digit code">
                  <form onSubmit={(event) => void verify(event)} className="grid grid-cols-1 gap-3">
                    <p className="text-sm text-muted-foreground">
                      Type the code your app shows now. It changes every 30 seconds.
                    </p>
                    <div ref={boxes}>
                      <OtpInput
                        label="Authenticator code"
                        groupAfter={3}
                        value={code}
                        onValueChange={(digits) => {
                          setCode(digits);
                          if (status === "wrong" || status === "failed") setStatus("idle");
                        }}
                        invalid={status === "wrong"}
                        disabled={status === "verifying"}
                      />
                    </div>
                    <p role="status" className="text-sm text-muted-foreground empty:hidden">
                      {status === "verifying" ? "Checking the code" : null}
                    </p>
                    {status === "wrong" || status === "failed" ? (
                      <p role="alert" className="text-sm text-destructive">
                        {status === "wrong" ? "That code did not match. Wait for the next one in your app and try again." : "We could not check the code just now. Try again in a moment."}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="submit" loading={status === "verifying"} disabled={code.length < 6}>
                        Verify
                      </Button>
                      {onCancel ? (
                        <Button type="button" variant="ghost" onClick={onCancel} disabled={status === "verifying"}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </Step>
              </ol>
            </CardContent>
          </>
        )}
      </Card>
    </section>
  );
}
