"use client";

import { useState, type ReactNode } from "react";

import { IconPause, IconPlay, IconSkipBack, IconSkipForward } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { VolumeControl } from "@rhs-ui/primitives/volume-control";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5";

/* The cover is drawn as SVG, so the demo needs no files. */
const COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='#d9dee4'/><circle cx='64' cy='33' r='13' fill='#f4f6f8'/><path d='M0 62C16 52 30 52 46 60S78 70 96 58V96H0Z' fill='#9eabba'/><path d='M0 78C20 70 36 72 54 80S82 86 96 76V96H0Z' fill='#5f6e80'/></svg>",
  );

export default function Demo(): React.JSX.Element {
  const [level, setLevel] = useState(0.6);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-9">
      <Example caption="Try it: drag, press the speaker, or use the arrow keys on the slider. Muting keeps the level, so unmuting puts it back.">
        <div className={card}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
            <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
              <img src={COVER} alt="" className="size-12 shrink-0 rounded-lg border border-border" />
              <div className="grid min-w-0 gap-0.5">
                <h2 className="truncate text-sm font-medium tracking-[-0.01em]">Low Tide</h2>
                <p className="truncate text-xs text-muted-foreground">Halcyon Sessions · Ambient for focus</p>
              </div>
            </div>
            <VolumeControl value={level} muted={muted} onChange={setLevel} onMutedChange={setMuted} showValue className="w-full sm:w-56" />
          </div>
          <p role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {muted ? `Muted, will come back at ${Math.round(level * 100)}%` : `Playing at ${Math.round(level * 100)}%`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>M</Kbd>
              mute
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>5%
            </span>
          </p>
        </div>
      </Example>

      <Example caption="Compact: the slider stands upright in a popover behind the small button, for a control bar with no room to spare">
        <div className={card}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous track">
                <IconSkipBack className="size-4 fill-current" />
              </Button>
              <Button type="button" size="icon-sm" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((on) => !on)}>
                {playing ? <IconPause className="size-4 fill-current" /> : <IconPlay className="size-4 fill-current" />}
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Next track">
                <IconSkipForward className="size-4 fill-current" />
              </Button>
            </div>
            <VolumeControl compact showValue defaultValue={0.35} />
          </div>
        </div>
      </Example>

      <Example caption="The speaker follows the level: high, low and silent. A level of nothing counts as muted, and unmuting goes back to the last level you heard.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={card}>
            <p className="text-xs font-medium">High, 85%</p>
            <VolumeControl defaultValue={0.85} className="w-full" />
          </div>
          <div className={card}>
            <p className="text-xs font-medium">Low, 25%</p>
            <VolumeControl defaultValue={0.25} className="w-full" />
          </div>
          <div className={card}>
            <p className="text-xs font-medium">Muted at 45%</p>
            <VolumeControl defaultValue={0.45} defaultMuted className="w-full" />
          </div>
        </div>
      </Example>

      <Example caption="Turned off, for a player that is still loading">
        <div className={card}>
          <VolumeControl defaultValue={0.5} disabled showValue className="w-full" />
        </div>
      </Example>
    </div>
  );
}
