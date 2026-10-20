"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconCheck, IconLock, IconMail, IconPause } from "@rhs-ui/icons";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

/** One step on a list's frequency control. */
export interface EmailFrequency {
  value: string;
  label: string;
}

/** A list someone can subscribe to. */
export interface EmailList {
  id: string;
  name: string;
  /** One line on what lands in the inbox. */
  description: string;
  /** The steps this list supports, least first: Off, Weekly, Monthly by default. The value "off" means no email. */
  frequencies?: readonly EmailFrequency[];
}

/** Email that is sent whatever the person chooses, with the reason it cannot be switched off. */
export interface TransactionalEmail {
  id: string;
  name: string;
  reason: string;
}

/** The chosen frequency per list id. */
export type EmailPreferences = Readonly<Record<string, string>>;

export interface EmailPreferenceCenterProps {
  /** The lists someone can tune. */
  lists: readonly EmailList[];
  /** Email that always arrives, shown apart under "Always sent". */
  transactional?: readonly TransactionalEmail[];
  /** The chosen frequency per list id. Controlled: pair with onChange. */
  value?: EmailPreferences;
  /** The starting choices when the component keeps them itself. */
  defaultValue?: EmailPreferences;
  /** Called at once for every change. Resolve when it is stored; reject to show that it was not. */
  onChange?: (listId: string, frequency: string) => Promise<void> | void;
  /** The address the preferences belong to. It is shown partly masked, so the page works without a signed-in session. */
  address: string;
  /** How long "Pause all emails" pauses for. */
  pauseDays?: number;
  /** ISO 8601 date until which email is paused. Controlled: pair with onResume. Omit to let the component remember it. */
  pausedUntil?: string | null;
  /** Called with the number of days. Without it the pause card is left out. */
  onPause?: (days: number) => Promise<void> | void;
  /** Called when someone ends the pause early. Without it a pause just runs out. */
  onResume?: () => Promise<void> | void;
  /** Called after the inline confirmation, with the reason if one was chosen. Without it the footer is left out. */
  onUnsubscribeAll?: (reason?: string) => Promise<void> | void;
  /** The answers offered to "Why are you leaving?". */
  unsubscribeReasons?: readonly string[];
  /** Language and region of the date a pause ends. */
  locale?: string;
  /** IANA time zone of that date. Defaults to "UTC" so server and browser agree. */
  timeZone?: string;
  /** The heading. */
  title?: string;
  /** The line under the address. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

const DEFAULT_FREQUENCIES: readonly EmailFrequency[] = [
  { value: "off", label: "Off" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const DEFAULT_REASONS = ["I get too many emails", "The emails are not relevant to me", "I never signed up for these", "Something else"];

type Note = "saving" | "saved" | "error";

/** Four short labels fit a phone once the segments are tightened (21 characters is the usual Off, Daily, Weekly, Monthly). */
const PHONE_LABEL_BUDGET = 22;

interface FrequencySelectProps {
  name: string;
  steps: readonly EmailFrequency[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/** The frequencies as a menu: for many steps, and on a phone for labels too long to sit side by side. */
function FrequencySelect({ name, steps, value, onValueChange, className }: FrequencySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger aria-label={`${name} frequency`} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {steps.map((step) => (
          <SelectItem key={step.value} value={step.value}>
            {step.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "ada.lovelace@northwind.example" becomes "ad****@northwind.example". */
function maskAddress(address: string): string {
  const at = address.lastIndexOf("@");
  if (at < 1) return address;
  const local = address.slice(0, at);
  const kept = local.length > 3 ? local.slice(0, 2) : local.slice(0, 1);
  return `${kept}${"*".repeat(Math.min(6, Math.max(3, local.length - kept.length)))}${address.slice(at)}`;
}

function RowNote({ note }: { note?: Note }) {
  return (
    <span role="status" className="inline-flex min-h-5 items-center gap-1.5 text-xs font-normal text-muted-foreground">
      {note === "saving" ? "Saving" : null}
      {note === "saved" ? (
        <>
          <IconCheck className="size-3.5 text-foreground" />
          Saved
        </>
      ) : null}
      {note === "error" ? <span className="text-destructive">Could not save</span> : null}
    </span>
  );
}

/**
 * The page behind "manage your emails". Every list is a row with what it
 * contains and a compact frequency control that saves the moment it changes
 * and says so; email that must always arrive sits apart with the reason it
 * cannot be switched off. A card at the top pauses everything for a while,
 * and the footer unsubscribes from all of it behind an inline confirmation
 * with an optional one-question reason. It needs no signed-in session: pass
 * the address, which is shown partly masked.
 */
export function EmailPreferenceCenter({
  lists,
  transactional = [],
  value,
  defaultValue,
  onChange,
  address,
  pauseDays = 30,
  pausedUntil,
  onPause,
  onResume,
  onUnsubscribeAll,
  unsubscribeReasons = DEFAULT_REASONS,
  locale = "en-US",
  timeZone = "UTC",
  title = "Email preferences",
  description = "Changes save as you make them. You do not need to sign in.",
  headingLevel = 2,
  className,
}: EmailPreferenceCenterProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const Sub = headingLevel === 3 ? "h4" : "h3";
  const [own, setOwn] = useState<EmailPreferences>(defaultValue ?? {});
  const [ownPause, setOwnPause] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [pending, setPending] = useState<Record<string, string>>({});
  const [pausing, setPausing] = useState(false);
  const [pauseFailed, setPauseFailed] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [unsubscribeFailed, setUnsubscribeFailed] = useState(false);
  const [reason, setReason] = useState("");
  const timers = useRef<Record<string, number>>({});
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scheduled = timers.current;
    return () => Object.values(scheduled).forEach((timer) => window.clearTimeout(timer));
  }, []);
  // The button that was pressed leaves with the footer, so the confirmation takes the focus.
  useEffect(() => {
    if (unsubscribed) confirmation.current?.focus();
  }, [unsubscribed]);

  const current = value ?? own;
  const paused = pausedUntil !== undefined ? pausedUntil : ownPause;
  const firstOf = (list: EmailList) => (list.frequencies ?? DEFAULT_FREQUENCIES)[0]?.value ?? "off";
  // A choice shows at once and stays while it is being saved; if saving fails it goes back.
  const frequencyOf = (list: EmailList) => pending[list.id] ?? current[list.id] ?? firstOf(list);
  const dayFormat = new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "long", year: "numeric" });
  const day = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : dayFormat.format(date);
  };

  function note(listId: string, next: Note, clearAfter?: number) {
    window.clearTimeout(timers.current[listId]);
    setNotes((all) => ({ ...all, [listId]: next }));
    if (clearAfter) {
      timers.current[listId] = window.setTimeout(() => setNotes(({ [listId]: _gone, ...rest }) => rest), clearAfter);
    }
  }

  async function change(list: EmailList, next: string) {
    if (next === frequencyOf(list)) return;
    setUnsubscribed(false);
    setPending((all) => ({ ...all, [list.id]: next }));
    note(list.id, "saving");
    try {
      await onChange?.(list.id, next);
      if (value === undefined) setOwn((all) => ({ ...all, [list.id]: next }));
      note(list.id, "saved", 2800);
    } catch {
      note(list.id, "error", 4000);
    } finally {
      setPending(({ [list.id]: _gone, ...rest }) => rest);
    }
  }

  async function pause() {
    setPausing(true);
    setPauseFailed(false);
    try {
      await onPause?.(pauseDays);
      setOwnPause(new Date(Date.now() + pauseDays * 86_400_000).toISOString());
    } catch {
      setPauseFailed(true);
    } finally {
      setPausing(false);
    }
  }

  async function resume() {
    setPausing(true);
    setPauseFailed(false);
    try {
      await onResume?.();
      setOwnPause(null);
    } catch {
      setPauseFailed(true);
    } finally {
      setPausing(false);
    }
  }

  async function unsubscribeAll() {
    setUnsubscribeFailed(false);
    try {
      await onUnsubscribeAll?.(reason || undefined);
    } catch {
      setUnsubscribeFailed(true);
      return;
    }
    if (value === undefined) setOwn(Object.fromEntries(lists.map((list) => [list.id, "off"])));
    setOwnPause(null);
    setReason("");
    setUnsubscribed(true);
  }

  return (
    <section data-slot="email-preference-center" aria-labelledby={`${id}-title`} className={cn("w-full space-y-6", className)}>
      <header>
        <Heading id={`${id}-title`} className="text-2xl font-semibold tracking-[-0.03em]">
          {title}
        </Heading>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <IconMail className="size-4 shrink-0" />
          <span>
            Managing email for <span className="font-medium text-foreground">{maskAddress(address)}</span>
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      {unsubscribed ? (
        <div ref={confirmation} tabIndex={-1} role="status" className="flex items-start gap-4 rounded-xl border border-border bg-card px-5 py-5 shadow-xs outline-none sm:px-6">
          <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <IconCheck className="size-4" />
          </span>
          <div>
            <Sub className="text-sm font-medium">You are unsubscribed from everything</Sub>
            <p className="mt-0.5 text-sm text-muted-foreground">Every list below is off for {maskAddress(address)}. You can switch one back on whenever you like.</p>
          </div>
        </div>
      ) : onPause || paused ? (
        <Card className="gap-0 py-0">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
            <div className="flex items-start gap-4">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted">
                <IconPause className="size-4" />
              </span>
              <div>
                <Sub className="text-sm font-medium">{paused ? `Paused until ${day(paused)}` : `Pause all emails for ${pauseDays} days`}</Sub>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {paused ? "Nothing from the lists below reaches you until then." : "Take a break without losing your choices. Always-sent email keeps coming."}
                </p>
                <p role="status" className="mt-1 text-sm text-destructive empty:hidden">
                  {pauseFailed ? "That did not go through. Nothing changed, so you can try again." : null}
                </p>
              </div>
            </div>
            {paused ? (
              onResume ? (
                <Button onClick={() => void resume()} loading={pausing} className="sm:shrink-0">
                  Resume emails
                </Button>
              ) : null
            ) : (
              <Button variant="outline" onClick={() => void pause()} loading={pausing} className="sm:shrink-0">
                Pause for {pauseDays} days
              </Button>
            )}
          </div>
        </Card>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b border-border px-6 pt-6">
          <CardTitle asChild className="text-base tracking-[-0.02em]">
            <Sub>Email lists</Sub>
          </CardTitle>
          <CardDescription>Choose how often each one reaches you.</CardDescription>
          {paused ? (
            <CardAction>
              <Badge variant="muted">Paused</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <ul className="divide-y divide-border">
          {lists.map((list) => {
            const steps = list.frequencies ?? DEFAULT_FREQUENCIES;
            // Side by side the labels need about 7 px a character at 13 px plus the padding; past the budget a phone gets the menu.
            const fitsPhone = steps.reduce((sum, step) => sum + step.label.length, 0) <= PHONE_LABEL_BUDGET;
            return (
              <li key={list.id} className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm font-medium">
                    {list.name}
                    <RowNote note={notes[list.id]} />
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{list.description}</p>
                </div>
                <div>
                  {steps.length > 4 ? (
                    <FrequencySelect name={list.name} steps={steps} value={frequencyOf(list)} onValueChange={(next) => void change(list, next)} className="w-full sm:w-44" />
                  ) : (
                    <>
                      <SegmentedControl
                        label={`${list.name} frequency`}
                        value={frequencyOf(list)}
                        onValueChange={(next) => void change(list, next)}
                        options={steps}
                        className={cn("w-full rounded-lg sm:w-auto sm:min-w-64 [&>button]:flex-1 [&>button]:px-1.5 [&>button]:py-1.5 [&>button]:text-[0.8125rem] sm:[&>button]:px-3", fitsPhone ? "flex" : "hidden sm:flex")}
                      />
                      {fitsPhone ? null : <FrequencySelect name={list.name} steps={steps} value={frequencyOf(list)} onValueChange={(next) => void change(list, next)} className="w-full sm:hidden" />}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {transactional.length ? (
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b border-border px-6 pt-6">
            <CardTitle asChild className="text-base tracking-[-0.02em]">
              <Sub>Always sent</Sub>
            </CardTitle>
            <CardDescription>These keep your account working, so they cannot be switched off.</CardDescription>
          </CardHeader>
          <ul className="divide-y divide-border">
            {transactional.map((item) => (
              <li key={item.id} className="flex items-start gap-4 px-6 py-4">
                <span aria-hidden="true" className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <IconLock className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {item.name}
                    <span className="sr-only">, always sent</span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {onUnsubscribeAll && !unsubscribed ? (
        <Card className="gap-0 py-0">
          <div className="grid grid-cols-1 gap-5 px-5 py-5 sm:px-6">
            <div>
              <Sub className="text-sm font-medium">Unsubscribe from everything</Sub>
              <p className="mt-0.5 text-sm text-muted-foreground">Turns off every list above at once. What is under Always sent still arrives.</p>
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-4">
              <div className="grid w-full gap-2 sm:w-72">
                <Label htmlFor={`${id}-reason`}>
                  Why are you leaving?
                  <span className="text-xs font-normal text-muted-foreground">Optional</span>
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id={`${id}-reason`} className="w-full">
                    <SelectValue placeholder="Choose a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {unsubscribeReasons.map((entry) => (
                      <SelectItem key={entry} value={entry}>
                        {entry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <InlineConfirm
                size="default"
                question="Unsubscribe from all lists?"
                onConfirm={unsubscribeAll}
                className="max-w-full flex-wrap border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive max-[23rem]:[&>span]:basis-full [&>span]:text-foreground"
              >
                Unsubscribe from everything
              </InlineConfirm>
            </div>
            <p role="status" className="min-h-4 text-sm text-destructive empty:hidden">
              {unsubscribeFailed ? "That did not go through. Nothing changed, so you can try again." : null}
            </p>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
