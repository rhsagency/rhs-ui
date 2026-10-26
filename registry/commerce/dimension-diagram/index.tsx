"use client";

import { useState, type ComponentProps, type CSSProperties } from "react";

import { convert, figureOf, formatLength, roundFor, widthToFit, type Shape, type Unit } from "@rhs-ui/commerce/dimension-diagram/geometry";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { Shape, Unit } from "@rhs-ui/commerce/dimension-diagram/geometry";

/** A measurement that is not one of the three sides: the height of the seat, the width of an opening. */
export interface DimensionExtra {
  /** What it measures: "Seat height". */
  label: string;
  /** In the unit of the main measurements. */
  value: number;
  /** Whether it is measured up from the floor or across from the left. Defaults to "height". */
  axis?: "height" | "width";
}

export interface DimensionDiagramLabels {
  /** Across the front. */
  width?: string;
  /** Up from the floor. */
  height?: string;
  /** Front to back. */
  depth?: string;
  /** What a cylinder's width is called. */
  diameter?: string;
  /** What a flat thing's height is called. */
  thickness?: string;
  /** The one letter on each label in the drawing. */
  widthShort?: string;
  /** The letter for the height. */
  heightShort?: string;
  /** The letter for the depth. */
  depthShort?: string;
  /** The letter for a diameter. */
  diameterShort?: string;
  /** The letter for a thickness. */
  thicknessShort?: string;
  /** The name of the unit switch for a screen reader. */
  unit?: string;
  /** The units in words, for a screen reader. */
  centimetres?: string;
  /** Inches, in words. */
  inches?: string;
  /** Starts the sentence a screen reader hears for the drawing. */
  dimensions?: string;
}

const WORDS = {
  width: "Width",
  height: "Height",
  depth: "Depth",
  diameter: "Diameter",
  thickness: "Thickness",
  widthShort: "W",
  heightShort: "H",
  depthShort: "D",
  diameterShort: "Ø",
  thicknessShort: "T",
  unit: "Unit",
  centimetres: "centimetres",
  inches: "inches",
  dimensions: "Dimensions",
} satisfies Required<DimensionDiagramLabels>;

export interface DimensionDiagramProps extends Omit<ComponentProps<"div">, "children"> {
  /** Across the front. For a cylinder this is the diameter. */
  width: number;
  /** Up from the floor. For a flat shape this is how thick it is. */
  height: number;
  /** Front to back. Leave it out for a flat elevation with no depth; it is ignored for a cylinder. */
  depth?: number;
  /** The unit the measurements are given in. Defaults to "cm". */
  unit?: Unit;
  /** The units the reader can switch between. Defaults to both; give one and the switch is left out. */
  units?: readonly Unit[];
  /** The unit shown, when you control it. */
  displayUnit?: Unit;
  /** The unit shown first, when the diagram keeps its own state. Defaults to `unit`. */
  defaultDisplayUnit?: Unit;
  /** Called when the reader switches unit. */
  onDisplayUnitChange?: (unit: Unit) => void;
  /** A box, a cylinder or a flat shape. */
  shape?: Shape;
  /** More measurements, such as the height of the seat: a dashed line across the drawing and a line of text. */
  extras?: readonly DimensionExtra[];
  /** Always pass your application locale, so the numbers are written the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: DimensionDiagramLabels;
}

const TONES = ["var(--card)", "color-mix(in oklch, var(--foreground) 5%, var(--card))", "color-mix(in oklch, var(--foreground) 10%, var(--card))"] as const;

const percent = (value: number, of: number): string => `${Math.round((value / of) * 10000) / 100}%`;

/** What every chip on the drawing looks like. */
const CHIP = "absolute rounded-md border border-border bg-card px-1.5 py-0.5 text-xs leading-none font-medium whitespace-nowrap tabular-nums shadow-xs";

/**
 * The two ways a chip gives way when the drawing is too small for it, both plain CSS (a container query unit and a
 * clamp), so the server and the browser draw the same thing and nothing jumps once the page has loaded. Where the
 * unit is not known the chip stays as it is.
 *
 * `dropBelow`: the chip on the width line leaves the line and sits just under it, so the arrows stay in sight.
 * `Name`: the name on a chip that sits on the object ("Seat height") folds away and the chip is just its figure.
 * Both happen below `from` px of drawing width.
 */
const DROP = 14;
const dropBelow = (from: number): string => `0 clamp(0px, calc((${from}px - 100cqw) * 1000), ${DROP}px)`;

function Name({ from, children }: { from: number; children: string }) {
  return (
    <span className="inline-block overflow-hidden align-top text-muted-foreground" style={{ maxWidth: `clamp(0px, calc((100cqw - ${from}px) * 1000), 40rem)` }}>
      {children}
      {"\u00a0"}
    </span>
  );
}

const valid = (value: number | undefined): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * A product's dimensions drawn as a line drawing: a box, a cylinder or a flat shape in light perspective, with
 * arrows and labels for width, height and depth, and dashed lines for extra measurements such as the height of a
 * seat. The same numbers are written as text ("80 × 45 × 120 cm") above the drawing and as one sentence for a
 * screen reader, so nothing depends on the picture. A switch converts everything between centimetres and inches and
 * rounds the way a shop writes it. The drawing scales to its container; the lines keep a one pixel stroke and the
 * labels keep their size, in both themes. When the drawing is small or the product narrow, the label on the width
 * line drops just below the line so its arrows stay in sight, and a label that no longer fits the face it sits on
 * gives up its name ("46 cm" for "Seat height 46 cm"). The names are always in the text above the drawing.
 */
export function DimensionDiagram({
  width,
  height,
  depth,
  unit = "cm",
  units = ["cm", "in"],
  displayUnit,
  defaultDisplayUnit,
  onDisplayUnitChange,
  shape = "box",
  extras: given = [],
  locale = "en-US",
  labels,
  className,
  ...props
}: DimensionDiagramProps) {
  const words = { ...WORDS, ...labels };
  const [own, setOwn] = useState<Unit>(defaultDisplayUnit ?? unit);
  if (!valid(width) || !valid(height)) return null;
  // A measurement that is not a positive number cannot be drawn or written.
  const extras = given.filter((extra) => valid(extra.value));

  const choices = units.length ? units : [unit];
  const wanted = displayUnit ?? own;
  const shown: Unit = choices.includes(wanted) ? wanted : (choices[0] ?? unit);
  const solid = shape !== "cylinder" && valid(depth);
  const deep = solid ? (depth ?? 0) : 0;

  const figure = figureOf(shape, { width, height, depth: deep }, extras.map((extra) => ({ value: extra.value, axis: extra.axis ?? "height" })));
  const length = (value: number): string => formatLength(roundFor(convert(value, unit, shown), shown), locale);
  const suffix = shown;
  const unitWord = shown === "cm" ? words.centimetres : words.inches;

  const lead = shape === "cylinder" ? words.diameter : words.width;
  const leadShort = shape === "cylinder" ? words.diameterShort : words.widthShort;
  const tall = shape === "flat" ? words.thickness : words.height;
  const tallShort = shape === "flat" ? words.thicknessShort : words.heightShort;
  const ends = { width: [leadShort, length(width)], height: [tallShort, length(height)], depth: [words.depthShort, length(deep)] } as const;

  // "80 × 45 × 120 cm", written in the order a shop writes it: across, deep, up.
  const sizes = shape === "cylinder" ? [`${words.diameterShort} ${length(width)}`, length(height)] : solid ? [length(width), length(deep), length(height)] : [length(width), length(height)];
  const names = shape === "cylinder" ? [words.diameter, tall] : solid ? [words.width, words.depth, tall] : [words.width, tall];
  const spoken = [
    `${lead} ${length(width)} ${unitWord}`,
    ...(solid ? [`${words.depth} ${length(deep)} ${unitWord}`] : []),
    `${tall} ${length(height)} ${unitWord}`,
    ...extras.map((extra) => `${extra.label} ${length(extra.value)} ${unitWord}`),
  ];

  const change = (next: string) => {
    if (next !== "cm" && next !== "in") return;
    setOwn(next);
    onDisplayUnitChange?.(next);
  };

  return (
    <div data-slot="dimension-diagram" data-shape={shape} data-unit={shown} className={cn("rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:p-5", className)} {...props}>
      <div className="flex items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-lg leading-tight font-semibold tracking-[-0.02em] tabular-nums">
            {sizes.join(" × ")} {suffix}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{names.join(" × ")}</p>
          {extras.length ? (
            <ul className="mt-2 grid gap-0.5 text-xs text-muted-foreground">
              {extras.map((extra, index) => (
                <li key={`${index}-${extra.label}`} className="tabular-nums">
                  {extra.label} <span className="font-medium text-foreground">{length(extra.value)} {suffix}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {choices.length > 1 ? (
          <ToggleGroup type="single" value={shown} onValueChange={change} aria-label={words.unit} size="sm" className="shrink-0">
            {choices.map((choice) => (
              <ToggleGroupItem key={choice} value={choice} aria-label={`${choice === "cm" ? words.centimetres : words.inches} (${choice})`} className="w-10 px-0 text-xs">
                {choice}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        ) : null}
      </div>

      <div role="img" aria-label={`${words.dimensions}: ${spoken.join(", ")}`} className="@container relative mx-auto mt-3 w-full max-w-[28rem]" style={{ aspectRatio: `${figure.view.width} / ${figure.view.height}` }}>
        <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${figure.view.width} ${figure.view.height}`} className="absolute inset-0 size-full text-foreground" fill="none">
          {figure.faces.map((face, index) => (
            <path key={index} d={face.d} style={{ fill: TONES[face.tone] }} />
          ))}
          {figure.hidden ? <path d={figure.hidden} stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.25} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" /> : null}
          <path d={figure.edges} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {figure.extras.map((mark, index) => (
            <path key={index} d={mark.line} stroke="currentColor" strokeOpacity={0.75} strokeWidth={1.25} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          ))}
          {figure.dimensions.map((dim) => (
            <g key={dim.axis} stroke="var(--muted-foreground)" strokeWidth={1} vectorEffect="non-scaling-stroke">
              <path d={dim.extensions} vectorEffect="non-scaling-stroke" strokeOpacity={0.7} />
              <path d={dim.line} vectorEffect="non-scaling-stroke" />
              <path d={dim.arrows} fill="var(--muted-foreground)" stroke="none" />
            </g>
          ))}
        </svg>

        {figure.dimensions.map((dim) => {
          const [short, value] = ends[dim.axis];
          // The chip on the width line breaks the line, and keeps 10px of arrow at each end or drops below it. The others sit beside their line.
          const from = dim.axis === "width" ? widthToFit(`${short} ${value} ${suffix}`, dim.span, figure.view.width, 20) : 0;
          return (
            <span
              key={dim.axis}
              aria-hidden="true"
              className={CHIP}
              style={{ left: percent(dim.label.x, figure.view.width), top: percent(dim.label.y, figure.view.height), transform: `translate(-50%, -50%) rotate(${Math.round(dim.label.angle)}deg)`, translate: from > 0 ? dropBelow(from) : undefined } as CSSProperties}
            >
              <span className="text-muted-foreground">{short}</span> {value} {suffix}
            </span>
          );
        })}
        {figure.extras.map((mark, index) => {
          const extra = extras[index];
          if (!extra) return null;
          const text = `${length(extra.value)} ${suffix}`;
          return (
            <span
              key={index}
              aria-hidden="true"
              className={CHIP}
              style={{ left: percent(mark.label.x, figure.view.width), top: percent(mark.label.y, figure.view.height), transform: `translate(${mark.label.anchor === "start" ? "0" : "-50%"}, -50%)` } as CSSProperties}
            >
              <Name from={widthToFit(`${extra.label} ${text}`, mark.room, figure.view.width, 6)}>{extra.label}</Name>
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}
