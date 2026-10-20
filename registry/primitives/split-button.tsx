"use client";

import { Fragment, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconChevronDown, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ButtonGroup, ButtonGroupSeparator, iconSizeOf } from "@rhs-ui/primitives/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SplitButtonItem {
  /** Identity for `remember`. Defaults to the label. */
  id?: string;
  /** What the item says. */
  label: string;
  /** An icon before the label: `<IconClock />`. */
  icon?: ReactNode;
  /** Runs when the item is chosen. */
  onSelect?: () => void;
  /** Draws the item in the destructive tone. A destructive item is never promoted to the main button by `remember`. */
  destructive?: boolean;
  /** Greyed out and skipped by the arrow keys. */
  disabled?: boolean;
  /** Draw a divider above this item. */
  separatorBefore?: boolean;
}

export interface SplitButtonProps extends Omit<ComponentProps<"div">, "children" | "role" | "aria-label"> {
  /** The main action's label: "Save". */
  label: string;
  /** Runs when the main button is pressed. */
  onAction?: () => void;
  /** An icon before the main label. */
  icon?: ReactNode;
  /** The related actions behind the chevron. */
  items: readonly SplitButtonItem[];
  /** The look of both buttons. Solid variants get a divider between them; outline shares its border. */
  variant?: "default" | "secondary" | "outline" | "destructive";
  /** The height of both buttons: 32, 36 or 44px. */
  size?: "sm" | "default" | "lg";
  /** Busy: the main button shows a spinner and ignores presses, and keeps keyboard focus (it is aria-disabled, not disabled). The menu stays reachable. */
  loading?: boolean;
  /** Disables the main button only. The menu stays reachable, so the alternatives still work. */
  disabled?: boolean;
  /** The item someone picks last becomes the main action. The menu then lists the original action too, with the current one checked. */
  remember?: boolean;
  /** The promoted item's id, to keep the choice across visits. Controlled: pair it with `onRememberChange`. `null` is the original action. */
  rememberedId?: string | null;
  /** Called with the id of the item that was promoted, or `null` when the original action is picked again. Store it wherever suits you. */
  onRememberChange?: (id: string | null) => void;
  /** The chevron's accessible name. Defaults to "More options for <main label>". */
  menuLabel?: string;
  /** Classes for the group that holds both buttons. */
  className?: string;
}

const MAIN = "__main__";

interface Action extends SplitButtonItem {
  id: string;
}

/**
 * A main action with a chevron that opens the alternatives, like Save and
 * Save as draft: one click does the common thing, the menu holds the rest.
 * The two buttons are announced as one group, ArrowDown on the main button
 * opens the menu, and focus returns to the chevron on close. With `remember`
 * the last item picked becomes the main action. Busy and disabled apply to the
 * main button only, so the menu is always reachable; a busy button keeps focus,
 * so a keyboard user is not sent back to the top of the page.
 */
export function SplitButton({
  label,
  onAction,
  icon,
  items,
  variant = "default",
  size = "default",
  loading = false,
  disabled = false,
  remember = false,
  rememberedId,
  onRememberChange,
  menuLabel,
  className,
  ...props
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<string | null>(null);
  const remembered = rememberedId !== undefined ? rememberedId : own;

  const main: Action = { id: MAIN, label, icon, onSelect: onAction };
  const options: Action[] = items.map((item) => ({ ...item, id: item.id ?? item.label }));
  const all = [main, ...options];
  const current = (remember && all.find((action) => action.id === (remembered ?? MAIN) && !action.disabled && !action.destructive)) || main;
  const menu = remember ? all : options;

  const choose = (action: Action) => {
    action.onSelect?.();
    if (!remember || action.destructive) return;
    const id = action.id === MAIN ? null : action.id;
    if (rememberedId === undefined) setOwn(id);
    onRememberChange?.(id);
  };

  const chevronSize = iconSizeOf[size];
  // When some items have an icon, the others keep its space so the labels line up.
  const anyIcon = menu.some((action) => action.icon);
  return (
    <ButtonGroup data-slot="split-button" aria-label={current.label} variant={variant} size={size} className={className} {...props}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        // Busy is not the native `disabled`: that would drop focus to the page body the moment the action starts.
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={() => {
          if (loading) return;
          current.onSelect?.();
        }}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" || !menu.length) return;
          event.preventDefault();
          setOpen(true);
        }}
        // Busy is not unavailable: keep the label at full strength and let the spinner say it.
        className={cn("min-w-0 shrink", loading && "disabled:opacity-100")}
      >
        {loading ? <IconSpinner data-slot="button-spinner" /> : current.icon}
        <span className="min-w-0 truncate">{current.label}</span>
      </Button>
      {menu.length ? (
        <>
          {variant === "outline" ? null : <ButtonGroupSeparator />}
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant={variant}
                size={chevronSize}
                aria-label={menuLabel ?? `More options for ${current.label}`}
                className={cn(
                  "relative",
                  size === "lg" && "size-11",
                  // On a touch screen the target grows to 44px without changing the drawing.
                  "[@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:top-1/2 [@media(pointer:coarse)]:after:left-1/2 [@media(pointer:coarse)]:after:size-11 [@media(pointer:coarse)]:after:-translate-x-1/2 [@media(pointer:coarse)]:after:-translate-y-1/2 [@media(pointer:coarse)]:after:content-['']",
                )}
              >
                <IconChevronDown className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              {menu.map((action) => (
                <Fragment key={action.id}>
                  {action.separatorBefore ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem variant={action.destructive ? "destructive" : "default"} disabled={action.disabled} onSelect={() => choose(action)}>
                    {action.icon ?? (anyIcon ? <span aria-hidden="true" className="size-4 shrink-0" /> : null)}
                    <span className="min-w-0 flex-1 truncate">{action.label}</span>
                    {remember && action.id === current.id ? (
                      <>
                        <IconCheck size={14} className="ms-auto text-foreground" />
                        <span className="sr-only">(current)</span>
                      </>
                    ) : null}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </ButtonGroup>
  );
}
