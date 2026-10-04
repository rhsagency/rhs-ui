import { StockIndicator } from "@rhs-ui/commerce/stock-indicator";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-10">
      <StockIndicator stock={48} />
      <StockIndicator stock={3} />
      <StockIndicator stock={0} restock="on 22 April" />
    </div>
  );
}
