"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { PermissionPrimer, type PermissionPrimerKind, type PermissionPrimerState } from "@rhs-ui/application/permission-primer";
import { Button } from "@rhs-ui/primitives/button";

const KINDS: readonly PermissionPrimerKind[] = ["notifications", "camera", "microphone", "location"];

const BENEFITS: Record<PermissionPrimerKind, string> = {
  notifications: "Hear about replies and mentions the moment they happen, even when Kestrel is in another tab.",
  camera: "Scan a receipt or a barcode straight into an expense, without leaving the page.",
  microphone: "Record a voice note on a job and have it written up for you.",
  location: "Find the Northwind depots nearest to you, and see who is open now.",
};

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function forget() {
  for (const kind of KINDS) {
    try {
      window.localStorage.removeItem(`demo-primer-${kind}`);
    } catch {
      // Storage is blocked: there is nothing to forget.
    }
  }
}

/** A card that keeps its own permission, the way an app would: the answer comes back from `onRequest` and is stored. */
function LiveCard({ kind, answer }: { kind: PermissionPrimerKind; answer: PermissionPrimerState }): React.JSX.Element {
  const [state, setState] = useState<PermissionPrimerState>("default");
  /** The browser's own question: the demo waits a moment, then gives the answer picked above. */
  const request = () => new Promise<PermissionPrimerState>((resolve) => window.setTimeout(() => resolve(answer), 1100));
  return <PermissionPrimer kind={kind} benefit={BENEFITS[kind]} state={state} onStateChange={setState} onRequest={request} storageKey={`demo-primer-${kind}`} />;
}

export default function Demo(): React.JSX.Element {
  const [answer, setAnswer] = useState<PermissionPrimerState>("granted");
  const [round, setRound] = useState(0);

  return (
    <div className="grid w-full max-w-3xl gap-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <p className="text-sm font-medium">When the browser asks, the answer is</p>
        <SegmentedControl
          label="The browser's answer"
          value={answer}
          onValueChange={(value) => setAnswer(value as PermissionPrimerState)}
          options={[
            { value: "granted", label: "Allow" },
            { value: "denied", label: "Block" },
            { value: "default", label: "Dismiss" },
          ]}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            forget();
            setRound((count) => count + 1);
          }}
        >
          Start over
        </Button>
      </div>

      <Case caption="The ask: the benefit in one line, then what happens next. The browser's own question opens only when Allow is pressed. Not now is remembered on this device.">
        <LiveCard key={`notifications-${round}`} kind="notifications" answer={answer} />
      </Case>

      <div className="grid items-start gap-x-6 gap-y-8 md:grid-cols-2">
        <div className="grid min-w-0 content-start gap-8">
          <Case caption="Allowed: a quiet line, nothing more.">
            <PermissionPrimer kind="camera" benefit={BENEFITS.camera} state="granted" />
          </Case>
          <Case caption="The same card for the microphone.">
            <LiveCard key={`microphone-${round}`} kind="microphone" answer={answer} />
          </Case>
        </div>
        <div className="grid min-w-0 content-start gap-8">
          <Case caption="Blocked: the prompt cannot be shown again, so the card says how to turn it back on.">
            <PermissionPrimer kind="notifications" benefit={BENEFITS.notifications} state="denied" />
          </Case>
          <Case caption="And for location.">
            <LiveCard key={`location-${round}`} kind="location" answer={answer} />
          </Case>
        </div>
      </div>
    </div>
  );
}
