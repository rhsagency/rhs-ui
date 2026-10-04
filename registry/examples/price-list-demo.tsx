import { PriceList } from "@rhs-ui/marketing/price-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <PriceList
        title="Prices"
        description="Book online or call us. We confirm every appointment by text."
        footnote="All prices include 21% VAT. Students get 10% off on weekdays."
        groups={[
          { title: "Haircuts", items: [{ name: "Cut and style", detail: "45 min", price: "€38" }, { name: "Short cut", detail: "30 min", price: "€29" }, { name: "Children up to 12", detail: "20 min", price: "€19" }] },
          { title: "Colour", items: [{ name: "Full colour", detail: "90 min", price: "from €72", note: "Price depends on length." }, { name: "Highlights", detail: "120 min", price: "from €95" }, { name: "Toner", detail: "30 min", price: "€25" }] },
          { title: "Beard", items: [{ name: "Beard trim", detail: "20 min", price: "€18" }, { name: "Hot towel shave", detail: "40 min", price: "€32" }] },
          { title: "Extras", items: [{ name: "Wash and blow-dry", detail: "30 min", price: "€22" }, { name: "Treatment", detail: "15 min", price: "€12" }] },
        ]}
      />
    </div>
  );
}
