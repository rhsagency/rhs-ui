"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";

import { ListenButton, type SpeechEngine } from "@rhs-ui/application/listen-button";

const PARAGRAPHS = [
  "For two years our team tracked velocity every sprint. The chart went up, and so did the pressure. Then a quiet quarter taught us that the number had stopped describing the work.",
  "We replaced it with a single question in the retro: what slowed us down this week? The answers were small and specific. A flaky test suite. A review queue that nobody owned. A design decision that had been made twice.",
  "Within a month the list had shrunk by half. Nobody had set a target for it. Fixing a named problem turned out to be easier than improving a number.",
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/**
 * A speech engine that makes no sound but keeps time like one, so the states can be seen anywhere.
 * `onFinished` is called when a reading has run to its very end (not when it was stopped).
 */
function simulatedEngine(onFinished: () => void): SpeechEngine {
  let queue: SpeechSynthesisUtterance[] = [];
  let playing: { utterance: SpeechSynthesisUtterance; left: number; since: number } | null = null;
  let timer: number | undefined;
  let paused = false;
  const emit = (utterance: SpeechSynthesisUtterance, type: "start" | "end") => (type === "start" ? utterance.onstart : utterance.onend)?.call(utterance, new Event(type) as unknown as SpeechSynthesisEvent);
  const arm = () => {
    if (!playing) return;
    playing.since = Date.now();
    timer = window.setTimeout(() => {
      const done = playing;
      playing = null;
      if (done) emit(done.utterance, "end");
      run();
      // The button asks for the next sentence at once; if it did not, there was none.
      if (!playing && !queue.length && !paused) onFinished();
    }, playing.left);
  };
  const run = () => {
    if (paused || playing) return;
    const utterance = queue.shift();
    if (!utterance) return;
    playing = { utterance, left: Math.max(1400, utterance.text.length * 70) / utterance.rate, since: Date.now() };
    emit(utterance, "start");
    arm();
  };
  return {
    speak(utterance) {
      queue.push(utterance);
      run();
    },
    cancel() {
      window.clearTimeout(timer);
      queue = [];
      playing = null;
      paused = false;
    },
    pause() {
      if (paused) return;
      paused = true;
      window.clearTimeout(timer);
      if (playing) playing.left -= Date.now() - playing.since;
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (playing) arm();
      else run();
    },
    getVoices: () => [],
  };
}

function Article({ silent = false, paragraphs = PARAGRAPHS }: { silent?: boolean; paragraphs?: string[] }): React.JSX.Element {
  const body = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLDivElement>(null);
  const again = useRef<number>(undefined);
  // The silent article reads itself from the first moment and starts over when it reaches the end, so it stays under way.
  // Stopping it, or pressing Listen in the other article, ends it for good: those are not a finish.
  const engine = useMemo(
    () =>
      silent
        ? simulatedEngine(() => {
            again.current = window.setTimeout(() => player.current?.querySelector("button")?.click(), 1800);
          })
        : undefined,
    [silent],
  );
  useEffect(() => {
    if (!silent) return;
    const timer = window.setTimeout(() => player.current?.querySelector("button")?.click(), 40);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(again.current);
    };
  }, [silent]);
  return (
    <article className="w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
      <p className="text-xs text-muted-foreground">Northwind journal &middot; Maya Okafor &middot; 2 min read</p>
      <h2 className="mt-1.5 text-xl leading-snug font-semibold tracking-[-0.02em] text-balance">Why we stopped measuring velocity</h2>
      <div ref={player} className="mt-4 mb-5">
        <ListenButton targetRef={body} label="Listen to this article" lang="en-GB" rates={[0.9, 1, 1.25, 1.5]} engine={engine} />
      </div>
      <div ref={body} className="grid gap-3.5 text-[0.9375rem] leading-relaxed text-foreground/90">
        {paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </article>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="Press Listen and your browser reads the article aloud, a sentence at a time, with the sentence being read highlighted. Nothing is downloaded and nothing leaves the page.">
        <Article />
      </Example>

      <Example caption="A silent engine, so the states show here: pause or resume, stop, change the speed. Progress is sentences, not time. Press Listen above and this one hands over: a page has one voice.">
        <Article silent paragraphs={PARAGRAPHS.slice(1)} />
      </Example>
    </div>
  );
}
