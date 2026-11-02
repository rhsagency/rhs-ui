import { IndustryIndex } from "@rhs-ui/marketing/industry-index";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Twenty-four industries in four sectors; type &ldquo;care&rdquo; or &ldquo;zoo&rdquo; to narrow the index and see the empty state</p>
      <IndustryIndex
        filterable
        eyebrow="Industries"
        title="Built for the way your industry works"
        description="Kestrel is used by more than four thousand teams in twenty-four industries. Find yours to see the setup, the integrations and the customers like you."
        contact={{ label: "Tell us about yours", href: "#contact" }}
        sectors={[
          {
            label: "Commerce",
            industries: [
              { name: "Fashion and apparel", href: "#fashion", customers: 214 },
              { name: "Retail and e-commerce", href: "#retail", customers: 1240, featured: true },
              { name: "Food and beverage", href: "#food", customers: 312 },
              { name: "Home and garden", href: "#home", customers: 96 },
              { name: "Marketplaces", href: "#marketplaces", customers: 74 },
              { name: "Travel and hospitality", href: "#travel", customers: 188 },
            ],
          },
          {
            label: "Health",
            industries: [
              { name: "Clinics and practices", href: "#clinics", customers: 402, featured: true },
              { name: "Dental care", href: "#dental", customers: 156 },
              { name: "Pharmacies", href: "#pharmacies", customers: 87 },
              { name: "Mental health", href: "#mental-health", customers: 63 },
              { name: "Veterinary care", href: "#veterinary", customers: 71 },
              { name: "Senior care", href: "#senior-care", customers: 49 },
            ],
          },
          {
            label: "Public",
            industries: [
              { name: "Local government", href: "#government", customers: 118, featured: true },
              { name: "Schools and education", href: "#education", customers: 203 },
              { name: "Nonprofits and charities", href: "#nonprofits", customers: 265 },
              { name: "Libraries and museums", href: "#culture", customers: 44 },
              { name: "Housing associations", href: "#housing", customers: 38 },
              { name: "Public transport", href: "#transport-public", customers: 21 },
            ],
          },
          {
            label: "Industry",
            industries: [
              { name: "Manufacturing", href: "#manufacturing", customers: 331, featured: true },
              { name: "Logistics and transport", href: "#logistics", customers: 276 },
              { name: "Construction", href: "#construction", customers: 129 },
              { name: "Energy and utilities", href: "#energy", customers: 58 },
              { name: "Agriculture", href: "#agriculture", customers: 41 },
              { name: "Automotive", href: "#automotive", customers: 92 },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">Without search or counts, in a narrow column: the lists fall back to a single column</p>
      <div className="max-w-md">
        <IndustryIndex
          headingLevel={3}
          title="Who it is for"
          sectors={[
            {
              label: "Services",
              industries: [
                { name: "Agencies and studios", href: "#agencies" },
                { name: "Accountants and bookkeepers", href: "#accountants" },
                { name: "Architects and engineers", href: "#architects" },
              ],
            },
            {
              label: "Trades",
              industries: [
                { name: "Electricians and plumbers", href: "#trades" },
                { name: "Landscapers and gardeners", href: "#landscapers" },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}
