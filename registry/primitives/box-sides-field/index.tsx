"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconLink } from "@rhs-ui/icons";
import {
  clamp,
  FIELD_NAMES,
  FOUR,
  formatSpacing,
  parseSpacing,
  spokenUnit,
  tidy,
  TWO,
  valueOf,
  withField,
  ZERO,
  type BoxSides,
  type FieldKey,
} from "@rhs-ui/primitives/box-sides-field/sides";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

export type { BoxSides } from "@rhs-ui/primitives/box-sides-field/sides";

export interface BoxSidesFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The four sides, when you control them. */
  value?: BoxSides;
  /** The sides to start with, when you do not control the field. Default 0 on all four. */
  defaultValue?: BoxSides;
  /** Called with `{ top, right, bottom, left }` and whether the sides are linked. Every side is inside `min` and `max`; with two fields the top equals the bottom and the left equals the right. */
  onValueChange?: (value: BoxSides, linked: boolean) => void;
  /** Whether the sides are linked, when you control it. With the link on, changing one side sets all four. */
  linked?: boolean;
  /** Whether the sides start linked, when you do not control the link. Default false. */
  defaultLinked?: boolean;
  /** Called when the link is switched on or off. */
  onLinkedChange?: (linked: boolean) => void;
  /** The unit shown after each number, such as "px" or "rem". It is read out in words with each number. Default "px". */
  unit?: string;
  /** The smallest value of a side. Default 0. */
  min?: number;
  /** The largest value of a side. Default 9999. */
  max?: number;
  /** What an arrow key adds or takes away; with Shift or Page Up and Page Down it is ten times as much. Default 1. */
  step?: number;
  /** What the box is: "Padding", "Margin". A screen reader reads it as the name of the group and before each side. Default "Spacing". */
  label?: string;
  /** Four fields (top, right, bottom, left), or two (vertical, which sets the top and the bottom, and horizontal, which sets the left and the right). Default 4. */
  sides?: 4 | 2;
  /** The locale that writes the numbers and their decimal sign. Default "en-US". */
  locale?: string;
  /** The field's name for a plain form submit: `<name>-top`, `<name>-right`, `<name>-bottom` and `<name>-left` go out in hidden inputs. */
  name?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
}

// Where each field sits in the little box: on the edge it sets.
const PLACE: Record<FieldKey, string> = {
  top: "col-start-2 row-start-1",
  vertical: "col-start-2 row-start-1",
  right: "col-start-3 row-start-2",
  bottom: "col-start-2 row-start-3",
  left: "col-start-1 row-start-2",
  horizontal: "col-start-1 row-start-2",
};

// A number box is 72px wide; in a field narrower than 238px (a small phone, an editor's inspector) it is 56px, and the whole box still fits from about 200px.
const EDGE = "flex h-8 pointer-coarse:h-10 w-[4.5rem] items-center justify-center gap-0.5 rounded-md px-1.5 text-sm tabular-nums @max-[14.875rem]:w-14 @max-[14.875rem]:px-1";

interface SideFieldProps {
  name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  locale: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: number) => void;
}

/** One number on one edge: typed live, tidied when it is left, stepped with the arrow keys. */
function SideField({ name, value, unit, min, max, step, locale, disabled, className, onChange }: SideFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const text = draft ?? formatSpacing(value, locale);

  const apply = (raw: number) => onChange(tidy(clamp(raw, min, max)));

  function commit() {
    if (draft === null) return;
    const typed = parseSpacing(draft);
    if (typed !== null) apply(typed);
    setDraft(null);
  }

  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const { key } = event;
    if (key === "ArrowUp" || key === "ArrowDown" || key === "PageUp" || key === "PageDown") {
      event.preventDefault();
      const size = step * (event.shiftKey || key.startsWith("Page") ? 10 : 1);
      const from = (draft !== null ? parseSpacing(draft) : null) ?? value;
      setDraft(null);
      apply(from + (key === "ArrowUp" || key === "PageUp" ? size : -size));
    } else if (key === "Enter") {
      event.preventDefault();
      commit();
      event.currentTarget.select();
    } else if (key === "Escape" && draft !== null) {
      event.preventDefault();
      event.stopPropagation();
      setDraft(null);
    }
  }

  return (
    <div
      onClick={() => input.current?.focus()}
      className={cn(
        EDGE,
        "cursor-text border border-input bg-background shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        ref={input}
        type="text"
        role="spinbutton"
        inputMode="decimal"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        disabled={disabled}
        aria-label={name}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${formatSpacing(value, locale)} ${spokenUnit(unit, value)}`}
        value={text}
        style={{ width: `${Math.max(1, text.length)}ch` }}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const next = event.target.value.replace(/[^\d.,]/g, "").slice(0, 7);
          setDraft(next);
          // The box follows the typing; the number itself is only tidied when it is left.
          const typed = parseSpacing(next);
          if (typed !== null) apply(typed);
        }}
        onBlur={commit}
        onKeyDown={keyDown}
        className="min-w-0 bg-transparent text-right outline-none disabled:cursor-not-allowed"
      />
      <span aria-hidden="true" className="text-[0.6875rem] text-muted-foreground select-none">
        {unit}
      </span>
    </div>
  );
}

/**
 * Padding, margin or any four-sided number as a small box with a field on each edge and a link in the middle.
 * Switch the link on and changing one side sets all four; off, each side is its own. The sides are checked as
 * they are typed (a size outside `min` and `max` is brought to the nearest limit), the arrow keys step the
 * side the cursor is in (Shift for ten steps), and Tab goes clockwise from the top, so the order of the
 * fields on the screen is the order of the focus. With `sides={2}` the box has a vertical and a horizontal
 * field, the way a toolbar offers "padding x" and "padding y", and the other two edges show their mirror.
 * Each number is a spin button that reads, for example, "Padding top, 16 pixels", and the link is a real
 * toggle named "Link all sides".
 */
export function BoxSidesField({
  value,
  defaultValue = ZERO,
  onValueChange,
  linked,
  defaultLinked = false,
  onLinkedChange,
  unit = "px",
  min = 0,
  max = 9999,
  step = 1,
  label = "Spacing",
  sides = 4,
  locale = "en-US",
  name,
  disabled,
  className,
  ...props
}: BoxSidesFieldProps) {
  const [own, setOwn] = useState<BoxSides>(defaultValue);
  const [ownLinked, setOwnLinked] = useState(defaultLinked);
  const box = useRef<HTMLDivElement>(null);
  const current = value ?? own;
  const isLinked = linked ?? ownLinked;

  // A form that is reset puts an uncontrolled field back to the sides and the link it started with.
  useEffect(() => {
    const form = box.current?.closest("form");
    if (!form || (value !== undefined && linked !== undefined)) return;
    const reset = () => {
      if (value === undefined) setOwn(defaultValue);
      if (linked === undefined) setOwnLinked(defaultLinked);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, defaultLinked, value, linked]);
  const fields = sides === 2 ? TWO : FOUR;

  function edit(field: FieldKey, next: number) {
    const sidesNow = withField(current, field, next, isLinked);
    if (value === undefined) setOwn(sidesNow);
    onValueChange?.(sidesNow, isLinked);
  }

  function link(on: boolean) {
    if (linked === undefined) setOwnLinked(on);
    onLinkedChange?.(on);
  }

  return (
    <div data-slot="box-sides-field" role="group" aria-label={label} aria-disabled={disabled || undefined} data-linked={isLinked || undefined} className={cn("@container inline-grid w-[15.875rem] max-w-full", className)} {...props}>
      <div ref={box} className="grid grid-cols-[auto_minmax(3rem,1fr)_auto] grid-rows-[auto_minmax(3.5rem,1fr)_auto] items-center justify-items-center gap-2 rounded-xl border border-border bg-muted/40 p-2.5">
        <div aria-hidden="true" className="col-start-2 row-start-2 size-full rounded-lg border border-dashed border-input bg-background" />
        {fields.map((field) => (
          <SideField
            key={field}
            name={`${label} ${FIELD_NAMES[field]}`}
            value={valueOf(current, field)}
            unit={unit}
            min={min}
            max={max}
            step={step}
            locale={locale}
            disabled={disabled}
            className={PLACE[field]}
            onChange={(next) => edit(field, next)}
          />
        ))}
        {sides === 2 ? (
          <>
            <div aria-hidden="true" className={cn(EDGE, "col-start-2 row-start-3 border border-dashed border-border text-muted-foreground", disabled && "opacity-50")}>
              {formatSpacing(current.bottom, locale)}
              <span className="text-[0.6875rem]">{unit}</span>
            </div>
            <div aria-hidden="true" className={cn(EDGE, "col-start-3 row-start-2 border border-dashed border-border text-muted-foreground", disabled && "opacity-50")}>
              {formatSpacing(current.right, locale)}
              <span className="text-[0.6875rem]">{unit}</span>
            </div>
          </>
        ) : null}
        <Toggle
          variant="outline"
          size="sm"
          pressed={isLinked}
          onPressedChange={link}
          disabled={disabled}
          aria-label="Link all sides"
          title="Link all sides"
          className="relative col-start-2 row-start-2 size-8 min-w-8 px-0 pointer-coarse:size-10 pointer-coarse:min-w-10"
        >
          <IconLink size={16} />
        </Toggle>
      </div>
      {name ? (
        <>
          <input type="hidden" name={`${name}-top`} value={current.top} disabled={disabled} />
          <input type="hidden" name={`${name}-right`} value={current.right} disabled={disabled} />
          <input type="hidden" name={`${name}-bottom`} value={current.bottom} disabled={disabled} />
          <input type="hidden" name={`${name}-left`} value={current.left} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
