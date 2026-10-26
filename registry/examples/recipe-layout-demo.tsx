import { RecipeLayout } from "@rhs-ui/marketing/recipe-layout";

/** A picture drawn as a data URI, so the demo needs no files. */
const picture = (width: number, height: number, shapes: string, ground = "#e6e3dc") => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'><rect width='${width}' height='${height}' fill='${ground}'/>${shapes}</svg>`),
});

/** A roasted tomato half: a dark skin, a paler cut face and a few seeds. */
const tomato = (x: number, y: number, r: number) =>
  `<circle cx='${x}' cy='${y}' r='${r}' fill='#7f7466'/><circle cx='${x}' cy='${y}' r='${Math.round(r * 0.78)}' fill='#a69b8b'/><circle cx='${x}' cy='${y}' r='${Math.round(r * 0.4)}' fill='#8c8173'/>` +
  [0, 72, 144, 216, 288].map((a) => `<circle cx='${(x + Math.cos((a * Math.PI) / 180) * r * 0.5).toFixed(1)}' cy='${(y + Math.sin((a * Math.PI) / 180) * r * 0.5).toFixed(1)}' r='${Math.max(2, Math.round(r * 0.07))}' fill='#d9d1c3'/>`).join("");

/** A basil leaf at an angle. */
const leaf = (x: number, y: number, size: number, angle: number) =>
  `<path transform='translate(${x} ${y}) rotate(${angle}) scale(${size})' d='M0 -30C22 -20 22 14 0 32C-22 14 -22 -20 0 -30Z' fill='#6b665b'/><path transform='translate(${x} ${y}) rotate(${angle}) scale(${size})' d='M0 -26L0 28' stroke='#8b8578' stroke-width='2' fill='none'/>`;

/** A nest of spaghetti: strands that loop around a centre, in two warm greys. */
const strands = (x: number, y: number, scale: number) =>
  `<g transform='translate(${x} ${y}) scale(${scale})' fill='none' stroke-linecap='round' stroke-width='6'>` +
  Array.from({ length: 18 }, (_, i) => {
    const rx = 58 + (i % 5) * 10;
    const ry = 32 + (i % 4) * 9;
    const dash = `${110 + (i % 3) * 36} ${34 + (i % 4) * 18}`;
    return `<ellipse rx='${rx}' ry='${ry}' transform='rotate(${i * 21})' stroke='${i % 2 ? "#d8cdb4" : "#bdb195"}' stroke-dasharray='${dash}'/>`;
  }).join("") +
  "</g>";

const plate = picture(
  1050,
  450,
  `<g stroke='#dad6cc' stroke-width='2'>${[60, 150, 240, 330, 420].map((y) => `<line x1='0' y1='${y}' x2='1050' y2='${y}'/>`).join("")}</g>
  <rect x='88' y='96' width='150' height='270' rx='10' fill='#eceae4' transform='rotate(-7 163 231)'/>
  <g stroke='#d9d5cb' stroke-width='3' transform='rotate(-7 163 231)'><line x1='88' y1='150' x2='238' y2='150'/><line x1='88' y1='168' x2='238' y2='168'/></g>
  <ellipse cx='540' cy='252' rx='214' ry='200' fill='#d3cec3' opacity='.75'/>
  <circle cx='525' cy='225' r='206' fill='#f7f5f1' stroke='#cdc9bf' stroke-width='2'/>
  <circle cx='525' cy='225' r='176' fill='none' stroke='#e7e3db' stroke-width='6'/>
  <circle cx='525' cy='225' r='150' fill='#f0ede7'/>
  <ellipse cx='525' cy='232' rx='112' ry='80' fill='#9d9384'/>
  ${strands(525, 226, 1.12)}
  ${tomato(446, 196, 24)}${tomato(612, 250, 22)}${tomato(512, 306, 20)}${tomato(588, 168, 18)}
  ${leaf(505, 168, 0.8, -28)}${leaf(572, 214, 0.7, 40)}${leaf(460, 266, 0.65, 130)}
  <g fill='#fbf9f5' stroke='#d6d1c6' stroke-width='1.5'><circle cx='540' cy='200' r='6'/><circle cx='556' cy='262' r='5'/><circle cx='480' cy='238' r='5'/><circle cx='520' cy='276' r='6'/><circle cx='596' cy='232' r='4'/></g>
  <g transform='translate(842 230) rotate(18)'><rect x='-9' y='20' width='18' height='170' rx='9' fill='#cfcabf'/><path d='M-30 -110H30V-20Q30 20 0 20Q-30 20 -30 -20Z' fill='#d8d4ca'/><g stroke='#f0ede7' stroke-width='5' stroke-linecap='round'><line x1='-18' y1='-104' x2='-18' y2='-34'/><line x1='0' y1='-104' x2='0' y2='-34'/><line x1='18' y1='-104' x2='18' y2='-34'/></g></g>`,
);

const tray = picture(
  800,
  500,
  `<rect x='36' y='58' width='728' height='384' rx='30' fill='#cdc8be' stroke='#a8a296' stroke-width='3'/>
  <rect x='58' y='80' width='684' height='340' rx='18' fill='#dcd8cf'/>
  <g fill='none' stroke='#efece6' stroke-width='3' stroke-linecap='round' opacity='.9'><path d='M92 130C180 112 300 148 380 126'/><path d='M420 394C520 410 620 380 706 398'/></g>
  ${[[150, 160], [270, 150], [390, 164], [510, 150], [630, 166], [200, 270], [320, 282], [440, 270], [560, 284], [666, 270], [250, 372], [390, 380], [530, 372]].map(([x, y], i) => tomato(x ?? 0, y ?? 0, 46 - (i % 3) * 3)).join("")}
  <g fill='none' stroke='#efece6' stroke-width='9' stroke-linecap='round' opacity='.95'><path d='M214 220Q238 196 262 226'/><path d='M486 214Q510 190 534 220'/><path d='M338 330Q362 306 386 336'/><path d='M600 330Q624 306 648 336'/></g>
  <g fill='#f7f5f1' stroke='#bdb7ab' stroke-width='2'><ellipse cx='214' cy='218' rx='14' ry='21' transform='rotate(-14 214 218)'/><ellipse cx='330' cy='214' rx='14' ry='21' transform='rotate(12 330 214)'/><ellipse cx='474' cy='330' rx='14' ry='21' transform='rotate(-8 474 330)'/><ellipse cx='592' cy='222' rx='14' ry='21' transform='rotate(16 592 222)'/><ellipse cx='150' cy='330' rx='14' ry='21' transform='rotate(-20 150 330)'/></g>`,
);

const pan = picture(
  800,
  500,
  `<ellipse cx='392' cy='276' rx='232' ry='206' fill='#d3cec3' opacity='.7'/>
  <rect x='560' y='232' width='210' height='36' rx='18' fill='#a8a296' transform='rotate(-6 560 250)'/>
  <circle cx='380' cy='250' r='214' fill='#bdb7ab' stroke='#a39d91' stroke-width='3'/>
  <circle cx='380' cy='250' r='186' fill='#dcd8cf'/>
  <ellipse cx='380' cy='256' rx='140' ry='112' fill='#a1978a'/>
  ${strands(374, 250, 1.5)}
  ${tomato(300, 210, 26)}${tomato(470, 292, 24)}${tomato(372, 342, 22)}${tomato(448, 190, 20)}
  ${leaf(350, 180, 1, -24)}${leaf(430, 250, 0.85, 52)}${leaf(318, 296, 0.8, 120)}
  <g fill='#fbf9f5' stroke='#d6d1c6' stroke-width='1.5'><circle cx='400' cy='214' r='7'/><circle cx='412' cy='318' r='6'/><circle cx='330' cy='250' r='6'/><circle cx='462' cy='236' r='5'/><circle cx='360' cy='292' r='5'/><circle cx='436' cy='346' r='5'/></g>`,
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Change the servings and every quantity rescales, in fractions and units a cook can read. Start the timer in step 2.</p>
      <RecipeLayout
        headingLevel={2}
        eyebrow="Weeknight dinners"
        title="Slow-roasted tomato spaghetti"
        intro="Tomatoes that go in raw and come out jammy, with garlic that squeezes out of its skin into the sauce. Fifteen minutes of work and an oven that does the rest."
        image={{ ...plate, alt: "A plate of spaghetti in a dark red sauce, with roasted tomatoes and basil, and a fork beside it." }}
        times={{ prep: 15, cook: 55 }}
        servings={4}
        ingredients={[
          { group: "For the tomatoes", quantity: 750, unit: "g", name: "ripe tomatoes", note: "halved" },
          { group: "For the tomatoes", quantity: 1, name: "red onion", plural: "red onions", note: "thinly sliced" },
          { group: "For the tomatoes", quantity: 6, unit: "clove", unitPlural: "cloves", name: "garlic", note: "left in their skins" },
          { group: "For the tomatoes", quantity: 4, unit: "tbsp", name: "olive oil" },
          { group: "For the tomatoes", quantity: 2, unit: "tsp", name: "sea salt flakes" },
          { group: "For the tomatoes", quantity: 1, unit: "tsp", name: "caster sugar" },
          { group: "To finish", quantity: 400, unit: "g", name: "spaghetti" },
          { group: "To finish", quantity: 0.5, unit: "cup", unitPlural: "cups", name: "pasta water", note: "reserved" },
          { group: "To finish", quantity: 1, unit: "handful", unitPlural: "handfuls", name: "basil leaves" },
          { group: "To finish", quantity: 60, unit: "g", name: "parmesan", note: "finely grated, plus extra to serve" },
          { group: "To finish", name: "black pepper", note: "to taste" },
        ]}
        steps={[
          { text: "Heat the oven to 160°C (140°C fan). Tip the tomatoes into a large roasting tin with the onion, garlic, oil, salt and sugar, toss well, then turn the tomatoes cut side up.", image: { ...tray, alt: "A roasting tin of halved tomatoes, cut side up, with garlic cloves between them.", caption: "Cut side up, and in one layer so they roast rather than steam." } },
          { text: "Roast for 45 minutes, until the tomatoes have collapsed and their edges are dark and sticky.", timer: { minutes: 45 } },
          { text: "Bring a large pan of well-salted water to the boil while the tomatoes finish." },
          { text: "Cook the spaghetti for two minutes less than the packet says. Keep half a cup of the water, then drain.", timer: { minutes: 9, label: "9 min" } },
          { text: "Squeeze the garlic out of its skins into the tin and crush everything together with a fork into a rough, jammy sauce." },
          { text: "Toss the spaghetti through the sauce over a medium heat with a splash of the pasta water until it coats every strand. Add the basil and half the parmesan, and serve with the rest on top.", image: { ...pan, alt: "A wide pan of spaghetti coated in tomato sauce, with basil leaves on top." } },
        ]}
        nutrition={{ calories: 520, fat: 15, saturatedFat: 3.5, carbohydrates: 79, sugars: 14, fibre: 8, protein: 17, sodium: 610 }}
        tips={[
          "The sauce keeps for four days in the fridge, or three months frozen flat in a bag.",
          "If the tomatoes are pale and watery, use two tins of whole plum tomatoes instead, drained, and roast them for 30 minutes.",
          "For gnocchi instead of spaghetti, warm the sauce in a wide pan and add the gnocchi as soon as they float.",
        ]}
        structuredData={{ author: "Marit Bosch", cuisine: "Italian", category: "Main course", datePublished: "2026-09-18", keywords: "tomato, spaghetti, vegetarian" }}
      />
    </div>
  );
}
