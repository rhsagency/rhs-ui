"use client";

import { useState, type ReactNode } from "react";

import { PinLockScreen } from "@rhs-ui/application/pin-lock-screen";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A drawn portrait as a data URI, so the preview needs no image host: a head and shoulders on a quiet ground.
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');

// The tills are in Utrecht, so the lock time is written there.
const WHERE = { locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

// The screens sit in frames here so several fit on one page; in an app the screen fills the viewport, which is what it does by default.
const FRAME = "min-h-0 rounded-xl border border-border py-10";

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [attempts, setAttempts] = useState(3);
  const [note, setNote] = useState("");

  // Counting the tries is yours: a wrong PIN costs one, and the screen says how many are left.
  const unlock = async (pin: string) => {
    await wait(500);
    if (pin === "1234") {
      setNote("Unlocked. In your app this is where the session opens again.");
      setAttempts(3);
      return true;
    }
    setAttempts((left) => Math.max(0, left - 1));
    return false;
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2">
        <Step caption="Type on the keys or on the keyboard: Backspace deletes, Escape clears. The right PIN is 1234">
          <PinLockScreen
            titleAs="h2"
            {...WHERE}
            className={FRAME}
            user={{ name: "Maya Okafor", detail: "Till 3, Northwind Kitchen" }}
            lockedAt="2026-11-02T14:32:00Z"
            attemptsLeft={attempts}
            onUnlock={unlock}
            onForgot={() => setNote("Opening the PIN reset.")}
            onSignOut={() => setNote("Signed out.")}
          />
        </Step>

        <Step caption="A wrong PIN: the dots turn red and shake once, the PIN clears and the tries left are said">
          <PinLockScreen
            titleAs="h2"
            {...WHERE}
            className={FRAME}
            keyboard={false}
            defaultWrong
            attemptsLeft={2}
            user={{ name: "Priya Nair", detail: "Till 1, Northwind Kitchen" }}
            lockedAt="2026-11-02T14:32:00Z"
            onUnlock={() => false}
            onForgot={() => undefined}
            onSignOut={() => undefined}
          />
        </Step>

        <Step caption="Out of tries: the keys stop and signing out is the way on">
          <PinLockScreen
            titleAs="h2"
            {...WHERE}
            className={FRAME}
            keyboard={false}
            defaultWrong
            attemptsLeft={0}
            user={{ name: "Tomas Brandt", detail: "Till 2, Northwind Kitchen" }}
            lockedAt="2026-11-02T14:32:00Z"
            onUnlock={() => false}
            onForgot={() => undefined}
            onSignOut={() => undefined}
          />
        </Step>

        <Step caption="Six digits, with a portrait: the dots follow the length you give">
          <PinLockScreen
            titleAs="h2"
            {...WHERE}
            className={FRAME}
            keyboard={false}
            length={6}
            user={{ name: "Jonas Lindqvist", image: PORTRAIT, detail: "Reception" }}
            lockedAt="2026-11-02T09:05:00Z"
            onUnlock={() => false}
            onForgot={() => undefined}
            onSignOut={() => undefined}
          />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: three wrong PINs lock the first screen, and the right one resets the count. The digits are never in the page, and a held key does not repeat."
        )}
      </p>
    </div>
  );
}
