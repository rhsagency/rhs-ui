import { cn } from "@/lib/utils";

export type ConnectionState = "connected" | "connecting" | "reconnecting" | "offline";

export interface ConnectionStatusProps {
  state: ConnectionState;
  /** What is connected: "Live updates", "Sync", "Printer". */
  label?: string;
  /** "Last synced 2 min ago", worked out on your side. */
  detail?: string;
  className?: string;
}

const COPY: Record<ConnectionState, string> = {
  connected: "Connected",
  connecting: "Connecting",
  reconnecting: "Reconnecting",
  offline: "Offline",
};

/**
 * The state of a live connection in a toolbar or footer: a dot that is
 * solid, pulsing or hollow (so it reads without colour) and the state in
 * words, with an optional last-synced line. A status region, so changes
 * are announced without stealing focus.
 */
export function ConnectionStatus({ state, label = "Live updates", detail, className }: ConnectionStatusProps) {
  return (
    <p data-slot="connection-status" role="status" className={cn("inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs", className)}>
      <span aria-hidden="true" className="relative inline-flex size-2">
        {state === "connecting" || state === "reconnecting" ? <span className="absolute inset-0 rounded-full bg-foreground/50 motion-safe:animate-ping" /> : null}
        <span className={cn("relative inline-block size-2 rounded-full", state === "connected" ? "bg-foreground" : state === "offline" ? "border border-destructive" : "bg-foreground/60")} />
      </span>
      <span>
        <span className="font-medium">{label}: </span>
        <span className={cn(state === "offline" && "text-destructive")}>{COPY[state]}</span>
        {detail ? <span className="text-muted-foreground"> · {detail}</span> : null}
      </span>
    </p>
  );
}
