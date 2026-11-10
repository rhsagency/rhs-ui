import { CommunityHero, type CommunityMember } from "@rhs-ui/marketing/community-hero";

type Look = { bg: string; skin: string; hair: string; shirt: string; style: "short" | "long" | "bun" | "cap" | "none" };

/* Portraits drawn for the demo: a head, shoulders and a haircut in greys, so they need no file. In your site these are your members' own pictures, square, at least 128 pixels wide. */
const portrait = ({ bg, skin, hair, shirt, style }: Look) => {
  const behind = style === "long" ? `<path d='M31 46c0-15 8-24 19-24s19 9 19 24v30H31z' fill='${hair}'/>` : "";
  const top =
    style === "short"
      ? `<path d='M34 44c0-13 6-20 16-20s16 7 16 20c-5-5-10-7-16-7s-11 2-16 7z' fill='${hair}'/>`
      : style === "bun"
        ? `<circle cx='50' cy='22' r='8' fill='${hair}'/><path d='M34 44c0-13 6-19 16-19s16 6 16 19c-5-4-10-6-16-6s-11 2-16 6z' fill='${hair}'/>`
        : style === "cap"
          ? `<path d='M33 42c0-12 7-19 17-19s17 7 17 19z' fill='${hair}'/><rect x='30' y='40' width='40' height='5' rx='2.5' fill='${hair}'/>`
          : "";
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='${bg}'/>${behind}<path d='M14 100c2-21 17-31 36-31s34 10 36 31z' fill='${shirt}'/><rect x='44' y='58' width='12' height='14' rx='5' fill='${skin}'/><ellipse cx='50' cy='46' rx='15' ry='17' fill='${skin}'/>${top}</svg>`,
    )
  );
};

const LOOKS: Look[] = [
  { bg: "#e2e2e2", skin: "#9d9d9d", hair: "#262626", shirt: "#555", style: "short" },
  { bg: "#c9c9c9", skin: "#dadada", hair: "#3d3d3d", shirt: "#2e2e2e", style: "long" },
  { bg: "#d6d6d6", skin: "#7c7c7c", hair: "#161616", shirt: "#8a8a8a", style: "bun" },
  { bg: "#bcbcbc", skin: "#c4c4c4", hair: "#555", shirt: "#3a3a3a", style: "cap" },
  { bg: "#e8e8e8", skin: "#b0b0b0", hair: "#1f1f1f", shirt: "#6b6b6b", style: "long" },
  { bg: "#cfcfcf", skin: "#8a8a8a", hair: "#2a2a2a", shirt: "#444", style: "short" },
  { bg: "#d9d9d9", skin: "#d2d2d2", hair: "#6a6a6a", shirt: "#303030", style: "none" },
  { bg: "#c2c2c2", skin: "#a2a2a2", hair: "#222", shirt: "#7a7a7a", style: "bun" },
];

const NAMES = [
  "Maya Okafor",
  "Luis Brandt",
  "Aya Mori",
  "Tomás Rey",
  "Imke de Jong",
  "Priya Nair",
  "Jonas Berg",
  "Sofia Marin",
  "Kofi Mensah",
  "Hana Kimura",
  "Eli Brooks",
  "Nadia Haddad",
  "Oskar Lind",
  "Chidi Eze",
  "Mira Patel",
  "Theo Laurent",
  "Yara Costa",
  "Dev Anand",
];

/* Some members have a picture and some only initials, as in any real community. */
const WITHOUT = new Set([4, 5, 12, 14, 16, 17]);
const MEMBERS: CommunityMember[] = NAMES.map((name, index) => (WITHOUT.has(index) ? { name } : { name, image: portrait(LOOKS[index % LOOKS.length] as Look) }));

const ALUMNI: CommunityMember[] = ["Anke Visser", "Rutger Smit", "Fatima Zahra", "Lars Pedersen", "Nina Kovač", "Jelle Bakker", "Ida Solberg", "Marco Rossi", "Eva Lindqvist", "Kasper Dahl", "Lotte Maas", "Sven Aalto"].map((name) => ({ name }));

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Eighteen members, with pictures and with initials, and the channels that are busy now. The faces flank the text where there is room.</p>
      <CommunityHero
        title="Find your people. Ship with them."
        description="Kestrel is a community of designers and engineers who review each other's work, trade honest feedback and show up when a launch needs one more pair of eyes."
        members={MEMBERS}
        total={12480}
        channels={[
          { name: "general", online: 214 },
          { name: "show-and-tell", online: 96 },
          { name: "design-review", online: 58 },
          { name: "jobs", online: 31 },
        ]}
        joinHref="#join"
        joinLabel="Join Kestrel"
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Twelve members, all initials, and no channels: the smallest version. A phone shows eight faces and fetches no more.</p>
      <CommunityHero
        title="Class of 2014, still in touch."
        description="The alumni network of the Rotterdam Design Academy: mentoring, studio visits and a reunion every second June."
        members={ALUMNI}
        total={3260}
        joinHref="#network"
        joinLabel="Join the network"
      />
    </div>
  );
}
