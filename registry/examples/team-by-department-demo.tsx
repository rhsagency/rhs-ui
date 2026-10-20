import { TeamByDepartment, type TeamPerson } from "@rhs-ui/marketing/team-by-department";

const PALETTES = [
  { bg: "#ddd6ca", skin: "#c8baa6", hair: "#3f3a33", top: "#8a8174" },
  { bg: "#cfd4da", skin: "#d2c2b0", hair: "#2a2b2f", top: "#5b6470" },
  { bg: "#e6dfd2", skin: "#b79f86", hair: "#6a5a49", top: "#2f3236" },
  { bg: "#d5d9d2", skin: "#e0d0be", hair: "#8d7f66", top: "#7a8089" },
  { bg: "#d9d5df", skin: "#a88d76", hair: "#1f2023", top: "#4a443c" },
  { bg: "#e2ddd3", skin: "#ddc8b2", hair: "#b9ab92", top: "#575b62" },
];

/** A drawn portrait: shoulders, neck, head and hair in a muted palette. */
const portrait = (seed: number) => {
  const p = PALETTES[seed % PALETTES.length]!;
  const long = seed % 3 === 1;
  const hair = long
    ? `<path d='M29 46c-3-21 6-33 19-33s22 12 19 33c0 13 2 22 4 28H25c2-6 4-15 4-28z' fill='${p.hair}'/>`
    : `<path d='M32 41c-2-17 6-26 16-26s18 9 16 26c-5-7-10-10-16-10s-11 3-16 10z' fill='${p.hair}'/>`;
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${p.bg}'/>${long ? hair : ""}<path d='M6 96c3-22 20-32 42-32s39 10 42 32z' fill='${p.top}'/><rect x='41' y='50' width='14' height='18' rx='6' fill='${p.skin}'/><ellipse cx='48' cy='40' rx='15' ry='17' fill='${p.skin}'/>${long ? "" : hair}</svg>`,
    )
  );
};

/** A person; `seed` draws a portrait, `since` and `href` are optional. */
const person = (name: string, role: string, location: string, extra: { since?: number; seed?: number; href?: string } = {}): TeamPerson => ({
  name,
  role,
  location,
  since: extra.since,
  photo: extra.seed === undefined ? undefined : portrait(extra.seed),
  href: extra.href,
});

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <TeamByDepartment
        eyebrow="The team"
        title="Thirty-four people, one kitchen table"
        description="Everyone who works at Northwind, by department. Names with a link have a page of their own."
        departments={[
          {
            id: "leadership",
            name: "Leadership",
            people: [
              person("Marit Bosch", "CEO, co-founder", "Utrecht", { since: 2014, seed: 0, href: "#marit" }),
              person("Daan Verhoeven", "CTO, co-founder", "Utrecht", { since: 2014, seed: 4, href: "#daan" }),
              person("Ines Carvalho", "COO", "Lisbon", { since: 2018, seed: 1, href: "#ines" }),
              person("Jelle Smit", "CFO", "Utrecht", { since: 2020, href: "#jelle" }),
            ],
          },
          {
            id: "engineering",
            name: "Engineering",
            people: [
              person("Mees Jansen", "Staff engineer", "Utrecht", { since: 2019, seed: 2 }),
              person("Sofia Marín", "Engineering manager", "Remote, Spain", { seed: 1 }),
              person("Lars Eriksen", "Senior backend engineer", "Rotterdam"),
              person("Noor Haddad", "Senior frontend engineer", "Amsterdam", { seed: 3 }),
              person("Pieter van Dijk", "Backend engineer", "Utrecht"),
              person("Chloé Martin", "Mobile engineer", "Remote, France", { seed: 5 }),
              person("Tomás Ribeiro", "Platform engineer", "Lisbon"),
              person("Hana Kowalski", "Data engineer", "Remote, Poland"),
              person("Eline Bakker", "Quality engineer", "Utrecht", { seed: 1 }),
              person("Gijs Hoekstra", "Site reliability engineer", "Rotterdam"),
              person("Yara Fontaine", "Frontend engineer", "Remote, Belgium"),
              person("Ravi Menon", "Backend engineer", "Amsterdam", { seed: 0 }),
            ],
          },
          {
            id: "design",
            name: "Design",
            people: [
              person("Femke Bos", "Head of design", "Utrecht", { since: 2017, seed: 1, href: "#femke" }),
              person("Tobias Lindqvist", "Senior product designer", "Remote, Sweden", { seed: 2 }),
              person("Amira Yilmaz", "Product designer", "Amsterdam", { seed: 4 }),
              person("Sem de Boer", "Brand designer", "Utrecht"),
              person("Lotte Visser", "Design researcher", "Rotterdam"),
            ],
          },
          {
            id: "customer-success",
            name: "Customer success",
            people: [
              person("Anouk de Wit", "Head of customer success", "Utrecht", { seed: 5, href: "#anouk" }),
              person("Mateo Rossi", "Customer success manager", "Lisbon"),
              person("Fleur Jacobs", "Support specialist", "Utrecht", { seed: 3 }),
              person("Omar Siddiqui", "Support specialist", "Amsterdam"),
              person("Britt van Leeuwen", "Onboarding specialist", "Utrecht", { seed: 1 }),
              person("Jonas Meier", "Support specialist", "Remote, Germany"),
              person("Saskia Peters", "Customer success manager", "Rotterdam"),
              person("Kasper Dekker", "Support specialist", "Utrecht"),
            ],
          },
          {
            id: "operations",
            name: "Operations",
            people: [
              person("Wilma Hartman", "Head of operations", "Utrecht", { seed: 0, href: "#wilma" }),
              person("Bram Oosterhuis", "Finance manager", "Utrecht"),
              person("Iris Mulder", "People partner", "Amsterdam", { seed: 4 }),
              person("Koen Brouwer", "Office and events", "Utrecht"),
              person("Zoë Adriaanse", "Legal counsel", "Remote, Belgium"),
            ],
          },
        ]}
      />
    </div>
  );
}
