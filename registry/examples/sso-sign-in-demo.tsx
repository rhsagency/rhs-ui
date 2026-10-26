"use client";

import { useState, type ReactNode } from "react";

import { SsoSignIn, type SsoResolution } from "@rhs-ui/application/sso-sign-in";
import { IconCheck, IconGlobe, IconKey, IconShieldCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A stand-in for your own endpoint: which companies have single sign-on, and with whom.
const DIRECTORY: Record<string, SsoResolution> = {
  "acme.io": {
    organisation: "Acme",
    providers: [{ id: "acme-okta", name: "Okta", description: "Sign in with your Acme Okta account" }],
  },
  "halcyon-freight.com": {
    organisation: "Halcyon International Freight & Logistics",
    providers: [{ id: "halcyon-okta", name: "Okta", description: "Sign in with your Halcyon account" }],
  },
  "northwind.studio": {
    organisation: "Northwind",
    providers: [
      { id: "northwind-entra", name: "Microsoft Entra ID", description: "Employees and contractors", icon: <IconShieldCheck /> },
      { id: "northwind-google", name: "Google Workspace", description: "Partner agencies", icon: <IconGlobe /> },
      { id: "northwind-okta", name: "Okta", description: "The engineering group", icon: <IconKey /> },
    ],
  },
};

const lookup = (delay: number) => async (domain: string): Promise<SsoResolution | null> => {
  await wait(delay);
  if (domain === "offline.example") throw new Error("The directory did not answer.");
  return DIRECTORY[domain] ?? null;
};

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const props = {
    titleAs: "h2" as const,
    helpHref: "#sso-help",
    onUsePassword: () => setNote("Opening the password sign-in."),
    onContinue: async ({ domain, providerId }: { domain: string; providerId: string }) => {
      await wait(800);
      setNote(`Redirecting to ${providerId} for ${domain}. In your app this is where the redirect happens.`);
    },
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Live: type ana@acme.io, ana@northwind.studio or ana@gmail.com">
          <SsoSignIn {...props} resolveDomain={lookup(900)} />
        </Step>
        <Step caption="One provider: the button names the company">
          <SsoSignIn {...props} defaultEmail="ana.costa@acme.io" debounceMs={0} resolveDomain={lookup(0)} />
        </Step>
        <Step caption="Several providers: tiles, and nothing is preselected">
          <SsoSignIn {...props} defaultEmail="ana.costa@northwind.studio" debounceMs={0} resolveDomain={lookup(0)} />
        </Step>
        <Step caption="No single sign-on for this domain: the password route leads">
          <SsoSignIn {...props} defaultEmail="ana.costa@kestrel.studio" debounceMs={0} resolveDomain={lookup(0)} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: the first card waits for you to stop typing, shows a spinner in the field while it looks up, and keeps taking keys. An address at halcyon-freight.com has a long company name, which wraps on the button, and one at offline.example makes the lookup fail."
        )}
      </p>
    </div>
  );
}
