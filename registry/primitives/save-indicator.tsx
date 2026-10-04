import { IconAlertCircle, IconCheck, IconCloud } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SaveIndicatorProps {
  state: "idle" | "saving" | "saved" | "error" | "offline";
  /** "2 min ago", worked out on your side. */
  savedAgo?: string;
  /** Retry after an error. */
  onRetry?: () => void;
  className?: string;
}

/**
 * The quiet "Saving… / Saved" line next to a document title, the way editors
 * that autosave do it: a spinner while saving, a check with how long ago,
 * offline when changes are kept locally, and an error with retry. A status
 * region, so the state is heard without stealing focus.
 */
export function SaveIndicator({ state, savedAgo, onRetry, className }: SaveIndicatorProps) {
  return (
    <p data-slot="save-indicator" role="status" className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5", state === "error" && "text-destructive", className)}>
      {state === "saving" ? <span aria-hidden="true" className="size-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent motion-reduce:animate-none" /> : state === "saved" ? <IconCheck aria-hidden="true" /> : state === "error" ? <IconAlertCircle aria-hidden="true" /> : state === "offline" ? <IconCloud aria-hidden="true" /> : null}
      {state === "saving" ? "Saving…" : state === "saved" ? `Saved${savedAgo ? ` ${savedAgo}` : ""}` : state === "offline" ? "Offline, changes kept on this device" : state === "error" ? "Not saved." : "All changes saved"}
      {state === "error" && onRetry ? <button type="button" onClick={onRetry} className="font-medium underline underline-offset-2">Retry</button> : null}
    </p>
  );
}
