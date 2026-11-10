"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from "@rhs-ui/icons";
import { Pane } from "@rhs-ui/application/transfer-list/pane";
import {
  DEFAULT_LABELS,
  EMPTY_PANE,
  fill,
  filterItems,
  knownIds,
  nextActive,
  selectedIn,
  type PaneState,
  type Side,
  type TransferItem,
  type TransferListLabels,
  type TransferTitles,
} from "@rhs-ui/application/transfer-list/transfer";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { TransferItem, TransferListLabels, TransferTitles } from "@rhs-ui/application/transfer-list/transfer";

export interface TransferListProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** Everything that can be chosen, with an id, a label and an optional second line. A disabled item cannot be moved. */
  items: readonly TransferItem[];
  /** The ids of the chosen items, in the order to show them, when you control the lists. New items are added at the end. */
  value?: readonly string[];
  /** The ids to begin with, when the component keeps them itself. */
  defaultValue?: readonly string[];
  /** Called with all the chosen ids whenever items are added or removed. */
  onValueChange?: (value: string[]) => void;
  /** The headings of the two lists. Default "Available" and "Chosen". */
  titles?: TransferTitles;
  /** Give each list a search field. Default true. */
  searchable?: boolean;
  /** The height of each list: a number of px or any CSS length. Default 18rem, 14rem when the lists are stacked. */
  height?: number | string;
  /** A name for a plain form submit: one hidden input per chosen id. */
  name?: string;
  /** Turn the whole thing off. */
  disabled?: boolean;
  /** The language of the plural rules for the announcements. Default "en-US". */
  locale?: string;
  /** The words the lists say, for translation. */
  labels?: TransferListLabels;
}

interface MoveButtonProps {
  /** What the button does, in full: it names the button for assistive technology and is its tooltip ("Add all (3 shown)"). */
  label: string;
  /** The word under the chevron while the buttons lie in a row between stacked lists ("Add all"), without the count of a search. Beside the lists the chevron is enough. */
  text: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** One of the four buttons between the lists: a chevron, with its word under it when the lists are stacked, where a row of bare chevrons says nothing on a phone. */
function MoveButton({ label, text, disabled, onClick, children }: MoveButtonProps): React.JSX.Element {
  return (
    <Button type="button" variant="outline" disabled={disabled} title={label} aria-label={label} onClick={onClick} className="h-auto w-full min-w-0 flex-col gap-0.5 px-1 py-1.5 @2xl:size-9 @2xl:flex-row @2xl:p-0">
      {children}
      <span aria-hidden="true" className="text-center text-[0.6875rem] leading-3.5 font-medium text-balance @2xl:sr-only">
        {text}
      </span>
    </Button>
  );
}

/**
 * A dual list for giving many things to something: members to a project,
 * columns to a view, permissions to a role. Each list is a multi-select
 * listbox with a search field and an "N of M selected" header; Add, Add all,
 * Remove and Remove all are real buttons named for what they do and disabled
 * when they would do nothing, and double-click or Enter on an item moves it.
 * After a move the cursor stays where the items were, so the keyboard carries
 * on from the same place, and the move is announced ("3 items added to
 * Chosen"). When the container is narrow the lists stack and the buttons lie
 * in a row between them, each with its word under the chevron.
 */
export function TransferList({ items, value, defaultValue, onValueChange, titles, searchable = true, height, name, disabled = false, locale = "en-US", labels, className, ...props }: TransferListProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const names: Record<Side, string> = { available: titles?.available ?? "Available", chosen: titles?.chosen ?? "Chosen" };
  const base = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const [panes, setPanes] = useState<Record<Side, PaneState>>({ available: EMPTY_PANE, chosen: EMPTY_PANE });
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set());
  const [said, setSaid] = useState("");
  // Where the focus should go after a move, when the move took away what had it.
  const [land, setLand] = useState<{ side: Side } | null>(null);
  const availableList = useRef<HTMLDivElement | null>(null);
  const chosenList = useRef<HTMLDivElement | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const chosenIds = knownIds(value ?? own, items);
  const chosenSet = new Set(chosenIds);
  const index = useMemo(() => new Map(items.map((item, at) => [item.id, at] as const)), [items]);
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item] as const)), [items]);
  const lists: Record<Side, TransferItem[]> = {
    available: items.filter((item) => !chosenSet.has(item.id)),
    chosen: chosenIds.flatMap((id) => byId.get(id) ?? []),
  };
  const shown: Record<Side, TransferItem[]> = { available: filterItems(lists.available, panes.available.query), chosen: filterItems(lists.chosen, panes.chosen.query) };
  const picked: Record<Side, TransferItem[]> = { available: selectedIn(shown.available, panes.available.selected), chosen: selectedIn(shown.chosen, panes.chosen.selected) };
  const everything: Record<Side, TransferItem[]> = { available: shown.available.filter((item) => !item.disabled), chosen: shown.chosen.filter((item) => !item.disabled) };

  useEffect(() => {
    if (land) (land.side === "available" ? availableList : chosenList).current?.focus({ preventScroll: true });
  }, [land]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const noun = (count: number) => (new Intl.PluralRules(locale).select(count) === "one" ? words.itemOne : words.itemOther);

  function patch(side: Side, change: Partial<PaneState>) {
    setPanes((before) => ({ ...before, [side]: { ...before[side], ...change } }));
  }

  /** Moves items out of one list into the other, and tells people. `by` says what asked: a button, or the list itself (Enter, a double click). */
  function move(from: Side, ids: readonly string[], by: "button" | "list") {
    if (disabled || ids.length === 0) return;
    const to: Side = from === "available" ? "chosen" : "available";
    const leaving = new Set(ids);
    const next = from === "available" ? [...chosenIds, ...items.filter((item) => leaving.has(item.id)).map((item) => item.id)] : chosenIds.filter((id) => !leaving.has(id));
    if (value === undefined) setOwn(next);
    onValueChange?.(next);

    // The cursor stays where the items were, and what was selected goes with them.
    setPanes((before) => {
      const pane = before[from];
      return { ...before, [from]: { ...pane, selected: new Set([...pane.selected].filter((id) => !leaving.has(id))), anchor: null, seed: new Set<string>(), active: nextActive(shown[from], leaving) } };
    });
    setFresh(new Set(ids));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFresh(new Set()), 1600);
    setSaid(fill(from === "available" ? words.added : words.removed, { count: ids.length, noun: noun(ids.length), list: names.chosen }));

    // A button that moved something may have switched itself off, and a list that is now empty cannot hold the focus: put it where it can carry on.
    const left = shown[from].filter((item) => !leaving.has(item.id));
    if (left.length === 0) setLand({ side: to });
    else if (by === "button") setLand({ side: from });
  }

  const idsOf = (list: readonly TransferItem[]) => list.map((item) => item.id);
  const domId = (side: Side) => (id: string) => `${base}-${side}-${index.get(id) ?? id}`;
  const filtered = (side: Side) => panes[side].query.trim() !== "";

  /** A button's name: "Add all", or "Add all (3 shown)" while a search narrows it. */
  const nameOf = (label: string, side: Side) => (filtered(side) ? fill(words.shown, { label, count: everything[side].length }) : label);

  const moveButtons = (
    <div role="group" aria-label={words.moveGroup} data-slot="transfer-list-actions" className="grid grid-cols-4 gap-2 @2xl:grid-cols-1 @2xl:self-center">
      <MoveButton label={words.add} text={words.add} disabled={disabled || picked.available.length === 0} onClick={() => move("available", idsOf(picked.available), "button")}>
        <IconChevronRight aria-hidden="true" className="rotate-90 @2xl:rotate-0" />
      </MoveButton>
      <MoveButton label={nameOf(words.addAll, "available")} text={words.addAll} disabled={disabled || everything.available.length === 0} onClick={() => move("available", idsOf(everything.available), "button")}>
        <IconChevronsRight aria-hidden="true" className="rotate-90 @2xl:rotate-0" />
      </MoveButton>
      <MoveButton label={words.remove} text={words.remove} disabled={disabled || picked.chosen.length === 0} onClick={() => move("chosen", idsOf(picked.chosen), "button")}>
        <IconChevronLeft aria-hidden="true" className="rotate-90 @2xl:rotate-0" />
      </MoveButton>
      <MoveButton label={nameOf(words.removeAll, "chosen")} text={words.removeAll} disabled={disabled || everything.chosen.length === 0} onClick={() => move("chosen", idsOf(everything.chosen), "button")}>
        <IconChevronsLeft aria-hidden="true" className="rotate-90 @2xl:rotate-0" />
      </MoveButton>
    </div>
  );

  return (
    <div data-slot="transfer-list" className={cn("@container w-full min-w-0", disabled && "opacity-60", className)} {...props}>
      <div className="grid gap-3 @2xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @2xl:gap-4">
        <Pane
          side="available"
          title={names.available}
          items={lists.available}
          domId={domId("available")}
          state={panes.available}
          onChange={(change) => patch("available", change)}
          onMove={(ids) => move("available", ids, "list")}
          fresh={fresh}
          searchable={searchable}
          height={height}
          disabled={disabled}
          empty={words.emptyAvailable}
          words={words}
          listRef={availableList}
        />
        {moveButtons}
        <Pane
          side="chosen"
          title={names.chosen}
          items={lists.chosen}
          domId={domId("chosen")}
          state={panes.chosen}
          onChange={(change) => patch("chosen", change)}
          onMove={(ids) => move("chosen", ids, "list")}
          fresh={fresh}
          searchable={searchable}
          height={height}
          disabled={disabled}
          empty={fill(words.emptyChosen, { list: names.available })}
          words={words}
          listRef={chosenList}
        />
      </div>

      {name ? chosenIds.map((id) => <input key={id} type="hidden" name={name} value={id} />) : null}

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
