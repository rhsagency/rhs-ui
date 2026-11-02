"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { IconChevronDown, IconPipette } from "@rhs-ui/icons";
import {
  clamp,
  contrastRatio,
  DEFAULT_LABELS,
  formatColor,
  parseColor,
  sameColor,
  toRgb,
  verdictOf,
  type ColorAreaLabels,
  type ColorFormat,
  type Hsva,
} from "@rhs-ui/primitives/color-area-picker/colors";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { ColorAreaLabels, ColorFormat, Hsva } from "@rhs-ui/primitives/color-area-picker/colors";

export interface ColorAreaPickerProps {
  /** The colour, when you control it: a code in any format the picker reads, or `{ h, s, v, a }`. */
  value?: string | Hsva;
  /** The colour to start with, when you do not control it. Default #2563eb. */
  defaultValue?: string | Hsva;
  /** Called on every change with the colour written in `format` and as `{ h, s, v, a }` (hue in degrees, saturation and brightness in percent, alpha 0 to 1), which keeps the hue of a grey that a code cannot. */
  onValueChange?: (value: string, color: Hsva) => void;
  /** How the code is shown in the box and reported: `hex` (#2563eb), `rgb` or `hsl`. Any of them can be typed whatever the format. Default hex. */
  format?: ColorFormat;
  /** Add the opacity slider. The code then carries the alpha: eight hex digits, rgba() or hsla(). Default false. */
  alpha?: boolean;
  /** Preset colours in a row under the area, as codes. */
  swatches?: readonly string[];
  /** Show the picker in the page instead of behind a button. Default false. */
  inline?: boolean;
  /** The name of the picker, for screen readers and the button. Default "Colour". */
  label?: string;
  /** The id of the control: the button, or the saturation and brightness area when the picker is inline. A form label's `htmlFor` can point at it. */
  id?: string;
  /** Marks the picker as holding a colour that is not accepted: the button or the area gets the error border and says so to assistive technology. Form libraries set it through `FormControl`. */
  "aria-invalid"?: boolean | "true" | "false";
  /** The ids of the elements that describe the picker, such as a hint or an error line. They go on the button, or on the area when the picker is inline. */
  "aria-describedby"?: string;
  /** Another way to give the picker its name, in place of `label`. */
  "aria-label"?: string;
  /** The id of the element that names the picker, usually a visible label. The button adds the colour to it. */
  "aria-labelledby"?: string;
  /** The field's name for a plain form submit: the colour as it is reported. */
  name?: string;
  /** Dim the picker and stop it responding. */
  disabled?: boolean;
  /** The words the picker says, for another language or your own voice. */
  labels?: Partial<ColorAreaLabels>;
  /** Classes for the root element: the button, or the panel when it is inline. */
  className?: string;
}

const FALLBACK: Hsva = { h: 221, s: 84, v: 92, a: 1 };
const HUES = "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))";
/** A quiet checkerboard, so transparency can be seen in the neutral tones of the theme. */
const CHECKER = "bg-background bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-[length:10px_10px]";
/** A hairline round a colour, in the theme's own ink so a black swatch still has an edge in the dark. It is drawn over the colour layers, not under them. */
const FRAME = "relative overflow-hidden after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-foreground/15 after:ring-inset";
/** The slider's own box is only 16px tall: this widens what a finger can hit without moving anything. */
const REACH = "before:absolute before:inset-x-0 before:-inset-y-1.5";
const THUMB =
  "block size-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.35)] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/60 data-[disabled]:cursor-not-allowed";

interface EyeDropperLike {
  open: () => Promise<{ sRGBHex: string }>;
}

const toHsva = (value: string | Hsva, hue = 0): Hsva => (typeof value === "string" ? (parseColor(value, hue) ?? FALLBACK) : value);
const keyOf = (value: string | Hsva | undefined) => (value === undefined ? "" : typeof value === "string" ? value : `${value.h},${value.s},${value.v},${value.a}`);
const rgbCss = (color: Hsva) => `rgb(${toRgb({ ...color, a: 1 }).join(" ")})`;
const rgbaCss = (color: Hsva) => `rgb(${toRgb(color).join(" ")} / ${color.a})`;

/**
 * Any colour, not just swatches. A two-way area sets saturation across and
 * brightness up, a hue slider sits under it, an opacity slider (over a quiet
 * checkerboard) comes with `alpha`, and a code box takes #rgb, #rrggbb,
 * #rrggbbaa, rgb() and hsl(). The area is a two-axis slider: the arrow keys
 * move 1%, Shift 10%, Home and End go to the left and right edge, Page Up and
 * Page Down to the top and bottom, and a screen reader hears "Saturation 80%,
 * brightness 60%". The chosen colour is shown beside its code, with its
 * contrast against white and against black said in words. It keeps the hue
 * when you drag into black, white or grey, where a code has none. Behind a
 * button like Color picker, or in the page with `inline`; the eye dropper
 * button shows only where the browser has one.
 */
export function ColorAreaPicker({
  value,
  defaultValue = "#2563eb",
  onValueChange,
  format = "hex",
  alpha = false,
  swatches = [],
  inline = false,
  label,
  id,
  "aria-invalid": ariaInvalid,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  name,
  disabled,
  labels: labelOverrides,
  className,
}: ColorAreaPickerProps) {
  const uid = useId();
  const valueId = `${uid}-value`;
  const labels: ColorAreaLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const heading = ariaLabel ?? label ?? labels.colour;
  const rejected = ariaInvalid === true || ariaInvalid === "true";
  const [own, setOwn] = useState<Hsva>(() => toHsva(value ?? defaultValue));
  const [synced, setSynced] = useState(keyOf(value));
  const [draft, setDraft] = useState<string | null>(null);
  const [eyeDropper, setEyeDropper] = useState(false);

  // A colour that arrives from outside replaces the one in use, unless it is only the same colour again; the hue of a grey is kept that way.
  const incoming = keyOf(value);
  if (value !== undefined && incoming !== synced) {
    setSynced(incoming);
    const next = toHsva(value, own.h);
    if (!sameColor(next, own)) setOwn(next);
  }
  const color: Hsva = { ...own, a: alpha ? own.a : 1 };

  // The eye dropper is a browser feature: it is looked for after mounting, so the server and the first paint agree.
  useEffect(() => setEyeDropper("EyeDropper" in window), []);

  const code = formatColor(color, format, alpha);

  function apply(next: Hsva) {
    const settled: Hsva = { h: clamp(next.h, 0, 360), s: clamp(next.s, 0, 100), v: clamp(next.v, 0, 100), a: alpha ? clamp(next.a, 0, 1) : 1 };
    setOwn(settled);
    onValueChange?.(formatColor(settled, format, alpha), settled);
  }

  function type(text: string) {
    setDraft(text);
    const parsed = parseColor(text, color.h);
    if (parsed) apply(parsed);
  }

  function settle() {
    if (draft === null) return;
    const parsed = parseColor(draft, color.h);
    if (parsed) apply(parsed);
    setDraft(null);
  }

  async function pick() {
    const Dropper = (window as unknown as { EyeDropper?: new () => EyeDropperLike }).EyeDropper;
    if (!Dropper) return;
    try {
      const { sRGBHex } = await new Dropper().open();
      const parsed = parseColor(sRGBHex, color.h);
      if (parsed) apply(parsed);
    } catch {
      // The picker was cancelled with Escape: nothing to do.
    }
  }

  /** Moves the two-axis handle to where the pointer is. */
  function point(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    apply({ ...color, s: ((event.clientX - box.left) / box.width) * 100, v: (1 - (event.clientY - box.top) / box.height) * 100 });
  }

  function steer(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    const s = Math.round(color.s);
    const v = Math.round(color.v);
    const moves: Record<string, Partial<Hsva>> = {
      ArrowRight: { s: s + step },
      ArrowLeft: { s: s - step },
      ArrowUp: { v: v + step },
      ArrowDown: { v: v - step },
      Home: { s: 0 },
      End: { s: 100 },
      PageUp: { v: 100 },
      PageDown: { v: 0 },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    apply({ ...color, ...move });
  }

  const [r, g, b] = toRgb(color);
  const invalid = draft !== null && draft.trim() !== "" && parseColor(draft) === null;
  const contrasts = [
    { against: labels.white, ratio: contrastRatio([r, g, b], [255, 255, 255]), text: "#ffffff" },
    { against: labels.black, ratio: contrastRatio([r, g, b], [0, 0, 0]), text: "#000000" },
  ];
  const presets = swatches.flatMap((swatch) => {
    const parsed = parseColor(swatch);
    return parsed ? [{ swatch, parsed }] : [];
  });
  const marked = presets.findIndex((preset) => sameColor(preset.parsed, color));

  function walk(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const by = moves[event.key];
    if (by === undefined) return;
    event.preventDefault();
    const next = presets[(index + by + presets.length) % presets.length];
    if (!next) return;
    apply(next.parsed);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=radio]")[(index + by + presets.length) % presets.length]?.focus();
  }

  const panel = (
    <div
      role={inline ? "group" : undefined}
      aria-label={inline && !labelledBy ? heading : undefined}
      aria-labelledby={inline ? labelledBy : undefined}
      // Below 17rem the colour tile beside the code gives way to the code, so a long rgba() or hsla() still shows its alpha on the smallest phone.
      className="@container grid gap-3.5"
    >
      <div
        role="slider"
        id={inline ? id : undefined}
        tabIndex={disabled ? -1 : 0}
        aria-roledescription="2D slider"
        aria-label={labels.area}
        aria-invalid={inline && rejected ? true : undefined}
        aria-describedby={inline ? describedBy : undefined}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(color.s)}
        aria-valuetext={labels.areaValue(Math.round(color.s), Math.round(color.v))}
        aria-disabled={disabled || undefined}
        onKeyDown={disabled ? undefined : steer}
        onPointerDown={(event) => {
          if (disabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          point(event);
        }}
        onPointerMove={(event) => {
          if (!disabled && event.currentTarget.hasPointerCapture(event.pointerId)) point(event);
        }}
        className={cn(
          "relative h-40 w-full cursor-crosshair touch-none rounded-md outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:ring-2 aria-invalid:ring-destructive/70",
          disabled && "cursor-not-allowed opacity-50",
        )}
        style={{ backgroundColor: `hsl(${color.h} 100% 50%)` }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-foreground/15 ring-inset"
          style={{ backgroundImage: "linear-gradient(to top, #000, rgba(0,0,0,0)), linear-gradient(to right, #fff, rgba(255,255,255,0))" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.35)]"
          style={{ left: `${color.s}%`, top: `${100 - color.v}%`, backgroundColor: rgbCss(color) }}
        />
      </div>
      <SliderPrimitive.Root
        min={0}
        max={360}
        step={1}
        value={[Math.round(color.h)]}
        disabled={disabled}
        onValueChange={([hue]) => apply({ ...color, h: hue ?? color.h })}
        className={cn("relative flex h-4 w-full touch-none items-center select-none data-[disabled]:opacity-50", REACH)}
      >
        <SliderPrimitive.Track className="relative h-3 grow rounded-full ring-1 ring-foreground/15 ring-inset" style={{ backgroundImage: HUES }} />
        <SliderPrimitive.Thumb aria-label={labels.hue} aria-valuetext={labels.hueValue(Math.round(color.h))} className={THUMB} style={{ backgroundColor: `hsl(${color.h} 100% 50%)` }} />
      </SliderPrimitive.Root>
      {alpha ? (
        <SliderPrimitive.Root
          min={0}
          max={100}
          step={1}
          value={[Math.round(color.a * 100)]}
          disabled={disabled}
          onValueChange={([percent]) => apply({ ...color, a: (percent ?? color.a * 100) / 100 })}
          className={cn("relative flex h-4 w-full touch-none items-center select-none data-[disabled]:opacity-50", REACH)}
        >
          <SliderPrimitive.Track className={cn("h-3 grow rounded-full", FRAME, CHECKER)}>
            <span aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: `linear-gradient(to right, transparent, ${rgbCss(color)})` }} />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb aria-label={labels.opacity} aria-valuetext={labels.opacityValue(Math.round(color.a * 100))} className={THUMB} style={{ backgroundColor: rgbCss(color) }} />
        </SliderPrimitive.Root>
      ) : null}
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className={cn("size-9 shrink-0 rounded-md @max-[17rem]:hidden", FRAME, CHECKER)}>
          <span className="absolute inset-0" style={{ backgroundColor: rgbaCss(color) }} />
        </span>
        {/* The eye dropper sits inside the box, so the code has the whole row: rgba(37, 99, 235, 0.6) and hsla(221, 83%, 53%, 0.6) are the longest thing it holds. */}
        <div className="relative min-w-0 flex-1">
          <Input
            aria-label={labels.code}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? `${uid}-invalid` : undefined}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="none"
            disabled={disabled}
            value={draft ?? code}
            onChange={(event) => type(event.target.value)}
            onBlur={settle}
            onKeyDown={(event) => {
              if (event.key === "Enter") settle();
            }}
            className={cn("font-mono text-xs tracking-tight tabular-nums", eyeDropper ? "pr-9 pl-2.5" : "px-2.5")}
          />
          {eyeDropper ? (
            <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={pick} aria-label={labels.eyeDropper} className="absolute inset-y-0 right-1 my-auto size-7 text-muted-foreground hover:text-foreground">
              <IconPipette />
            </Button>
          ) : null}
        </div>
      </div>
      <div role="status">
        {invalid ? (
          <p id={`${uid}-invalid`} className="-mt-1.5 text-xs text-destructive">
            {labels.invalid(format)}
          </p>
        ) : null}
      </div>
      {presets.length > 0 ? (
        <div role="radiogroup" aria-label={labels.swatches} className="flex flex-wrap gap-2">
          {presets.map((preset, index) => {
            const selected = index === marked;
            return (
              <button
                key={preset.swatch}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={preset.swatch}
                disabled={disabled}
                tabIndex={selected || (marked === -1 && index === 0) ? 0 : -1}
                onClick={() => apply(preset.parsed)}
                onKeyDown={(event) => walk(event, index)}
                // The choice is an outline with a gap, so it shows whatever the picker sits on; the keyboard's focus is a soft ring outside it.
                className={cn(
                  "size-6 rounded-full ring-1 ring-foreground/15 ring-inset outline-2 outline-offset-2 transition-[outline-color,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
                  "focus-visible:shadow-[0_0_0_6px_color-mix(in_oklch,var(--ring)_35%,transparent)]",
                  selected ? "outline-foreground" : "outline-transparent hover:outline-foreground/25",
                )}
                style={{ backgroundColor: rgbaCss(preset.parsed) }}
              />
            );
          })}
        </div>
      ) : null}
      <ul className="grid gap-1.5 border-t border-border pt-3.5">
        {contrasts.map((item) => {
          const ratio = `${(Math.floor(item.ratio * 10) / 10).toFixed(1)}:1`;
          return (
            <li key={item.against} className="flex items-center gap-2.5 text-xs text-muted-foreground">
              {/* A sample of the text, drawn as generated content: it is there to be seen next to the verdict in words, not read. */}
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-md text-[0.8125rem] font-semibold ring-1 ring-foreground/15 ring-inset before:content-['Aa']"
                style={{ backgroundColor: rgbCss(color), color: item.text }}
              />
              <span className="min-w-0 tabular-nums">{labels.contrast(item.against, ratio, verdictOf(item.ratio, labels.verdicts))}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const hidden = name ? <input type="hidden" name={name} value={code} disabled={disabled} /> : null;

  if (inline) {
    return (
      <div data-slot="color-area-picker" className={cn("w-full max-w-sm", className)}>
        {panel}
        {hidden}
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger
        data-slot="color-area-picker"
        id={id}
        disabled={disabled}
        aria-invalid={rejected ? true : undefined}
        aria-describedby={describedBy}
        aria-label={labelledBy ? undefined : `${heading}: ${code}`}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
        className={cn(
          "inline-flex h-9 max-w-full items-center gap-2.5 rounded-md border border-input bg-background pr-2.5 pl-1.5 text-sm shadow-xs outline-none transition-[border-color,box-shadow] duration-150 hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_18%)] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/30 data-[state=open]:border-ring motion-reduce:transition-none",
          className,
        )}
      >
        <span aria-hidden="true" className={cn("size-6 shrink-0 rounded-sm", FRAME, CHECKER)}>
          <span className="absolute inset-0" style={{ backgroundColor: rgbaCss(color) }} />
        </span>
        {/* The code never wraps, however long: an rgba() or hsla() code keeps its alpha on one line, and shrinks with an ellipsis only when there is truly no room. */}
        <span id={valueId} className="min-w-0 truncate font-mono text-xs tracking-tight whitespace-nowrap tabular-nums">
          {code}
        </span>
        <IconChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={labelledBy ? undefined : heading} aria-labelledby={labelledBy} className="w-[21rem] max-w-[calc(100vw-2rem)]">
        {panel}
      </PopoverContent>
      {hidden}
    </Popover>
  );
}
