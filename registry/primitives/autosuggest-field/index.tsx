"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconSpinner } from "@rhs-ui/icons";
import { rankSuggestions, toSuggestion, type RankedSuggestion, type Suggestion } from "@rhs-ui/primitives/autosuggest-field/suggestions";
import { Input } from "@rhs-ui/primitives/input";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { Suggestion } from "@rhs-ui/primitives/autosuggest-field/suggestions";

export interface AutosuggestFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "role" | "list" | "children"> {
  /** The text in the field, when you control it. It is whatever is typed, or the suggestion that was chosen: never a choice made for the person. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change of the text, and when a suggestion fills it in. */
  onValueChange?: (value: string) => void;
  /** What can be suggested: texts, or `{ value, hint }` with a quiet word beside the text (a country beside a city). Ranked by the field. */
  options: readonly Suggestion[];
  /** Called with the text as it is typed, so a source of your own (a server, a search index) can answer with new `options`. Not called when a suggestion fills the field in. */
  onQueryChange?: (query: string) => void;
  /** The most suggestions shown. Default 6. */
  maxOptions?: number;
  /** What the panel says when the text matches nothing, for example "No suggestions: we will use what you typed." Without it the panel stays shut. */
  emptyHint?: ReactNode;
  /** Rank and narrow `options` by the text. Turn it off when your source has already done that. Default true. */
  filter?: boolean;
  /** An answer is on its way: a small spinner in the field, and a quiet line in the panel while there is nothing else to show. */
  loading?: boolean;
  /** What the panel says while `loading` and nothing is listed yet. Default "Searching...". */
  loadingHint?: ReactNode;
  /** Start with the panel open, for a preview, a test or a tour. It closes like any other. */
  defaultOpen?: boolean;
  /** Where the list opens: under the field and, when there is no room below, above it ("auto", the default); or always "bottom" or "top". */
  placement?: "auto" | "bottom" | "top";
}

/** The suggestion with the part that matched in bold. */
function Marked({ row }: { row: RankedSuggestion }) {
  if (!row.match) return row.value;
  const [from, to] = row.match;
  return (
    <>
      {row.value.slice(0, from)}
      <span className="font-semibold">{row.value.slice(from, to)}</span>
      {row.value.slice(to)}
    </>
  );
}

const count = (n: number) => `${n} ${n === 1 ? "suggestion" : "suggestions"} available`;

/**
 * A free-text field with suggestions: type a job title or a city and pick a
 * match, or keep exactly what you typed. Unlike a combobox it never forces a
 * choice. The value is whatever is in the field, and a suggestion is only a
 * shortcut that fills it in. Suggestions are ranked by what begins with the
 * text, then a word that begins with it, then what only contains it, with the
 * match in bold. ArrowDown opens the list, the arrow keys move a highlight,
 * Enter takes the highlighted suggestion or, with none highlighted, leaves the
 * text as it is (and the form around the field submits as usual), and Escape
 * closes the list and keeps the text. It follows the ARIA 1.2 combobox
 * pattern: the focus never leaves the input and the highlight is named by
 * aria-activedescendant. The number of suggestions is announced politely.
 * Hand it new `options` from `onQueryChange` and it works with a server as well.
 */
export function AutosuggestField({
  value,
  defaultValue = "",
  onValueChange,
  options,
  onQueryChange,
  maxOptions = 6,
  emptyHint,
  filter = true,
  loading = false,
  loadingHint = "Searching...",
  defaultOpen = false,
  placement = "auto",
  className,
  disabled,
  onBlur,
  onKeyDown,
  "aria-label": ariaLabel,
  "aria-describedby": describedBy,
  ...props
}: AutosuggestFieldProps) {
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

  const text = value ?? own;
  const typed = text.trim();
  const ranked = filter ? rankSuggestions(options, text, maxOptions) : options.slice(0, maxOptions).map((option): RankedSuggestion => ({ ...toSuggestion(option), match: null, tier: 0 }));
  // A single suggestion that says exactly what is typed has nothing to add. It is compared as written: "zurich" still gets "Zürich", because fixing the capitals and the accents is what a suggestion is for.
  const echo = typed !== "" && ranked.length === 1 && (ranked[0]?.value.trim() ?? "") === typed;
  const rows = echo ? [] : ranked;
  // New options can leave the highlight pointing past the end of the list: then nothing is highlighted, and aria-activedescendant never names a row that is not there.
  const active = highlight < rows.length ? highlight : -1;
  const showList = open && !disabled && rows.length > 0;
  const showHint = open && !disabled && rows.length === 0 && typed !== "" && !echo && (loading || emptyHint !== undefined);
  const visible = showList || showHint;

  // The number of suggestions is said when the panel opens and when typing changes it. What was said stays only while it is news.
  useEffect(() => {
    if (!visible) return;
    setSaid(showList ? count(rows.length) : loading ? "Searching" : "No suggestions");
  }, [visible, showList, rows.length, loading]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // The highlighted suggestion is kept in view when the list scrolls.
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

  function accept(index: number) {
    const row = rows[index];
    if (!row) return;
    write(row.value);
    setSaid(`${row.value} filled in`);
    close();
    input.current?.focus();
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "ArrowDown" || key === "ArrowUp") {
      // With nothing to suggest the arrows do what they always did in a text field.
      if (rows.length === 0) return;
      event.preventDefault();
      const last = rows.length - 1;
      if (!showList) {
        // A shut list opens on the first suggestion going down and on the last going up.
        setOpen(true);
        setActive(key === "ArrowDown" ? 0 : last);
        return;
      }
      // The highlight goes round: from the last suggestion back to the text, and from the text to the first.
      setActive(key === "ArrowDown" ? (active >= last ? -1 : active + 1) : active <= -1 ? last : active - 1);
    } else if (key === "Enter") {
      if (showList && active >= 0) {
        // Taking a suggestion must not also submit the form around the field.
        event.preventDefault();
        accept(active);
      } else {
        // Nothing highlighted: the text is what it is, and Enter does what it does in any text field.
        close();
      }
    } else if (key === "Escape" && visible) {
      event.preventDefault();
      close();
    }
  }

  return (
    <div data-slot="autosuggest-field" className={cn("w-full", className)}>
      <Popover
        open={visible}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        <PopoverAnchor asChild>
          <div ref={anchor} className="relative w-full">
            <Input
              ref={input}
              type="text"
              role="combobox"
              aria-expanded={showList}
              aria-controls={showList ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
              aria-describedby={[describedBy, helpId].filter(Boolean).join(" ")}
              aria-label={ariaLabel}
              aria-busy={loading || undefined}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={disabled}
              {...props}
              value={text}
              onChange={(event) => {
                const next = event.target.value;
                write(next);
                onQueryChange?.(next);
                setActive(-1);
                // An emptied field has no suggestions to offer until someone asks with an arrow.
                setOpen(next.trim() !== "");
              }}
              onBlur={(event) => {
                onBlur?.(event);
                close();
              }}
              onKeyDown={keyDown}
              className={cn(loading && "pr-9")}
            />
            {loading ? <IconSpinner aria-hidden="true" size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" /> : null}
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
          // While the panel is up (or still fading out) it hears Escape before the field does, and the answer is the same.
          onEscapeKeyDown={(event) => {
            event.preventDefault();
            close();
          }}
          // A press on a suggestion would move the focus out of the field and close the panel before the click lands.
          onMouseDown={(event) => event.preventDefault()}
        >
          {showList ? (
            <ul id={listId} role="listbox" aria-label={ariaLabel ? `${ariaLabel}, suggestions` : "Suggestions"} className="relative max-h-72 overflow-y-auto">
              {rows.map((row, index) => (
                <li
                  key={`${row.value}-${index}`}
                  id={optionId(index)}
                  role="option"
                  aria-selected={active === index}
                  data-active={active === index || undefined}
                  onMouseMove={() => setActive(index)}
                  onClick={() => accept(index)}
                  className="flex min-h-9 cursor-default items-baseline justify-between gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-100 motion-reduce:transition-none data-[active]:bg-muted"
                >
                  <span className="min-w-0 truncate">
                    <Marked row={row} />
                  </span>
                  {row.hint ? <span className="shrink-0 text-xs text-muted-foreground">{row.hint}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2.5 py-2.5 text-sm text-muted-foreground">{loading ? loadingHint : emptyHint}</p>
          )}
        </PopoverContent>
      </Popover>
      <span id={helpId} className="sr-only">
        Suggestions appear as you type. Use the up and down arrow keys to review them and Enter to fill one in. You can also keep what you typed.
      </span>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
