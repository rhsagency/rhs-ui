"use client";

import { useState, type ReactNode } from "react";

import { SuspiciousActivityAlert, type SuspiciousActivityEvent, type SuspiciousActivityStep } from "@rhs-ui/application/suspicious-activity-alert";
import { Button } from "@rhs-ui/primitives/button";

// The address is passed in full, on purpose: the alert hides its last two parts itself, so a mistake upstream cannot put one on screen.
const EVENT: SuspiciousActivityEvent = { device: "Chrome on Windows", place: "Utrecht, Netherlands", at: "2026-11-01T13:32:00Z", ip: "203.0.113.42" };

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [log, setLog] = useState("Nothing answered yet.");
  const [signedOut, setSignedOut] = useState(0);

  const steps: readonly SuspiciousActivityStep[] = [
    { id: "password", label: "Change your password", description: "Pick one you have not used on any other site.", actionLabel: "Change password", href: "#password" },
    {
      id: "sessions",
      label: "Sign out other sessions",
      description: "Anyone who is signed in somewhere else will have to sign in again.",
      actionLabel: "Sign out",
      onSelect: async () => {
        await wait(900);
        setSignedOut((count) => count + 1);
      },
    },
  ];

  return (
    <div className="grid w-full max-w-xl gap-9">
      <Case caption="Everything needed to judge it, and two clear answers. Nothing has focus when it appears, and the destructive answer is never the default.">
        <SuspiciousActivityAlert
          key={round}
          event={EVENT}
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          steps={steps}
          onConfirm={async () => {
            await wait(700);
            setLog("Yes, it was me: the alert folded away.");
          }}
          onSecure={async () => {
            await wait(900);
            setLog("No, secure my account: onSecure ran, and the next steps showed.");
          }}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setRound((count) => count + 1);
              setLog("Nothing answered yet.");
            }}
          >
            Bring the alert back
          </Button>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {log}
          </p>
        </div>
      </Case>

      <Case caption="After No: the steps replace the answers, and the focus moves to them. A step is a button when it has somewhere to go, or something to run.">
        <SuspiciousActivityAlert event={EVENT} timeZone="Europe/Amsterdam" locale="en-GB" steps={steps} defaultStep="secured" labels={{ securedTitle: "Secure your account now" }} />
        <p className="text-xs text-muted-foreground tabular-nums">
          Sign out was pressed {signedOut} {signedOut === 1 ? "time" : "times"}. Here it waits a moment and counts.
        </p>
      </Case>
    </div>
  );
}
