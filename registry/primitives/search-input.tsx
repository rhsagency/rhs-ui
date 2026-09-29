"use client";

import { useRef, useState, type ComponentProps } from "react";

import { IconClose, IconSearch } from "@rhs-ui/icons";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends Omit<ComponentProps<"input">, "type" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** A key hint shown while the field is empty, e.g. "/" or "⌘K". Display only: bind the key yourself. */
  shortcut?: string;
}

/**
 * A search field: magnifier in front, a clear button once there is text, and
 * Escape clears it too. Type "search" so browsers and screen readers know it.
 * Give it a label, visible or as aria-label.
 */
export function SearchInput({ value, defaultValue = "", onValueChange, shortcut, className, onKeyDown, ...props }: SearchInputProps) {
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const input = useRef<HTMLInputElement>(null);
  const set = (next: string) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  return (
    <div data-slot="search-input" className={cn("relative flex h-9 w-full min-w-0 items-center", className)}>
      <IconSearch size={16} className="pointer-events-none absolute left-3 text-muted-foreground" />
      <input
        ref={input}
        type="search"
        value={current}
        onChange={(event) => set(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && current) {
            event.preventDefault();
            set("");
          }
          onKeyDown?.(event);
        }}
        className="h-full w-full min-w-0 rounded-md border border-input bg-background pr-9 pl-9 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:appearance-none"
        {...props}
      />
      {current ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            set("");
            input.current?.focus();
          }}
          className="absolute right-1.5 grid size-6 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          <IconClose size={14} />
        </button>
      ) : shortcut ? (
        <Kbd className="pointer-events-none absolute right-2">{shortcut}</Kbd>
      ) : null}
    </div>
  );
}
