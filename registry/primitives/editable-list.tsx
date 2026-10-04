"use client";

import { useId, useRef, type KeyboardEvent } from "react";

import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface EditableListProps {
  items: readonly string[];
  onItemsChange: (items: string[]) => void;
  /** Names the list: "Agenda", "Steps". */
  label: string;
  placeholder?: string;
  /** Number the rows: for steps and agendas. */
  numbered?: boolean;
  max?: number;
  className?: string;
}

/**
 * A list people type straight into: agenda points, recipe steps, answer
 * options. Enter adds a row below and moves there, Backspace on an empty row
 * removes it, and every row can move up or down with buttons (no drag
 * needed). Focus follows the row that moved or was removed.
 */
export function EditableList({ items, onItemsChange, label, placeholder = "Type and press Enter", numbered = false, max, className }: EditableListProps) {
  const id = useId();
  const list = useRef<HTMLOListElement>(null);
  const focus = (index: number) => requestAnimationFrame(() => list.current?.querySelectorAll<HTMLInputElement>("input")[index]?.focus());
  const set = (index: number, text: string) => onItemsChange(items.map((item, i) => (i === index ? text : item)));
  const move = (index: number, delta: number) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item ?? "");
    onItemsChange(next);
    focus(index + delta);
  };
  function keys(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (max !== undefined && items.length >= max) return;
      onItemsChange([...items.slice(0, index + 1), "", ...items.slice(index + 1)]);
      focus(index + 1);
    } else if (event.key === "Backspace" && !items[index] && items.length > 1) {
      event.preventDefault();
      onItemsChange(items.filter((_, i) => i !== index));
      focus(Math.max(0, index - 1));
    }
  }
  const icon = "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-30 [&_svg]:size-4";
  const List = numbered ? "ol" : "ul";
  return (
    <div data-slot="editable-list" className={cn("grid gap-2", className)}>
      <p id={id} className="text-sm font-medium">{label}</p>
      <List ref={list as React.RefObject<HTMLOListElement>} aria-labelledby={id} className="grid gap-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {numbered ? <span aria-hidden="true" className="w-6 text-right text-sm text-muted-foreground tabular-nums">{index + 1}.</span> : <span aria-hidden="true" className="mx-2 size-1.5 rounded-full bg-foreground/50" />}
            <input value={item} onChange={(event) => set(index, event.target.value)} onKeyDown={(event) => keys(event, index)} placeholder={placeholder} aria-label={`${label} item ${index + 1}`} className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none hover:border-border focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move item ${index + 1} up`} className={icon}><IconArrowUp /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={`Move item ${index + 1} down`} className={icon}><IconArrowDown /></button>
            <button type="button" onClick={() => onItemsChange(items.filter((_, i) => i !== index))} disabled={items.length === 1} aria-label={`Remove item ${index + 1}`} className={icon}><IconTrash /></button>
          </li>
        ))}
      </List>
      <button type="button" disabled={max !== undefined && items.length >= max} onClick={() => { onItemsChange([...items, ""]); focus(items.length); }} className="inline-flex items-center gap-1.5 justify-self-start rounded-md px-2 py-1 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40 [&_svg]:size-4"><IconPlus /> Add</button>
    </div>
  );
}
