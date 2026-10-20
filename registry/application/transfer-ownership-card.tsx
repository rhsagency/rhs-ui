"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { IconArrowRight, IconCheck, IconCheckCircle, IconChevronsUpDown, IconSpinner, IconUsers } from "@rhs-ui/icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@rhs-ui/primitives/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface, Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/** Someone who could become the owner. */
export interface TransferMember {
  /** Identity of the member, handed to `onTransfer`. */
  id: string;
  /** The full name, as it is shown. */
  name: string;
  /** Their email address, shown under the name and matched by the search. */
  email: string;
  /** Their role now, in words: "Admin", "Member". */
  role: string;
  /** A picture. Initials show until it loads, or when there is none. */
  avatarUrl?: string;
  /** Why this person cannot be chosen: "Has not accepted the invite". The row is shown, greyed out, with the reason in place of the role. */
  disabledReason?: string;
}

export interface TransferOwnershipCardProps {
  /** The people who could take over: the members you would allow, in the order to list them. */
  members: readonly TransferMember[];
  /** The name of what is handed over. The person has to type it to confirm. */
  workspaceName: string;
  /** What changes, one line each. Left out, a default list names the new owner and says that nothing else changes. */
  consequences?: readonly ReactNode[];
  /**
   * Does the transfer. Resolve to nothing when it worked, or resolve to (or throw) a message when it failed:
   * the card keeps the choice and shows the message.
   */
  onTransfer: (memberId: string) => void | string | Promise<void | string>;
  /** Adds a Cancel button next to Transfer, for when this card is a step the person can leave. */
  onCancel?: () => void;
  /** The member chosen when the card first shows. */
  defaultMemberId?: string;
  /** What the confirmation dialog says about the transfer. Default: who becomes the owner, that you become an Admin, and that only they can hand ownership back. Say what is true for your product. */
  confirmDescription?: ReactNode;
  /** The heading. Default "Transfer ownership". */
  title?: string;
  /** The line under the heading, until the transfer has worked. Default: hands the workspace to another member, and says a workspace has one owner. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the card. */
  className?: string;
}

function MemberAvatar({ member }: { member: TransferMember }) {
  return (
    <Avatar aria-hidden="true" className="size-8 data-[size=default]:size-8">
      {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
      <AvatarFallback className="text-xs">{initialsOf(member.name)}</AvatarFallback>
    </Avatar>
  );
}

/**
 * What the search finds: the typed text inside a name or an email address, capitals ignored. The keywords are the name and the email, so the
 * role and the id never match; a list that hands a workspace over should not show people who do not look like what was typed.
 */
function matchMember(_value: string, search: string, keywords: string[] = []): number {
  const needle = search.trim().toLowerCase();
  return !needle || keywords.some((text) => text.toLowerCase().includes(needle)) ? 1 : 0;
}

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/** The list of members, as a field that opens a searchable panel. Each row has the picture, the name, the email and the role. */
function MemberPicker({ members, value, onValueChange, triggerId, labelId }: { members: readonly TransferMember[]; value: string | null; onValueChange: (id: string) => void; triggerId: string; labelId: string }) {
  const [open, setOpen] = useState(false);
  const valueId = useId();
  const chosen = members.find((member) => member.id === value && !member.disabledReason);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={triggerId}
        data-slot="member-picker"
        disabled={members.length === 0}
        aria-labelledby={`${labelId} ${valueId}`}
        className={cn(fieldSurface, "flex h-14 w-full min-w-0 items-center gap-3 px-3 text-left")}
      >
        <span id={valueId} className="flex min-w-0 flex-1 items-center gap-3">
          {chosen ? (
            <>
              <MemberAvatar member={chosen} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm leading-tight font-medium">{chosen.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{chosen.email}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{chosen.role}</span>
            </>
          ) : (
            <>
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full border border-dashed border-border text-muted-foreground">
                <IconUsers size={16} />
              </span>
              <span className="truncate text-sm text-muted-foreground">{members.length ? "Choose a member" : "No eligible members"}</span>
            </>
          )}
        </span>
        <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Members" className="w-(--radix-popover-trigger-width) min-w-64 overflow-hidden p-0">
        <Command loop filter={matchMember} className="rounded-none bg-transparent">
          <CommandInput placeholder="Search by name or email" aria-label="Search members" />
          <CommandList>
            <CommandEmpty>No member matches that.</CommandEmpty>
            {members.map((member) => {
              const selected = member.id === value;
              return (
                <CommandItem
                  key={member.id}
                  value={member.id}
                  keywords={[member.name, member.email]}
                  disabled={Boolean(member.disabledReason)}
                  onSelect={() => {
                    onValueChange(member.id);
                    setOpen(false);
                  }}
                  className="gap-3 py-2 pr-9"
                >
                  <MemberAvatar member={member} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm leading-tight font-medium text-foreground">{member.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                  <span className="max-w-[40%] shrink-0 text-right text-xs leading-snug text-muted-foreground">{member.disabledReason ?? member.role}</span>
                  {selected ? (
                    <>
                      <IconCheck size={14} className="absolute right-2.5 text-foreground" />
                      <span className="sr-only">, selected</span>
                    </>
                  ) : null}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Hands a workspace to someone else, with the care it deserves. A card in the
 * danger style (a destructive border, never a red fill) holds a searchable
 * list of the eligible members, each with a picture, name, email and role, and
 * a plain list of what changes. Transfer opens an alert dialog that names what
 * is being handed over and to whom, puts focus on Cancel, and keeps its
 * confirm button disabled until the workspace name is typed exactly. If the
 * transfer fails, the choice stays and the message is shown where the person
 * is looking.
 */
export function TransferOwnershipCard({
  members,
  workspaceName,
  consequences,
  onTransfer,
  onCancel,
  defaultMemberId,
  confirmDescription,
  title = "Transfer ownership",
  description,
  headingLevel = 2,
  className,
}: TransferOwnershipCardProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const [memberId, setMemberId] = useState<string | null>(defaultMemberId ?? null);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<TransferMember | null>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const member = members.find((candidate) => candidate.id === memberId && !candidate.disabledReason) ?? null;
  const first = member ? (member.name.split(" ")[0] ?? member.name) : "The new owner";
  const matches = typed.trim() === workspaceName.trim();
  const lines = consequences ?? [
    `You become an Admin of ${workspaceName}.`,
    `${first} becomes the owner, takes over billing and can delete the workspace.`,
    "Members, projects and settings stay exactly as they are.",
  ];

  // The button that opened the dialog is gone once it worked, so focus goes to the confirmation.
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  function changeOpen(next: boolean) {
    if (busy) return;
    setOpen(next);
    if (!next) {
      setTyped("");
      setError(null);
    }
  }

  async function confirm() {
    if (!member || !matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onTransfer(member.id);
      if (typeof result === "string" && result) {
        setError(result);
        return;
      }
      setOpen(false);
      setDone(member);
    } catch (thrown) {
      setError(messageOf(thrown) ?? "Something went wrong, and nothing was changed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    // The dialog wraps the card, so it can finish closing after the card has switched to the confirmation.
    <AlertDialog open={open} onOpenChange={changeOpen}>
      <Card data-slot="transfer-ownership-card" role="group" aria-labelledby={`${id}-title`} className={cn("gap-0 pb-0", !done && "border-destructive/40", className)}>
        <CardHeader className={cn("pb-6", done && "grid-rows-[auto]")}>
          <CardTitle asChild>
            <Heading id={`${id}-title`} className="text-base">
              {title}
            </Heading>
          </CardTitle>
          {/* Once it is done the instruction is no longer true and the confirmation below says what happened; the header gives up its second row, so no gap is left behind. */}
          {done ? null : <CardDescription className="text-pretty">{description ?? `Hand ${workspaceName} to another member. A workspace has one owner.`}</CardDescription>}
        </CardHeader>

        {done ? (
          <CardContent className="pb-6">
            <div ref={doneRef} tabIndex={-1} role="status" className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <IconCheckCircle className="mt-0.5 size-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Ownership transferred</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {done.name} now owns {workspaceName}. You are an Admin.
                </p>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
            <CardContent className="grid gap-5 pb-6">
              <div className="grid gap-2">
                <Label id={`${id}-label`} htmlFor={`${id}-member`}>
                  New owner
                </Label>
                <MemberPicker members={members} value={memberId} onValueChange={setMemberId} triggerId={`${id}-member`} labelId={`${id}-label`} />
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium">What changes</p>
                <ul className="mt-3 grid gap-2.5 text-sm text-muted-foreground">
                  {lines.map((line, index) => (
                    <li key={index} className="flex items-start gap-2.5">
                      <IconArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-foreground/60" />
                      <span className="min-w-0 text-pretty">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <div className="flex flex-col gap-4 rounded-b-xl border-t border-destructive/25 bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p id={`${id}-hint`} className="text-sm text-muted-foreground">
                {member ? "You will confirm by typing the workspace name." : members.length ? "Choose a new owner to continue." : "Invite a member first: there is nobody to hand it to yet."}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {onCancel ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setMemberId(null);
                      onCancel();
                    }}
                  >
                    Cancel
                  </Button>
                ) : null}
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!member}
                    aria-describedby={`${id}-hint`}
                    className="border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                  >
                    Transfer ownership
                  </Button>
                </AlertDialogTrigger>
              </div>
            </div>
          </>
        )}
      </Card>

      {member ? (
        <AlertDialogContent onEscapeKeyDown={(event) => busy && event.preventDefault()}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-pretty">
              Transfer {workspaceName} to {member.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription ?? `${member.name} becomes the owner of ${workspaceName} and you become an Admin. You cannot undo this yourself: only ${first} can give ownership back.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${id}-confirm`} className="block leading-snug font-normal">
              Type <span className="font-mono text-[0.8125rem] font-semibold break-words">{workspaceName}</span> to confirm
            </Label>
            <div className="relative">
              <Input
                id={`${id}-confirm`}
                value={typed}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                aria-describedby={`${id}-confirm-hint`}
                className="pr-9"
                onChange={(event) => setTyped(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void confirm();
                  }
                }}
              />
              {matches ? <IconCheck aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" /> : null}
            </div>
            <p id={`${id}-confirm-hint`} role="status" className="text-xs text-muted-foreground">
              {matches ? "The name matches." : "Typed exactly, capitals included."}
            </p>
          </div>
          {/* Rendered even while empty (out of the way, not hidden), so a screen reader hears the message when it arrives. */}
          <div role="alert" className="empty:sr-only">
            {error ? (
              <Callout tone="danger" title="Ownership was not transferred">
                {error}
              </Callout>
            ) : null}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel aria-disabled={busy || undefined} onClick={(event) => busy && event.preventDefault()}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!matches}
              aria-disabled={busy || undefined}
              onClick={(event) => {
                // The dialog stays open until the transfer has worked.
                event.preventDefault();
                void confirm();
              }}
            >
              {busy ? <IconSpinner /> : null}
              {busy ? "Transferring…" : "Transfer ownership"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : null}
    </AlertDialog>
  );
}
