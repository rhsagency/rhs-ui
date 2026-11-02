"use client";

import { useState, type ReactNode } from "react";

import { InvitationCard, type InvitationState } from "@rhs-ui/application/invitation-card";

// A fixed "now" keeps "Expires in 5 days" the same on every load. In an app, leave `now` out and the card reads the browser's clock.
const NOW = Date.parse("2026-10-29T15:20:00Z");
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A logo tile drawn in flat shapes, with its own ground so it reads on both themes. Use real logos in an app. */
const mark = (ground: string, ink: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' rx='18' fill='${ground}'/>${shape.replaceAll("INK", ink)}</svg>`);

const NORTHWIND = mark("#1f2328", "#f1efe9", "<path d='M28 70V26l40 44V26' fill='none' stroke='INK' stroke-width='9' stroke-linecap='round' stroke-linejoin='round'/>");
const LARKSPUR = mark("#e6e3dc", "#2f3236", "<circle cx='48' cy='48' r='13' fill='INK'/><path d='M48 20v10M48 66v10M20 48h10M66 48h10M28 28l7 7M61 61l7 7M68 28l-7 7M35 61l-7 7' stroke='INK' stroke-width='6' stroke-linecap='round'/>");

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  // A case takes two rows of the grid and shares them with its neighbour: the caption row is as tall as the longer caption, so two cards start on one line however the captions wrap.
  return (
    <div className="row-span-2 grid min-w-0 grid-rows-subgrid gap-y-2.5">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("");
  const [state, setState] = useState<InvitationState>("pending");

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Pending: two buttons of equal weight, and a busy state while it works.">
        <InvitationCard
          inviter={{ name: "Ana Costa" }}
          target={{ name: "Northwind Studio", type: "workspace", image: NORTHWIND, href: "/w/northwind" }}
          role="Editor"
          message="We are moving the autumn launch into Northwind this week. Your drafts will land in the Campaigns board."
          expiresAt="2026-11-03T12:00:00Z"
          now={NOW}
          onAccept={async () => {
            await wait(1100);
            setLog("Joined Northwind Studio as Editor.");
          }}
          onDecline={async () => {
            await wait(700);
            setLog("Declined the invitation to Northwind Studio.");
          }}
          onUndo={async () => {
            await wait(400);
            setLog("Took the decline back.");
          }}
        />
      </Case>

      <Case caption="Controlled: the state lives in the page, so it can follow the server.">
        <InvitationCard
          inviter={{ name: "Imke Visser" }}
          target={{ name: "Spring campaign", type: "project", image: LARKSPUR, href: "/p/spring-campaign" }}
          role="Viewer"
          message="The brief and the shot list are in here. Comment on anything you like; nothing is final until I have signed it off."
          expiresAt="2026-11-12T12:00:00Z"
          now={NOW}
          state={state}
          onStateChange={setState}
          onAccept={() => wait(900)}
          onDecline={() => wait(600)}
          onUndo={() => wait(300)}
        />
      </Case>

      <Case caption="Accepted: the outcome in words, with a way in.">
        <InvitationCard
          inviter={{ name: "Pieter de Wit" }}
          target={{ name: "Halcyon Freight", type: "workspace", href: "/w/halcyon" }}
          role="Admin"
          message="Welcome aboard. You look after billing, and the access list for the Rotterdam depot is yours too."
          defaultState="accepted"
          now={NOW}
        />
      </Case>

      <Case caption="Expired: it says why and offers a new invite (the first ask fails, to show the retry).">
        <ExpiredCase />
      </Case>

      <p role="status" className="min-h-4 text-xs text-muted-foreground md:col-span-2">
        {log}
      </p>
    </div>
  );
}

function ExpiredCase(): React.JSX.Element {
  const [tries, setTries] = useState(0);
  return (
    <InvitationCard
      inviter={{ name: "Sofia Rossi" }}
      target={{ name: "Kestrel design team", type: "team" }}
      role="Member"
      message="The design review runs every Thursday."
      expiresAt="2026-10-24T12:00:00Z"
      now={NOW}
      onRequestNew={async () => {
        await wait(800);
        setTries((count) => count + 1);
        if (tries === 0) throw new Error("offline");
      }}
    />
  );
}
