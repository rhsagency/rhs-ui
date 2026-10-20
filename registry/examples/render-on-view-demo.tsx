"use client";

import { useState, type ReactNode } from "react";

import { IconPlay, IconRefresh, IconTrendUp } from "@rhs-ui/icons";
import { RenderOnView } from "@rhs-ui/motion/render-on-view";
import { Button } from "@rhs-ui/primitives/button";

const STORES: readonly { x: number; y: number; name?: string }[] = [
  { x: 96, y: 92 },
  { x: 214, y: 150 },
  { x: 322, y: 70 },
  { x: 402, y: 176, name: "Utrecht Centraal" },
  { x: 516, y: 66 },
  { x: 168, y: 232 },
  { x: 288, y: 262 },
  { x: 468, y: 252 },
  { x: 562, y: 190 },
];

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** City blocks by repeated splitting of a seeded rectangle, so server and browser agree on every one. */
function cityBlocks(): readonly Block[] {
  let seed = 31;
  const random = (): number => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const blocks: Block[] = [];
  const split = (x: number, y: number, w: number, h: number, depth: number): void => {
    if (depth === 0 || (w < 70 && h < 60)) {
      blocks.push({ x, y, w, h });
      return;
    }
    const at = 0.36 + random() * 0.28;
    if (w / 640 > h / 320) {
      split(x, y, w * at, h, depth - 1);
      split(x + w * at, y, w * (1 - at), h, depth - 1);
    } else {
      split(x, y, w, h * at, depth - 1);
      split(x, y + h * at, w, h * (1 - at), depth - 1);
    }
  };
  split(0, 0, 640, 320, 6);
  return blocks;
}

const BLOCKS = cityBlocks();

/** The map is drawn to scale, but a label drawn inside it would shrink with it to a smudge on a phone. So the name is an HTML pill, always 12px, placed by percentage over the spot it names, and it steps aside when the map gets too small to hold it. */
function StoreMap(): React.JSX.Element {
  return (
    <div className="@container relative size-full rounded-[inherit] motion-safe:transition-opacity motion-safe:duration-500 starting:opacity-0">
      <svg viewBox="0 0 640 320" role="img" aria-label="Map of nine Northwind shops, with the Utrecht Centraal shop highlighted" className="size-full rounded-[inherit] bg-muted">
        {BLOCKS.map((block, index) => (
          <rect key={index} x={block.x + 3.5} y={block.y + 3.5} width={block.w - 7} height={block.h - 7} rx="5" className={index % 9 === 4 ? "fill-border/70" : "fill-card"} />
        ))}
        <path d="M-10 70 L 660 238" fill="none" strokeWidth="11" className="stroke-muted" />
        <path d="M232 -10 L 352 340" fill="none" strokeWidth="9" className="stroke-muted" />
        <path d="M-20 262 C 110 190, 210 300, 330 222 S 540 140, 664 196" fill="none" strokeWidth="30" strokeLinecap="round" className="stroke-border" />
        {STORES.map((store) => (
          <g key={`${store.x}-${store.y}`} transform={`translate(${store.x} ${store.y})`}>
            <circle r="17" className="fill-foreground/10" />
            <circle r="8" className="fill-foreground" />
            <circle r="3" className="fill-background" />
          </g>
        ))}
      </svg>
      {STORES.filter((store) => store.name).map((store) => (
        <p
          key={store.name}
          aria-hidden="true"
          // The pill sits just above the store's halo (17 of 640 units wide, which is 2.66cqw).
          style={{ left: `${(store.x / 640) * 100}%`, top: `calc(${(store.y / 320) * 100}% - 2.66cqw - 3px)` }}
          className="absolute -translate-x-1/2 -translate-y-full rounded-full bg-foreground px-3 py-1 text-xs font-medium whitespace-nowrap text-background @max-[15rem]:hidden"
        >
          {store.name}
        </p>
      ))}
    </div>
  );
}

const WEEKS: readonly number[] = [42, 47, 45, 51, 58, 54, 61, 66, 63, 71, 74, 81];

function RevenueChart(): React.JSX.Element {
  return (
    <div className="@container flex h-full flex-col rounded-[inherit] border border-border bg-card p-5 motion-safe:transition-opacity motion-safe:duration-500 starting:opacity-0">
      {/* Side by side while the card is wide enough for both, stacked under 12rem so nothing runs into the edge. */}
      <div className="flex flex-col gap-2 @min-[12rem]:flex-row @min-[12rem]:items-start @min-[12rem]:justify-between @min-[12rem]:gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Net revenue, week 37</p>
          <p className="mt-1 text-3xl font-medium tracking-[-0.04em] tabular-nums">€81,240</p>
        </div>
        <div className="flex items-center gap-1.5 @min-[12rem]:flex-col @min-[12rem]:items-end @min-[12rem]:gap-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap tabular-nums">
            <IconTrendUp className="size-4" />
            +9.5%
          </p>
          <p className="text-xs whitespace-nowrap text-muted-foreground @min-[12rem]:mt-1">on last week</p>
        </div>
      </div>
      <div role="img" aria-label="Bar chart of weekly net revenue: 42 thousand euros in week 26, rising to 81 thousand in week 37" className="relative mt-6 flex min-h-0 flex-1 items-end gap-1.5 border-b border-border sm:gap-2">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-border" />
        {WEEKS.map((value, index) => (
          <div key={index} className="relative flex h-full flex-1 items-end">
            <div
              className={index === WEEKS.length - 1 ? "w-full rounded-t-md bg-foreground" : "w-full rounded-t-md bg-foreground/15"}
              style={{ height: `${(value / 90) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="relative mt-2 h-4 text-[0.6875rem] text-muted-foreground tabular-nums">
        <span className="absolute left-0">Wk 26</span>
        <span className="absolute left-[45.8%] -translate-x-1/2">Wk 31</span>
        <span className="absolute right-0">Wk 37</span>
      </div>
    </div>
  );
}

/** A 16:9 box is only as tall as it is wide, so in a narrow one the play disc leaves the middle for the corner and the caption keeps its room. */
function StoryEmbed(): React.JSX.Element {
  return (
    <div role="img" aria-label="Customer story video: Halcyon at Polder and Co, 3 minutes 42" className="dark @container relative size-full overflow-hidden rounded-[inherit] bg-card text-foreground motion-safe:transition-opacity motion-safe:duration-500 starting:opacity-0">
      <div className="absolute inset-0 grid place-items-center @max-md:inset-auto @max-md:top-3 @max-md:right-3">
        <span className="grid size-14 place-items-center rounded-full bg-foreground text-background shadow-sm @max-md:size-9">
          <IconPlay className="size-5 @max-md:size-4" />
        </span>
      </div>
      <div className="absolute inset-x-5 bottom-5 @max-md:inset-x-3 @max-md:bottom-3">
        <p className="text-sm font-medium">Halcyon at Polder &amp; Co</p>
        <p className="mt-0.5 text-xs opacity-70">Customer story, 3:42</p>
        <div className="mt-3 h-0.5 rounded-full bg-foreground/25 @max-md:mt-2">
          <div className="h-full w-1/3 rounded-full bg-foreground" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="mt-9">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [run, setRun] = useState(0);
  const [ready, setReady] = useState<readonly string[]>([]);
  const mount = (id: string): void => setReady((list) => (list.includes(id) ? list : [...list, id]));

  return (
    <div className="w-full">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p role="status" className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{ready.length} of 3</span> sections rendered
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReady([]);
              setRun((value) => value + 1);
            }}
          >
            <IconRefresh />
            Replay
          </Button>
        </div>
        <div
          key={run}
          tabIndex={0}
          role="region"
          aria-label="Trading report"
          className="relative h-[34rem] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          <article className="px-6 pt-7 pb-16 sm:px-8">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Northwind Retail, Q3 2026</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Trading report</h2>

            <Section title="Where our shops are">
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">Nine shops in four provinces. Three opened this year, all within ten minutes of a station.</p>
              <RenderOnView ratio={2} onVisible={() => mount("map")} className="mt-4 overflow-hidden rounded-xl border border-border">
                <StoreMap />
              </RenderOnView>
            </Section>

            <Section title="Weekly net revenue">
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">Up in eight of the last eleven weeks, led by the new Utrecht and Breda shops.</p>
              <RenderOnView minHeight={300} onVisible={() => mount("chart")} className="mt-4 h-[300px] rounded-xl">
                <RevenueChart />
              </RenderOnView>
            </Section>

            <Section title="Customer story">
              <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-muted-foreground">How Polder &amp; Co moved their whole stockroom onto Halcyon in a weekend.</p>
              <RenderOnView ratio={16 / 9} onVisible={() => mount("story")} className="mt-4 overflow-hidden rounded-xl">
                <StoryEmbed />
              </RenderOnView>
            </Section>
          </article>
        </div>
      </div>
    </div>
  );
}
