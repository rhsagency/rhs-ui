"use client";

import { useEffect, useState, type ReactNode } from "react";

import { IconPause, IconPlay } from "@rhs-ui/icons";
import { AudioWaveform } from "@rhs-ui/primitives/audio-waveform";
import { clock } from "@rhs-ui/primitives/audio-waveform/peaks";
import { Button } from "@rhs-ui/primitives/button";

/** A small seeded generator, so every load draws the same waveforms. */
function random(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Peaks that look like someone talking: words of different loudness with breaths between. */
function speech(seed: number, length: number): number[] {
  const next = random(seed);
  const peaks: number[] = [];
  while (peaks.length < length) {
    const loudness = 0.5 + next() * 0.5;
    const word = 4 + Math.floor(next() * 9);
    for (let index = 0; index < word && peaks.length < length; index += 1) {
      const shape = Math.sin(((index + 0.5) / word) * Math.PI);
      peaks.push(Math.min(1, Math.max(0.06, loudness * (0.4 + 0.6 * shape) * (0.75 + next() * 0.4))));
    }
    const breath = 1 + Math.floor(next() * 3);
    for (let index = 0; index < breath && peaks.length < length; index += 1) peaks.push(0.04 + next() * 0.06);
  }
  return peaks;
}

/** Peaks that look like a track: a slow swell under a steady beat. */
function track(seed: number, length: number): number[] {
  const next = random(seed);
  return Array.from({ length }, (_, index) => {
    const swell = 0.45 + 0.4 * Math.sin(index / 22) * Math.sin(index / 61 + 1);
    const beat = index % 8 === 0 ? 0.28 : index % 4 === 0 ? 0.12 : 0;
    return Math.min(1, Math.max(0.08, swell * (0.78 + next() * 0.3) + beat));
  });
}

const PEOPLE = ["Maya Okafor", "Tomás Ferreira", "Lena Voss", "Idris Banda", "Priya Nair", "Jonas Berg", "Amara Díaz", "Noor Haddad", "Sven Lindqvist", "Kofi Mensah"];
const ABOUT = [
  "Walkthrough of the new onboarding",
  "Quick question about the invoice",
  "Kestrel release notes, read aloud",
  "Voicemail from the depot",
  "Feedback on the Halcyon mockups",
  "Running ten minutes late",
  "Notes from the supplier call",
  "Can we move Thursday's review?",
];

/** Fifty voice notes, each with peaks of its own. */
const NOTES = Array.from({ length: 50 }, (_, index) => ({
  name: PEOPLE[index % PEOPLE.length] as string,
  about: ABOUT[(index * 3) % ABOUT.length] as string,
  length: 12 + ((index * 37) % 290),
  peaks: speech(100 + index * 7, 48 + ((index * 29) % 220)),
  played: index === 0 ? 0.62 : index === 3 ? 1 : 0,
}));
const FEW = 5;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5";

const LENGTH = 224;
const THE_TRACK = track(7, 300);

export default function Demo(): React.JSX.Element {
  const [progress, setProgress] = useState(0.38);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setProgress((p) => Math.min(1, p + 0.25 / LENGTH)), 250);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => {
    if (playing && progress >= 1) setPlaying(false);
  }, [playing, progress]);

  const [list, setList] = useState(NOTES.map((note) => note.played));
  const [all, setAll] = useState(false);
  const shown = all ? NOTES.length : FEW;

  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-9">
      <Example caption="Press or drag to seek, hover for where a press will land, or focus it and use the arrow keys.">
        <div className={card}>
          <div className="grid gap-1">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Slow Tide, full mix</h2>
            <p className="text-xs text-muted-foreground">Halcyon Sessions · 3 min 44 s</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="icon"
              aria-label={playing ? "Pause" : progress >= 1 ? "Play again" : "Play"}
              onClick={() => {
                if (!playing && progress >= 1) setProgress(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <IconPause className="fill-current" /> : <IconPlay className="fill-current" />}
            </Button>
            <div className="min-w-0 flex-1">
              <AudioWaveform peaks={THE_TRACK} progress={progress} onSeek={setProgress} interactive duration={LENGTH} height={56} barWidth={3} gap={2} label="Seek in Slow Tide" />
            </div>
          </div>
          <div className="flex justify-between pl-12 text-xs text-muted-foreground tabular-nums">
            <span>{clock(progress * LENGTH)}</span>
            <span>{clock(LENGTH)}</span>
          </div>
        </div>
      </Example>

      <Example caption="A list of voice notes: each waveform is two SVG paths, so a long list stays light. Show all fifty and scroll. The first one is part played.">
        <div className="grid min-w-0 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Voice notes</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAll(!all)}>
              {all ? "Show 5" : "Show all 50"}
            </Button>
          </div>
          {/* Five rows fit as they are; only the long list scrolls. */}
          <div className={all ? "relative max-h-[22rem] min-w-0 divide-y divide-border overflow-y-auto" : "relative min-w-0 divide-y divide-border"}>
            {NOTES.slice(0, shown).map((note, index) => (
              <div key={`${note.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={`Play the voice note from ${note.name}: ${note.about}`}
                  onClick={() => setList((values) => values.map((value, at) => (at === index ? (value >= 1 ? 0.05 : Math.min(1, value + 0.3)) : value)))}
                >
                  <IconPlay className="size-3.5 fill-current" />
                </Button>
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">{note.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{clock(note.length)}</span>
                  </div>
                  <AudioWaveform peaks={note.peaks} progress={list[index] ?? 0} height={24} barWidth={2} gap={2} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Example>

      <Example caption="Bar width, gap and height are props. Without peaks yet it draws a flat line.">
        <div className={card}>
          <div className="grid gap-4">
            <AudioWaveform peaks={speech(5, 200)} progress={0.45} height={32} barWidth={2} gap={1} />
            <AudioWaveform peaks={speech(9, 120)} progress={0.45} height={48} barWidth={5} gap={3} />
            <AudioWaveform peaks={[]} height={32} label="Waveform loading" />
          </div>
        </div>
      </Example>
    </div>
  );
}
