import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface GradeScaleLabels {
  /** The sentence a screen reader hears. `{label}`, `{grade}`, `{first}` and `{last}` are filled in. */
  graded?: string;
  /** The sentence when the product has no grade on this scale. `{label}`, `{first}` and `{last}`. */
  ungraded?: string;
}

const WORDS = {
  graded: "{label} {grade}, on a scale from {first} to {last}",
  ungraded: "{label}: not graded, on a scale from {first} to {last}",
} satisfies Required<GradeScaleLabels>;

export interface GradeScaleProps extends Omit<ComponentProps<"div">, "children"> {
  /** The grades from best to worst. Defaults to A to G, the shape of an energy class. Pass `["A", "B", "C", "D", "E"]` for an eco score. */
  grades?: readonly string[];
  /** The product's grade. When it is not one of `grades` the scale is drawn without a marker and says the product is not graded. */
  value?: string;
  /** What is graded, in a word or two: "Energy class", "Eco score". It starts the sentence a screen reader hears. */
  label?: string;
  /** A column of bars that grow longer towards the worst grade, or a row of steps that grow taller. */
  orientation?: "vertical" | "horizontal";
  /** The size of the whole scale. */
  size?: "sm" | "md" | "lg";
  /** Said at the best end of the scale: "More efficient". */
  best?: string;
  /** Said at the worst end of the scale: "Less efficient". */
  worst?: string;
  /** The words, for another language. */
  labels?: GradeScaleLabels;
}

const DEFAULT_GRADES = ["A", "B", "C", "D", "E", "F", "G"] as const;

/**
 * Per size: the height of a row and of the marked row, the gap between steps, the width kept for the marker, the type
 * sizes, the height of the shortest and of the tallest step in a row of steps, and the room above them for the marker.
 */
const SIZES = {
  sm: { row: 20, picked: 30, gap: 4, tag: 40, point: 4, text: "text-[0.6875rem]", tagText: "text-xs", rise: [18, 34], lane: 22 },
  md: { row: 26, picked: 40, gap: 5, tag: 52, point: 6, text: "text-xs", tagText: "text-xl", rise: [26, 52], lane: 34 },
  lg: { row: 34, picked: 52, gap: 6, tag: 68, point: 8, text: "text-sm", tagText: "text-2xl", rise: [34, 76], lane: 44 },
} as const;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const lerp = (from: number, to: number, step: number, steps: number): number => (steps <= 1 ? from : from + ((to - from) * step) / (steps - 1));

/**
 * The tone of a step: darkest for the best grade, lightest for the worst. The first half carries light letters and
 * the rest dark ones, so every letter keeps its contrast on its own bar in both themes. The lightest tone stops at
 * 12 percent and every step has a 35 percent ring, so even the last bar keeps an edge you can see against the card.
 */
function toneOf(index: number, count: number): { background: string; color: string } {
  const dark = Math.ceil(count / 2);
  const share = index < dark ? lerp(92, 66, index, dark) : lerp(44, 12, index - dark, count - dark);
  return {
    background: `color-mix(in oklch, var(--foreground) ${Math.round(share)}%, var(--background))`,
    color: index < dark ? "var(--background)" : "var(--foreground)",
  };
}

/**
 * A graded scale, such as an energy class, an eco score or a repairability index: every grade drawn, with the
 * product's grade enlarged and marked. The steps differ in length (the best is the shortest) as well as in tone, so
 * the scale still reads in one colour, on paper and for someone who cannot tell the tones apart. The whole scale is
 * one image with one sentence ("Energy class C, on a scale from A to G"). It is a drawing of a scale, not an
 * official label: bring your certified data to it and it claims nothing of its own.
 */
export function GradeScale({ grades = DEFAULT_GRADES, value, label = "Grade", orientation = "vertical", size = "md", best, worst, labels, className, ...props }: GradeScaleProps) {
  const words = { ...WORDS, ...labels };
  const steps = grades.length;
  if (steps === 0) return null;

  const picked = value === undefined ? -1 : grades.indexOf(value);
  const first = grades[0] ?? "";
  const last = grades[steps - 1] ?? "";
  const sentence = picked < 0 ? fill(words.ungraded, { label, first, last }) : fill(words.graded, { label, grade: grades[picked] ?? "", first, last });
  const spec = SIZES[size];
  // The best grade is about a third of the way along; the worst fills the track.
  const length = (index: number): number => lerp(0.34, 1, index, steps);

  const caption = "text-[0.6875rem] leading-none text-muted-foreground";
  const ends =
    best || worst ? (
      <div aria-hidden="true" className={cn("flex justify-between gap-3", caption)}>
        <span>{best}</span>
        <span className="text-right">{worst}</span>
      </div>
    ) : null;

  if (orientation === "horizontal") {
    // The tallest step sets the height of every column, so the marker has the same room wherever it is.
    const [shortest, tallest] = spec.rise;
    return (
      <div data-slot="grade-scale" data-orientation="horizontal" data-size={size} role="img" aria-label={sentence} className={cn("grid gap-2 text-foreground", className)} {...props}>
        <div aria-hidden="true" className="flex items-end" style={{ gap: spec.gap }}>
          {grades.map((grade, index) => {
            const tone = toneOf(index, steps);
            const marked = index === picked;
            return (
              <div key={`${grade}-${index}`} data-grade={grade} data-picked={marked || undefined} className="flex min-w-0 flex-col items-stretch justify-end transition-[flex-grow] duration-300 motion-reduce:transition-none" style={{ flex: marked ? 1.5 : 1, height: spec.lane + tallest + 4 }}>
                {marked ? (
                  <span
                    className={cn("mb-1 grid place-items-center bg-foreground font-semibold text-background tabular-nums", spec.tagText)}
                    style={{ height: spec.lane, paddingBottom: spec.point, clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${spec.point}px), calc(50% + ${spec.point}px) calc(100% - ${spec.point}px), 50% 100%, calc(50% - ${spec.point}px) calc(100% - ${spec.point}px), 0 calc(100% - ${spec.point}px))`, borderRadius: "0.3rem 0.3rem 0 0" }}
                  >
                    {grade}
                  </span>
                ) : null}
                <span
                  className={cn("flex items-end justify-center rounded-md pb-1 font-semibold ring-1 ring-foreground/35 transition-[height] duration-300 ring-inset motion-reduce:transition-none", spec.text)}
                  style={{ height: Math.round(lerp(shortest, tallest, index, steps)), background: tone.background, color: tone.color }}
                >
                  {grade}
                </span>
              </div>
            );
          })}
        </div>
        {ends}
      </div>
    );
  }

  return (
    <div data-slot="grade-scale" data-orientation="vertical" data-size={size} role="img" aria-label={sentence} className={cn("grid gap-2 text-foreground", className)} {...props}>
      {best ? (
        <span aria-hidden="true" className={caption}>
          {best}
        </span>
      ) : null}
      <div aria-hidden="true" className="grid" style={{ gap: spec.gap }}>
        {grades.map((grade, index) => {
          const tone = toneOf(index, steps);
          const marked = index === picked;
          return (
            <div key={`${grade}-${index}`} data-grade={grade} data-picked={marked || undefined} className="flex items-center transition-[height] duration-300 motion-reduce:transition-none" style={{ height: marked ? spec.picked : spec.row, gap: 6 }}>
              <span
                className={cn("flex h-full shrink-0 items-center rounded-md pl-2.5 font-semibold ring-1 ring-foreground/35 transition-[width] duration-300 ring-inset motion-reduce:transition-none", spec.text, marked && "pl-3")}
                style={{ width: `calc((100% - ${spec.tag + 6}px) * ${length(index).toFixed(3)})`, background: tone.background, color: tone.color }}
              >
                {grade}
              </span>
              {marked ? (
                <span
                  className={cn("grid h-full shrink-0 place-items-center bg-foreground pl-3 font-semibold text-background tabular-nums", spec.tagText)}
                  style={{ width: spec.tag, clipPath: "polygon(0 50%, 10px 0, 100% 0, 100% 100%, 10px 100%)", borderRadius: "0 0.3rem 0.3rem 0" }}
                >
                  {grade}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      {worst ? (
        <span aria-hidden="true" className={caption}>
          {worst}
        </span>
      ) : null}
    </div>
  );
}
