/**
 * The one-clip-at-a-time rule for short sounds. A page can hold dozens of play
 * buttons (a word list, a sample pack), and two clips talking over each other
 * is never what anyone wants: starting a clip claims the single place, and
 * whichever clip held it is told to stop. A module-level value is enough
 * because it is shared by every button on the page.
 */
type Stop = () => void;

let current: Stop | null = null;

/** Make `stop` the clip that is playing. The clip that was playing before it is stopped. */
export function claimPlayback(stop: Stop): void {
  const previous = current;
  current = stop;
  if (previous && previous !== stop) previous();
}

/** The clip has ended or been stopped: free the place, unless another clip has already taken it. */
export function releasePlayback(stop: Stop): void {
  if (current === stop) current = null;
}
