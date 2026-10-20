"use client";

import { useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArmchair, IconBathtub, IconChefHat, IconFountainPen, IconLamp, IconSuitcase, IconTent, IconVase } from "@rhs-ui/icons";
import { DragScroll } from "@rhs-ui/motion/drag-scroll";

const ROOMS = [
  { name: "Lighting", count: 42, icon: <IconLamp /> },
  { name: "Seating", count: 67, icon: <IconArmchair /> },
  { name: "Kitchen", count: 118, icon: <IconChefHat /> },
  { name: "Outdoor", count: 35, icon: <IconTent /> },
  { name: "Stationery", count: 54, icon: <IconFountainPen /> },
  { name: "Bath", count: 29, icon: <IconBathtub /> },
  { name: "Travel", count: 23, icon: <IconSuitcase /> },
  { name: "Decor", count: 91, icon: <IconVase /> },
] as const;

export default function Demo(): React.JSX.Element {
  const [snap, setSnap] = useState("free");
  return (
    <div className="w-full max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 className="text-sm font-medium">Shop by room</h2>
          <p className="mt-1 text-xs text-muted-foreground">Drag with the mouse, swipe on touch, or focus the strip and use the arrow keys.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs text-muted-foreground" aria-hidden="true">
            Snapping
          </span>
          <SegmentedControl
            label="Snapping"
            value={snap}
            onValueChange={setSnap}
            options={[
              { value: "free", label: "Free" },
              { value: "start", label: "Start" },
              { value: "center", label: "Centre" },
            ]}
          />
        </div>
      </div>

      <DragScroll label="Collections" snap={snap === "start" ? "start" : snap === "center" ? "center" : false} arrows className="mt-5">
        {ROOMS.map((room) => (
          <a
            key={room.name}
            href="#shop"
            onClick={(event) => event.preventDefault()}
            className="group/card block w-56 rounded-xl border border-border bg-card p-3 shadow-xs outline-none transition-colors hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_18%)] focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <span className="grid aspect-[4/3] place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover/card:text-foreground [&>svg]:size-10" aria-hidden="true">
              {room.icon}
            </span>
            <span className="mt-3 block text-sm font-medium tracking-[-0.01em]">{room.name}</span>
            <span className="block text-xs text-muted-foreground tabular-nums">{room.count} products</span>
          </a>
        ))}
      </DragScroll>
    </div>
  );
}
