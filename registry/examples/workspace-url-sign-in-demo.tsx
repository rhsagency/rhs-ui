"use client";

import { useState, type ReactNode } from "react";

import { WorkspaceUrlSignIn, type RecentWorkspace } from "@rhs-ui/application/workspace-url-sign-in";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Drawn marks as data URIs, so the preview needs no image host: two quiet tiles with a shape on them.
const mark = (ground: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${ground}"/>${shape}</svg>`);
const NORTHWIND = mark("#161616", '<path d="M24 66 48 28l24 38" fill="none" stroke="#fafafa" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>');
const KESTREL = mark("#d9d6cf", '<path d="M26 66V50M42 66V36M58 66V44M74 66V26" fill="none" stroke="#2f2c28" stroke-width="8" stroke-linecap="round"/>');

const RECENT: RecentWorkspace[] = [
  { slug: "northwind", name: "Northwind Studio", logo: NORTHWIND },
  { slug: "halcyon-freight", name: "Halcyon Freight" },
  { slug: "kestrel", name: "Kestrel Labs", logo: KESTREL },
  { slug: "meyer-bouw", name: "Meyer Bouw" },
];

const KNOWN = new Set(["acme", ...RECENT.map((workspace) => workspace.slug)]);

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function NewHere(): React.JSX.Element {
  return (
    <p className="text-xs leading-relaxed">
      New to Example?{" "}
      <a href="#create" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        Create a workspace
      </a>
    </p>
  );
}

const DUTCH = {
  heading: "Log in op je werkruimte",
  description: "Vul het adres van je werkruimte in om door te gaan.",
  field: "Adres van de werkruimte",
  placeholder: "bedrijf",
  continue: "Doorgaan",
  checking: "Adres controleren",
  missing: "Vul het adres van je werkruimte in.",
  failed: "We konden dit adres niet controleren. Controleer je verbinding en probeer het opnieuw.",
  recent: "Recente werkruimtes",
  remove: "{name} uit deze lijst verwijderen",
  removeQuestion: "{name} van dit apparaat verwijderen?",
  keep: "Bewaren",
  removeConfirm: "Verwijderen",
  removeFailed: "We konden die werkruimte niet verwijderen. Probeer het opnieuw.",
  find: "Adres van je werkruimte vergeten?",
  openingSaid: "{address} wordt geopend.",
  removedSaid: "{name} is van dit apparaat verwijderd.",
};

const RECENT_NL: RecentWorkspace[] = [
  { slug: "bakker-en-zn", name: "Bakker & Zn." },
  { slug: "van-dijk-advies", name: "Van Dijk Advies" },
];

export default function Demo(): React.JSX.Element {
  const [recent, setRecent] = useState(RECENT);
  const [recentNl, setRecentNl] = useState(RECENT_NL);
  const [note, setNote] = useState("");

  async function open(slug: string): Promise<string | void> {
    await wait(900);
    if (slug === "offline") throw new Error("The directory did not answer.");
    if (!KNOWN.has(slug)) return "There is no workspace at {address}. Check the spelling, or find yours.";
    setNote(`Opening ${slug}.example.com. In your app this is where you navigate.`);
  }

  async function openNl(slug: string): Promise<string | void> {
    await wait(900);
    if (!["bedrijf", ...RECENT_NL.map((workspace) => workspace.slug)].includes(slug)) return "Er is geen werkruimte op {address}. Controleer de spelling, of zoek het adres op.";
    setNote(`${slug}.voorbeeld.nl wordt geopend. In je app navigeer je hier.`);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Type, or pick one: a recent workspace skips the typing">
          <WorkspaceUrlSignIn
            titleAs="h2"
            domain="example.com"
            recent={recent}
            onContinue={open}
            onFindWorkspace={() => setNote("Opening the email lookup.")}
            onRemoveRecent={async (workspace) => {
              await wait(600);
              setRecent((list) => list.filter((item) => item.slug !== workspace.slug));
            }}
            footer={<NewHere />}
          />
        </Step>

        <Step caption="Not found is announced at the field, and removing asks first">
          <WorkspaceUrlSignIn
            titleAs="h2"
            domain="example.com"
            defaultSlug="northwnd"
            defaultError="There is no workspace at northwnd.example.com. Check the spelling, or find yours."
            recent={RECENT.slice(0, 3)}
            defaultConfirming="halcyon-freight"
            onContinue={open}
            onFindWorkspace={() => setNote("Opening the email lookup.")}
            onRemoveRecent={() => undefined}
          />
        </Step>

        <Step caption="A first visit: nothing remembered, so just the address and a way to find it">
          <WorkspaceUrlSignIn titleAs="h2" domain="example.com" onContinue={open} onFindWorkspace={() => setNote("Opening the email lookup.")} footer={<NewHere />} />
        </Step>

        <Step caption="Every word can be translated, and a longer address still fits">
          <WorkspaceUrlSignIn
            titleAs="h2"
            domain="voorbeeld.nl"
            labels={DUTCH}
            recent={recentNl}
            onContinue={openNl}
            onFindWorkspace={() => setNote("Opening de e-mailzoekopdracht.")}
            onRemoveRecent={async (workspace) => {
              await wait(600);
              setRecentNl((list) => list.filter((item) => item.slug !== workspace.slug));
            }}
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
          "Preview tip: type acme to continue. Any other address is not found, and offline fails the request. Spaces and capitals are dropped as you type, and pasting a whole address leaves the name."
        )}
      </p>
    </div>
  );
}
