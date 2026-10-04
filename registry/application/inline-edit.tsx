"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { IconEdit } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface InlineEditProps {
  value: string;
  /** Called with the new value on Enter or blur; reject to keep editing. */
  onSave: (value: string) => Promise<void> | void;
  /** Names the field: "Project name". */
  label: string;
  placeholder?: string;
  className?: string;
}

/**
 * Text that becomes a field when clicked: a project name, a title, a note.
 * Enter or leaving the field saves, Escape restores the old value, and an
 * empty value is not saved. The read view is a button, so it is reachable.
 */
export function InlineEdit({ value, onSave, label, placeholder = "Untitled", className }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);
  async function save() {
    const next = draft.trim();
    if (!next || next === value) {
      setDraft(value);
      setEditing(false);
      return;
    }
    try {
      await onSave(next);
      setError(false);
      setEditing(false);
    } catch {
      setError(true);
    }
  }
  function key(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void save();
    if (event.key === "Escape") {
      setDraft(value);
      setEditing(false);
    }
  }
  if (editing) {
    return (
      <span data-slot="inline-edit" className={cn("inline-flex flex-col", className)}>
        <input ref={input} aria-label={label} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={key} onBlur={() => void save()} aria-invalid={error || undefined} className="-mx-1.5 rounded-md border border-border bg-background px-1.5 py-0.5 font-[inherit] text-[length:inherit] outline-none focus:ring-[3px] focus:ring-ring/40" />
        {error ? <span role="alert" className="mt-1 text-xs text-destructive">Could not save. Try again.</span> : null}
      </span>
    );
  }
  return (
    <button type="button" data-slot="inline-edit" onClick={() => { setDraft(value); setEditing(true); }} aria-label={`${label}: ${value || placeholder}. Edit`} className={cn("group -mx-1.5 inline-flex items-center gap-2 rounded-md px-1.5 py-0.5 text-left outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
      <span className={cn(!value && "text-muted-foreground")}>{value || placeholder}</span>
      <span aria-hidden="true" className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [&_svg]:size-3.5"><IconEdit /></span>
    </button>
  );
}
