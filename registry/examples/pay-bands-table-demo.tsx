import { PayBandsTable } from "@rhs-ui/marketing/pay-bands-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PayBandsTable
        title="Pay bands"
        description="Every role at Northwind has a published range. Pick the zone where you would work to see the figures that apply."
        currency="EUR"
        updated="2026-10-01"
        zones={[
          { id: "zone-1", label: "Zone 1", description: "Amsterdam, London, Zurich and New York" },
          { id: "zone-2", label: "Zone 2", description: "Berlin, Lisbon, Warsaw and remote in the rest of Europe" },
        ]}
        families={[
          {
            name: "Engineering",
            levels: [
              { name: "Engineer I", bands: { "zone-1": { low: 58000, high: 74000 }, "zone-2": { low: 50000, high: 64000 } } },
              { name: "Engineer II", bands: { "zone-1": { low: 72000, high: 92000 }, "zone-2": { low: 62000, high: 80000 } } },
              { name: "Senior engineer", bands: { "zone-1": { low: 90000, high: 118000 }, "zone-2": { low: 78000, high: 102000 } } },
              { name: "Staff engineer", bands: { "zone-1": { low: 114000, high: 146000 }, "zone-2": { low: 98000, high: 126000 } } },
            ],
          },
          {
            name: "Product design",
            levels: [
              { name: "Designer", bands: { "zone-1": { low: 56000, high: 72000 }, "zone-2": { low: 48000, high: 62000 } } },
              { name: "Senior designer", bands: { "zone-1": { low: 76000, high: 98000 }, "zone-2": { low: 65000, high: 84000 } } },
              { name: "Principal designer", bands: { "zone-1": { low: 100000, high: 128000 } } },
            ],
          },
          {
            name: "Customer success",
            levels: [
              { name: "Specialist", bands: { "zone-1": { low: 42000, high: 54000 }, "zone-2": { low: 36000, high: 47000 } } },
              { name: "Senior specialist", bands: { "zone-1": { low: 54000, high: 70000 }, "zone-2": { low: 47000, high: 60000 } } },
              { name: "Team lead", bands: { "zone-1": { low: 68000, high: 88000 }, "zone-2": { low: 58000, high: 76000 } } },
            ],
          },
        ]}
        notes={[
          { label: "Bonus", value: "None outside sales. Sales roles carry a variable target of 20 to 30 percent on top of the base." },
          { label: "Equity", value: "Every employee receives options when they join, and again every two years." },
          { label: "Review cycle", value: "Pay is reviewed once a year, in March, for everyone at once." },
        ]}
        methodology={
          <>
            <p>
              We set a band for each level from what comparable companies of our size pay for the same work, using two independent salary surveys that we renew every year. Where a person starts in the band depends on their experience and how
              the interviews went, never on what they earned before or how hard they negotiated.
            </p>
            <p className="mt-3">Everyone at the same level in the same zone is paid inside the same band. Each autumn we compare pay between groups, close any gap we find and publish what we changed.</p>
          </>
        }
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">One zone, US dollars and no extras: the switch is left out and the table stays the same</p>
      <PayBandsTable
        headingLevel={3}
        currency="USD"
        zones={[{ id: "us", label: "United States", description: "All US locations, adjusted for nothing but level" }]}
        families={[
          {
            name: "Operations",
            levels: [
              { name: "Coordinator", bands: { us: { low: 46000, high: 58000 } } },
              { name: "Manager", bands: { us: { low: 70000, high: 92000 } } },
              { name: "Director", bands: { us: { low: 104000, high: 136000 } } },
            ],
          },
        ]}
      />
    </div>
  );
}
