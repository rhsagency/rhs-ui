import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type LaptopTone = "light" | "dark";

export interface LaptopFrameProps extends Omit<ComponentProps<"div">, "children"> {
  /** A picture for the screen, such as a screenshot of your app. Give it an `alt`. Without `src`, `children` is the screen. */
  src?: string;
  /** What the picture shows. It is the accessible name of the screen; without it the screen is named by `label`. */
  alt?: string;
  /** Live UI for the screen, instead of a picture. It fills the screen and is clipped to its corners. Size it in `cqw` units (`text-[1.2cqw]`) and it scales with the device. */
  children?: ReactNode;
  /** The finish of the body: `dark` (graphite, the default) or `light` (silver). The glass around the screen is black in both. */
  tone?: LaptopTone;
  /** The width of the whole device: a number of px or any CSS length. It never grows past its container, and everything on it scales with it. Default 720. */
  width?: number | string;
  /** How far the lid is open, from 0 (closed) to 1 (fully open, the default). Feed it a scroll value and the lid lifts as the page moves. */
  open?: number;
  /** The accessible name of the screen when it shows live UI, and the fallback for a picture without `alt`. Default "Laptop screen". */
  label?: string;
}

/** The finish of each tone, written out whole: the lid shell, the base with its rim, and the scoop at the front of it. */
const FINISH: Record<LaptopTone, { shell: string; base: string; scoop: string }> = {
  light: {
    shell: "bg-[oklch(0.89_0_0)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]",
    base: "bg-[oklch(0.93_0_0)] border-t-[oklch(0.78_0_0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
    scoop: "bg-[oklch(0.8_0_0)]",
  },
  dark: {
    shell: "bg-[oklch(0.27_0_0)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]",
    base: "bg-[oklch(0.31_0_0)] border-t-[oklch(0.18_0_0)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
    scoop: "bg-[oklch(0.2_0_0)]",
  },
};

/** The steepest the lid goes when closed: edge on would vanish, so it stops a few degrees short. */
const CLOSED_DEGREES = 86;

/**
 * A laptop drawn in CSS around your screenshot or live UI: a lid with a thin
 * shell, a black bezel and a camera, a base that runs a little wider with a
 * finger scoop at the front, and a soft shadow where the lid meets it. There
 * are no image files. Every size on the device is a share of its own width
 * (container units), so it scales cleanly from a card to a hero, and the same
 * units are there for the live UI inside it. The screen keeps the 16 to 10
 * shape of a laptop and clips its content to rounded corners. `open` (0 to 1)
 * turns the lid on its hinge, so a scroll position can lift it. The body is
 * hidden from assistive technology, and the screen carries the one accessible
 * name: the `alt` of a picture, or the `label` of live UI.
 */
export function LaptopFrame({ src, alt, children, tone = "dark", width = 720, open = 1, label = "Laptop screen", className, style, ...props }: LaptopFrameProps) {
  const finish = FINISH[tone];
  const lift = Number.isFinite(open) ? Math.min(1, Math.max(0, open)) : 1;
  // Closing tips the top of the lid toward the viewer, around the hinge at its bottom edge.
  const lid: CSSProperties = lift < 1 ? { transform: `rotateX(${-(1 - lift) * CLOSED_DEGREES}deg)` } : {};
  const shut = lift < 0.04;

  return (
    <div data-slot="laptop-frame" data-tone={tone} className={cn("@container mx-auto max-w-full min-w-0 overflow-x-clip", className)} style={{ width, ...style }} {...props}>
      <div className="[perspective:500cqw]">
        <div style={lid} className="relative mx-auto w-[92%] origin-bottom">
          <div className={cn("rounded-t-[1.9cqw] p-[0.5cqw]", finish.shell)}>
            <div className="relative rounded-t-[1.4cqw] bg-black px-[1.1cqw] py-[1.5cqw]">
              <span aria-hidden="true" className="absolute top-[0.55cqw] left-1/2 size-[0.45cqw] -translate-x-1/2 rounded-full bg-white/20" />
              <div className="relative isolate aspect-[16/10] overflow-hidden rounded-[0.45cqw] bg-background text-foreground">
                {src !== undefined ? (
                  <img src={src} alt={alt ?? label} draggable={false} className="absolute inset-0 size-full object-cover object-top" />
                ) : (
                  <div role="group" aria-label={label} inert={shut || undefined} className="absolute inset-0 overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {children}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className={cn("relative h-[2.1cqw] w-full rounded-b-[2.4cqw] border-t shadow-[0_2.2cqw_3cqw_-1.8cqw_rgb(0_0_0/0.45)]", finish.base)}>
        <span className="absolute inset-x-0 top-0 h-[0.5cqw] bg-black/20" />
        <span className={cn("absolute top-0 left-1/2 h-[0.85cqw] w-[15cqw] -translate-x-1/2 rounded-b-[1.2cqw]", finish.scoop)} />
      </div>
    </div>
  );
}
