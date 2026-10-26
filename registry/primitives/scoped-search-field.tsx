"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconClose, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

/** One place to search: Docs, People, Files. */
export interface SearchScope {
  /** What `scope`, `onScopeChange` and `onSearch` speak: "docs", "people". */
  value: string;
  /** What the menu shows and the live region says: "People". */
  label: string;
  /** What the empty field shows while this scope is chosen: "Search people by name or email". Without it the field says "Search" and the label in lower case. */
  placeholder?: string;
  /** The glyph the menu shrinks to when the field is narrow. Without one, the first letter of the label in a small chip, so the scope can still be told apart. */
  icon?: ReactNode;
}

export interface ScopedSearchFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "placeholder" | "role"> {
  /** The places that can be searched, in the order of the menu. The first is chosen at the start. */
  scopes: readonly SearchScope[];
  /** The chosen scope, as its `value`, when you control it. */
  scope?: string;
  /** The scope to start with, when you do not control it. */
  defaultScope?: string;
  /** Called with the `value` of the scope that was chosen. The query stays as it is. */
  onScopeChange?: (scope: string) => void;
  /** The text in the field, when you control it. */
  query?: string;
  /** The text to start with, when you do not control it. */
  defaultQuery?: string;
  /** Called on every change of the text. */
  onQueryChange?: (query: string) => void;
  /** Called with the text and the scope when Enter is pressed in the field. Nothing is called for an empty field unless `allowEmpty` is set. */
  onSearch?: (query: string, scope: string) => void;
  /** A key hint shown while the field is empty, e.g. "/" or "⌘K". Display only: bind the key yourself. */
  shortcut?: string;
  /** Let Enter search for nothing, for a scope where an empty query means "show everything". Default false. */
  allowEmpty?: boolean;
  /** The start of the menu's accessible name, which always ends in the chosen scope: "Search in People". Default "Search in". */
  scopeLabel?: string;
  /** The name of a hidden input that carries the chosen scope, so a plain form submit sends it along with the text (`name` is the text's). */
  scopeName?: string;
}

// The group takes the focus ring when its input has focus; the menu is a button, so it asks for the same ring.
const RING_ON_MENU = "has-[[data-slot=select-trigger]:focus-visible]:border-ring has-[[data-slot=select-trigger]:focus-visible]:ring-[3px] has-[[data-slot=select-trigger]:focus-visible]:ring-ring/40";

/** The first letter of a label, for the menu of a narrow field when its scope has no icon. */
const initialOf = (label: string) => Array.from(label.trim())[0] ?? "";

/**
 * A search box with the place to search attached to it, for a product that has
 * more than one: Docs, People, Files. The scope is a menu on the left of the
 * field (the house select, never the browser's), and the empty field says what
 * it will search ("Search people by name or email"), so nobody types a
 * colleague's name into the documents. Changing the scope keeps the text and
 * tells a screen reader "Searching in People" in a polite live region, and a
 * scope chosen from the open menu hands the focus on to the field, ready to
 * type. Enter calls `onSearch(query, scope)`;
 * Escape clears the text, and a second Escape leaves the field. The field
 * answers to the width it is given and not the screen: below 20rem the menu
 * shrinks to the scope's icon (the first letter of its label when it has none),
 * with the scope still in its accessible name, and the shortcut hint goes. That
 * suits a narrow sidebar or toolbar, while a field as wide as a phone keeps the
 * name of its scope in view.
 */
export function ScopedSearchField({
  scopes,
  scope,
  defaultScope,
  onScopeChange,
  query,
  defaultQuery = "",
  onQueryChange,
  onSearch,
  shortcut,
  allowEmpty = false,
  scopeLabel = "Search in",
  scopeName,
  className,
  disabled,
  onKeyDown,
  ref,
  "aria-label": ariaLabel,
  ...props
}: ScopedSearchFieldProps) {
  const [ownScope, setOwnScope] = useState(defaultScope ?? scopes[0]?.value ?? "");
  const [ownQuery, setOwnQuery] = useState(defaultQuery);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement | null>(null);
  // A scope that was just chosen from the menu hands the focus on to the text; one that was dismissed gives it back to the menu.
  const picked = useRef(false);
  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const chosen = scope ?? ownScope;
  const current = scopes.find((item) => item.value === chosen) ?? scopes[0];
  const text = query ?? ownQuery;
  const placeholder = current?.placeholder ?? `Search ${(current?.label ?? "").toLowerCase()}`.trim();

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function write(next: string) {
    if (query === undefined) setOwnQuery(next);
    onQueryChange?.(next);
  }

  function pick(next: string) {
    picked.current = true;
    if (scope === undefined) setOwnScope(next);
    onScopeChange?.(next);
    setSaid(`Searching in ${scopes.find((item) => item.value === next)?.label ?? next}`);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      const typed = text.trim();
      if (typed || allowEmpty) onSearch?.(typed, current?.value ?? "");
    } else if (event.key === "Escape") {
      // The first Escape empties the field, the second leaves it.
      if (text) {
        event.preventDefault();
        write("");
      } else {
        event.currentTarget.blur();
      }
    }
  }

  return (
    <div data-slot="scoped-search-field" className={cn("@container w-full", className)}>
      <InputGroup className={RING_ON_MENU}>
        <Select value={current?.value} onValueChange={pick} disabled={disabled}>
          <SelectTrigger
            aria-label={`${scopeLabel} ${current?.label ?? ""}`.trim()}
            className="h-full w-auto shrink-0 gap-1.5 rounded-none rounded-l-[inherit] border-0 border-r border-border bg-muted/50 pr-2 pl-3 font-medium text-foreground shadow-none transition-colors duration-150 motion-reduce:transition-none hover:bg-muted focus-visible:border-border focus-visible:bg-muted focus-visible:ring-0 data-[size=default]:h-full @max-xs:pl-2.5"
          >
            {/* An icon and a chip take the same 20px square, so fields whose scopes differ in that still line up. */}
            <span aria-hidden="true" className="hidden size-5 place-items-center text-muted-foreground @max-xs:grid [&_svg]:size-4">
              {current?.icon ?? (
                <span className="grid size-5 place-items-center rounded-md border border-border bg-background text-[0.6875rem] leading-none font-semibold text-foreground uppercase">{initialOf(current?.label ?? "")}</span>
              )}
            </span>
            {/* SelectValue takes no className (its text is portaled in), so the wrapper is what shrinks away on a narrow field. */}
            <span className="min-w-0 truncate @max-xs:sr-only">
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent
            align="start"
            onCloseAutoFocus={(event) => {
              if (picked.current) {
                event.preventDefault();
                input.current?.focus();
              }
              picked.current = false;
            }}
          >
            {scopes.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputGroupAddon className="pr-0">
          <IconSearch />
        </InputGroupAddon>
        <InputGroupInput
          ref={attach}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          disabled={disabled}
          {...props}
          aria-label={ariaLabel ?? placeholder}
          placeholder={placeholder}
          value={text}
          onChange={(event) => write(event.target.value)}
          onKeyDown={keyDown}
          className="px-2.5 text-ellipsis [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
        />
        {text ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear search"
            disabled={disabled}
            onClick={() => {
              write("");
              input.current?.focus();
            }}
            className="mr-1 size-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <IconClose />
          </Button>
        ) : shortcut ? (
          <Kbd className="mr-2.5 @max-xs:hidden">{shortcut}</Kbd>
        ) : null}
      </InputGroup>
      <span role="status" className="sr-only">
        {said}
      </span>
      {scopeName ? <input type="hidden" name={scopeName} value={current?.value ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
