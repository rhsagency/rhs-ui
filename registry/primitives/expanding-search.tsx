"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";

import { IconClose, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface ExpandingSearchSuggestion {
  /** The text that goes into the field, and to `onSubmit`, when the row is chosen. */
  value: string;
  /** A muted note at the end of the row: a count, a category. */
  hint?: string;
}

/** The words the component says on its own, for another language or your own wording. */
export interface ExpandingSearchLabels {
  /** The name of the button that opens the field. Default "Search". */
  search: string;
  /** The name of the button that folds it back. Default "Close search". */
  close: string;
  /** The name of the list of suggestions, when `suggestionsLabel` is not set. Default "Suggestions". */
  suggestions: string;
}

export interface ExpandingSearchProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange" | "onSubmit"> {
  /** The text in the field, when you control it. */
  value?: string;
  /** The text to start with, when you do not. */
  defaultValue?: string;
  /** Called on every change of the text. */
  onValueChange?: (value: string) => void;
  /** Called with the text on Enter, and with the value of a suggestion that was chosen. */
  onSubmit?: (value: string) => void;
  /** Rows under the field while it has focus: recent searches when it is empty, matches while someone types. Arrow keys move through them, Enter picks. Filter them yourself. */
  suggestions?: readonly (string | ExpandingSearchSuggestion)[];
  /** A short line above the suggestions ("Recent searches"). It names the list for assistive technology as well. */
  suggestionsLabel?: string;
  /** Show or hide the suggestions yourself, whatever has focus: for a preview, or when you decide when they show. Leave it out and they show while the field has focus, until one is chosen. */
  listOpen?: boolean;
  /** How wide the field grows on a screen wider than a phone: a number of px, or any CSS length. On a phone it covers the whole bar. Default "20rem". */
  expandedWidth?: number | string;
  /** A key that opens the field from anywhere on the page, outside other fields: "/" or "mod+k" (mod is Cmd on a Mac, Ctrl elsewhere). */
  shortcut?: string;
  /** The placeholder of the field. Default "Search". */
  placeholder?: string;
  /** Whether the field is open, when you control it. */
  open?: boolean;
  /** Whether it starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called when it opens or folds. */
  onOpenChange?: (open: boolean) => void;
  /** Focus the field when the component mounts open, for a search that is the point of the page. */
  autoFocus?: boolean;
  /** Which edge of its slot it stays on while it grows: `end` (the default) grows towards the start, over the links beside it. */
  align?: "start" | "end";
  /** The words of the buttons and the list. */
  labels?: Partial<ExpandingSearchLabels>;
}

const WORDS: ExpandingSearchLabels = { search: "Search", close: "Close search", suggestions: "Suggestions" };

const EDITABLE = "input, textarea, select, [contenteditable=''], [contenteditable='true']";

/** Whether a key press is the shortcut: "/" , "mod+k", "alt+shift+s". A bare key is left alone while someone is typing in a field. */
function isShortcut(event: globalThis.KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split("+").map((part) => part.trim());
  const key = parts.pop() ?? "";
  const mods = new Set(parts);
  const mod = mods.has("mod");
  const meta = mods.has("meta") || mods.has("cmd");
  const control = mods.has("ctrl");
  const modifiers = mod || meta || control || mods.has("alt");
  if (event.key.toLowerCase() !== key || event.altKey !== mods.has("alt") || event.repeat) return false;
  if (mods.has("shift") && !event.shiftKey) return false;
  if (mod ? !(event.metaKey || event.ctrlKey) : event.metaKey !== meta || event.ctrlKey !== control) return false;
  // Typing a slash into a text field is typing, not a request to search.
  return modifiers || !(event.target instanceof Element && event.target.closest(EDITABLE));
}

const KEY_NAMES: Record<string, string> = { cmd: "Meta", meta: "Meta", ctrl: "Control", alt: "Alt", shift: "Shift" };

/** `aria-keyshortcuts` for the same text: "mod+k" is Control+K, or Meta+K on a Mac. */
function keyShortcuts(shortcut: string): string {
  const parts = shortcut.split("+").map((part) => part.trim());
  const key = parts.pop() ?? "";
  const spell = (mod: "Control" | "Meta") => [...parts.map((part) => (part.toLowerCase() === "mod" ? mod : (KEY_NAMES[part.toLowerCase()] ?? part))), key.length === 1 ? key.toUpperCase() : key].join("+");
  return parts.some((part) => part.toLowerCase() === "mod") ? `${spell("Control")} ${spell("Meta")}` : spell("Control");
}

/** The part of a suggestion that the person has typed, in bold. */
function Marked({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-transparent font-semibold text-foreground">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * Search for a header that has little spare room. At rest it is one icon button; pressing it, or the
 * shortcut, grows a field out of the same spot over the links beside it (200ms, instant under reduced
 * motion), focuses it, and shows a close button. On a phone the field covers the whole bar instead, so
 * give the header `relative`. Suggestions you pass appear under the field while it has focus and work as a
 * combobox: arrow keys move, Enter picks, the typed part is in bold. Escape folds it back and returns focus
 * to the icon; clicking away folds it only when it is empty, so a query is never thrown away, and a folded
 * field keeps its text, marked by a small dot on the icon. The button is named Search and says whether
 * it is expanded.
 */
export function ExpandingSearch({
  value,
  defaultValue = "",
  onValueChange,
  onSubmit,
  suggestions = [],
  suggestionsLabel,
  listOpen,
  expandedWidth = "20rem",
  shortcut,
  placeholder = "Search",
  open,
  defaultOpen = false,
  onOpenChange,
  autoFocus = false,
  align = "end",
  labels,
  className,
  ...props
}: ExpandingSearchProps) {
  const uid = useId();
  const fieldId = `${uid}-field`;
  const listId = `${uid}-list`;
  const words = { ...WORDS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const expanded = open ?? ownOpen;
  const [ownText, setOwnText] = useState(defaultValue);
  const text = value ?? ownText;
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  /** The list was closed by a choice and stays closed until the person types or comes back to the field. */
  const [listShut, setListShut] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  /** What to do with focus once the next open/close has been drawn: the field cannot take it while it is still inert. */
  const next = useRef<"field" | "icon" | null>(null);

  const rows: ExpandingSearchSuggestion[] = suggestions.map((item) => (typeof item === "string" ? { value: item } : item));
  const listed = expanded && (listOpen ?? (focused && !listShut)) && rows.length > 0;
  const activeIndex = active < rows.length ? active : -1;
  const width = typeof expandedWidth === "number" ? `${expandedWidth}px` : expandedWidth;

  const setOpen = (target: boolean) => {
    if (open === undefined) setOwnOpen(target);
    onOpenChange?.(target);
  };
  const setText = (target: string) => {
    if (value === undefined) setOwnText(target);
    onValueChange?.(target);
  };
  function show() {
    next.current = "field";
    setOpen(true);
  }
  function fold(restoreFocus: boolean) {
    next.current = restoreFocus ? "icon" : null;
    setActive(-1);
    setOpen(false);
  }
  function submit(target: string) {
    if (!target.trim()) return;
    if (target !== text) setText(target);
    setListShut(true);
    setActive(-1);
    onSubmit?.(target);
  }

  useEffect(() => {
    if (next.current === "field" && expanded) {
      input.current?.focus();
      next.current = null;
    } else if (next.current === "icon" && !expanded) {
      trigger.current?.focus();
      next.current = null;
    }
  }, [expanded]);

  useEffect(() => {
    if (autoFocus && expanded) input.current?.focus({ preventScroll: true });
    // Only on arrival: after that, focus moves because of what the person does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The shortcut opens the field from anywhere; pressed again while it is open, it does nothing.
  const toggleShortcut = useRef({ expanded, show });
  useEffect(() => {
    toggleShortcut.current = { expanded, show };
  });
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (!isShortcut(event, shortcut)) return;
      event.preventDefault();
      if (toggleShortcut.current.expanded) input.current?.focus();
      else toggleShortcut.current.show();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut]);

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!rows.length) return;
      event.preventDefault();
      setListShut(false);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((from) => (from < 0 || from >= rows.length ? (step === 1 ? 0 : rows.length - 1) : (from + step + rows.length) % rows.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = listed ? rows[activeIndex] : undefined;
      submit(picked ? picked.value : text);
    }
  }

  return (
    <div data-slot="expanding-search" data-state={expanded ? "open" : "closed"} className={cn("relative inline-flex size-9 shrink-0 max-sm:static", className)} {...props}>
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={words.search}
        aria-expanded={expanded}
        aria-controls={fieldId}
        aria-keyshortcuts={shortcut ? keyShortcuts(shortcut) : undefined}
        tabIndex={expanded ? -1 : undefined}
        onClick={() => (expanded ? fold(true) : show())}
        className={cn("relative", expanded && "pointer-events-none opacity-0")}
      >
        <IconSearch />
        {text && !expanded ? <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2 rounded-full bg-foreground ring-2 ring-background" /> : null}
      </Button>
      <div
        id={fieldId}
        inert={!expanded}
        style={{ "--es-width": expanded ? width : "2.25rem" } as CSSProperties}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          fold(true);
        }}
        onFocus={() => {
          setFocused(true);
          setListShut(false);
        }}
        onBlur={(event) => {
          // Moving between the field and the close button is not leaving.
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setFocused(false);
          // Leaving an empty field folds it; a query stays open. Switching windows is not leaving either.
          if (text === "" && document.hasFocus()) fold(false);
        }}
        className={cn(
          "absolute top-0 flex flex-col",
          // The one that has focus is above its neighbours, so its list is never covered by another field.
          focused ? "z-40" : "z-20",
          align === "end" ? "right-0" : "left-0",
          // Wider than a phone: the width grows from the size of the icon. A phone: the layer is the whole bar, and its cover is wiped in from the icon's edge.
          "sm:w-(--es-width) max-sm:inset-0 motion-safe:sm:transition-[width,opacity] motion-safe:sm:duration-200 motion-safe:sm:ease-out motion-safe:max-sm:transition-opacity motion-safe:max-sm:duration-200",
          !expanded && "pointer-events-none opacity-0",
        )}
      >
        {/* The cover is only a box on a phone, where it hides the bar under the field. The list below stays outside it, so the clip does not cut it off. */}
        <div
          className={cn(
            "sm:contents max-sm:flex max-sm:h-full max-sm:items-center max-sm:bg-background max-sm:px-3 motion-safe:max-sm:transition-[clip-path] motion-safe:max-sm:duration-200 motion-safe:max-sm:ease-out",
            expanded ? "max-sm:[clip-path:inset(0)]" : align === "end" ? "max-sm:[clip-path:inset(0_0_0_100%)]" : "max-sm:[clip-path:inset(0_100%_0_0)]",
          )}
        >
          <div
            // A press on the icon or the padding belongs to the field: focus goes to the input instead of leaving.
            onMouseDown={(event) => {
              if (event.target === input.current || (event.target instanceof Element && event.target.closest("button"))) return;
              event.preventDefault();
              input.current?.focus();
            }}
            className="flex h-9 min-w-0 items-center overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 max-sm:h-10 max-sm:flex-1 max-sm:rounded-lg motion-reduce:transition-none"
          >
            <IconSearch aria-hidden="true" className="ml-3 size-4 shrink-0 text-muted-foreground" />
            <input
              ref={input}
              type="search"
              role="combobox"
              enterKeyHint="search"
              autoComplete="off"
              aria-label={placeholder}
              aria-expanded={listed}
              aria-controls={listed ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={listed && activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined}
              placeholder={placeholder}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setActive(-1);
                setListShut(false);
              }}
              onKeyDown={onInputKeyDown}
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none"
            />
            <Kbd aria-hidden="true" className="mr-1 shrink-0 max-sm:hidden">
              Esc
            </Kbd>
            <button
              type="button"
              aria-label={words.close}
              onClick={() => fold(true)}
              className="mr-1 grid size-7 shrink-0 place-items-center rounded text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none max-sm:mr-1.5"
            >
              <IconClose size={14} />
            </button>
          </div>
        </div>
        {listed ? (
          <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-sm max-sm:mt-0 max-sm:rounded-none max-sm:border-x-0">
            {suggestionsLabel ? <p className="px-3 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">{suggestionsLabel}</p> : null}
            <ul role="listbox" id={listId} aria-label={suggestionsLabel ?? words.suggestions} className="relative m-0 max-h-72 list-none overflow-y-auto p-1">
              {rows.map((row, i) => (
                <li
                  key={`${i}-${row.value}`}
                  role="option"
                  id={`${uid}-option-${i}`}
                  aria-selected={i === activeIndex}
                  // The field keeps focus while a row is pressed, so choosing never counts as leaving it.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => setActive(i)}
                  onClick={() => submit(row.value)}
                  className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm aria-selected:bg-muted"
                >
                  <IconSearch aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    <Marked text={row.value} query={text} />
                  </span>
                  {row.hint ? <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{row.hint}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
