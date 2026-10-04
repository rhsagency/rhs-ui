"use client";

import { useId, useRef, useState } from "react";

import { IconClose, IconPaperclip } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface FileTriggerProps {
  /** Called with the chosen file, or null when it is removed. */
  onFileChange: (file: File | null) => void;
  /** Accepted types, as for the input: ".pdf,image/*". */
  accept?: string;
  /** Largest file in bytes; bigger files are refused with the reason in words. */
  maxSize?: number;
  label?: string;
  /** The field's name, for a plain form submit. */
  name?: string;
  locale?: string;
  className?: string;
}

/**
 * A single file field that looks like the rest of the form: a button to
 * choose, then the file's name and size with a remove button, and a refusal
 * in words when it is too big. The real file input stays in the form, so
 * FormData and server actions get the file.
 */
export function FileTrigger({ onFileChange, accept, maxSize, label = "Attach a file", name, locale = "en-GB", className }: FileTriggerProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const size = new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", maximumFractionDigits: 1 });
  function choose(next: File | null) {
    if (next && maxSize && next.size > maxSize) {
      setError(`${next.name} is ${size.format(next.size / 1e6)}; the limit is ${size.format(maxSize / 1e6)}.`);
      if (input.current) input.current.value = "";
      return;
    }
    setError(null);
    setFile(next);
    onFileChange(next);
  }
  return (
    <div data-slot="file-trigger" className={cn("relative grid gap-1.5", className)}>
      <input ref={input} id={id} type="file" name={name} accept={accept} className="peer sr-only" onChange={(event) => choose(event.target.files?.[0] ?? null)} aria-describedby={error ? `${id}-error` : undefined} />
      {file ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
          <IconPaperclip aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>{size.format(file.size / 1e6)}</span>
          <button type="button" onClick={() => { if (input.current) input.current.value = ""; choose(null); }} aria-label={`Remove ${file.name}`} className="inline-flex size-6 items-center justify-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"><IconClose className="size-3.5" /></button>
        </div>
      ) : (
        <label htmlFor={id} className="inline-flex h-9 cursor-pointer items-center gap-2 justify-self-start rounded-md border border-border px-3 text-sm outline-none hover:bg-muted peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40">
          <IconPaperclip aria-hidden="true" className="size-4" />{label}
        </label>
      )}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
