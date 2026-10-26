"use client";

import { useState, type ReactNode } from "react";

import { SetNewPassword } from "@rhs-ui/application/set-new-password";
import { IconCheck } from "@rhs-ui/icons";
import type { PasswordRule } from "@rhs-ui/primitives/password-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const RULES: readonly PasswordRule[] = [
  { label: "At least 12 characters", test: (value) => value.length >= 12 },
  { label: "A lower case and an upper case letter", test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "A number", test: (value) => /\d/.test(value) },
  { label: "A symbol, like ! ? # or %", test: (value) => /[^\p{L}\p{N}\s]/u.test(value) },
];

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function Support(): React.JSX.Element {
  return (
    <p>
      Link not working?{" "}
      <a href="#support" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Contact support
      </a>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="The form: the rules tick off as you type">
          <SetNewPassword
            titleAs="h2"
            email="ana.costa@northwind.studio"
            rules={RULES}
            footer={<Support />}
            onBackToSignIn={() => setNote("Going back to sign in.")}
            onSubmit={async ({ password, signOutOthers }) => {
              await wait(1000);
              if (/password/i.test(password)) return "That password has appeared in a known data breach. Choose a different one.";
              setNote(signOutOthers ? "Saved, and every other device was signed out." : "Saved. Other devices stay signed in.");
            }}
          />
        </Step>

        <Step caption="Done: the card turns into a confirmation, with the way back to sign in">
          <SetNewPassword titleAs="h2" email="ana.costa@northwind.studio" defaultDone onBackToSignIn={() => setNote("Continuing to sign in.")} onSubmit={() => undefined} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: a password with the word password in it is refused once with a message; anything that meets the rules is accepted."
        )}
      </p>
    </div>
  );
}
