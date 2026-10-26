import type { ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

/** The six things a care label can say, in the order it says them. */
export type CareCategory = "wash" | "bleach" | "tumbleDry" | "dry" | "iron" | "dryClean";

/** Machine wash at a most this many degrees, by hand, or not at all. */
export type CareWash = "95" | "60" | "50" | "40" | "30" | "hand" | "no";
export type CareBleach = "any" | "non-chlorine" | "no";
export type CareTumbleDry = "low" | "normal" | "no";
/** Natural drying: on a line, dripping wet, or flat. */
export type CareDry = "line" | "drip" | "flat";
export type CareIron = "low" | "medium" | "high" | "no";
/** Professional care: any solvent, the P and F solvent groups, wet cleaning, or none. */
export type CareDryClean = "any" | "p" | "f" | "wet" | "no";

/** What a garment's label says. Leave a setting out and it is not drawn. */
export interface CareSettings {
  wash?: CareWash;
  bleach?: CareBleach;
  tumbleDry?: CareTumbleDry;
  dry?: CareDry;
  iron?: CareIron;
  dryClean?: CareDryClean;
}

export const CARE_ORDER: readonly CareCategory[] = ["wash", "bleach", "tumbleDry", "dry", "iron", "dryClean"];

/** The key of one setting in the table of words: "wash-30", "bleach-no". */
export type CareKey = `${CareCategory}-${string}`;

/** What each setting says in words. The drawing is never the only carrier of the meaning. */
export const CARE_WORDS: Record<string, string> = {
  "wash-95": "Machine wash, max 95 °C",
  "wash-60": "Machine wash, max 60 °C",
  "wash-50": "Machine wash, max 50 °C",
  "wash-40": "Machine wash, max 40 °C",
  "wash-30": "Machine wash, max 30 °C",
  "wash-hand": "Hand wash only",
  "wash-no": "Do not wash",
  "bleach-any": "Bleach if needed",
  "bleach-non-chlorine": "Non-chlorine bleach only",
  "bleach-no": "Do not bleach",
  "tumbleDry-low": "Tumble dry, low heat",
  "tumbleDry-normal": "Tumble dry, normal heat",
  "tumbleDry-no": "Do not tumble dry",
  "dry-line": "Line dry",
  "dry-drip": "Drip dry",
  "dry-flat": "Dry flat",
  "iron-low": "Iron on low, max 110 °C",
  "iron-medium": "Iron on medium, max 150 °C",
  "iron-high": "Iron on high, max 200 °C",
  "iron-no": "Do not iron",
  "dryClean-any": "Dry clean",
  "dryClean-p": "Dry clean, P solvents",
  "dryClean-f": "Dry clean, F solvents",
  "dryClean-wet": "Professional wet clean",
  "dryClean-no": "Do not dry clean",
};

/*
 * Every symbol is drawn on one 24 by 24 grid with the same 1.6 stroke, round caps and joins, and keeps to the
 * 3 to 21 square, so a row of them has one weight and one size and each stays readable at 24px. Filled dots stand
 * for heat. A cross runs corner to corner over the symbol it forbids.
 */
const CROSS = "M3.5 3.5L20.5 20.5M20.5 3.5L3.5 20.5";
const SQUARE = "M5 3.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z";

/** The wash tub: a wave for the water and a basin under it, with the highest temperature inside. */
function Tub({ degrees }: { degrees?: string }): ReactNode {
  return (
    <>
      <path d="M3.4 7.9q2.15-2.3 4.3 0t4.3 0 4.3 0 4.3 0" />
      <path d="M3.4 7.9l1.9 10.8a1.3 1.3 0 0 0 1.3 1.1h10.8a1.3 1.3 0 0 0 1.3-1.1l1.9-10.8" />
      {degrees ? (
        <text x="12" y="17" textAnchor="middle" fontSize="7.8" fontWeight="700" fill="currentColor" stroke="none" style={{ fontFamily: "inherit" }}>
          {degrees}
        </text>
      ) : null}
    </>
  );
}

/** A hand in the water: a basin with a hand rising out of it, drawn as one outline with four fingertips. */
function HandWash(): ReactNode {
  return (
    <>
      <path d="M3.9 13.2h16.2l-1.7 5.3a1.3 1.3 0 0 1-1.25.95H6.85a1.3 1.3 0 0 1-1.25-.95z" />
      <path d="M6.9 13.2V8.9a1.3 1.3 0 0 1 2.6 0V6.5a1.3 1.3 0 0 1 2.6 0V7a1.3 1.3 0 0 1 2.6 0V8.2a1.3 1.3 0 0 1 2.6 0v5" />
    </>
  );
}

const Triangle = (): ReactNode => <path d="M12 3.9L21 19.8H3z" />;
const Circle = (): ReactNode => <circle cx="12" cy="12" r="8.4" />;

function Dots({ at, y }: { at: readonly number[]; y: number }): ReactNode {
  return (
    <>
      {at.map((x) => (
        <circle key={x} cx={x} cy={y} r="1.15" fill="currentColor" stroke="none" />
      ))}
    </>
  );
}

const Wring = (): ReactNode => (
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1.6" />
    <circle cx="12" cy="12" r="5.2" />
  </>
);

/** The iron, a wedge with a flat sole. */
const Iron = (): ReactNode => <path d="M3.3 18.8h17.4l-1.5-8.2a1.2 1.2 0 0 0-1.2-1H11.4C7.6 9.6 4.4 12.7 3.3 18.8z" />;

/** A letter drawn as a stroke, so it does not depend on a font. */
const Letters = {
  P: "M10.2 15.6V8.4h2.2a2.2 2.2 0 0 1 0 4.4h-2.2",
  F: "M10.4 15.6V8.4h4.2M10.4 12h3.3",
  W: "M7.9 8.4l1.7 7.2 2.4-5.4 2.4 5.4 1.7-7.2",
} as const;

type Drawing = () => ReactNode;

const DRAWINGS: Record<CareCategory, Record<string, Drawing>> = {
  wash: {
    "95": () => <Tub degrees="95" />,
    "60": () => <Tub degrees="60" />,
    "50": () => <Tub degrees="50" />,
    "40": () => <Tub degrees="40" />,
    "30": () => <Tub degrees="30" />,
    hand: () => <HandWash />,
    no: () => (
      <>
        <Tub />
        <path d={CROSS} />
      </>
    ),
  },
  bleach: {
    any: () => <Triangle />,
    "non-chlorine": () => (
      <>
        <Triangle />
        <path d="M8.3 17.2L12.7 9.8M11.7 17.2L14.4 12.6" />
      </>
    ),
    no: () => (
      <>
        <Triangle />
        <path d={CROSS} />
      </>
    ),
  },
  tumbleDry: {
    low: () => (
      <>
        <Wring />
        <Dots at={[12]} y={12} />
      </>
    ),
    normal: () => (
      <>
        <Wring />
        <Dots at={[9.9, 14.1]} y={12} />
      </>
    ),
    no: () => (
      <>
        <Wring />
        <path d={CROSS} />
      </>
    ),
  },
  dry: {
    line: () => (
      <>
        <path d={SQUARE} />
        <path d="M12 6.8v10.4" />
      </>
    ),
    drip: () => (
      <>
        <path d={SQUARE} />
        <path d="M8.6 6.8v10.4M12 6.8v10.4M15.4 6.8v10.4" />
      </>
    ),
    flat: () => (
      <>
        <path d={SQUARE} />
        <path d="M6.8 12h10.4" />
      </>
    ),
  },
  iron: {
    low: () => (
      <>
        <Iron />
        <Dots at={[11.8]} y={14.9} />
      </>
    ),
    medium: () => (
      <>
        <Iron />
        <Dots at={[9.7, 13.9]} y={14.9} />
      </>
    ),
    high: () => (
      <>
        <Iron />
        <Dots at={[8.6, 12.2, 15.8]} y={14.9} />
      </>
    ),
    no: () => (
      <>
        <Iron />
        <path d={CROSS} />
      </>
    ),
  },
  dryClean: {
    any: () => <Circle />,
    p: () => (
      <>
        <Circle />
        <path d={Letters.P} />
      </>
    ),
    f: () => (
      <>
        <Circle />
        <path d={Letters.F} />
      </>
    ),
    wet: () => (
      <>
        <Circle />
        <path d={Letters.W} />
      </>
    ),
    no: () => (
      <>
        <Circle />
        <path d={CROSS} />
      </>
    ),
  },
};

/** Whether a setting is one this item can draw. An unknown value is never drawn as something close to it. */
export function isKnownCare(category: string, value: unknown): boolean {
  return typeof value === "string" && Object.hasOwn(DRAWINGS[category as CareCategory] ?? {}, value);
}

export interface CareSymbolProps extends Omit<SVGProps<SVGSVGElement>, "children" | "ref"> {
  category: CareCategory;
  value: string;
  /** The size in px, both ways. */
  size?: number;
}

/** One care symbol on the shared grid. It is decorative: the words next to it carry the meaning. Unknown settings draw nothing. */
export function CareSymbol({ category, value, size = 32, className, ...props }: CareSymbolProps) {
  if (!isKnownCare(category, value)) return null;
  const draw = DRAWINGS[category][value];
  return (
    <svg
      data-slot="care-symbol"
      data-category={category}
      data-value={value}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0", className)}
      {...props}
    >
      {draw?.()}
    </svg>
  );
}
