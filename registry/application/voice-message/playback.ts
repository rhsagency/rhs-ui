/**
 * The tiny store that lets only one voice message play at a time. A message
 * that starts calls `claimPlayback` with a way to pause itself; the message
 * that held the place is paused first. It lives in the browser tab and has
 * nothing to do with the server: it is only ever called from a press.
 */
let holder: { id: string; pause: () => void } | null = null;

/** `id` starts playing: whoever else was playing is paused. */
export function claimPlayback(id: string, pause: () => void): void {
  if (holder && holder.id !== id) holder.pause();
  holder = { id, pause };
}

/** `id` stopped playing, so it no longer holds the place. A message that was never the holder changes nothing. */
export function releasePlayback(id: string): void {
  if (holder?.id === id) holder = null;
}

/** Pause whatever is playing, for a page that wants to stop all voice messages (a call comes in, a recording starts). */
export function pauseAllPlayback(): void {
  holder?.pause();
  holder = null;
}
