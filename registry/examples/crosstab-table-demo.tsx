import type { ReactNode } from "react";

import { CrosstabTable, type CrosstabAxisItem } from "@rhs-ui/dashboard/crosstab-table";

const regions: CrosstabAxisItem[] = [
  { id: "nl", label: "Netherlands" },
  { id: "de", label: "Germany" },
  { id: "fr", label: "France" },
  { id: "es", label: "Spain" },
  { id: "nordics", label: "Nordics" },
  { id: "uk", label: "United Kingdom" },
];
const quarters: CrosstabAxisItem[] = [
  { id: "q1", label: "Q1" },
  { id: "q2", label: "Q2" },
  { id: "q3", label: "Q3" },
  { id: "q4", label: "Q4" },
];
// Net revenue in thousands of euros, a region per row and a quarter per column.
const revenue = [
  [1184, 1246, 1302, 1498],
  [1096, 1204, 1287, 1433],
  [842, 903, 951, 1078],
  [516, 548, 604, 662],
  [438, 472, 531, 589],
  [764, 815, 790, 902],
];

const teams: CrosstabAxisItem[] = [
  { id: "billing", label: "Billing" },
  { id: "shipping", label: "Shipping" },
  { id: "accounts", label: "Accounts" },
  { id: "technical", label: "Technical" },
  { id: "partnerships", label: "Partnerships" },
];
const statuses: CrosstabAxisItem[] = [
  { id: "open", label: "Open" },
  { id: "pending", label: "Pending" },
  { id: "solved", label: "Solved" },
  { id: "closed", label: "Closed" },
];
const tickets: Record<string, Record<string, number>> = {
  billing: { open: 14, pending: 6, solved: 48, closed: 91 },
  shipping: { open: 22, pending: 9, solved: 63, closed: 120 },
  accounts: { open: 5, pending: 3, solved: 27, closed: 44 },
  technical: { open: 17, pending: 12, solved: 31, closed: 58 },
  partnerships: { open: 2, pending: 1, solved: 12, closed: 19 },
};

const people: CrosstabAxisItem[] = [
  { id: "anna", label: "Anna de Vries" },
  { id: "mo", label: "Mo Haddad" },
  { id: "priya", label: "Priya Nair" },
  { id: "tom", label: "Tom Jansen" },
];
const weeks: CrosstabAxisItem[] = [
  { id: "w41", label: "Week 41" },
  { id: "w42", label: "Week 42" },
  { id: "w43", label: "Week 43" },
  { id: "w44", label: "Week 44" },
];
// Hours booked. Mo was away in week 43, so there is no value, which is not the same as zero.
const hours = [
  [38, 40, 36, 40],
  [32, 36, null, 40],
  [40, 42, 44, 38],
  [24, 28, 30, 32],
];

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-12 px-4 py-10 sm:px-6">
      <Section title="Net revenue by region" description="Thousands of euros in 2026. Stronger shading is higher; the number is always there.">
        <CrosstabTable
          caption="Net revenue by region and quarter, in thousands of euros"
          cornerLabel="Region"
          rows={regions}
          columns={quarters}
          values={revenue}
          totals="both"
          intensity
        />
      </Section>

      <div className="grid gap-12 lg:grid-cols-2">
        <Section title="Tickets by team" description="Where this month's tickets stand. Totals per team.">
          <CrosstabTable
            caption="Tickets by team and status"
            cornerLabel="Team"
            rows={teams}
            columns={statuses}
            values={(team, status) => tickets[team.id]?.[status.id]}
            totals="row"
          />
        </Section>
        <Section title="Hours by person" description="A dash is a week with no booking, not zero hours.">
          <CrosstabTable
            caption="Hours booked by person and week"
            cornerLabel="Person"
            rows={people}
            columns={weeks}
            values={hours}
            totals="column"
            format={{ style: "unit", unit: "hour", unitDisplay: "narrow" }}
          />
        </Section>
      </div>
    </div>
  );
}
