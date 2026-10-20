"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconMinus, IconPlus, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export interface QuantityStepperLabels {
  /** The name of the number field. */
  quantity?: string;
  /** The minus button. */
  decrease?: string;
  /** The plus button. */
  increase?: string;
  /** The minus button when it removes the line instead. */
  remove?: string;
  /** The note at the stock limit. {count} is the number available. */
  onlyAvailable?: string;
  /** The note at the cap set with `max`. {count} is the cap. */
  maximum?: string;
  /** What a screen reader hears after a change. {count} is the new quantity. */
  announce?: string;
}

export interface QuantityStepperProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange"> {
  /** The quantity, when you control it. */
  value?: number;
  /** The starting quantity, when the stepper keeps it itself. Defaults to `min`. */
  defaultValue?: number;
  /** Called with the new quantity after a press, a typed value or a key. */
  onChange?: (value: number) => void;
  /** The lowest quantity. Defaults to 1. */
  min?: number;
  /** The highest quantity, such as a limit per order. */
  max?: number;
  /** How far one press moves: 6 for a product sold in packs of six. Values are always min plus a whole number of steps. */
  step?: number;
  /** How many are in stock. At the limit plus is disabled and a note says "Only 3 available". */
  stockLimit?: number;
  /** At the minimum the minus button turns into a trash button that calls `onRemove`: a cart line, where one is the lowest and zero means gone. */
  removeAtMin?: boolean;
  /** Called when the trash button is pressed at the minimum (`removeAtMin`). Only a completed press calls it: holding the button, a key repeat or a scroll that starts on it never does. */
  onRemove?: () => void;
  /** The cart is updating: presses are ignored and a spinner covers the number, while the size and the focus stay where they are. */
  busy?: boolean;
  /** "md" is 36px high, "sm" 32px for a tight cart line. */
  size?: "sm" | "md";
  /** Locks the whole stepper and dims it. */
  disabled?: boolean;
  /** Submits the quantity with a form. */
  name?: string;
  /** Names the stepper for assistive technology; include the product in a cart: "Quantity of Ridge vase". */
  label?: string;
  /** The words, for another language. */
  labels?: QuantityStepperLabels;
}

const WORDS = {
  quantity: "Quantity",
  decrease: "Decrease quantity",
  increase: "Increase quantity",
  remove: "Remove from cart",
  onlyAvailable: "Only {count} available",
  maximum: "Maximum {count} per order",
  announce: "Quantity {count}",
} satisfies Required<QuantityStepperLabels>;

/**
 * Repeats an action while a button is held: after a short wait, then faster and faster. The action returns false to
 * stop. A press only arms the timer; the single step of a press belongs to its click. `repeated` tells that click
 * the hold has already stepped, so it adds nothing.
 */
function useHold(action: (repeating: boolean) => boolean) {
  const latest = useRef(action);
  const timer = useRef<number>(undefined);
  const repeated = useRef(false);
  useEffect(() => {
    latest.current = action;
  });
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = () => {
    let delay = 420;
    repeated.current = false;
    const tick = () => {
      if (!latest.current(true)) return;
      repeated.current = true;
      delay = Math.max(55, delay * 0.82);
      timer.current = window.setTimeout(tick, delay);
    };
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(tick, delay);
  };
  /** No click follows a press the browser cancelled (a scroll) or a button that lost focus, so there is nothing left to skip. */
  const cancel = () => {
    stop();
    repeated.current = false;
  };
  return { start, stop, cancel, repeated };
}

/**
 * A quantity control for carts: minus, a typed value and plus. A product sold
 * in packs steps by its pack size, plus disables at the stock limit and says
 * how many are available, and at the minimum the minus becomes a trash button
 * for a cart line. Holding a button repeats, typing is checked when the field
 * is left, every change is announced politely ("Quantity 3"), and `busy`
 * covers the number with a spinner without changing the size of anything.
 */
export function QuantityStepper({
  value,
  defaultValue,
  onChange,
  min = 1,
  max,
  step = 1,
  stockLimit,
  removeAtMin = false,
  onRemove,
  busy = false,
  size = "md",
  disabled = false,
  name,
  label = "Quantity",
  labels,
  className,
  ...props
}: QuantityStepperProps) {
  const words = { ...WORDS, ...labels };
  const noteId = useId();
  const [own, setOwn] = useState(defaultValue ?? min);
  const [draft, setDraft] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const current = value ?? own;

  const cap = Math.min(max ?? Number.POSITIVE_INFINITY, stockLimit ?? Number.POSITIVE_INFINITY);
  // The quantities that can be reached are min, min + step, min + 2 * step, up to the cap.
  const top = Number.isFinite(cap) ? min + Math.max(0, Math.floor((cap - min) / step)) * step : Number.POSITIVE_INFINITY;
  const snap = (next: number) => Math.min(top, Math.max(min, min + Math.round((next - min) / step) * step));
  const atMin = current <= min;
  const atTop = current + step > cap;
  const trash = removeAtMin && atMin;
  const stockBound = stockLimit !== undefined && stockLimit <= (max ?? Number.POSITIVE_INFINITY);
  const note = atTop && Number.isFinite(cap) ? (stockBound ? words.onlyAvailable : words.maximum).replace("{count}", String(cap)) : null;

  function commit(next: number) {
    const fixed = snap(next);
    if (fixed === current) return;
    if (value === undefined) setOwn(fixed);
    onChange?.(fixed);
  }

  /** One step in a direction. A repeat that reaches the minimum stops there: holding the button must never remove the line. */
  function move(direction: 1 | -1, repeating: boolean): boolean {
    if (disabled || busy) return false;
    if (direction === -1 && atMin) {
      if (removeAtMin && !repeating) onRemove?.();
      return false;
    }
    if (direction === 1 && atTop) return false;
    commit(current + direction * step);
    return true;
  }

  const minus = useHold((repeating) => move(-1, repeating));
  const plus = useHold((repeating) => move(1, repeating));
  const keyRepeat = useRef(false);

  function commitDraft() {
    if (draft === null) return;
    const typed = Number.parseInt(draft, 10);
    if (Number.isFinite(typed)) commit(typed);
    setDraft(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      setDraft(null);
      move(event.key === "ArrowUp" ? 1 : -1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      commit(min);
    } else if (event.key === "End" && Number.isFinite(top)) {
      event.preventDefault();
      commit(top);
    } else if (event.key === "Enter") {
      // Inside a cart form Enter would submit it; here it only confirms the number.
      event.preventDefault();
      commitDraft();
    } else if (event.key === "Escape") {
      setDraft(null);
    }
  }

  // Said once things settle, so holding a button does not read out every number on the way.
  const announcement = `${words.announce.replace("{count}", String(current))}${note ? `. ${note}` : ""}`;
  const spoken = useRef(announcement);
  useEffect(() => {
    if (spoken.current === announcement) return;
    spoken.current = announcement;
    const timeout = window.setTimeout(() => setSaid(announcement), 350);
    return () => window.clearTimeout(timeout);
  }, [announcement]);

  const small = size === "sm";
  const pressable = (limited: boolean) => ({
    "aria-disabled": disabled || busy || limited || undefined,
    "data-dim": disabled || limited || undefined,
  });
  // A press only arms the repeat. The step itself is the click's, for a mouse, a finger and a key alike, so a scroll that
  // starts on a button (the browser cancels the pointer) or a press that is never finished changes nothing, and a line is
  // only ever removed by a completed click.
  const holdProps = (hold: ReturnType<typeof useHold>, direction: 1 | -1) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      keyRepeat.current = false;
      hold.start();
    },
    onPointerUp: hold.stop,
    onPointerLeave: hold.stop,
    onPointerCancel: hold.cancel,
    onBlur: () => {
      hold.cancel();
      keyRepeat.current = false;
    },
    onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault(),
    // Holding Enter on a focused button clicks again and again: those clicks are repeats and never remove the line.
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      keyRepeat.current = event.repeat;
      if (event.key === "Enter" || event.key === " ") hold.repeated.current = false;
    },
    onKeyUp: () => {
      keyRepeat.current = false;
    },
    onClick: () => {
      // The hold already stepped; the click that ends it must not step once more.
      if (hold.repeated.current) {
        hold.repeated.current = false;
        return;
      }
      move(direction, keyRepeat.current);
    },
  });
  const edge = "relative h-full touch-manipulation rounded-none px-0 select-none focus-visible:z-10 aria-disabled:pointer-events-none data-[dim]:opacity-40";

  return (
    <div data-slot="quantity-stepper" data-busy={busy || undefined} className={cn("inline-grid gap-1.5", className)} {...props}>
      <div
        role="group"
        aria-label={label}
        aria-busy={busy || undefined}
        className={cn(
          "relative inline-flex items-stretch rounded-md border border-input bg-background text-sm shadow-xs transition-shadow has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40 motion-reduce:transition-none",
          small ? "h-8 w-28" : "h-9 w-32",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          data-trash={trash || undefined}
          aria-label={trash ? words.remove : words.decrease}
          {...pressable(!trash && atMin)}
          {...holdProps(minus, -1)}
          className={cn(edge, "rounded-l-[5px] data-[trash]:hover:text-destructive", small ? "w-8" : "w-9")}
        >
          <span aria-hidden="true" className="relative grid size-4 place-items-center">
            <IconMinus size={14} className={cn("absolute transition-[opacity,transform] duration-150 motion-reduce:transition-none", trash ? "scale-50 opacity-0" : "opacity-100")} />
            <IconTrash size={14} className={cn("absolute transition-[opacity,transform] duration-150 motion-reduce:transition-none", trash ? "opacity-100" : "scale-50 opacity-0")} />
          </span>
        </Button>
        <input
          type="text"
          inputMode="numeric"
          role="spinbutton"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={words.quantity}
          aria-valuenow={current}
          aria-valuemin={min}
          aria-valuemax={Number.isFinite(top) ? top : undefined}
          aria-describedby={note ? noteId : undefined}
          disabled={disabled}
          readOnly={busy}
          value={draft ?? String(current)}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, "").slice(0, 4))}
          onBlur={commitDraft}
          onKeyDown={onKeyDown}
          className={cn("min-w-0 flex-1 border-x border-input bg-transparent text-center font-medium tabular-nums outline-none transition-opacity duration-150 disabled:opacity-50 motion-reduce:transition-none", busy && "opacity-30")}
        />
        <Button type="button" variant="ghost" size="sm" aria-label={words.increase} {...pressable(atTop)} {...holdProps(plus, 1)} className={cn(edge, "rounded-r-[5px]", small ? "w-8" : "w-9")}>
          <IconPlus size={14} />
        </Button>
        {busy ? (
          <span className="pointer-events-none absolute inset-y-0 left-1/2 grid -translate-x-1/2 place-items-center">
            <Spinner size={14} label="" role="presentation" aria-hidden="true" />
          </span>
        ) : null}
        {name ? <input type="hidden" name={name} value={current} /> : null}
      </div>
      {note ? (
        <p id={noteId} className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
