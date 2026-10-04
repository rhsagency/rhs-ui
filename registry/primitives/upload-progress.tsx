import { IconAlertCircle, IconCheck, IconClose, IconFile, IconRefresh } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface UploadItem {
  id: string;
  name: string;
  /** Bytes. */
  size: number;
  /** 0 to 1 while uploading. */
  progress: number;
  status: "queued" | "uploading" | "done" | "failed";
  /** Why it failed, in words: "Larger than 25 MB". */
  error?: string;
}

export interface UploadProgressProps {
  items: readonly UploadItem[];
  onCancel?: (id: string) => void;
  onRetry?: (id: string) => void;
  locale?: string;
  className?: string;
}

/**
 * Files on their way up: a row per file with its size, a progress bar that
 * is a real progressbar, done or failed in words with the reason, and cancel
 * or retry per row. A summary line counts what is left, politely announced.
 */
export function UploadProgress({ items, onCancel, onRetry, locale = "en-GB", className }: UploadProgressProps) {
  const unit = new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", maximumFractionDigits: 1 });
  const done = items.filter((item) => item.status === "done").length;
  const failed = items.filter((item) => item.status === "failed").length;
  return (
    <section data-slot="upload-progress" aria-label="Uploads" className={cn("rounded-2xl border border-border", className)}>
      <p role="status" className="border-b border-border px-4 py-3 text-sm font-medium">
        {done === items.length ? `All ${items.length} files uploaded` : `${done} of ${items.length} uploaded`}{failed ? `, ${failed} failed` : ""}
      </p>
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", item.status === "failed" ? "bg-destructive/10 text-destructive" : "bg-muted")}>
              {item.status === "done" ? <IconCheck /> : item.status === "failed" ? <IconAlertCircle /> : <IconFile />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                  {item.status === "uploading" ? `${Math.round(item.progress * 100)}%` : item.status === "queued" ? "Waiting" : unit.format(item.size / 1_000_000)}
                </span>
              </div>
              {item.status === "failed" ? (
                <p className="mt-1 text-xs text-destructive">{item.error ?? "Upload failed"}</p>
              ) : item.status !== "done" ? (
                <div role="progressbar" aria-label={`Uploading ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress * 100)} className="mt-1.5 h-1 overflow-clip rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${item.progress * 100}%` }} />
                </div>
              ) : null}
            </div>
            {item.status === "failed" && onRetry ? (
              <button type="button" onClick={() => onRetry(item.id)} aria-label={`Retry ${item.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconRefresh /></button>
            ) : item.status !== "done" && onCancel ? (
              <button type="button" onClick={() => onCancel(item.id)} aria-label={`Cancel ${item.name}`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconClose /></button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
