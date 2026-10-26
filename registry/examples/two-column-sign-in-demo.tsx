"use client";

import { useState } from "react";

import { TwoColumnSignIn } from "@rhs-ui/application/two-column-sign-in";
import { IconCheck, IconFingerprint, IconKey } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A drawn portrait as a data URI, so the preview needs no image host.
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');

function Wordmark(): React.JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 text-[1.0625rem] font-semibold tracking-[-0.04em]">
      <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-primary text-[0.8125rem] leading-none text-primary-foreground">
        N
      </span>
      Northwind
    </span>
  );
}

export default function Demo(): React.JSX.Element {
  const [signedIn, setSignedIn] = useState<string | null>(null);

  if (signedIn) {
    return (
      <section aria-live="polite" className="grid min-h-svh place-items-center bg-background px-6 text-foreground">
        <div className="grid max-w-sm justify-items-center gap-4 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
            <IconCheck className="size-5" />
          </span>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">You are signed in</h2>
          <p className="text-sm text-muted-foreground">Welcome back, {signedIn}. In your app this is where the redirect happens.</p>
          <Button variant="outline" onClick={() => setSignedIn(null)}>
            Back to the form
          </Button>
        </div>
      </section>
    );
  }

  return (
    <TwoColumnSignIn
      titleAs="h2"
      brand={<Wordmark />}
      forgotHref="#forgot"
      asideLabel="Customer story"
      providers={
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button type="button" variant="outline" size="lg">
            <IconKey />
            Single sign-on
          </Button>
          <Button type="button" variant="outline" size="lg">
            <IconFingerprint />
            Passkey
          </Button>
        </div>
      }
      onSubmit={async ({ email, password }) => {
        await wait(900);
        if (password === "wrong") return "That email and password do not match. Check them and try again, or reset your password.";
        setSignedIn(email);
      }}
      footer={
        <div className="grid gap-1.5">
          <p>
            New to Northwind?{" "}
            <a href="#signup" className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Start a free trial
            </a>
          </p>
          <p className="text-xs">Preview tip: any email and password signs in, and the password &ldquo;wrong&rdquo; shows the error.</p>
        </div>
      }
      aside={
        <div className="flex h-full flex-col justify-between gap-16">
          <div className="flex h-10 items-center">
            <p className="text-sm text-muted-foreground">Customer story</p>
          </div>
          <figure className="grid gap-8">
            <blockquote className="text-2xl leading-snug font-medium tracking-[-0.03em] text-balance xl:text-3xl">
              &ldquo;Northwind cut our weekly reporting from a full day to ten minutes. We stopped dreading Mondays.&rdquo;
            </blockquote>
            <figcaption className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage src={PORTRAIT} alt="" />
                <AvatarFallback>IV</AvatarFallback>
              </Avatar>
              <span className="grid text-sm">
                <span className="font-medium">Imke Visser</span>
                <span className="text-muted-foreground">Head of Operations, Halcyon Freight</span>
              </span>
            </figcaption>
          </figure>
        </div>
      }
    />
  );
}
