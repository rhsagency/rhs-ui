"use client";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CompareItem {
  id: string;
  title: string;
  image?: { src: string; alt: string };
}

export interface CompareTrayProps {
  items: readonly CompareItem[];
  /** How many can be compared at once; empty slots show the room left. */
  max?: number;
  onRemove: (id: string) => void;
  onClear: () => void;
  compareHref: string;
  className?: string;
}

/**
 * The tray that collects products to compare: fixed to the bottom while
 * anything is picked, a slot per product with remove, empty slots for the
 * room left, and compare once there are two.
 */
export function CompareTray({ items, max = 4, onRemove, onClear, compareHref, className }: CompareTrayProps) {
  if (!items.length) return null;
  return (
    <section data-slot="compare-tray" aria-label="Compare products" className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <ul className="flex flex-1 gap-2">
          {Array.from({ length: max }, (_, index) => {
            const item = items[index];
            return item ? (
              <li key={item.id} className="relative flex w-40 items-center gap-2 rounded-lg border border-border p-1.5 pr-7 text-xs">
                <span className="size-9 shrink-0 overflow-hidden rounded-md bg-muted">{item.image ? <img src={item.image.src} alt="" className="size-full object-cover" /> : null}</span>
                <span className="line-clamp-2">{item.title}</span>
                <button type="button" aria-label={`Remove ${item.title} from comparison`} onClick={() => onRemove(item.id)} className="absolute top-1 right-1 inline-flex size-5 items-center justify-center rounded hover:bg-muted [&_svg]:size-3"><IconClose /></button>
              </li>
            ) : (
              <li key={`empty-${index}`} aria-hidden="true" className="hidden w-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground sm:flex">Add a product</li>
            );
          })}
        </ul>
        <p className="sr-only" role="status">{items.length} of {max} products picked to compare</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
          <Button size="sm" disabled={items.length < 2} asChild={items.length >= 2}>{items.length >= 2 ? <a href={compareHref}>Compare {items.length}</a> : <span>Pick one more</span>}</Button>
        </div>
      </div>
    </section>
  );
}
