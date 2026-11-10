import { NavbarFullscreenMenu } from "@rhs-ui/marketing/navbar-fullscreen-menu";

const LINKS = [
  { label: "Work", href: "#work", hint: "Selected projects, 2019 to now" },
  { label: "Studio", href: "#studio", hint: "Eleven people, one long table" },
  { label: "Journal", href: "#journal", hint: "Notes from the workshop" },
  { label: "Exhibitions", href: "#exhibitions", hint: "Venice, Oslo, Eindhoven" },
  { label: "Contact", href: "#contact", hint: "New commissions and press" },
];

const PROJECTS = [
  ["Fjord house", "Lofoten", "2025"],
  ["Library at Lillestrom", "Akershus", "2024"],
  ["Sauna pavilion", "Nesodden", "2023"],
  ["Studio for a ceramicist", "Bergen", "2022"],
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          At rest the bar is only the mark and a Menu button, on every screen. Press Menu: the pages arrive one after another in very large type, the current one carries a dot, and the second column has the address and the profiles. Escape or Close returns focus to the button.
        </figcaption>
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <NavbarFullscreenMenu
            sticky={false}
            brand={
              <a href="#top" className="rounded-sm text-base font-semibold tracking-[-0.03em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                Atelier Nord
              </a>
            }
            links={LINKS}
            currentHref="#work"
            contact={{
              address: ["Maridalsveien 17", "0178 Oslo, Norway"],
              email: "studio@ateliernord.example",
              phone: "+47 22 55 01 42",
              social: [
                { label: "Instagram", href: "https://example.com/ateliernord/instagram" },
                { label: "Vimeo", href: "https://example.com/ateliernord/film" },
                { label: "LinkedIn", href: "https://example.com/ateliernord/linkedin" },
              ],
            }}
          />
          <section className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-24">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Architecture and interiors, Oslo</p>
            <h2 className="mt-5 max-w-3xl text-5xl leading-[0.98] font-medium tracking-[-0.055em] text-balance sm:text-7xl">Houses that sit quietly in their landscape.</h2>
            <ul className="mt-16 divide-y divide-border border-y border-border">
              {PROJECTS.map(([name, place, year]) => (
                <li key={name} className="grid gap-1 py-5 sm:grid-cols-[1fr_1fr_auto] sm:gap-6">
                  <p className="text-lg font-medium tracking-[-0.02em]">{name}</p>
                  <p className="text-muted-foreground">{place}</p>
                  <p className="text-sm text-muted-foreground tabular-nums">{year}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </figure>
    </div>
  );
}
