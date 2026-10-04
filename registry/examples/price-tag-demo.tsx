import { PriceTag } from "@rhs-ui/commerce/price-tag";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-xl flex-wrap items-end justify-center gap-10 p-10">
      <PriceTag size="sm" price={{ amount: 1295, currency: "EUR" }} />
      <PriceTag price={{ amount: 3900, currency: "EUR" }} compareAt={{ amount: 5200, currency: "EUR" }} />
      <PriceTag size="lg" price={{ amount: 1900, currency: "EUR" }} unit="per month" />
    </div>
  );
}
