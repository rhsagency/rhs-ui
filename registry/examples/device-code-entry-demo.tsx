"use client";

import { useState, type ReactNode } from "react";

import { DeviceCodeEntry, type DeviceRequest } from "@rhs-ui/application/device-code-entry";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MACBOOK: DeviceRequest = { deviceName: "MacBook Pro", location: "Utrecht, Netherlands", requestedAt: "2026-11-02T14:27:00Z" };

// The device is in Utrecht, so the request time is written there, with the zone's name after it.
const WHERE = { locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function Help(): React.JSX.Element {
  return (
    <p className="text-xs leading-relaxed">
      The code is not showing?{" "}
      <a href="#help" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Start again on your device
      </a>
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  // Only WDJB-MJHT is a live code; BBBB-BBBB has expired; anything else is unknown. Your server decides, and the card only shows what it says.
  const lookUp = async (code: string): Promise<DeviceRequest | string> => {
    await wait(800);
    if (code === "WDJB-MJHT") return MACBOOK;
    if (code === "BBBB-BBBB") return "That code has expired. Start again on your device to get a new one.";
    return "We could not find that code. Check it against your device and try again.";
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Step one: type or paste the code, with or without the hyphen. Only its alphabet gets in">
          <DeviceCodeEntry
            titleAs="h2"
            {...WHERE}
            clientName="Acme CLI"
            account="ana.costa@northwind.studio"
            onSubmitCode={lookUp}
            onApprove={async () => {
              await wait(900);
              setNote("Approved. In your app this is where you issue the device its token.");
            }}
            onDeny={async () => {
              await wait(600);
              setNote("Denied. In your app this is where you drop the device request.");
            }}
            footer={<Help />}
          />
        </Step>

        <Step caption="A wrong or expired code is announced, and it stays in the boxes for correcting">
          <DeviceCodeEntry titleAs="h2" {...WHERE} clientName="Halcyon TV" defaultCode="BBBBBBBB" defaultError="That code has expired. Start again on your device to get a new one." onSubmitCode={lookUp} onApprove={() => undefined} onDeny={() => undefined} footer={<Help />} />
        </Step>

        <Step caption="Step two: which device it is, a plain warning, and Approve and Deny of one size">
          <DeviceCodeEntry titleAs="h2" {...WHERE} clientName="Acme CLI" account="ana.costa@northwind.studio" defaultCode="WDJBMJHT" defaultRequest={MACBOOK} onSubmitCode={lookUp} onApprove={() => undefined} onDeny={() => undefined} />
        </Step>

        <Step caption="The answer, shown and announced, with the next step said in words">
          <DeviceCodeEntry titleAs="h2" {...WHERE} clientName="Acme CLI" defaultCode="WDJBMJHT" defaultRequest={MACBOOK} defaultOutcome="approved" onSubmitCode={lookUp} onApprove={() => undefined} onDeny={() => undefined} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: type WDJB-MJHT to continue. BBBB-BBBB has expired. Typing a vowel or a digit says why it was not taken, and a code pasted in lower case, with or without the hyphen, is accepted."
        )}
      </p>
    </div>
  );
}
