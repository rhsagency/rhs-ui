import type { ReactNode } from "react";

import { RegionList, type Region } from "@rhs-ui/marketing/region-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const REGIONS: readonly Region[] = [
  { code: "ams1", city: "Amsterdam", country: "Netherlands", continent: "Europe", status: "available", latencyMs: 2, tags: ["EU only", "GDPR", "SOC 2"] },
  { code: "fra1", city: "Frankfurt", country: "Germany", continent: "Europe", status: "available", latencyMs: 8, tags: ["EU only", "GDPR", "SOC 2"] },
  { code: "lhr1", city: "London", country: "United Kingdom", continent: "Europe", status: "available", latencyMs: 9, tags: ["GDPR", "SOC 2"] },
  { code: "arn1", city: "Stockholm", country: "Sweden", continent: "Europe", status: "beta", latencyMs: 24, tags: ["EU only", "GDPR"] },
  { code: "mxp1", city: "Milan", country: "Italy", continent: "Europe", status: "planned", tags: ["EU only", "GDPR"] },
  { code: "iad1", city: "Ashburn", country: "United States", continent: "North America", status: "available", latencyMs: 78, tags: ["SOC 2", "HIPAA"] },
  { code: "yyz1", city: "Toronto", country: "Canada", continent: "North America", status: "beta", latencyMs: 88, tags: ["SOC 2"] },
  { code: "bom1", city: "Mumbai", country: "India", continent: "Asia Pacific", status: "available", latencyMs: 131, tags: ["SOC 2"] },
  { code: "nrt1", city: "Tokyo", country: "Japan", continent: "Asia Pacific", status: "available", latencyMs: 228, tags: ["SOC 2"] },
  { code: "syd1", city: "Sydney", country: "Australia", continent: "Asia Pacific", status: "planned", tags: ["SOC 2"] },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Ten regions by continent, filtered by compliance tag. Choosing a chip narrows the table and says how many regions are left. Two regions are planned: they have no latency and say so">
        <RegionList
          eyebrow="Data residency"
          title="Choose where your data lives"
          description="Every region is its own set of data centres. Your data stays in the region you pick unless you move it yourself."
          regions={REGIONS}
          latencyFrom="Amsterdam"
          selectHref="#region-{code}"
          footnote="Latency is the median round trip from Amsterdam over the last 30 days. Yours will differ with your own network."
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="The same list in a narrow column, starting on EU only: each region is a card under its continent, and the tag you filter by is marked in every card">
          <RegionList
            headingLevel={3}
            title="Where your shop's data lives"
            regions={REGIONS.filter((region) => ["ams1", "fra1", "lhr1", "mxp1"].includes(region.code))}
            latencyFrom="Amsterdam"
            defaultTag="EU only"
          />
        </Example>
      </div>
    </div>
  );
}
