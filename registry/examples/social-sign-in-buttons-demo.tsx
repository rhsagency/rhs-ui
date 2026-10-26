"use client";

import { useRef, useState, type ReactNode } from "react";

import { SocialSignInButtons, type SignInProvider } from "@rhs-ui/application/social-sign-in-buttons";
import { IconKey } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const PROVIDERS: SignInProvider[] = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "apple", label: "Apple" },
];
const MORE: SignInProvider[] = [...PROVIDERS, { id: "microsoft", label: "Microsoft" }];
// A team's own mark replaces the monogram: here a key, for company single sign-on.
const WITH_SSO: SignInProvider[] = [...PROVIDERS, { id: "sso", label: "SSO", mark: <IconKey /> }];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function SignInCard(): React.JSX.Element {
  const [message, setMessage] = useState("");
  // Apple fails the first time, so the message can be seen.
  const failed = useRef(false);
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xs sm:p-7">
      <h2 className="text-xl leading-snug font-semibold tracking-[-0.02em]">Welcome back to Halcyon</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Sign in to pick up where you left off.</p>
      <div className="mt-6">
        <SocialSignInButtons
          providers={PROVIDERS}
          lastUsed="github"
          divider="or continue with email"
          onSelect={async (id) => {
            await wait(1100);
            if (id === "apple" && !failed.current) {
              failed.current = true;
              throw new Error("offline");
            }
            setMessage(`Signed in with ${PROVIDERS.find((provider) => provider.id === id)?.label ?? id}. A real app would redirect now.`);
          }}
        />
      </div>
      <form
        className="mt-5 grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <div className="grid gap-1.5">
          <Label htmlFor="sign-in-email">Email</Label>
          <Input id="sign-in-email" type="email" autoComplete="email" placeholder="you@halcyon.example" />
        </div>
        <Button type="submit">Continue</Button>
      </form>
      <p role="status" className="mt-4 min-h-4 text-xs text-muted-foreground">
        {message || "Apple fails the first time you press it, to show the message."}
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="At the top of a sign-in form. GitHub was used last, so it moves first and gets a tag; a press shows a spinner there and disables the rest.">
        <SignInCard />
      </Example>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <Example caption="Two to a row, with the short name">
          <SocialSignInButtons providers={MORE} layout="grid" size="default" lastUsed="google" onSelect={() => wait(1200)} />
        </Example>
        <Example caption="Icons only: each button keeps its full name and gets a tooltip">
          <SocialSignInButtons providers={WITH_SSO} layout="icons" lastUsed="apple" label="Sign-up options" onSelect={() => wait(1200)} />
        </Example>
        <Example caption="Busy: GitHub is working, the others are disabled">
          <SocialSignInButtons providers={PROVIDERS} busy="github" size="default" labelPrefix="Sign up with" />
        </Example>
      </div>
    </div>
  );
}
