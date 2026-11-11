"use client";

import { useRef, useState, type ReactNode } from "react";

import { AccessLevelMenu, type AccessLevel, type DisabledLevel } from "@rhs-ui/application/access-level-menu";
import { IconCheck, IconGlobe } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [people, setPeople] = useState(PEOPLE);
  const [link, setLink] = useState("viewer");
  const [note, setNote] = useState("");
  const refused = useRef(false);

  async function change(person: Person, level: string) {
    await wait(700);
    // Dan's first change is refused, so the way back can be seen: the button returns to Viewer and says why.
    if (person.id === "dan" && !refused.current) {
      refused.current = true;
      throw new Error("The access service did not answer.");
    }
    setPeople((list) => list.map((item) => (item.id === person.id ? { ...item, level } : item)));
    setNote(`${person.name} is now ${labelOf(level)}.`);
  }

  async function remove(person: Person) {
    await wait(500);
    setPeople((list) => list.filter((item) => item.id !== person.id));
    setNote(`${person.name} no longer has access.`);
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-2xl gap-9">
        {/* The room under the card is for Leo's open menu: it hangs below the list, so the case after it stays readable. */}
        <Case
          className="pb-32"
          caption="The role control of a sharing list. Leo's menu is open: Owner stays in the list with the reason under it, Remove access waits below the line and asks once more. The owner's row is locked and says why. Dan's first change is refused, to show the way back."
        >
          <section aria-labelledby="access-level-demo-title" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-3.5">
              <h2 id="access-level-demo-title" className="text-sm font-semibold tracking-[-0.01em]">
                Q4 launch plan
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {people.length} {people.length === 1 ? "person has" : "people have"} access
              </p>
            </div>
            <ul aria-label="People with access" className="divide-y divide-border">
              {people.map((person) => {
                const isOwner = person.level === "owner";
                return (
                  <li key={person.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                    <Avatar aria-hidden="true">
                      <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 basis-28">
                      <p className="truncate text-sm font-medium tracking-[-0.01em]">{person.name}</p>
                      <p className="truncate text-[0.8125rem] text-muted-foreground">{person.email}</p>
                    </div>
                    <AccessLevelMenu
                      // The locked block is the one control that wraps onto a line of its own on a phone: there it lines up with the name above it.
                      className={isOwner ? "ms-auto shrink-0 max-sm:ms-12 max-sm:items-start max-sm:text-left" : "ms-auto shrink-0"}
                      levels={LEVELS}
                      value={person.level}
                      subject={person.name}
                      locked={isOwner}
                      lockedReason="Transfer ownership to change this"
                      disabledLevels={NOT_OWNER}
                      defaultOpen={person.id === "leo"}
                      confirmRemove={person.id !== "dan"}
                      onValueChange={(level) => change(person, level)}
                      onRemove={() => remove(person)}
                    />
                  </li>
                );
              })}
            </ul>
            <p aria-live="polite" className="flex min-h-11 items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
              <span className="flex min-w-0 items-center gap-2">
                {note ? (
                  <>
                    <IconCheck aria-hidden="true" className="size-3.5 shrink-0 text-foreground" />
                    <span className="truncate">{note}</span>
                  </>
                ) : (
                  "Change a level or open a menu."
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPeople(PEOPLE);
                  setNote("");
                  // Dan's first change is refused again, so the way back can be replayed.
                  refused.current = false;
                }}
                className="-me-2 shrink-0 text-muted-foreground hover:text-foreground"
              >
                Reset
              </Button>
            </p>
          </section>
        </Case>

        <Case caption="Small and quiet, for a dense list. The ghost button has no border until you hover or open it, and the whole control names who it is for: Access for Anyone with the link.">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-xs">
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
              <IconGlobe />
            </span>
            <div className="min-w-0 flex-1 basis-28">
              <p className="truncate text-sm font-medium tracking-[-0.01em]">Anyone with the link</p>
              <p className="truncate text-[0.8125rem] text-muted-foreground">{link === "none" ? "Only the people listed can open it" : "Opens without signing in"}</p>
            </div>
            <AccessLevelMenu className="ms-auto shrink-0" size="sm" variant="ghost" levels={LINK_LEVELS} value={link} subject="Anyone with the link" onValueChange={setLink} />
          </div>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children, className = "" }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={`grid min-w-0 content-start gap-3 ${className}`}>
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const LEVELS: readonly AccessLevel[] = [
  { id: "owner", label: "Owner", description: "Full control, including billing and who else has access" },
  { id: "editor", label: "Editor", description: "Can edit, comment and share with others" },
  { id: "commenter", label: "Commenter", description: "Can read and leave comments" },
  { id: "viewer", label: "Viewer", description: "Can read, nothing else" },
];

const LINK_LEVELS: readonly AccessLevel[] = [
  { id: "none", label: "Restricted", description: "Only the people listed above can open it" },
  { id: "viewer", label: "Viewer", description: "Anyone with the link can read" },
  { id: "commenter", label: "Commenter", description: "Anyone with the link can read and comment" },
];

// Nobody but the owner hands over ownership, so for everyone else that level stays in the list and says why.
const NOT_OWNER: readonly DisabledLevel[] = [{ id: "owner", reason: "Only the owner can hand over ownership" }];

interface Person {
  id: string;
  name: string;
  email: string;
  level: string;
}

const PEOPLE: readonly Person[] = [
  { id: "maya", name: "Maya Okafor", email: "maya@halcyon.example", level: "owner" },
  { id: "leo", name: "Leo Martins", email: "leo@halcyon.example", level: "editor" },
  { id: "priya", name: "Priya Nair", email: "priya@kestrel.example", level: "commenter" },
  { id: "dan", name: "Dan Cho", email: "dan@northwind.example", level: "viewer" },
];

const labelOf = (id: string) => LEVELS.find((level) => level.id === id)?.label ?? id;
