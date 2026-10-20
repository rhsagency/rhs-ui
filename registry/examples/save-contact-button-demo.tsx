"use client";

import { useState, type ReactNode } from "react";

import { SaveContactButton } from "@rhs-ui/application/save-contact-button";
import { buildVCard, type Contact } from "@rhs-ui/application/save-contact-button/vcard";
import { IconMail, IconPhone, IconPin } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";

const MAYA: Contact = {
  name: "Maya Okafor",
  organisation: "Halcyon Studio",
  title: "Head of Partnerships",
  phones: [
    { value: "+31 20 555 0142", type: "work" },
    { value: "+31 6 5550 1234", type: "mobile" },
  ],
  emails: [{ value: "maya@halcyon.studio", type: "work" }],
  url: "https://halcyon.example",
  address: { street: "Keizersgracht 210", city: "Amsterdam", postalCode: "1016 DX", country: "Netherlands", type: "work" },
  note: "Met at the Halcyon Summit, 12 November 2026.",
};

const SPEAKERS: Contact[] = [
  { name: "Jan van der Berg", organisation: "Polder & Co", title: "Design lead", emails: ["jan@polder.example"] },
  { name: "Amara Osei", organisation: "Northwind Studio", title: "Product manager", emails: ["amara@northwind.example"], phones: ["+44 20 7946 0958"] },
];

// A fixed stamp, so the card shown below is the same every time.
const SHOWN_VCARD = (buildVCard(MAYA, { now: new Date("2026-10-20T10:00:00Z") }) ?? "").replace(/\r\n/g, "\n");

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Nothing saved yet.");
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <div className="w-full min-w-0 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-14 data-[size=default]:size-14">
            <AvatarFallback className="text-base">{initialsOf(MAYA.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-base leading-snug font-semibold tracking-[-0.02em]">{MAYA.name}</h2>
            <p className="text-sm text-muted-foreground">
              {MAYA.title}, {MAYA.organisation}
            </p>
          </div>
        </div>
        <ul className="mt-5 grid gap-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <IconMail className="size-4 shrink-0" />
            <span className="min-w-0 truncate">maya@halcyon.studio</span>
          </li>
          <li className="flex items-center gap-2.5">
            <IconPhone className="size-4 shrink-0" />
            <span className="tabular-nums">+31 20 555 0142</span>
          </li>
          <li className="flex items-center gap-2.5">
            <IconPin className="size-4 shrink-0" />
            <span>Keizersgracht 210, Amsterdam</span>
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
          <SaveContactButton contact={MAYA} onSave={(contact) => setLast(`Handed over ${contact.name}'s card.`)} />
          <p role="status" className="text-xs text-muted-foreground">
            {last}
          </p>
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer rounded-md text-xs font-medium text-muted-foreground outline-none select-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">See the vCard it builds</summary>
          <pre
            tabIndex={0}
            role="region"
            aria-label="Generated vCard"
            className="relative mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {SHOWN_VCARD}
          </pre>
        </details>
      </div>

      <div className="grid gap-x-10 gap-y-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
        <div className="col-span-full min-w-0">
          <Example caption="Event speakers, a quiet button in a list">
            {/* On a phone the button sits under the name, in every row, instead of taking half the row and cutting the name and the job off. */}
            <ul className="w-full divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
              {SPEAKERS.map((speaker) => (
                <li key={speaker.name} className="flex flex-col items-start gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="max-w-full min-w-0">
                    <p className="truncate text-sm font-medium">{speaker.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {speaker.title}, {speaker.organisation}
                    </p>
                  </div>
                  {/* The ghost button has 12px of its own padding: pulled back on a phone, so its icon lines up with the name above it. */}
                  <SaveContactButton contact={speaker} variant="ghost" size="sm" label="Save contact" className="-ml-3 shrink-0 sm:ml-0" />
                </li>
              ))}
            </ul>
          </Example>
        </div>
        <Example caption="Solid, with your own label">
          <SaveContactButton contact={MAYA} variant="default" label="Add Maya to my address book" doneLabel="Card downloaded" fileName="maya-okafor-halcyon" />
        </Example>
        <Example caption="No name: disabled, with the reason">
          <SaveContactButton contact={{ name: "", emails: ["info@halcyon.example"] }} />
        </Example>
      </div>
    </div>
  );
}
