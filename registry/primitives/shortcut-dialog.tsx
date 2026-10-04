"use client";

import { useEffect, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@rhs-ui/primitives/dialog";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";

export interface ShortcutGroup {
  title: string;
  shortcuts: readonly { keys: readonly string[]; label: string }[];
}

export interface ShortcutDialogProps {
  groups: readonly ShortcutGroup[];
  /** Open it from your own button too. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The "?" cheat sheet every keyboard-heavy app needs: press ? anywhere (not
 * while typing in a field) and a dialog lists the shortcuts in groups, each
 * key a real kbd element. Controlled or not, as you like.
 */
export function ShortcutDialog({ groups, open, onOpenChange }: ShortcutDialogProps) {
  const [own, setOwn] = useState(false);
  const isOpen = open ?? own;
  const setOpen = (value: boolean) => (onOpenChange ? onOpenChange(value) : setOwn(value));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== "?" || target?.closest("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      if (onOpenChange) onOpenChange(true);
      else setOwn(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Press ? anywhere to see this again.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-medium tracking-[.1em] text-muted-foreground uppercase">{group.title}</h3>
              <dl className="mt-2 grid gap-2">
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.label} className="flex items-center justify-between gap-4 text-sm">
                    <dt>{shortcut.label}</dt>
                    <dd><KbdGroup>{shortcut.keys.map((key) => <Kbd key={key}>{key}</Kbd>)}</KbdGroup></dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
