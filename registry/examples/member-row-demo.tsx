"use client";

import { useRef, useState } from "react";

import { MemberRow, type Member, type MemberRole } from "@rhs-ui/application/member-row";
import { IconCheck } from "@rhs-ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";

// A fixed "now" keeps "Invited 3 days ago" the same on every load. In an app, leave `now` out and the rows read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");

const ROLES: readonly MemberRole[] = [
  { value: "admin", label: "Admin", description: "Manage members, billing and settings" },
  { value: "member", label: "Member", description: "Create and edit projects" },
  { value: "viewer", label: "Viewer", description: "Read-only access to every project" },
];

const START: readonly Member[] = [
  { id: "leo", name: "Leo Martins", email: "leo@northwind.studio", role: "owner", owner: true },
  { id: "mara", name: "Mara Okafor", email: "mara@northwind.studio", role: "admin" },
  { id: "sofia", name: "Sofia Rossi", email: "sofia@northwind.studio", role: "member" },
  { id: "priya", name: "Priya Nair", email: "priya@northwind.studio", role: "viewer" },
  { id: "tomas", name: "Tomas Brandt", email: "tomas@northwind.studio", role: "member", status: "suspended" },
  { id: "jonas", email: "jonas@halcyon.io", role: "member", status: "invited", invitedAt: "2026-10-23T09:00:00Z" },
  { id: "hana", name: "Hana Sato", email: "hana.sato@kestrel.dev", role: "viewer", status: "invited", invitedAt: "2026-10-12T16:20:00Z" },
];

const PANEL: readonly Member[] = [
  { id: "p-leo", name: "Leo Martins", email: "leo@northwind.studio", role: "owner", owner: true },
  { id: "p-jonas", email: "jonas@halcyon.io", role: "member", status: "invited", invitedAt: "2026-10-23T09:00:00Z" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type Ask = { kind: "remove" | "revoke"; member: Member };

export default function Demo(): React.JSX.Element {
  const [members, setMembers] = useState(START);
  const [panel, setPanel] = useState(PANEL);
  const [note, setNote] = useState("");
  const [ask, setAsk] = useState<Ask | null>(null);
  const [open, setOpen] = useState(false);
  const refused = useRef(false);
  const list = useRef<HTMLUListElement>(null);

  const patch = (id: string, change: Partial<Member>) => setMembers((current) => current.map((member) => (member.id === id ? { ...member, ...change } : member)));
  const label = (member: Member) => member.name ?? member.email;
  const pending = members.filter((member) => member.status === "invited").length;

  async function changeRole(role: string, member: Member) {
    await wait(650);
    // Priya's first change is refused, so the failure state can be seen.
    if (member.id === "priya" && !refused.current) {
      refused.current = true;
      throw new Error("refused");
    }
    patch(member.id, { role });
  }

  // The side panel keeps its own list, so its select works too: the announced role is the role the row then shows.
  async function changePanelRole(role: string, member: Member) {
    await wait(650);
    setPanel((current) => current.map((item) => (item.id === member.id ? { ...item, role } : item)));
  }

  function act(action: string, member: Member) {
    if (action === "remove" || action === "revoke") {
      setAsk({ kind: action, member });
      setOpen(true);
    } else if (action === "suspend") {
      patch(member.id, { status: "suspended" });
      setNote(`${label(member)} can no longer sign in. Restore access to bring them back.`);
    } else if (action === "restore") {
      patch(member.id, { status: "active" });
      setNote(`${label(member)} can sign in again.`);
    } else if (action === "resend") {
      patch(member.id, { invitedAt: new Date(NOW).toISOString() });
      setNote(`Invite sent again to ${member.email}.`);
    } else {
      setNote(`Opening the profile of ${label(member)}.`);
    }
  }

  function confirm() {
    if (!ask) return;
    setMembers((current) => current.filter((member) => member.id !== ask.member.id));
    setNote(ask.kind === "revoke" ? `The invite for ${ask.member.email} no longer works.` : `${label(ask.member)} was removed from Northwind Studio.`);
    // The row that had focus is gone: focus moves to the list, not to the top of the page.
    requestAnimationFrame(() => list.current?.focus());
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-3xl gap-8">
        <section aria-labelledby="member-row-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
            <h2 id="member-row-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
              Members
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {members.length - pending} people, {pending} pending
            </p>
          </div>
          <ul ref={list} tabIndex={-1} aria-labelledby="member-row-demo-title" className="divide-y divide-border outline-none">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} roles={ROLES} isYou={member.id === "mara"} now={NOW} onRoleChange={changeRole} onAction={act} />
            ))}
          </ul>
          <p aria-live="polite" className="flex min-h-11 items-center gap-2 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
            {note ? (
              <>
                <IconCheck className="size-3.5 shrink-0 text-foreground" />
                {note}
              </>
            ) : (
              "Change a role or open a menu. Priya's first role change is refused, to show the failure state."
            )}
          </p>
        </section>

        <div className="grid gap-2">
          <p className="text-xs text-muted-foreground">In a narrow panel the same rows fold into two lines, with the owner's reason in plain text.</p>
          <ul aria-label="Members in a side panel" className="w-full max-w-sm divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            {panel.map((member) => (
              <MemberRow key={member.id} member={member} roles={ROLES} now={NOW} onRoleChange={changePanelRole} />
            ))}
          </ul>
        </div>

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{ask?.kind === "revoke" ? "Revoke this invite?" : `Remove ${ask ? label(ask.member) : "this person"} from Northwind Studio?`}</AlertDialogTitle>
              <AlertDialogDescription>
                {ask?.kind === "revoke"
                  ? `The link in the email to ${ask.member.email} stops working. You can invite them again later.`
                  : "They lose access to every project at once. Their comments and tasks stay, and you can invite them again."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirm}>
                {ask?.kind === "revoke" ? "Revoke invite" : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
