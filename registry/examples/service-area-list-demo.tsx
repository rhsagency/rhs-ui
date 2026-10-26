import { ServiceAreaList } from "@rhs-ui/marketing/service-area-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">Alphabetical, with a radius note: two towns have no page yet and stay plain text</p>
      <ServiceAreaList
        title="Where we work"
        description="Kestrel Roofing covers the middle of the Netherlands. Every town with a link has its own page, with recent jobs and what a roof costs there."
        radius={{ label: "Within 40 km", from: "Amersfoort" }}
        contactHref="#contact"
        regions={[
          {
            name: "Utrecht",
            places: [
              { name: "Zeist", href: "#zeist" },
              { name: "Amersfoort", href: "#amersfoort" },
              { name: "Soest", href: "#soest" },
              { name: "Baarn", href: "#baarn" },
              { name: "De Bilt", href: "#de-bilt" },
              { name: "Houten", href: "#houten" },
              { name: "Leusden", href: "#leusden" },
              { name: "Nieuwegein", href: "#nieuwegein" },
              { name: "Veenendaal", href: "#veenendaal" },
              { name: "Woudenberg" },
              { name: "Bunnik", href: "#bunnik" },
              { name: "Rhenen", href: "#rhenen" },
            ],
          },
          {
            name: "Gelderland",
            places: [
              { name: "Barneveld", href: "#barneveld" },
              { name: "Ede", href: "#ede" },
              { name: "Ermelo", href: "#ermelo" },
              { name: "Harderwijk", href: "#harderwijk" },
              { name: "Nijkerk", href: "#nijkerk" },
              { name: "Putten", href: "#putten" },
              { name: "Scherpenzeel" },
              { name: "Wageningen", href: "#wageningen" },
            ],
          },
          {
            name: "Noord-Holland",
            places: [
              { name: "Bussum", href: "#bussum" },
              { name: "Hilversum", href: "#hilversum" },
              { name: "Huizen", href: "#huizen" },
              { name: "Laren", href: "#laren" },
              { name: "Naarden", href: "#naarden" },
              { name: "Blaricum", href: "#blaricum" },
            ],
          },
          {
            name: "Flevoland",
            places: [
              { name: "Almere", href: "#almere" },
              { name: "Zeewolde", href: "#zeewolde" },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">Largest place first: each place carries its population, and the radius line is left out</p>
      <ServiceAreaList
        title="Areas we cover"
        headingLevel={3}
        contactHref="#contact"
        labels={{ otherTitle: "Not on the list?", otherText: "Call before you book: we cover more postcodes than we have pages for.", contactLabel: "Check your postcode" }}
        regions={[
          {
            name: "Greater Manchester",
            places: [
              { name: "Stockport", href: "#stockport", priority: 294000 },
              { name: "Salford", href: "#salford", priority: 270000 },
              { name: "Manchester", href: "#manchester", priority: 568000 },
              { name: "Altrincham", href: "#altrincham", priority: 52000 },
              { name: "Sale", href: "#sale", priority: 56000 },
              { name: "Bolton", href: "#bolton", priority: 194000 },
              { name: "Didsbury", priority: 15000 },
              { name: "Bury", href: "#bury", priority: 78000 },
            ],
          },
          {
            name: "Cheshire",
            places: [
              { name: "Macclesfield", href: "#macclesfield", priority: 52000 },
              { name: "Wilmslow", href: "#wilmslow", priority: 36000 },
              { name: "Knutsford", href: "#knutsford", priority: 13000 },
              { name: "Crewe", href: "#crewe", priority: 75000 },
              { name: "Alderley Edge", priority: 5000 },
              { name: "Congleton", href: "#congleton", priority: 26000 },
            ],
          },
        ]}
      />
    </div>
  );
}
