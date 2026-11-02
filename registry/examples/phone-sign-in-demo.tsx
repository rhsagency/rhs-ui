"use client";

import { useState, type ReactNode } from "react";

import { PhoneSignIn } from "@rhs-ui/application/phone-sign-in";
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

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  // The request itself fails, not the number: a number ending in 0000 shows the retry message.
  const requestCode = async (phone: string) => {
    await wait(900);
    if (phone.endsWith("0000")) throw new Error("The SMS provider did not answer.");
    setNote(`A text with the code 123456 is on its way to ${phone}. In your app this is where you call your SMS provider.`);
  };

  const verify = async (code: string) => {
    await wait(800);
    if (code !== "123456") return false;
    setNote("Verified. In your app this is where you sign the person in and navigate on.");
    return true;
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Step one: a number with its country code, checked when the field is left">
          <PhoneSignIn titleAs="h2" onRequestCode={requestCode} onVerify={verify} onUseEmail={() => setNote("Opening the email sign-in.")} smsNotice="Message and data rates may apply." footer={<Terms />} />
        </Step>

        <Step caption="A number that cannot be right is caught with its shape in words">
          <PhoneSignIn
            titleAs="h2"
            defaultCountry="US"
            defaultPhone="+141555501"
            defaultError="Enter a US or Canadian number: 10 digits after +1, like 415 555 0132."
            onRequestCode={requestCode}
            onVerify={verify}
            smsNotice="Message and data rates may apply."
          />
        </Step>

        <Step caption="Step two: six boxes, the number it went to, and a resend that counts down">
          <PhoneSignIn titleAs="h2" defaultPhone="+31612345678" defaultSent onRequestCode={requestCode} onVerify={verify} onUseEmail={() => setNote("Opening the email sign-in.")} />
        </Step>

        <Step caption="A wrong code is announced and the boxes are cleared, the first one focused">
          <PhoneSignIn titleAs="h2" defaultPhone="+447400123456" defaultSent defaultCodeError="That code is not right. Check the message and try again." onRequestCode={requestCode} onVerify={verify} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: type a number, ask for the code and enter 123456. Any other code is wrong. A number ending in 0000 makes the request fail, so the retry message shows."
        )}
      </p>
    </div>
  );
}
