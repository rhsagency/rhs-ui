"use client";

import { useState, type ReactNode } from "react";

import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface QuickViewProduct {
  title: string;
  price: Money;
  description: string;
  image: { src: string; alt: string };
  /** Sizes or variants as simple choices; leave out for a single variant. */
  options?: { name: string; values: readonly { value: string; available?: boolean }[] };
  href: string;
}

export interface QuickViewProps {
  product: QuickViewProduct;
  /** The trigger, usually a button on the product card. */
  children: ReactNode;
  /** Resolve when the line is in the bag; reject to show the error. */
  onAdd: (choice: string | null) => Promise<void> | void;
  locale?: string;
}

/**
 * Look closer without leaving the listing: a dialog with the picture, price,
 * a short description, the one choice that matters (size) as radios, and
 * add to bag with its result in words. A link to the full page for anyone
 * who wants the details.
 */
export function QuickView({ product, children, onAdd, locale = "en-GB" }: QuickViewProps) {
  const [choice, setChoice] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const needsChoice = Boolean(product.options);
  async function add() {
    setState("busy");
    try {
      await onAdd(choice);
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <Dialog onOpenChange={(open) => { if (!open) setState("idle"); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl p-0 sm:grid sm:grid-cols-2">
        <div className="aspect-square bg-muted sm:aspect-auto"><img src={product.image.src} alt={product.image.alt} className="size-full object-cover" /></div>
        <div className="flex flex-col gap-5 p-6">
          <div>
            <DialogTitle className="text-xl font-medium tracking-tight">{product.title}</DialogTitle>
            <p className="mt-1 text-lg tabular-nums" suppressHydrationWarning>{formatMoney(product.price, locale)}</p>
          </div>
          <DialogDescription className="text-sm leading-relaxed">{product.description}</DialogDescription>
          {product.options ? (
            <fieldset>
              <legend className="text-sm font-medium">{product.options.name}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.options.values.map((option) => (
                  <label key={option.value} className={cn("relative inline-flex min-w-11 cursor-pointer items-center justify-center rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-foreground has-[:checked]:bg-foreground has-[:checked]:text-background has-[:disabled]:cursor-not-allowed has-[:disabled]:text-muted-foreground has-[:disabled]:line-through has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40")}>
                    <input type="radio" name="quick-view-option" value={option.value} disabled={option.available === false} checked={choice === option.value} onChange={() => setChoice(option.value)} className="sr-only" />
                    {option.value}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="mt-auto grid gap-2">
            <Button size="lg" disabled={needsChoice && !choice} loading={state === "busy"} onClick={add}>
              {needsChoice && !choice ? `Choose a ${product.options?.name.toLowerCase()}` : "Add to bag"}
            </Button>
            <p role="status" className="min-h-5 text-center text-sm">
              {state === "done" ? "Added to your bag." : state === "error" ? <span className="text-destructive">That did not work. Please try again.</span> : null}
            </p>
            <a href={product.href} className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">See full details</a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
