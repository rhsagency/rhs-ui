"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { IconAlertCircle, IconCheck, IconCheckCircle, IconMail, IconMoreHorizontal, IconPlus, IconSend, IconStar, IconTrash } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface EmailAddress {
  address: string;
  /** The address that receives sign-in links and receipts. Exactly one address should be primary. */
  primary: boolean;
  /** Whether the owner proved they can read mail sent to it. */
  verified: boolean;
}

export interface EmailAddressesSectionProps {
  /** Every address on the account. Controlled: update it in the callbacks. */
  emails: readonly EmailAddress[];
  /** A new address was entered. Throw an Error with a message to refuse it; the message is shown under the field. */
  onAdd?: (address: string) => void | Promise<void>;
  /** Make a verified address the primary one. */
  onMakePrimary?: (address: string) => void | Promise<void>;
  /** Remove an address, after the person confirmed in the row. Never called for the primary address. */
  onRemove?: (address: string) => void | Promise<void>;
  /** Send the verification link again. */
  onResend?: (address: string) => void | Promise<void>;
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

type Action = "primary" | "remove" | "resend";

const SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

const messageOf = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback);

/**
 * The email addresses on an account, and what each one can do: the primary
 * address is marked and cannot be removed (the row says why, in words), every
 * address says whether it is verified, and a menu per row makes one primary,
 * resends the verification link or removes it after an inline confirmation.
 * Adding another opens a field in place and the new address appears as not
 * verified with a note that the link was sent. Keyboard complete; on a narrow
 * screen the row actions collapse into the one menu button.
 */
export function EmailAddressesSection({
  emails,
  onAdd,
  onMakePrimary,
  onRemove,
  onResend,
  title = "Email addresses",
  description = "Sign in with any verified address. Account notices and receipts go to your primary one.",
  headingLevel = 2,
  className,
}: EmailAddressesSectionProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const list = useRef<HTMLUListElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const cancelRemoval = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<Record<string, Action>>({});
  const [sent, setSent] = useState<Record<string, true>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState("");

  // The primary address leads; the rest keep the order they came in.
  const rows = useMemo(() => [...emails].sort((a, b) => Number(b.primary) - Number(a.primary)), [emails]);

  useEffect(() => {
    if (adding) addInput.current?.focus();
  }, [adding]);
  useEffect(() => {
    if (confirming) cancelRemoval.current?.focus();
  }, [confirming]);

  const focusMenuOf = (address: string) =>
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-address="${CSS.escape(address)}"] [data-slot="email-menu"]`)?.focus());

  async function run(address: string, action: Action, task: (() => void | Promise<void>) | undefined, done: string): Promise<boolean> {
    if (!task || busy[address]) return false;
    const origin = document.activeElement;
    setBusy((current) => ({ ...current, [address]: action }));
    setRowError((current) => without(current, address));
    try {
      await task();
      if (action === "resend") setSent((current) => ({ ...current, [address]: true }));
      setAnnouncement(done);
      return true;
    } catch {
      const text = action === "remove" ? "Could not remove this address. Try again." : action === "resend" ? "Could not send the link. Try again." : "Could not change the primary address. Try again.";
      setRowError((current) => ({ ...current, [address]: text }));
      setAnnouncement(text);
      return false;
    } finally {
      setBusy((current) => without(current, address));
      // A button that was busy was disabled and dropped focus: put it back where the person was.
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        if (origin instanceof HTMLElement && origin.isConnected) origin.focus();
        else focusMenuOf(address);
      });
    }
  }

  async function remove(address: string) {
    const removed = await run(address, "remove", onRemove ? () => onRemove(address) : undefined, `${address} was removed.`);
    setConfirming(null);
    if (removed) requestAnimationFrame(() => addButton.current?.focus());
  }

  function closeAdd() {
    setAdding(false);
    setDraft("");
    setAddError(null);
    requestAnimationFrame(() => addButton.current?.focus());
  }

  async function submitAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = draft.trim();
    const problem = !address
      ? "Enter an email address."
      : !SHAPE.test(address)
        ? "That does not look like an email address. Check it and try again."
        : emails.some((email) => email.address.toLowerCase() === address.toLowerCase())
          ? "That address is already on your account."
          : null;
    if (problem) {
      setAddError(problem);
      addInput.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onAdd?.(address);
      setSent((current) => ({ ...current, [address]: true }));
      setAnnouncement(`Verification link sent to ${address}.`);
      closeAdd();
    } catch (error) {
      setAddError(messageOf(error, "Could not add that address. Try again."));
      requestAnimationFrame(() => addInput.current?.focus());
    } finally {
      setSubmitting(false);
    }
  }

  const escapeTo = (close: () => void) => (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    close();
  };

  return (
    <Card data-slot="email-addresses-section" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      {rows.length ? (
        <ul ref={list} role="list" className="divide-y divide-border border-t border-border">
          {rows.map((email) => {
            const { address } = email;
            const action = busy[address];
            const problem = rowError[address];
            const linkSent = Boolean(sent[address]) && !email.verified;
            const canPrimary = email.verified && !email.primary && Boolean(onMakePrimary);
            const canResend = !email.verified && Boolean(onResend);
            const canRemove = !email.primary && Boolean(onRemove);
            const hasMenu = canPrimary || canResend || canRemove;
            const makePrimary = () => void run(address, "primary", () => onMakePrimary?.(address), `${address} is now your primary address.`);
            const resend = () => void run(address, "resend", () => onResend?.(address), `Verification link sent to ${address}.`);

            if (confirming === address) {
              const stop = () => {
                setConfirming(null);
                focusMenuOf(address);
              };
              return (
                <li key={address} data-slot="email-row" data-address={address} onKeyDown={escapeTo(stop)} className="bg-destructive/5 px-6 py-4">
                  <div role="group" aria-label={`Confirm removing ${address}`} className="flex flex-wrap items-center gap-x-4 gap-y-3 motion-safe:animate-rhs-in">
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="text-sm font-medium [overflow-wrap:anywhere]">Remove {address}?</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">You will not be able to sign in with it, and notices will stop going there.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button ref={cancelRemoval} variant="outline" size="sm" disabled={action === "remove"} onClick={stop}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" loading={action === "remove"} onClick={() => void remove(address)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </li>
              );
            }

            return (
              <li key={address} data-slot="email-row" data-address={address} data-primary={email.primary || undefined} aria-busy={action ? true : undefined} className="flex items-start gap-3 px-6 py-4">
                <span aria-hidden="true" className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground">
                  <IconMail className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-medium [overflow-wrap:anywhere]">{address}</span>
                    {email.primary ? <Badge variant="secondary">Primary</Badge> : null}
                  </div>
                  <p className={cn("mt-1 flex items-center gap-1.5 text-xs", email.verified ? "text-muted-foreground" : "font-medium text-foreground")}>
                    {email.verified ? <IconCheckCircle className="size-3.5 shrink-0" /> : <IconAlertCircle className="size-3.5 shrink-0" />}
                    {email.verified ? "Verified" : "Not verified"}
                  </p>
                  {email.primary ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your primary address cannot be removed.{" "}
                      {rows.some((other) => !other.primary && other.verified) ? "Make another address primary first." : "Add and verify another address to replace it."}
                    </p>
                  ) : null}
                  {!email.verified ? (
                    <p className={cn("mt-1 flex items-center gap-1.5 text-xs text-muted-foreground", linkSent && "motion-safe:animate-rhs-in")}>
                      {linkSent ? <IconCheck className="size-3.5 shrink-0 text-foreground" /> : null}
                      {linkSent ? "Verification link sent. Check your inbox." : "Verify this address to use it for sign-in and to make it primary."}
                    </p>
                  ) : null}
                  {action && action !== "remove" ? <p className="mt-1 text-xs text-muted-foreground">{action === "resend" ? "Sending the link…" : "Making it primary…"}</p> : null}
                  {problem ? (
                    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive motion-safe:animate-rhs-in">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      {problem}
                    </p>
                  ) : null}
                </div>
                {hasMenu ? (
                  <div className="mt-0.5 flex shrink-0 items-center gap-1">
                    {canResend ? (
                      <Button variant="outline" size="sm" loading={action === "resend"} className="hidden @md:inline-flex" onClick={resend}>
                        Resend<span className="sr-only"> verification to {address}</span>
                      </Button>
                    ) : null}
                    {canPrimary ? (
                      <Button variant="outline" size="sm" loading={action === "primary"} className="hidden @md:inline-flex" onClick={makePrimary}>
                        Make primary<span className="sr-only"> for {address}</span>
                      </Button>
                    ) : null}
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button data-slot="email-menu" variant="ghost" size="icon-sm" className="-mr-2" aria-label={`More actions for ${address}`}>
                          <IconMoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onCloseAutoFocus={(event) => {
                          if (!keepFocus.current) return;
                          keepFocus.current = false;
                          event.preventDefault();
                        }}
                      >
                        {canPrimary ? (
                          <DropdownMenuItem disabled={Boolean(action)} onSelect={makePrimary}>
                            <IconStar />
                            Make primary
                          </DropdownMenuItem>
                        ) : null}
                        {canResend ? (
                          <DropdownMenuItem disabled={Boolean(action)} onSelect={resend}>
                            <IconSend />
                            Resend verification
                          </DropdownMenuItem>
                        ) : null}
                        {canRemove && (canPrimary || canResend) ? <DropdownMenuSeparator /> : null}
                        {canRemove ? (
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={Boolean(action)}
                            onSelect={() => {
                              keepFocus.current = true;
                              setConfirming(address);
                            }}
                          >
                            <IconTrash />
                            Remove
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">No email addresses yet. Add one to sign in and to get account notices.</p>
      )}
      {onAdd ? (
        <div className="rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5">
          {adding ? (
            <form noValidate className="motion-safe:animate-rhs-in" onSubmit={(event) => void submitAdd(event)} onKeyDown={escapeTo(closeAdd)}>
              <FormField error={addError} described>
                <FormLabel>New email address</FormLabel>
                <div className="flex flex-wrap gap-2">
                  <FormControl>
                    <Input
                      ref={addInput}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@example.com"
                      value={draft}
                      readOnly={submitting}
                      onChange={(event) => {
                        setDraft(event.target.value);
                        if (addError) setAddError(null);
                      }}
                      className="min-w-0 flex-1 basis-56"
                    />
                  </FormControl>
                  <div className="flex gap-2">
                    <Button type="submit" loading={submitting}>Add email</Button>
                    <Button type="button" variant="ghost" disabled={submitting} onClick={closeAdd}>Cancel</Button>
                  </div>
                </div>
                <FormDescription>We will send a link to confirm it. It cannot be used to sign in until it is verified.</FormDescription>
              </FormField>
            </form>
          ) : (
            <Button ref={addButton} variant="outline" size="sm" onClick={() => setAdding(true)}>
              <IconPlus />
              Add another email
            </Button>
          )}
        </div>
      ) : null}
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
    </Card>
  );
}
