"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ChapterList, type Chapter } from "@rhs-ui/application/chapter-list";
import { IconPause, IconPlay } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Slider } from "@rhs-ui/primitives/slider";
import { cn } from "@/lib/utils";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const TALK: readonly Chapter[] = [
  { start: 0, title: "Welcome, and why we are here" },
  { start: 132, title: "What a design system is for" },
  { start: 412, title: "Tokens before components" },
  { start: 745, title: "Naming things so they last" },
  { start: 1103, title: "The migration that went wrong" },
  { start: 1480, title: "Governance without a committee" },
  { start: 1795, title: "Measuring adoption honestly" },
  { start: 2140, title: "Questions from the room" },
  { start: 2516, title: "Closing: what we would do again" },
];
const TALK_LENGTH = 2790;

const EPISODE: readonly Chapter[] = [
  { start: 0, title: "Cold open" },
  { start: 96, title: "Why Northwind stopped discounting" },
  { start: 1180, title: "The price that felt wrong" },
  { start: 2315, title: "Three tiers is a story, not a table" },
  { start: 3480, title: "Listener questions" },
];
const EPISODE_LENGTH = 4385;

const POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' fill='#161616'/>" +
      "<g fill='none' stroke='#2b2b2b'><path d='M40 0v360M160 0v360M280 0v360M400 0v360M520 0v360'/><path d='M0 90h640M0 180h640M0 270h640'/></g>" +
      "<circle cx='520' cy='90' r='54' fill='#f1f1f1'/><circle cx='520' cy='90' r='54' fill='none' stroke='#161616' stroke-width='10' transform='translate(18 -14)'/>" +
      "<text x='40' y='62' fill='#9b9b9b' font-family='ui-monospace,monospace' font-size='13' letter-spacing='2.5'>KESTREL SUMMIT 2026</text>" +
      "<text x='40' y='188' fill='#f5f5f5' font-family='system-ui,sans-serif' font-size='42' font-weight='600' letter-spacing='-1.2'>Designing for</text>" +
      "<text x='40' y='236' fill='#f5f5f5' font-family='system-ui,sans-serif' font-size='42' font-weight='600' letter-spacing='-1.2'>the long term</text>" +
      "<text x='40' y='312' fill='#9b9b9b' font-family='system-ui,sans-serif' font-size='16'>Mara Ellison, Halcyon Studio</text></svg>",
  );

/** The cover of the podcast episode, drawn in the same quiet hand as the poster: no colour, one big number. */
const COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 280'><rect width='640' height='280' fill='#161616'/>" +
      "<g fill='none' stroke='#2b2b2b'><path d='M0 70h640M0 140h640M0 210h640'/><path d='M160 0v280M320 0v280M480 0v280'/></g>" +
      "<circle cx='540' cy='104' r='46' fill='#f1f1f1'/><circle cx='540' cy='104' r='46' fill='none' stroke='#161616' stroke-width='9' transform='translate(15 -12)'/>" +
      "<text x='36' y='52' fill='#9b9b9b' font-family='ui-monospace,monospace' font-size='13' letter-spacing='2.5'>THE NORTHWIND PODCAST</text>" +
      "<text x='32' y='236' fill='#f5f5f5' font-family='system-ui,sans-serif' font-size='150' font-weight='700' letter-spacing='-7'>48</text></svg>",
  );

const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** A stand-in for your player: a clock that runs while it plays. Fast mode runs it thirty times faster, so a chapter change can be watched. */
function usePlayer(length: number, from: number) {
  const [time, setTime] = useState(from);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const step = fast ? 7.5 : 0.25;
    const timer = window.setInterval(() => {
      setTime((before) => Math.min(length, before + step));
    }, 250);
    return () => window.clearInterval(timer);
  }, [playing, fast, length]);
  const done = time >= length;
  return {
    time,
    playing: playing && !done,
    fast,
    toggle: () => {
      if (done) setTime(0);
      setPlaying((before) => (done ? true : !before));
    },
    toggleFast: () => setFast((before) => !before),
    seek: (seconds: number) => setTime(Math.min(length, Math.max(0, seconds))),
  };
}

function Controls({ player, length, label }: { player: ReturnType<typeof usePlayer>; length: number; label: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <Button type="button" size="icon" aria-pressed={player.playing} aria-label={label} onClick={player.toggle} className="shrink-0 rounded-full">
        {player.playing ? <IconPause strokeWidth={2.5} /> : <IconPlay fill="currentColor" className="translate-x-px" />}
      </Button>
      <Slider
        value={[player.time]}
        max={length}
        step={1}
        thumbLabels={["Playback position"]}
        onValueChange={([next]) => player.seek(next ?? 0)}
        className="min-w-0 flex-1"
      />
      <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {minutes(player.time)} / {minutes(length)}
      </p>
      <button
        type="button"
        aria-pressed={player.fast}
        title="Run this demo's clock 30 times faster, so a chapter change can be watched"
        onClick={player.toggleFast}
        className={cn(
          "h-7 shrink-0 rounded-md border px-2 text-xs font-medium tabular-nums outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
          player.fast ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        30&times;
      </button>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const talk = usePlayer(TALK_LENGTH, 1196);
  const episode = usePlayer(EPISODE_LENGTH, 2380);

  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10">
      <Example caption="Try it: pick a chapter and the player jumps there; press play (or 30×) and the marked chapter, its line and the scroll follow the clock.">
        <div className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_21rem] md:items-start">
          <div className="grid min-w-0 gap-3.5">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <img src={POSTER} alt="Mara Ellison, Designing for the long term, Kestrel Summit 2026" width={640} height={360} className="block aspect-video w-full object-cover" />
            </div>
            <Controls player={talk} length={TALK_LENGTH} label="Play the talk" />
          </div>
          <ChapterList chapters={TALK} duration={TALK_LENGTH} currentTime={talk.time} onSeek={talk.seek} maxHeight="21rem" headingLevel={2} labels={{ chapters: "Talk chapters" }} />
        </div>
      </Example>

      <Example caption="Past an hour every time gains its hour, so the column keeps its width. A short list does not need to scroll on a wide card.">
        <div className="grid min-w-0 gap-5 md:grid-cols-2 md:items-stretch">
          <div className="grid min-w-0 content-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="grid gap-3.5">
              <img src={COVER} alt="" width={640} height={280} className="block aspect-[16/7] w-full rounded-lg object-cover" />
              <div className="grid gap-1">
                <h2 className="text-sm leading-5 font-medium tracking-[-0.01em]">Episode 48: Pricing the unpriceable</h2>
                <p className="text-xs text-muted-foreground">The Northwind Podcast, with Imani Okafor</p>
              </div>
            </div>
            <Controls player={episode} length={EPISODE_LENGTH} label="Play the episode" />
          </div>
          <ChapterList chapters={EPISODE} duration={EPISODE_LENGTH} currentTime={episode.time} onSeek={episode.seek} labels={{ chapters: "Episode chapters" }} />
        </div>
      </Example>
    </div>
  );
}
