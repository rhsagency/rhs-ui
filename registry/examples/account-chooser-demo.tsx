"use client";

import { useState, type ReactNode } from "react";

import { AccountChooser, type ChooserAccount } from "@rhs-ui/application/account-chooser";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Drawn portraits as data URIs, so the preview needs no image host: a head and shoulders on a quiet ground.
const portrait = (ground: string, ink: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${ground}"/><circle cx="48" cy="38" r="17" fill="${ink}"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="${ink}"/></svg>`);

const ANA = portrait("#d9d6cf", "#3a3733");
const IMKE = portrait("#cfd3d6", "#2f3438");
const NOOR = portrait("#dcd5d0", "#4a3d36");

const FEW: ChooserAccount[] = [
  { id: "ana", name: "Ana Costa", email: "ana.costa@northwind.studio", avatar: ANA, signedIn: true },
  { id: "tom", name: "Tom Berg", email: "tom.berg@halcyon-freight.com" },
  { id: "imke", name: "Imke Visser", email: "imke@kestrel.studio", avatar: IMKE, signedIn: true },
  { id: "pieter", name: "Pieter de Wit", email: "pieter.dewit@gmail.com" },
];

const MANY: ChooserAccount[] = [
  ...FEW,
  { id: "noor", name: "Noor Haddad", email: "noor.haddad@northwind.studio", avatar: NOOR },
  { id: "lucas", name: "Lucas Meyer", email: "lucas@meyer-bouw.nl", signedIn: true },
  { id: "sofia", name: "Sofia Rossi", email: "sofia.rossi@outlook.com" },
  { id: "jan", name: "Jan Bakker", email: "jan.bakker@bakker-en-zn.nl" },
];

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [few, setFew] = useState(FEW);
  const [many, setMany] = useState(MANY);
  const [note, setNote] = useState("");

  const choose = async (account: ChooserAccount) => {
    await wait(1200);
    setNote(account.signedIn ? `Continuing as ${account.name}.` : `Opening the password page for ${account.email}.`);
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Choose a row: that row alone goes busy">
          <AccountChooser
            titleAs="h2"
            accounts={few}
            onChoose={choose}
            onUseAnother={() => setNote("Opening the sign-in form.")}
            onRemove={async (account) => {
              await wait(700);
              setFew((list) => list.filter((item) => item.id !== account.id));
            }}
          />
        </Step>

        <Step caption="Remove from this device asks first, in the row itself">
          <AccountChooser titleAs="h2" accounts={FEW} defaultConfirming="tom" onChoose={choose} onUseAnother={() => setNote("Opening the sign-in form.")} onRemove={() => undefined} />
        </Step>

        <Step caption="More than six: the list scrolls and Use another account stays in view">
          <AccountChooser
            titleAs="h2"
            accounts={many}
            onChoose={choose}
            onUseAnother={() => setNote("Opening the sign-in form.")}
            onRemove={async (account) => {
              await wait(700);
              setMany((list) => list.filter((item) => item.id !== account.id));
            }}
          />
        </Step>

        <Step caption="A device nobody has signed in on yet">
          <AccountChooser titleAs="h2" accounts={[]} title="Welcome to Northwind" description="Sign in to pick up where you left off." onChoose={choose} onUseAnother={() => setNote("Opening the sign-in form.")} />
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: every row is one button with its own menu, so Tab walks the list. Remove an account from its menu and the focus moves to the next row."
        )}
      </p>
    </div>
  );
}
