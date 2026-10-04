"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconCheck, IconCopy, IconLink } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Input } from "@rhs-ui/primitives/input";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface SharePerson {
  id: string;
  name: string;
  email: string;
  role: "owner" | "edit" | "view";
}

export interface ShareDialogProps {
  /** What is being shared: "Q2 roadmap". */
  title: string;
  /** The trigger, usually a "Share" button. */
  children: ReactNode;
  link: string;
  /** Anyone with the link can view. */
  linkAccess: "off" | "view";
  onLinkAccessChange: (access: "off" | "view") => void;
  people: readonly SharePerson[];
  /** Resolve when the invite is sent; reject to show the error. */
  onInvite: (email: string, role: "edit" | "view") => Promise<void> | void;
}

/**
 * Share one thing: invite by email with view or edit, the people who have
 * access with their role, and a link that can be switched on or off and
 * copied. Every change is announced, and copy confirms in words.
 */
export function ShareDialog({ title, children, link, linkAccess, onLinkAccessChange, people, onInvite }: ShareDialogProps) {
  const id = useId();
  const [role, setRole] = useState<"edit" | "view">("view");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      await onInvite(email, role);
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  }
  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  const roleLabel = { owner: "Owner", edit: "Can edit", view: "Can view" } as const;
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share “{title}”</DialogTitle>
          <DialogDescription>Invite people or share a link.</DialogDescription>
        </DialogHeader>
        <form onSubmit={invite} className="flex gap-2">
          <label htmlFor={`${id}-email`} className="sr-only">Email address</label>
          <Input id={`${id}-email`} name="email" type="email" required autoComplete="off" placeholder="name@company.com" className="flex-1" />
          <div role="radiogroup" aria-label="Access" className="flex rounded-md bg-muted p-0.5 text-xs">
            {(["view", "edit"] as const).map((option) => (
              <label key={option} className="relative inline-flex cursor-pointer items-center rounded px-2 has-[:checked]:bg-background has-[:checked]:shadow-sm has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40">
                <input type="radio" name={`${id}-role`} checked={role === option} onChange={() => setRole(option)} className="sr-only" />
                {option === "view" ? "View" : "Edit"}
              </label>
            ))}
          </div>
          <Button type="submit" loading={state === "busy"}>Invite</Button>
        </form>
        <p role="status" className={cn("-mt-2 min-h-4 text-xs", state === "error" ? "text-destructive" : "text-muted-foreground")}>
          {state === "sent" ? "Invite sent." : state === "error" ? "The invite did not go out. Try again." : ""}
        </p>
        <div>
          <p className="text-xs font-medium text-muted-foreground">People with access</p>
          <ul className="mt-2 grid gap-2">
            {people.map((person) => (
              <li key={person.id} className="flex items-center gap-3 text-sm">
                <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{person.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate">{person.name}</span><span className="block truncate text-xs text-muted-foreground">{person.email}</span></span>
                <span className="text-xs text-muted-foreground">{roleLabel[person.role]}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2"><IconLink aria-hidden="true" className="size-4" />{linkAccess === "view" ? "Anyone with the link can view" : "Link sharing is off"}</span>
            <Switch aria-label="Share with a link" checked={linkAccess === "view"} onCheckedChange={(on) => onLinkAccessChange(on ? "view" : "off")} />
          </div>
          {linkAccess === "view" ? (
            <div className="mt-3 flex gap-2">
              <label htmlFor={`${id}-link`} className="sr-only">Share link</label>
              <Input id={`${id}-link`} readOnly value={link} onFocus={(event) => event.currentTarget.select()} className="font-mono text-xs" />
              <Button variant="outline" onClick={copy} aria-label={copied ? "Link copied" : "Copy link"}>{copied ? <IconCheck /> : <IconCopy />}</Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
