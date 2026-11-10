import { LineupHero, type LineupTier } from "@rhs-ui/marketing/lineup-hero";

const festival: LineupTier[] = [
  {
    label: "Headliners",
    names: [
      { name: "Aurelia Vance", role: "Live", href: "#aurelia-vance" },
      { name: "The Quiet Hours", role: "Live", href: "#the-quiet-hours" },
      { name: "Nadir Okoye", role: "DJ set", href: "#nadir-okoye" },
    ],
  },
  {
    label: "Featured",
    names: [
      { name: "Sol Marchetti", href: "#sol-marchetti" },
      { name: "Imke de Jong", href: "#imke-de-jong" },
      { name: "Paper Lanterns", href: "#paper-lanterns" },
      { name: "Tomás Rey Quartet", href: "#tomas-rey-quartet" },
      { name: "Halcyon Choir", href: "#halcyon-choir" },
      { name: "Mira Castellane", href: "#mira-castellane" },
      { name: "Okonkwo & Daughters", href: "#okonkwo-and-daughters" },
    ],
  },
  {
    label: "And more",
    names: [
      { name: "Ada Finch" },
      { name: "Bo Ling" },
      { name: "The Salt Road" },
      { name: "Kestrel" },
      { name: "Lumen Brass" },
      { name: "Piet de Vries" },
      { name: "Saskia Moen" },
      { name: "Northwind Strings" },
      { name: "Yusuf Demir" },
      { name: "Hana Ito" },
      { name: "Ola Brandt" },
      { name: "Wren" },
      { name: "Cobalt Sundays" },
      { name: "Marguerite and the Tide" },
    ],
  },
];

const conference: LineupTier[] = [
  {
    label: "Keynotes",
    names: [
      { name: "Dr. Amara Nwosu", role: "Opening", href: "#amara-nwosu" },
      { name: "Prof. Henrik Solberg-Whitaker", role: "Closing", href: "#henrik-solberg-whitaker" },
    ],
  },
  {
    label: "Speakers",
    names: [
      { name: "Lucía Ferrer", role: "Talk", href: "#lucia-ferrer" },
      { name: "Tomasz Wieczorek", role: "Talk", href: "#tomasz-wieczorek" },
      { name: "Priya Raghavan", role: "Workshop", href: "#priya-raghavan" },
      { name: "Elif Aksoy", role: "Talk", href: "#elif-aksoy" },
      { name: "Jonas Lindqvist", role: "Talk", href: "#jonas-lindqvist" },
      { name: "Ngozi Eze", role: "Workshop", href: "#ngozi-eze" },
    ],
  },
  {
    label: "Panels and workshops",
    names: [
      { name: "Open infrastructure" },
      { name: "Writing for the next decade" },
      { name: "Maintainers in conversation" },
      { name: "Accessible by default" },
      { name: "Small teams, big systems" },
    ],
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">A festival poster: the dates and the city as display type, the names sized by billing, no pictures. Names with an address are links.</p>
      <LineupHero
        className="py-8 sm:py-10 lg:py-12"
        title="Marlowe Festival"
        dates="12–14 June 2027"
        venue={{ city: "Bruges", name: "Minnewater Park, Belgium" }}
        tiers={festival}
        ticketsHref="#tickets"
        programmeHref="#programme"
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">A conference with the tier labels written on the page, roles after the names and a name too long for one line.</p>
      <LineupHero
        className="py-8 sm:py-10 lg:py-12"
        title="Signal Conference"
        dates="3–5 October 2027"
        venue={{ city: "Lisbon", name: "Centro de Congressos" }}
        tiers={conference}
        ticketsHref="#tickets"
        showTierLabels
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">The same poster in a 26rem column: the type scales with the column, not the screen.</p>
      <div className="max-w-[26rem] pb-10">
        <LineupHero className="py-8" title="Marlowe Festival 2027" dates="12–14 June 2027" venue="Bruges" tiers={festival.slice(0, 2)} ticketsHref="#tickets" />
      </div>
    </div>
  );
}
