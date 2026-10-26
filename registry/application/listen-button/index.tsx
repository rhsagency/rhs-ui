"use client";

import { useEffect, useRef, useState, type ComponentProps, type RefObject } from "react";

import { claimVoice, collectSentences, drawHighlight, followRange, freeVoice, type Sentence } from "@rhs-ui/application/listen-button/speech";
import { IconChevronDown, IconHeadphones, IconStop } from "@rhs-ui/icons";
import { IconPlayPauseAnimated } from "@rhs-ui/icons/animated/play-pause";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { ButtonGroup } from "@rhs-ui/primitives/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

/** What the button is doing: waiting, reading, paused, or unable to (the browser has no speech, so it renders nothing). */
export type ListenState = "idle" | "speaking" | "paused" | "unavailable";

/** The part of `speechSynthesis` this button uses. Pass your own for a native shell or to try the states without sound. */
export interface SpeechEngine {
  /** Says one utterance. The button hands over one sentence at a time. */
  speak(utterance: SpeechSynthesisUtterance): void;
  /** Stops whatever is being said and drops everything waiting. */
  cancel(): void;
  /** Holds the current utterance where it is. */
  pause(): void;
  /** Carries on from a pause. */
  resume(): void;
  /** The voices the engine has, to find the one asked for by name. */
  getVoices(): SpeechSynthesisVoice[];
  /** Whether something is being said. Optional: an engine without it is taken to be quiet between presses. */
  readonly speaking?: boolean;
  /** Whether something is waiting to be said. Optional. */
  readonly pending?: boolean;
  /** Whether the engine is paused. Optional: a browser that reports false right after `pause()` cannot pause, and the button then stops and starts the sentence again. */
  readonly paused?: boolean;
}

export interface ListenButtonProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** What to read. Use this, or `targetRef`. */
  text?: string;
  /** An element whose text is read sentence by sentence, with the sentence being read highlighted. It wins over `text`. */
  targetRef?: RefObject<HTMLElement | null>;
  /** The language of the text, as a BCP 47 tag: "en-GB". It picks the voice and how sentences are cut. Default "en-US". */
  lang?: string;
  /** The speeds in the menu, as multiples of normal: 0.9, 1, 1.25. Default 0.75, 1, 1.25 and 1.5. */
  rates?: readonly number[];
  /** The speed it starts at. Default 1, or the first of `rates`. */
  defaultRate?: number;
  /** Called whenever the state changes, and with "unavailable" where the browser cannot speak. */
  onStateChange?: (state: ListenState) => void;
  /** A voice by name or `voiceURI`. Without it the browser picks one for `lang`. */
  voice?: string;
  /** What the button says at rest. Default "Listen". */
  label?: string;
  /** 32, 36 or 44px. Default "default". */
  size?: "sm" | "default" | "lg";
  /** Any Button variant. Outline by default. */
  variant?: ButtonProps["variant"];
  /** Language of the speed and progress figures. Default "en-US". */
  locale?: string;
  /** Where speech comes from. Defaults to `window.speechSynthesis`. */
  engine?: SpeechEngine;
}

const DEFAULT_RATES = [0.75, 1, 1.25, 1.5] as const;

/**
 * Listen to this article: the browser's own speech, with no file and no server.
 * One press reads the text aloud, sentence by sentence; the same button pauses
 * and resumes, a second one stops, and a small menu picks the speed. When the
 * text is an element on the page, the sentence being read is highlighted so
 * people can follow along. Reading in sentences also sidesteps Chrome stopping
 * long utterances. A page has one voice: pressing a second button stops the
 * first, and if anything else cuts the speech off the button goes back to
 * rest. It stops when the page is hidden or leaves, shows progress as
 * "Sentence 4 of 31" instead of a time (a speech engine cannot know one),
 * announces each change politely and, where the browser cannot speak, renders
 * nothing.
 */
export function ListenButton({
  text,
  targetRef,
  lang = "en-US",
  rates = DEFAULT_RATES,
  defaultRate,
  onStateChange,
  voice,
  label = "Listen",
  size = "default",
  variant = "outline",
  locale = "en-US",
  engine,
  className,
  ...props
}: ListenButtonProps) {
  const [state, setState] = useState<ListenState>("idle");
  const [rate, setRate] = useState(defaultRate ?? (rates.includes(1) ? 1 : (rates[0] ?? 1)));
  const [progress, setProgress] = useState({ index: 0, total: 0 });
  // Rendered first, so the server and the browser agree; a browser without speech takes it away right after.
  const [supported, setSupported] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  // The state as the handlers see it: timers and speech events outlive a render.
  const phase = useRef<ListenState>("idle");
  // Each start gets a number; anything an older start left behind (an utterance that ends late) checks it and does nothing.
  const turn = useRef(0);
  const timer = useRef<number>(undefined);
  const lines = useRef<Sentence[]>([]);
  const at = useRef(0);
  // Chrome can lose an utterance's events once the object is garbage collected, so the one being said is kept here.
  const saying = useRef<SpeechSynthesisUtterance | null>(null);
  // A browser that cannot pause stops instead; resuming then starts the sentence again.
  const restart = useRef(false);
  const mainButton = useRef<HTMLButtonElement>(null);
  const stopButton = useRef<HTMLButtonElement>(null);
  const latest = useRef({ engine, voice, lang, onStateChange });
  const reported = useRef<ListenState | null>(null);
  // Names this button when it takes the voice, so a second button can tell this one to stop.
  const [me] = useState(() => ({}));
  useEffect(() => {
    latest.current = { engine, voice, lang, onStateChange };
  });

  const speech = (): SpeechEngine | undefined => latest.current.engine ?? (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : undefined);
  const go = (next: ListenState): void => {
    phase.current = next;
    setState(next);
  };

  useEffect(() => {
    if (!engine && !("speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function")) setSupported(false);
  }, [engine]);

  useEffect(() => {
    const now = supported ? state : "unavailable";
    if (reported.current === now) return;
    // The first report is the starting state: nothing to tell anyone yet, unless it is already unavailable.
    const first = reported.current === null;
    reported.current = now;
    if (!first || now === "unavailable") latest.current.onStateChange?.(now);
  }, [state, supported]);

  /** Ends whatever is being said, and everything an earlier start left waiting. */
  function quiet(cancel = true): void {
    turn.current += 1;
    window.clearTimeout(timer.current);
    saying.current = null;
    restart.current = false;
    if (cancel) {
      try {
        speech()?.cancel();
      } catch {
        // An engine that is already gone has nothing left to cancel.
      }
    }
    drawHighlight(null);
  }

  /** Ends the reading. Pass `cancel = false` when something else already took the engine: cancelling again would cut that off. */
  function stop(spoken?: string, cancel = true): void {
    // The stop button goes away with the reading: focus stays on the control that is left, not on the page.
    if (typeof document !== "undefined" && document.activeElement === stopButton.current) mainButton.current?.focus();
    quiet(cancel);
    freeVoice(me);
    go("idle");
    if (spoken) setAnnouncement(spoken);
  }

  function speakFrom(index: number, speed: number): void {
    const synth = speech();
    if (!synth) return;
    // Cancel only when something is there to cancel, and in a browser that wants the first speak() inside the press (iPhone), start at once.
    const crowded = Boolean(synth.speaking || synth.pending || synth.paused);
    quiet(crowded);
    // Chrome stays paused after a pause and a cancel, and the next speak() would then say nothing.
    if (crowded && synth.paused) synth.resume();
    const mine = turn.current;
    const next = (position: number): void => {
      if (mine !== turn.current) return;
      const sentence = lines.current[position];
      if (!sentence) {
        stop("Finished reading.");
        return;
      }
      at.current = position;
      setProgress({ index: position, total: lines.current.length });
      drawHighlight(sentence.range);
      followRange(sentence.range);
      // An engine of your own may take a plain object where the browser has no SpeechSynthesisUtterance.
      const utterance = (typeof SpeechSynthesisUtterance === "function" ? new SpeechSynthesisUtterance(sentence.text) : { text: sentence.text }) as SpeechSynthesisUtterance;
      utterance.lang = latest.current.lang;
      utterance.rate = speed;
      const wanted = latest.current.voice;
      const chosen = wanted ? synth.getVoices().find((item) => item.name === wanted || item.voiceURI === wanted) : undefined;
      if (chosen) utterance.voice = chosen;
      utterance.onend = () => next(position + 1);
      utterance.onerror = (event) => {
        // Cancelling to start again is how a change of speed works, not a failure: quiet() has already moved `turn` on, so that error is not ours any more.
        if (mine !== turn.current) return;
        // An interruption that still carries this turn came from someone else (other speech on the page, the system taking the audio). The reading is over, and the engine is theirs: let go without cancelling it.
        if (event.error === "interrupted" || event.error === "canceled") stop("Stopped.", false);
        else stop("Could not read this aloud.");
      };
      saying.current = utterance;
      synth.speak(utterance);
    };
    // Some browsers drop a speak() that comes straight after a cancel(), so then the first sentence waits a moment.
    if (crowded) timer.current = window.setTimeout(() => next(index), 60);
    else next(index);
  }

  function begin(): void {
    const found = collectSentences({ text, element: targetRef?.current }, latest.current.lang);
    if (!found.length) {
      setAnnouncement("There is nothing to read.");
      return;
    }
    lines.current = found;
    at.current = 0;
    setProgress({ index: 0, total: found.length });
    // One voice and one highlight to a page: a button that was reading stops first.
    claimVoice(me, () => stop("Stopped."));
    go("speaking");
    setAnnouncement("Reading aloud.");
    speakFrom(0, rate);
  }

  function pause(): void {
    const synth = speech();
    synth?.pause();
    go("paused");
    setAnnouncement("Paused.");
    // A browser that cannot pause (Chrome on Android) carries on talking. Then pausing is stopping, and resuming says the sentence again.
    window.setTimeout(() => {
      if (phase.current !== "paused" || !synth || synth.paused !== false) return;
      quiet();
      restart.current = true;
    }, 150);
  }

  function resume(): void {
    go("speaking");
    setAnnouncement("Reading aloud.");
    if (restart.current) speakFrom(at.current, rate);
    else speech()?.resume();
  }

  function toggle(): void {
    if (phase.current === "idle") begin();
    else if (phase.current === "speaking") pause();
    else resume();
  }

  function pickRate(next: number): void {
    setRate(next);
    if (phase.current === "idle") return;
    go("speaking");
    speakFrom(at.current, next);
  }

  // Nothing keeps talking in a tab nobody is looking at, or after the page is gone.
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === "hidden" && phase.current !== "idle") stop();
    };
    const leave = () => stop();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
      // Only a button that is reading has anything to stop: an idle one going away must not cut off another's voice.
      if (phase.current !== "idle") quiet();
      freeVoice(me);
    };
  }, []);

  if (!supported) return null;

  const numbers = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const speed = (value: number) => `${numbers.format(value)}×`;
  const active = state !== "idle";

  return (
    <div data-slot="listen-button" data-state={state} className={cn("inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-2", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <ButtonGroup aria-label="Read aloud" variant={variant} size={size} className="min-w-0 max-w-full">
        <Button ref={mainButton} type="button" aria-label={state === "speaking" ? "Pause reading" : state === "paused" ? "Resume reading" : label} onClick={toggle} className="min-w-0 shrink overflow-hidden">
          {/* Pause turns into play and back, so pausing and resuming read as one control changing its mind. */}
          {state === "idle" ? <IconHeadphones /> : <IconPlayPauseAnimated active={state === "speaking"} />}
          <span className="truncate">{state === "speaking" ? "Pause" : state === "paused" ? "Resume" : label}</span>
        </Button>
        {active ? (
          <Button ref={stopButton} type="button" size="icon" aria-label="Stop reading" onClick={() => stop("Stopped.")}>
            <IconStop />
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={variant} size={size} aria-label={`Reading speed, ${speed(rate)}`} className="gap-1 px-2.5 tabular-nums">
              {speed(rate)}
              <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuLabel>Speed</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={String(rate)} onValueChange={(value) => pickRate(Number(value))}>
              {rates.map((value) => (
                <DropdownMenuRadioItem key={value} value={String(value)}>
                  <span className="tabular-nums">{speed(value)}</span>
                  {value === 1 ? <span className="text-muted-foreground">Normal</span> : null}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>
      {active ? (
        <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          Sentence {numbers.format(progress.index + 1)} of {numbers.format(progress.total)}
        </span>
      ) : null}
    </div>
  );
}
