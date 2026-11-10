"use client";

import { useEffect, useState, type ReactNode } from "react";

import { VoiceMessage } from "@rhs-ui/application/voice-message";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The loudness of a recording, as a demo has no real one: a few slow swells with the rhythm of speech. */
const peaksFor = (seed: number, count = 72) =>
  Array.from({ length: count }, (_, i) => Math.abs(Math.sin(i * 0.5 + seed) * 0.6 + Math.sin(i * 0.21 + seed * 2) * 0.4) * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.1 + seed))));

/**
 * A short clip of a low, wavering tone with the swells of speech, as a WAV data URI. A demo has no recording to ship, and a real clip is what makes
 * play, pause, speed and seeking real. It is made in the browser once the page is up, and kept small: four thousand samples a second.
 */
function makeClip(seconds: number, pitch: number): string {
  const rate = 4000;
  const samples = Math.floor(seconds * rate);
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const write = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    const swell = Math.max(0, Math.sin(2 * Math.PI * t * 2.4 + Math.sin(t * 0.7) * 3)) ** 1.4;
    const f = pitch * (1 + 0.1 * Math.sin(2 * Math.PI * t * 0.8));
    const sample = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(2 * Math.PI * f * 2 * t) * 0.25) * swell * 0.3;
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return `data:audio/wav;base64,${btoa(binary)}`;
}

const CLIPS = [
  { seconds: 14, pitch: 190 },
  { seconds: 7, pitch: 120 },
  { seconds: 42, pitch: 165 },
] as const;

export default function Demo(): React.JSX.Element {
  const [clips, setClips] = useState<string[] | null>(null);
  const [heard, setHeard] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setClips(CLIPS.map((clip) => makeClip(clip.seconds, clip.pitch)));
  }, []);

  return (
    <div className="grid w-full max-w-3xl gap-x-10 gap-y-10 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
      <Example caption="Try it: play one, then another, and the first stops. The speed button goes 1x, 1.5x, 2x; drag the waveform or use the arrow keys to seek. A message that ends goes back to its start.">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-center text-xs text-muted-foreground">Today, 09:41</p>
          <VoiceMessage
            sender="them"
            name="Priya"
            src={clips?.[0]}
            duration={14}
            peaks={peaksFor(1)}
            defaultTime={5}
            onPlay={() => setHeard((before) => ({ ...before, priya1: true }))}
          />
          <VoiceMessage sender="me" src={clips?.[1]} duration={7} peaks={peaksFor(4.3)} />
          <VoiceMessage sender="them" name="Priya" src={clips?.[2]} duration={42} peaks={peaksFor(2.2)} onPlay={() => setHeard((before) => ({ ...before, priya2: true }))} />
          <p role="status" className="text-center text-xs text-muted-foreground">
            {heard.priya1 || heard.priya2 ? "Priya sees that you listened." : "Priya will see when you listen."}
          </p>
        </div>
      </Example>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="If the audio cannot be loaded, the bubble says so in words and offers Try again.">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            <VoiceMessage sender="them" name="Priya" src="data:audio/wav;base64,AAAA" duration={23} peaks={peaksFor(7.1)} />
          </div>
        </Example>

        <Example caption="No peaks given: the waveform is drawn from the address of the audio, the same on the server and in the browser.">
          <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
            {clips ? <VoiceMessage sender="me" src={clips[1]} duration={7} /> : <div aria-hidden="true" className="h-[3.875rem]" />}
          </div>
        </Example>
      </div>
    </div>
  );
}
