import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

export interface DotStepperProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** How many steps or slides there are. */
  count: number;
  /** The current one, counted from 0. */
  value: number;
  /** Turns every dot into a button that goes to its step. Without it the dots are one picture of where you are. */
  onValueChange?: (value: number) => void;
  /** A name for each dot ("Invite your team"): the name of its button, and said after "Step 2 of 5" for the current one. */
  labels?: readonly string[];
  /** The size of the dots: `sm`, `md` (default) or `lg`. */
  size?: "sm" | "md" | "lg";
  /** A row (default) or a column. */
  orientation?: "horizontal" | "vertical";
  /** The words for "Step 2 of 5"; `{current}` and `{total}` are the numbers. Default "Step {current} of {total}". */
  format?: string;
  /** The name of the list of buttons, when the dots are buttons. Default "Steps". */
  label?: string;
}

/** Dot, pill and gap in px for each size, as a picture. The pill is the current dot, stretched. As buttons the dots sit `TARGET` apart, so the gap is wider. */
const SIZES = {
  sm: { dot: 6, pill: 16, gap: 6 },
  md: { dot: 8, pill: 24, gap: 8 },
  lg: { dot: 10, pill: 32, gap: 10 },
} as const;

/** Past this many dots the row stops growing and a window of `WINDOW` dots slides along instead. */
const LIMIT = 7;
const WINDOW = 5;
/** The size of a button's target in px (WCAG 2.5.8): 24 across the row, and along it as wide as its dot plus the gap, which is 24 for a dot. */
const TARGET = 24;
/** Room around the dots inside the clip, so a focus ring is not cut off at the ends and a button keeps its whole target (half the widest gap). */
const PAD = 9;

const clamp = (n: number, low: number, high: number) => Math.min(Math.max(n, low), high);

/**
 * Page dots for onboarding, a carousel or a short flow. The current dot stretches into a pill and the
 * rest stay small. Past seven dots the row does not grow: a window of five slides along, with the
 * dots at its edges shrinking to say there is more. With `onValueChange` every dot is a button inside
 * a list, named by `labels`, the current one marked `aria-current="step"` and a 24px target (the dots
 * sit 24px apart); without it the whole thing is one image that says "Step 2 of 5", with the dots
 * closer. The colour, and the focus ring, are `currentColor`, so on a dark photo give it `text-white`.
 * Under reduced motion the stretch and the slide are instant.
 */
export function DotStepper({ count, value, onValueChange, labels, size = "md", orientation = "horizontal", format = "Step {current} of {total}", label = "Steps", className, style, ...props }: DotStepperProps) {
  if (count < 1) return null;
  const { dot, pill, gap: closeGap } = SIZES[size];
  // A button has to be a 24px target, so the dots of buttons sit 24px apart: dot plus gap is 24 for every size. The picture keeps them close.
  const gap = onValueChange ? TARGET - dot : closeGap;
  const current = clamp(Math.round(value), 0, count - 1);
  const horizontal = orientation === "horizontal";
  const pitch = dot + gap;
  const windowed = count > LIMIT;
  const first = windowed ? clamp(current - 2, 0, count - WINDOW) : 0;
  const last = windowed ? first + WINDOW - 1 : count - 1;
  // Where a dot starts along the row: every dot before the current one is a dot wide, and every one after it is pushed on by the pill.
  const startOf = (index: number) => index * pitch + (index > current ? pill - dot : 0);
  const lengthOf = (index: number) => (index === current ? pill : dot);
  const extent = startOf(last) + lengthOf(last) - startOf(first);
  const stepText = (index: number) => {
    const text = format.replace("{current}", String(index + 1)).replace("{total}", String(count));
    const name = labels?.[index];
    return name ? `${text}, ${name}` : text;
  };
  // Dots just outside the window are drawn too, so they can slide in and out; they are hidden and out of reach.
  const drawn = Array.from({ length: last - first + 3 }, (_, offset) => first - 1 + offset).filter((index) => index >= 0 && index < count);

  const dots = drawn.map((index) => {
    const inside = index >= first && index <= last;
    // The dot at each end of a window shrinks when there is more beyond it.
    const edge = windowed && inside && index !== current && ((index === first && first > 0) || (index === last && last < count - 1));
    // Where this dot starts, in the clip. Its button reaches half a gap further on each side, so the buttons meet.
    const along = startOf(index) - startOf(first) + PAD;
    const place: CSSProperties = horizontal ? { left: along - gap / 2, top: PAD, width: lengthOf(index) + gap, height: TARGET } : { top: along - gap / 2, left: PAD, height: lengthOf(index) + gap, width: TARGET };
    const shape: CSSProperties = horizontal ? { width: lengthOf(index), height: dot } : { height: lengthOf(index), width: dot };
    const visual = (
      <span aria-hidden="true" style={shape} className="relative block transition-[width,height] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none">
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-current transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none",
            // A dot that is not current is half strength, enough to see as a control; the dots at the edge of a window are only a hint of more.
            index === current ? "opacity-100" : edge ? "scale-[0.6] opacity-30" : "opacity-50",
            onValueChange && index !== current && "group-hover/dot:opacity-80",
          )}
        />
        {/* The focus ring is an element of its own, 2px clear of the dot: drawn on the dot it would fade with it, and a dot that is not current is faint.
            It is drawn in the colour of the dots, so it shows on a dark photo (white) as well as on a card (dark). */}
        {onValueChange ? <span className="absolute -inset-0.5 rounded-full opacity-0 ring-[3px] ring-current/50 transition-opacity duration-150 group-focus-visible/dot:opacity-100 motion-reduce:transition-none" /> : null}
      </span>
    );
    const common = "absolute grid place-items-center transition-[left,top,width,height,opacity] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none";
    if (!onValueChange) {
      return (
        <span key={index} aria-hidden="true" style={place} className={cn(common, !inside && "opacity-0")}>
          {visual}
        </span>
      );
    }
    return (
      <li key={index} aria-hidden={inside ? undefined : true} inert={inside ? undefined : true} aria-posinset={index + 1} aria-setsize={count} style={place} className={cn(common, !inside && "pointer-events-none opacity-0")}>
        <button
          type="button"
          tabIndex={inside ? 0 : -1}
          aria-label={stepText(index)}
          aria-current={index === current ? "step" : undefined}
          onClick={() => onValueChange(index)}
          className="group/dot absolute inset-0 grid cursor-pointer place-items-center rounded-full outline-none"
        >
          {visual}
        </button>
      </li>
    );
  });

  const frame: CSSProperties = horizontal ? { width: extent, height: TARGET, padding: PAD, margin: -PAD } : { height: extent, width: TARGET, padding: PAD, margin: -PAD };
  // The padding and the matching negative margin leave room for the focus ring inside the clip, and take no room in the layout.
  const shell = "relative box-content shrink-0 overflow-hidden text-foreground";
  if (!onValueChange) {
    return (
      <div data-slot="dot-stepper" data-orientation={orientation} role="img" aria-label={stepText(current)} style={{ ...frame, ...style }} className={cn(shell, className)} {...props}>
        {dots}
      </div>
    );
  }
  return (
    <ul
      data-slot="dot-stepper"
      data-orientation={orientation}
      aria-label={label}
      style={{ ...frame, ...style }}
      className={cn(shell, "m-0 list-none", className)}
      {...(props as ComponentProps<"ul">)}
    >
      {dots}
    </ul>
  );
}
