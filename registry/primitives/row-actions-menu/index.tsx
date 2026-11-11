"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconMoreHorizontal } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { groupActions, type RowAction } from "@rhs-ui/primitives/row-actions-menu/actions";
import { cn } from "@/lib/utils";

export type { RowAction } from "@rhs-ui/primitives/row-actions-menu/actions";

/** The words the menu says on its own, for another language or your own wording. `{label}` is the name of the row, `{action}` the label of the action. */
export interface RowActionsLabels {
  /** The name of the trigger, so rows can be told apart. Default "Actions for {label}". */
  trigger: string;
  /** The question of the confirm popover. Default "{action} {label}?" */
  confirmTitle: string;
  /** The Cancel button of the confirm popover. Default "Cancel". */
  cancel: string;
}

export interface RowActionsMenuProps extends Omit<ComponentProps<"span">, "children" | "contextMenu"> {
  /** What the row is, in a few words: "Invoice 1042". It names the trigger ("Actions for Invoice 1042") and the question of a confirm ("Delete Invoice 1042?"). */
  label: string;
  /** The actions, in order. Give them a `group` to divide the menu with rules; put the destructive ones last. */
  actions: readonly RowAction[];
  /** Called with the `id` of the action that was chosen. A destructive action calls it only after the person has confirmed. When it removes the row, the button and the focus on it go too: move focus to the next row's button yourself (the demo shows how). */
  onAction?: (id: string) => void;
  /** Also open the menu on a right-click anywhere on the row, and on Shift+F10 or the Menu key while focus is in it. The row is the closest `tr`, `[role=row]` or `li`. A link or a field keeps the browser's own menu. */
  contextMenu?: boolean;
  /** The words the menu says, for translation. */
  labels?: Partial<RowActionsLabels>;
}

const DEFAULT_LABELS = {
  trigger: "Actions for {label}",
  confirmTitle: "{action} {label}?",
  cancel: "Cancel",
} satisfies RowActionsLabels;

const fill = (template: string, values: Readonly<Record<string, string>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** Where a right-click happened, as the offsets from the trigger that put the menu's corner there (and 2px aside, so the pointer is not over an item). */
interface Offset {
  x: number;
  y: number;
}

/**
 * The three-dot menu at the end of a row, for every table and list. Its button is named for its row ("Actions for
 * Invoice 1042", never "More"), so a screen reader user can tell the rows apart. Actions sit in groups divided by rules.
 * A disabled action stays in the menu and in the tab order and says why under its label, where it is also read with the
 * item. A destructive action does not run at once: choosing it opens a small popover next to the button with the question,
 * Cancel (which has the focus) and the action, and `onAction` is called only after the confirm. With `contextMenu` the same
 * menu opens at the pointer on a right-click and on Shift+F10 anywhere on the row.
 */
export function RowActionsMenu({ label, actions, onAction, contextMenu = false, labels, className, ...props }: RowActionsMenuProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // The destructive action that was chosen: the menu closes first, and the confirm opens when it is gone.
  const pending = useRef<RowAction | null>(null);
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState<Offset | null>(null);
  const [confirming, setConfirming] = useState<RowAction | null>(null);
  // A row can start without actions (permissions still loading) and get them later: the listeners need the row, which exists only once there are.
  const hasActions = actions.length > 0;

  useEffect(() => {
    if (!contextMenu) return;
    const row = root.current?.closest<HTMLElement>("tr, [role='row'], li");
    if (!row) return;
    const onContextMenu = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest("a[href], input, textarea, select, [contenteditable='true']")) return;
      const box = trigger.current?.getBoundingClientRect();
      if (!box) return;
      event.preventDefault();
      // A browser that also sends a contextmenu event for Shift+F10 must not move a menu the key has just opened.
      if (trigger.current?.getAttribute("data-state") === "open") return;
      setOffset({ x: event.clientX - box.left + 2, y: event.clientY - box.bottom + 2 });
      setOpen(true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))) return;
      event.preventDefault();
      setOffset(null);
      setOpen(true);
    };
    row.addEventListener("contextmenu", onContextMenu);
    row.addEventListener("keydown", onKeyDown);
    return () => {
      row.removeEventListener("contextmenu", onContextMenu);
      row.removeEventListener("keydown", onKeyDown);
    };
  }, [contextMenu, hasActions]);

  const title = confirming ? fill(words.confirmTitle, { action: confirming.label, label }) : "";

  // A row with nothing to do has no button to name.
  if (!hasActions) return null;

  return (
    <Popover open={confirming !== null} onOpenChange={(next) => (next ? undefined : setConfirming(null))}>
      <PopoverAnchor asChild>
        <span ref={root} data-slot="row-actions-menu" className={cn("inline-flex", className)} {...props}>
          <DropdownMenu
            // Not modal: a table is full of these buttons, and one press on the next row's button or a right-click on the next row should open that menu, not only close this one. It does not lock the page's scroll either.
            modal={false}
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              // Opened from the button, not from a right-click: the menu hangs from the button again.
              if (next) setOffset(null);
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                ref={trigger}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={fill(words.trigger, { label })}
                className="text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
              >
                <IconMoreHorizontal aria-hidden="true" strokeWidth={2.5} className="size-[1.125rem]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="bottom"
              align={offset ? "start" : "end"}
              sideOffset={offset ? offset.y : 6}
              alignOffset={offset ? offset.x : 0}
              // Hung from the pointer, the menu may sit well away from the button: by default it is held to within reach of it.
              sticky={offset ? "always" : "partial"}
              collisionPadding={8}
              className="min-w-52"
              onCloseAutoFocus={(event) => {
                // The destructive action asked for a confirm: it opens now, and keeps the focus the popover takes.
                const next = pending.current;
                if (!next) return;
                pending.current = null;
                event.preventDefault();
                setConfirming(next);
              }}
            >
              {groupActions(actions).map((group, index) => (
                <Fragment key={group.key}>
                  {index > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuGroup>
                    {group.items.map((action) => {
                      const refused = action.disabled === true;
                      const reasonId = `${base}-${action.id}`;
                      return (
                        <DropdownMenuItem
                          key={action.id}
                          variant={action.destructive ? "destructive" : "default"}
                          // Not Radix's `disabled`: that takes the item out of the arrow keys, and the reason with it.
                          aria-disabled={refused || undefined}
                          aria-describedby={refused && action.disabledReason ? reasonId : undefined}
                          onSelect={(event) => {
                            if (refused) {
                              event.preventDefault();
                              return;
                            }
                            if (action.destructive) pending.current = action;
                            else onAction?.(action.id);
                          }}
                          className={cn(refused && "cursor-not-allowed [&>svg]:opacity-50")}
                        >
                          {action.icon}
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={cn(refused && "opacity-50")}>{action.label}</span>
                            {refused && action.disabledReason ? (
                              <span id={reasonId} className="text-xs leading-4 text-muted-foreground">
                                {action.disabledReason}
                              </span>
                            ) : null}
                          </span>
                          {action.shortcut ? <DropdownMenuShortcut className={cn(refused && "opacity-50")}>{action.shortcut}</DropdownMenuShortcut> : null}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </span>
      </PopoverAnchor>
      <PopoverContent
        role="alertdialog"
        aria-label={title}
        align="end"
        collisionPadding={8}
        className="w-72"
        onCloseAutoFocus={(event) => {
          // There is no popover trigger to return to: the focus goes back to the button of the row.
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <p className="text-sm font-medium">{title}</p>
        {confirming?.confirmDescription ? <p className="mt-1 text-sm text-muted-foreground">{confirming.confirmDescription}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" autoFocus onClick={() => setConfirming(null)}>
            {words.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => {
              const chosen = confirming;
              setConfirming(null);
              if (chosen) onAction?.(chosen.id);
            }}
          >
            {confirming?.label}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
