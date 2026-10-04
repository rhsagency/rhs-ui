"use client";

import { useEffect, useState } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface SearchTriggerProps {
  /** Open your command palette or search dialog. */
  onOpen: () => void;
  placeholder?: string;
  /** The letter for the shortcut with Ctrl or Cmd. */
  shortcutKey?: string;
  className?: string;
}

/**
 * The search field in a header that is really a button: it opens your
 * command palette, shows the right shortcut for the platform (⌘K on a Mac,
 * Ctrl K elsewhere, worked out after load so the server and browser agree),
 * and listens for that shortcut anywhere on the page.
 */
export function SearchTrigger({ onOpen, placeholder = "Search…", shortcutKey = "k", className }: SearchTriggerProps) {
  const [mac, setMac] = useState<boolean | null>(null);
  useEffect(() => {
    setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === shortcutKey.toLowerCase()) {
        event.preventDefault();
        onOpen();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen, shortcutKey]);
  const mod = mac ? "⌘" : "Ctrl";
  return (
    <button type="button" data-slot="search-trigger" onClick={onOpen} aria-keyshortcuts={`${mac ? "Meta" : "Control"}+${shortcutKey.toUpperCase()}`} className={cn("inline-flex h-9 w-full max-w-64 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
      <IconSearch aria-hidden="true" className="size-4 shrink-0" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <KbdGroup className={cn("hidden transition-opacity sm:inline-flex", mac === null && "opacity-0")}><Kbd>{mod}</Kbd><Kbd>{shortcutKey.toUpperCase()}</Kbd></KbdGroup>
    </button>
  );
}
