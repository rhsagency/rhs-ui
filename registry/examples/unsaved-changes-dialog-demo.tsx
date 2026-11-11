"use client";

import { useState, type ReactNode } from "react";

import { IconCreditCard, IconHome, IconUsers } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { UnsavedChangesDialog, useLeaveGuard } from "@rhs-ui/primitives/unsaved-changes-dialog";

/** The guard and the dialog, working together: a form with a name, links of an app, and a save that can fail. */
function GuardedSettings(): React.JSX.Element {
  const [page, setPage] = useState<PageId>("settings");
  const [saved, setSaved] = useState({ name: "Halcyon storefront", about: "Quiet, well made homeware, shipped from Amsterdam." });
  const [draft, setDraft] = useState(saved);
  const [failing, setFailing] = useState(false);
  const [note, setNote] = useState("");
  const dirty = draft.name !== saved.name || draft.about !== saved.about;
  const guard = useLeaveGuard(dirty);

  async function save(): Promise<boolean> {
    await wait(900);
    if (failing) throw new Error("The server refused the change: Halcyon storefront is the name of another workspace.");
    setSaved(draft);
    return true;
  }

  return (
    <div className="grid gap-3">
      {/* The question, which draws itself in front of the page when the guard raises it; the guard hands the dialog what it needs. */}
      <UnsavedChangesDialog {...guard.dialogProps} onSave={save} onDiscard={() => setDraft(saved)} />
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-2">
          <p className="text-sm font-medium">Workspace</p>
          {dirty ? (
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
              Unsaved changes
            </span>
          ) : (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              All changes saved
            </span>
          )}
        </div>
        <div className="grid @lg:grid-cols-[10.5rem_minmax(0,1fr)]">
          {/* Three equal tabs across a box of any width: the icon sits above the label in the narrowest, so all three fit without scrolling. */}
          <nav aria-label="Workspace" className="relative grid grid-cols-3 gap-1 border-b border-border p-2 @lg:grid-cols-1 @lg:content-start @lg:border-r @lg:border-b-0">
            {PAGES.map((item) => (
              <a
                key={item.id}
                href={item.href}
                aria-current={page === item.id ? "page" : undefined}
                // A router link: it goes to its page itself. The guard asks first, and lets it through once the answer is to leave.
                onClick={(event) => {
                  event.preventDefault();
                  setPage(item.id);
                }}
                className="inline-flex min-h-8 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground motion-reduce:transition-none @xs:h-8 @xs:flex-row @xs:gap-2 @xs:px-2 @xs:py-0 @xs:text-sm @lg:justify-start @lg:px-2.5 [&_svg]:size-4"
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </nav>
          <div className="p-4 @lg:p-5">
            {page === "settings" ? (
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  setNote("");
                  void save().catch((error: Error) => setNote(error.message));
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor="ucd-name">Workspace name</Label>
                  <Input id="ucd-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} autoComplete="off" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ucd-about">About</Label>
                  <Textarea id="ucd-about" rows={3} value={draft.about} onChange={(event) => setDraft({ ...draft, about: event.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={!dirty}>
                    Save changes
                  </Button>
                  <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setDraft(saved)}>
                    Revert
                  </Button>
                </div>
                {note ? (
                  <p role="alert" className="text-sm text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                    {note}
                  </p>
                ) : null}
              </form>
            ) : (
              <div className="grid min-h-40 content-center justify-items-start gap-2">
                <p className="text-sm font-medium">{PAGES.find((item) => item.id === page)?.label}</p>
                <p className="text-sm text-muted-foreground">You left the settings. Go back to find your changes where you left them, or gone if you discarded them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch id="ucd-fail" checked={failing} onCheckedChange={setFailing} />
        <Label htmlFor="ucd-fail" className="font-normal text-muted-foreground">
          Make the next save fail
        </Label>
      </div>
    </div>
  );
}

/** The dialog on its own, with no guard and no Save: two answers, and the destructive one is solid because it is the real decision. */
function DraftInvoice(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState("The draft is open.");
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="grid min-w-0 gap-0.5">
        <p className="text-sm font-medium">Draft invoice INV-1011</p>
        <p className="text-sm text-muted-foreground" role="status">
          {outcome}
        </p>
      </div>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        Close draft
      </Button>
      <UnsavedChangesDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard this draft?"
        description="The invoice has not been sent. Closing it deletes the draft, and this cannot be undone."
        labels={{ discard: "Discard draft" }}
        onDiscard={() => setOutcome("The draft was discarded.")}
        onStay={() => setOutcome("Still editing the draft.")}
      />
    </div>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="@container grid w-full max-w-2xl gap-10">
      <Example caption="The guard and the dialog together. Change the name, then click Members, press the browser's Back button, or try to reload the page">
        <GuardedSettings />
      </Example>
      <Example caption="The dialog on its own, without Save: two answers">
        <DraftInvoice />
      </Example>
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const PAGES = [
  { id: "settings", label: "Settings", href: "/settings", icon: <IconHome /> },
  { id: "members", label: "Members", href: "/members", icon: <IconUsers /> },
  { id: "billing", label: "Billing", href: "/billing", icon: <IconCreditCard /> },
] as const;

type PageId = (typeof PAGES)[number]["id"];
