"use client";

import { useState } from "react";

import { IconFingerprint, IconMail } from "@rhs-ui/icons";
import { CheckoutSignInChoice } from "@rhs-ui/commerce/checkout-sign-in-choice";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [result, setResult] = useState("Send an empty form to see the checks. Sign in as mira@northwind.example with the password northwind, or with anything else to see the error.");

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-6 py-6">
      <CheckoutSignInChoice
        headingAs="h2"
        forgotHref="#forgot"
        createAccountHref="#create-account"
        defaultEmail="mira@northwind.example"
        providers={
          <>
            <Button type="button" variant="outline" className="w-full">
              <IconFingerprint />
              Sign in with a passkey
            </Button>
            <Button type="button" variant="outline" className="w-full">
              <IconMail />
              Email me a sign-in link
            </Button>
          </>
        }
        onSignIn={async ({ email, password }) => {
          await wait(600);
          if (email === "mira@northwind.example" && password === "northwind") {
            setResult("Signed in as Mira. The shopper would now go on to the delivery step.");
            return;
          }
          return "That email and password do not match. Check them and try again, or reset your password.";
        }}
        onContinueAsGuest={async (email) => {
          await wait(500);
          if (email.endsWith("@northwind.example")) return "That address belongs to a staff account. Sign in instead, or use a personal email.";
          setResult(`Continuing as a guest with ${email}. The shopper would now go on to the delivery step.`);
        }}
      />
      <p role="status" className="mx-auto mt-2 max-w-xl text-center text-xs text-muted-foreground">
        {result}
      </p>
    </div>
  );
}
