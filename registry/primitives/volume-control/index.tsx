"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";
import { Slider as SliderPrimitive } from "radix-ui";

import { IconChevronUp, IconVolume, IconVolumeLow, IconVolumeOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { DEFAULT_VOLUME_LABELS, percentOf, say, speakerFor, type VolumeLabels } from "@rhs-ui/primitives/volume-control/levels";
import { cn } from "@/lib/utils";

export type { VolumeLabels } from "@rhs-ui/primitives/volume-control/levels";

export interface VolumeControlProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** The level from 0 to 1. Pass it, with `onChange`, to control the volume. */
  value?: number;
  /** The level to start at when you do not control it. Default 0.7. */
  defaultValue?: number;
  /** Whether the sound is muted. Muting keeps `value`, so unmuting brings the level back. */
  muted?: boolean;
  /** Whether to start muted when you do not control it. */
  defaultMuted?: boolean;
  /** Called with the new level, 0 to 1, while the slider moves and for each key press. Set `media.volume` here. */
  onChange?: (value: number) => void;
  /** Called when the button or the M key mutes or unmutes, and when moving the slider unmutes. Set `media.muted` here. */
  onMutedChange?: (muted: boolean) => void;
  /** The slider goes into a popover, upright, behind a small button next to the mute button: for a control bar with no room to spare. */
  compact?: boolean;
  /** The distance between levels, as a fraction. Default 0.05, so the arrow keys move 5 percent. */
  step?: number;
  /** Write the level as a number next to the slider ("60%"). In compact mode it is in the popover. */
  showValue?: boolean;
  /** Turn the control off. */
  disabled?: boolean;
  /** The words of the control, for another language. */
  labels?: Partial<VolumeLabels>;
}

/** Where a level goes back to when it is unmuted from nothing, and nothing was ever louder. */
const FALLBACK_LEVEL = 0.5;
/** The keys that move the slider up and down, as the slider itself reads them. */
const FORWARD_KEYS = ["ArrowUp", "ArrowRight", "PageUp"];
const BACK_KEYS = ["ArrowDown", "ArrowLeft", "PageDown"];

const TRACK = "relative grow overflow-hidden rounded-full bg-foreground/10 data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1";
const RANGE = "absolute rounded-full bg-foreground data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full";
const THUMB = cn(
  "relative block size-3 rounded-full bg-foreground shadow-[0_0_0_2px_var(--background)] outline-none",
  "transition-[transform,box-shadow] duration-150 hover:scale-125 focus-visible:scale-125 motion-reduce:transition-none",
  "focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_6px_color-mix(in_oklch,var(--ring)_55%,transparent)]",
  // The part you see is 12px; the part that answers a finger is 28.
  "before:absolute before:-inset-2 before:content-['']",
);

/**
 * A mute button and a volume slider for any audio or video player. The
 * speaker on the button shows muted, low or high, the label flips between
 * Mute and Unmute, and muting keeps the level, so unmuting puts it back; from
 * a level of nothing it goes back to the last audible one. Up and Down
 * arrows move the level 5 percent (Left and Right too, Page keys by half),
 * M mutes and unmutes from the button or the slider, and a screen reader
 * hears "Volume 60 percent". Moving the slider while muted unmutes. With
 * `compact` the slider stands upright in a popover behind a small button.
 * You bring the player: set `media.volume` in `onChange` and `media.muted` in
 * `onMutedChange`, or let the control keep its own state.
 */
export function VolumeControl({
  value,
  defaultValue = 0.7,
  muted: mutedProp,
  defaultMuted = false,
  onChange,
  onMutedChange,
  compact = false,
  step = 0.05,
  showValue = false,
  disabled = false,
  labels: labelOverrides,
  className,
  onKeyDown,
  ...props
}: VolumeControlProps) {
  const text: VolumeLabels = { ...DEFAULT_VOLUME_LABELS, ...labelOverrides };
  const [ownLevel, setOwnLevel] = useState(defaultValue);
  const [ownMuted, setOwnMuted] = useState(defaultMuted);
  const [open, setOpen] = useState(false);
  const level = Math.min(1, Math.max(0, value ?? ownLevel));
  const muted = mutedProp ?? ownMuted;
  const silent = muted || percentOf(level) === 0;
  // The last level that could be heard: what unmuting brings back, also when the slider was dragged to nothing.
  const audible = useRef(level > 0 ? level : FALLBACK_LEVEL);
  useEffect(() => {
    if (level > 0) audible.current = level;
  }, [level]);

  function setLevel(next: number) {
    if (value === undefined) setOwnLevel(next);
    onChange?.(next);
  }

  function setMuted(next: boolean) {
    if (mutedProp === undefined) setOwnMuted(next);
    onMutedChange?.(next);
  }

  /** The slider moved. A move away from nothing is also an unmute. */
  function move(next: number) {
    const clean = Math.min(1, Math.max(0, Math.round(next * 100) / 100));
    setLevel(clean);
    if (muted && clean > 0) setMuted(false);
  }

  function toggle() {
    if (disabled) return;
    if (!silent) return setMuted(true);
    if (percentOf(level) === 0) setLevel(audible.current);
    if (muted) setMuted(false);
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "m" || event.key === "M") {
      event.preventDefault();
      toggle();
    }
  }

  /**
   * A muted slider shows nothing, so a key would step from 0 and land on 5 percent. Step from the level that was muted instead,
   * in either direction, and unmute: the same as a press on the slider.
   */
  function stepFromMuted(event: KeyboardEvent<HTMLSpanElement>) {
    if (!muted || percentOf(level) === 0 || event.altKey || event.ctrlKey || event.metaKey) return;
    const direction = FORWARD_KEYS.includes(event.key) ? 1 : BACK_KEYS.includes(event.key) ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    move(level + direction * step * (event.shiftKey || event.key.startsWith("Page") ? 10 : 1));
  }

  const percent = percentOf(silent ? 0 : level);
  const spoken = muted ? text.muted : say(text.level, percentOf(level));
  const Speaker = { off: IconVolumeOff, low: IconVolumeLow, high: IconVolume }[speakerFor(level, muted)];

  const mute = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      aria-label={silent ? text.unmute : text.mute}
      onClick={toggle}
      className={compact ? "rounded-r-none" : undefined}
    >
      <Speaker className="size-4" />
    </Button>
  );

  const slider = (vertical: boolean) => (
    <SliderPrimitive.Root
      data-slot="volume-slider"
      min={0}
      max={1}
      step={step}
      value={[silent ? 0 : level]}
      onValueChange={([next]) => move(next ?? 0)}
      onKeyDown={stepFromMuted}
      orientation={vertical ? "vertical" : "horizontal"}
      disabled={disabled}
      className={cn(
        "relative flex touch-none items-center select-none data-[disabled]:opacity-50",
        vertical ? "h-28 w-6 flex-col justify-center" : "h-6 min-w-0 flex-1",
      )}
    >
      <SliderPrimitive.Track className={TRACK}>
        <SliderPrimitive.Range className={RANGE} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb aria-label={text.volume} aria-valuetext={spoken} className={THUMB} />
    </SliderPrimitive.Root>
  );

  const number = showValue ? (
    <span aria-hidden="true" className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
      {percent}%
    </span>
  ) : null;

  if (compact) {
    return (
      <div
        data-slot="volume-control"
        data-state={silent ? "muted" : "on"}
        data-compact=""
        onKeyDown={key}
        className={cn("inline-flex items-center rounded-md border border-border bg-background shadow-xs", className)}
        {...props}
      >
        {mute}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={text.adjust} className="w-6 rounded-l-none border-l-border px-0 text-muted-foreground">
              <IconChevronUp className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" sideOffset={8} aria-label={text.volume} className="grid w-auto justify-items-center gap-2 px-2.5 py-3">
            {showValue ? <span className="text-xs font-medium text-foreground tabular-nums">{percent}%</span> : null}
            {slider(true)}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    // The gap keeps the thumb of a muted slider (at the far left) 24px clear of the speaker button, which touch targets need.
    <div data-slot="volume-control" data-state={silent ? "muted" : "on"} onKeyDown={key} className={cn("flex w-44 max-w-full items-center gap-2", className)} {...props}>
      {mute}
      {slider(false)}
      {number}
    </div>
  );
}
