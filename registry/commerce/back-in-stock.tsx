"use client";

import { useId, useState, type FormEvent } from "react";

import { IconBell, IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface BackInStockProps {
  /** "Linen apron, Stone, M": what they will hear about. */
  product: string;
  /** Resolve when the alert is saved; reject to show the error. */
  onSubscribe: (email: string) => Promise<void> | void;
  /** "Expected around 22 April", if you know. */
  expected?: string;
  className?: string;
}

/**
 * In place of "add to bag" when a variant is sold out: one email field to be
 * told when it is back, the expected date when there is one, and a
 * confirmation that names the exact variant. Promises one email, nothing
 * else, and says so.
 */
export function BackInStock({ product, onSubscribe, expected, className }: BackInStockProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      await onSubscribe(email);
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <div data-slot="back-in-stock" className={cn("rounded-2xl border border-border p-4", className)}>
      {state === "done" ? (
        <p role="status" className="flex items-start gap-2 text-sm"><IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />We will email you once when {product} is back.</p>
      ) : (
        <form onSubmit={submit} className="grid gap-2">
          <p className="flex items-center gap-2 text-sm font-medium"><IconBell aria-hidden="true" className="size-4" />Sold out. Get one email when it is back.</p>
          {expected ? <p className="text-xs text-muted-foreground">{expected}</p> : null}
          <div className="flex gap-2">
            <label htmlFor={id} className="sr-only">Email address</label>
            <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="flex-1" />
            <Button type="submit" loading={state === "busy"}>Notify me</Button>
          </div>
          {state === "error" ? <p role="alert" className="text-xs text-destructive">That did not work. Please try again.</p> : <p className="text-xs text-muted-foreground">Only this one email, no newsletter.</p>}
        </form>
      )}
    </div>
  );
}
