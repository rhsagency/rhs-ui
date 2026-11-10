import { ProofBento } from "@rhs-ui/marketing/proof-bento";

/** A wordmark drawn as SVG text, as wide as its letters, so a row of them is spaced by its gaps and not by empty boxes. In your page: your customers' own SVG logos. */
function Wordmark({ name, width, weight = 600, tracking = -0.5, upper = false, mark }: { name: string; width: number; weight?: number; tracking?: number; upper?: boolean; mark?: React.ReactNode }): React.JSX.Element {
  return (
    <svg role="img" aria-label={name} viewBox={`0 0 ${width} 28`} className="h-6 w-auto">
      {mark}
      <text x={mark ? 26 : 0} y="21" fontSize={upper ? 17 : 21} fontWeight={weight} fill="currentColor" letterSpacing={tracking}>
        {upper ? name.toUpperCase() : name}
      </text>
    </svg>
  );
}

/** A picture drawn for the demo, tall. In your page: the photograph a customer shared. */
const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 900'>` +
      `<rect width='600' height='900' fill='#d8d0c2'/>` +
      `<rect x='64' y='84' width='472' height='420' rx='8' fill='#c9bfae'/>` +
      `<rect x='80' y='100' width='440' height='388' fill='#f3eee3'/>` +
      `<path d='M80 148H520M80 196H520M80 244H520M80 292H520M80 340H520M80 388H520M80 436H520' stroke='#e5ddcd' stroke-width='11'/>` +
      `<path d='M300 100V488' stroke='#c9bfae' stroke-width='8'/>` +
      `<rect x='64' y='488' width='472' height='22' rx='4' fill='#b79f80'/>` +
      `<path d='M96 488c-4-34 4-58 22-72-2 28 6 50 18 72z' fill='#7d8f6d'/><path d='M126 488c4-44 24-70 52-82-6 34-10 60-14 82z' fill='#6a7d5b'/><path d='M150 488c14-26 36-40 60-44-12 22-26 36-34 44z' fill='#8a9c7a'/>` +
      `<path d='M84 488h104l-10 36h-84z' fill='#c4714b'/>` +
      `<g transform='translate(0 -210)'>` +
      `<path d='M96 1130C96 850 184 774 300 774s204 76 204 356z' fill='#3d4247'/>` +
      `<path d='M258 774l42 86 42-86z' fill='#ece7dc'/><path d='M300 860v270' stroke='#d6d0c3' stroke-width='3'/>` +
      `<rect x='270' y='706' width='60' height='84' rx='24' fill='#c48a66'/>` +
      `<ellipse cx='300' cy='638' rx='80' ry='94' fill='#d9a07b'/>` +
      `<path d='M218 648c-14-102 46-144 86-144 52 0 92 40 78 144-12-52-44-74-78-74-40 0-72 22-86 74z' fill='#2b2622'/>` +
      `<path d='M214 644C204 506 254 480 302 480s100 26 90 164' fill='none' stroke='#202325' stroke-width='12' stroke-linecap='round'/>` +
      `<rect x='194' y='616' width='32' height='70' rx='15' fill='#202325'/><rect x='374' y='616' width='32' height='70' rx='15' fill='#202325'/>` +
      `<path d='M392 684c-6 52-46 70-92 62' fill='none' stroke='#202325' stroke-width='7' stroke-linecap='round'/><circle cx='296' cy='746' r='10' fill='#202325'/>` +
      `</g>` +
      `<rect y='830' width='600' height='70' fill='#b88f64'/><rect y='830' width='600' height='8' fill='#cba578'/>` +
      `</svg>`,
  );

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <ProofBento
        eyebrow="Customers"
        title="Teams that switch do not look back"
        description="The people who answer the inbox every day, and the numbers behind what they say."
        tiles={[
          {
            id: "northwind",
            kind: "quote",
            span: 2,
            rowSpan: 2,
            quote: "Our first reply went from four hours to eight minutes in a month. Customers noticed before we told them.",
            name: "Inès Moreau",
            role: "Head of support, Northwind",
          },
          { id: "teams", kind: "stat", value: 2400, label: "Teams on Halcyon", detail: "in 31 countries" },
          { id: "uptime", kind: "stat", value: 99.98, decimals: 2, suffix: "%", label: "Uptime, last 12 months", detail: "Public status page" },
          {
            id: "desk",
            kind: "image",
            rowSpan: 2,
            src: PHOTO,
            alt: "A support agent in a headset at a bright window with a plant on the sill",
            caption: "The Kestrel support desk, Rotterdam",
            credit: "Shared by Lotte de Vries",
            focalPoint: "50% 45%",
          },
          { id: "g2", kind: "rating", score: 4.8, count: "2,140 reviews", source: "G2", href: "#reviews" },
          {
            id: "logos",
            kind: "logos",
            span: 2,
            title: "Trusted by support teams at",
            logos: [
              { name: "Northwind", mark: <Wordmark name="Northwind" width={129} mark={<circle cx="10" cy="14" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />} /> },
              { name: "Kestrel", mark: <Wordmark name="Kestrel" width={92} weight={500} tracking={2} upper /> },
              { name: "Polder", mark: <Wordmark name="Polder" width={64} weight={700} tracking={-1} /> },
              { name: "Lumen", mark: <Wordmark name="Lumen" width={68} weight={500} tracking={-0.5} /> },
              { name: "Marlow", mark: <Wordmark name="Marlow" width={100} mark={<rect x="2" y="6" width="16" height="16" rx="4" fill="currentColor" />} /> },
              { name: "Harbour", mark: <Wordmark name="Harbour" width={103} weight={500} tracking={2.5} upper /> },
            ],
          },
          { id: "harbour", kind: "quote", quote: "Live in an afternoon. No training needed.", name: "Sam Okafor", role: "Design lead, Harbour" },
          {
            id: "marlow",
            kind: "quote",
            span: 2,
            quote: "We retired two other tools in the first month. Our agents keep one tab open now.",
            name: "Tomás Reyes",
            role: "Support operations, Marlow",
          },
          {
            id: "also-trusted",
            kind: "logos",
            title: "Also trusted by",
            logos: [
              {
                name: "Alder",
                mark: <Wordmark name="Alder" width={80} mark={<path d="M10 5l7 9-7 9-7-9z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />} />,
              },
              { name: "Fenwick", mark: <Wordmark name="Fenwick" width={97} weight={500} tracking={2} upper /> },
              { name: "Orrin", mark: <Wordmark name="Orrin" width={49} weight={700} tracking={-1} /> },
              { name: "tessel", mark: <Wordmark name="tessel" width={59} weight={600} tracking={-0.5} /> },
            ],
          },
          { id: "coverage", kind: "stat", value: "24/7", label: "Human replies", detail: "In three time zones" },
        ]}
      />
    </div>
  );
}
