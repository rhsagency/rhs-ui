"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconMoreHorizontal } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface OverflowAction {
  /** A stable key for the action. */
  id: string;
  /** What the action does. It is the button's text in the row and the item's text in the menu. */
  label: string;
  /** The icon, as an element: `<IconShare />`. */
  icon?: ReactNode;
  /** Runs when the button or the menu item is chosen. */
  onSelect?: () => void;
  /** Which actions stay in the row the longest: the lower the number, the sooner it moves into the menu. Equal numbers move from the end first. Default 0. */
  priority?: number;
  /** Styled as a destructive action, in the row and in the menu. */
  destructive?: boolean;
  /** Dimmed and inert, in the row and in the menu. */
  disabled?: boolean;
  /** Never moves into the menu. */
  pinned?: boolean;
  /** A divider above this action while it is in the menu, to keep the groups of a long list. */
  separatorBefore?: boolean;
}

export interface OverflowActionsProps extends Omit<ComponentProps<"div">, "children"> {
  /** The actions in the order they should read, in the row and in the menu. */
  actions: readonly OverflowAction[];
  /** The least number of actions kept in the row, pinned ones included, even if they do not fit. Default 0: the row may empty into the menu completely. */
  minVisible?: number;
  /** The space between buttons in pixels. Default 8. */
  gap?: number;
  /** Button height: 32, 36 or 44px. */
  size?: "sm" | "md" | "lg";
  /** The look of the buttons. */
  variant?: "outline" | "ghost" | "secondary" | "default";
  /** The name of the menu button, followed by how many actions are in it: "More actions, 4". Default "More actions". */
  moreLabel?: string;
  /** Called with the ids that are in the menu now, in order, whenever that set changes. */
  onOverflowChange?: (ids: readonly string[]) => void;
}

const BUTTON_SIZE = { sm: "sm", md: "default", lg: "lg" } as const;
const MORE_SIZE = { sm: "size-8", md: "size-9", lg: "size-11" } as const;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Which actions do not fit, by id. Pinned ones never go; the lowest priority goes first, and among equals the last. */
function distribute(actions: readonly OverflowAction[], widths: ReadonlyMap<string, number>, available: number, moreWidth: number, gap: number, minVisible: number): string[] {
  const ids = actions.map((action) => action.id);
  const total = (list: readonly string[]) => list.reduce((sum, id) => sum + (widths.get(id) ?? 0), 0) + gap * Math.max(0, list.length - 1);
  // A hidden or unmeasured container tells nothing: keep everything in the row.
  if (available <= 0 || total(ids) <= available + 0.5) return [];
  const room = available - moreWidth - gap;
  const order = actions
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => !action.pinned)
    .sort((a, b) => (a.action.priority ?? 0) - (b.action.priority ?? 0) || b.index - a.index);
  let shown = ids;
  const moved = new Set<string>();
  for (const { action } of order) {
    if (total(shown) <= room || shown.length <= minVisible) break;
    moved.add(action.id);
    shown = shown.filter((id) => id !== action.id);
  }
  return ids.filter((id) => moved.has(id));
}

function RowButton({ action, size, variant }: { action: OverflowAction; size: "sm" | "md" | "lg"; variant: NonNullable<ButtonProps["variant"]> }) {
  const danger = action.destructive;
  return (
    <Button
      type="button"
      variant={danger && variant === "default" ? "destructive" : variant}
      size={BUTTON_SIZE[size]}
      disabled={action.disabled}
      data-action={action.id}
      className={cn("shrink-0", danger && variant !== "default" && "text-destructive hover:bg-destructive/10 hover:text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]")}
      onClick={() => action.onSelect?.()}
    >
      {action.icon}
      {action.label}
    </Button>
  );
}

/**
 * A row of actions that makes room by itself: whatever does not fit moves into
 * a "More" menu, lowest priority first, and comes back when there is space
 * again. Pinned actions never move; the menu keeps the order, the dividers and
 * the dimmed items. Each action exists once in the accessibility tree, in the
 * row or in the menu, never both: the widths come from hidden copies kept
 * off screen, so measuring never disturbs the live row and cannot flicker. At
 * the narrowest width everything is in the menu and its button names the
 * count: "More actions, 4". Give it the width of its container.
 */
export function OverflowActions({
  actions,
  minVisible = 0,
  gap = 8,
  size = "md",
  variant = "outline",
  moreLabel = "More actions",
  onOverflowChange,
  className,
  style,
  "aria-label": ariaLabel = "Actions",
  ...props
}: OverflowActionsProps) {
  const root = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [moved, setMoved] = useState<readonly string[]>([]);
  const [ready, setReady] = useState(false);

  // What the measuring reads is kept in a ref, so a new `actions` array on every render does not restart the observers.
  const latest = useRef({ actions, gap, minVisible });
  useEffect(() => {
    latest.current = { actions, gap, minVisible };
  });
  const signature = useMemo(() => actions.map((action) => `${action.id}:${action.pinned ? 1 : 0}:${action.priority ?? 0}`).join("|"), [actions]);

  const measure = useCallback(() => {
    const host = root.current;
    const copies = probe.current;
    if (!host || !copies) return;
    const widths = new Map<string, number>();
    let moreWidth = 0;
    for (const child of Array.from(copies.children)) {
      const width = child.getBoundingClientRect().width;
      const id = (child as HTMLElement).dataset.action;
      if (id === undefined) moreWidth = width;
      else widths.set(id, width);
    }
    const { actions: current, gap: space, minVisible: least } = latest.current;
    const next = distribute(current, widths, host.clientWidth, moreWidth, space, least);
    setMoved((previous) => (previous.length === next.length && previous.every((id, index) => id === next[index]) ? previous : next));
  }, []);

  useIsoLayoutEffect(() => {
    const host = root.current;
    const copies = probe.current;
    if (!host || !copies) return;
    measure();
    setReady(true);
    // The observers answer on the next frame: a change of layout in their own callback is what ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(host);
    for (const child of Array.from(copies.children)) observer.observe(child);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(() => measure());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure, signature, size, variant, gap, minVisible]);

  // Only a change of the set is news, so the callback is read from a ref and the effect depends on the set alone.
  const notify = useRef(onOverflowChange);
  useEffect(() => {
    notify.current = onOverflowChange;
  });
  useEffect(() => {
    notify.current?.(moved);
  }, [moved]);

  const inRow = actions.filter((action) => !moved.includes(action.id));
  const inMenu = actions.filter((action) => moved.includes(action.id));
  return (
    <div
      ref={root}
      role="group"
      aria-label={ariaLabel}
      data-slot="overflow-actions"
      data-overflowing={inMenu.length ? "" : undefined}
      className={cn("relative flex w-full min-w-0 items-center", !ready && "invisible", className)}
      style={{ gap, ...style }}
      {...props}
    >
      {inRow.map((action) => (
        <RowButton key={action.id} action={action} size={size} variant={variant} />
      ))}

      {inMenu.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={variant} aria-label={`${moreLabel}, ${inMenu.length}`} className={cn("shrink-0 p-0", MORE_SIZE[size])}>
              <IconMoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {inMenu.map((action, index) => (
              <Fragment key={action.id}>
                {action.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem variant={action.destructive ? "destructive" : "default"} disabled={action.disabled} onSelect={() => action.onSelect?.()}>
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              </Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {/* Hidden copies, one per action and one for the menu button. They are measured and never shown, focused or read. */}
      <div aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden">
        <div ref={probe} inert className="flex w-max" style={{ gap }}>
          {actions.map((action) => (
            <RowButton key={action.id} action={{ ...action, onSelect: undefined }} size={size} variant={variant} />
          ))}
          <Button type="button" tabIndex={-1} variant={variant} className={cn("shrink-0 p-0", MORE_SIZE[size])}>
            <IconMoreHorizontal />
          </Button>
        </div>
      </div>
    </div>
  );
}
