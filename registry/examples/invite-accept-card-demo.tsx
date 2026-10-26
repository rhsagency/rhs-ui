"use client";

import { useRef, useState, type ReactNode } from "react";

import { InviteAcceptCard } from "@rhs-ui/application/invite-accept-card";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const svg = (body: string, size = 96) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${body}</svg>`);

// Drawn pictures as data URIs, so the preview needs no image host: a mark for the workspace and a portrait for the person.
const NORTHWIND_LOGO = svg('<rect width="96" height="96" fill="#161616"/><path d="M30 68V28l36 40V28" fill="none" stroke="#fafafa" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>');
const ANA_PORTRAIT = svg('<rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/>');

const NOW = "2026-10-26T09:00:00Z";
const ANA = { name: "Ana Costa", email: "ana.costa@northwind.studio", avatar: ANA_PORTRAIT };

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
      By joining you agree to the{" "}
      <a href="#terms" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Terms
      </a>
      .
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const failedOnce = useRef(false);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Already has an account: one press joins">
          <InviteAcceptCard
            titleAs="h2"
            now={NOW}
            workspace={{ name: "Northwind", logo: NORTHWIND_LOGO, members: 24 }}
            inviter={ANA}
            role="Editor"
            roleSummary={["Create and edit documents", "Comment and share with the team", "See every project in the workspace"]}
            expiresAt="2026-10-31T17:00:00Z"
            email="imke.visser@kestrel.studio"
            footer={<Terms />}
            onSwitchAccount={() => setNote("Opening the account switcher.")}
            onDecline={async () => {
              await wait(800);
              setNote("Invite declined. In your app this is where the redirect happens.");
            }}
            onAccept={async () => {
              await wait(1000);
              // The first press fails once, so the retry message shows; the second one works.
              if (!failedOnce.current) {
                failedOnce.current = true;
                return "We could not add you to Northwind. Nothing was changed, so you can try again.";
              }
              setNote("Joined Northwind. In your app this is where the redirect happens.");
            }}
          />
        </Step>

        <Step caption="New to the product: a name and a password first">
          <InviteAcceptCard
            titleAs="h2"
            now={NOW}
            mode="new"
            workspace={{ name: "Halcyon Freight", members: 8 }}
            inviter={{ name: "Pieter de Wit", email: "pieter@halcyon-freight.com" }}
            role="Admin"
            roleSummary={["Invite and remove people", "Manage billing and plans", "Change workspace and security settings"]}
            expiresAt="2026-11-02T12:00:00Z"
            email="tom.berg@halcyon-freight.com"
            onSwitchAccount={() => setNote("Opening the sign-in page.")}
            onDecline={async () => {
              await wait(800);
              setNote("Invite declined.");
            }}
            onAccept={async (values) => {
              await wait(1200);
              setNote(`Account created for ${values?.name ?? "you"}. In your app this is where the redirect happens.`);
            }}
          />
        </Step>

        <Step caption="Past its date: the card says so and who to ask">
          <InviteAcceptCard
            titleAs="h2"
            now={NOW}
            workspace={{ name: "Kestrel Studio", members: 3 }}
            inviter={{ name: "Imke Visser", email: "imke@kestrel.studio" }}
            role="Viewer"
            roleSummary={["Read every document", "Leave comments"]}
            expiresAt="2026-10-19T12:00:00Z"
            email="anna.visser@gmail.com"
            onAccept={() => undefined}
          />
        </Step>

        <Step caption="Declined: nothing left to press, and the way back is said">
          <InviteAcceptCard
            titleAs="h2"
            now={NOW}
            defaultOutcome="declined"
            workspace={{ name: "Northwind", logo: NORTHWIND_LOGO, members: 24 }}
            inviter={ANA}
            role="Editor"
            roleSummary={["Create and edit documents"]}
            expiresAt="2026-10-31T17:00:00Z"
            email="imke.visser@kestrel.studio"
            onAccept={() => undefined}
          />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: the first Join fails once so the message shows, and the second works. Hover, focus or tap the role to see what it can do."
        )}
      </p>
    </div>
  );
}
