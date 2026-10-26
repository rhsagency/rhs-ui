"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheckCircle, IconPlug, IconSettings, IconSpinner, IconWarning } from "@rhs-ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@rhs-ui/primitives/alert-dialog";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardTitle } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** Where the connection stands. Each has its own sentence, mark and weight, so none depends on colour. */
export type IntegrationStatus = "connected" | "attention" | "disconnected";

/** The tool a card shows. */
export interface Integration {
  /** A stable identity: the key of the card in its grid. */
  id: string;
  /** The tool's name. */
  name: string;
  /** One line on what it does. Clamped to two lines. */
  description: string;
  /** The tool's mark, drawn at 20px in a tile: an `svg` or an `img` element. Without one the tile shows the first letter of the name. */
  mark?: ReactNode;
  /** What it syncs, in lower case: ["invoices", "contacts", "payments"]. Written as "Invoices, contacts and payments" in the reader's language. */
  syncs?: readonly string[];
  /** Who is connected, as the tool knows them: "anna@studio.nl". Shown as "Connected as anna@studio.nl". */
  account?: string;
  /** When it last synced: a Date, a timestamp or an ISO string. */
  lastSyncedAt?: DateInput;
  /** What needs attention, in a sentence: "The login expired on 21 Oct." Shown under "Needs attention". */
  problem?: string;
  /** What disconnecting means, said in the confirmation. Defaults to a line about syncing stopping. */
  consequence?: string;
}

/** The words the card uses, for translation. `{name}`, `{account}`, `{action}` and `{syncs}` are filled in. */
export interface IntegrationCardLabels {
  /** The status sentence of a connection with an account. Default "Connected as {account}". */
  connectedAs?: string;
  /** The status sentence of a connection without one. Default "Connected". */
  connected?: string;
  /** The status sentence when it needs attention. Default "Needs attention". */
  attention?: string;
  /** The status sentence when it is not connected. Default "Not connected". */
  disconnected?: string;
  /** The word in the badge of a connection. Default "Connected". */
  badgeConnected?: string;
  /** The word in the badge when it needs attention. Default "Needs attention". */
  badgeAttention?: string;
  /** The word in the badge when it is not connected. Default "Not connected". */
  badgeDisconnected?: string;
  /** Shown while it connects. Default "Connecting…". */
  connecting?: string;
  /** Shown while it connects again after a problem. Default "Reconnecting…". */
  reconnecting?: string;
  /** Shown while it disconnects. Default "Disconnecting…". */
  disconnecting?: string;
  /** The name of the row that lists what it syncs. Default "Syncs". */
  syncs?: string;
  /** The name of the row with the last sync. Default "Last sync". */
  lastSync?: string;
  /** What the last sync says when there was none. Default "Not yet". */
  never?: string;
  /** What a sync under a minute old is called. Default "just now". */
  justNow?: string;
  /** The button that connects. Default "Connect". */
  connect?: string;
  /** The button that connects again after a problem. Default "Reconnect". */
  reconnect?: string;
  /** The button that opens the tool's settings. Default "Configure". */
  configure?: string;
  /** The button that starts a disconnect. Default "Disconnect". */
  disconnect?: string;
  /** The title of the confirmation. Default "Disconnect {name}?". */
  confirmTitle?: string;
  /** What the confirmation says when the integration gives no `consequence`, with `{syncs}` as the list of what it syncs. Default: it stops syncing, what it already synced stays, and you can connect again. */
  confirmBody?: string;
  /** The button that confirms. Default "Disconnect {name}". */
  confirm?: string;
  /** The button that keeps it connected. Default "Stay connected". */
  cancel?: string;
  /** Shown and said when a request failed. Default "Could not {action} {name}. Nothing was changed." */
  failed?: string;
  /** The word for connecting inside that sentence. Default "connect". */
  actionConnect?: string;
  /** The word for disconnecting inside that sentence. Default "disconnect". */
  actionDisconnect?: string;
  /** The retry button. Default "Try again". */
  retry?: string;
  /** Said when it connected. Default "{name} connected." */
  doneConnected?: string;
  /** Said when it disconnected. Default "{name} disconnected." */
  doneDisconnected?: string;
}

export interface IntegrationCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The tool to show. */
  integration: Integration;
  /** Where the connection stands. */
  status: IntegrationStatus;
  /** Connect, or reconnect when it needs attention. May return a promise: the card shows a busy state until it settles, and if it rejects the card stays put and offers a retry. */
  onConnect?: () => void | Promise<void>;
  /** Disconnect, after the person confirmed in the dialog. May return a promise, like `onConnect`. */
  onDisconnect?: () => void | Promise<void>;
  /** Open the tool's settings. Leave it out for no Configure button. */
  onConfigure?: () => void;
  /** Shows the busy state while you work, for a request you track yourself. A callback that returns a promise is tracked by the card. */
  busy?: boolean;
  /** A failure you track yourself: the card keeps its place, says it, and the retry button repeats the last action. */
  error?: string | null;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment the last sync is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates and of the list of what it syncs. Default "en-US". */
  locale?: string;
  /** The time zone the sync date is written in before the clock is known, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: IntegrationCardLabels;
}

const DEFAULT_LABELS = {
  connectedAs: "Connected as {account}",
  connected: "Connected",
  attention: "Needs attention",
  disconnected: "Not connected",
  badgeConnected: "Connected",
  badgeAttention: "Needs attention",
  badgeDisconnected: "Not connected",
  connecting: "Connecting…",
  reconnecting: "Reconnecting…",
  disconnecting: "Disconnecting…",
  syncs: "Syncs",
  lastSync: "Last sync",
  never: "Not yet",
  justNow: "just now",
  connect: "Connect",
  reconnect: "Reconnect",
  configure: "Configure",
  disconnect: "Disconnect",
  confirmTitle: "Disconnect {name}?",
  confirmBody: "{name} stops syncing {syncs}. What it already synced stays where it is, and you can connect it again at any time.",
  confirm: "Disconnect {name}",
  cancel: "Stay connected",
  failed: "Could not {action} {name}. Nothing was changed.",
  actionConnect: "connect",
  actionDisconnect: "disconnect",
  retry: "Try again",
  doneConnected: "{name} connected.",
  doneDisconnected: "{name} disconnected.",
} satisfies Required<IntegrationCardLabels>;

type Action = "connect" | "disconnect";

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "12 minutes ago", "yesterday": the age of a moment in the reader's language. Under a minute it says `justNow`. */
function ageIn(at: number, now: number, locale: string, justNow: string): string {
  const diff = at - now;
  const unit = UNITS.find(([, size]) => Math.abs(diff) >= size);
  if (!unit) return justNow;
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  // From a day up the count is rounded: 13.9 days is "2 weeks ago", 47 hours "2 days ago". Minutes and hours are cut, so 59.6 minutes never reads "60 minutes".
  const count = unit[1] >= 86_400_000 ? Math.round(diff / unit[1]) : Math.trunc(diff / unit[1]);
  return words.format(count, unit[0]);
}

/** A date in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** "invoices, contacts and payments" in the reader's language. */
function listOf(items: readonly string[], locale: string): string {
  try {
    return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(items);
  } catch {
    return new Intl.ListFormat("en-US", { style: "long", type: "conjunction" }).format(items);
  }
}

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

/**
 * The card for one connected tool on a settings page: its mark and name, one
 * line on what it does, and the connection said in words first (Connected as
 * anna@studio.nl, Needs attention with the reason, Not connected) with a badge
 * that only repeats it. Under that, what it syncs and when it last did.
 * Connect shows a busy state, Disconnect asks in a dialog that names the
 * consequence, and a request that fails leaves the card where it is with the
 * reason and a retry. Cards in a grid keep equal heights, with their buttons
 * on one line.
 */
export function IntegrationCard({
  integration,
  status,
  onConnect,
  onDisconnect,
  onConfigure,
  busy = false,
  error,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: IntegrationCardProps) {
  const text: Required<IntegrationCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const titleId = useId();
  const actions = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [failedAction, setFailedAction] = useState<Action | null>(null);
  const [asking, setAsking] = useState(false);
  const [said, setSaid] = useState("");

  const { name } = integration;
  const working = busy || pending !== null;
  const connected = status !== "disconnected";
  const clock = useNow(now, integration.lastSyncedAt !== undefined && connected);
  const syncedAt = integration.lastSyncedAt === undefined ? Number.NaN : new Date(integration.lastSyncedAt).getTime();
  const synced = Number.isNaN(syncedAt) ? null : syncedAt;
  const syncs = integration.syncs?.length ? listOf(integration.syncs, locale) : null;

  /** After a request the pressed button is gone or was disabled: focus goes to the card's own main action, not to the top of the page. */
  function settleFocus() {
    requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      actions.current?.querySelector<HTMLElement>("[data-retry], [data-primary]")?.focus();
    });
  }

  async function run(action: Action) {
    const handler = action === "connect" ? onConnect : onDisconnect;
    if (!handler || working) return;
    setFailedAction(null);
    setPending(action);
    setSaid(`${name}: ${action === "disconnect" ? text.disconnecting : status === "attention" ? text.reconnecting : text.connecting}`);
    try {
      await handler();
      setSaid(fill(action === "connect" ? text.doneConnected : text.doneDisconnected, { name }));
    } catch {
      setFailedAction(action);
      setSaid("");
    } finally {
      setPending(null);
      settleFocus();
    }
  }

  const failure = error ?? (failedAction ? fill(text.failed, { action: failedAction === "connect" ? text.actionConnect : text.actionDisconnect, name }) : null);
  const retryAction: Action = failedAction ?? (status === "connected" ? "disconnect" : "connect");

  // The sentence that says where things stand, and the mark in front of it.
  let headline: string;
  let detail: string | null = null;
  let mark: ReactNode;
  if (working) {
    const disconnecting = pending ? pending === "disconnect" : status === "connected";
    headline = disconnecting ? text.disconnecting : status === "attention" ? text.reconnecting : text.connecting;
    mark = <IconSpinner className="size-4 text-muted-foreground" />;
  } else if (status === "connected") {
    headline = integration.account ? fill(text.connectedAs, { account: integration.account }) : text.connected;
    mark = <IconCheckCircle className="size-4 text-foreground" />;
  } else if (status === "attention") {
    headline = text.attention;
    detail = integration.problem ?? null;
    mark = <IconWarning className="size-4 text-foreground" />;
  } else {
    headline = text.disconnected;
    mark = <IconPlug className="size-4 text-muted-foreground" />;
  }

  const badge =
    status === "connected" ? (
      <Badge variant="outline" className="gap-1.5">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
        {text.badgeConnected}
      </Badge>
    ) : status === "attention" ? (
      <Badge variant="default">
        <IconWarning />
        {text.badgeAttention}
      </Badge>
    ) : (
      <Badge variant="muted">{text.badgeDisconnected}</Badge>
    );

  const lastSync = !connected ? null : synced === null ? (
    text.never
  ) : (
    <time dateTime={new Date(synced).toISOString()} title={dateIn(synced, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning className="tabular-nums">
      {clock === null ? dateIn(synced, locale, timeZone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ageIn(synced, clock, locale, text.justNow)}
    </time>
  );

  const configure = onConfigure ? (
    <Button
      type="button"
      size="sm"
      variant="outline"
      data-primary={failure || status === "attention" ? undefined : ""}
      aria-disabled={working || undefined}
      className="aria-disabled:pointer-events-none aria-disabled:opacity-50 @max-[24rem]:w-8 @max-[24rem]:px-0"
      onClick={() => {
        if (!working) onConfigure();
      }}
    >
      <IconSettings />
      {/* In a narrow card the button is the gear alone, so Reconnect, Configure and Disconnect stay on one line; the word is still its name. */}
      <span className="@max-[24rem]:sr-only">{text.configure}</span>
    </Button>
  ) : null;

  return (
    <Card
      data-slot="integration-card"
      data-status={status}
      role="group"
      aria-labelledby={titleId}
      aria-busy={working ? true : undefined}
      className={cn("@container h-full min-w-0 gap-4 py-5", className)}
      {...props}
    >
      <div className="flex items-start gap-3 px-5">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg border text-base font-semibold select-none [&_svg]:size-5",
            connected ? "border-border bg-muted text-foreground" : "border-dashed border-border bg-transparent text-muted-foreground",
          )}
        >
          {integration.mark ?? name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CardTitle asChild>
              <Heading id={titleId} className="min-w-0 text-[0.9375rem] leading-snug tracking-[-0.01em] [overflow-wrap:anywhere]">
                {name}
              </Heading>
            </CardTitle>
            <span aria-hidden="true" className="shrink-0">
              {badge}
            </span>
          </div>
          <CardDescription className="mt-1 line-clamp-2 text-[0.8125rem] leading-5 text-pretty">{integration.description}</CardDescription>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-5">
        <div className="flex items-start gap-2.5">
          <span aria-hidden="true" className="mt-0.5 grid size-4 shrink-0 place-items-center">
            {mark}
          </span>
          <div className="min-w-0 flex-1 text-sm leading-5">
            <p className={cn("[overflow-wrap:anywhere]", !connected && !working ? "text-muted-foreground" : "font-medium", status === "attention" && !working && "font-semibold")}>{headline}</p>
            {detail ? <p className="mt-0.5 text-[0.8125rem] text-muted-foreground [overflow-wrap:anywhere]">{detail}</p> : null}
          </div>
        </div>

        {syncs || lastSync ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 border-t border-border pt-3 text-[0.8125rem] leading-5">
            {syncs ? (
              <>
                <dt className="text-muted-foreground">{text.syncs}</dt>
                <dd className="first-letter:uppercase [overflow-wrap:anywhere]">{syncs}</dd>
              </>
            ) : null}
            {lastSync ? (
              <>
                <dt className="text-muted-foreground">{text.lastSync}</dt>
                <dd>{lastSync}</dd>
              </>
            ) : null}
          </dl>
        ) : null}

        {failure ? (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[0.8125rem] leading-5 motion-safe:animate-rhs-in">
            <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p className="min-w-0 flex-1 font-medium text-destructive [overflow-wrap:anywhere]">{failure}</p>
          </div>
        ) : null}
      </div>

      <div ref={actions} className="flex flex-wrap items-center gap-2 border-t border-border px-5 pt-4">
        {failure ? (
          <Button type="button" size="sm" variant="outline" data-retry="" loading={working} onClick={() => void run(retryAction)}>
            {text.retry}
          </Button>
        ) : !connected ? (
          <Button type="button" size="sm" data-primary="" loading={working} disabled={!onConnect} onClick={() => void run("connect")}>
            {text.connect}
          </Button>
        ) : status === "attention" ? (
          <Button type="button" size="sm" data-primary="" loading={working && pending !== "disconnect"} disabled={!onConnect || (working && pending === "disconnect")} onClick={() => void run("connect")}>
            {text.reconnect}
          </Button>
        ) : null}
        {connected ? configure : null}
        {connected && onDisconnect ? (
          <AlertDialog open={asking} onOpenChange={(next) => setAsking(next && !working)}>
            <AlertDialogTrigger asChild>
              <Button type="button" size="sm" variant="ghost" aria-disabled={working || undefined} className="ms-auto text-muted-foreground hover:text-destructive aria-disabled:pointer-events-none aria-disabled:opacity-50">
                {text.disconnect}
                <span className="sr-only"> {name}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{fill(text.confirmTitle, { name })}</AlertDialogTitle>
                <AlertDialogDescription>{integration.consequence ?? fill(text.confirmBody, { name, syncs: syncs ?? "its data" })}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{text.cancel}</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => void run("disconnect")}>
                  {fill(text.confirm, { name })}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </Card>
  );
}
