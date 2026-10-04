"use client";

import { useId, useState, type KeyboardEvent } from "react";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface InviteMembersProps {
  roles: readonly { id: string; label: string; description?: string }[];
  defaultRole?: string;
  /** Resolve when the invites are sent. */
  onInvite: (invite: { emails: string[]; role: string }) => Promise<void> | void;
  /** Seats left on the plan; inviting more is blocked with a message. */
  seatsLeft?: number;
  className?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Invite several people at once: type or paste addresses (comma, space or
 * Enter makes a chip), pick one role, send. Invalid addresses are marked in
 * words; the seat limit is checked before anything is sent.
 */
export function InviteMembers({ roles, defaultRole, onInvite, seatsLeft, className }: InviteMembersProps) {
  const id = useId();
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState(defaultRole ?? roles[0]?.id ?? "");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  function commit(text: string) {
    const parts = text.split(/[\s,;]+/).map((part) => part.trim()).filter(Boolean);
    if (parts.length) setEmails((current) => [...new Set([...current, ...parts])]);
    setDraft("");
  }
  function key(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === " ") {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && !draft) setEmails((current) => current.slice(0, -1));
  }
  const invalid = emails.filter((email) => !EMAIL.test(email));
  const over = seatsLeft !== undefined && emails.length > seatsLeft;
  async function send() {
    if (!emails.length || invalid.length || over) return;
    setState("busy");
    await onInvite({ emails, role });
    setEmails([]);
    setState("done");
  }
  return (
    <div data-slot="invite-members" className={cn("rounded-xl border border-border p-4", className)}>
      <label htmlFor={id} className="text-sm font-medium">Invite people</label>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 focus-within:ring-[3px] focus-within:ring-ring/40">
        {emails.map((email) => {
          const bad = !EMAIL.test(email);
          return (
            <span key={email} className={cn("inline-flex items-center gap-1 rounded-md py-0.5 pr-0.5 pl-2 text-xs", bad ? "bg-destructive/12 text-destructive" : "bg-muted")}>
              {email}
              {bad ? <span className="sr-only"> (not a valid address)</span> : null}
              <button type="button" aria-label={`Remove ${email}`} onClick={() => setEmails((current) => current.filter((value) => value !== email))} className="inline-flex size-5 items-center justify-center rounded hover:bg-background/60 [&_svg]:size-3"><IconClose /></button>
            </span>
          );
        })}
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={key}
          onBlur={() => draft && commit(draft)}
          onPaste={(event) => { event.preventDefault(); commit(event.clipboardData.getData("text")); }}
          placeholder={emails.length ? "" : "name@company.com, another@company.com"}
          className="min-w-40 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted-foreground"
          type="email"
          multiple
        />
      </div>
      {invalid.length ? <p role="alert" className="mt-2 text-xs text-destructive">{invalid.length === 1 ? "One address is" : `${invalid.length} addresses are`} not valid.</p> : null}
      {over ? <p role="alert" className="mt-2 text-xs text-destructive">Your plan has {seatsLeft} seats left. Remove {emails.length - (seatsLeft ?? 0)} or upgrade.</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger size="sm" aria-label="Role" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {roles.map((option) => <SelectItem key={option.id} value={option.id} description={option.description}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={send} loading={state === "busy"} disabled={!emails.length || invalid.length > 0 || over}>
          Send {emails.length > 1 ? `${emails.length} invites` : "invite"}
        </Button>
        {state === "done" ? <span role="status" className="text-xs text-muted-foreground">Invites sent.</span> : null}
      </div>
    </div>
  );
}
