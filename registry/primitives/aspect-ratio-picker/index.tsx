"use client";

import { useId, useState, type ComponentProps, type CSSProperties } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconCheck } from "@rhs-ui/icons";
import {
  CUSTOM_LIMITS,
  DEFAULT_RATIOS,
  inOrientation,
  orientationOf,
  outlineSize,
  ratioLabel,
  reduceRatio,
  sameRatio,
  tileSpans,
  type AspectRatio,
  type Orientation,
} from "@rhs-ui/primitives/aspect-ratio-picker/ratios";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { RadioGroup } from "@rhs-ui/primitives/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { AspectRatio } from "@rhs-ui/primitives/aspect-ratio-picker/ratios";

export interface AspectRatioPickerProps extends Omit<ComponentProps<"div">, "value" | "defaultValue" | "onChange" | "children" | "dir" | "defaultChecked"> {
  /** The ratio, as `{ width: 16, height: 9 }`, when you control it. Any size is read as its ratio: 1920 by 1080 is 16 by 9. */
  value?: AspectRatio;
  /** The ratio to start with, when you do not control it. Default: 16:9 if it is on offer, otherwise the first one. */
  defaultValue?: AspectRatio;
  /** Called with the ratio in its lowest terms whenever the choice changes, also when the number fields of Custom change. */
  onValueChange?: (value: AspectRatio) => void;
  /** The shapes on offer, drawn in this order. Default 1:1, 4:3, 3:2, 16:9 and 9:16. */
  ratios?: readonly AspectRatio[];
  /** Add a last option, Custom, that reveals a width and a height. Default true. */
  allowCustom?: boolean;
  /** Add a landscape and portrait switch that turns every shape on its side. The list is then read as landscape shapes, so 16:9 and 9:16 are one. Default false. */
  orientationToggle?: boolean;
  /** The field's name for a plain form submit: the ratio goes out as "16:9" in a hidden input. */
  name?: string;
  /** The name of the group for a screen reader. Default "Aspect ratio". */
  label?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
}

const OUTLINE = 38;
const TILE =
  "group/tile flex min-w-0 flex-col items-center gap-2 rounded-lg border border-border bg-card px-2 pt-3 pb-2.5 text-foreground shadow-xs outline-none " +
  "[grid-column:span_var(--span-narrow)] @lg:[grid-column:span_var(--span-wide)] " +
  "transition-[background-color,border-color,box-shadow] duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 " +
  "data-[state=checked]:border-foreground data-[state=checked]:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

/** A shape drawn at its true proportion. Filled and checked once it is the one chosen. */
function Outline({ ratio, dashed }: { ratio: AspectRatio; dashed?: boolean }): React.JSX.Element {
  const size = outlineSize(ratio, OUTLINE);
  // The check has to fit inside the border: a very wide shape is a thin bar, and there it is only filled.
  const room = Math.min(size.width, size.height) - 4;
  const check = Math.min(12, Math.floor(room) - 2);
  return (
    <span aria-hidden="true" className="grid h-[2.375rem] w-full place-items-center">
      <span
        className={cn(
          "grid place-items-center rounded-[3px] border-2 border-muted-foreground/55 text-transparent transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none",
          "group-hover/tile:border-foreground/70",
          "group-data-[state=checked]/tile:border-foreground group-data-[state=checked]/tile:bg-foreground group-data-[state=checked]/tile:text-background",
          dashed && "border-dashed",
        )}
        style={{ width: size.width, height: size.height }}
      >
        {check >= 8 ? <IconCheck size={check} strokeWidth={2.75} /> : null}
      </span>
    </span>
  );
}

/** Both numbers must be whole numbers from 1 up; anything else is brought back to a number that can be a ratio. */
const fit = (value: number) => Math.min(CUSTOM_LIMITS.max, Math.max(CUSTOM_LIMITS.min, Math.round(value) || CUSTOM_LIMITS.min));

/**
 * Chooses the shape of a crop from outlines drawn at their true proportions,
 * with the ratio under each: 1:1, 4:3, 16:9, 9:16. It is a radio group, so the
 * arrow keys move and choose, Tab leaves, and the chosen outline is filled and
 * checked. A last option, Custom, reveals a width and a height; whatever is typed
 * is reduced, so 1920 by 1080 is reported as 16 by 9, and the outline of Custom
 * is drawn with it. An optional landscape and portrait switch turns every
 * shape on its side. For media uploads, ad formats and thumbnails, where a word
 * like "wide" means different things to different people.
 */
export function AspectRatioPicker({
  value,
  defaultValue,
  onValueChange,
  ratios = DEFAULT_RATIOS,
  allowCustom = true,
  orientationToggle = false,
  name,
  label = "Aspect ratio",
  disabled,
  className,
  ...props
}: AspectRatioPickerProps) {
  const base = useId();
  const [own, setOwn] = useState<AspectRatio>(() => defaultValue ?? ratios.find((ratio) => sameRatio(ratio, { width: 16, height: 9 })) ?? ratios[0] ?? { width: 16, height: 9 });
  const current = value ?? own;
  const [chosenCustom, setChosenCustom] = useState(false);
  // What the number fields hold: the sizes as typed, which may be bigger than the ratio they reduce to.
  const [size, setSize] = useState<AspectRatio>(() => (current.width > 0 && current.height > 0 ? current : { width: 16, height: 9 }));
  const [turned, setTurned] = useState<Orientation>(orientationOf(current));
  const [synced, setSynced] = useState(value);

  // A ratio that arrives from outside and is not the one the fields hold takes them over, and leaves Custom if it is on offer.
  if (value !== undefined && (value.width !== synced?.width || value.height !== synced?.height)) {
    setSynced(value);
    if (!sameRatio(value, size)) {
      setSize(value);
      setChosenCustom(false);
    }
  }

  // A square has no side to turn onto, so the switch keeps what was chosen; any other shape says which way it lies.
  const orientation: Orientation = current.width === current.height ? turned : orientationOf(current);

  // The list as drawn: as given, or all on the same side and each shape once.
  const seen = new Set<string>();
  const shapes = ratios
    .map((ratio) => (orientationToggle ? inOrientation(ratio, orientation) : ratio))
    .map((ratio) => reduceRatio(ratio.width, ratio.height))
    .filter((ratio) => !seen.has(ratioLabel(ratio)) && seen.add(ratioLabel(ratio)));

  const onOffer = shapes.find((ratio) => sameRatio(ratio, current));
  const custom = allowCustom && (chosenCustom || !onOffer);
  const selected = custom ? "custom" : onOffer ? ratioLabel(onOffer) : "";
  const reduced = reduceRatio(size.width, size.height);
  const tiles = shapes.length + (allowCustom ? 1 : 0);
  // The grid of each width: one row when it fits, otherwise two of nearly the same length, and a last row that is short is stretched so no cell is left empty.
  const narrow = tileSpans(tiles, tiles <= 4 ? tiles : Math.ceil(tiles / 2));
  const wide = tileSpans(tiles, tiles <= 6 ? tiles : Math.ceil(tiles / 2));
  const place = (index: number) => ({ "--span-narrow": narrow.spans[index] ?? 1, "--span-wide": wide.spans[index] ?? 1 }) as CSSProperties;

  function report(next: AspectRatio) {
    const lowest = reduceRatio(next.width, next.height);
    if (value === undefined) setOwn(lowest);
    onValueChange?.(lowest);
  }

  function choose(id: string) {
    if (id === "custom") {
      setChosenCustom(true);
      report(size);
      return;
    }
    const shape = shapes.find((ratio) => ratioLabel(ratio) === id);
    if (!shape) return;
    setChosenCustom(false);
    setSize(shape);
    report(shape);
  }

  function resize(next: AspectRatio) {
    setSize(next);
    report(next);
  }

  function turn(next: Orientation) {
    setTurned(next);
    // The sizes in the number fields turn with the ratio, so Custom never says 1920 by 800 while the value is 5:12.
    setSize(inOrientation(size, next));
    if (current.width !== current.height) report(inOrientation(current, next));
  }

  const widthId = `${base}-width`;
  const heightId = `${base}-height`;

  return (
    <div data-slot="aspect-ratio-picker" className={cn("@container grid w-full gap-3", className)} {...props}>
      {orientationToggle ? (
        <div className="flex items-center justify-between gap-3">
          <span id={`${base}-orientation`} className="text-xs text-muted-foreground">
            Orientation
          </span>
          <ToggleGroup
            type="single"
            size="sm"
            value={orientation}
            disabled={disabled}
            aria-labelledby={`${base}-orientation`}
            onValueChange={(next) => next && turn(next as Orientation)}
          >
            <ToggleGroupItem value="landscape" aria-label="Landscape">
              <span aria-hidden="true" className="block h-2.5 w-4 rounded-[2px] border-[1.5px] border-current" />
            </ToggleGroupItem>
            <ToggleGroupItem value="portrait" aria-label="Portrait">
              <span aria-hidden="true" className="block h-4 w-2.5 rounded-[2px] border-[1.5px] border-current" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ) : null}

      {/* The tiles sit in even rows: in one row when there is room, otherwise in two, never one tile alone on the last row. */}
      <RadioGroup
        aria-label={label}
        value={selected}
        onValueChange={choose}
        disabled={disabled}
        style={{ "--cols-narrow": narrow.columns, "--cols-wide": wide.columns } as CSSProperties}
        className="[grid-template-columns:repeat(var(--cols-narrow),minmax(0,1fr))] gap-2 @lg:[grid-template-columns:repeat(var(--cols-wide),minmax(0,1fr))]"
      >
        {shapes.map((ratio, index) => (
          <RadioGroupPrimitive.Item key={ratioLabel(ratio)} value={ratioLabel(ratio)} style={place(index)} className={TILE}>
            <Outline ratio={ratio} />
            <span className="text-xs leading-none font-medium tabular-nums">{ratioLabel(ratio)}</span>
          </RadioGroupPrimitive.Item>
        ))}
        {allowCustom ? (
          <RadioGroupPrimitive.Item value="custom" style={place(shapes.length)} className={TILE}>
            <Outline ratio={reduced} dashed />
            <span className="text-xs leading-none font-medium">Custom</span>
          </RadioGroupPrimitive.Item>
        ) : null}
      </RadioGroup>

      {allowCustom ? (
        <div
          inert={!custom || disabled}
          className={cn("grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none", custom ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3.5">
              {/* Where the field is narrower than a phone the plus and minus buttons go, so a number of five digits keeps its room; the arrow keys and typing still work. Narrower than that, the two numbers stack. */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2.5 gap-y-3 @max-[12rem]:grid-cols-1">
                <div className="grid gap-1.5">
                  <Label htmlFor={widthId} className="text-xs text-muted-foreground">
                    Width
                  </Label>
                  <NumberInput id={widthId} className="w-full min-w-0 @max-[22rem]:[&_button]:hidden" value={size.width} min={CUSTOM_LIMITS.min} max={CUSTOM_LIMITS.max} onValueChange={(width) => resize({ width: fit(width), height: size.height })} />
                </div>
                <span aria-hidden="true" className="pb-2 text-sm text-muted-foreground @max-[12rem]:hidden">
                  :
                </span>
                <div className="grid gap-1.5">
                  <Label htmlFor={heightId} className="text-xs text-muted-foreground">
                    Height
                  </Label>
                  <NumberInput id={heightId} className="w-full min-w-0 @max-[22rem]:[&_button]:hidden" value={size.height} min={CUSTOM_LIMITS.min} max={CUSTOM_LIMITS.max} onValueChange={(height) => resize({ width: size.width, height: fit(height) })} />
                </div>
              </div>
              <p role="status" className="text-xs text-muted-foreground tabular-nums">
                {size.width === reduced.width && size.height === reduced.height ? (
                  <>
                    Ratio <span className="font-medium text-foreground">{ratioLabel(reduced)}</span>
                  </>
                ) : (
                  <>
                    {size.width} by {size.height} is <span className="font-medium text-foreground">{ratioLabel(reduced)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {name ? <input type="hidden" name={name} value={ratioLabel(reduceRatio(current.width, current.height))} disabled={disabled} /> : null}
    </div>
  );
}
