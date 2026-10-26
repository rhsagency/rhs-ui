"use client";

import { useState, type ReactNode } from "react";

import { ShoppableList, type ShoppableItem, type ShoppableLine } from "@rhs-ui/commerce/shoppable-list";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const SPAGHETTI = pic(
  "#efe7d3",
  "<rect x='38' y='18' width='44' height='84' rx='6' fill='#b8452f'/><rect x='46' y='34' width='28' height='42' rx='3' fill='#f3e8c8'/><path d='M52 38v34M60 38v34M68 38v34' stroke='#d9b45f' stroke-width='3' stroke-linecap='round'/>",
);
const TOMATOES = pic(
  "#f1e3df",
  "<rect x='32' y='34' width='56' height='62' rx='6' fill='#d8483f'/><ellipse cx='60' cy='34' rx='28' ry='6' fill='#e8837b'/><rect x='32' y='54' width='56' height='20' fill='#f4efe6'/><circle cx='60' cy='64' r='6' fill='#d8483f'/>",
);
const GARLIC = pic(
  "#ece8de",
  "<path d='M60 26c-4 10-22 22-22 44a22 22 0 0 0 44 0c0-22-18-34-22-44z' fill='#f6f1e6' stroke='#cfc6b3' stroke-width='2'/><path d='M60 26v46M49 38c-6 10-8 24-4 34M71 38c6 10 8 24 4 34' stroke='#d6cdb9' stroke-width='2' fill='none'/>",
);
const OIL = pic(
  "#e8ecd9",
  "<rect x='50' y='18' width='20' height='22' rx='4' fill='#4b5a2a'/><path d='M44 42h32l4 14v38a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V56z' fill='#8a9a3c'/><rect x='42' y='64' width='36' height='22' fill='#f1efdc'/>",
);
const BASIL = pic(
  "#e3ebdc",
  "<ellipse cx='46' cy='56' rx='15' ry='24' transform='rotate(-25 46 56)' fill='#4f7f3a'/><ellipse cx='74' cy='56' rx='15' ry='24' transform='rotate(25 74 56)' fill='#5f9145'/><ellipse cx='60' cy='46' rx='14' ry='24' fill='#6aa04c'/><path d='M60 70v30' stroke='#3f6a2e' stroke-width='4' stroke-linecap='round'/>",
);
const BASIL_PLANT = pic(
  "#e3ebdc",
  "<path d='M40 72h40l-6 28H46z' fill='#b9694a'/><rect x='38' y='66' width='44' height='9' rx='3' fill='#c97b5b'/><ellipse cx='48' cy='50' rx='12' ry='18' transform='rotate(-30 48 50)' fill='#4f7f3a'/><ellipse cx='72' cy='50' rx='12' ry='18' transform='rotate(30 72 50)' fill='#5f9145'/><ellipse cx='60' cy='40' rx='11' ry='18' fill='#6aa04c'/>",
);
const PARMESAN = pic(
  "#f1ead6",
  "<path d='M22 82l62-36 16 16v24a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6z' fill='#e6c066'/><path d='M22 82l62-36 16 16-62 20z' fill='#f1d78c'/><circle cx='86' cy='72' r='2.5' fill='#cfa34a'/><circle cx='70' cy='80' r='2' fill='#cfa34a'/>",
);
const SALT = pic(
  "#ebeaf0",
  "<rect x='42' y='46' width='36' height='52' rx='8' fill='#f6f6f9' stroke='#c9c9d6' stroke-width='2'/><rect x='42' y='32' width='36' height='18' rx='6' fill='#9ea3b8'/><circle cx='52' cy='40' r='1.8' fill='#fff'/><circle cx='60' cy='40' r='1.8' fill='#fff'/><circle cx='68' cy='40' r='1.8' fill='#fff'/>",
);

const BOARD = pic(
  "#efe4d2",
  "<rect x='14' y='44' width='92' height='32' rx='3' fill='#b98a54'/><path d='M22 56h28M62 64h34M30 70h20' stroke='#8f6638' stroke-width='2' stroke-linecap='round'/><rect x='14' y='44' width='92' height='6' rx='3' fill='#c99b63'/>",
);
const BRACKET = pic(
  "#e6e8ec",
  "<path d='M34 28h14v50h38v14H34z' fill='#9aa3ae'/><circle cx='41' cy='38' r='3' fill='#e6e8ec'/><circle cx='41' cy='60' r='3' fill='#e6e8ec'/><circle cx='62' cy='85' r='3' fill='#e6e8ec'/><circle cx='78' cy='85' r='3' fill='#e6e8ec'/>",
);
const BRACKET_GALV = pic(
  "#e6e8ec",
  "<path d='M34 28h14v50h38v14H34z' fill='#6f7c8c'/><circle cx='41' cy='38' r='3' fill='#e6e8ec'/><circle cx='41' cy='60' r='3' fill='#e6e8ec'/><circle cx='62' cy='85' r='3' fill='#e6e8ec'/><circle cx='78' cy='85' r='3' fill='#e6e8ec'/>",
);
const SCREWS = pic(
  "#ece9e2",
  "<rect x='30' y='44' width='60' height='44' rx='5' fill='#c9a24b'/><rect x='30' y='44' width='60' height='14' rx='5' fill='#dcb961'/><path d='M46 24l4 16M60 22v18M74 24l-4 16' stroke='#8d949c' stroke-width='5' stroke-linecap='round'/>",
);
const LINER = pic(
  "#e4e7e1",
  "<ellipse cx='60' cy='86' rx='36' ry='9' fill='#4c5648'/><rect x='24' y='40' width='72' height='46' fill='#5b6656'/><ellipse cx='60' cy='40' rx='36' ry='9' fill='#7b8776'/><ellipse cx='60' cy='40' rx='12' ry='3' fill='#e4e7e1'/>",
);
const SOIL = pic(
  "#e9e2d8",
  "<path d='M36 30h48l6 66H30z' fill='#5a4636'/><path d='M36 30h48l2 16H34z' fill='#6c5543'/><rect x='46' y='56' width='28' height='22' rx='3' fill='#d8c9a8'/><path d='M52 64h16M52 70h10' stroke='#5a4636' stroke-width='2.5' stroke-linecap='round'/>",
);
const BIT = pic(
  "#e8e9ee",
  "<path d='M30 78L88 40' stroke='#7e8794' stroke-width='9' stroke-linecap='round'/><path d='M34 76l8-5M44 70l8-5M54 64l8-5M64 58l8-5' stroke='#c9ced6' stroke-width='3' stroke-linecap='round'/><rect x='80' y='30' width='20' height='16' rx='3' transform='rotate(-33 90 38)' fill='#3d4452'/>",
);

const RECIPE: readonly ShoppableItem[] = [
  { id: "spaghetti", name: "Spaghetti", detail: "Kestrel Mill, 500\u00a0g", image: SPAGHETTI, price: 210, packSize: 500, amount: 400, unit: "g" },
  { id: "tomatoes", name: "Plum tomatoes, tinned", detail: "Northwind, 400\u00a0g tin", image: TOMATOES, price: 129, packSize: 400, amount: 800, unit: "g" },
  { id: "garlic", name: "Garlic", detail: "One bulb, about 10 cloves", image: GARLIC, price: 69, packSize: 10, amount: 3, unit: "cloves" },
  { id: "oil", name: "Extra virgin olive oil", detail: "Halcyon, 500\u00a0ml", image: OIL, price: 795, amount: 3, unit: "tbsp", defaultChecked: false },
  {
    id: "basil",
    name: "Fresh basil",
    detail: "Bunch, 30\u00a0g",
    image: BASIL,
    price: 190,
    amount: 1,
    unit: "bunch",
    inStock: false,
    substitute: { id: "basil-plant", name: "Basil plant in pot", detail: "Halcyon Garden, 10\u00a0cm pot", image: BASIL_PLANT, price: 220 },
  },
  { id: "parmesan", name: "Parmesan", detail: "Kestrel Dairy, 150\u00a0g wedge", image: PARMESAN, price: 435, packSize: 150, amount: 60, unit: "g" },
  { id: "salt", name: "Sea salt", detail: "Flaky, 250\u00a0g", image: SALT, price: 110, note: "To taste" },
];

const PROJECT: readonly ShoppableItem[] = [
  { id: "board", name: "Cedar board, 6\u00a0ft", detail: "150 x 25\u00a0mm, planed", image: BOARD, price: 1150, packSize: 1, amount: 8, unit: "boards" },
  {
    id: "brackets",
    name: "Stainless corner brackets",
    detail: "Pack of 4, 90 degrees",
    image: BRACKET,
    price: 620,
    packSize: 4,
    amount: 8,
    unit: "pcs",
    inStock: false,
    substitute: { id: "brackets-galv", name: "Galvanised corner brackets", detail: "Pack of 4, 90 degrees", image: BRACKET_GALV, price: 480, packSize: 4 },
  },
  { id: "screws", name: "Exterior screws 5 x 60\u00a0mm", detail: "Box of 200", image: SCREWS, price: 795, packSize: 200, amount: 48, unit: "screws" },
  { id: "liner", name: "Bed liner fabric", detail: "5\u00a0m roll, 1\u00a0m wide", image: LINER, price: 840, packSize: 5, amount: 3, unit: "m" },
  { id: "soil", name: "Peat-free compost", detail: "Northwind, 50\u00a0L bag", image: SOIL, price: 690, packSize: 50, amount: 200, unit: "L" },
  { id: "bit", name: "Pilot drill bit, 3\u00a0mm", detail: "Pack of 3", image: BIT, price: 490, amount: 1, unit: "pack", defaultChecked: false },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">{children}</div>
      <p role="status" className="text-xs text-muted-foreground tabular-nums">
        {note}
      </p>
    </div>
  );
}

const summary = (lines: readonly ShoppableLine[], currency: string): string =>
  `Sent to the cart: ${lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")}. Total ${new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(lines.reduce((sum, line) => sum + line.total, 0) / 100)}.`;

export default function Demo(): React.JSX.Element {
  const [recipe, setRecipe] = useState("onAddAll receives the checked lines: product, packs and price.");
  const [project, setProject] = useState("Swap the sold-out brackets and the line joins the cart.");
  return (
    <div className="grid w-full max-w-5xl min-w-0 gap-x-10 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
      <Example caption="A recipe: servings scale the amounts and the packs, one line is sold out" note={recipe}>
        <ShoppableList
          title="Weeknight arrabbiata"
          meta="35 minutes, amounts for 4"
          items={RECIPE}
          servings={4}
          currency="EUR"
          locale="en-GB"
          onAddAll={async (lines) => {
            await wait(700);
            setRecipe(summary(lines, "EUR"));
          }}
        />
      </Example>
      <Example caption="A project: no servings, packs of different sizes, a substitute for the brackets" note={project}>
        <ShoppableList
          title="Raised garden bed, 2 x 1 m"
          meta="Materials for one bed"
          items={PROJECT}
          currency="EUR"
          locale="en-GB"
          onAddAll={async (lines) => {
            await wait(700);
            setProject(summary(lines, "EUR"));
          }}
        />
      </Example>
    </div>
  );
}
