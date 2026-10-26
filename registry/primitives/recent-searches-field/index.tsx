"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconClose, IconHistory, IconSearch, IconTrash } from "@rhs-ui/icons";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { forgetSearch, matchRecent, rememberSearch, tidySearch } from "@rhs-ui/primitives/recent-searches-field/recents";
import { cn } from "@/lib/utils";

export interface RecentSearchesFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "role" | "children"> {
  /** The recent searches, newest first. The field keeps nothing itself: store them where you like and hand them back. */
  recent: readonly string[];
  /** Called with the new list when a search runs (it moves to the top), when one is removed and when all are cleared. */
  onRecentChange?: (recent: string[]) => void;
  /** Called with the search when one runs: Enter on the text, or a recent search chosen from the list. */
  onSearch?: (query: string) => void;
  /** The most recent searches the list shows, and keeps when a new one is added. Default 6. */
  max?: number;
  /** What the field is called for assistive technology, and what it shows while it is empty unless you give a placeholder. Default "Search". */
  label?: string;
  /** The text in the field, when you control it. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change of the text. */
  onValueChange?: (value: string) => void;
  /** What the panel says while there is no history to list. Default "Your recent searches will show up here." */
  emptyText?: string;
  /** Start with the panel open, for a preview, a test or a tour. It closes like any other. */
  defaultOpen?: boolean;
  /** Where the panel opens: under the field and, when there is no room below, above it ("auto", the default); or always "bottom" or "top". */
  placement?: "auto" | "bottom" | "top";
}

/** The typed part of a recent search in bold, the rest as it is. */
function Marked({ text, matched }: { text: string; matched: number }) {
  if (matched <= 0) return text;
  return (
    <>
      <span className="font-semibold">{text.slice(0, matched)}</span>
      {text.slice(matched)}
    </>
  );
}

const plural = (count: number) => `${count} recent ${count === 1 ? "search" : "searches"}`;

/**
 * A search field that remembers. Focus it while it is empty and your recent
 * searches open under it, newest first, each with a button to remove it and a
 * Clear all at the end; type and the list narrows to the searches that begin
 * with what you typed, with the typed part in bold. It is the ARIA combobox
 * pattern: the focus never leaves the input, the arrow keys move a highlight
 * that is named by aria-activedescendant, Enter runs the highlighted search or
 * the text, Delete removes the highlighted one, and Escape closes the panel,
 * then clears the text, then leaves the field. A search that runs moves to the
 * top of the list. The field stores nothing: it hands you the new list and
 * you keep it in state, local storage or on a server. The count is announced
 * when the panel opens, and a field with no history shows one quiet line
 * instead of an empty box.
 */
export function RecentSearchesField({
  recent,
  onRecentChange,
  onSearch,
  max = 6,
  label = "Search",
  value,
  defaultValue = "",
  onValueChange,
  emptyText = "Your recent searches will show up here.",
  defaultOpen = false,
  placement = "auto",
  className,
  disabled,
  placeholder,
  onFocus,
  onBlur,
  onClick,
  onKeyDown,
  ref,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  ...props
}: RecentSearchesFieldProps) {
  const base = useId();
  const listId = `${base}-list`;
  const helpId = `${base}-help`;
  const optionId = (index: number) => `${base}-option-${index}`;
  const [own, setOwn] = useState(defaultValue);
  const [open, setOpen] = useState(defaultOpen);
  const [highlight, setActive] = useState(-1);
  const [said, setSaid] = useState("");
  const anchor = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to keep the focus where it belongs.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const text = value ?? own;
  const typed = tidySearch(text);
  const entries = matchRecent(recent, typed).slice(0, Math.max(1, max));
  // Clear all is the last row of the list, so the keyboard reaches it like any other; it only makes sense for the whole list, not for the matches of a few letters.
  const canClear = typed === "" && entries.length > 0;
  const rows = entries.length + (canClear ? 1 : 0);
  // A changed history can leave the highlight pointing past the end of the list: then nothing is highlighted, and aria-activedescendant never names a row that is not there.
  const active = highlight < rows ? highlight : -1;
  const showList = open && !disabled && rows > 0;
  const showEmpty = open && !disabled && typed === "" && recent.length === 0;
  const visible = showList || showEmpty;
  const count = entries.length;

  // The count is said when the panel opens and when typing narrows it. A removal says its own message, so the count that follows it is not said over it. What was said stays only while it is news: left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!visible) return;
    setSaid(showEmpty ? emptyText : typed ? `${count} matching ${count === 1 ? "search" : "searches"}` : plural(count));
  }, [visible, showEmpty, typed, emptyText]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // The highlighted row is kept in view when the list scrolls.
  useEffect(() => {
    if (active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function run(query: string) {
    const clean = tidySearch(query);
    if (!clean) return;
    write(clean);
    onSearch?.(clean);
    onRecentChange?.(rememberSearch(recent, clean, max));
    close();
  }

  function remove(entry: string) {
    onRecentChange?.(forgetSearch(recent, entry));
    setSaid(`Removed ${entry} from recent searches.`);
    // The highlight stays where it was, or falls back to the last row that is left.
    setActive((now) => Math.min(now, rows - 2));
  }

  function clearAll() {
    onRecentChange?.([]);
    setSaid("Recent searches cleared.");
    close();
  }

  function choose(index: number) {
    const entry = entries[index];
    if (entry) run(entry.text);
    else if (canClear && index === entries.length) clearAll();
  }

  /** Escape closes the panel; with the panel shut it clears the text; with no text it leaves the field. */
  function escape() {
    if (visible) {
      close();
    } else if (text) {
      // The text goes and the panel stays shut: it opens again when someone types, asks for it with an arrow, or comes back to the field.
      write("");
      close();
    } else {
      input.current?.blur();
    }
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      event.preventDefault();
      const last = rows - 1;
      if (!showList) {
        // A shut panel opens on the first row going down and on the last going up.
        setOpen(true);
        setActive(key === "ArrowDown" ? 0 : last);
        return;
      }
      // The highlight goes round: from the last row back to the text, and from the text to the first.
      setActive(key === "ArrowDown" ? (active >= last ? -1 : active + 1) : active <= -1 ? last : active - 1);
    } else if (key === "Enter") {
      if (showList && active >= 0) {
        // Choosing a row must not also submit the form around the field with the old text.
        event.preventDefault();
        choose(active);
      } else if (typed) {
        run(typed);
      }
    } else if (key === "Escape") {
      event.preventDefault();
      escape();
    } else if (key === "Delete" && showList && active >= 0 && entries[active]) {
      // Only while a row is highlighted: until then Delete edits the text.
      event.preventDefault();
      remove(entries[active].text);
    }
  }

  return (
    <div data-slot="recent-searches-field" className={cn("w-full", className)}>
      <Popover
        open={visible}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <PopoverAnchor asChild>
          <div ref={anchor} className="relative w-full">
            <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={attach}
              type="search"
              role="combobox"
              aria-expanded={showList}
              aria-controls={showList ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
              aria-describedby={[describedBy, helpId].filter(Boolean).join(" ")}
              aria-label={ariaLabel ?? label}
              autoComplete="off"
              enterKeyHint="search"
              disabled={disabled}
              placeholder={placeholder ?? label}
              {...props}
              value={text}
              onChange={(event) => {
                write(event.target.value);
                setOpen(true);
                setActive(-1);
              }}
              onFocus={(event) => {
                onFocus?.(event);
                setOpen(true);
              }}
              onBlur={(event) => {
                onBlur?.(event);
                close();
              }}
              onClick={(event) => {
                onClick?.(event);
                // After Escape the panel stays shut until someone asks for it again: a click does.
                setOpen(true);
              }}
              onKeyDown={keyDown}
              className={cn(fieldSurface, "h-9 w-full min-w-0 pr-9 pl-9 text-ellipsis placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none")}
            />
            {text && !disabled ? (
              <button
                type="button"
                aria-label="Clear search"
                // The focus stays in the field, so the panel does not close and open again under the pointer.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  write("");
                  setActive(-1);
                  setOpen(true);
                  input.current?.focus();
                }}
                className="absolute top-1/2 right-1.5 grid size-6 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors duration-150 motion-reduce:transition-none outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <IconClose size={14} />
              </button>
            ) : null}
          </div>
        </PopoverAnchor>
        <PopoverContent
          role="presentation"
          side={placement === "top" ? "top" : "bottom"}
          avoidCollisions={placement === "auto"}
          align="start"
          collisionPadding={8}
          className="w-(--radix-popover-trigger-width) min-w-0 p-1"
          // The focus stays in the field the whole time: the panel is read through aria-activedescendant, never entered.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchor.current?.contains(event.target as Node)) event.preventDefault();
          }}
          // While the panel is up (or still fading out) the panel hears Escape before the field does, so the field's own answer is given here too.
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            escape();
          }}
          // A press on a row would move the focus out of the field and close the panel before the click lands.
          onMouseDown={(event) => event.preventDefault()}
        >
          {showList ? (
            // The remove buttons are not in the listbox, which holds options and nothing else: they lie over the rows, one to a row, in a layer of their own.
            <div className="relative max-h-72 overflow-y-auto">
              <ul id={listId} role="listbox" aria-label="Recent searches">
                {entries.map((entry, index) => (
                  <li
                    key={`${entry.text}-${index}`}
                    id={optionId(index)}
                    role="option"
                    aria-selected={active === index}
                    data-active={active === index || undefined}
                    onMouseMove={() => setActive(index)}
                    onClick={() => choose(index)}
                    className="flex h-9 min-w-0 cursor-default items-center gap-2.5 rounded-md pr-10 pl-2.5 text-sm transition-colors duration-100 motion-reduce:transition-none data-[active]:bg-muted"
                  >
                    <IconHistory aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 truncate">
                      <Marked text={entry.text} matched={entry.matched} />
                    </span>
                  </li>
                ))}
                {canClear ? (
                  <li
                    id={optionId(entries.length)}
                    role="option"
                    aria-selected={active === entries.length}
                    data-active={active === entries.length || undefined}
                    onMouseMove={() => setActive(entries.length)}
                    onClick={clearAll}
                    className="relative mt-1.5 flex h-9 cursor-default items-center gap-2.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors duration-100 motion-reduce:transition-none before:absolute before:inset-x-0 before:-top-[3px] before:h-px before:bg-border data-[active]:bg-muted data-[active]:text-foreground"
                  >
                    <IconTrash aria-hidden="true" className="size-4 shrink-0" />
                    <span>
                      Clear all<span className="sr-only"> recent searches</span>
                    </span>
                  </li>
                ) : null}
              </ul>
              <div className="pointer-events-none absolute inset-x-0 top-0">
                {entries.map((entry, index) => (
                  <div key={`${entry.text}-${index}`} className="flex h-9 items-center justify-end pr-1">
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={`Remove ${entry.text} from recent searches`}
                      onClick={() => remove(entry.text)}
                      className="pointer-events-auto grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-100 motion-reduce:transition-none outline-none hover:bg-background hover:text-foreground"
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="px-3 py-3 text-sm text-muted-foreground">{emptyText}</p>
          )}
        </PopoverContent>
      </Popover>
      <span id={helpId} className="sr-only">
        Use the up and down arrow keys to move through your recent searches, Enter to search and Delete to remove one.
      </span>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
