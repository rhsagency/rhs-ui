"use client";

import { useRef, useState, type ReactNode } from "react";

import { AsyncSwitch, type AsyncSwitchStatus } from "@rhs-ui/primitives/async-switch";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "rounded-xl border border-border bg-card shadow-xs";

function Settings(): React.JSX.Element {
  const [email, setEmail] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [digest, setDigest] = useState(false);
  const attempts = useRef(0);
  return (
    <div className={card}>
      <div className="grid gap-1 border-b border-border p-5">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Notifications</h2>
        <p className="text-xs text-muted-foreground">Every switch saves the moment you flip it.</p>
      </div>
      <div className="grid divide-y divide-border">
        <div className="p-5">
          <AsyncSwitch
            label="Email notifications"
            description="Get an email when someone mentions you in Halcyon."
            checked={email}
            onCheckedChange={async (next) => {
              await wait(900);
              setEmail(next);
            }}
          />
        </div>
        <div className="p-5">
          <AsyncSwitch
            label="Two-factor authentication"
            description="Ask for a code on every new device. The first save fails, so you can see the rollback and retry."
            checked={twoFactor}
            onCheckedChange={async (next) => {
              attempts.current += 1;
              await wait(1100);
              if (attempts.current === 1) throw new Error("The settings service did not answer.");
              setTwoFactor(next);
            }}
          />
        </div>
        <div className="p-5">
          <AsyncSwitch
            label="Weekly digest"
            description="A summary of what changed in your projects, every Monday. This one takes its time."
            checked={digest}
            successMessage="Digest updated"
            onCheckedChange={async (next) => {
              await wait(2600);
              setDigest(next);
            }}
          />
        </div>
      </div>
    </div>
  );
}

const STATES: { status: AsyncSwitchStatus; label: string; checked: boolean; description: string }[] = [
  { status: "idle", label: "Idle", checked: false, description: "At rest." },
  { status: "pending", label: "Pending", checked: true, description: "Moved at once, a spinner in the thumb." },
  { status: "success", label: "Saved", checked: true, description: "A quiet check, for two seconds." },
  { status: "error", label: "Failed", checked: false, description: "Rolled back, with a way to try again." },
];

export default function Demo(): React.JSX.Element {
  const [retried, setRetried] = useState(0);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: flip a switch. It moves at once, waits for the request and says how it went.">
        <Settings />
      </Example>
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Every state, driven from outside with status={mutation.status}">
          <div className={`${card} grid divide-y divide-border`}>
            {STATES.map((state) => (
              <div key={state.status} className="p-4">
                <AsyncSwitch
                  status={state.status}
                  checked={state.checked}
                  label={state.label}
                  description={state.description}
                  onCheckedChange={() => {
                    if (state.status === "error") setRetried((count) => count + 1);
                  }}
                />
              </div>
            ))}
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {retried === 0 ? "Press Retry on the failed one: it calls onCheckedChange with the position that failed." : `Retry was pressed ${retried} ${retried === 1 ? "time" : "times"}.`}
          </p>
        </Example>
        <Example caption="Disabled">
          <div className={`${card} p-4`}>
            <AsyncSwitch disabled label="Audit log export" description="Turned on by your workspace admin." defaultChecked />
          </div>
        </Example>
      </div>
    </div>
  );
}
