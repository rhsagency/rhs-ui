"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Drawer } from "@rhs-ui/primitives/drawer";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface ActionSheetAction {
  /** What it does, in a few words: "Take a photo". It is the name of the row. */
  label: string;
  /** A glyph for the row, as an element: `<IconCamera />`. It is decoration, the label is the name. */
  icon?: ReactNode;
  /** Called when the row is chosen. The sheet closes right after. */
  onSelect?: () => void;
  /** Draws the row in the destructive colour and moves it to the end of the list, so it is never the row nearest the thumb by accident. */
  destructive?: boolean;
  /** Greys the row out. It stays reachable by keyboard so that its description can say why, but it does nothing. */
  disabled?: boolean;
  /** A second line under the label: what happens, or why the row is off. */
  description?: string;
}

export interface ActionSheetProps {
  /** What the choice is about: "Profile photo". Required: it names the sheet and the list. */
  title: string;
  /** One line under the title with more context: "Choose what happens to this photo". */
  message?: string;
  /** The choices, in order. Destructive ones are moved to the end. Keep it to a handful: past about seven a list or a menu is the better tool. */
  actions: readonly ActionSheetAction[];
  /** The text of the button that closes the sheet without choosing, which sits apart on its own surface. Default "Cancel". */
  cancelLabel?: string;
  /** The element that opens the sheet, usually a Button: focus goes back to it on close. */
  trigger?: ReactElement;
  /** Whether it is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes: a row, Cancel, Escape, the backdrop or a drag down. */
  onOpenChange?: (open: boolean) => void;
  /** The viewport width in px from which it is a narrow centred dialog instead of a sheet from the bottom edge. A screen under 560px tall, such as a phone held sideways, keeps the sheet whatever its width. Default 640. */
  breakpoint?: number;
  /** Classes for the list's surface. */
  className?: string;
}

/** Whether a media query matches. The server and the first browser render say no; the real answer arrives right after. */
function useMedia(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** How long a typed letter waits for the next one before the search starts over. */
const TYPEAHEAD_MS = 700;

/** The height in px under which the dialog gives way to the sheet whatever the width: a dialog needs room for its header, a few rows and the Cancel. */
const MIN_HEIGHT = 560;

/** What the drawer's body leaves for the list and the Cancel: the screen up to 88%, less the handle, the title, a line of message and the paddings (a safe area as well). */
const IN_DRAWER = "max-h-[calc(88dvh_-_8.75rem_-_env(safe-area-inset-bottom))]";

interface MenuProps {
  title: string;
  actions: readonly ActionSheetAction[];
  cancelLabel: string;
  className?: string;
  /** Classes for the list and the Cancel together: a cap on their height where the surroundings do not give one. */
  frameClassName?: string;
  onChoose: (action: ActionSheetAction) => void;
  onCancel: () => void;
}

/** The list and the Cancel under it: a menu of 52px rows for a thumb, a single tab stop with the arrow keys moving inside it. The rows scroll when the screen is too short for them; the Cancel stays in view. */
function ActionMenu({ title, actions, cancelLabel, className, frameClassName, onChoose, onCancel }: MenuProps) {
  // Destructive rows last, otherwise in the order given.
  const rows = [...actions.filter((action) => !action.destructive), ...actions.filter((action) => action.destructive)];
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const typed = useRef({ text: "", timer: 0 });

  // The first row has focus when the sheet opens, whatever Radix picked first (the grab handle, for the drawer).
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => items.current[0]?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  function move(to: number) {
    const next = (to + rows.length) % rows.length;
    setActive(next);
    items.current[next]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "ArrowDown") move(active + 1);
    else if (event.key === "ArrowUp") move(active - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(rows.length - 1);
    else if (event.key.length === 1 && event.key !== " ") {
      // Type to jump: the letters typed in a row make a prefix; the same letter again steps through the rows that start with it.
      window.clearTimeout(typed.current.timer);
      typed.current.text += event.key.toLowerCase();
      typed.current.timer = window.setTimeout(() => {
        typed.current.text = "";
      }, TYPEAHEAD_MS);
      const buffer = typed.current.text;
      const repeated = buffer.length > 1 && [...buffer].every((letter) => letter === buffer[0]);
      const needle = repeated ? buffer.slice(0, 1) : buffer;
      // One letter, or the same letter again, goes on to the next row that starts with it; a longer prefix keeps the current row if it still fits.
      const offset = buffer.length === 1 || repeated ? 1 : 0;
      for (let step = 0; step < rows.length; step += 1) {
        const index = (active + offset + step) % rows.length;
        if (rows[index]?.label.toLowerCase().startsWith(needle)) {
          move(index);
          break;
        }
      }
    } else return;
    event.preventDefault();
  }

  return (
    <div data-slot="action-sheet" className={cn("flex min-h-0 flex-col gap-3", frameClassName)}>
      <div
        role="menu"
        aria-label={title}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
        className={cn("relative min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]", className)}
      >
        {rows.map((action, index) => (
          <button
            key={`${index}-${action.label}`}
            ref={(node) => {
              items.current[index] = node;
            }}
            type="button"
            role="menuitem"
            tabIndex={index === active ? 0 : -1}
            aria-disabled={action.disabled || undefined}
            data-destructive={action.destructive || undefined}
            onFocus={() => setActive(index)}
            onClick={() => {
              if (!action.disabled) onChoose(action);
            }}
            className={cn(
              "flex min-h-[3.25rem] w-full items-center gap-3.5 px-4 py-2 text-left text-base outline-none",
              index > 0 && "border-t border-border",
              "transition-colors duration-150 motion-reduce:transition-none",
              "hover:bg-muted/60 active:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
              "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent",
              action.destructive ? "text-destructive" : "text-foreground",
            )}
          >
            {action.icon ? (
              <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[1.125rem]", action.destructive ? "bg-destructive/10" : "bg-muted")}>
                {action.icon}
              </span>
            ) : null}
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="font-medium">{action.label}</span>
              {action.description ? <span className="text-sm leading-snug font-normal text-muted-foreground">{action.description}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {/* Its own surface, apart from the list, at the same height as a row: the one target that can always be hit. */}
      <Button type="button" variant="outline" onClick={onCancel} className="h-[3.25rem] w-full shrink-0 rounded-xl bg-card text-base font-semibold">
        {cancelLabel}
      </Button>
    </div>
  );
}

/**
 * The mobile choice for a handful of related actions, such as photo options or what to do with a post: a sheet that
 * rises from the bottom edge with a title, rows tall enough for a thumb, a destructive row drawn in red and moved to
 * the end, and a Cancel apart from the list on its own surface. It is built on the Drawer, so dragging the handle down
 * or tapping the backdrop dismisses it and the safe-area inset is kept clear. For assistive technology the list is a
 * menu: one tab stop, the arrow keys, Home and End move between rows, typing jumps to a row, and a disabled row can be
 * reached so its description can say why. From 640px wide, and at least 560px tall, it becomes a narrow centred dialog
 * with the same list. In both the rows scroll when the screen is too short for them, and the Cancel stays in view.
 */
export function ActionSheet({ title, message, actions, cancelLabel = "Cancel", trigger, open, defaultOpen = false, onOpenChange, breakpoint = 640, className }: ActionSheetProps) {
  // A phone held sideways is wide but short: it keeps the sheet, which is the shape a thumb expects there.
  const wide = useMedia(`(min-width: ${breakpoint}px) and (min-height: ${MIN_HEIGHT}px)`);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;

  const change = (next: boolean) => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  const menu = (frameClassName?: string) => (
    <ActionMenu
      title={title}
      actions={actions}
      cancelLabel={cancelLabel}
      className={className}
      frameClassName={frameClassName}
      onChoose={(action) => {
        action.onSelect?.();
        change(false);
      }}
      onCancel={() => change(false)}
    />
  );

  if (wide) {
    return (
      <Dialog open={isOpen} onOpenChange={change}>
        {trigger ? <DialogTrigger {...AS_CHILD}>{trigger}</DialogTrigger> : null}
        {/* Never taller than the screen: the header keeps its height and the list gives way, so the Cancel is always on it. */}
        <DialogContent showCloseButton={false} className="flex max-h-[calc(100dvh-2rem)] flex-col gap-4 p-5 sm:max-w-sm">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-lg tracking-[-0.02em]">{title}</DialogTitle>
            <DialogDescription className={message ? undefined : "sr-only"}>{message ?? title}</DialogDescription>
          </DialogHeader>
          {menu()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={change} trigger={trigger} title={title} description={message}>
      {/* The drawer shows a description only when there is a message; without one this keeps the dialog described. */}
      {message ? null : <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>}
      {menu(IN_DRAWER)}
    </Drawer>
  );
}
