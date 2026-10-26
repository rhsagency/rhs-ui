import { ShippingRatesTable, type ShippingZone } from "@rhs-ui/commerce/shipping-rates-table";

const EUROPE: readonly ShippingZone[] = [
  {
    region: "Netherlands",
    countries: ["Netherlands"],
    methods: [
      { name: "Standard", price: 495, days: [1, 2], freeFrom: 5000 },
      { name: "Pick-up point", price: 295, days: 2, freeFrom: 3500 },
      { name: "Express", price: 995, days: 1 },
    ],
  },
  {
    region: "Belgium and Luxembourg",
    countries: ["Belgium", "Luxembourg"],
    methods: [
      { name: "Standard", price: 695, days: [2, 3], freeFrom: 7500 },
      { name: "Express", price: 1295, days: [1, 2] },
    ],
  },
  {
    region: "Germany, France and Austria",
    countries: ["Germany", "France", "Austria"],
    methods: [
      { name: "Standard", price: 895, days: [3, 5], freeFrom: 10000 },
      { name: "Express", price: 1695, days: [2, 3] },
    ],
  },
  {
    region: "Rest of the EU",
    countries: ["Italy", "Spain", "Portugal", "Poland", "Sweden", "Denmark", "Ireland"],
    methods: [
      { name: "Standard", price: 1295, days: [4, 7], freeFrom: 15000 },
      { name: "Express", price: 2495, days: [2, 4] },
    ],
  },
  {
    region: "United Kingdom, Norway and Switzerland",
    countries: ["United Kingdom", "Norway", "Switzerland"],
    methods: [{ name: "Standard", price: 1995, days: [5, 8], freeFrom: 25000 }],
  },
];

const NORTH_AMERICA: readonly ShippingZone[] = [
  {
    region: "Continental US",
    methods: [
      { name: "Ground", price: 0, days: [3, 5] },
      { name: "Two-day", price: 1400, days: 2 },
      { name: "Overnight", price: 2800, days: 1 },
    ],
  },
  {
    region: "Alaska and Hawaii",
    methods: [
      { name: "Ground", price: 1200, days: [6, 9], freeFrom: 15000 },
      { name: "Two-day", price: 3200, days: 2 },
    ],
  },
  {
    region: "Canada",
    methods: [{ name: "Ground", price: 1800, days: [7, 12], freeFrom: 20000 }],
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-6">
      <ShippingRatesTable
        description="Prices include VAT. You see the final shipping cost in your basket before you pay."
        zones={EUROPE}
        highlight="Belgium"
        cutoff="Order before 15:00 for same-day dispatch"
        locale="en-GB"
        notes={[
          { title: "Customs and duties", body: "Orders to the United Kingdom, Norway and Switzerland arrive with import VAT and duties already paid, so there is nothing to settle at the door." },
          { title: "Public holidays", body: "We do not dispatch on Dutch public holidays. Orders placed over a holiday leave on the next working day, and in Christmas week deliveries can take two days longer." },
          { title: "Cut-off times", body: "Same-day dispatch counts working days in Amsterdam. Express orders placed before 17:00 also leave the same day." },
        ]}
      />

      <div className="border-t border-border">
        <p className="pt-8 text-xs text-muted-foreground">Rates by region only, in dollars: the picker lists the regions</p>
        <ShippingRatesTable zones={NORTH_AMERICA} currency="USD" locale="en-US" headingAs="h2" />
      </div>
    </div>
  );
}
