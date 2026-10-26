"use client";

import { useRef, useState, type ReactNode } from "react";

import { VerificationMethodPicker, type VerificationMethod } from "@rhs-ui/application/verification-method-picker";
import { IconCheck, IconFileText, IconKey, IconMessage, IconSmartphone } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const AUTHENTICATOR: VerificationMethod = { id: "authenticator", label: "Authenticator app", description: "Code from your authenticator app", icon: <IconSmartphone /> };
const RECOVERY: VerificationMethod = { id: "recovery", label: "Recovery code", description: "One of the ten codes you saved when you set this up", icon: <IconFileText /> };

const NARROW: VerificationMethod[] = [
  AUTHENTICATOR,
  { id: "key", label: "Security key", description: "Touch your key when it lights up", icon: <IconKey />, unavailableReason: "No key found. Plug it in and try again." },
  { id: "sms", label: "Text message", description: "Text to a number ending 34", icon: <IconMessage />, unavailableReason: "Too many texts sent. Try again in 12 minutes." },
  RECOVERY,
];

const OPEN: VerificationMethod[] = [
  AUTHENTICATOR,
  { id: "key", label: "Security key", description: "Touch your key when it lights up", icon: <IconKey /> },
  { id: "sms", label: "Text message", description: "Text to a number ending 34", icon: <IconMessage /> },
];

const NONE: VerificationMethod[] = [
  { id: "sms", label: "Text message", description: "Text to a number ending 34", icon: <IconMessage />, unavailableReason: "Too many texts sent. Try again in 12 minutes." },
  { id: "key", label: "Security key", description: "Touch your key when it lights up", icon: <IconKey />, unavailableReason: "No key found. Plug it in and try again." },
];

function Step({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <figure className={className ? `grid gap-3 ${className}` : "grid gap-3"}>
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function Help({ onRecovery }: { onRecovery: () => void }): React.JSX.Element {
  return (
    <p>
      Can&rsquo;t use any of these?{" "}
      <button type="button" onClick={onRecovery} className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Contact support
      </button>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const [picked, setPicked] = useState("authenticator");
  const textFailedOnce = useRef(false);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Last used is chosen first; what is paused says why">
          <VerificationMethodPicker
            titleAs="h2"
            methods={NARROW}
            lastUsed="authenticator"
            value={picked}
            onValueChange={setPicked}
            onBack={() => setNote("Going back to the code entry.")}
            help={<Help onRecovery={() => setNote("Opening support.")} />}
            onContinue={async (id) => {
              await wait(1000);
              setNote(`Starting ${id}. In your app this is where the code entry opens.`);
            }}
          />
        </Step>

        <Step caption="Everything is available: the text message was last used">
          <VerificationMethodPicker
            titleAs="h2"
            methods={OPEN}
            lastUsed="sms"
            onBack={() => setNote("Going back to the code entry.")}
            onContinue={async (id) => {
              await wait(1000);
              // The first text fails once, so the message and the kept choice show; the note stays quiet until something worked, so it never contradicts the card.
              if (id === "sms" && !textFailedOnce.current) {
                textFailedOnce.current = true;
                setNote("");
                return "We could not send the text. Try again, or choose another way.";
              }
              setNote(id === "sms" ? "Text sent to the number ending 34." : `Starting ${id}.`);
            }}
          />
        </Step>

        <Step caption="Nothing can be used right now: every reason is shown, and there is a way out" className="lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-md">
          <VerificationMethodPicker titleAs="h2" methods={NONE} onBack={() => setNote("Going back.")} help={<Help onRecovery={() => setNote("Opening support.")} />} onContinue={() => undefined} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: arrow keys choose, but nothing starts until Continue is pressed. The second card fails once on the text message so the message shows."
        )}
      </p>
    </div>
  );
}
