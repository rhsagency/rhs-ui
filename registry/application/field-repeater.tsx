"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconPlus, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

/** What every row of the list has to have. */
export interface RepeaterItem {
  /** Stays the same for the life of the row and differs from every other row. It keys the row, so what was typed stays with it when a row above is removed. */
  id: string;
}

/** What `renderRow` is told about the row it draws, besides the item and its index. */
export interface FieldRepeaterRow<T> {
  /** The row's number, counting from 1. */
  number: number;
  /** What the row is called: "Contact 2". */
  name: string;
  /** Merges changes into this row's item and reports the new list. */
  update: (patch: Partial<T>) => void;
}

/** The sentences the repeater says, for translation. `{item}` is the numbered row ("Contact 2"), `{items}` the plural, `{count}` and `{max}` numbers. */
export interface FieldRepeaterLabels {
  /** The words on the Remove button. Default "Remove". */
  remove?: string;
  /** What a screen reader hears on the Remove button. Default "Remove {item}". */
  removeItem?: string;
  /** Said politely after a row is added. Default "{item} added". */
  added?: string;
  /** Said politely after a row is removed. Default "{item} removed". */
  removed?: string;
  /** Under the list while there is room, when `max` is set. Default "{count} of {max} {items}". */
  count?: string;
  /** Why Add is off at the maximum. Default "Up to {max} {items}". */
  full?: string;
}

export interface FieldRepeaterProps<T extends RepeaterItem> extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The rows, when you control them. */
  value?: readonly T[];
  /** The rows to begin with, when the repeater keeps them itself. With uncontrolled fields in `renderRow` this is all you need: the text stays in the inputs. */
  defaultValue?: readonly T[];
  /** Called with the whole new list after an add, a remove or an `update`. */
  onChange?: (value: T[]) => void;
  /** Draws the fields of one row. The row's number, its name and a way to change its item come as the third argument. The Remove button and the heading are the repeater's. */
  renderRow: (item: T, index: number, row: FieldRepeaterRow<T>) => ReactNode;
  /** Makes the item for a new row. Its id must be new every time. */
  createItem: () => T;
  /** The fewest rows. At that many, Remove is not shown. Default 0. */
  min?: number;
  /** The most rows. At that many, Add is off and says why. No limit by default. */
  max?: number;
  /** What one row is, singular: "Contact". Rows read "Contact 1", "Contact 2". Default "Item". */
  itemLabel?: string;
  /** What the rows are, plural and in the middle of a sentence: "contacts". Default the item label in lower case with an s. */
  itemsLabel?: string;
  /** The Add button. Default "Add another contact", and "Add a contact" while the list is empty. */
  addLabel?: string;
  /** The words the repeater says, for translation. */
  labels?: FieldRepeaterLabels;
}

const DEFAULT_LABELS = {
  remove: "Remove",
  removeItem: "Remove {item}",
  added: "{item} added",
  removed: "{item} removed",
  count: "{count} of {max} {items}",
  full: "Up to {max} {items}",
} satisfies Required<FieldRepeaterLabels>;

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const FIELDS = 'input:not([type="hidden"]), select, textarea, button, [href], [tabindex]';

/** The first control in the fields of a row that a person can reach with Tab: not the Remove button, nothing disabled, hidden or inert. */
function firstField(row: HTMLElement | undefined): HTMLElement | null {
  const scope = row?.querySelector<HTMLElement>('[data-slot="field-repeater-fields"]');
  if (!scope) return null;
  for (const element of scope.querySelectorAll<HTMLElement>(FIELDS)) {
    if (element.matches(":disabled") || element.tabIndex < 0 || element.closest('[inert], [hidden], [aria-hidden="true"]')) continue;
    return element;
  }
  return null;
}

/** Where focus goes once the new list has been drawn. */
type Landing = { kind: "row"; id: string } | { kind: "add" };

/**
 * An "Add another" group of fields: a list of identical rows, such as a
 * contact, a guest or a work reference, that people add to and trim. Each row
 * is a numbered, labelled group with its own Remove button ("Remove contact
 * 2", never just "Remove"), and rows are keyed by the id of their item, so
 * typed text does not jump when a row above is removed. After Add, focus
 * lands on the first field of the new row; after Remove it lands on the row
 * that took its place, or on Add when none is left; a polite status says
 * "Contact 3 added" or "Contact 2 removed". At the maximum Add is off and says
 * why, at the minimum Remove is not shown, and an empty list is one dashed Add
 * row instead of nothing.
 */
export function FieldRepeater<T extends RepeaterItem>({
  value,
  defaultValue,
  onChange,
  renderRow,
  createItem,
  min = 0,
  max,
  itemLabel = "Item",
  itemsLabel,
  addLabel,
  labels,
  className,
  ...props
}: FieldRepeaterProps<T>) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const hintId = `${base}-hint`;
  const plural = itemsLabel ?? `${itemLabel.toLowerCase()}s`;

  const [own, setOwn] = useState<readonly T[]>(defaultValue ?? []);
  const items = value ?? own;
  // Rows that were there at the start do not animate in; only the ones a person adds.
  const [initial] = useState(() => new Set(items.map((item) => item.id)));

  const rows = useRef(new Map<string, HTMLElement>());
  const addButton = useRef<HTMLButtonElement>(null);
  const landing = useRef<Landing | null>(null);
  const [note, setNote] = useState({ text: "", count: 0 });

  const full = max !== undefined && items.length >= max;
  const canRemove = items.length > min;
  const word = (count: number) => `${itemLabel} ${count}`;

  function commit(next: T[]) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  function announce(sentence: string) {
    setNote((current) => ({ text: sentence, count: current.count + 1 }));
  }

  function add() {
    if (full) return;
    const item = createItem();
    landing.current = { kind: "row", id: item.id };
    commit([...items, item]);
    announce(fill(text.added, { item: word(items.length + 1) }));
  }

  function remove(index: number) {
    if (!canRemove) return;
    const neighbour = items[index + 1] ?? items[index - 1];
    landing.current = neighbour ? { kind: "row", id: neighbour.id } : { kind: "add" };
    commit(items.filter((_, position) => position !== index));
    announce(fill(text.removed, { item: word(index + 1) }));
  }

  // Focus is placed after the list has been drawn, because the row it goes to may not exist until then.
  useEffect(() => {
    const target = landing.current;
    if (!target) return;
    if (target.kind === "add") {
      landing.current = null;
      addButton.current?.focus();
      return;
    }
    const row = rows.current.get(target.id);
    if (!row) return;
    landing.current = null;
    (firstField(row) ?? row).focus();
  });

  const empty = items.length === 0;
  const label = addLabel ?? (empty ? `Add a ${itemLabel.toLowerCase()}` : `Add another ${itemLabel.toLowerCase()}`);
  const hint =
    max === undefined ? null : full ? fill(text.full, { max, items: plural }) : fill(text.count, { count: items.length, max, items: plural });

  return (
    <div data-slot="field-repeater" className={cn("grid grid-cols-1 gap-5", className)} {...props}>
      {empty ? null : (
        <ol role="list" className="m-0 grid list-none p-0">
          {items.map((item, index) => {
            const name = word(index + 1);
            const titleId = `${base}-${item.id}-title`;
            return (
              <li
                key={item.id}
                className={cn(
                  "pt-5 first:pt-0",
                  !initial.has(item.id) && "transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none",
                )}
              >
                <div
                  role="group"
                  aria-labelledby={titleId}
                  tabIndex={-1}
                  data-slot="field-repeater-row"
                  ref={(element) => {
                    if (element) rows.current.set(item.id, element);
                    else rows.current.delete(item.id);
                  }}
                  className="grid grid-cols-1 gap-4 outline-none"
                >
                  <div className="flex min-h-8 items-center justify-between gap-3">
                    <p id={titleId} className="text-sm font-medium tabular-nums">
                      {name}
                    </p>
                    {canRemove ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={fill(text.removeItem, { item: name })}
                        onClick={() => remove(index)}
                        className="-mr-2.5 text-muted-foreground hover:text-foreground"
                      >
                        <IconTrash />
                        {text.remove}
                      </Button>
                    ) : null}
                  </div>
                  <div data-slot="field-repeater-fields" className="grid grid-cols-1 gap-4">
                    {renderRow(item, index, {
                      number: index + 1,
                      name,
                      update: (patch) => commit(items.map((current) => (current.id === item.id ? { ...current, ...patch } : current))),
                    })}
                  </div>
                </div>
                {index < items.length - 1 ? <Separator className="mt-5" /> : null}
              </li>
            );
          })}
        </ol>
      )}

      {empty ? (
        <div className="grid gap-2">
          <Button
            ref={addButton}
            type="button"
            variant="ghost"
            disabled={full}
            aria-describedby={hint ? hintId : undefined}
            onClick={add}
            className="h-14 w-full rounded-xl border-dashed border-[color-mix(in_oklch,var(--border),var(--foreground)_24%)] text-muted-foreground hover:border-foreground/50 hover:text-foreground"
          >
            <IconPlus />
            {label}
          </Button>
          {hint ? (
            <p id={hintId} className="text-center text-sm text-muted-foreground tabular-nums">
              {hint}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button ref={addButton} type="button" variant="outline" disabled={full} aria-describedby={hint ? hintId : undefined} onClick={add}>
            <IconPlus />
            {label}
          </Button>
          {hint ? (
            <p id={hintId} className={cn("text-sm tabular-nums", full ? "font-medium text-foreground" : "text-muted-foreground")}>
              {hint}
            </p>
          ) : null}
        </div>
      )}

      {/* The same words again as a polite status. The node is replaced each time, so saying "Contact 2 removed" twice in a row is heard twice. */}
      <div role="status" aria-live="polite" className="sr-only">
        <span key={note.count}>{note.text}</span>
      </div>
    </div>
  );
}
