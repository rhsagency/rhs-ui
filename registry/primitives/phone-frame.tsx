import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PhoneTone = "light" | "dark";

export interface PhoneFrameProps extends Omit<ComponentProps<"div">, "children"> {
  /** A picture for the screen, such as a screenshot. Give it an `alt`. Without `src`, `children` is the screen. */
  src?: string;
  /** What the picture shows. It is the accessible name of the screen; without it the screen is named by `label`. */
  alt?: string;
  /** Live UI for the screen, instead of a picture. It is padded clear of the island and the home bar and scrolls inside the screen. */
  children?: ReactNode;
  /** The width of the whole device, buttons included: a number of px or any CSS length. It never grows past its container, and everything on it scales with it. Default 280. */
  width?: number | string;
  /** The finish of the body: `dark` (graphite, the default) or `light` (silver). The glass around the screen is black in both. */
  tone?: PhoneTone;
  /** `island` draws the pill-shaped camera cut-out near the top edge, `none` leaves the screen plain. Default "island". */
  notch?: "island" | "none";
  /** Pad live UI so that it clears the island and the home bar, as it would on a phone. Turn it off to draw to the edges and use `--phone-safe-top` and `--phone-safe-bottom` yourself. Default true. */
  safeArea?: boolean;
  /** The accessible name of the screen when it shows live UI, and the fallback for a picture without `alt`. Default "Phone screen". */
  label?: string;
}

/** The finish of each tone, written out whole. */
const BODY: Record<PhoneTone, { body: string; button: string }> = {
  light: { body: "border-black/15 bg-[oklch(0.9_0_0)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]", button: "bg-[oklch(0.8_0_0)]" },
  dark: { body: "border-white/15 bg-[oklch(0.27_0_0)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]", button: "bg-[oklch(0.34_0_0)]" },
};

/** Where each side button sits, as a share of the height of the device. */
const BUTTONS = [
  { side: "left-0 -translate-x-[0.85cqw]", top: "top-[14%]", height: "h-[3.6%]" },
  { side: "left-0 -translate-x-[0.85cqw]", top: "top-[21%]", height: "h-[6.6%]" },
  { side: "left-0 -translate-x-[0.85cqw]", top: "top-[29.5%]", height: "h-[6.6%]" },
  { side: "right-0 translate-x-[0.85cqw]", top: "top-[25%]", height: "h-[10.5%]" },
] as const;

/**
 * A modern phone drawn in CSS around your screenshot or live UI: a body with a
 * thin bezel, the island, side buttons and a home bar, in the house monochrome.
 * There are no image files. Every size on the device is a share of its own
 * width (container units), so it scales cleanly from a 160px thumbnail to a
 * life-size 390px, and the same units are there for the live UI inside it
 * (`text-[4.4cqw]`). The screen keeps the 19.5 to 9 shape of a phone and clips
 * its content to the rounded corners; live UI is padded clear of the island
 * and the home bar. The body, buttons and island are hidden from assistive
 * technology, and the screen carries the one accessible name: the `alt` of a
 * picture, or the `label` of live UI.
 */
export function PhoneFrame({ width = 280, tone = "dark", notch = "island", safeArea = true, label = "Phone screen", src, alt, children, className, style, ...props }: PhoneFrameProps) {
  const finish = BODY[tone];
  const vars = { "--phone-safe-top": notch === "island" ? "12cqw" : "5cqw", "--phone-safe-bottom": "5.5cqw" } as CSSProperties;

  return (
    <div data-slot="phone-frame" data-tone={tone} className={cn("@container mx-auto max-w-full", className)} style={{ width, ...style }} {...props}>
      <div className="relative mx-[1.1cqw]">
        {BUTTONS.map((button) => (
          <span key={button.top} aria-hidden="true" className={cn("absolute w-[1.4cqw] rounded-[0.5cqw]", finish.button, button.side, button.top, button.height)} />
        ))}
        <div className={cn("relative rounded-[14.5cqw] border p-[1.5cqw] shadow-sm", finish.body)}>
          <div className="rounded-[12.9cqw] bg-black p-[2.1cqw]">
            <div className="relative isolate aspect-[9/19.5] overflow-hidden rounded-[10.8cqw] bg-background text-foreground">
              {src !== undefined ? (
                <img src={src} alt={alt ?? label} draggable={false} className="absolute inset-0 size-full object-cover object-top" />
              ) : (
                <div role="group" aria-label={label} tabIndex={0} style={vars} className={cn("absolute inset-0 overflow-x-hidden overflow-y-auto outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden", safeArea && "pt-(--phone-safe-top) pb-(--phone-safe-bottom)")}>
                  {children}
                </div>
              )}
              {notch === "island" ? <span aria-hidden="true" className="absolute top-[2.6cqw] left-1/2 h-[8cqw] w-[28cqw] -translate-x-1/2 rounded-full bg-black" /> : null}
              <span aria-hidden="true" className="pointer-events-none absolute bottom-[2cqw] left-1/2 h-[1.2cqw] w-[33cqw] -translate-x-1/2 rounded-full bg-white mix-blend-difference" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
