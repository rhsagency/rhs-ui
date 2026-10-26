// A message that appears while a finger or a mouse button is still down moves the next control from under the pointer and swallows its click (the usual way
// a blur check eats a submit), so such a message waits until the press is over.
//
// A mouse press moves the focus while the button is down. A touch tap does not: it runs pointerdown, touchstart, pointerup, touchend, and only then the mouse
// events the browser makes up (mousedown, which moves the focus and blurs the field, then mouseup and click). So a press is armed by pointerdown, mousedown and
// touchstart alike, and a release only counts when no newer press began after it was announced.

/** A press that began longer ago than this is taken to be stuck (its release never arrived), not to be the one that blurred the field. */
const STALE_MS = 3000;

let pressed = false;
let pressedAt = 0;
let presses = 0;
let tracking = false;
const afterRelease: (() => void)[] = [];

/** Starts watching presses for the whole page, once. Call it from an effect. */
export function trackPress(): void {
  if (tracking) return;
  tracking = true;
  const press = () => {
    pressed = true;
    pressedAt = performance.now();
    presses += 1;
  };
  const release = () => {
    const seen = presses;
    window.setTimeout(() => {
      // Touch makes its mouse events after it has released: a press that began since then is still going on.
      if (seen !== presses) return;
      pressed = false;
      for (const run of afterRelease.splice(0)) run();
    }, 0);
  };
  // Passive: these only watch, and a touch listener that could cancel would hold the page's scrolling back.
  const options = { capture: true, passive: true };
  for (const type of ["pointerdown", "mousedown", "touchstart"] as const) document.addEventListener(type, press, options);
  for (const type of ["pointerup", "pointercancel", "mouseup", "touchend", "touchcancel", "click"] as const) document.addEventListener(type, release, options);
}

/** Runs `run` now, or, while a press is going on, as soon as it is over. */
export function whenReleased(run: () => void): void {
  if (pressed && performance.now() - pressedAt < STALE_MS) afterRelease.push(run);
  else run();
}
