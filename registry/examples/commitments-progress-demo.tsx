import type { ReactNode } from "react";

import { CommitmentsProgress } from "@rhs-ui/marketing/commitments-progress";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Eight commitments under three headings, pinned to 28 October so the age of the report is stable. Every status is a word with an icon, a missed goal stays on the page with its reason, and the date of the last update is always there">
        <CommitmentsProgress
          title="Our commitments, and where they stand"
          description="Eight public goals, checked every quarter by our sustainability team and once a year by an outside auditor. What we promised, how far we are, and when we said we would be done."
          updatedAt="2026-10-14"
          reportHref="#report-2026"
          now="2026-10-28T12:00:00Z"
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          groups={[
            {
              label: "Climate",
              items: [
                {
                  id: "packaging",
                  title: "100% recycled packaging by 2028",
                  current: 62,
                  target: 100,
                  unit: "%",
                  deadline: "2028",
                  status: "on-track",
                  note: "Share of parcels shipped in recycled or reusable packaging, measured every quarter.",
                },
                {
                  id: "emissions",
                  title: "Cut emissions from our own sites by 50% by 2030",
                  current: 31,
                  target: 50,
                  unit: "%",
                  deadline: "2030",
                  status: "on-track",
                  note: "Scope 1 and 2, against our 2019 baseline. Verified by an outside auditor.",
                },
                {
                  id: "landfill",
                  title: "Zero landfill from our own packaging by 2025",
                  current: 91,
                  target: 100,
                  unit: "%",
                  deadline: "2025-12-31",
                  status: "missed",
                  note: "We reached 91%. The last tonnes are laminated film no local recycler accepts yet. New target: 2027.",
                },
              ],
            },
            {
              label: "People",
              items: [
                {
                  id: "leadership",
                  title: "50% women in leadership by 2027",
                  current: 44,
                  target: 50,
                  unit: "%",
                  deadline: "2027-12",
                  status: "at-risk",
                  note: "Leadership means our top 60 roles. Two senior hires are open and both shortlists are balanced.",
                },
                {
                  id: "living-wage",
                  title: "A living wage in every country we hire in",
                  current: 9,
                  target: 11,
                  unit: "countries",
                  deadline: "2026-12-31",
                  status: "on-track",
                  note: "Measured against the Anker benchmark for each country.",
                },
                {
                  id: "safety",
                  title: "Safety training for every employee",
                  current: 100,
                  target: 100,
                  unit: "%",
                  deadline: "2025-06",
                  status: "done",
                  note: "Completed in June 2025 and repeated every two years.",
                },
              ],
            },
            {
              label: "Supply chain",
              items: [
                {
                  id: "cotton",
                  title: "Trace the origin of all our cotton by 2027",
                  current: 78,
                  target: 100,
                  unit: "%",
                  deadline: "2027",
                  status: "on-track",
                  note: "Traced to the farm, not only the mill, with a batch record for every order.",
                },
                {
                  id: "audits",
                  title: "Audit every tier-one factory each year",
                  current: 41,
                  target: 52,
                  unit: "factories",
                  deadline: "2026-12-31",
                  status: "at-risk",
                  note: "Eleven audits remain and six are booked. Five need a new date before the year ends.",
                },
              ],
            },
          ]}
        />
      </Example>

      <div className="mt-20 max-w-lg border-t border-border pt-12 sm:mt-24">
        <Example caption="A short report in a narrow column, last updated almost ten months ago: the rows stack, and the section says in words that the figures are old">
          <CommitmentsProgress
            headingLevel={3}
            title="Kestrel Studio, our promises"
            updatedAt="2026-01-09"
            now="2026-10-28T12:00:00Z"
            locale="en-GB"
            timeZone="Europe/Amsterdam"
            groups={[
              {
                label: "Our people",
                items: [
                  {
                    id: "payment",
                    title: "Every contractor paid within 14 days",
                    current: 97,
                    target: 100,
                    unit: "%",
                    deadline: "2026-12-31",
                    status: "on-track",
                    note: "Share of invoices paid on time over the last twelve months.",
                  },
                  {
                    id: "four-day",
                    title: "A four-day week for every team",
                    current: 5,
                    target: 8,
                    unit: "teams",
                    deadline: "2027-03",
                    status: "at-risk",
                    note: "Design and support are still on five days.",
                  },
                ],
              },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
