"use client";

import { useState, type ReactNode } from "react";

import { AuthorizeAppCard, type AuthorizeScope } from "@rhs-ui/application/authorize-app-card";
import { IconCheck } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Drawn pictures as data URIs, so the preview needs no image host: a mark for the app and a portrait for the person.
const KESTREL_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#161616"/><path d="M26 66V50M42 66V36M58 66V44M74 66V26" fill="none" stroke="#fafafa" stroke-width="8" stroke-linecap="round"/></svg>');
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');

const ACCOUNT = { name: "Ana Costa", email: "ana.costa@northwind.studio", avatar: PORTRAIT };

const KESTREL_SCOPES: AuthorizeScope[] = [
  { id: "profile.read", label: "Your profile", description: "Your name, email address and profile photo", access: "read", required: true },
  { id: "projects.read", label: "Your project list", description: "The names, owners and status of the projects you can see", access: "read" },
  { id: "usage.read", label: "Usage reports", description: "How your workspace is used, as charts and tables", access: "read" },
  { id: "comments.write", label: "Comments", description: "Post and edit comments on your projects, in your name", access: "write" },
  { id: "exports.write", label: "Exports", description: "Create and download exports of your data, in your name", access: "write" },
];

const QUICKBEAM_SCOPES: AuthorizeScope[] = [
  { id: "profile.read", label: "Your profile", description: "Your name and email address", access: "read", required: true },
  { id: "projects.read", label: "Your project list", description: "The names and status of the projects you can see", access: "read" },
  { id: "files.write", label: "Files", description: "Add and change files in your projects, in your name", access: "write" },
];

function Step({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-3">
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

function PrivacyNote({ app }: { app: string }): React.JSX.Element {
  return (
    <p className="text-xs leading-relaxed">
      Read the{" "}
      <a href="#privacy" className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
        {app} privacy policy
      </a>
      .
    </p>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="A verified app: optional permissions have a box, required ones a lock">
          <AuthorizeAppCard
            titleAs="h2"
            app={{ name: "Kestrel Analytics", publisher: "Kestrel Labs", verified: true, logo: KESTREL_LOGO }}
            account={ACCOUNT}
            scopes={KESTREL_SCOPES}
            redirectHost="app.kestrel.io"
            footer={<PrivacyNote app="Kestrel" />}
            onSwitchAccount={() => setNote("Opening the account switcher.")}
            onAllow={async (granted) => {
              await wait(1100);
              setNote(`Allowed with ${granted.length} permissions: ${granted.join(", ")}. In your app this is where the redirect happens.`);
            }}
            onDeny={async () => {
              await wait(700);
              setNote("Denied. In your app this sends the person back with an access_denied error.");
            }}
          />
        </Step>

        <Step caption="An unverified app: the card says so in words, and warns">
          <AuthorizeAppCard
            titleAs="h2"
            app={{ name: "Quickbeam Reports", publisher: "Quickbeam Ltd", verified: false }}
            account={ACCOUNT}
            scopes={QUICKBEAM_SCOPES}
            defaultGranted={["projects.read"]}
            redirectHost="reports.quickbeam.example"
            onAllow={async (granted) => {
              await wait(1100);
              setNote(`Allowed with ${granted.length} permissions.`);
            }}
            onDeny={() => setNote("Denied.")}
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
          "Preview tip: untick a permission and the count follows. Tab runs through the permissions, then Deny, then Allow, and the two buttons are the same size."
        )}
      </p>
    </div>
  );
}
