"use client";

import { useState, type ReactNode } from "react";

import { MagicLinkSignIn, type MagicLinkRequest } from "@rhs-ui/application/magic-link-sign-in";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function requestLink({ email }: MagicLinkRequest): Promise<void> {
  await wait(900);
  // The request itself fails, not the address: an address with "offline" in it shows the retry message.
  if (email.includes("offline")) throw new Error("The mail service did not answer.");
}

function Terms(): React.JSX.Element {
  return (
    <p className="text-xs leading-relaxed">
      By continuing you agree to the{" "}
      <a href="#terms" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Terms
      </a>{" "}
      and the{" "}
      <a href="#privacy" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Privacy policy
      </a>
      .
    </p>
  );
}

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Ask for a link">
          <MagicLinkSignIn titleAs="h2" onRequestLink={requestLink} onUsePassword={() => setNote("Opening the password sign-in.")} footer={<Terms />} />
        </Step>
        <Step caption="The link is sent: the wait starts, and the resend button counts it down">
          <MagicLinkSignIn
            titleAs="h2"
            defaultEmail="anna@northwind.studio"
            defaultSent
            signedIn={opened}
            onRequestLink={requestLink}
            onUsePassword={() => setNote("Opening the password sign-in.")}
            onSignedIn={() => setNote("Continuing to the app.")}
          />
        </Step>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-muted-foreground">
        <Button size="sm" variant="outline" onClick={() => setOpened((value) => !value)}>
          {opened ? "Show the confirmation again" : "Pretend the link was opened in another tab"}
        </Button>
        <p aria-live="polite">{note || "Preview tip: an address with offline in it makes the request fail once, so the retry message shows."}</p>
      </div>
    </div>
  );
}
