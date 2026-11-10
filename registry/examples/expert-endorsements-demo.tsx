import { ExpertEndorsements } from "@rhs-ui/marketing/expert-endorsements";

type Hair = "short" | "long" | "bun" | "curly" | "bald";

interface Look {
  ground: string;
  skin: string;
  hair: string;
  shirt: string;
  style: Hair;
}

/** A portrait drawn for the demo: head and shoulders on a pale ground. In your page: a photograph of the person. */
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

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <ExpertEndorsements
        title="Trusted by the people who treat skin for a living"
        description="Three practising specialists on what they would tell a patient."
        experts={[
          {
            id: "okonkwo",
            name: "Dr. Mira Okonkwo",
            credential: "Dermatologist, MD",
            affiliation: "Kestrel Dermatology, Utrecht",
            quote: "Barrier repair is the step most routines skip. A plain ceramide cream, twice a day, does more than any serum I know.",
            photo: portrait({ ground: "#d3dcd8", skin: "#8d5a3b", hair: "#231d1a", shirt: "#f4f2ed", style: "short" }),
            href: "#",
          },
          {
            id: "raman",
            name: "Dr. Priya Raman",
            credential: "Allergist, MD",
            affiliation: "Fjord Allergy Centre, Oslo",
            quote: "I patch-test everything I recommend. Halcyon passed on my own sensitive skin first, and that matters to me.",
            photo: portrait({ ground: "#e8ddd0", skin: "#c68a5e", hair: "#1f1a17", shirt: "#3d4a4f", style: "long" }),
            href: "#",
          },
          {
            id: "aksoy",
            name: "Elif Aksoy",
            credential: "Licensed aesthetician",
            affiliation: "Studio Aksoy, Rotterdam",
            quote: "Clients ask what changed in six weeks. The honest answer is a gentler routine and daily sunscreen.",
            photo: portrait({ ground: "#d9dde3", skin: "#e8c4a3", hair: "#7a4a2a", shirt: "#2f3438", style: "bun" }),
            href: "#",
            sponsored: true,
          },
        ]}
        disclosure="Dr. Okonkwo and Dr. Raman received no payment for their quotes. Elif Aksoy is a paid Halcyon partner, which is why her card is marked Sponsored."
      />
    </div>
  );
}
