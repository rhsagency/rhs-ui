import { cn } from "@/lib/utils";

export type ServiceStatus = "operational" | "degraded" | "outage" | "maintenance";

const STATUS: Record<ServiceStatus, { dot: string; text: string }> = {
  operational: { dot: "bg-[var(--color-success,oklch(0.62_0.15_150))]", text: "All systems operational" },
  degraded: { dot: "bg-[var(--color-warning,oklch(0.72_0.16_75))]", text: "Some systems degraded" },
  outage: { dot: "bg-destructive", text: "Major outage" },
  maintenance: { dot: "bg-[oklch(0.62_0.13_250)]", text: "Scheduled maintenance" },
};

export interface StatusPillProps {
  status: ServiceStatus;
  /** Overrides the default sentence for the status. */
  label?: string;
  /** Your status page. */
  href?: string;
  className?: string;
}

/**
 * The little "All systems operational" link in a footer or a docs header:
 * a coloured dot that pulses gently while things are fine, and a sentence
 * that says the state in words, so colour is never the only signal.
 */
export function StatusPill({ status, label, href, className }: StatusPillProps) {
  const tone = STATUS[status];
  const body = (
    <>
      <span aria-hidden="true" className="relative inline-flex size-2">
        {status === "operational" ? <span className={cn("absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping", tone.dot)} /> : null}
        <span className={cn("relative inline-flex size-2 rounded-full", tone.dot)} />
      </span>
      {label ?? tone.text}
    </>
  );
  const style = cn("inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs", className);
  return href ? (
    <a href={href} data-slot="status-pill" className={cn(style, "outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40")}>{body}</a>
  ) : (
    <span data-slot="status-pill" className={style}>{body}</span>
  );
}
