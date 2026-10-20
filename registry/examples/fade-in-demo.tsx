"use client";

import { useState } from "react";

import { IconBell, IconRefresh, IconReceipt, IconTruck, IconUserPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { FadeIn, type FadeInProps } from "@rhs-ui/motion/fade-in";

const CARDS: readonly { direction: NonNullable<FadeInProps["direction"]>; delay: number; title: string; body: string; icon: React.ReactNode }[] = [
  { direction: "up", delay: 0, title: "Order #4821 shipped", body: "The courier collected it at 09:12. Arrives Thursday.", icon: <IconTruck /> },
  { direction: "left", delay: 90, title: "Invoice INV-2041 paid", body: "€1,240.00 received from Kestrel Outfitters.", icon: <IconReceipt /> },
  { direction: "right", delay: 180, title: "Back in stock", body: "The Halcyon desk lamp can be ordered again.", icon: <IconBell /> },
  { direction: "down", delay: 270, title: "New customer", body: "Oak Lane Interiors created an account today.", icon: <IconUserPlus /> },
];

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Four ways to arrive</h2>
          <p className="mt-1 text-xs text-muted-foreground">Each block plays once when it is on screen, on its own clock.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
          <IconRefresh />
          Replay
        </Button>
      </div>

      <div key={run} className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CARDS.map((card) => (
          <FadeIn key={card.direction} direction={card.direction} delay={card.delay} distance={20} className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-xs">
            <p className="font-mono text-xs text-muted-foreground">direction=&quot;{card.direction}&quot;</p>
            <div className="mt-3 flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&>svg]:size-4" aria-hidden="true">
                {card.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{card.title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{card.body}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
