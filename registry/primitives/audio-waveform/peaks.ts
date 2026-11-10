/** Keep `value` between `min` and `max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Bring any number of peaks to exactly `count`, for a width that holds that
 * many bars. More peaks than bars: each bar takes its slice, a blend of the
 * loudest and the average, so a transient still shows. Fewer: the bars lie on
 * a line drawn between the peaks.
 */
export function resamplePeaks(peaks: readonly number[], count: number): number[] {
  const total = peaks.length;
  if (count <= 0) return [];
  if (total === 0) return Array.from({ length: count }, () => 0);
  const at = (index: number): number => clamp(Number.isFinite(peaks[index]) ? (peaks[index] as number) : 0, 0, 1);
  return Array.from({ length: count }, (_, bar) => {
    if (total >= count) {
      const from = Math.floor((bar * total) / count);
      const to = Math.max(from + 1, Math.floor(((bar + 1) * total) / count));
      let loudest = 0;
      let sum = 0;
      for (let index = from; index < to; index += 1) {
        const peak = at(index);
        loudest = Math.max(loudest, peak);
        sum += peak;
      }
      return loudest * 0.5 + (sum / (to - from)) * 0.5;
    }
    const position = count === 1 ? 0 : (bar / (count - 1)) * (total - 1);
    const lower = Math.floor(position);
    const upper = Math.min(total - 1, lower + 1);
    return at(lower) + (at(upper) - at(lower)) * (position - lower);
  });
}

/**
 * Reduce raw samples, one channel from -1 to 1, to `count` peaks from 0 to 1,
 * the loudest of each slice, scaled so the loudest of all is 1. Long audio is
 * sampled with a stride, so ten minutes cost about the same as ten seconds.
 */
export function peaksFromChannelData(data: ArrayLike<number>, count: number): number[] {
  const bars = Math.max(1, Math.floor(count));
  const size = data.length / bars;
  const stride = Math.max(1, Math.floor(size / 64));
  const peaks = Array.from({ length: bars }, (_, bar) => {
    const from = Math.floor(bar * size);
    const to = Math.min(data.length, Math.max(from + 1, Math.floor((bar + 1) * size)));
    let loudest = 0;
    for (let index = from; index < to; index += stride) loudest = Math.max(loudest, Math.abs(data[index] ?? 0));
    return loudest;
  });
  const top = peaks.reduce((loudest, peak) => Math.max(loudest, peak), 0);
  return top > 0 ? peaks.map((peak) => peak / top) : peaks;
}

/** Peaks from audio the browser has already decoded. The louder channel counts. */
export function peaksFromAudioBuffer(buffer: AudioBuffer, count = 200): number[] {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, channel) => peaksFromChannelData(buffer.getChannelData(channel), count));
  return Array.from({ length: Math.max(1, Math.floor(count)) }, (_, bar) => channels.reduce((loudest, channel) => Math.max(loudest, channel[bar] ?? 0), 0));
}

/**
 * Peaks from the bytes of an audio file (an MP3, WAV, M4A or whatever the
 * browser can decode), in the browser: `peaksFromArrayBuffer(await (await fetch(url)).arrayBuffer())`.
 * For a long file, work them out once on your server and pass the numbers.
 */
export async function peaksFromArrayBuffer(data: ArrayBuffer, count = 200): Promise<number[]> {
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) throw new Error("This browser cannot decode audio.");
  const context = new Context();
  try {
    return peaksFromAudioBuffer(await context.decodeAudioData(data.slice(0)), count);
  } finally {
    void context.close();
  }
}

/** 83 becomes "1:23" and 3725 becomes "1:02:05". */
export function clock(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

const unit = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** 83 becomes "1 minute 23 seconds": the way a screen reader should say a time. */
export function spokenClock(seconds: number): string {
  const whole = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (minutes > 0) parts.push(unit(minutes, "minute"));
  if (rest > 0 || parts.length === 0) parts.push(unit(rest, "second"));
  return parts.join(" ");
}
