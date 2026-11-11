"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { RoleChangeDialog, RoleChangePanel, type RoleInfo, type RoleMember } from "@rhs-ui/application/role-change-dialog";
import { IconCheck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [team, setTeam] = useState(TEAM);
  const [note, setNote] = useState("");
  const refused = useRef(false);

  async function confirm(person: Person) {
    await wait(900);
    // Dan's first change fails, to show that the dialog stays as it was and the button says Try again.
    if (person.id === "dan" && !refused.current) {
      refused.current = true;
      throw new Error("The workspace could not reach the permissions service.");
    }
    setTeam((list) => list.map((item) => (item.id === person.id ? { ...item, role: person.target, target: person.role } : item)));
    setNote(`${person.name} is now ${role(person.target).name}.`);
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="Try it: every button opens the dialog for that change. Priya gains, Dan loses (and the first attempt fails), Leo becomes an owner and has to type his email, and Maya cannot be demoted because she is the last owner.">
          <section aria-labelledby="role-change-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
              <h2 id="role-change-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
                Team
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">{team.length} people in Halcyon</p>
            </div>
            <ul aria-labelledby="role-change-demo-title" className="divide-y divide-border">
              {team.map((person) => (
                <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar aria-hidden="true">
                    <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tracking-[-0.01em]">{person.name}</p>
                    <p className="truncate text-[0.8125rem] text-muted-foreground">
                      <span className="sm:hidden">{role(person.role).name}</span>
                      <span className="max-sm:hidden">{person.email}</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 max-sm:hidden">
                    {role(person.role).name}
                  </Badge>
                  <RoleChangeDialog
                    member={person}
                    fromRole={role(person.role)}
                    toRole={role(person.target)}
                    lastOwner={person.lastOwner}
                    onConfirm={() => confirm(person)}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        Make {role(person.target).name.toLowerCase()}
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="flex min-h-11 items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-2">
                {note ? (
                  <>
                    <IconCheck aria-hidden="true" className="size-3.5 shrink-0 text-foreground" />
                    <span className="truncate">{note}</span>
                  </>
                ) : (
                  "Open a dialog from any row."
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTeam(TEAM);
                  setNote("");
                  // Dan's first change fails again, so the way back can be replayed.
                  refused.current = false;
                }}
                className="-me-2 shrink-0 text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            </p>
          </section>
        </Case>

        {/* The left column is wide enough for a panel to be as wide as the dialog (28rem and more): there the two lists sit side by side. The right column is narrower, and its panels stack the lists, as on a phone. */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start">
          <Case caption="Taking something away, and giving something else. At the width of the dialog the two lists sit side by side: what Tomas gains, and what he loses. A warning says it happens at once.">
            <Surface>
              <RoleChangePanel standalone member={TOMAS} fromRole={role("editor")} toRole={role("billing")} onConfirm={() => undefined} />
            </Surface>
          </Case>
          <Case caption="A promotion to a powerful role. The button stays off until the email is typed.">
            <Surface>
              <RoleChangePanel standalone member={LEO} fromRole={role("admin")} toRole={role("owner")} onConfirm={() => undefined} />
            </Surface>
          </Case>
          <Case caption="The last owner cannot be demoted. The button is off, and the reason is written above it.">
            <Surface>
              <RoleChangePanel standalone lastOwner member={MAYA} fromRole={role("owner")} toRole={role("admin")} onConfirm={() => undefined} />
            </Surface>
          </Case>
          <Case caption="Done. One sentence that names the person and the new role. After a press by hand, focus moves to the button.">
            <Surface>
              <Sent>
                <RoleChangePanel standalone member={PRIYA} fromRole={role("editor")} toRole={role("admin")} onConfirm={() => Promise.resolve()} />
              </Sent>
            </Surface>
          </Case>
        </div>
      </div>
    </div>
  );
}

/** Presses the panel's own button once it is on screen, so a preview shows the state after a press. */
function Sent({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector("form")?.requestSubmit();
  }, []);
  return <div ref={box}>{children}</div>;
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Every role lists everything it allows, so the dialog can work out what a change gives and takes by itself.
const VIEWER_CAN = ["View projects and tasks", "Comment on tasks"];
const EDITOR_CAN = [...VIEWER_CAN, "Edit projects", "Create and archive tasks", "Share a project with the team"];
const ADMIN_CAN = [...EDITOR_CAN, "Invite and remove people", "Change roles", "Manage integrations", "Read the audit log"];
const OWNER_CAN = [...ADMIN_CAN, "Manage billing and the plan", "Transfer or delete the workspace"];
// A role beside the others, not above them: it reads the work and the audit log and runs the plan, but does not edit.
const BILLING_CAN = ["View projects and tasks", "Manage billing and the plan", "Read the audit log"];

const ROLES: Record<string, RoleInfo> = {
  viewer: { id: "viewer", name: "Viewer", capabilities: VIEWER_CAN },
  editor: { id: "editor", name: "Editor", capabilities: EDITOR_CAN },
  billing: { id: "billing", name: "Billing", capabilities: BILLING_CAN },
  admin: { id: "admin", name: "Admin", capabilities: ADMIN_CAN },
  owner: { id: "owner", name: "Owner", capabilities: OWNER_CAN, powerful: true },
};

const role = (id: string): RoleInfo => ROLES[id] ?? { id, name: id, capabilities: [] };

interface Person extends RoleMember {
  id: string;
  email: string;
  role: string;
  /** The role the button on the row asks about. */
  target: string;
  lastOwner?: boolean;
}

const TEAM: readonly Person[] = [
  { id: "priya", name: "Priya Nair", email: "priya@kestrel.example", role: "editor", target: "admin" },
  { id: "dan", name: "Dan Cho", email: "dan@northwind.example", role: "admin", target: "viewer" },
  { id: "leo", name: "Leo Martins", email: "leo@halcyon.example", role: "admin", target: "owner" },
  { id: "maya", name: "Maya Okafor", email: "maya@halcyon.example", role: "owner", target: "admin", lastOwner: true },
];

const TOMAS: RoleMember = { name: "Tomas Ruiz", email: "tomas@northwind.example" };
const LEO: RoleMember = { name: "Leo Martins", email: "leo@halcyon.example" };
const MAYA: RoleMember = { name: "Maya Okafor", email: "maya@halcyon.example" };
const PRIYA: RoleMember = { name: "Priya Nair", email: "priya@kestrel.example" };
