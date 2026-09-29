/**
 * The motions an animated icon is built from. Each preset returns one
 * IconMotionStep without its part: keyframes, duration and easing, and a
 * transform-origin in percent of the part's own box (the generator gives
 * every moving part `transform-box: fill-box`). `draw` marks a step that
 * needs pathLength and a dash on its element.
 *
 * Motions stay small: an icon is read at 16px, so a part moves a few grid
 * units at most and always comes back to where the still glyph has it.
 */
const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";
const IN_OUT = "cubic-bezier(0.45, 0, 0.55, 1)";
const t = (transform, extra = {}) => ({ transform, ...extra });
const rotateFrames = (degrees) => degrees.map((deg) => t(`rotate(${deg}deg)`, { easing: IN_OUT }));

export const PRESETS = {
  /** Out and back along a direction: arrows, chevrons, things that go somewhere. */
  nudge: (dx = 2.5, dy = 0) => ({ duration: 560, easing: IN_OUT, keyframes: [t("translate(0px, 0px)"), { offset: 0.42, transform: `translate(${dx}px, ${dy}px)` }, t("translate(0px, 0px)")] }),
  /** Leaves on one side and comes back from the other: downloads, drops, sends. */
  through: (dx = 0, dy = 6) => ({
    duration: 680,
    easing: "linear",
    keyframes: [
      { transform: "translate(0px, 0px)", opacity: 1, easing: "cubic-bezier(0.4, 0, 1, 1)" },
      { offset: 0.42, transform: `translate(${dx}px, ${dy}px)`, opacity: 0 },
      { offset: 0.43, transform: `translate(${-dx}px, ${-dy}px)`, opacity: 0, easing: EASE },
      { transform: "translate(0px, 0px)", opacity: 1 },
    ],
  }),
  /** Hangs from its top and swings out: bells, medals, signs. */
  swing: (amount = 14) => ({ duration: 900, easing: "linear", origin: "50% 0%", keyframes: rotateFrames([0, amount, -amount * 0.78, amount * 0.5, -amount * 0.22, 0]) }),
  /** A quick shake on the spot. */
  wiggle: (amount = 10) => ({ duration: 620, easing: "linear", origin: "50% 50%", keyframes: rotateFrames([0, -amount, amount * 0.8, -amount * 0.5, amount * 0.25, 0]) }),
  /** Leans over and comes back, from a corner or edge. */
  tilt: (deg = -14, origin = "50% 100%") => ({ duration: 620, easing: IN_OUT, origin, keyframes: [t("rotate(0deg)"), { offset: 0.45, transform: `rotate(${deg}deg)` }, t("rotate(0deg)")] }),
  /** Moves in the wind from its base: plants, trees, boats. */
  sway: (amount = 7, origin = "50% 100%") => ({ duration: 1100, easing: "linear", origin, keyframes: rotateFrames([0, -amount, amount * 0.75, -amount * 0.4, amount * 0.15, 0]) }),
  /** A whole turn, or `deg` of one. */
  spin: (deg = 360, origin = "50% 50%") => ({ duration: Math.max(520, Math.abs(deg) * 2.4), easing: IN_OUT, origin, keyframes: [t("rotate(0deg)"), t(`rotate(${deg}deg)`)] }),
  /** Grows past its size and settles. */
  pop: (scale = 1.2) => ({ duration: 560, easing: "linear", origin: "50% 50%", keyframes: [1, scale, 0.94, 1.03, 1].map((s) => t(`scale(${s})`, { easing: IN_OUT })) }),
  /** Pushed in, like a button under a finger. */
  press: () => ({ duration: 420, easing: "linear", origin: "50% 50%", keyframes: [1, 0.84, 1.03, 1].map((s) => t(`scale(${s})`, { easing: IN_OUT })) }),
  /** Two beats. */
  beat: () => ({ duration: 820, easing: "linear", origin: "50% 50%", keyframes: [1, 1.16, 1, 1.1, 1].map((s) => t(`scale(${s})`, { easing: IN_OUT })) }),
  /** Breathes once. */
  pulse: (scale = 1.14) => ({ duration: 760, easing: IN_OUT, origin: "50% 50%", keyframes: [t("scale(1)", { opacity: 1 }), t(`scale(${scale})`, { opacity: 0.55 }), t("scale(1)", { opacity: 1 })] }),
  /** Closes and opens, top to bottom: eyes, lenses, LEDs. */
  blink: () => ({ duration: 340, easing: IN_OUT, origin: "50% 50%", keyframes: [t("scaleY(1)"), t("scaleY(0.1)"), t("scaleY(1)")] }),
  /** Flickers like a light: lightning, bulbs, charging. */
  flash: () => ({ duration: 720, easing: "linear", keyframes: [1, 0.15, 1, 0.4, 1].map((opacity) => ({ opacity })) }),
  /** Fades out and back: a text cursor. */
  fade: () => ({ duration: 900, easing: "steps(2, jump-none)", keyframes: [{ opacity: 1 }, { opacity: 0 }, { opacity: 1 }] }),
  /** Jumps and lands with a smaller second hop. */
  bounce: (height = 3) => ({ duration: 720, easing: "linear", keyframes: [0, -height, 0, -height * 0.35, 0].map((y) => t(`translateY(${y}px)`, { easing: IN_OUT })) }),
  /** Drifts up and settles, slowly. */
  float: (height = 2) => ({ duration: 1200, easing: IN_OUT, keyframes: [t("translateY(0px)"), t(`translateY(${-height}px)`), t("translateY(0px)")] }),
  /** Side to side, fast: a warning, a phone buzzing. */
  shake: (amount = 1.6) => ({ duration: 520, easing: "linear", keyframes: [0, -amount, amount, -amount * 0.75, amount * 0.75, -amount * 0.35, 0].map((x) => t(`translateX(${x}px)`)) }),
  /** Rubs back and forth, slower and wider than a shake. */
  rub: () => ({ duration: 760, easing: "linear", keyframes: [0, -2, 2, -1.5, 1, 0].map((x) => t(`translateX(${x}px)`, { easing: IN_OUT })) }),
  /** Draws its line from the start. */
  draw: (duration = 700) => ({ draw: true, duration, easing: EASE, keyframes: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }] }),
  /** Appears: fades and grows in. For parts that arrive one after another. */
  reveal: () => ({ duration: 420, easing: EASE, origin: "50% 50%", keyframes: [t("scale(0.6)", { opacity: 0 }), t("scale(1)", { opacity: 1 })] }),
  /** Grows along one axis from an edge: bars, meters, mercury. */
  grow: (axis = "y", origin = "50% 100%") => ({ duration: 560, easing: EASE, origin, keyframes: [t(`scale${axis.toUpperCase()}(0.2)`), t(`scale${axis.toUpperCase()}(1)`)] }),
  /** Turns around its vertical axis: coins, globes, cards. */
  flip: () => ({ duration: 620, easing: IN_OUT, origin: "50% 50%", keyframes: [t("scaleX(1)"), t("scaleX(0.08)"), t("scaleX(1)")] }),
  /** A flame's lick: stretches and leans from its base. */
  flicker: () => ({ duration: 820, easing: "linear", origin: "50% 100%", keyframes: ["none", "scaleY(1.08) skewX(-3deg)", "scaleY(0.95) skewX(2deg)", "scaleY(1.04) skewX(-1deg)", "none"].map((transform) => ({ transform, easing: IN_OUT })) }),
  /** Ripples from its fixed edge: flags, curtains. */
  flutter: (origin = "0% 50%") => ({ duration: 820, easing: "linear", origin, keyframes: [1, 0.86, 1.05, 0.97, 1].map((s) => t(`scaleX(${s})`, { easing: IN_OUT })) }),
  /** Drives forward and brakes. */
  drive: () => ({ duration: 720, easing: "linear", keyframes: [0, 2.5, -0.8, 0].map((x) => t(`translateX(${x}px)`, { easing: IN_OUT })) }),
  /** Thrown up with a turn: caps, balls. */
  toss: () => ({ duration: 760, easing: IN_OUT, origin: "50% 50%", keyframes: [t("translateY(0px) rotate(0deg)"), t("translateY(-4px) rotate(-14deg)"), t("translateY(0px) rotate(0deg)")] }),
  /** Rises and fades away: steam, smoke. */
  rise: () => ({ duration: 900, easing: "linear", keyframes: [{ transform: "translateY(0px)", opacity: 1, easing: "ease-in" }, { offset: 0.5, transform: "translateY(-2.5px)", opacity: 0 }, { offset: 0.51, transform: "translateY(1.5px)", opacity: 0, easing: EASE }, { transform: "translateY(0px)", opacity: 1 }] }),
};
