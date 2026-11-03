import type { ReactNode } from "react";

/** How many faces the scale has, from awful (1) to great (5). */
export const FACE_COUNT = 5;

/**
 * The size of a face, and with it the target around it: a face always sits in a target of 44px or more. The pull takes the empty edge of
 * the first target back, so the first face lines up with the legend above it and the word below it.
 */
export const FACE_SIZES = {
  sm: { face: "[&>svg]:size-6", target: "max-w-11", pull: "-ml-2.5", px: 44 },
  md: { face: "[&>svg]:size-8", target: "max-w-12", pull: "-ml-2", px: 48 },
  lg: { face: "[&>svg]:size-10", target: "max-w-14", pull: "-ml-2", px: 56 },
} as const;

export type FaceSize = keyof typeof FACE_SIZES;

/** The default words, worst first. */
export const FACE_WORDS = ["Awful", "Bad", "Okay", "Good", "Great"] as const;

// A dot is a stroke of no length with a round cap, so a face is made of strokes only and one colour paints all of it.
const dot = (x: number, y: number): ReactNode => <path d={`M${x} ${y}h.01`} strokeWidth={2.5} />;

/**
 * The features of the five faces, on a 24px grid. They differ in shape and not in colour: squeezed eyes and a deep frown, a small frown,
 * a flat mouth, a small smile, and laughing eyes over an open smile. A chosen face fills its disc and turns the features round.
 */
const FEATURES: readonly ReactNode[] = [
  <>
    <path d="M7.5 9.25l2.75 1.5-2.75 1.5" />
    <path d="M16.5 9.25l-2.75 1.5 2.75 1.5" />
    <path d="M8.5 17.25c.9-2.1 2.1-3.1 3.5-3.1s2.6 1 3.5 3.1" />
  </>,
  <>
    {dot(9, 10)}
    {dot(15, 10)}
    <path d="M9 16.25c.8-1.2 1.8-1.8 3-1.8s2.2.6 3 1.8" />
  </>,
  <>
    {dot(9, 10)}
    {dot(15, 10)}
    <path d="M9 15.25h6" />
  </>,
  <>
    {dot(9, 10)}
    {dot(15, 10)}
    <path d="M9 14.25c.8 1.2 1.8 1.8 3 1.8s2.2-.6 3-1.8" />
  </>,
  <>
    <path d="M7.25 10.75c.3-1.2.9-1.75 1.75-1.75s1.45.55 1.75 1.75" />
    <path d="M13.25 10.75c.3-1.2.9-1.75 1.75-1.75s1.45.55 1.75 1.75" />
    <path d="M7.75 13.5h8.5a4.25 4.25 0 0 1-8.5 0z" />
  </>,
];

/**
 * One face of the scale, drawn inline. Put it inside an element that declares `group/face` and carries `data-state="checked"` when the
 * face is the chosen one: the disc then fills and the features turn to the background colour.
 */
export function Face({ level }: { level: number }): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle
        cx={12}
        cy={12}
        r={9.25}
        className="transition-[fill,stroke] duration-200 group-data-[state=checked]/face:fill-foreground group-data-[state=checked]/face:stroke-foreground motion-reduce:transition-none"
      />
      <g className="transition-[stroke] duration-200 group-data-[state=checked]/face:stroke-background motion-reduce:transition-none">{FEATURES[level - 1]}</g>
    </svg>
  );
}
