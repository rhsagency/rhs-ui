"use client";

import { Fragment, useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent } from "react";

import { IconCheck, IconChevronLeft, IconChevronRight, IconChevronsUpDown, IconClose, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import {
  columnsFor,
  DEFAULT_LABELS,
  depthOf,
  hasChildren,
  keyOf,
  resolve,
  search,
  splitMatch,
  trailFor,
  type CascadeLabels,
  type CascadeOption,
  type Match,
} from "@rhs-ui/primitives/cascade-select/tree";
import { cn } from "@/lib/utils";

export type { CascadeLabels, CascadeOption } from "@rhs-ui/primitives/cascade-select/tree";

export interface CascadeSelectProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The tree of choices. A choice with `children` opens them; one without is a leaf and can be picked. */
  options: readonly CascadeOption[];
  /** Names the field and its lists for assistive technology: "Category". */
  label: string;
  /** The chosen path, as the `value` of each step: `["electronics", "phones", "android"]`. Use it to control the select. */
  value?: readonly string[];
  /** The path to start with, when you do not control the select. */
  defaultValue?: readonly string[];
  /** Called with the whole path when a choice is made, and with every step when `changeOnSelect` is on. */
  onValueChange?: (path: string[]) => void;
  /** Let a choice that opens more be picked too, so "Electronics" or "Electronics / Phones" is a valid answer. A click then picks it and opens it. Default false. */
  changeOnSelect?: boolean;
  /** What stands between the steps of a path in the field, in the search and on the way back. Default " / ". */
  separator?: string;
  /** Show a search box that flattens the tree to the paths that match. Default true. */
  searchable?: boolean;
  /** The id of the field, so a form label's `htmlFor` can point at it. */
  id?: string;
  /** The field's name for a plain form submit: the values of the path joined with a slash, in one hidden input. */
  name?: string;
  /** The id of the element that describes the field: a hint, an error. */
  "aria-describedby"?: string;
  /** Marks the field as not accepted. */
  "aria-invalid"?: boolean | "true" | "false";
  /** Turn the field off. */
  disabled?: boolean;
  /** Start with the panel open, for a preview or a tour. It does not take the focus from the page until someone has used it. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words of the select, for another language or your own voice. */
  labels?: Partial<CascadeLabels>;
}

/** Whether the screen is at least this wide. The panel is only drawn while it is open, in the browser, so there is no server answer to disagree with. */
function useMinWidth(px: number): boolean {
  return useSyncExternalStore(
    (notify) => {
      const query = window.matchMedia(`(min-width: ${px}px)`);
      query.addEventListener("change", notify);
      return () => query.removeEventListener("change", notify);
    },
    () => window.matchMedia(`(min-width: ${px}px)`).matches,
    () => true,
  );
}

const ROW =
  "relative flex min-h-9 w-full cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none select-none " +
  "transition-colors duration-100 hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset data-[open]:bg-muted " +
  "aria-disabled:pointer-events-none aria-disabled:opacity-50 motion-reduce:transition-none";

/** A text with the part the search found in strong type. */
function Marked({ text, query }: { text: string; query: string }) {
  const [before, match, after] = splitMatch(text, query);
  return match ? (
    <>
      {before}
      <mark className="bg-transparent font-semibold text-foreground">{match}</mark>
      {after}
    </>
  ) : (
    text
  );
}

/** What a row needs to know about itself: its path, where it sits in its list, and for a search result the names along its path. */
interface RowProps {
  at: string[];
  option: CascadeOption;
  level: number;
  size: number;
  index: number;
  names?: string[];
}

/**
 * A select for tree-shaped choices: category, subcategory and item, or
 * country, region and city. On a wide screen, opening a choice puts what is
 * inside it in a new column to the right; the keyboard goes in with Right and
 * back with Left. On a phone the same panel is a drill-down list with a back row
 * and the path above it. The field shows the whole path ("Electronics / Phones
 * / Android"), cut short in the middle where it must be so the last step is
 * always read, and a search box flattens the tree to the paths that match.
 * The columns are a tree, so every choice knows its level, its place in it
 * and whether it is open, and the depth you reach is announced; the matches
 * of a search are a plain listbox.
 */
export function CascadeSelect({
  options,
  label,
  value,
  defaultValue,
  onValueChange,
  changeOnSelect = false,
  separator = " / ",
  searchable = true,
  id,
  name,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  disabled,
  defaultOpen = false,
  onOpenChange,
  labels: labelOverrides,
  className,
  ...props
}: CascadeSelectProps) {
  const text: CascadeLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const panel = useRef<HTMLDivElement>(null);
  const searchBox = useRef<HTMLInputElement>(null);
  const focusNext = useRef<string | null>(null);
  const [open, setOpenState] = useState(defaultOpen);
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  // Where the panel starts: on the chosen choice, with what is inside it and around it open, or on the first choice that can be chosen.
  const start = (from: readonly string[]) => {
    const opened = trailFor(options, from);
    const last = columnsFor(options, opened).pop()!;
    const firstOption = last.options.find((option) => !option.disabled);
    return { trail: opened, active: resolve(options, from)?.length ? [...from] : firstOption ? [...last.path, firstOption.value] : null };
  };
  const [trail, setTrail] = useState<string[]>(() => (defaultOpen ? start(value ?? defaultValue ?? []).trail : []));
  const [active, setActive] = useState<string[] | null>(() => (defaultOpen ? start(value ?? defaultValue ?? []).active : null));

  const [query, setQuery] = useState("");
  const [said, setSaid] = useState("");
  const path = value ?? own;
  const chain = resolve(options, path);
  const depth = Math.max(1, depthOf(options));
  const wide = useMinWidth(depth * 224 + 64);
  const searching = searchable && query.trim() !== "";
  const found = searching ? search(options, query, changeOnSelect) : { matches: [] as Match[], total: 0 };
  const columns = columnsFor(options, trail);
  const shown = wide ? columns : columns.slice(-1);
  const current = columns[columns.length - 1]!;
  const first = current.options.find((option) => !option.disabled);
  // The one row in the tab order: the one that has the focus, if it is on screen, else the first that can be chosen.
  const onScreen = new Set(searching ? found.matches.map((match) => keyOf(match.path)) : shown.flatMap((column) => column.options.map((option) => keyOf([...column.path, option.value]))));
  const fallback = searching ? (found.matches[0] ? keyOf(found.matches[0].path) : "") : first ? keyOf([...current.path, first.value]) : "";
  const activeKey = active && onScreen.has(keyOf(active)) ? keyOf(active) : fallback;

  /** Puts the focus on a row, by its key, or on the search box. False when it is not on screen yet. */
  function focusKey(wanted: string): boolean {
    const target = wanted === "search" ? searchBox.current : Array.from(panel.current?.querySelectorAll<HTMLElement>("[data-key]") ?? []).find((element) => element.dataset.key === wanted);
    target?.focus();
    return Boolean(target);
  }

  // After a state change that moves the focus, the element that should have it takes it once it has been drawn. A panel that is still
  // opening is not there yet: the wish stays until it is.
  useEffect(() => {
    const wanted = focusNext.current;
    if (wanted !== null && focusKey(wanted)) focusNext.current = null;
  });

  function commit(next: readonly string[]) {
    if (value === undefined) setOwn(next);
    onValueChange?.([...next]);
  }

  function announce(parent: CascadeOption | null, size: number, level: number) {
    setSaid(text.level(parent?.label ?? label, level, depth, size));
  }

  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }

  function openPanel(next: boolean) {
    setOpen(next);
    if (!next) return;
    const from = start(path);
    setTrail(from.trail);
    setActive(from.active);
    setQuery("");
    setSaid("");
    // The focus starts on the chosen choice, or on the first one that can be chosen.
    focusNext.current = from.active ? keyOf(from.active) : null;
  }

  /** Opens a choice and puts the focus on the first thing inside it, or on the one that is chosen there. */
  function enter(at: string[], option: CascadeOption) {
    const inside = (option.children ?? []).filter((child) => !child.disabled);
    if (!inside.length) return;
    const onPath = keyOf(path.slice(0, at.length)) === keyOf(at) ? inside.find((child) => child.value === path[at.length]) : undefined;
    const target = [...at, (onPath ?? inside[0]!).value];
    setTrail(at);
    setActive(target);
    focusNext.current = keyOf(target);
    announce(option, option.children?.length ?? 0, at.length + 1);
  }

  /** Closes the column of the choice at `parent` and puts the focus back on that choice. */
  function ascend(parent: string[]) {
    if (!parent.length) return;
    const above = parent.slice(0, -1);
    const column = columnsFor(options, above).pop()!;
    setTrail(above);
    setActive(parent);
    focusNext.current = keyOf(parent);
    announce(column.parent, column.options.length, parent.length);
  }

  function pick(at: string[], option: CascadeOption, byKey: boolean) {
    if (option.disabled) return;
    if (!hasChildren(option)) {
      commit(at);
      setOpen(false);
      return;
    }
    if (changeOnSelect) commit(at);
    // A key, and a tap on a phone, go in. A click on a wide screen opens the column and stays on the choice.
    if (byKey || !wide) enter(at, option);
    else {
      setTrail(at);
      setActive(at);
      focusNext.current = keyOf(at);
      announce(option, option.children?.length ?? 0, at.length + 1);
    }
  }

  function step(at: string[], siblings: readonly (readonly string[])[], to: "next" | "previous" | "first" | "last") {
    if (!siblings.length) return;
    const index = siblings.findIndex((entry) => keyOf(entry) === keyOf(at));
    if (to === "previous" && index === 0 && searching) {
      focusNext.current = "search";
      setActive(null);
      return;
    }
    const target = to === "first" ? 0 : to === "last" ? siblings.length - 1 : (index + (to === "next" ? 1 : -1) + siblings.length) % siblings.length;
    const next = [...siblings[target]!];
    // Moving to another choice closes whatever was open beside the one left behind.
    if (!searching) setTrail(next.slice(0, -1));
    setActive(next);
    focusNext.current = keyOf(next);
  }

  function onRowKey(event: KeyboardEvent<HTMLElement>, at: string[], option: CascadeOption, results: boolean) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const level = results ? found.matches.map((match) => match.path) : (columns[at.length - 1]?.options ?? []).filter((entry) => !entry.disabled).map((entry) => [...at.slice(0, -1), entry.value]);
    const acts: Record<string, () => void> = {
      ArrowDown: () => step(at, level, "next"),
      ArrowUp: () => step(at, level, "previous"),
      Home: () => step(at, level, "first"),
      End: () => step(at, level, "last"),
      Enter: () => (results ? (commit(at), setOpen(false)) : pick(at, option, true)),
      " ": () => (results ? (commit(at), setOpen(false)) : pick(at, option, true)),
    };
    if (!results) {
      acts.ArrowRight = () => enter(at, option);
      acts.ArrowLeft = () => ascend(at.slice(0, -1));
    }
    const act = acts[event.key];
    if (act) {
      event.preventDefault();
      act();
      return;
    }
    // A letter typed on a choice is a start on the search: it goes to the box, which takes the focus.
    if (searchable && event.key.length === 1 && /\S/.test(event.key)) {
      event.preventDefault();
      setQuery((typed) => typed + event.key);
      setActive(null);
      focusNext.current = "search";
    }
  }

  const row = ({ at, option, level, size, index, names }: RowProps) => {
    const k = keyOf(at);
    const onPath = path.length >= at.length && keyOf(path.slice(0, at.length)) === k;
    const picked = onPath && path.length === at.length;
    const parent = hasChildren(option);
    const inTrail = parent && trail.length >= at.length && keyOf(trail.slice(0, at.length)) === k;
    return (
      <div
        key={k}
        role={names ? "option" : "treeitem"}
        data-key={k}
        tabIndex={k === activeKey ? 0 : -1}
        aria-selected={onPath}
        aria-expanded={names || !parent ? undefined : inTrail}
        aria-disabled={option.disabled || undefined}
        aria-level={names ? undefined : level}
        aria-setsize={names ? undefined : size}
        aria-posinset={names ? undefined : index + 1}
        data-open={inTrail ? "" : undefined}
        onClick={() => (names ? (commit(at), setOpen(false)) : pick(at, option, false))}
        onFocus={() => setActive(at)}
        onKeyDown={(event) => onRowKey(event, at, option, Boolean(names))}
        className={cn(ROW, onPath && "font-medium")}
      >
        <span className="min-w-0 flex-1 truncate">
          {names
            ? names.map((part, at2) => (
                <Fragment key={at2}>
                  {at2 > 0 ? <span className="text-muted-foreground">{separator}</span> : null}
                  <span className={at2 < names.length - 1 ? "text-muted-foreground" : undefined}>
                    <Marked text={part} query={query} />
                  </span>
                </Fragment>
              ))
            : option.label}
        </span>
        {parent && !names ? (
          <>
            <span className="sr-only">{text.inside(option.children?.length ?? 0)}</span>
            <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </>
        ) : null}
        {picked ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : null}
        {picked ? <span className="sr-only">, selected</span> : null}
      </div>
    );
  };

  const names = chain?.map((option) => option.label) ?? [];
  const head = names.slice(0, -1).join(separator);
  const tail = names[names.length - 1] ?? "";
  const backTo = trail.length > 1 ? (resolve(options, trail.slice(0, -1))?.at(-1)?.label ?? text.all) : text.all;
  const where = (resolve(options, trail) ?? []).map((option) => option.label).join(separator);

  return (
    <div data-slot="cascade-select" data-disabled={disabled || undefined} className={cn("w-full min-w-0", className)} {...props}>
      <Popover open={open} onOpenChange={openPanel}>
        <PopoverTrigger
          id={id}
          role="combobox"
          aria-haspopup="tree"
          aria-label={label}
          aria-describedby={describedBy}
          aria-invalid={invalid === true || invalid === "true" || undefined}
          disabled={disabled}
          title={names.length ? names.join(separator) : undefined}
          data-placeholder={names.length ? undefined : ""}
          className={cn(fieldSurface, "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left data-[placeholder]:text-muted-foreground")}
        >
          {names.length ? (
            // The front of the path gives way first, so the last step is the one that is read. The front and its separator share one box, which
            // is let onto the line only if three characters of the front can show beside the last step (its flex basis); if not, the box wraps to
            // a second line, which the row clips, and the last step stands alone. Wrapping happens before shrinking, so a front is never a stub.
            <span className="flex h-5 min-w-0 flex-1 flex-wrap-reverse content-end items-baseline overflow-hidden">
              {head ? (
                <span className="flex max-w-max min-w-0 grow items-baseline whitespace-pre text-muted-foreground" style={{ flexBasis: `${3 + separator.length / 2}ch` }}>
                  <span className="min-w-0 truncate">{head}</span>
                  <span className="shrink-0">{separator}</span>
                </span>
              ) : null}
              <span className="min-w-0 truncate whitespace-pre">{tail}</span>
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate">{text.placeholder}</span>
          )}
          <IconChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={label}
          collisionPadding={8}
          className="w-auto max-w-[calc(100vw-1rem)] min-w-(--radix-popover-trigger-width) overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            const wanted = focusNext.current;
            if (wanted && focusKey(wanted)) focusNext.current = null;
          }}
          onEscapeKeyDown={(event) => {
            // The first Escape empties the search, the second closes the panel.
            if (query) {
              event.preventDefault();
              setQuery("");
              focusNext.current = "search";
            }
          }}
        >
          <div
            ref={panel}
            style={wide ? { width: `${Math.min(columns.length, depth) * 14}rem` } : undefined}
            className={cn("flex max-w-full flex-col", wide ? "transition-[width] duration-200 motion-reduce:transition-none" : "w-(--radix-popover-trigger-width) min-w-64")}
          >
            {searchable ? (
              <div className="relative border-b border-border p-2">
                <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchBox}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={text.search(label)}
                  placeholder={text.searchPlaceholder}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActive(null);
                    setSaid("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" && activeKey) {
                      event.preventDefault();
                      focusKey(activeKey);
                    } else if (event.key === "Enter" && searching && found.matches[0]) {
                      event.preventDefault();
                      commit(found.matches[0].path);
                      setOpen(false);
                    }
                  }}
                  className="h-9 w-full min-w-0 rounded-md border border-input bg-background pr-8 pl-8 text-sm shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={text.clearSearch}
                    onClick={() => {
                      setQuery("");
                      searchBox.current?.focus();
                    }}
                    className="absolute top-1/2 right-3.5 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    <IconClose aria-hidden="true" className="size-3.5" />
                  </button>
                ) : null}
              </div>
            ) : null}

            {searching ? (
              <div className="relative max-h-72 overflow-y-auto p-1">
                {/* A list of matches only exists when there are some: a listbox with nothing in it, or with a note among its options, is not one. */}
                {found.matches.length ? (
                  <div role="listbox" aria-label={text.results}>
                    {found.matches.map((match) => row({ at: match.path, option: match.option, level: 0, size: 0, index: 0, names: match.labels }))}
                  </div>
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">{text.empty(query.trim())}</p>
                )}
                {found.total > found.matches.length ? <p className="px-3 py-2 text-center text-xs text-muted-foreground">{text.more(found.total - found.matches.length)}</p> : null}
              </div>
            ) : (
              <>
                {!wide && trail.length > 0 ? (
                  <div className="border-b border-border p-1">
                    <Button type="button" variant="ghost" size="sm" className="w-full justify-start gap-1.5 px-2" onClick={() => ascend(trail)}>
                      <IconChevronLeft aria-hidden="true" />
                      {text.back(backTo)}
                    </Button>
                    <p className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">{where}</p>
                  </div>
                ) : null}
                <div role="tree" aria-label={label} className="flex min-h-0 divide-x divide-border">
                  {shown.map((column) => (
                    <div
                      key={keyOf(column.path)}
                      role="group"
                      aria-label={column.parent?.label ?? label}
                      className={cn("relative min-w-0 flex-1 basis-0 overflow-y-auto p-1 [scrollbar-width:thin]", wide ? "h-64" : "max-h-72 min-h-40")}
                    >
                      {column.options.map((option, index) => row({ at: [...column.path, option.value], option, level: column.path.length + 1, size: column.options.length, index }))}
                    </div>
                  ))}
                </div>
              </>
            )}
            <span role="status" aria-live="polite" className="sr-only">
              {searching ? text.found(found.total) : said}
            </span>
          </div>
        </PopoverContent>
      </Popover>
      {name ? <input type="hidden" name={name} value={path.join("/")} disabled={disabled} /> : null}
    </div>
  );
}
