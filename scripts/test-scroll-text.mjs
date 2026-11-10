// Words that move with the scroll are readable wherever the scroll stops (WCAG 1.4.3): `reveal` moves an element at
// full opacity and sharp unless `fade` is asked for, and the waiting words of `text-reveal` keep the 3:1 of large text
// (a dim of 0.5 or more). rhsui.com measured both old defaults failing at rest (2026-11-10): cards at 1.45 to 4.36:1,
// waiting words at 1.5:1 on a light page.
//   node scripts/test-scroll-text.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../registry/motion/${file}`, import.meta.url), "utf8");

/** The two rules, on a source text, so the self-test below can run them on the old defaults too. */
export function scrollTextProblems(reveal, textReveal) {
  const problems = [];
  if (!/\bfade = false\b/.test(reveal)) problems.push("reveal: `fade` is not off by default");
  if (!/const start = fade \? motion : \{ \.\.\.motion, opacity: 1, filter: "none" \}/.test(reveal)) problems.push("reveal: without `fade` the start is not opaque and sharp");
  const dim = Number(textReveal.match(/\bdim = ([\d.]+)/)?.[1]);
  if (!(dim >= 0.5)) problems.push(`text-reveal: the default dim is ${Number.isNaN(dim) ? "not found" : dim}, 0.5 keeps 3:1 on a light page`);
  return problems;
}

/**
 * scroll-away's keyframes: it clears its content away with a clip that closes from below, never with opacity, so the
 * lines still in view keep their contrast (its fade left them at 1.77:1 half way, measured in its demo's panel).
 */
export function scrollAwayProblems(keyframes) {
  const problems = [];
  const frames = Object.values(keyframes ?? {});
  if (!frames.length) return ["scroll-away: no @keyframes rhs-scroll-away"];
  if (frames.some((frame) => "opacity" in frame)) problems.push("scroll-away: the keyframes change opacity");
  if (!/^inset\(\S+ \S+ 100% \S+\)$/.test(keyframes.to?.["clip-path"] ?? "")) problems.push("scroll-away: it does not end clipped shut from below");
  return problems;
}

// The rules catch the old defaults (a gate that cannot fail proves nothing).
const OLD_REVEAL = 'export function Reveal({ effect = "rise", distance = 48 }) { const start = startOf(effect, distance); }';
const OLD_TEXT = 'export function TextReveal({ text, dim = 0.18 }) {}';
assert.equal(scrollTextProblems(OLD_REVEAL, OLD_TEXT).length, 3, "the self-test sees all three faults in the old defaults");
assert.equal(scrollAwayProblems({ to: { opacity: "0", transform: "var(--away-transform)" } }).length, 2, "the self-test sees the old fade-out");

assert.deepEqual(scrollTextProblems(read("reveal.tsx"), read("text-reveal.tsx")), []);
const motion = JSON.parse(read("registry.json"));
const scrollAway = (motion.items ?? motion).find((item) => item.name === "scroll-away");
assert.deepEqual(scrollAwayProblems(scrollAway?.css?.["@keyframes rhs-scroll-away"]), []);
console.log("test-scroll-text: reveal moves at full opacity unless fade, text-reveal waits at dim 0.5, scroll-away clears with a clip (self-tests passed)");
