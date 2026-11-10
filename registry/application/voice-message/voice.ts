/**
 * The voice message behind VoiceMessage, as plain functions: they hold no state
 * and call no hook, so a Server Component can use them too (to draw the same
 * waveform in an email, or to write a duration).
 */

/** The words the message says, for translation. A `{name}` mark in a sentence is filled in. */
export interface VoiceMessageLabels {
  /** Names the whole message for a screen reader; `{sender}` and `{total}`. Default "Voice message from {sender}, {total}". */
  group?: string;
  /** The sender's name when `sender` is "me" and you give no `name`. Default "you". */
  me?: string;
  /** The same for "them". Default "them". */
  them?: string;
  /** The play button's name. It keeps this name and says it is pressed while playing. Default "Play voice message". */
  play?: string;
  /** The waveform's name as a slider. Default "Seek in voice message". */
  seek?: string;
  /** The slider's value in words; `{time}` and `{total}`. Default "{time} of {total}". */
  position?: string;
  /** The speed button's name; `{speed}` is "1", "1.5" or "2". Default "Playback speed {speed}x, press to change". */
  speed?: string;
  /** What is said while the audio loads. Default "Loading voice message". */
  loading?: string;
  /** What is written when the audio cannot be loaded. Default "Could not load voice message". */
  failed?: string;
  /** The button that tries again. Default "Try again". */
  retry?: string;
}

export const DEFAULT_LABELS = {
  group: "Voice message from {sender}, {total}",
  me: "you",
  them: "them",
  play: "Play voice message",
  seek: "Seek in voice message",
  position: "{time} of {total}",
  speed: "Playback speed {speed}x, press to change",
  loading: "Loading voice message",
  failed: "Could not load voice message",
  retry: "Try again",
} satisfies Required<VoiceMessageLabels>;

export type Words = Required<VoiceMessageLabels>;

/** The speeds the toggle goes through, and round to the first again. */
export const SPEEDS = [1, 1.5, 2] as const;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** A time as it is written on a voice note: "0:12", "1:05". Negative and not-a-number read as zero. */
export function clock(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Peak values cut or stretched to `count` bars: each bar takes the loudest
 * peak that falls in it, and the whole is scaled so the loudest bar is full
 * height. Values may be on any scale; they are only compared with each other.
 */
export function resample(peaks: readonly number[], count: number): number[] {
  const clean = peaks.map((peak) => (Number.isFinite(peak) ? Math.abs(peak) : 0));
  if (clean.length === 0 || count <= 0) return Array.from({ length: Math.max(0, count) }, () => 0);
  const bars = Array.from({ length: count }, (_, bar) => {
    const from = Math.floor((bar * clean.length) / count);
    const to = Math.max(from + 1, Math.floor(((bar + 1) * clean.length) / count));
    let loudest = 0;
    for (let i = from; i < to && i < clean.length; i++) loudest = Math.max(loudest, clean[i] ?? 0);
    return loudest;
  });
  const top = Math.max(...bars);
  return top > 0 ? bars.map((bar) => bar / top) : bars;
}

/** A small deterministic generator (mulberry32): the same seed always gives the same numbers, so server and browser draw the same wave. */
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A waveform with the rhythm of speech, drawn from a seed (the address of the audio, say) when you have no peaks of your own: words, small gaps, and the odd loud syllable. */
export function fallbackPeaks(seed: string, count: number): number[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  const next = generator(hash);
  const peaks: number[] = [];
  let level = 0.5;
  for (let i = 0; i < count; i++) {
    level = Math.min(1, Math.max(0.08, level + (next() - 0.5) * 0.9));
    const gap = next() < 0.12 ? 0.35 : 1;
    peaks.push(Math.min(1, Math.max(0.1, level * gap * (0.55 + next() * 0.45))));
  }
  return peaks;
}
