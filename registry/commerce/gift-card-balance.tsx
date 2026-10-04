"use client";

import { useId, useState, type FormEvent } from "react";

import { IconGift } from "@rhs-ui/icons";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface GiftCardResult {
  balance: Money;
  /** Already formatted: "31 December 2027". */
  expires?: string;
}

export interface GiftCardBalanceProps {
  /** Resolve with the balance; resolve with null when the code is unknown. Rate-limit this on your side. */
  onCheck: (code: string, pin: string) => Promise<GiftCardResult | null>;
  /** Ask for the PIN on the back of the card too. */
  pin?: boolean;
  locale?: string;
  className?: string;
}

/**
 * Check what is left on a gift card: the code (grouped as people type it,
 * sent without the spaces), an optional PIN, and the balance with its expiry
 * in a status message. An unknown code gets one plain sentence, never a hint
 * about which part was wrong.
 */
export function GiftCardBalance({ onCheck, pin = false, locale = "en-GB", className }: GiftCardBalanceProps) {
  const id = useId();
  const [code, setCode] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error" | "unknown" } | { kind: "found"; result: GiftCardResult }>({ kind: "idle" });
  const grouped = code.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 16).replace(/(.{4})(?=.)/g, "$1 ");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState({ kind: "busy" });
    try {
      const result = await onCheck(grouped.replace(/\s/g, ""), String(data.get("pin") ?? ""));
      setState(result ? { kind: "found", result } : { kind: "unknown" });
    } catch {
      setState({ kind: "error" });
    }
  }
  return (
    <section data-slot="gift-card-balance" aria-labelledby={`${id}-title`} className={cn("rounded-2xl border border-border p-6", className)}>
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-medium"><IconGift aria-hidden="true" className="size-5" />Check a gift card</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-code`} className="text-sm font-medium">Card number</label>
          <Input id={`${id}-code`} value={grouped} onChange={(event) => setCode(event.target.value)} inputMode="text" autoComplete="off" spellCheck={false} required placeholder="XXXX XXXX XXXX XXXX" className="font-mono tracking-wider" />
        </div>
        {pin ? (
          <div className="grid gap-1.5">
            <label htmlFor={`${id}-pin`} className="text-sm font-medium">PIN</label>
            <Input id={`${id}-pin`} name="pin" inputMode="numeric" autoComplete="off" maxLength={6} required className="w-24 font-mono" />
          </div>
        ) : null}
        <Button type="submit" loading={state.kind === "busy"}>Check balance</Button>
      </form>
      <div role="status" className="mt-4 min-h-6 text-sm">
        {state.kind === "found" ? (
          <p className="flex flex-wrap items-baseline gap-x-3">
            <span className="text-3xl font-medium tracking-tight tabular-nums" suppressHydrationWarning>{formatMoney(state.result.balance, locale)}</span>
            <span className="text-muted-foreground">left{state.result.expires ? `, valid until ${state.result.expires}` : ""}</span>
          </p>
        ) : state.kind === "unknown" ? (
          <p>We could not find a card with those details. Check the number and try again.</p>
        ) : state.kind === "error" ? (
          <p className="text-destructive">The check did not go through. Please try again.</p>
        ) : null}
      </div>
    </section>
  );
}
