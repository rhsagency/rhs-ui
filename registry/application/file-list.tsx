"use client";

import { IconClose, IconFile, IconFileImage, IconFileSheet, IconFileText, IconRefresh, IconWarning } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FileListItem {
  id: string;
  name: string;
  /** Size in bytes. */
  size: number;
  /** 0 to 100 while uploading; undefined when done. */
  progress?: number;
  error?: string;
}

export interface FileListProps {
  files: readonly FileListItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  /** Locale for sizes; fixed so server and browser agree. */
  locale?: string;
  className?: string;
}

function iconFor(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext)) return <IconFileImage />;
  if (["csv", "xls", "xlsx", "numbers"].includes(ext)) return <IconFileSheet />;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return <IconFileText />;
  return <IconFile />;
}

/**
 * Files on their way up, or already there: name, size, a progress bar while
 * uploading, an error with retry when it failed, and remove. Pairs with the
 * file dropzone; progress is a real progressbar for screen readers.
 */
export function FileList({ files, onRemove, onRetry, locale = "en-GB", className }: FileListProps) {
  const unit = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const size = (bytes: number) => (bytes >= 1e6 ? `${unit.format(bytes / 1e6)} MB` : `${unit.format(Math.max(1, bytes / 1e3))} KB`);
  const icon = "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5";
  return (
    <ul data-slot="file-list" className={cn("divide-y divide-border rounded-xl border border-border", className)}>
      {files.map((file) => {
        const uploading = file.progress !== undefined && file.progress < 100 && !file.error;
        return (
          <li key={file.id} className="flex items-center gap-3 p-3">
            <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4", file.error && "bg-destructive/12 text-destructive")}>
              {file.error ? <IconWarning /> : iconFor(file.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              {file.error ? (
                <p className="text-xs text-destructive">{file.error}</p>
              ) : uploading ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <div role="progressbar" aria-label={`Uploading ${file.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={file.progress} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground transition-[width] duration-300" style={{ width: `${file.progress}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{file.progress}%</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{size(file.size)}</p>
              )}
            </div>
            {file.error && onRetry ? <button type="button" className={icon} aria-label={`Retry ${file.name}`} onClick={() => onRetry(file.id)}><IconRefresh /></button> : null}
            {onRemove ? <button type="button" className={icon} aria-label={uploading ? `Cancel ${file.name}` : `Remove ${file.name}`} onClick={() => onRemove(file.id)}><IconClose /></button> : null}
          </li>
        );
      })}
    </ul>
  );
}
