"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconCheck, IconChevronDown, IconMinus, IconPlus } from "@rhs-ui/icons";
import { clamp, DEFAULT_SIZES, formatSize, ladderStep, parseSize, roundTo, spokenUnit } from "@rhs-ui/primitives/font-size-field/sizes";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface FontSizeFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The size, when you control it. A number in `unit`. */
  value?: number;
  /** The size to start with, when you do not control the field. Default: the third preset. */
  defaultValue?: number;
  /** Called with the new size, always inside `min` and `max`. */
  onValueChange?: (value: number) => void;
  /** The ladder: the sizes in the list, and the sizes the arrow keys and the minus and plus buttons walk along. Default 12, 14, 16, 18, 24 and 32. */
  sizes?: readonly number[];
  /** The smallest size. Default 1. */
  min?: number;
  /** The largest size. Default 400. */
  max?: number;
  /** The unit shown after the number, such as "px" or "pt". It is read out in words, "16 pixels". Default "px". */
  unit?: string;
  /** What Shift with an arrow key adds or takes away, and what a step is past either end of the ladder. Default 1. */
  step?: number;
  /** The locale that writes the number and its decimal sign. Default "en-US". */
  locale?: string;
  /** The name a screen reader reads with the number, "Font size 16 pixels". Default "Font size". */
  label?: string;
  /** The field's name for a plain form submit: the number goes out in a hidden input. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** Start with the list of sizes open, for a preview or a tour. It closes like any other, and it never takes the focus. */
  defaultOpen?: boolean;
  /** Where the list opens: under the field and, when there is no room below, above it ("auto", the default); or always "bottom" or "top". */
  placement?: "auto" | "bottom" | "top";
  /** Put on the number, so a <label htmlFor> focuses the field. */
  id?: string;
}

const SEGMENT =
  "grid w-9 shrink-0 place-items-center pointer-coarse:w-11 text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground active:bg-muted/70 disabled:pointer-events-none disabled:opacity-40 motion-reduce:transition-none";

/**
 * A font size you can type, step or pick: a minus, the number with its unit, a plus, and a chevron that opens
 * the common sizes, joined into one control the way editors draw it. The arrow keys walk the ladder of
 * presets (from 16 up to 18, not to 17), Shift with an arrow adds or takes away one `step`, and Alt with the
 * down arrow opens the list. Typing is checked on Enter or when the field is left, and a size outside `min`
 * and `max` is brought to the nearest limit. The number is a spin button that reads "Font size, 16 pixels", and
 * the buttons announce the size they set. The whole control is one tab stop (the buttons are for the pointer
 * and for a screen reader's own cursor), so it sits in a toolbar without adding three stops to it.
 */
export function FontSizeField({
  value,
  defaultValue,
  onValueChange,
  sizes = DEFAULT_SIZES,
  min = 1,
  max = 400,
  unit = "px",
  step = 1,
  locale = "en-US",
  label = "Font size",
  name,
  disabled,
  defaultOpen = false,
  placement = "auto",
  id,
  className,
  ...props
}: FontSizeFieldProps) {
  const [own, setOwn] = useState(() => defaultValue ?? sizes[2] ?? sizes[0] ?? 16);
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // A list that starts open is a preview: it must not take the focus from the page, until someone has used it.
  const used = useRef(false);
  const outside = useRef(false);

  const current = clamp(value ?? own, min, max);
  const shown = draft ?? formatSize(current, locale);
  const presets = sizes.filter((size) => size >= min && size <= max);
  const spoken = `${formatSize(current, locale)} ${spokenUnit(unit, current)}`;
  // A field that is switched off dims as a whole, so its buttons keep their full strength inside it.
  const segment = cn(SEGMENT, disabled && "disabled:opacity-100");

  // A form that is reset puts an uncontrolled field back to the size it started with.
  useEffect(() => {
    const form = input.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => {
      setOwn(defaultValue ?? sizes[2] ?? sizes[0] ?? 16);
      setDraft(null);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, sizes, value]);

  // What a screen reader was told stays only while it is news.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 3000);
    return () => window.clearTimeout(timer);
  }, [said]);

  /** Opens or closes the list. Once someone has done it, the list is theirs: it takes the focus when it opens. */
  function show(next: boolean) {
    used.current = true;
    if (next) outside.current = false;
    setOpen(next);
  }

  function set(next: number, announce: boolean) {
    const size = roundTo(clamp(next, min, max));
    setDraft(null);
    if (value === undefined) setOwn(size);
    if (size !== current) onValueChange?.(size);
    if (announce) setSaid(`${label} ${formatSize(size, locale)} ${spokenUnit(unit, size)}`);
  }

  /** One step along the ladder, or one fine step with Shift. A number that was typed but not entered is the place to start from. */
  function move(direction: 1 | -1, fine: boolean, announce: boolean) {
    const from = (draft !== null ? parseSize(draft) : null) ?? current;
    set(fine ? from + direction * step : ladderStep(from, direction, sizes, step), announce);
  }

  function commit() {
    if (draft === null) return;
    const typed = parseSize(draft);
    if (typed === null) setDraft(null);
    else set(typed, false);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      if (event.altKey) show(true);
      else move(event.key === "ArrowUp" ? 1 : -1, event.shiftKey, false);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit();
      event.currentTarget.select();
    } else if (event.key === "Escape" && draft !== null) {
      // The first Escape only takes back what was typed; a dialog around the field stays open.
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  }

  function listKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')];
    const at = items.indexOf(document.activeElement as HTMLElement);
    let to = -1;
    if (event.key === "ArrowDown") to = Math.min(items.length - 1, at + 1);
    else if (event.key === "ArrowUp") to = Math.max(0, at - 1);
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = items.length - 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      items[at]?.click();
      return;
    } else return;
    event.preventDefault();
    items[to]?.focus();
  }

  // A press on a button must not take the focus from where the person was typing, or from the document the toolbar belongs to.
  const keepFocus = (event: { preventDefault: () => void }) => event.preventDefault();

  return (
    <div data-slot="font-size-field" data-disabled={disabled || undefined} aria-disabled={disabled || undefined} className={cn("inline-flex", className)} {...props}>
      <Popover open={open && !disabled} onOpenChange={show}>
        <PopoverAnchor asChild>
          <div
            className={cn(
              "flex h-9 items-stretch pointer-coarse:h-11 overflow-hidden rounded-md border border-input bg-background text-sm shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
              "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
              disabled && "opacity-50",
            )}
          >
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Decrease ${label.toLowerCase()}`}
              disabled={disabled || current <= min}
              onMouseDown={keepFocus}
              onClick={() => move(-1, false, true)}
              className={segment}
            >
              <IconMinus size={14} />
            </button>
            <div onClick={() => input.current?.focus()} className="flex min-w-[3.75rem] cursor-text items-center justify-center gap-1 border-x border-input px-2">
              <input
                ref={input}
                id={id}
                type="text"
                role="spinbutton"
                inputMode="decimal"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={disabled}
                aria-label={label}
                aria-valuenow={current}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuetext={spoken}
                value={shown}
                style={{ width: `${Math.max(2, shown.length)}ch` }}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setDraft(event.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
                onBlur={commit}
                onKeyDown={keyDown}
                className="min-w-0 bg-transparent text-right tabular-nums outline-none disabled:cursor-not-allowed"
              />
              <span aria-hidden="true" className="text-xs text-muted-foreground select-none">
                {unit}
              </span>
            </div>
            <button
              type="button"
              tabIndex={-1}
              aria-label={`Increase ${label.toLowerCase()}`}
              disabled={disabled || current >= max}
              onMouseDown={keepFocus}
              onClick={() => move(1, false, true)}
              className={segment}
            >
              <IconPlus size={14} />
            </button>
            <PopoverTrigger asChild>
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Common ${label.toLowerCase()}s`}
                aria-haspopup="listbox"
                disabled={disabled}
                onMouseDown={keepFocus}
                className={cn(segment, "group w-7 pointer-coarse:w-9 border-l border-input data-[state=open]:bg-muted data-[state=open]:text-foreground")}
              >
                <IconChevronDown size={14} className="transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
              </button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          side={placement === "top" ? "top" : "bottom"}
          avoidCollisions={placement === "auto"}
          aria-label={`Common ${label.toLowerCase()}s`}
          className="w-(--radix-popover-trigger-width) min-w-36 p-1"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            if (!used.current) return;
            const items = list.current?.querySelectorAll<HTMLElement>('[role="option"]');
            (list.current?.querySelector<HTMLElement>('[aria-selected="true"]') ?? items?.[0])?.focus();
          }}
          onInteractOutside={() => {
            outside.current = true;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (!outside.current) input.current?.focus();
          }}
        >
          <div ref={list} role="listbox" aria-label={`Common ${label.toLowerCase()}s`} onKeyDown={listKeyDown} className="grid gap-px">
            {presets.map((size) => {
              const chosen = size === current;
              return (
                <div
                  key={size}
                  role="option"
                  tabIndex={-1}
                  aria-selected={chosen}
                  onClick={() => {
                    set(size, true);
                    show(false);
                  }}
                  className="flex h-8 pointer-coarse:h-10 cursor-default items-center justify-between gap-3 rounded-md px-2.5 text-sm tabular-nums outline-none select-none hover:bg-muted focus:bg-muted aria-selected:font-medium"
                >
                  <span>
                    {formatSize(size, locale)}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
                  </span>
                  {chosen ? <IconCheck size={14} aria-hidden="true" /> : null}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
    </div>
  );
}
