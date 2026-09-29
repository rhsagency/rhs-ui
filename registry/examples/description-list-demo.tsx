import { Badge } from "@rhs-ui/primitives/badge";
import { DescriptionList } from "@rhs-ui/primitives/description-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-xl gap-10">
      <DescriptionList
        items={[
          { term: "Order", value: <span className="font-mono">ORD-1048</span> },
          { term: "Status", value: <Badge variant="success">Shipped</Badge> },
          { term: "Placed", value: "28 September 2026" },
          { term: "Ship to", value: "Keizersgracht 12, Amsterdam" },
          { term: "Total", value: "€249.00" },
        ]}
      />
      <DescriptionList
        layout="grid"
        items={[
          { term: "Seats", value: "7 of 10" },
          { term: "Storage", value: "42 GB" },
          { term: "Renews", value: "Never" },
          { term: "Plan", value: "Team Pro" },
          { term: "Region", value: "EU West" },
          { term: "Support", value: "Priority" },
        ]}
      />
    </div>
  );
}
