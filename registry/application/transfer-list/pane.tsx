"use client";

import { useEffect, useId, useMemo, useState, type KeyboardEvent, type MouseEvent, type RefObject } from "react";

import { IconCheck, IconLock } from "@rhs-ui/icons";
import { filterItems, fill, rangeBetween, selectedIn, toggled, type PaneState, type Side, type TransferItem, type Words } from "@rhs-ui/application/transfer-list/transfer";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export interface PaneProps {
  side: Side;
  /** The list's heading, which also names it for a screen reader. */
  title: string;
  /** Every item in this list, in the order to show them. */
  items: readonly TransferItem[];
  /** The id of an item's element in the page, for aria-activedescendant. */
  domId: (id: string) => string;
  state: PaneState;
  onChange: (change: Partial<PaneState>) => void;
  /** Called with the ids to move to the other list: Enter on an item, or a double click. */
  onMove: (ids: readonly string[]) => void;
  /** The items that were moved here a moment ago: they are tinted, and scrolled into view. */
  fresh: ReadonlySet<string>;
  searchable: boolean;
  height?: number | string;
  disabled: boolean;
  /** What the list says when it has no items at all. */
  empty: string;
  words: Words;
  /** The list itself, so the parent can put the focus back on it after a move. */
  listRef: RefObject<HTMLDivElement | null>;
}

/** The box of an item: a ring at rest, filled with a check when selected. It is a picture of the state; the option carries it for assistive technology. */
const BOX =
  "grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-muted-foreground bg-background text-primary-foreground shadow-xs transition-[background-color,border-color] duration-150 motion-reduce:transition-none group-hover/option:border-foreground group-data-[selected]/option:border-primary group-data-[selected]/option:bg-primary";

/**
 * One of the two lists: a header with a checkbox for all of it and the count,
 * a search field, and a multi-select listbox. The listbox is one tab stop that
 * keeps the focus and points at the item under the cursor with
 * aria-activedescendant, so items can leave it without the focus going
 * anywhere. Arrow keys move the cursor, Shift with them extends a selection,
 * Space toggles, Control A selects all, and Enter moves.
 */
export function Pane({ side, title, items, domId, state, onChange, onMove, fresh, searchable, height, disabled, empty, words, listRef }: PaneProps) {
  const base = useId();
  const [focused, setFocused] = useState(false);
  // Whether the row under the cursor wears a ring: only for a keyboard. A click already shows where it landed with the selection tint, and a list that takes the focus back after a move would otherwise ring a row nobody pointed at.
  const [ring, setRing] = useState(false);
  const visible = useMemo(() => filterItems(items, state.query), [items, state.query]);
  const movable = visible.filter((item) => !item.disabled);
  const here = selectedIn(visible, state.selected);
  const cursor = visible.find((item) => item.id === state.active) ?? (focused ? (here[0] ?? visible[0]) : undefined) ?? null;
  const cursorId = cursor?.id;
  const everySelected = movable.length > 0 && here.length === movable.length;
  const firstFresh = visible.find((item) => fresh.has(item.id))?.id;

  /** Scrolls the list, and only the list, so that an item is in view: the page itself never moves. */
  function reveal(id: string) {
    const box = listRef.current;
    const element = document.getElementById(domId(id));
    if (!box || !element) return;
    const top = element.offsetTop;
    const bottom = top + element.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }

  useEffect(() => {
    if (focused && cursorId) reveal(cursorId);
  }, [cursorId, focused]);

  useEffect(() => {
    if (firstFresh) reveal(firstFresh);
  }, [firstFresh]);

  function toggle(id: string) {
    const next = toggled(state.selected, id);
    onChange({ selected: next, anchor: id, seed: next, active: id });
  }

  /** Selects everything from the anchor (or the cursor, when there is none yet) to an item, on top of what was selected before the range began. */
  function range(to: string) {
    const from = state.anchor ?? cursor?.id ?? to;
    const seed = state.anchor ? state.seed : state.selected;
    onChange({ selected: new Set([...seed, ...rangeBetween(visible, from, to)]), anchor: from, seed, active: to });
  }

  function selectAll() {
    const next = new Set([...state.selected, ...movable.map((item) => item.id)]);
    onChange({ selected: next, anchor: null, seed: next });
  }

  function clearShown() {
    const next = new Set([...state.selected].filter((id) => !movable.some((item) => item.id === id)));
    onChange({ selected: next, anchor: null, seed: next });
  }

  /** What Enter or a double click moves: the whole selection when the item is part of it, otherwise just the item. */
  function movingFor(item: TransferItem): string[] {
    if (item.disabled) return [];
    return here.some((other) => other.id === item.id) ? here.map((other) => other.id) : [item.id];
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || event.altKey) return;
    const { key } = event;
    if (key !== "Tab" && key !== "Shift" && key !== "Control" && key !== "Meta") setRing(true);
    const at = cursor ? visible.findIndex((item) => item.id === cursor.id) : -1;
    const page = Math.max(1, Math.floor((listRef.current?.clientHeight ?? 288) / 48) - 1);
    const go = (index: number) => {
      event.preventDefault();
      const target = visible[Math.min(visible.length - 1, Math.max(0, index))];
      if (!target) return;
      if (event.shiftKey) range(target.id);
      else onChange({ active: target.id });
    };
    if (key === "ArrowDown") return go(at + 1);
    if (key === "ArrowUp") return go(at < 0 ? 0 : at - 1);
    if (key === "PageDown") return go(at + page);
    if (key === "PageUp") return go(at - page);
    if (key === "Home") return go(0);
    if (key === "End") return go(visible.length - 1);
    if (key === " ") {
      event.preventDefault();
      if (!cursor || cursor.disabled) return;
      if (event.shiftKey) range(cursor.id);
      else toggle(cursor.id);
      return;
    }
    if (key === "Enter") {
      event.preventDefault();
      if (cursor) onMove(movingFor(cursor));
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key.toLowerCase() === "a") {
      event.preventDefault();
      selectAll();
    }
  }

  function onPick(item: TransferItem, event: MouseEvent) {
    if (disabled) return;
    if (item.disabled) {
      onChange({ active: item.id });
      return;
    }
    if (event.shiftKey) range(item.id);
    else toggle(item.id);
  }

  const titleId = `${base}-title`;
  const listId = `${base}-list`;
  const style = height === undefined ? undefined : { height };

  return (
    <section data-slot="transfer-list-pane" data-side={side} aria-labelledby={titleId} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <Checkbox
          aria-label={fill(words.selectAll, { list: title })}
          checked={everySelected ? true : here.length > 0 ? "indeterminate" : false}
          disabled={disabled || movable.length === 0}
          onCheckedChange={(next) => (next === true ? selectAll() : clearShown())}
        />
        <p id={titleId} className="min-w-0 truncate text-sm leading-5 font-medium">
          {title}
        </p>
        <p className="ml-auto shrink-0 text-xs leading-4 text-muted-foreground tabular-nums">{fill(words.selectedCount, { selected: here.length, total: items.length })}</p>
      </div>

      {searchable ? (
        <div className="border-b border-border p-2">
          <SearchInput
            value={state.query}
            onValueChange={(query) => onChange({ query, active: null })}
            disabled={disabled}
            placeholder={words.searchPlaceholder}
            aria-label={fill(words.search, { list: title })}
          />
        </div>
      ) : null}

      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-multiselectable="true"
        aria-labelledby={titleId}
        aria-disabled={disabled || undefined}
        aria-activedescendant={focused && cursorId ? domId(cursorId) : undefined}
        tabIndex={disabled ? -1 : 0}
        hidden={visible.length === 0}
        onKeyDown={onKeyDown}
        onPointerDown={() => setRing(false)}
        onFocus={(event) => {
          setFocused(true);
          setRing(event.currentTarget.matches(":focus-visible"));
        }}
        onBlur={() => {
          setFocused(false);
          setRing(false);
        }}
        style={style}
        className={cn(
          "relative h-56 overflow-y-auto overscroll-contain outline-none @2xl:h-72",
          "[scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]",
          "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
        )}
      >
        {visible.map((item) => {
          const selected = state.selected.has(item.id) && !item.disabled;
          return (
            <div
              key={item.id}
              id={domId(item.id)}
              role="option"
              aria-selected={selected}
              aria-disabled={item.disabled || undefined}
              data-selected={selected ? "" : undefined}
              data-active={ring && item.id === cursorId ? "" : undefined}
              data-fresh={fresh.has(item.id) ? "" : undefined}
              onClick={(event) => onPick(item, event)}
              onDoubleClick={() => !disabled && onMove(movingFor(item))}
              className={cn(
                "group/option relative isolate flex min-h-12 w-full cursor-pointer items-center gap-3 border-b border-border/60 px-3 py-2 select-none last:border-b-0",
                "transition-colors duration-150 motion-reduce:transition-none",
                "hover:bg-muted/50 data-[selected]:bg-muted",
                "data-[active]:ring-2 data-[active]:ring-inset data-[active]:ring-ring/60",
                "aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent",
              )}
            >
              {/* The tint of an item that has just arrived: it appears at once and fades out slowly, in a layer of its own so that selecting stays quick. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 bg-foreground/10 opacity-0 transition-opacity duration-1000 group-data-[fresh]/option:opacity-100 group-data-[fresh]/option:duration-0 motion-reduce:transition-none"
              />
              <span aria-hidden="true" className={cn(BOX, item.disabled && "opacity-50")}>
                <IconCheck size={12} strokeWidth={2.5} className="opacity-0 transition-opacity duration-150 group-data-[selected]/option:opacity-100 motion-reduce:transition-none" />
              </span>
              <span className={cn("grid min-w-0 flex-1 gap-0.5", item.disabled && "opacity-50")}>
                <span className="truncate text-sm leading-5 font-medium">{item.label}</span>
                {item.description ? <span className="truncate text-xs leading-4 text-muted-foreground">{item.description}</span> : null}
              </span>
              {item.disabled ? <IconLock aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
            </div>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p style={style} className="grid h-56 place-items-center px-6 text-center text-sm text-muted-foreground @2xl:h-72">
          {state.query ? fill(words.noMatches, { query: state.query }) : empty}
        </p>
      ) : null}
    </section>
  );
}
