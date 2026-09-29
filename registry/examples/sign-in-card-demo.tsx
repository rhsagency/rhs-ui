"use client";

import { useState } from "react";

import { SignInCard } from "@rhs-ui/application/sign-in-card";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [signedIn, setSignedIn] = useState<string | null>(null);

  if (signedIn) {
    return (
      <div className="flex min-h-[36rem] flex-col items-center justify-center gap-4 text-center" role="status">
        <p className="text-lg font-medium">Signed in as {signedIn}.</p>
        <Button variant="outline" onClick={() => setSignedIn(null)}>
          Back to the form
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[36rem] items-center justify-center">
      <SignInCard
        titleAs="h2"
        onSubmit={async ({ email, password }) => {
          await new Promise((resolve) => setTimeout(resolve, 700));
          if (password !== "fieldwork") return "That email and password do not match. Try fieldwork as the password.";
          setSignedIn(email);
        }}
        providers={
          <>
            <Button variant="outline" type="button">
              Continue with GitHub
            </Button>
            <Button variant="outline" type="button">
              Continue with Google
            </Button>
          </>
        }
        forgotPassword={
          <a href="#reset" className="underline-offset-4 hover:text-foreground hover:underline">
            Forgot it?
          </a>
        }
        footer={
          <span>
            No account yet?{" "}
            <a href="#sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create one
            </a>
          </span>
        }
      />
    </div>
  );
}
