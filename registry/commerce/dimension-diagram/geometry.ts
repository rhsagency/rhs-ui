/** The two units a product is measured in. */
export type Unit = "cm" | "in";

/** What the product looks like: a box with three sides, a cylinder (width is the diameter), or a flat thing lying down such as a rug. */
export type Shape = "box" | "cylinder" | "flat";

export interface Point {
  x: number;
  y: number;
}

const CM_PER_INCH = 2.54;

/** A length in another unit. */
export function convert(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  return from === "cm" ? value / CM_PER_INCH : value * CM_PER_INCH;
}

/**
 * A length rounded the way a shop writes it: a tenth, and whole numbers when it is whole or large. 45 cm stays 45,
 * 80 cm is 31.5 in, and 305 cm is 120 in, not 120.1.
 */
export function roundFor(value: number, unit: Unit): number {
  if (!Number.isFinite(value)) return 0;
  const limit = unit === "in" ? 100 : 1000;
  return value >= limit ? Math.round(value) : Math.round(value * 10) / 10;
}

/** A length as text for a locale: "31.5", "47,2". */
export function formatLength(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
}

/** The size of the drawing. Labels are placed in these units and scaled with the drawing. A flat shape is wide and low, so it gets less height. */
export function viewOf(shape: Shape): { width: number; height: number } {
  return { width: 360, height: shape === "flat" ? 196 : 240 };
}

/** Room kept around the object for the dimension lines and their labels. */
const MARGIN = { left: 64, right: 58, top: 22, bottom: 52 } as const;

const RAD = Math.PI / 180;

/** Lines sit on the half pixel, so a one pixel stroke is one crisp pixel. */
const crisp = (value: number): number => Math.round(value) + 0.5;

const num = (value: number): string => String(Math.round(value * 100) / 100);
const move = (point: Point): string => `M${num(point.x)} ${num(point.y)}`;
const to = (point: Point): string => `L${num(point.x)} ${num(point.y)}`;
const segment = (a: Point, b: Point): string => move(a) + to(b);

/** A small filled arrowhead with its tip at `tip`, pointing away from `from`. */
function arrowhead(tip: Point, from: Point, length = 7, spread = 2.6): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const size = Math.hypot(dx, dy) || 1;
  const ux = dx / size;
  const uy = dy / size;
  const base = { x: tip.x - ux * length, y: tip.y - uy * length };
  const left = { x: base.x - uy * spread, y: base.y + ux * spread };
  const right = { x: base.x + uy * spread, y: base.y - ux * spread };
  return `${move(tip)}${to(left)}${to(right)}Z`;
}

export interface Dimension {
  axis: "width" | "height" | "depth";
  /** The dimension line. */
  line: string;
  /** The thin lines that lead from the object to it. */
  extensions: string;
  /** The two arrowheads, filled. */
  arrows: string;
  /** Where the label sits, in drawing units, and how far it is turned in degrees. */
  label: Point & { angle: number };
  /** How long the line is, in drawing units: the room its label has before it hides the arrows. */
  span: number;
}

export interface ExtraMark {
  /** The line across the object, dashed. */
  line: string;
  /** Where the label sits, and which side of that point it grows to. */
  label: Point & { anchor: "start" | "middle" };
  /** How much of the object's face the label has to itself from where it sits, in drawing units. */
  room: number;
}

export interface Figure {
  /** The size of the drawing, which the positions below are in. */
  view: { width: number; height: number };
  /** Filled faces, back to front. Tone 0 is the front, 1 the top and 2 the side. */
  faces: { d: string; tone: 0 | 1 | 2 }[];
  /** Edges you could not see on a solid object, drawn dashed. */
  hidden: string;
  /** The edges you can see. */
  edges: string;
  dimensions: Dimension[];
  extras: ExtraMark[];
}

export interface FigureExtra {
  /** In the same unit as the size. */
  value: number;
  axis: "height" | "width";
}

/**
 * A dimension line between two points with its extension lines, arrowheads and label. The label sits on the line
 * at `along` (0 is the first point, 1 the second), breaking it, or `beside` units off it, so a short line stays visible.
 */
function dimension(axis: Dimension["axis"], a: Point, b: Point, extensions: string, options: { angle?: number; along?: number; beside?: number } = {}): Dimension {
  const { angle = 0, along = 0.5, beside = 0 } = options;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const size = Math.hypot(dx, dy) || 1;
  return {
    axis,
    line: segment(a, b),
    extensions,
    arrows: arrowhead(a, b) + arrowhead(b, a),
    // Off the line to the lower right: away from the object.
    label: { x: a.x + dx * along + (Math.abs(dy) / size) * beside, y: a.y + dy * along + (Math.abs(dx) / size) * beside, angle },
    span: size,
  };
}

/** Where on the height line the label goes: the middle, unless an extra measurement is level with it, then a fifth of the way along from either end. */
function slot(top: number, bottom: number, levels: readonly number[]): number {
  const clear = (fraction: number): boolean => levels.every((level) => Math.abs(top + (bottom - top) * fraction - level) > 28);
  return [0.5, 0.2, 0.8].find(clear) ?? 0.5;
}

const GAP = 5;

/** The width in px of a label chip, worked out from its characters: 12px type, a figure about 7px wide, plus the padding and the border. */
export function chipWidth(text: string): number {
  return Math.round(text.length * 6.6 + 14);
}

/**
 * How wide the drawing has to be, in px, before a chip that reads `text` fits in `room` drawing units with `clear` px
 * to spare. The drawing scales and the chips do not, so a narrow product on a phone runs out of room first; below
 * this width the chip gives way.
 */
export function widthToFit(text: string, room: number, view: number, clear: number): number {
  return Math.ceil(((chipWidth(text) + clear) * view) / Math.max(room, 1));
}

/** A box, or a flat thing, in oblique projection: the front square on, the depth running up and to the right. */
function prism(shape: "box" | "flat", size: { width: number; height: number; depth: number }, extras: readonly FigureExtra[]): Figure {
  const view = viewOf(shape);
  const areaW = view.width - MARGIN.left - MARGIN.right;
  const areaH = view.height - MARGIN.top - MARGIN.bottom;
  const { width, height, depth } = size;
  // A flat thing is looked at from higher up, so its top face is the one that shows.
  const reach = depth > 0 ? (shape === "flat" ? 0.85 : 0.55) : 0;
  const angle = shape === "flat" ? 26 : 30;
  const ux = reach * Math.cos(angle * RAD);
  const uy = reach * Math.sin(angle * RAD);
  const scale = Math.min(areaW / (width + ux * depth), areaH / (height + uy * depth));

  const W = Math.round(width * scale);
  const H = Math.max(shape === "flat" ? 8 : 12, Math.round(height * scale));
  const dx = Math.round(ux * depth * scale);
  const dy = Math.round(uy * depth * scale);
  const x0 = crisp(MARGIN.left + (areaW - (W + dx)) / 2);
  const x1 = x0 + W;
  const yTop = crisp(MARGIN.top + (areaH - (H + dy)) / 2 + dy);
  const yBot = yTop + H;

  const front: Point[] = [{ x: x0, y: yTop }, { x: x1, y: yTop }, { x: x1, y: yBot }, { x: x0, y: yBot }];
  const top: Point[] = [{ x: x0, y: yTop }, { x: x0 + dx, y: yTop - dy }, { x: x1 + dx, y: yTop - dy }, { x: x1, y: yTop }];
  const side: Point[] = [{ x: x1, y: yTop }, { x: x1 + dx, y: yTop - dy }, { x: x1 + dx, y: yBot - dy }, { x: x1, y: yBot }];
  const closed = (points: Point[]): string => points.map((point, index) => (index === 0 ? move(point) : to(point))).join("") + "Z";

  const faces: Figure["faces"] = [{ d: closed(front), tone: 0 }];
  if (depth > 0) faces.unshift({ d: closed(side), tone: 2 }, { d: closed(top), tone: 1 });

  const hidden =
    depth > 0
      ? segment({ x: x0, y: yBot }, { x: x0 + dx, y: yBot - dy }) + segment({ x: x0 + dx, y: yBot - dy }, { x: x0 + dx, y: yTop - dy }) + segment({ x: x0 + dx, y: yBot - dy }, { x: x1 + dx, y: yBot - dy })
      : "";
  const edges = closed(front) + (depth > 0 ? closed(top) + closed(side) : "");

  const widthY = crisp(yBot + 26);
  const heightX = crisp(x0 - 26);
  const levels = extras.filter((extra) => extra.axis === "height").map((extra) => yBot - Math.min(Math.max(extra.value, 0), height) * scale);
  const dimensions: Dimension[] = [
    dimension("width", { x: x0, y: widthY }, { x: x1, y: widthY }, segment({ x: x0, y: yBot + GAP }, { x: x0, y: widthY + GAP }) + segment({ x: x1, y: yBot + GAP }, { x: x1, y: widthY + GAP })),
    dimension("height", { x: heightX, y: yTop }, { x: heightX, y: yBot }, segment({ x: x0 - GAP, y: yTop }, { x: heightX - GAP, y: yTop }) + segment({ x: x0 - GAP, y: yBot }, { x: heightX - GAP, y: yBot }), { along: slot(yTop, yBot, levels) }),
  ];
  if (depth > 0) {
    const out = 32;
    dimensions.push(
      dimension(
        "depth",
        { x: x1 + out, y: yBot },
        { x: x1 + dx + out, y: yBot - dy },
        segment({ x: x1 + GAP, y: yBot }, { x: x1 + out + GAP, y: yBot }) + segment({ x: x1 + dx + GAP, y: yBot - dy }, { x: x1 + dx + out + GAP, y: yBot - dy }),
        { angle: -Math.atan2(dy, dx) / RAD, beside: 15 },
      ),
    );
  }

  const marks: ExtraMark[] = extras.map((extra) => {
    const along = Math.min(Math.max(extra.value, 0), extra.axis === "height" ? height : width) * scale;
    if (extra.axis === "height") {
      const y = crisp(yBot - along);
      return { line: segment({ x: x0, y }, { x: x1, y }), label: { x: x0 + 8, y, anchor: "start" }, room: W - 8 };
    }
    const x = crisp(x0 + along);
    return { line: segment({ x, y: yTop }, { x, y: yBot }), label: { x, y: yTop + 14, anchor: "middle" }, room: 2 * Math.min(x - x0, x1 - x) };
  });

  return { view, faces, hidden, edges, dimensions, extras: marks };
}

/** A cylinder standing on its base: two ellipses and the lines between them. */
function cylinder(size: { width: number; height: number }, extras: readonly FigureExtra[]): Figure {
  const view = viewOf("cylinder");
  const areaW = view.width - MARGIN.left - MARGIN.right;
  const areaH = view.height - MARGIN.top - MARGIN.bottom;
  const squash = 0.3;
  const scale = Math.min(areaW / size.width, areaH / (size.height + squash * size.width));

  const R = Math.round((size.width * scale) / 2);
  const ry = Math.max(6, Math.round(R * squash));
  const H = Math.max(14, Math.round(size.height * scale));
  const cx = crisp(MARGIN.left + areaW / 2);
  const yTop = crisp(MARGIN.top + (areaH - (H + 2 * ry)) / 2 + ry);
  const yBot = yTop + H;
  const left = cx - R;
  const right = cx + R;

  const ellipse = (y: number): string => `M${left} ${y}A${R} ${ry} 0 0 0 ${right} ${y}A${R} ${ry} 0 0 0 ${left} ${y}Z`;
  const body = `M${left} ${yTop}V${yBot}A${R} ${ry} 0 0 0 ${right} ${yBot}V${yTop}Z`;
  const widthY = crisp(yBot + ry + 22);
  const heightX = crisp(left - 26);
  const levels = extras.filter((extra) => extra.axis === "height").map((extra) => yBot - Math.min(Math.max(extra.value, 0), size.height) * scale);

  const dimensions: Dimension[] = [
    dimension("width", { x: left, y: widthY }, { x: right, y: widthY }, segment({ x: left, y: yBot + GAP }, { x: left, y: widthY + GAP }) + segment({ x: right, y: yBot + GAP }, { x: right, y: widthY + GAP })),
    dimension("height", { x: heightX, y: yTop }, { x: heightX, y: yBot }, segment({ x: left - GAP, y: yTop }, { x: heightX - GAP, y: yTop }) + segment({ x: left - GAP, y: yBot }, { x: heightX - GAP, y: yBot }), { along: slot(yTop, yBot, levels) }),
  ];

  const marks: ExtraMark[] = extras.map((extra) => {
    const along = Math.min(Math.max(extra.value, 0), extra.axis === "height" ? size.height : size.width) * scale;
    if (extra.axis === "height") {
      const y = crisp(yBot - along);
      return { line: segment({ x: left, y }, { x: right, y }), label: { x: left + 8, y, anchor: "start" }, room: right - left - 8 };
    }
    const x = crisp(left + along);
    return { line: segment({ x, y: yTop }, { x, y: yBot }), label: { x, y: yTop + 14, anchor: "middle" }, room: 2 * Math.min(x - left, right - x) };
  });

  return {
    view,
    faces: [
      { d: body, tone: 0 },
      { d: ellipse(yTop), tone: 1 },
    ],
    hidden: `M${left} ${yBot}A${R} ${ry} 0 0 1 ${right} ${yBot}`,
    edges: `M${left} ${yTop}V${yBot}A${R} ${ry} 0 0 0 ${right} ${yBot}V${yTop}` + ellipse(yTop),
    dimensions,
    extras: marks,
  };
}

/** The drawing of a product: its faces and edges, the dimension lines that measure it and the marks for any extra measurement. */
export function figureOf(shape: Shape, size: { width: number; height: number; depth: number }, extras: readonly FigureExtra[] = []): Figure {
  return shape === "cylinder" ? cylinder(size, extras) : prism(shape, size, extras);
}
