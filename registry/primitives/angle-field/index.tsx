"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import {
  compassName,
  fit,
  formatAngle,
  fromPointer,
  nextOnGrid,
  parseAngle,
  pointerAngle,
  snapTo,
  spokenAngle,
  type AngleRange,
} from "@rhs-ui/primitives/angle-field/angle";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export interface AngleFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The angle in degrees, when you control it. 0 is straight up and it grows clockwise, as in CSS: 90 is to the right. */
  value?: number;
  /** The angle to start with, when you do not control the field. Default 0. */
  defaultValue?: number;
  /** Called with the new angle, always inside the range (a wrapped angle is already brought round). */
  onValueChange?: (value: number) => void;
  /** The smallest angle. Default 0. */
  min?: number;
  /** The largest angle. With `wrap` it is where the turn starts again, so 360 is 0. Default 360. */
  max?: number;
  /** What an arrow key adds or takes away, and what a drag is rounded to. Default 1. */
  step?: number;
  /** The grid Shift snaps to, with a drag and with the arrow keys. Default 15. */
  snap?: number;
  /** Whether the angle comes round the turn (the default) or stops at `min` and `max`, as for a tilt of at most 45 degrees either way. */
  wrap?: boolean;
  /** The size of the dial: 56, 72 or 96 px. Default "default" (72). */
  size?: "sm" | "default" | "lg";
  /** Name the direction as well as the number, "90 degrees, east": under the number, and for a screen reader. Default false. */
  compass?: boolean;
  /** The name of the setting, "Rotation" or "Shadow direction". The number is named "<label> in degrees". Default "Angle". */
  label?: string;
  /** The locale that writes the number and its decimal sign. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: the angle goes out in a hidden input. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** Put on the number, so a <label htmlFor> focuses it. */
  id?: string;
}

const DIAL: Record<NonNullable<AngleFieldProps["size"]>, string> = {
  sm: "size-14",
  default: "size-[4.5rem]",
  lg: "size-24",
};

// Eight faint marks inside the rim: the four quarters a little longer and darker than the diagonals.
const MARKS = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * A rotation in degrees as a dial and a number: drag the handle round the dial, type a value, or step with
 * the arrow keys. Shift snaps a drag to a grid of 15 degrees and makes the arrow keys jump along it, Home
 * goes back to 0, and past the top the angle comes round (359 and then 0) unless `wrap` is off, in which case it
 * stops at `min` and `max`. The dial is a slider for assistive technology that reads "90 degrees", or with
 * `compass` "90 degrees, east", and the number beside it is a spin button, so the setting can be reached
 * with the keyboard from either. 0 is at the top and the angle grows clockwise, the way CSS counts, so the
 * value drops straight into a gradient, a shadow direction or a rotate().
 */
export function AngleField({
  value,
  defaultValue = 0,
  onValueChange,
  min = 0,
  max = 360,
  step = 1,
  snap = 15,
  wrap = true,
  size = "default",
  compass = false,
  label = "Angle",
  locale = "en-US",
  name,
  disabled,
  id,
  className,
  ...props
}: AngleFieldProps) {
  const range: AngleRange = { min, max, wrap };
  const [own, setOwn] = useState(() => fit(defaultValue, range));
  const [draft, setDraft] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const held = useRef(false);
  const field = useRef<HTMLInputElement>(null);
  const current = fit(value ?? own, range);

  // A form that is reset puts an uncontrolled field back to the angle it started with.
  useEffect(() => {
    const form = field.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => {
      setOwn(fit(defaultValue, { min, max, wrap }));
      setDraft(null);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value, min, max, wrap]);

  function set(next: number) {
    const angle = fit(next, range);
    if (value === undefined) setOwn(angle);
    if (angle !== current) onValueChange?.(angle);
  }

  /** The angle under a pointer, held to the grid of `step`, or of `snap` while Shift is down. */
  function under(event: PointerEvent<HTMLDivElement>): number {
    const box = event.currentTarget.getBoundingClientRect();
    const raw = pointerAngle(event.clientX - (box.left + box.width / 2), event.clientY - (box.top + box.height / 2));
    return snapTo(fromPointer(raw, range, current), event.shiftKey ? snap : step);
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    held.current = false;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function dialKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const { key } = event;
    const direction = key === "ArrowRight" || key === "ArrowUp" || key === "PageUp" ? 1 : key === "ArrowLeft" || key === "ArrowDown" || key === "PageDown" ? -1 : 0;
    let next: number | undefined;
    if (direction) next = event.shiftKey || key.startsWith("Page") ? nextOnGrid(current, direction, snap) : current + direction * step;
    else if (key === "Home") next = min <= 0 && max >= 0 ? 0 : min;
    else if (key === "End") next = wrap ? max - step : max;
    if (next === undefined) return;
    event.preventDefault();
    set(next);
  }

  function commit() {
    if (draft === null) return;
    const typed = parseAngle(draft);
    if (typed !== null) set(typed);
    setDraft(null);
  }

  function numberKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const from = (draft !== null ? parseAngle(draft) : null) ?? current;
      const direction = event.key === "ArrowUp" ? 1 : -1;
      setDraft(null);
      set(event.shiftKey ? nextOnGrid(from, direction, snap) : from + direction * step);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit();
      event.currentTarget.select();
    } else if (event.key === "Escape" && draft !== null) {
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  }

  return (
    <div data-slot="angle-field" data-disabled={disabled || undefined} aria-disabled={disabled || undefined} className={cn("flex items-center gap-4", disabled && "opacity-50", className)} {...props}>
      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={spokenAngle(current, locale, compass)}
        aria-disabled={disabled || undefined}
        data-dragging={dragging || undefined}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          held.current = true;
          setDragging(true);
          event.currentTarget.focus();
          set(under(event));
        }}
        onPointerMove={(event) => {
          if (held.current) set(under(event));
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={dialKeyDown}
        className={cn(
          "relative shrink-0 touch-none rounded-full outline-none select-none",
          "transition-shadow duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
          disabled ? "cursor-not-allowed" : "cursor-grab data-[dragging]:cursor-grabbing",
          DIAL[size],
        )}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="size-full overflow-visible">
          <circle cx="50" cy="50" r="42" strokeWidth="1.5" className="fill-background stroke-input" />
          {MARKS.map((degrees) => (
            <line
              key={degrees}
              x1="50"
              y1="20"
              x2="50"
              y2={degrees % 90 === 0 ? 27 : 24.5}
              transform={`rotate(${degrees} 50 50)`}
              strokeWidth="1.8"
              strokeLinecap="round"
              className={degrees % 90 === 0 ? "stroke-muted-foreground/60" : "stroke-muted-foreground/30"}
            />
          ))}
          <g transform={`rotate(${current} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="12" strokeWidth="2" strokeLinecap="round" className="stroke-foreground" />
            {dragging ? <circle cx="50" cy="8" r="13" className="fill-foreground/10" /> : null}
            <circle cx="50" cy="8" r="7" strokeWidth="2.5" className="fill-foreground stroke-background" />
          </g>
          <circle cx="50" cy="50" r="4" strokeWidth="2" className="fill-foreground stroke-background" />
        </svg>
      </div>
      <div className="grid min-w-0 gap-1.5">
        <InputGroup className="w-24 pointer-coarse:h-11">
          <InputGroupInput
            ref={field}
            id={id}
            type="text"
            role="spinbutton"
            inputMode="decimal"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={disabled}
            aria-label={`${label} in degrees`}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={current}
            aria-valuetext={spokenAngle(current, locale, compass)}
            value={draft ?? formatAngle(current, locale)}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => {
              const text = event.target.value.replace(/[^\d.,+-]/g, "").slice(0, 8);
              setDraft(text);
              // The dial follows the typing, so the person sees where the number goes; the box itself is only tidied when it is left.
              const typed = parseAngle(text);
              if (typed !== null) set(typed);
            }}
            onBlur={commit}
            onKeyDown={numberKeyDown}
            className="pr-0 text-right tabular-nums"
          />
          <InputGroupAddon aria-hidden="true" className="pr-3 pl-0 text-sm">
            &deg;
          </InputGroupAddon>
        </InputGroup>
        {compass ? (
          <p aria-hidden="true" className="text-xs text-muted-foreground capitalize">
            {compassName(current)}
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={current} disabled={disabled} /> : null}
    </div>
  );
}
