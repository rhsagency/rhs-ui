"use client";

import { useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconCheck, IconClose } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export interface ChipProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onChange"> {
  /** The label. */
  children: ReactNode;
  /** `static` shows an attribute, `toggle` is a button you can select, `input` is a value you can remove. */
  variant?: "static" | "toggle" | "input";
  /** Toggle only, controlled: whether the chip is selected. */
  selected?: boolean;
  /** Toggle only, uncontrolled: the starting state. */
  defaultSelected?: boolean;
  /** Toggle only: called with the new state when the chip is pressed. */
  onSelectedChange?: (selected: boolean) => void;
  /** Input only: called when the remove button is pressed, or Backspace or Delete is pressed on it. */
  onRemove?: () => void;
  /** A small glyph before the label: `<IconStar />`. A selected toggle swaps it for a check. */
  icon?: ReactNode;
  /** A person: a round picture, or their initials while it loads or when there is none. Decorative, the label names them. */
  avatar?: { name: string; src?: string };
  /** 24, 32 or 40px tall. The touch target is 44px or more on touch screens at every size. */
  size?: "sm" | "md" | "lg";
  /** Dimmed, and a toggle or a remove button stops responding. */
  disabled?: boolean;
  /** The remove button's name. Defaults to "Remove <label>" when the label is plain text. */
  removeLabel?: string;
}

const SIZES = {
  sm: {
    root: "h-6 gap-1 text-xs",
    padding: "px-2.5",
    padAvatar: "pl-1 pr-2.5",
    padInput: "pl-2.5 pr-1",
    padAvatarInput: "pl-1 pr-1",
    slot: "h-3.5",
    open: "w-3.5",
    closed: "w-0 -mr-1",
    closedEnd: "w-0 -ml-1",
    avatar: "data-[size=default]:size-4 [&_[data-slot=avatar-fallback]]:text-[0.5rem]",
    remove: "size-4",
    // The bands are measured from inside the 1px border, so they grow the chip's padding box to exactly 44px.
    touch: "[@media(pointer:coarse)]:before:-inset-y-[11px]",
    removeTouch: "[@media(pointer:coarse)]:after:-inset-3.5",
  },
  md: {
    root: "h-8 gap-1.5 text-[0.8125rem]",
    padding: "px-3",
    padAvatar: "pl-1 pr-3",
    padInput: "pl-3 pr-1.5",
    padAvatarInput: "pl-1 pr-1.5",
    slot: "h-4",
    open: "w-4",
    closed: "w-0 -mr-1.5",
    closedEnd: "w-0 -ml-1.5",
    avatar: "data-[size=default]:size-6 [&_[data-slot=avatar-fallback]]:text-[0.625rem]",
    remove: "size-5",
    touch: "[@media(pointer:coarse)]:before:-inset-y-[7px]",
    removeTouch: "[@media(pointer:coarse)]:after:-inset-3",
  },
  lg: {
    root: "h-10 gap-2 text-sm",
    padding: "px-4",
    padAvatar: "pl-1.5 pr-4",
    padInput: "pl-4 pr-2",
    padAvatarInput: "pl-1.5 pr-2",
    slot: "h-[1.125rem]",
    open: "w-[1.125rem]",
    closed: "w-0 -mr-2",
    closedEnd: "w-0 -ml-2",
    avatar: "data-[size=default]:size-7 [&_[data-slot=avatar-fallback]]:text-xs",
    remove: "size-6",
    touch: "[@media(pointer:coarse)]:before:-inset-y-[3px]",
    removeTouch: "[@media(pointer:coarse)]:after:-inset-2.5",
  },
} as const;

const TOUCH_BAND = "[@media(pointer:coarse)]:before:absolute [@media(pointer:coarse)]:before:inset-x-0 [@media(pointer:coarse)]:before:content-['']";

/** The chip nearest to this one in the same row, to hand focus to when it goes: the next, or the previous. */
function neighbour(chip: Element | null): HTMLElement | null {
  for (const candidate of [chip?.nextElementSibling, chip?.previousElementSibling]) {
    if (!(candidate instanceof HTMLElement)) continue;
    const target = candidate.matches("button:not(:disabled), input, textarea, a[href]") ? candidate : candidate.querySelector<HTMLElement>("button:not(:disabled), input, textarea, a[href]");
    if (target) return target;
  }
  return null;
}

/**
 * A compact pill for a filter, a pick or an attribute. `static` just shows
 * something, `toggle` is a button with `aria-pressed` that draws a check when
 * it is selected (so the state never rests on the fill alone), and `input` is
 * a value with its own remove button, named "Remove Design". Backspace or
 * Delete on that button removes the chip and hands focus to its neighbour. An
 * icon or a person's avatar can lead the label. The touch target grows to 44px
 * on touch screens without changing the layout, and the focus ring is the
 * kit's own. Filter bars, tag fields and multi-select values can all share it.
 */
export function Chip({
  children,
  variant = "static",
  selected,
  defaultSelected = false,
  onSelectedChange,
  onRemove,
  icon,
  avatar,
  size = "md",
  disabled = false,
  removeLabel,
  className,
  onClick,
  ...props
}: ChipProps) {
  const [own, setOwn] = useState(defaultSelected);
  const sz = SIZES[size];
  const toggle = variant === "toggle";
  const input = variant === "input";
  const on = toggle && (selected ?? own);
  const text = typeof children === "string" ? children : undefined;

  const person = avatar ? (
    <Avatar aria-hidden="true" className={cn("shrink-0", sz.avatar)}>
      {avatar.src ? <AvatarImage src={avatar.src} alt="" /> : null}
      <AvatarFallback>{initialsOf(avatar.name)}</AvatarFallback>
    </Avatar>
  ) : null;

  // The check swaps with the icon when there is one; with neither, a slot opens up for it.
  const mark = (
    <span aria-hidden="true" className={cn("relative grid shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-200 motion-reduce:transition-none", sz.slot, icon || on ? sz.open : person ? sz.closedEnd : sz.closed)}>
      {icon && !avatar ? (
        <span className={cn("col-start-1 row-start-1 grid size-full place-items-center transition-[opacity,scale] duration-200 motion-reduce:transition-none [&>svg]:size-full", on && "scale-50 opacity-0")}>{icon}</span>
      ) : null}
      <IconCheck className={cn("col-start-1 row-start-1 size-full transition-[opacity,scale] duration-200 motion-reduce:transition-none", on ? "opacity-100" : "scale-50 opacity-0")} />
    </span>
  );
  const glyph =
    icon && !toggle && !person ? (
      <span aria-hidden="true" className={cn("grid shrink-0 place-items-center [&>svg]:size-full", sz.slot, sz.open)}>
        {icon}
      </span>
    ) : null;

  const content = (
    <>
      {person}
      {!person && toggle ? mark : glyph}
      <span className="min-w-0 truncate">{children}</span>
      {person && toggle ? mark : null}
    </>
  );

  const surface = cn(
    "group/chip relative inline-flex max-w-full shrink-0 items-center rounded-full border align-middle font-medium whitespace-nowrap select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150",
    sz.root,
  );

  if (toggle) {
    return (
      <button
        data-slot="chip"
        data-variant="toggle"
        data-state={on ? "on" : "off"}
        type="button"
        aria-pressed={on}
        disabled={disabled}
        onClick={(event: MouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          const next = !on;
          if (selected === undefined) setOwn(next);
          onSelectedChange?.(next);
        }}
        className={cn(
          surface,
          person ? sz.padAvatar : sz.padding,
          sz.touch,
          TOUCH_BAND,
          "cursor-pointer outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:not-disabled:translate-y-px disabled:pointer-events-none disabled:opacity-50",
          on
            ? "border-foreground bg-foreground text-background hover:bg-foreground/90"
            : "border-border bg-background text-foreground hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_18%)] hover:bg-muted",
          className,
        )}
        {...props}
      >
        {content}
      </button>
    );
  }

  const remove = (event: MouseEvent<HTMLButtonElement> | KeyboardEvent<HTMLButtonElement>, byKeyboard: boolean) => {
    if (disabled) return;
    // A pointer user does not need focus handed on; a keyboard user would otherwise lose their place when the chip unmounts.
    if (byKeyboard) neighbour(event.currentTarget.closest("[data-slot='chip']"))?.focus();
    onRemove?.();
  };

  return (
    <span
      data-slot="chip"
      data-variant={variant}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      className={cn(
        surface,
        variant === "static" ? "border-border bg-muted text-foreground" : "border-border bg-background text-foreground has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/40",
        input ? (person ? sz.padAvatarInput : sz.padInput) : person ? sz.padAvatar : sz.padding,
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {content}
      {input ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={removeLabel ?? (text ? `Remove ${text}` : "Remove")}
          onClick={(event) => remove(event, event.detail === 0)}
          onKeyDown={(event) => {
            if (event.key !== "Backspace" && event.key !== "Delete") return;
            event.preventDefault();
            remove(event, true);
          }}
          className={cn(
            "relative grid shrink-0 place-items-center rounded-full text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground disabled:pointer-events-none",
            "[@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:content-['']",
            sz.remove,
            sz.removeTouch,
          )}
        >
          <IconClose className="size-3" />
        </button>
      ) : null}
    </span>
  );
}
