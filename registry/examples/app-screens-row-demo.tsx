import type { ReactNode } from "react";

import { AppScreensRow, type AppScreen } from "@rhs-ui/marketing/app-screens-row";

/**
 * The screens of a meal-planning app, drawn as SVG data URIs so the demo needs no files. They are 390 by 844, the size
 * of a phone, and in a real page they are your own screenshots. A drawing in an <img> cannot read the page's theme, so
 * the screens are light, as app screenshots usually are, in both themes.
 */
const PAPER = "#fcfcfc";
const INK = "#141414";
const MUTED = "#8a8a8a";
const LINE = "#e6e6e6";
const SOFT = "#f2f2f2";
const MID = "#cfcfcf";

interface TextStyle {
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: "start" | "middle" | "end";
  spacing?: number;
}

const text = (x: number, y: number, value: string, { size = 16, weight = 400, fill = INK, anchor = "start", spacing = 0 }: TextStyle = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}">${value}</text>`;
const box = (x: number, y: number, w: number, h: number, radius: number, fill: string, stroke = "none", width = 1.5, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" ${extra}/>`;
const dot = (cx: number, cy: number, radius: number, fill: string, stroke = "none", width = 1.5) => `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const path = (d: string, stroke: string, width = 2, fill = "none") => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

function statusBar(): string {
  return (
    text(36, 46, "9:41", { size: 16, weight: 600 }) +
    box(326, 34, 4, 6, 1, INK) +
    box(333, 30, 4, 10, 1, INK) +
    box(340, 26, 4, 14, 1, INK) +
    box(350, 28, 26, 13, 4, "none", INK) +
    box(352.5, 30.5, 17, 8, 2, INK) +
    box(377, 32, 2, 5, 1, INK)
  );
}

const TABS = ["Plan", "Lists", "Cook", "Pantry"];

function tabBar(active: number): string {
  const icons = [
    // Plan: a calendar
    (c: string) => box(-11, -10, 22, 20, 5, "none", c, 2) + path("M-11 -3h22M-5 -13v5M5 -13v5", c),
    // Lists: three lines
    (c: string) => path("M-3 -7h13M-3 0h13M-3 7h13", c) + dot(-9, -7, 1.2, c) + dot(-9, 0, 1.2, c) + dot(-9, 7, 1.2, c),
    // Cook: a clock
    (c: string) => dot(0, 0, 11, "none", c, 2) + path("M0 -6v6l4 3", c),
    // Pantry: a jar
    (c: string) => box(-9, -6, 18, 17, 5, "none", c, 2) + path("M-6 -10h12", c),
  ];
  const items = TABS.map((label, index) => {
    const x = 48.75 + index * 97.5;
    const colour = index === active ? INK : MUTED;
    return `<g transform="translate(${x} 788)">${icons[index]?.(colour) ?? ""}</g>` + text(x, 822, label, { size: 11, weight: index === active ? 600 : 500, fill: colour, anchor: "middle" });
  }).join("");
  return box(0, 752, 390, 92, 0, "#fff") + `<path d="M0 752.5h390" stroke="${LINE}"/>` + items + box(140, 834, 110, 5, 2.5, INK);
}

const screen = (body: string, active: number): string =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 844" font-family="-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif">${box(0, 0, 390, 844, 0, PAPER)}${statusBar()}${body}${tabBar(active)}</svg>`,
  );

/** A tiny stand-in for the screen: three bands of its colours, a few hundred bytes, blurred by the row until the real one loads. */
const seed = (...bands: string[]): string =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 ${bands.length}" preserveAspectRatio="none">${bands.map((fill, index) => `<rect y="${index}" width="3" height="1" fill="${fill}"/>`).join("")}</svg>`);

function planWeek(): string {
  const days: [string, number][] = [["M", 12], ["T", 13], ["W", 14], ["T", 15], ["F", 16], ["S", 17], ["S", 18]];
  const strip = days
    .map(([letter, number], index) => {
      const x = 30 + index * 48;
      const on = index === 1;
      return (
        (on ? box(x, 168, 42, 78, 21, INK) : box(x, 168, 42, 78, 21, "#fff", LINE)) +
        text(x + 21, 194, letter, { size: 12, weight: 600, fill: on ? "#bdbdbd" : MUTED, anchor: "middle" }) +
        text(x + 21, 226, String(number), { size: 19, weight: 600, fill: on ? "#fff" : INK, anchor: "middle" }) +
        (index < 5 && !on ? dot(x + 21, 238, 2, INK) : "")
      );
    })
    .join("");
  const meal = (y: number, title: string, meta: string, thumbnail: string) =>
    box(28, y, 334, 100, 20, "#fff", LINE) + box(42, y + 14, 72, 72, 14, SOFT) + thumbnail + text(132, y + 44, title, { size: 18, weight: 600 }) + text(132, y + 70, meta, { size: 14, fill: MUTED });
  return (
    text(28, 112, "This week", { size: 34, weight: 700 }) +
    text(28, 140, "Five dinners planned", { size: 16, fill: MUTED }) +
    strip +
    text(30, 292, "TUESDAY", { size: 12, weight: 600, fill: MUTED, spacing: 1.6 }) +
    meal(308, "Lemon chicken", "Roast fennel · 35 min", dot(78, 358, 22, "none", INK, 2.5) + dot(78, 358, 10, SOFT, MID, 1.5)) +
    meal(420, "Green lentil soup", "Serves 4 · 25 min", box(60, 452, 36, 22, 11, "none", INK, 2.5) + path("M66 446c0-5 6-3 6-8M78 446c0-5 6-3 6-8", MUTED, 2)) +
    meal(532, "Tomato tart", "Serves 2 · 45 min", path("M60 592l18-24 18 24z", INK, 2.5, SOFT)) +
    box(28, 656, 334, 60, 18, "none", MID, 1.5, 'stroke-dasharray="6 6"') +
    text(195, 692, "+  Add a dinner", { size: 16, weight: 600, fill: MUTED, anchor: "middle" })
  );
}

function shareList(): string {
  const row = (top: number, label: string, meta: string, done: boolean) =>
    (done ? box(28, top, 28, 28, 9, INK) + path(`M35 ${top + 14}l5 5 9-10`, "#fff", 2.5) : box(28, top, 28, 28, 9, "#fff", MID)) +
    text(72, top + 20, label, { size: 18, weight: 500, fill: done ? MUTED : INK }) +
    (done ? box(72, top + 13, label.length * 9.2, 1.6, 1, MUTED) : "") +
    text(362, top + 20, meta, { size: 13, fill: MUTED, anchor: "end" }) +
    `<path d="M28 ${top + 48.5}h334" stroke="${LINE}"/>`;
  return (
    text(28, 112, "Saturday shop", { size: 30, weight: 700 }) +
    text(28, 140, "Shared with Maya and Jo", { size: 16, fill: MUTED }) +
    dot(318, 112, 18, INK) +
    text(318, 117, "MK", { size: 13, weight: 600, fill: "#fff", anchor: "middle" }) +
    dot(342, 112, 18, MID, PAPER, 3) +
    text(342, 117, "JV", { size: 13, weight: 600, fill: INK, anchor: "middle" }) +
    box(28, 172, 334, 8, 4, SOFT) +
    box(28, 172, 190, 8, 4, INK) +
    text(28, 208, "7 of 12 in the basket", { size: 14, weight: 600 }) +
    text(362, 208, "Jo is shopping", { size: 14, fill: MUTED, anchor: "end" }) +
    row(236, "Fennel bulbs", "× 2", true) +
    row(292, "Greek yoghurt", "Maya", true) +
    row(348, "Lemons", "× 4", false) +
    row(404, "Green lentils", "Jo added", false) +
    row(460, "Sourdough loaf", "", false) +
    row(516, "Vine tomatoes", "× 6", false) +
    box(28, 604, 334, 56, 28, "#fff", LINE) +
    text(56, 638, "Add an item", { size: 16, fill: MUTED }) +
    dot(334, 632, 18, INK) +
    path("M334 624v16M326 632h16", "#fff", 2.5)
  );
}

function cookStep(): string {
  const arc = 2 * Math.PI * 92;
  return (
    text(28, 112, "Lemon chicken with fennel", { size: 20, weight: 700 }) +
    text(28, 138, "Step 3 of 6", { size: 14, fill: MUTED }) +
    [0, 1, 2, 3, 4, 5].map((index) => box(28 + index * 57, 158, 51, 6, 3, index < 3 ? INK : LINE)).join("") +
    text(28, 238, "Slice the fennel", { size: 32, weight: 700 }) +
    text(28, 278, "thinly, then roast", { size: 32, weight: 700 }) +
    text(28, 318, "it for 25 minutes.", { size: 32, weight: 700 }) +
    text(28, 352, "200° with the fan on", { size: 16, fill: MUTED }) +
    dot(195, 500, 92, "none", LINE, 10) +
    `<circle cx="195" cy="500" r="92" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(arc * 0.64).toFixed(1)} ${arc.toFixed(1)}" transform="rotate(-90 195 500)"/>` +
    text(195, 512, "16:04", { size: 42, weight: 700, anchor: "middle" }) +
    text(195, 540, "left on the timer", { size: 14, fill: MUTED, anchor: "middle" }) +
    box(28, 662, 120, 58, 29, "#fff", MID) +
    text(88, 698, "Back", { size: 17, weight: 600, anchor: "middle" }) +
    box(160, 662, 202, 58, 29, INK) +
    text(261, 698, "Next step", { size: 17, weight: 600, fill: "#fff", anchor: "middle" })
  );
}

function shopInOrder(): string {
  const aisle = (top: number, name: string, items: [string, boolean][]) =>
    text(30, top, name, { size: 12, weight: 600, fill: MUTED, spacing: 1.6 }) +
    items
      .map(([label, done], index) => {
        const rowTop = top + 18 + index * 56;
        return (
          (done ? box(28, rowTop, 26, 26, 8, INK) + path(`M34 ${rowTop + 13}l5 5 8-9`, "#fff", 2.5) : box(28, rowTop, 26, 26, 8, "#fff", MID)) +
          text(70, rowTop + 19, label, { size: 17, weight: 500, fill: done ? MUTED : INK }) +
          `<path d="M28 ${rowTop + 44.5}h334" stroke="${LINE}"/>`
        );
      })
      .join("");
  return (
    text(28, 112, "At the shop", { size: 34, weight: 700 }) +
    text(28, 140, "In the order of the aisles", { size: 16, fill: MUTED }) +
    path("M44 190h300", LINE, 4) +
    path("M44 190h120", INK, 4) +
    dot(44, 190, 9, INK) +
    dot(164, 190, 9, INK) +
    dot(264, 190, 9, "#fff", MID, 3) +
    dot(344, 190, 9, "#fff", MID, 3) +
    text(44, 222, "Produce", { size: 12, weight: 600, anchor: "middle" }) +
    text(164, 222, "Dairy", { size: 12, weight: 600, anchor: "middle" }) +
    text(264, 222, "Bakery", { size: 12, fill: MUTED, anchor: "middle" }) +
    text(340, 222, "Till", { size: 12, fill: MUTED, anchor: "middle" }) +
    aisle(268, "PRODUCE", [["Fennel bulbs × 2", true], ["Lemons × 4", true], ["Vine tomatoes × 6", false]]) +
    aisle(468, "DAIRY", [["Greek yoghurt", true], ["Butter, unsalted", false]]) +
    aisle(604, "BAKERY", [["Sourdough loaf", false]]) +
    box(110, 690, 170, 44, 22, INK) +
    text(195, 718, "5 items left", { size: 15, weight: 600, fill: "#fff", anchor: "middle" })
  );
}

function pantry(): string {
  const bars = [34, 52, 28, 64, 46, 72, 58];
  const chart = bars.map((height, index) => box(36 + index * 44, 372 - height * 1.5, 30, height * 1.5, 8, index === 5 ? INK : SOFT)).join("");
  const item = (top: number, name: string, left: string, urgent: boolean) =>
    box(28, top, 334, 64, 18, "#fff", LINE) +
    box(42, top + 14, 36, 36, 11, SOFT) +
    text(94, top + 38, name, { size: 17, weight: 600 }) +
    (urgent ? box(262, top + 18, 86, 28, 14, INK) + text(305, top + 37, left, { size: 13, weight: 600, fill: "#fff", anchor: "middle" }) : box(262, top + 18, 86, 28, 14, "#fff", MID) + text(305, top + 37, left, { size: 13, weight: 600, fill: MUTED, anchor: "middle" }));
  return (
    text(28, 112, "Pantry", { size: 34, weight: 700 }) +
    box(28, 142, 334, 262, 22, "#fff", LINE) +
    text(50, 184, "You saved this month", { size: 14, fill: MUTED }) +
    text(50, 232, "€38", { size: 46, weight: 700 }) +
    text(50, 262, "by cooking what you had", { size: 14, fill: MUTED }) +
    chart +
    text(30, 446, "USE SOON", { size: 12, weight: 600, fill: MUTED, spacing: 1.6 }) +
    item(464, "Spinach", "Today", true) +
    item(540, "Chicken thighs", "2 days", true) +
    item(616, "Green lentils", "6 months", false)
  );
}

const SCREENS: AppScreen[] = [
  { src: screen(planWeek(), 0), alt: "The week view: seven days across the top with Tuesday chosen, and three dinners planned for it.", caption: "Plan your week", width: 390, height: 844, blurDataUrl: seed("#fcfcfc", "#ececec", "#fafafa") },
  { src: screen(shareList(), 1), alt: "A shared shopping list with seven of twelve items in the basket, and the two people it is shared with.", caption: "Share a list", width: 390, height: 844, blurDataUrl: seed("#f4f4f4", "#fcfcfc", "#f0f0f0") },
  { src: screen(cookStep(), 2), alt: "A cooking step in large type, with a timer ring that is two thirds full and a Next step button.", caption: "Cook step by step", width: 390, height: 844, blurDataUrl: seed("#f6f6f6", "#e9e9e9", "#3a3a3a") },
  { src: screen(shopInOrder(), 1), alt: "A shopping list sorted by aisle, with a route that shows produce and dairy done.", caption: "Shop in aisle order", width: 390, height: 844, blurDataUrl: seed("#f6f6f6", "#fcfcfc", "#f3f3f3") },
  { src: screen(pantry(), 3), alt: "The pantry: how much was saved this month, and what to use up soon.", caption: "Waste less", width: 390, height: 844, blurDataUrl: seed("#fafafa", "#f0f0f0", "#fcfcfc") },
];

/**
 * `gutter` sets --page-gutter for the row inside: the side padding of the page where the row reaches it, and 0 where the
 * page has margin to spare, so on a phone the scroller runs to the edge of the screen and on a desktop it ends with the column.
 */
function Example({ caption, gutter, children }: { caption: string; gutter: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className={`min-w-0 ${gutter}`}>
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example gutter="[--page-gutter:1.5rem] min-[1152px]:[--page-gutter:0px]" caption="Five screens in phones drawn in CSS: the middle one is larger and the others stand on the same line, so they sit lower and the captions line up. On a phone the row becomes a snapping scroller">
        <AppScreensRow
          title="Dinner, planned in a minute"
          description="Fennel keeps the week, the shopping list and the cooking in one place, so the question at six o'clock is already answered."
          screens={SCREENS}
          bleed="var(--page-gutter)"
        />
      </Example>

      <div className="mx-auto mt-20 max-w-2xl border-t border-border pt-12 sm:mt-24">
        <Example gutter="[--page-gutter:1.5rem] min-[720px]:[--page-gutter:0px]" caption="Four screens in a narrow column: the row scrolls sideways with snapping, the next phone peeks in, a mouse gets a thin scrollbar to drag, and the region is a stop for the keyboard (Tab to it, then the arrow keys). Its name is set, so two rows on one page are not both called App screens">
          <AppScreensRow headingLevel={3} title="Made for the kitchen" screens={SCREENS.slice(0, 4)} featuredIndex={1} bleed="var(--page-gutter)" labels={{ region: "Kitchen screens" }} />
        </Example>
      </div>
    </div>
  );
}
