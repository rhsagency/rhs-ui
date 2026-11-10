"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { SeekBar } from "@rhs-ui/primitives/seek-bar";
import { chapterAt, formatTime, type SeekBarChapter } from "@rhs-ui/primitives/seek-bar/time";

/* The poster is drawn as SVG, so the demo needs no files. */
const POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><rect width='800' height='450' fill='#e6e0d4'/><circle cx='590' cy='135' r='62' fill='#f5f0e5'/><path d='M0 318C120 262 232 252 340 292S566 336 800 262V450H0Z' fill='#cfc1a9'/><path d='M0 376C150 326 304 336 436 368S686 396 800 346V450H0Z' fill='#a99679'/><path d='M0 428C200 398 380 408 560 428S720 438 800 418V450H0Z' fill='#6f6149'/></svg>",
  );

const CHAPTERS: SeekBarChapter[] = [
  { start: 0, title: "Cold open" },
  { start: 48, title: "Setting up the grid" },
  { start: 132, title: "Type that holds up" },
  { start: 205, title: "Motion with a reason" },
  { start: 262, title: "Shipping it" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5";

/** A pretend player: it counts the seconds while it is playing, so the bar can be seen moving. */
function usePretendPlayer(duration: number, start: number) {
  const [time, setTime] = useState(start);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setTime((t) => Math.min(duration, t + 0.25)), 250);
    return () => clearInterval(timer);
  }, [playing, duration]);
  // At the end it stops by itself, like a real player.
  useEffect(() => {
    if (playing && time >= duration) setPlaying(false);
  }, [playing, time, duration]);
  function toggle() {
    if (!playing && time >= duration) setTime(0);
    setPlaying(!playing);
  }
  return { time, setTime, playing, toggle };
}

export default function Demo(): React.JSX.Element {
  const duration = 296;
  const video = usePretendPlayer(duration, 83);
  const loaded = [{ start: 0, end: Math.min(duration, Math.max(142, video.time + 50)) }];
  const chapter = chapterAt(CHAPTERS, video.time);

  const episode = 4328;
  const [position, setPosition] = useState(1300);
  const [aim, setAim] = useState<number | null>(null);
  const [note, setNote] = useState("Drag the bar: the episode only jumps when you let go.");

  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-9">
      <Example caption="Played, loaded and what is left, in a piece for each chapter. Hover for the time and the chapter, or focus the bar and use the keys.">
        <div className={card}>
          <div className="grid gap-1">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Halcyon Sessions 12: designing a calm interface</h2>
            <p className="text-xs text-muted-foreground">{chapter ? `Now in: ${chapter.title}` : "Not started"}</p>
          </div>
          <div className="aspect-[21/9] w-full overflow-hidden rounded-lg border border-border bg-muted">
            <img src={POSTER} alt="" className="size-full object-cover" />
          </div>
          {/* From sm up it is one row. On a phone the bar would be a stub, so it wraps onto a row of its own, under the button and the two times. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={video.playing ? "Pause" : "Play"} onClick={video.toggle}>
              {video.playing ? <IconPause className="fill-current" /> : <IconPlay className="fill-current" />}
            </Button>
            <span className="w-9 shrink-0 text-xs text-muted-foreground tabular-nums">{formatTime(video.time, duration)}</span>
            <SeekBar className="order-last basis-full sm:order-none sm:basis-auto" value={video.time} duration={duration} buffered={loaded} chapters={CHAPTERS} onSeek={video.setTime} label="Seek in Halcyon Sessions 12" />
            <span className="ml-auto w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:ml-0">{formatTime(duration, duration)}</span>
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <KbdGroup>
                <Kbd>←</Kbd>
                <Kbd>→</Kbd>
              </KbdGroup>
              5 s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Shift</Kbd>
              15 s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KbdGroup>
                <Kbd>Home</Kbd>
                <Kbd>End</Kbd>
              </KbdGroup>
              start, end
            </span>
            <span className="inline-flex items-center gap-1.5">
              <KbdGroup>
                <Kbd>PgUp</Kbd>
                <Kbd>PgDn</Kbd>
              </KbdGroup>
              10%
            </span>
          </p>
        </div>
      </Example>

      <Example caption="A long episode, seeked on release: the bar follows the pointer, but the episode only moves when you let go. A clip over an hour shows hours on every time.">
        <div className={card}>
          <div className="grid gap-1">
            <h2 className="text-sm font-medium tracking-[-0.01em]">The Slow Web, episode 41: why we stopped shipping on Fridays</h2>
            <p className="text-xs text-muted-foreground">Kestrel Radio · 1 h 12 min</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
            <span className="w-14 shrink-0 text-xs text-muted-foreground tabular-nums">{formatTime(aim ?? position, episode)}</span>
            <SeekBar
              className="order-last basis-full sm:order-none sm:basis-auto"
              value={position}
              duration={episode}
              buffered={[{ start: 0, end: 2650 }]}
              label="Seek in episode 41"
              onSeekStart={() => setNote("Scrubbing: the episode keeps playing from where it was.")}
              onSeek={setAim}
              onSeekEnd={(seconds) => {
                setPosition(seconds);
                setAim(null);
                setNote(`Jumped to ${formatTime(seconds, episode)}.`);
              }}
            />
            <span className="ml-auto w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums sm:ml-0">{formatTime(episode, episode)}</span>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {note}
          </p>
        </div>
      </Example>

      <Example caption="Until the media reports its length the bar is off, and says so">
        <div className={card}>
          <div className="flex items-center gap-3">
            <span className="w-9 shrink-0 text-xs text-muted-foreground tabular-nums">0:00</span>
            <SeekBar value={0} duration={0} label="Seek" />
            <span className="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">--:--</span>
          </div>
        </div>
      </Example>
    </div>
  );
}
