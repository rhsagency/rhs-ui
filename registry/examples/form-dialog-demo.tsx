"use client";

import { useState } from "react";

import { FormDialog } from "@rhs-ui/application/form-dialog";
import { IconPlus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Textarea } from "@rhs-ui/primitives/textarea";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  invited?: boolean;
}

const ROLES = [
  ["admin", "Admin"],
  ["member", "Member"],
  ["viewer", "Viewer"],
] as const;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** "daan.verhoeven@kestrel.dev" becomes "Daan Verhoeven". */
function nameOf(email: string): string {
  return (email.split("@")[0] ?? email)
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Demo(): React.JSX.Element {
  const [workspace, setWorkspace] = useState("Kestrel Studio");
  const [members, setMembers] = useState<Member[]>([
    { id: "m1", name: "Mara Jansen", email: "mara@kestrel.dev", role: "Owner" },
    { id: "m2", name: "Theo Okonkwo", email: "theo@kestrel.dev", role: "Admin" },
    { id: "m3", name: "Ines Carvalho", email: "ines@kestrel.dev", role: "Member" },
  ]);
  const [log, setLog] = useState("Nothing sent yet.");

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-4">
      <section aria-labelledby="fd-workspace" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="fd-workspace" className="text-base font-semibold tracking-[-0.015em]">
              {workspace}
            </h2>
            <p className="text-sm text-muted-foreground tabular-nums">{members.length} members</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FormDialog
              trigger={<Button variant="outline">Rename</Button>}
              title="Rename workspace"
              description="The name your team sees in the sidebar and on every invoice."
              submitLabel="Save name"
              onSubmit={(values) => {
                setWorkspace(String(values.get("name") ?? "").trim());
                setLog("Renamed. This one answered at once, so the dialog closed at once.");
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="fd-name">Workspace name</Label>
                <Input id="fd-name" name="name" defaultValue={workspace} required maxLength={40} autoComplete="off" />
              </div>
            </FormDialog>

            <FormDialog
              trigger={
                <Button>
                  <IconPlus />
                  Invite teammate
                </Button>
              }
              title="Invite a teammate"
              description={`They get an email with a link to join ${workspace}.`}
              submitLabel="Send invitation"
              dirtyGuard
              onSubmit={async (values) => {
                const email = String(values.get("email") ?? "").trim().toLowerCase();
                const role = ROLES.find(([key]) => key === values.get("role"))?.[1] ?? "Member";
                await wait(1100);
                const existing = members.find((member) => member.email === email);
                if (existing) throw new Error(`${existing.name} is already a member of ${workspace}. Use another address.`);
                setMembers((current) => [...current, { id: `m${current.length + 1}`, name: nameOf(email), email, role, invited: true }]);
                setLog(`Invitation sent to ${email} as ${role}.`);
              }}
            >
              <div className="grid gap-1.5">
                <Label htmlFor="fd-email">Email address</Label>
                <Input id="fd-email" name="email" type="email" required autoComplete="off" placeholder="name@company.example" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fd-role">Role</Label>
                <Select name="role" defaultValue="member">
                  <SelectTrigger id="fd-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(([key, name]) => (
                      <SelectItem key={key} value={key}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fd-note">
                  Personal note <span className="font-normal text-muted-foreground">Optional</span>
                </Label>
                <Textarea id="fd-note" name="note" rows={3} placeholder="We are starting the Halcyon rebrand on Monday. Come and join us." />
              </div>
            </FormDialog>
          </div>
        </div>

        <ul role="list" className="m-0 list-none divide-y divide-border p-0">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3 px-5 py-3">
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {initialsOf(member.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              {member.invited ? <Badge variant="outline">Invited</Badge> : null}
              <span className="w-16 shrink-0 text-right text-sm text-muted-foreground">{member.role}</span>
            </li>
          ))}
        </ul>
      </section>

      <p role="status" className="text-xs text-muted-foreground">
        {log}
      </p>
      <p className="text-xs text-muted-foreground">
        In Invite teammate, type mara@kestrel.dev: the request fails and everything stays as typed. Press Escape or click outside while it saves, and nothing happens. Change a field and close it, and it asks first.
      </p>
    </div>
  );
}
