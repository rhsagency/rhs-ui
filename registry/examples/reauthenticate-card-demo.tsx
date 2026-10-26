"use client";

import { useState, type ReactNode } from "react";

import { ReauthenticateCard } from "@rhs-ui/application/reauthenticate-card";
import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A drawn portrait as a data URI, so the preview needs no image host.
const PORTRAIT =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#d9d6cf"/><circle cx="48" cy="38" r="17" fill="#3a3733"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="#3a3733"/></svg>');

function Step({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <figure className={className ? `grid gap-3 ${className}` : "grid gap-3"}>
      <figcaption className="text-center text-xs text-muted-foreground">{caption}</figcaption>
      {children}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  // The password to type in this preview is "northwind"; anything else is refused with a message, as your server would.
  const check = async (password: string) => {
    await wait(900);
    if (password !== "northwind") return "That password is not right. Try again.";
  };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        <Step caption="Password first, a passkey as the second route">
          <ReauthenticateCard
            email="ana.costa@northwind.studio"
            avatar={PORTRAIT}
            action="Change your email address"
            grace="You will not be asked again for 10 minutes."
            onConfirm={async (password) => {
              const refused = await check(password);
              if (refused) return refused;
              setNote("Confirmed. In your app the change goes ahead here.");
            }}
            onPasskey={async () => {
              await wait(1400);
              setNote("Confirmed with a passkey.");
            }}
            onCancel={() => setNote("Cancelled: nothing was changed.")}
          />
        </Step>

        <Step caption="A wrong password: told once, against the field, which keeps the focus">
          <ReauthenticateCard
            email="ana.costa@northwind.studio"
            avatar={PORTRAIT}
            action="Change your email address"
            defaultError="That password is not right. Try again."
            onConfirm={async (password) => {
              const refused = await check(password);
              if (refused) return refused;
              setNote("Confirmed. In your app the change goes ahead here.");
            }}
          />
        </Step>

        <Step caption="The same card inside a dialog, before something that cannot be undone" className="lg:col-span-2 lg:mx-auto lg:w-full lg:max-w-2xl">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-xl border border-border bg-card p-5 shadow-xs">
            <div className="grid min-w-0 gap-1">
              <h2 className="text-sm font-medium">Delete this workspace</h2>
              <p className="max-w-xs text-[0.8125rem] leading-relaxed text-muted-foreground">Removes its projects, files and members for good. This cannot be undone.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Delete workspace</Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] gap-0 p-0 sm:max-w-sm">
                <DialogTitle className="sr-only">Confirm it is you</DialogTitle>
                <DialogDescription className="sr-only">Enter your password to delete the Northwind workspace.</DialogDescription>
                <ReauthenticateCard
                  titleAs="p"
                  email="ana.costa@northwind.studio"
                  action="Delete the Northwind workspace"
                  className="border-0 shadow-none"
                  onConfirm={async (password) => {
                    const refused = await check(password);
                    if (refused) return refused;
                    setOpen(false);
                    setNote("Workspace deleted. In your app this is where the redirect happens.");
                  }}
                  onCancel={() => setOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </Step>
      </div>

      <p aria-live="polite" className="flex min-h-5 items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        {note ? (
          <>
            <IconCheck className="size-3.5 shrink-0 text-foreground" />
            {note}
          </>
        ) : (
          "Preview tip: type northwind to confirm. Any other password is refused once with a message, and the field empties itself and keeps the focus."
        )}
      </p>
    </div>
  );
}
