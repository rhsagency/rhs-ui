import { LeadershipBios } from "@rhs-ui/marketing/leadership-bios";

/** A flat, faceless bust in a muted palette: a stand-in for a portrait photograph. */
function portrait(p: { bg: string; disc: string; skin: string; shade: string; hair: string; shirt: string; style: "bob" | "short"; glasses?: boolean; beard?: boolean }): string {
  const bob = `
    <path d="M212 374C196 232 258 194 320 194C382 194 444 232 428 374L442 490C442 524 412 534 394 528L246 528C228 534 198 524 198 490Z" fill="${p.hair}"/>`;
  const short = `
    <path d="M222 338C214 238 266 206 320 206C374 206 426 238 418 338C404 292 372 268 320 268C268 268 236 292 222 338Z" fill="${p.hair}"/>`;
  const fringe = `<path d="M224 330C228 254 278 228 320 228C366 228 414 254 418 330C384 296 336 286 292 294C262 300 240 312 224 330Z" fill="${p.hair}"/>`;
  const beard = `<path d="M226 372C230 470 280 510 320 510C360 510 410 470 414 372C400 418 372 438 320 438C268 438 240 418 226 372Z" fill="${p.hair}"/><path d="M298 434Q320 448 342 434" fill="none" stroke="${p.skin}" stroke-width="7" stroke-linecap="round" opacity=".9"/>`;
  const glasses = `<g fill="none" stroke="${p.hair}" stroke-width="6"><rect x="254" y="346" width="54" height="42" rx="15"/><rect x="332" y="346" width="54" height="42" rx="15"/><path d="M308 364H332"/></g>`;
  const features = `<g fill="${p.hair}"><circle cx="282" cy="368" r="5.5"/><circle cx="358" cy="368" r="5.5"/></g><path d="M262 340Q282 330 302 340M338 340Q358 330 378 340" fill="none" stroke="${p.hair}" stroke-width="7" stroke-linecap="round"/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 800'>
    <rect width='640' height='800' fill='${p.bg}'/>
    <circle cx='320' cy='392' r='262' fill='${p.disc}'/>
    ${p.style === "bob" ? bob : ""}
    <path d='M274 470H366V596C366 626 274 626 274 596Z' fill='${p.shade}'/>
    <ellipse cx='224' cy='376' rx='15' ry='26' fill='${p.skin}'/><ellipse cx='416' cy='376' rx='15' ry='26' fill='${p.skin}'/>
    <path d='M52 800C52 650 158 586 320 576C482 586 588 650 588 800Z' fill='${p.shirt}'/>
    <path d='M252 586L320 672L388 586Z' fill='${p.shade}'/>
    <ellipse cx='320' cy='364' rx='96' ry='120' fill='${p.skin}'/>
    <path d='M320 244C382 244 416 304 416 364C416 446 372 484 320 484Z' fill='#000' opacity='.07'/>
    ${features}
    ${p.style === "short" ? short : fringe}
    ${p.beard ? beard : ""}
    ${p.glasses ? glasses : ""}
  </svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg.replace(/\s+/g, " "));
}

const anouk = portrait({ bg: "#d8d4cc", disc: "#c9c4ba", skin: "#e4c4a6", shade: "#d3ae8d", hair: "#3b2f29", shirt: "#2c2e33", style: "bob", glasses: true });
const ravi = portrait({ bg: "#cfd3d7", disc: "#bfc4c9", skin: "#b88a67", shade: "#a47753", hair: "#1f1c1b", shirt: "#6b7078", style: "short", beard: true });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <LeadershipBios
        alternate
        headingLevel={3}
        members={[
          {
            name: "Anouk de Wit",
            role: "Co-founder and chief executive",
            photo: anouk,
            bio: "Anouk started Northwind in 2016 after eight years of designing logistics software for other people's warehouses. She sets the direction of the company and still reads every product brief before it goes to a team. Before Northwind she led design at Halcyon, where she rebuilt a freight-booking tool used in forty countries. She hires people who care more about the dock worker than the dashboard, and she lives in Utrecht, where she cycles to the office most days.",
            previously: "Head of design at Halcyon. Product designer at Polder Freight.",
            links: [
              { label: "LinkedIn", href: "https://example.com/in/anouk-de-wit", external: true },
              { label: "Talks and interviews", href: "#talks" },
              { label: "Email Anouk", href: "mailto:anouk@northwind.example" },
            ],
          },
          {
            name: "Ravi Menon",
            role: "Co-founder and chief technology officer",
            photo: ravi,
            bio: "Ravi leads engineering and owns the platform that moves forty million parcels a year through Northwind. He joined as the first engineer, wrote the routing engine that still sits at the core of the product, and has since built a team of thirty across Amsterdam and Chennai. Earlier he spent six years at Kestrel Systems, working on crew scheduling for airlines. Outside work he maintains an open-source timetable parser and coaches a junior robotics team on Saturday mornings.",
            previously: "Principal engineer at Kestrel Systems. Software engineer at Lumen Rail.",
            links: [
              { label: "GitHub", href: "https://example.com/ravimenon", external: true },
              { label: "Engineering blog", href: "#engineering" },
            ],
          },
          {
            name: "Femke Bos",
            role: "Chief financial officer",
            bio: "Femke joined in 2021 to take Northwind from its first profitable year to its first audited one. She runs finance, legal and people operations, and she wrote the pricing model that customers call the only one they could explain to their own board. Before Northwind she was finance director at Delta Quay Terminals in Rotterdam, and she began her career in audit. She chairs the supervisory board of a local housing cooperative and writes a short monthly note on what the numbers actually say.",
            previously: "Finance director at Delta Quay Terminals. Senior auditor at Brink and Partners.",
            links: [{ label: "The monthly note", href: "#notes" }],
          },
        ]}
      />
    </div>
  );
}
