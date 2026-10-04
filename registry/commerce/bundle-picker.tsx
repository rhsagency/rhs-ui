"use client";

import { IconPlus } from "@rhs-ui/icons";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

export interface BundleItem {
  id: string;
  title: string;
  price: Money;
  image: { src: string; alt: string };
  /** The product on the page is always in the bundle. */
  locked?: boolean;
}

export interface BundlePickerProps {
  title?: string;
  items: readonly BundleItem[];
  selected: readonly string[];
  onSelectedChange: (ids: string[]) => void;
  /** Discount on the bundle as a fraction, when two or more are picked. */
  discount?: number;
  onAdd: (ids: string[]) => void;
  locale?: string;
  className?: string;
}

/**
 * "Frequently bought together": the product and two or three companions
 * with plus signs between them, a checkbox per companion, and the bundle
 * total with its saving worked out in cents, so the add button always says
 * exactly what it will add and for how much.
 */
export function BundlePicker({ title = "Frequently bought together", items, selected, onSelectedChange, discount = 0, onAdd, locale = "en-GB", className }: BundlePickerProps) {
  const ids = items.filter((item) => item.locked || selected.includes(item.id)).map((item) => item.id);
  const currency = items[0]?.price.currency ?? "EUR";
  const full = items.filter((item) => ids.includes(item.id)).reduce((sum, item) => sum + item.price.amount, 0);
  const off = ids.length >= 2 ? Math.round(full * discount) : 0;
  const money = (amount: number) => formatMoney({ amount, currency }, locale);
  return (
    <section data-slot="bundle-picker" aria-label={title} className={cn("rounded-2xl border border-border p-5", className)}>
      <h3 className="font-medium">{title}</h3>
      <ul className="mt-4 flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            {index > 0 ? <IconPlus aria-hidden="true" className="size-4 text-muted-foreground" /> : null}
            <span className={cn("relative block size-20 overflow-clip rounded-xl bg-muted transition-opacity", !ids.includes(item.id) && "opacity-40")}><img src={item.image.src} alt={item.image.alt} className="size-full object-cover" /></span>
          </li>
        ))}
      </ul>
      <ul className="mt-4 grid gap-2 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <Checkbox id={`bundle-${item.id}`} checked={ids.includes(item.id)} disabled={item.locked} onCheckedChange={(on) => onSelectedChange(on === true ? [...selected, item.id] : selected.filter((id) => id !== item.id))} />
            <label htmlFor={`bundle-${item.id}`} className={cn("flex-1", item.locked ? "cursor-default" : "cursor-pointer")}>{item.locked ? <span className="font-medium">This item: </span> : null}{item.title}</label>
            <span className="tabular-nums" suppressHydrationWarning>{money(item.price.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm">
          <span className="text-muted-foreground">Total </span>
          <span className="text-lg font-medium tabular-nums" suppressHydrationWarning>{money(full - off)}</span>
          {off ? <span className="ml-2 text-xs text-muted-foreground line-through" suppressHydrationWarning><span className="sr-only">was </span>{money(full)}</span> : null}
        </p>
        <Button onClick={() => onAdd(ids)}>Add {ids.length} to bag</Button>
      </div>
    </section>
  );
}
