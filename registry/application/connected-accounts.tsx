"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { IconAlertCircle, IconCheck, IconLock, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface ConnectedAccount {
  /** A stable id: "google", "github". Passed back to the callbacks. */
  id: string;
  /** The provider, written out: "Google". */
  name: string;
  /** Who is connected, as the provider knows them: "ana@acme.com". Set while connected. */
  identity?: string;
  /** When it was connected, as an ISO string or a Date. Set while connected. */
  connectedAt?: string | Date;
  /** One or two characters for the tile. Defaults to the first letter of the name. */
  monogram?: string;
}

export interface ConnectedAccountsProps {
  /** Every provider you offer, connected or not. An account counts as connected once it has an identity or a date. */
  accounts: readonly ConnectedAccount[];
  /** Start connecting a provider. May return a promise; the row shows a busy state until it settles. */
  onConnect: (id: string) => void | Promise<void>;
  /** Disconnect a provider, after the person confirmed in the row. May return a promise. */
  onDisconnect: (id: string) => void | Promise<void>;
  /**
   * Whether a connected provider may be removed. Return false for the last way to
   * sign in. Without it, the only connected provider is protected; pass your own
   * when a password or passkey also counts as a way in.
   */
  canDisconnect?: (id: string) => boolean;
  /** How to add another way in, for a protected provider: a tooltip, and plain text under the row where a tooltip cannot open (touch, narrow rows). */
  protectedHint?: string;
  /** Locale for the connection date. */
  locale?: string;
  /** IANA time zone the connection date is shown in, so server and browser agree. */
  timeZone?: string;
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

type Action = "connect" | "disconnect";

const isConnected = (account: ConnectedAccount) => Boolean(account.identity || account.connectedAt);

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const next = { ...record };
  delete next[key];
  return next;
}

function makeFormatter(locale: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone });
  } catch {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  }
}

/**
 * The sign-in providers linked to an account, row by row: who is connected,
 * as whom and since when, with Connect and Disconnect beside each. Removing
 * the last way in is blocked in words (with a tooltip, or on touch and in
 * narrow rows plain text, on how to add another), disconnecting asks inside
 * the row and Escape answers No, busy and failed states stay on the row,
 * and the result is announced. About how people sign in, not about which
 * apps may read their data.
 */
export function ConnectedAccounts({
  accounts,
  onConnect,
  onDisconnect,
  canDisconnect,
  protectedHint = "Connect another account or set a password first, then you can disconnect this one.",
  locale = "en-GB",
  timeZone = "UTC",
  title = "Connected accounts",
  description = "Sign in with an account you already have. These are ways in, not apps that can read your data.",
  headingLevel = 2,
  className,
}: ConnectedAccountsProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const list = useRef<HTMLUListElement>(null);
  const [busy, setBusy] = useState<Record<string, Action>>({});
  const [failed, setFailed] = useState<Record<string, Action>>({});
  const [announcement, setAnnouncement] = useState("");
  const focusAfter = useRef<string | null>(null);
  const before = useRef<Map<string, boolean> | null>(null);
  const formatter = useMemo(() => makeFormatter(locale, timeZone), [locale, timeZone]);

  const connectedCount = accounts.filter(isConnected).length;
  const mayDisconnect = (accountId: string) => (canDisconnect ? canDisconnect(accountId) : connectedCount > 1);

  // Say what changed, from the data itself, so it holds however the parent applies the change.
  useEffect(() => {
    const next = new Map(accounts.map((account) => [account.id, isConnected(account)]));
    const previous = before.current;
    before.current = next;
    if (!previous) return;
    for (const account of accounts) {
      const was = previous.get(account.id);
      const now = next.get(account.id);
      if (was === undefined || was === now) continue;
      setAnnouncement(now ? `${account.name} connected.` : `${account.name} disconnected.`);
      if (focusAfter.current === account.id) {
        focusAfter.current = null;
        const target = account.id;
        requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-account="${CSS.escape(target)}"] [data-slot="account-action"] button`)?.focus());
      }
    }
  }, [accounts]);

  async function run(account: ConnectedAccount, action: Action) {
    setFailed((current) => without(current, account.id));
    setBusy((current) => ({ ...current, [account.id]: action }));
    focusAfter.current = account.id;
    try {
      await (action === "connect" ? onConnect(account.id) : onDisconnect(account.id));
    } catch {
      focusAfter.current = null;
      setFailed((current) => ({ ...current, [account.id]: action }));
      setAnnouncement(`Could not ${action} ${account.name}. Try again.`);
    } finally {
      setBusy((current) => without(current, account.id));
      // A button that was busy was disabled and dropped focus: put it back where the person was.
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        list.current?.querySelector<HTMLElement>(`[data-account="${CSS.escape(account.id)}"] [data-slot="account-action"] button`)?.focus();
      });
      window.setTimeout(() => {
        if (focusAfter.current === account.id) focusAfter.current = null;
      }, 1000);
    }
  }

  return (
    <TooltipProvider>
      <Card data-slot="connected-accounts" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
        <CardHeader className="pb-6">
          <CardTitle asChild>
            <Heading id={`${id}-title`} className="text-base">{title}</Heading>
          </CardTitle>
          <CardDescription className="text-pretty">{description}</CardDescription>
        </CardHeader>
        {accounts.length ? (
          <ul ref={list} role="list" className="divide-y divide-border border-t border-border">
            {accounts.map((account) => {
              const connected = isConnected(account);
              const action = busy[account.id];
              const problem = failed[account.id];
              const protectedRow = connected && !mayDisconnect(account.id);
              const date = account.connectedAt ? new Date(account.connectedAt) : null;
              const dateValid = date !== null && !Number.isNaN(date.getTime());
              return (
                <li
                  key={account.id}
                  data-account={account.id}
                  data-state={connected ? "connected" : "idle"}
                  aria-busy={action ? true : undefined}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 px-6 py-4 @md:grid-cols-[auto_minmax(0,1fr)_auto] @md:gap-x-4"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "relative flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tracking-tight select-none",
                      connected ? "border-border bg-muted text-foreground" : "border-dashed border-border text-muted-foreground",
                    )}
                  >
                    {account.monogram ?? account.name.slice(0, 1).toUpperCase()}
                    {connected ? (
                      <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border-2 border-card bg-foreground text-background">
                        <IconCheck size={9} />
                      </span>
                    ) : null}
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-baseline gap-x-2 text-sm [overflow-wrap:anywhere]">
                      <span className="font-medium">{account.name}</span>
                      {connected && account.identity ? <span className="text-muted-foreground">{account.identity}</span> : null}
                    </p>
                    {action ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{action === "connect" ? "Connecting" : "Disconnecting"}…</p>
                    ) : connected ? (
                      dateValid ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Connected <time dateTime={date.toISOString()} className="tabular-nums">{formatter.format(date)}</time>
                        </p>
                      ) : null
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">Not connected</p>
                    )}
                    {problem ? (
                      <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive motion-safe:animate-rhs-in">
                        <IconAlertCircle className="size-3.5 shrink-0" />
                        Could not {problem} {account.name}. Try again.
                      </p>
                    ) : null}
                  </div>
                  <div
                    data-slot="account-action"
                    className="col-start-2 @md:col-start-3 @md:justify-self-end"
                    onKeyDown={(event) => {
                      // Escape answers the open question with No, which also puts focus back on Disconnect.
                      if (event.key !== "Escape" || action) return;
                      event.currentTarget.querySelector<HTMLButtonElement>('[data-slot="inline-confirm"] button:last-of-type')?.click();
                    }}
                  >
                    {!connected ? (
                      <Button variant="outline" size="sm" loading={action === "connect"} onClick={() => void run(account, "connect")}>
                        {action === "connect" ? null : <IconPlus />}
                        Connect
                      </Button>
                    ) : protectedRow ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-describedby={`${id}-${account.id}-hint`}
                            className="inline-flex h-8 cursor-help items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none @max-md:-ml-2"
                          >
                            <IconLock className="size-3.5" />
                            Your only way to sign in
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{protectedHint}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <InlineConfirm
                        question={`Disconnect ${account.name}?`}
                        confirmLabel="Disconnect"
                        className="flex-wrap border-border [&>span:first-child]:font-medium [&>span:first-child]:text-foreground"
                        onConfirm={() => run(account, "disconnect")}
                      >
                        Disconnect
                      </InlineConfirm>
                    )}
                    {protectedRow ? <span id={`${id}-${account.id}-hint`} className="sr-only">{protectedHint}</span> : null}
                  </div>
                  {/* A tooltip never opens on touch and a narrow row has little room for one, so there the same words are plain text (assistive technology already has them through the button). */}
                  {protectedRow ? (
                    <p aria-hidden="true" className="col-start-2 -mt-2.5 hidden text-xs text-muted-foreground @max-md:block pointer-coarse:block">
                      {protectedHint}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">No sign-in providers are set up yet.</p>
        )}
        <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      </Card>
    </TooltipProvider>
  );
}
