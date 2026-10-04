"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";

export interface PopoverFormProps {
  /** The trigger: "Rename", an edit icon. */
  children: ReactNode;
  label: string;
  defaultValue?: string;
  /** Resolve to close, reject with an Error to show its message. */
  onSubmit: (value: string) => Promise<void> | void;
  submitLabel?: string;
  placeholder?: string;
}

/**
 * A one-field edit in place: rename a file, set a target, add a label. A
 * popover with the field focused and its text selected, Enter saves and
 * Escape cancels, and an error stays in the popover next to the field
 * instead of closing it and losing what was typed.
 */
export function PopoverForm({ children, label, defaultValue = "", onSubmit, submitLabel = "Save", placeholder }: PopoverFormProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("value") ?? "").trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(value);
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "That did not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); setError(null); }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={submit} className="grid gap-2">
          <label htmlFor={id} className="text-sm font-medium">{label}</label>
          <Input id={id} name="value" defaultValue={defaultValue} placeholder={placeholder} autoFocus onFocus={(event) => event.currentTarget.select()} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} />
          {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" size="sm" loading={busy}>{submitLabel}</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
