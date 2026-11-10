"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import { IconFileText, IconPin, IconTrash, IconUser } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { ResponsiveDialog } from "@rhs-ui/primitives/responsive-dialog";

/** What the dialog itself reads: whether the window is at least 640px wide. */
function useWide(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia("(min-width: 640px)");
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia("(min-width: 640px)").matches,
    () => true,
  );
}

function Row({ icon, title, line, children }: { icon: ReactNode; title: string; line: string; children: ReactNode }): React.JSX.Element {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-[1.125rem]">
        {icon}
      </span>
      <div className="grid min-w-0 flex-1 basis-48 gap-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{line}</p>
      </div>
      {children}
    </li>
  );
}

function Address(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <Row icon={<IconPin />} title="Shipping address" line={saved ? "Saved: Prinsengracht 412, Amsterdam" : "Keizersgracht 120, 1015 CJ Amsterdam"}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="outline">Edit address</Button>}
        title="Shipping address"
        description="Orders placed from now on are sent here. Open orders keep the address they had."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="rd-address">
              Save address
            </Button>
          </>
        }
      >
        <form
          id="rd-address"
          className="grid gap-4 pt-1"
          onSubmit={(event) => {
            event.preventDefault();
            setSaved(true);
            setOpen(false);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="rd-name">Full name</Label>
            <Input id="rd-name" defaultValue="Mara Okafor" autoComplete="name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rd-street">Street and number</Label>
            <Input id="rd-street" defaultValue="Prinsengracht 412" autoComplete="street-address" />
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rd-zip">Postcode</Label>
              <Input id="rd-zip" defaultValue="1016 JK" autoComplete="postal-code" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rd-city">City</Label>
              <Input id="rd-city" defaultValue="Amsterdam" autoComplete="address-level2" />
            </div>
          </div>
        </form>
      </ResponsiveDialog>
    </Row>
  );
}

const TERMS: readonly string[] = [
  "These terms are an agreement between you and Halcyon Studio B.V. about how you use the Halcyon service, its apps and its programming interface.",
  "You may use the service for your own work and for your team's. You may not resell access to it, or use it to build a service that competes with it.",
  "Your content stays yours. You give us the narrow right to store it, process it and show it to the people you share it with, because the service cannot work without that.",
  "We keep your data in the European Union and we encrypt it in transit and at rest. If we ever need to move it, we will tell you ninety days before we do.",
  "Plans renew each month or each year, as you chose. You can cancel at any time and keep access until the end of the period you have paid for.",
  "If we change these terms in a way that matters, we write to the owner of each workspace thirty days before it takes effect, and you can leave without a fee.",
  "The service is provided as it is. We work hard to keep it running, and we commit to the uptime written in your plan, but we cannot promise it will never fail.",
  "These terms are governed by the law of the Netherlands, and any dispute goes to the court in Amsterdam.",
];

function Terms(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  return (
    <Row icon={<IconFileText />} title="Terms of service" line={accepted ? "Accepted, version 4.0" : "Version 4.0 needs your agreement"}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button variant="outline">Read the terms</Button>}
        title="Terms of service"
        description="Version 4.0, in force from 1 April. Scroll to read it all."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Not now
            </Button>
            <Button
              type="button"
              onClick={() => {
                setAccepted(true);
                setOpen(false);
              }}
            >
              Accept the terms
            </Button>
          </>
        }
      >
        <div className="grid gap-4 pt-1 text-sm leading-relaxed">
          {TERMS.map((paragraph, i) => (
            <p key={paragraph}>
              <span className="mr-2 font-medium tabular-nums">{i + 1}.</span>
              {paragraph}
            </p>
          ))}
        </div>
      </ResponsiveDialog>
    </Row>
  );
}

function Remove(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  return (
    <Row icon={<IconTrash />} title="Delete workspace" line={removed ? "Scheduled for deletion in 14 days" : "Removes 12 projects and 38 members"}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        trigger={
          <Button variant="outline" disabled={removed}>
            Delete workspace
          </Button>
        }
        title="Delete Halcyon Studio?"
        description="Nothing is deleted today. The workspace is hidden at once and removed for good after 14 days."
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Keep workspace
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setRemoved(true);
                setOpen(false);
              }}
            >
              Delete workspace
            </Button>
          </>
        }
      >
        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">You can restore it from Settings until the 14 days are over.</p>
      </ResponsiveDialog>
    </Row>
  );
}

function Required(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Row icon={<IconUser />} title="Choose a username" line={done ? `You are @${name}` : "Required before you can invite anyone"}>
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        dismissible={false}
        trigger={<Button variant="outline">Choose</Button>}
        title="Choose a username"
        description="This is how teammates find and mention you. You can change it once a month."
        footer={
          <Button
            type="button"
            disabled={name.trim().length < 3}
            onClick={() => {
              setDone(true);
              setOpen(false);
            }}
          >
            Continue
          </Button>
        }
      >
        <div className="grid gap-1.5 pt-1">
          <Label htmlFor="rd-user">Username</Label>
          <Input id="rd-user" value={name} onChange={(event) => setName(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} placeholder="mara" autoComplete="off" />
          <p className="text-xs text-muted-foreground">At least 3 letters or numbers.</p>
        </div>
      </ResponsiveDialog>
    </Row>
  );
}

export default function Demo(): React.JSX.Element {
  const wide = useWide();
  return (
    <div className="grid w-full max-w-2xl gap-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="grid max-w-md gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <p>Type in the address form, then resize the window across 640px. The dialog turns into a drawer, or back, and what you typed stays.</p>
          <p>The delete dialog has no field, so focus lands on its title and a screen reader hears the question first. The username dialog cannot be dismissed: only Continue closes it.</p>
        </div>
        <Badge variant="outline" className="tabular-nums" aria-live="polite">
          Opens as {wide ? "a dialog" : "a drawer"}
        </Badge>
      </div>
      <ul className="m-0 grid list-none divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xs">
        <Address />
        <Terms />
        <Remove />
        <Required />
      </ul>
    </div>
  );
}
