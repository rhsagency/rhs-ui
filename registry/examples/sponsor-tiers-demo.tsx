import { SponsorTiers } from "@rhs-ui/marketing/sponsor-tiers";

type Hair = "short" | "long" | "bun" | "curly" | "bald";

interface Look {
  ground: string;
  skin: string;
  hair: string;
  shirt: string;
  style: Hair;
}

/** A portrait drawn for the demo: head and shoulders on a pale ground. In your page: the supporter's own avatar. */
function portrait({ ground, skin, hair, shirt, style }: Look): string {
  const cap = `<path d='M31.5 38C30 23 38 16.5 48 16.5S66 23 64.5 38C63 31.5 59.5 28 55 26.5C50 29 43 29 39 26.5C34.5 28 31 31.5 31.5 38Z' fill='${hair}'/>`;
  const behind = style === "long" ? `<path d='M30 40c-2-16 6-25 18-25s20 9 18 25v24c0 3-3 5-6 5H36c-3 0-6-2-6-5z' fill='${hair}'/>` : style === "bun" ? `<circle cx='48' cy='14' r='7.5' fill='${hair}'/>` : "";
  const above =
    style === "curly"
      ? `<g fill='${hair}'><circle cx='36' cy='28' r='8'/><circle cx='43' cy='21' r='8'/><circle cx='53' cy='21' r='8'/><circle cx='60' cy='28' r='8'/><circle cx='33' cy='37' r='5'/><circle cx='63' cy='37' r='5'/><circle cx='48' cy='19' r='8'/></g>`
      : style === "bald"
        ? ""
        : cap;
  const ears = style === "long" ? "" : `<circle cx='32.5' cy='41' r='3' fill='${skin}'/><circle cx='63.5' cy='41' r='3' fill='${skin}'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${ground}'/>${behind}<path d='M10 96c1-19 15-29 38-29s37 10 38 29z' fill='${shirt}'/><rect x='41' y='52' width='14' height='20' rx='6' fill='${skin}'/><path d='M41 55h14v6c-4 3.5-10 3.5-14 0z' fill='#000' opacity='.12'/>${ears}<ellipse cx='48' cy='40' rx='15' ry='17.5' fill='${skin}'/>${above}</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** A wordmark drawn in SVG text, as wide as its letters (`width` is that, at 20px), so it sits in the middle of its cell and scales down evenly when the cell is narrow. In your page: the sponsor's logo, with their permission, which carries its own viewBox. */
function Wordmark({ name, width, weight = 600 }: { name: string; width: number; weight?: number }): React.JSX.Element {
  return (
    <svg viewBox={`0 0 ${width} 28`} width={width} height={28} aria-hidden="true">
      <text x="0" y="21" fontSize="20" fontWeight={weight} fill="currentColor" letterSpacing="-0.5" textLength={width} lengthAdjust="spacingAndGlyphs">
        {name}
      </text>
    </svg>
  );
}

const SUPPORTERS: readonly { name: string; look?: Look }[] = [
  { name: "Inès Moreau", look: { ground: "#e8ddd0", skin: "#e8c4a3", hair: "#7a4a2a", shirt: "#6b7a6a", style: "bun" } },
  { name: "Sam Okafor", look: { ground: "#d3dcd8", skin: "#8d5a3b", hair: "#231d1a", shirt: "#3d4a4f", style: "short" } },
  { name: "Arjun Mehta" },
  { name: "Lotte de Vries", look: { ground: "#d9dde3", skin: "#f0d3b8", hair: "#a65e2e", shirt: "#c9c2b3", style: "long" } },
  { name: "Jonas Keller" },
  { name: "Mei Tanaka", look: { ground: "#e4e0d6", skin: "#e8c4a3", hair: "#1f1a17", shirt: "#2f3438", style: "short" } },
  { name: "Elif Aksoy" },
  { name: "Luca Romano", look: { ground: "#dcd6cc", skin: "#c68a5e", hair: "#231d1a", shirt: "#6b7a6a", style: "curly" } },
  { name: "Femke Bos" },
  { name: "Daan Peters", look: { ground: "#d3dcd8", skin: "#f0d3b8", hair: "#4a3425", shirt: "#c9c2b3", style: "bald" } },
  { name: "Priya Raman" },
  { name: "Tomás Herrera" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <SponsorTiers
        title="Backed by the people who use it"
        description="Kestrel is free and maintained in the open. These sponsors pay for the hosting, the audits and the maintainers' time."
        action={{ label: "Become a sponsor", href: "#" }}
        tiers={[
          {
            name: "Platinum",
            size: "lg",
            sponsors: [
              {
                name: "Northwind Cloud",
                href: "#",
                blurb: "Hosts every preview build and the documentation.",
                mark: (
                  <svg viewBox="0 0 36 36" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="6" width="28" height="6" rx="3" />
                    <rect x="4" y="15" width="20" height="6" rx="3" />
                    <rect x="4" y="24" width="12" height="6" rx="3" />
                  </svg>
                ),
              },
              {
                name: "Halcyon",
                href: "#",
                blurb: "Funds two full-time maintainers, since the first release.",
                mark: (
                  <svg viewBox="0 0 36 36" aria-hidden="true">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" />
                    <circle cx="18" cy="18" r="5.5" fill="currentColor" />
                  </svg>
                ),
              },
            ],
          },
          {
            name: "Gold",
            size: "md",
            sponsors: [
              { name: "Polder", href: "#", mark: <Wordmark name="Polder" width={56} /> },
              { name: "Lumen", href: "#", mark: <Wordmark name="Lumen" width={59} weight={500} /> },
              { name: "Fjord", href: "#", mark: <Wordmark name="Fjord" width={47} weight={700} /> },
              { name: "Atlas", href: "#", mark: <Wordmark name="Atlas" width={43} /> },
              { name: "Mirror Labs", href: "#", mark: <Wordmark name="Mirror Labs" width={99} weight={500} /> },
              { name: "Harbour & Co", href: "#", mark: <Wordmark name="Harbour & Co" width={120} /> },
              { name: "Oakline", href: "#", mark: <Wordmark name="Oakline" width={68} weight={700} /> },
            ],
          },
          {
            name: "Supporters",
            size: "sm",
            sponsors: SUPPORTERS.map(({ name, look }) => ({ name, href: "#", avatar: look ? portrait(look) : undefined })),
          },
        ]}
      />
    </div>
  );
}
