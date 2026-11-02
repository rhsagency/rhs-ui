"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { filterOptions, groupOptions, inOrder, matchRanges, typeahead, type ListboxOption } from "@rhs-ui/primitives/listbox/options";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export type { ListboxGroup, ListboxOption } from "@rhs-ui/primitives/listbox/options";

interface ListboxBase extends Omit<ComponentProps<"div">, "value" | "defaultValue" | "onChange" | "children" | "role" | "aria-label" | "aria-labelledby"> {
  /** The options, in the order they are shown. Options with the same `group` are gathered under one sticky heading. */
  options: readonly ListboxOption[];
  /** The name of the list for a screen reader: "Time zone". Give this or `aria-labelledby`. */
  "aria-label"?: string;
  /** The id of a visible element that names the list, in place of `aria-label`. */
  "aria-labelledby"?: string;
  /** Add a search field above the list. It filters the options as you type; the arrow keys and Enter work from inside it, so it is still the one tab stop. Pressing an option never moves the focus into the field, so a tap does not raise the on-screen keyboard. Default false. */
  searchable?: boolean;
  /** The placeholder of the search field. Default "Search". */
  searchPlaceholder?: string;
  /** What the list says when nothing is left to choose from. Default "No matches". */
  emptyMessage?: ReactNode;
  /** The field's name for a plain form submit: one hidden input for each chosen value. */
  name?: string;
  /** The tallest the list grows before it scrolls inside its box: a number of px or any CSS length. Default "16rem". */
  height?: number | string;
  /** Turn the whole list off. */
  disabled?: boolean;
}

export interface ListboxSingleProps extends ListboxBase {
  /** One option can be chosen. This is the default. */
  selectionMode?: "single";
  /** The chosen value, when you control it. `null` is no choice. */
  value?: string | null;
  /** The value to start with, when you do not control the list. */
  defaultValue?: string | null;
  /** Called with the value of the option that was chosen. */
  onValueChange?: (value: string) => void;
}

export interface ListboxMultipleProps extends ListboxBase {
  /** Any number of options can be chosen. */
  selectionMode: "multiple";
  /** The chosen values, when you control them. */
  value?: readonly string[];
  /** The values to start with, when you do not control the list. */
  defaultValue?: readonly string[];
  /** Called with every chosen value, in the order of the options, whenever the choice changes. */
  onValueChange?: (value: string[]) => void;
}

export type ListboxProps = ListboxSingleProps | ListboxMultipleProps;

const HEADING = 32;

const OPTION = [
  "group/option relative flex min-h-10 w-full cursor-pointer items-center gap-3 px-3 py-2 select-none [@media(pointer:coarse)]:min-h-11",
  "transition-colors duration-100 motion-reduce:transition-none",
  "hover:bg-muted/50 data-[selected]:bg-muted data-[selected]:hover:bg-muted",
  "data-[active]:ring-2 data-[active]:ring-inset data-[active]:ring-ring/60",
  "aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent",
].join(" ");

/** A text with the parts a search matched marked, in a tint that keeps the words readable and the weight where it was. */
function Marked({ text, query }: { text: string; query: string }): React.JSX.Element {
  const ranges = matchRanges(text, query);
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.JSX.Element[] = [];
  let at = 0;
  for (const [from, to] of ranges) {
    if (from > at) parts.push(<span key={`t${at}`}>{text.slice(at, from)}</span>);
    parts.push(
      <mark key={`m${from}`} className="-mx-px rounded-[3px] bg-foreground/[0.16] px-px text-inherit">
        {text.slice(from, to)}
      </mark>,
    );
    at = to;
  }
  if (at < text.length) parts.push(<span key={`t${at}`}>{text.slice(at)}</span>);
  return <>{parts}</>;
}

const asList = (value: string | readonly string[] | null | undefined): readonly string[] => (value === null || value === undefined ? [] : typeof value === "string" ? [value] : value);

/**
 * A list that is always open, for choosing without opening anything: a side
 * panel, a picker inside a dialog, a long settings list. It is one tab stop
 * that keeps the focus on the list and points at the active option with
 * aria-activedescendant. The arrow keys move, typeahead jumps, Home and End go
 * to the ends, and where several can be chosen Space toggles, Shift with the
 * arrows or a click chooses a range, and Control or Command with A chooses all
 * (from the search field only while it is empty). Pressing an option keeps the
 * focus where it is or puts it on the list, never moves it into the search
 * field, so a tap does not raise the on-screen keyboard. Group headings stay at
 * the top while their options scroll under them, the arrow keys skip them, and
 * the active option is always kept in view. A chosen option has a check as well
 * as a fill, and a live line reads "3 selected". With `name` the values go out
 * with a form.
 */
export function Listbox(props: ListboxProps) {
  const {
    options,
    "aria-label": ariaLabel,
    "aria-labelledby": labelledBy,
    searchable = false,
    searchPlaceholder = "Search",
    emptyMessage,
    name,
    height = "16rem",
    disabled = false,
    className,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    ...rest
  } = props;
  const multiple = selectionMode === "multiple";
  const id = useId();
  const listId = `${id}-list`;
  const frame = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const anchor = useRef<string | null>(null);
  const seed = useRef<readonly string[]>([]);
  const ranging = useRef(false);
  // Where the cursor stood when an option was pressed: the start of a range if it is Shift-clicked.
  const pressedFrom = useRef<string | null>(null);
  const typed = useRef<{ text: string; timer: number | undefined }>({ text: "", timer: undefined });
  const [own, setOwn] = useState<readonly string[]>(() => asList(defaultValue));
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  // Which part holds the focus: the search field, or the list itself (always, when there is no search).
  const [focus, setFocus] = useState<"field" | "list" | null>(null);
  const focused = focus !== null;
  const ids = useMemo(() => new Map(options.map((option, index) => [option.value, `${id}-option-${index}`])), [options, id]);
  // Only values that are still an option count: a value left over from other options is not a choice.
  const chosen = (value !== undefined ? asList(value) : own).filter((item) => ids.has(item));

  const visible = useMemo(() => filterOptions(options, query), [options, query]);
  const groups = useMemo(() => groupOptions(visible), [visible]);
  const nav = useMemo(() => (disabled ? [] : groups.flatMap((group) => group.options).filter((option) => !option.disabled)), [groups, disabled]);
  // Where the cursor is: where it was put, else (once the list has the focus) the first chosen option, else the first one (or the first match, while searching).
  const resting = query ? nav[0] : (nav.find((option) => chosen.includes(option.value)) ?? nav[0]);
  const cursor = nav.find((option) => option.value === active) ?? (focused ? resting : undefined) ?? null;
  const cursorValue = cursor?.value;
  const cursorId = cursorValue === undefined ? undefined : ids.get(cursorValue);

  // Keep the cursor on screen: inside the box, and under the heading that sticks to the top. Done by hand, so the page itself never scrolls.
  function reveal(optionValue: string) {
    const box = list.current;
    const element = box && document.getElementById(ids.get(optionValue) ?? "");
    if (!box || !element) return;
    const room = box.querySelector("[data-slot=listbox-heading]") ? HEADING : 0;
    const top = element.offsetTop - room;
    const bottom = element.offsetTop + element.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }

  useEffect(() => {
    if (focused && cursorValue !== undefined) reveal(cursorValue);
  }, [cursorValue, focused]);

  // A list that opens with something chosen shows it, even when it is far down.
  useEffect(() => {
    const first = chosen[0];
    if (first !== undefined) reveal(first);
  }, []);

  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  function write(next: Iterable<string>) {
    const ordered = inOrder(options, next);
    if (value === undefined) setOwn(ordered);
    if (props.selectionMode === "multiple") props.onValueChange?.(ordered);
    else if (ordered[0] !== undefined && ordered[0] !== chosen[0]) props.onValueChange?.(ordered[0]);
  }

  /** Choose it, or in a list of several, toggle it. This is what a click, Enter and Space do. */
  function activate(option: ListboxOption) {
    if (!multiple) {
      write([option.value]);
      return;
    }
    const next = chosen.includes(option.value) ? chosen.filter((item) => item !== option.value) : [...chosen, option.value];
    anchor.current = option.value;
    seed.current = next;
    ranging.current = false;
    write(next);
  }

  /** Choose every enabled option from the anchor to this one, on top of what was chosen before the range began. */
  function extendTo(target: string, from: string | null) {
    if (!ranging.current) {
      ranging.current = true;
      seed.current = chosen;
      anchor.current = from ?? anchor.current ?? target;
    }
    const a = nav.findIndex((option) => option.value === anchor.current);
    const b = nav.findIndex((option) => option.value === target);
    if (a < 0 || b < 0) return;
    write([...seed.current, ...nav.slice(Math.min(a, b), Math.max(a, b) + 1).map((option) => option.value)]);
  }

  /**
   * Where the focus goes when an option is pressed (its default is cancelled, so it would stay where it was). The search field keeps it only
   * if it has it already and the pointer is a mouse; every other time the list takes it. A finger never raises the on-screen keyboard that
   * way, and a keyboard that is up goes down, so the list can be seen whole while several people are picked.
   */
  function focusFromPress() {
    const field = frame.current?.querySelector("input");
    const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    if (field && document.activeElement === field && !touch) return;
    list.current?.focus({ preventScroll: true });
  }

  function onKey(event: KeyboardEvent<HTMLElement>, fromSearch: boolean) {
    if (disabled || event.defaultPrevented) return;
    const { key } = event;
    const command = event.ctrlKey || event.metaKey;
    const at = cursor ? nav.findIndex((option) => option.value === cursor.value) : -1;
    const page = Math.max(1, Math.floor((list.current?.clientHeight ?? 240) / 44) - 1);
    const move = (index: number) => {
      event.preventDefault();
      const target = nav[Math.min(nav.length - 1, Math.max(0, index))];
      if (!target) return;
      setActive(target.value);
      if (multiple && event.shiftKey) extendTo(target.value, cursor?.value ?? null);
      else ranging.current = false;
    };
    if (key === "ArrowDown") return move(at + 1);
    if (key === "ArrowUp") return move(at < 0 ? 0 : at - 1);
    if (key === "PageDown") return move(at + page);
    if (key === "PageUp") return move(at - page);
    if (!fromSearch && key === "Home") return move(0);
    if (!fromSearch && key === "End") return move(nav.length - 1);
    if (key === "Enter" || (!fromSearch && key === " ")) {
      event.preventDefault();
      if (!cursor) return;
      if (multiple && event.shiftKey && key === " ") extendTo(cursor.value, anchor.current);
      else activate(cursor);
      return;
    }
    // In the search field Control A selects its text, until there is none.
    if ((!fromSearch || !query) && multiple && command && key.toLowerCase() === "a") {
      event.preventDefault();
      const all = [...new Set([...chosen, ...nav.map((option) => option.value)])];
      seed.current = all;
      ranging.current = false;
      write(all);
      return;
    }
    if (!fromSearch && key.length === 1 && !command && !event.altKey) {
      window.clearTimeout(typed.current.timer);
      typed.current.text += key;
      typed.current.timer = window.setTimeout(() => (typed.current.text = ""), 600);
      const hit = typeahead(nav, typed.current.text, at);
      const target = hit < 0 ? undefined : nav[hit];
      if (target) {
        event.preventDefault();
        setActive(target.value);
        ranging.current = false;
      }
    }
  }

  /** The press itself: the option becomes the cursor before the list takes the focus, so that taking it does not scroll to some other option from under the pointer (the click would be lost). */
  function onPress(option: ListboxOption, event: MouseEvent) {
    event.preventDefault();
    if (disabled || option.disabled) return;
    pressedFrom.current = (cursor ?? resting)?.value ?? null;
    setActive(option.value);
    focusFromPress();
  }

  function onPick(option: ListboxOption, event: MouseEvent) {
    const from = pressedFrom.current ?? cursor?.value ?? null;
    pressedFrom.current = null;
    if (disabled || option.disabled) return;
    setActive(option.value);
    if (multiple && event.shiftKey) extendTo(option.value, anchor.current ?? from);
    else activate(option);
  }

  const holding = (part: "field" | "list") => ({
    onFocus: () => setFocus(part),
    onBlur: () => {
      setFocus(null);
      ranging.current = false;
    },
  });
  const results = visible.length;

  return (
    <div
      ref={frame}
      data-slot="listbox"
      data-mode={multiple ? "multiple" : "single"}
      data-disabled={disabled || undefined}
      className={cn(
        "flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[role=listbox]:focus-visible]:border-ring has-[[role=listbox]:focus-visible]:ring-[3px] has-[[role=listbox]:focus-visible]:ring-ring/40",
        disabled && "opacity-50",
        className,
      )}
      {...rest}
    >
      {searchable ? (
        <div className="border-b border-border p-2">
          <SearchInput
            value={query}
            onValueChange={(next) => {
              setQuery(next);
              setActive(null);
              if (list.current) list.current.scrollTop = 0;
            }}
            disabled={disabled}
            placeholder={searchPlaceholder}
            aria-label={ariaLabel ? `Search ${ariaLabel}` : searchPlaceholder}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={focus === "field" ? cursorId : undefined}
            onKeyDown={(event) => onKey(event, true)}
            {...holding("field")}
          />
        </div>
      ) : null}

      <div
        ref={list}
        id={listId}
        role="listbox"
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-multiselectable={multiple || undefined}
        aria-disabled={disabled || undefined}
        aria-activedescendant={focus === "list" ? cursorId : undefined}
        tabIndex={searchable || disabled ? -1 : 0}
        hidden={results === 0}
        onKeyDown={(event) => onKey(event, false)}
        {...holding("list")}
        style={{ maxHeight: height }}
        className="relative overflow-y-auto overscroll-contain bg-card outline-none [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]"
      >
        {groups.map((group, groupIndex) => {
          const headingId = `${id}-group-${groupIndex}`;
          return (
            <div key={group.label ?? "options"} role={group.label ? "group" : "presentation"} aria-labelledby={group.label ? headingId : undefined}>
              {group.label ? (
                <div
                  id={headingId}
                  aria-hidden="true"
                  data-slot="listbox-heading"
                  // A heading is not something to press: it leaves the focus where it is, and the list does not scroll to its cursor from under the pointer.
                  onMouseDown={(event) => event.preventDefault()}
                  className="sticky top-0 z-10 flex h-8 items-center border-b border-border bg-card px-3 text-xs font-medium text-muted-foreground"
                >
                  {group.label}
                </div>
              ) : null}
              {group.options.map((option) => {
                const selected = chosen.includes(option.value);
                const off = disabled || option.disabled;
                // A list that is off is dimmed as a whole; only an option that is off in a list that is on is dimmed by itself.
                const dim = option.disabled && !disabled;
                return (
                  <div
                    key={option.value}
                    id={ids.get(option.value)}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={off || undefined}
                    data-slot="listbox-option"
                    data-selected={selected ? "" : undefined}
                    data-active={focused && option.value === cursorValue ? "" : undefined}
                    onMouseDown={(event) => onPress(option, event)}
                    onClick={(event) => onPick(option, event)}
                    className={OPTION}
                  >
                    {option.icon ? (
                      <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground [&_svg]:size-4", dim && "opacity-50")}>
                        {option.icon}
                      </span>
                    ) : null}
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className={cn("truncate text-sm leading-5", selected && "font-medium", dim && "opacity-50")}>
                        <Marked text={option.label} query={query} />
                      </span>
                      {option.description ? (
                        <span className="truncate text-xs leading-4 text-muted-foreground">
                          <Marked text={option.description} query={query} />
                        </span>
                      ) : null}
                    </span>
                    <IconCheck aria-hidden="true" className={cn("size-4 shrink-0 transition-opacity duration-100 motion-reduce:transition-none", selected ? (dim ? "opacity-50" : "opacity-100") : "opacity-0")} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {results === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage ?? (query ? `No matches for “${query}”` : "No matches")}</p> : null}

      {multiple ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <p role="status" aria-live="polite" className="tabular-nums">
            {chosen.length} selected
          </p>
        </div>
      ) : null}
      {searchable ? (
        <span role="status" aria-live="polite" className="sr-only">
          {query ? (results === 0 ? "No results" : `${results} ${results === 1 ? "result" : "results"}`) : ""}
        </span>
      ) : null}
      {name ? chosen.map((item) => <input key={item} type="hidden" name={name} value={item} disabled={disabled} />) : null}
    </div>
  );
}
