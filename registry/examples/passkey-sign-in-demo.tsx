"use client";

import { useState, type ReactNode } from "react";

import { PasskeySignIn, type PasskeyError, type PasskeyFallback } from "@rhs-ui/application/passkey-sign-in";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [error, setError] = useState<PasskeyError | null>(null);
  const [note, setNote] = useState("");
  const [attempt, setAttempt] = useState(0);

  const fallbacks: readonly PasskeyFallback[] = [
    { id: "password", label: "Use a password instead", onSelect: () => setNote("Opening the password sign-in.") },
    { id: "link", label: "Email me a link", onSelect: () => setNote("Opening the email link sign-in.") },
  ];

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Passkey first: press the button">
          <PasskeySignIn
            titleAs="h2"
            fallbacks={fallbacks}
            error={error}
            onPasskey={async () => {
              setError(null);
              setNote("");
              await wait(1600);
              // The first press ends as a cancelled prompt, so the error shows; the second one signs in.
              if (attempt === 0) {
                setAttempt(1);
                setError("cancelled");
                return;
              }
              setAttempt(0);
              setNote("Signed in with a passkey. In your app this is where the redirect happens.");
            }}
          />
        </Step>

        <Step caption="Waiting for the browser prompt">
          <PasskeySignIn titleAs="h2" busy fallbacks={fallbacks} defaultEmail="anna@northwind.studio" onPasskey={() => undefined} />
        </Step>

        <Step caption="No passkey on this device">
          <PasskeySignIn titleAs="h2" error="not-found" fallbacks={fallbacks} onPasskey={() => undefined} />
        </Step>

        <Step caption="A browser without passkeys">
          <PasskeySignIn titleAs="h2" supported={false} fallbacks={fallbacks} onPasskey={() => undefined} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Press the button in the first card: it waits for your device, ends once as a closed prompt, and signs in on the second press. Click the word passkey for its explanation."
        )}
      </p>
    </div>
  );
}
