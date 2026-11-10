"use client";

import { useEffect, useState, type ReactNode } from "react";

import { TranscriptList, type Cue } from "@rhs-ui/application/transcript-list";
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

const MARA = "Mara Ellison";
const JONAS = "Jonas Weber";

const INTERVIEW: readonly Cue[] = [
  { start: 0, end: 6, speaker: MARA, text: "Welcome back to Kestrel Notes. Today I am joined by Jonas Weber, who leads research at Halcyon." },
  { start: 6, end: 10, speaker: JONAS, text: "Thanks, Mara. Happy to be here." },
  { start: 10, end: 19, speaker: MARA, text: "Let us start with a number. You told me onboarding drop-off fell by a third last spring. What changed?" },
  { start: 19, end: 31, speaker: JONAS, text: "Honestly, not the product. We changed the first question. Instead of asking people to pick a plan, we asked what they were trying to get done this week." },
  { start: 31, end: 38, speaker: MARA, text: "That sounds almost too simple." },
  { start: 38, end: 52, speaker: JONAS, text: "It is simple, and that is why it worked. A plan is our word. A goal is theirs. Once the onboarding spoke their language, the empty states started making sense." },
  { start: 52, end: 62, speaker: MARA, text: "How did you know the old question was the problem and not, say, the pricing?" },
  { start: 62, end: 78, speaker: JONAS, text: "We watched forty sessions. Thirty people stalled on the plan screen, and nine of them said out loud, I do not know what I am choosing between. Nobody said that about the price." },
  { start: 78, end: 84, speaker: MARA, text: "Forty sessions is a lot of hours." },
  { start: 84, end: 100, speaker: JONAS, text: "It is about a week of one person's time, and it saved us a quarter of guessing. I would take that trade every time." },
  { start: 100, end: 110, speaker: MARA, text: "What would you tell a team with no research budget?" },
  { start: 110, end: 128, speaker: JONAS, text: "Record five calls. Not twenty, five. Write down the exact words people use, and then put those words on your onboarding screen. Do not paraphrase them." },
  { start: 128, end: 136, speaker: MARA, text: "And if the words are ugly?" },
  { start: 136, end: 150, speaker: JONAS, text: "Use them anyway. Ugly and recognised beats polished and puzzling. You can tidy the copy later, once people are past the first screen." },
  { start: 150, end: 158, speaker: MARA, text: "Jonas, thank you. Where can people read more?" },
  { start: 158, end: 166, speaker: JONAS, text: "We publish the session notes on the Halcyon blog every month." },
  { start: 166, end: 172, speaker: MARA, text: "We will link it in the show notes. See you next time." },
];
const LENGTH = 172;

/** The same lines with no speakers, as a plain caption file gives them. */
const PLAIN: readonly Cue[] = INTERVIEW.map(({ speaker: _speaker, ...cue }) => cue);

const minutes = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** A stand-in for your player: a clock that runs while it plays. Fast mode runs it ten times faster, so the highlight can be watched moving. */
function usePlayer(length: number, from: number) {
  const [time, setTime] = useState(from);
  const [playing, setPlaying] = useState(false);
  const [fast, setFast] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const step = fast ? 2.5 : 0.25;
    const timer = window.setInterval(() => setTime((before) => Math.min(length, before + step)), 250);
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

export default function Demo(): React.JSX.Element {
  const player = usePlayer(LENGTH, 58);

  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
      <Example caption="Try it: press play (or 10×) and the line being spoken follows the clock. Scroll away and Jump to current appears. Click a timestamp or a line to seek.">
        <div className="grid min-w-0 gap-3.5">
          <div className="flex items-center gap-3">
            <Button type="button" size="icon" aria-pressed={player.playing} aria-label="Play the episode" onClick={player.toggle} className="shrink-0 rounded-full">
              {player.playing ? <IconPause strokeWidth={2.5} /> : <IconPlay fill="currentColor" className="translate-x-px" />}
            </Button>
            <Slider value={[player.time]} max={LENGTH} step={1} thumbLabels={["Playback position"]} onValueChange={([next]) => player.seek(next ?? 0)} className="min-w-0 flex-1" />
            <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {minutes(player.time)} / {minutes(LENGTH)}
            </p>
            <button
              type="button"
              aria-pressed={player.fast}
              title="Run this demo's clock ten times faster, so the highlight can be watched moving"
              onClick={player.toggleFast}
              className={cn(
                "h-7 shrink-0 rounded-md border px-2 text-xs font-medium tabular-nums outline-none transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                player.fast ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              10&times;
            </button>
          </div>
          <TranscriptList cues={INTERVIEW} currentTime={player.time} onSeek={player.seek} maxHeight="25rem" labels={{ transcript: "Interview transcript" }} />
        </div>
      </Example>

      <Example caption="Plain cues with no speakers, filtered by a search: lines that do not match are hidden, the words that do are marked, and the count is announced.">
        <TranscriptList cues={PLAIN} currentTime={0} onSeek={() => undefined} defaultQuery="onboarding" autoScroll={false} maxHeight="25rem" labels={{ transcript: "Filtered transcript" }} />
      </Example>
    </div>
  );
}
