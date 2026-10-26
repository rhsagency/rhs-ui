"use client";

import { useState, type ReactNode } from "react";

import { VerifyEmailCard } from "@rhs-ui/application/verify-email-card";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function SignOut(): React.JSX.Element {
  return (
    <p>
      Wrong account?{" "}
      <a href="#sign-out" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Sign out
      </a>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Link mode, a Gmail address: the shortcut opens the inbox">
          <VerifyEmailCard
            titleAs="h2"
            email="ana.costa@gmail.com"
            verified={opened}
            footer={<SignOut />}
            onResend={() => wait(900)}
            onChangeEmail={async (address) => {
              await wait(800);
              if (address.toLowerCase().includes("taken")) return "That address already has a Northwind account. Sign in with it instead.";
            }}
            onVerified={() => setNote("Continuing to Northwind. In your app this is where the redirect happens.")}
          />
        </Step>

        <Step caption="Code mode, an Outlook address: six boxes, and the code 482913 is accepted">
          <VerifyEmailCard
            titleAs="h2"
            mode="code"
            email="tom.berg@outlook.com"
            onResend={() => wait(900)}
            onChangeEmail={() => wait(800)}
            onVerify={async (code) => {
              await wait(800);
              if (code !== "482913") return "That code is not right. Check the email and try again.";
            }}
            onVerified={() => setNote("Code accepted. In your app this is where the redirect happens.")}
          />
        </Step>

        <Step caption="Change email: the address turns into a field, a typo fixed in place">
          <VerifyEmailCard
            titleAs="h2"
            email="anna.visser@gmial.com"
            defaultEditing
            resendAfter={45}
            onResend={() => wait(900)}
            onChangeEmail={() => wait(800)}
          />
        </Step>

        <Step caption="Verified: your app saw the address confirmed">
          <VerifyEmailCard titleAs="h2" email="imke@kestrel.studio" verified onResend={() => wait(900)} onVerified={() => setNote("Continuing to Kestrel.")} />
        </Step>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-muted-foreground">
        <Button size="sm" variant="outline" onClick={() => setOpened((value) => !value)}>
          {opened ? "Show the first card waiting again" : "Pretend the link was opened in another tab"}
        </Button>
        <p aria-live="polite">{note || "Preview tip: an address with taken in it makes Change email fail with a message."}</p>
      </div>
    </div>
  );
}
