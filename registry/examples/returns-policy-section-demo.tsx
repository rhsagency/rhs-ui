import { ReturnsPolicySection } from "@rhs-ui/commerce/returns-policy-section";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl min-w-0 px-6">
      <ReturnsPolicySection
        startHref="#start-a-return"
        contact={{ label: "returns@northwind.example", href: "#contact", detail: "We answer within one working day, Monday to Friday." }}
        notice={{
          title: "Something wrong with your order?",
          body: (
            <>
              A faulty, damaged or wrong item does not wait for the clock. <a href="#report">Tell us what arrived</a> and we collect it free of charge.
            </>
          ),
        }}
        locale="en-GB"
      />

      <div className="border-t border-border pt-6">
        <p className="text-xs text-muted-foreground">Swapped and trimmed for another shop: a 14-day window and its own lists, with no facts, steps or refund table</p>
        <ReturnsPolicySection
          headingAs="h2"
          className="pb-6 sm:pb-4"
          windowDays={14}
          facts={[]}
          steps={[]}
          startHref="#start"
          locale="en-GB"
          eligible={["Furniture in its original, unassembled packaging", "Lighting and textiles that have not been used", "Samples returned within 7 days"]}
          excluded={["Items cut to size or made to measure", "Assembled or mounted furniture", "Anything with traces of use"]}
          refundTimes={[]}
          contact={{ label: "service@kestrel-living.example", href: "#service" }}
        />
      </div>
    </div>
  );
}
