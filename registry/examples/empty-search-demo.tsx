"use client";

import { EmptySearch } from "@rhs-ui/primitives/empty-search";

export default function Demo(): React.JSX.Element {
  return (
    <div className="p-8">
      <EmptySearch
        query="invoce template"
        filters={["Templates", "Free only"]}
        onClearFilters={() => undefined}
        suggestions={[{ label: "invoice template", href: "#invoice-template" }, { label: "quote template", href: "#quote" }, { label: "receipt", href: "#receipt" }]}
        action={<>Still stuck? <a href="#support" className="font-medium underline underline-offset-4">Ask support</a>, we reply within a day.</>}
      />
    </div>
  );
}
