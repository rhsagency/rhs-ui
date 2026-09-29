"use client";

import { useId, useState, type FormEvent } from "react";

import { IconCheck, IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CouponResult {
  ok: boolean;
  /** "10% off everything" or "This code has expired". */
  message: string;
}

export interface CouponFieldProps {
  /** Checks the code where the discounts live. Throwing counts as a failed check. */
  onApply: (code: string) => Promise<CouponResult>;
  /** Called when the reader removes an applied code. */
  onRemove?: (code: string) => void;
  /** A code that is already applied, e.g. from the cart. */
  applied?: string | null;
  label?: string;
  className?: string;
}

/**
 * A discount code: type it, apply it, and hear back in words whether it
 * worked. A code that works becomes a chip you can remove; one that fails
 * stays in the field with the reason under it, tied to the field.
 */
export function CouponField({ onApply, onRemove, applied = null, label = "Discount code", className }: CouponFieldProps) {
  const id = useId();
  const [code, setCode] = useState("");
  const [active, setActive] = useState<string | null>(applied);
  const [result, setResult] = useState<CouponResult | null>(null);
  const [busy, setBusy] = useState(false);
  const apply = async (event: FormEvent) => {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value || busy) return;
    setBusy(true);
    const outcome = await onApply(value).catch(() => ({ ok: false, message: "We could not check this code. Try again." }));
    setBusy(false);
    setResult(outcome);
    if (outcome.ok) {
      setActive(value);
      setCode("");
    }
  };
  const remove = () => {
    if (active) onRemove?.(active);
    setActive(null);
    setResult(null);
  };
  return (
    <div data-slot="coupon-field" className={cn("grid gap-2", className)}>
      {active ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border px-3 py-2 text-sm">
          <span className="inline-flex items-center gap-2">
            <IconCheck size={16} className="text-[var(--color-success,oklch(0.62_0.15_150))]" />
            <span className="font-mono font-medium tracking-wide">{active}</span>
            {result?.ok ? <span className="text-muted-foreground">{result.message}</span> : null}
          </span>
          <button type="button" onClick={remove} aria-label={`Remove code ${active}`} className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <IconClose size={14} />
          </button>
        </div>
      ) : (
        <form onSubmit={apply} className="grid gap-1.5">
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <div className="flex gap-2">
            <input
              id={id}
              value={code}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={result && !result.ok ? true : undefined}
              aria-describedby={result && !result.ok ? `${id}-message` : undefined}
              onChange={(event) => setCode(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 font-mono text-sm tracking-wide uppercase shadow-xs outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
              placeholder="Enter a code"
            />
            <Button type="submit" variant="outline" disabled={!code.trim() || busy}>
              {busy ? "Checking…" : "Apply"}
            </Button>
          </div>
        </form>
      )}
      <p id={`${id}-message`} aria-live="polite" className={cn("min-h-4 text-xs", result && !result.ok ? "text-destructive" : "text-muted-foreground")}>
        {result && !result.ok ? result.message : ""}
      </p>
    </div>
  );
}
