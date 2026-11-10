"use client";

import { useEffect, useRef, useState } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { FloatingPlayer } from "@rhs-ui/primitives/floating-player";

const DURATION = 192;

const clock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** A still from the film, drawn: a pale moon over three ridges. It needs no file. */
const POSTER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360' preserveAspectRatio='xMidYMid slice'>` +
      `<rect width='640' height='360' fill='#1a1a1f'/>` +
      `<circle cx='452' cy='118' r='34' fill='#e9e9ec'/>` +
      `<path d='M-20 300L140 150L300 300Z' fill='#34343b'/>` +
      `<path d='M170 320L380 120L600 320Z' fill='#2a2a30'/>` +
      `<path d='M360 330L520 190L700 330Z' fill='#3c3c44'/>` +
      `<rect y='290' width='640' height='70' fill='#121216'/>` +
      `</svg>`,
  );

/**
 * A stand-in for a video player, with the one thing a real one has that matters here: it keeps its own time.
 * It counts seconds while it plays, so a restart would show as the time going back to 0:00.
 */
function Film({ label, playing, onToggle }: { label: string; playing: boolean; onToggle: () => void }): React.JSX.Element {
  const [seconds, setSeconds] = useState(42);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setSeconds((now) => (now + 1) % DURATION), 1000);
    return () => clearInterval(timer);
  }, [playing]);
  return (
    <div role="group" aria-label={label} className="relative aspect-video w-full overflow-hidden bg-[#1a1a1f] text-white">
      {/* eslint-disable-next-line @next/next/no-img-element -- a drawn picture, no loader needed */}
      <img src={POSTER} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      <p className="absolute top-2.5 left-3 text-[0.625rem] font-medium tracking-[0.14em] text-white/70 uppercase">Northwind Cloud</p>
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-black/60 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-label={playing ? "Pause" : "Play"}
          className="grid size-7 shrink-0 place-items-center rounded-full bg-white/15 text-white outline-none hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white [&_svg]:size-3.5"
        >
          {playing ? <IconPause className="fill-current" /> : <IconPlay className="translate-x-px fill-current" />}
        </button>
        <span className="text-[0.6875rem] font-medium tabular-nums">
          {clock(seconds)} <span className="text-white/60">/ {clock(DURATION)}</span>
        </span>
        <span role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={DURATION} aria-valuenow={seconds} className="relative h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-white/25">
          <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${(seconds / DURATION) * 100}%` }} />
        </span>
      </div>
    </div>
  );
}

const PARAGRAPHS = [
  "Most teams know what a good release feels like: small, boring and easy to take back. Very few get there on purpose, because the habits that make a release boring are the ones nobody has time to build.",
  "At Northwind we ship forty times a week. The trick is not speed. It is that every change is behind a switch, every switch has an owner and nothing waits for a Friday to go out.",
  "That changes what a bad day looks like. A failed deploy becomes a flag turned off, a note in the channel and a fix before lunch, instead of a weekend spent reading logs.",
  "The film above walks through one release from the first commit to the last graph, with the people who did the work. It runs a little over three minutes.",
  "Below it, the checklist the team uses before a flag goes to everyone: who owns it, what the graph should do, and the one sentence that tells support what changed.",
];

/**
 * A window onto a page: it has its own scrolling, and it contains the mini player, so "fixed" means fixed in the window.
 * Both windows dock at once, so each film has a name of its own: two regions with the same name cannot be told apart.
 */
function Page({ caption, label, past = false, startPlaying = true }: { caption: string; label: string; past?: boolean; startPlaying?: boolean }): React.JSX.Element {
  const [playing, setPlaying] = useState(startPlaying);
  const [docked, setDocked] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  // The second window starts scrolled just past the video, so the mini player is there to see.
  useEffect(() => {
    const page = scroller.current;
    const video = page?.querySelector<HTMLElement>("[data-slot=floating-player]");
    if (past && page && video) page.scrollTop = video.offsetTop + video.offsetHeight + 24;
  }, [past]);
  return (
    <figure className="m-0 grid min-w-0 content-start gap-3">
      {/* The transform makes this box the containing block of the mini player. A real page needs no such thing. */}
      <div className="relative h-[34rem] [transform:translateZ(0)] overflow-hidden rounded-2xl border border-border bg-background">
        <div ref={scroller} className="relative h-full overflow-x-hidden overflow-y-auto">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5 text-sm">
            <span className="font-semibold tracking-[-0.02em]">Northwind Journal</span>
            <span className="text-xs text-muted-foreground">Engineering</span>
          </div>
          <article className="grid gap-5 px-5 pt-6 pb-24">
            <header className="grid gap-2">
              <h2 className="text-balance text-[1.375rem] leading-tight font-semibold tracking-[-0.03em]">Shipping a release without the Friday dread</h2>
              <p className="text-xs text-muted-foreground">Mara Okafor, 6 min read, 12 March</p>
            </header>
            <p className="text-sm leading-relaxed text-muted-foreground">{PARAGRAPHS[0]}</p>
            <FloatingPlayer playing={playing} onClose={() => setPlaying(false)} onDock={setDocked} label={label} width={256} className="overflow-hidden rounded-xl">
              <Film label={label} playing={playing} onToggle={() => setPlaying((now) => !now)} />
            </FloatingPlayer>
            {PARAGRAPHS.slice(1).map((text) => (
              <p key={text} className="text-sm leading-relaxed text-muted-foreground">
                {text}
              </p>
            ))}
            <p className="text-sm leading-relaxed text-muted-foreground">{PARAGRAPHS[2]}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{PARAGRAPHS[0]}</p>
          </article>
        </div>
      </div>
      <figcaption className="text-xs leading-relaxed text-muted-foreground">
        {caption} <span aria-live="polite" className="font-medium text-foreground">{docked ? "Docked." : playing ? "In view." : "Paused."}</span>
      </figcaption>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-x-6 gap-y-10 px-4 py-10 sm:px-6 md:grid-cols-2">
      <Page label="Release film" caption="Playing in view: nothing changes. Scroll down and the same player docks to the corner; scroll back and it returns." />
      <Page past label="Product tour" caption="Scrolled past the video while it plays: the mini player, with Back to video and Close. The time kept counting." />
    </div>
  );
}
