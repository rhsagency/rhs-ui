import { WhichOneGuide } from "@rhs-ui/marketing/which-one-guide";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <p className="mb-8 text-xs text-muted-foreground">Five situations in the reader&rsquo;s own voice, each pointing to the plan that fits, with a fallback for the rest</p>
      <WhichOneGuide
        eyebrow="Plans"
        title="Which plan is yours?"
        description="Find the sentence that sounds like you. Every plan can be changed later, and none of them has a setup fee."
        rows={[
          {
            scenario: "I run a small shop and ship every day",
            recommendation: { name: "Starter", reason: "Flat-rate labels and a pickup schedule, with nothing to set up before your first parcel.", href: "#starter" },
          },
          {
            scenario: "I sell wholesale and invoice other businesses",
            recommendation: { name: "Business", reason: "Net terms, price lists per customer and invoices that chase themselves when they are late.", href: "#business" },
          },
          {
            scenario: "I sell to customers in more than one country",
            recommendation: { name: "Global", reason: "Duties and taxes at checkout in forty currencies, and local carriers instead of one expensive one.", href: "#global" },
          },
          {
            scenario: "I have a warehouse and a team packing orders",
            recommendation: { name: "Fulfilment", reason: "Pick lists, barcode scanning and stock counts per location, so nobody walks twice.", href: "#fulfilment" },
          },
          {
            scenario: "I only ship a few times a month and want to pay nothing in between",
            recommendation: { name: "Pay as you go", reason: "No monthly fee. You pay a small amount per parcel, and only for the parcels you send.", href: "#pay-as-you-go" },
          },
        ]}
        fallback={{ label: "Talk to us", href: "#contact" }}
      />

      <p className="mt-20 mb-8 text-xs text-muted-foreground">A column the width of a tablet: situation and answer side by side, with the arrow leading into the chip</p>
      <div className="max-w-3xl">
        <WhichOneGuide
          headingLevel={3}
          title="Which model should you start with?"
          rows={[
            {
              scenario: "I need answers in under a second, at scale",
              recommendation: { name: "Halcyon Swift", reason: "The fastest and cheapest of the three, and good enough for classification and short replies.", href: "#swift" },
            },
            {
              scenario: "I write long documents and want them to hold together",
              recommendation: { name: "Halcyon Prose", reason: "A longer memory and a steadier voice, for drafts that run to many pages.", href: "#prose" },
            },
            {
              scenario: "I am not sure yet and want to try one",
              recommendation: { name: "Halcyon Swift", reason: "Start here. You can move up in one line of code when you hit its limit.", href: "#swift-start" },
            },
          ]}
          fallback={{ text: "None of these sounds like you?", label: "Describe your case", href: "#describe" }}
        />
      </div>
    </div>
  );
}
