"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps, type ReactElement, type RefObject } from "react";

import { IconChevronDown, IconMaximize, IconMinus, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface ZoomControlsLabels {
  /** The name of the group for screen readers. Default "Zoom". */
  group?: string;
  /** Default "Zoom in". */
  zoomIn?: string;
  /** Default "Zoom out". */
  zoomOut?: string;
  /** The name of the percentage button, followed by the level. Default "Zoom level". */
  level?: string;
  /** The fit action in the menu. Default "Fit to screen". */
  fit?: string;
  /** The tooltip of Zoom out at the lower limit; `{value}` is the limit. Default "Minimum zoom is {value}". */
  atMin?: string;
  /** The tooltip of Zoom in at the upper limit; `{value}` is the limit. Default "Maximum zoom is {value}". */
  atMax?: string;
  /** Said after a pause once the level settles; `{percent}` is the number. Default "Zoom {percent} percent". */
  announce?: string;
}

export interface ZoomControlsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The zoom as a scale, where 1 is 100 percent. Controlled. */
  value?: number;
  /** The starting scale when you do not control it. Default 1. */
  defaultValue?: number;
  /** Called with the new scale, already limited to `min` and `max`. */
  onValueChange?: (value: number) => void;
  /** The smallest scale. Zoom out is dimmed here, and its tooltip says why. Default 0.25. */
  min?: number;
  /** The largest scale. Default 4. */
  max?: number;
  /** How much one press of plus or minus adds or removes, as a scale. Default 0.25. */
  step?: number;
  /** The levels in the menu, in percent: `[50, 100, 200]`. Levels outside `min` and `max` are left out. */
  presets?: readonly number[];
  /** Adds "Fit to screen" to the menu. You know the size of the content, so you work out the scale and pass it to `onValueChange`. */
  onFit?: () => void;
  /** Ctrl or Cmd with plus, minus and zero, heard only while focus is inside `scope`, so the browser's own zoom keeps working everywhere else. Default true. */
  bindKeys?: boolean;
  /** The element whose focus the keys belong to: the viewer, the canvas, the map. Defaults to the parent of the controls. */
  scope?: RefObject<HTMLElement | null>;
  /** Button size: 28, 32 or 40px (44px on touch screens). */
  size?: "sm" | "md" | "lg";
  /** Which side of the controls the menu and the tooltips open on. Controls pinned to a bottom corner want `top`. Default "bottom". */
  side?: "top" | "bottom";
  /** The language of the percentages. Default "en-US". */
  locale?: string;
  /** The words used for names, tooltips and announcements. */
  labels?: ZoomControlsLabels;
}

const DEFAULT_PRESETS: readonly number[] = [50, 75, 100, 125, 150, 200, 300, 400];

const SQUARE = {
  sm: "size-7 [&_svg:not([class*='size-'])]:size-3.5 [@media(pointer:coarse)]:size-11",
  md: "size-8 [&_svg:not([class*='size-'])]:size-4 [@media(pointer:coarse)]:size-11",
  lg: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem] [@media(pointer:coarse)]:size-11",
} as const;

const WIDE = {
  sm: "h-7 min-w-[4.25rem] text-xs [@media(pointer:coarse)]:h-11",
  md: "h-8 min-w-[4.75rem] text-[0.8125rem] [@media(pointer:coarse)]:h-11",
  lg: "h-10 min-w-[5.25rem] text-sm [@media(pointer:coarse)]:h-11",
} as const;

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
// Float drift from repeated steps (0.1 + 0.2) would show as 30.000000000000004 percent.
const tidy = (n: number) => Math.round(n * 1000) / 1000;

function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setMac(/mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent));
  }, []);
  return mac;
}

interface StepProps {
  icon: ReactElement;
  label: string;
  /** What the tooltip says when the button is dimmed at a limit. */
  limitTip: string;
  keys: readonly string[];
  disabled: boolean;
  size: "sm" | "md" | "lg";
  /** Which end of the joined group the button is, for its corners. */
  placement: "start" | "end";
  /** Which side the tooltip opens on. */
  side: "top" | "bottom";
  /** True for a moment after its key ran, so a key press shows on the button it belongs to. */
  flashing: boolean;
  onPress: () => void;
}

function Step({ icon, label, limitTip, keys, disabled, size, placement, side, flashing, onPress }: StepProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={label}
          aria-disabled={disabled || undefined}
          // The name says it already; the tooltip adds the keys, or the reason it is dimmed.
          aria-describedby={undefined}
          data-flash={flashing || undefined}
          className={cn(
            SQUARE[size],
            "hover:z-10 focus-visible:z-10 active:not-disabled:translate-y-0 data-[flash=true]:bg-muted",
            "aria-disabled:cursor-default aria-disabled:opacity-45 aria-disabled:hover:border-border aria-disabled:hover:bg-background",
            placement === "start" ? "rounded-e-none" : "-ms-px rounded-s-none",
          )}
          onClick={(event) => {
            if (disabled) {
              event.preventDefault();
              return;
            }
            onPress();
          }}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side} className={cn(!disabled && "flex items-center gap-2.5")}>
        {disabled ? limitTip : label}
        {!disabled ? (
          <KbdGroup aria-hidden="true">
            {keys.map((key, index) => (
              <Kbd key={`${key}-${index}`} className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">
                {key}
              </Kbd>
            ))}
          </KbdGroup>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * One compact control for zooming an image, map, document or canvas: minus,
 * the level, plus. The level is a button that opens the presets with the
 * current one marked (and "Fit to screen" when you give it `onFit`); the steps
 * dim at the limits and the tooltip gives the reason. Ctrl or Cmd with plus,
 * minus and zero work while focus is inside the viewer, never elsewhere on the
 * page, and the level is announced as "Zoom 150 percent" once it settles, not
 * on every press. Tabular figures and a fixed minimum width keep the control
 * from changing size as the number does.
 */
export function ZoomControls({
  value,
  defaultValue = 1,
  onValueChange,
  min = 0.25,
  max = 4,
  step = 0.25,
  presets,
  onFit,
  bindKeys = true,
  scope,
  size = "md",
  side = "bottom",
  locale = "en-US",
  labels,
  className,
  ...props
}: ZoomControlsProps) {
  const text = {
    group: labels?.group ?? "Zoom",
    zoomIn: labels?.zoomIn ?? "Zoom in",
    zoomOut: labels?.zoomOut ?? "Zoom out",
    level: labels?.level ?? "Zoom level",
    fit: labels?.fit ?? "Fit to screen",
    atMin: labels?.atMin ?? "Minimum zoom is {value}",
    atMax: labels?.atMax ?? "Maximum zoom is {value}",
    announce: labels?.announce ?? "Zoom {percent} percent",
  };
  const mac = useIsMac();
  const rootRef = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(defaultValue);
  const current = clamp(value ?? own, min, max);
  const percent = Math.round(current * 100);
  const format = useMemo(() => new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }), [locale]);
  const show = (scale: number) => format.format(Math.round(scale * 100) / 100);
  const levels = useMemo(
    () => [...new Set(presets ?? DEFAULT_PRESETS)].filter((preset) => preset >= min * 100 - 0.5 && preset <= max * 100 + 0.5).sort((a, b) => a - b),
    [presets, min, max],
  );

  const change = (next: number) => {
    const scale = tidy(clamp(next, min, max));
    if (value === undefined) setOwn(scale);
    if (scale !== current) onValueChange?.(scale);
  };

  const [flash, setFlash] = useState<"in" | "out" | null>(null);
  const flashTimer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);
  const blink = (which: "in" | "out") => {
    window.clearTimeout(flashTimer.current);
    setFlash(which);
    flashTimer.current = window.setTimeout(() => setFlash(null), 180);
  };

  const latest = useRef({ change, current, step, blink });
  useEffect(() => {
    latest.current = { change, current, step, blink };
  });

  useEffect(() => {
    if (!bindKeys) return;
    const host: EventTarget | null | undefined = scope ? scope.current : rootRef.current?.parentElement;
    if (!host) return;
    const onKey = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.defaultPrevented || event.isComposing || event.altKey || !(event.ctrlKey || event.metaKey)) return;
      const now = latest.current;
      if (event.key === "+" || event.key === "=") {
        now.blink("in");
        now.change(now.current + now.step);
      } else if (event.key === "-" || event.key === "_") {
        now.blink("out");
        now.change(now.current - now.step);
      } else if (event.key === "0") now.change(1);
      else return;
      // Inside the viewer the keys zoom the content, not the whole page.
      event.preventDefault();
    };
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [bindKeys, scope]);

  // Said once the level has stopped moving for a moment, never per press.
  const [heard, setHeard] = useState({ id: 0, text: "" });
  const spoken = useRef(percent);
  useEffect(() => {
    if (spoken.current === percent) return;
    spoken.current = percent;
    const timer = window.setTimeout(() => setHeard((previous) => ({ id: previous.id + 1, text: text.announce.replace("{percent}", String(percent)) })), 700);
    return () => window.clearTimeout(timer);
  }, [percent, text.announce]);

  const atMin = current <= min + 1e-6;
  const atMax = current >= max - 1e-6;
  const modifier = mac ? "⌘" : "Ctrl";
  return (
    <TooltipProvider delayDuration={200}>
      <div ref={rootRef} role="group" aria-label={text.group} data-slot="zoom-controls" data-size={size} className={cn("inline-flex items-stretch rounded-md shadow-xs", className)} {...props}>
        <Step
          icon={<IconMinus />}
          label={text.zoomOut}
          limitTip={text.atMin.replace("{value}", show(min))}
          keys={[modifier, "−"]}
          disabled={atMin}
          size={size}
          placement="start"
          side={side}
          flashing={flash === "out"}
          onPress={() => change(current - step)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label={`${text.level}: ${show(current)}`}
              className={cn(
                WIDE[size],
                "-ms-px gap-1 rounded-none px-2 tabular-nums hover:z-10 focus-visible:z-10 active:not-disabled:translate-y-0 data-[state=open]:z-10 data-[state=open]:bg-muted",
              )}
            >
              <span>{show(current)}</span>
              <IconChevronDown aria-hidden="true" className="size-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={side} align="center" sideOffset={8} className="min-w-40">
            <DropdownMenuRadioGroup value={String(percent)} onValueChange={(next) => change(Number(next) / 100)}>
              {levels.map((preset) => (
                <DropdownMenuRadioItem key={preset} value={String(preset)} className="tabular-nums">
                  {format.format(preset / 100)}
                  {preset === 100 && bindKeys ? <DropdownMenuShortcut>{mac ? "⌘0" : "Ctrl 0"}</DropdownMenuShortcut> : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {onFit ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onFit()}>
                  <IconMaximize />
                  {text.fit}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <Step
          icon={<IconPlus />}
          label={text.zoomIn}
          limitTip={text.atMax.replace("{value}", show(max))}
          keys={[modifier, "+"]}
          disabled={atMax}
          size={size}
          placement="end"
          side={side}
          flashing={flash === "in"}
          onPress={() => change(current + step)}
        />
        <span role="status" className="sr-only">
          <span key={heard.id}>{heard.text}</span>
        </span>
      </div>
    </TooltipProvider>
  );
}
