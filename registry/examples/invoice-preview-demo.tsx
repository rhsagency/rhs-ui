import { InvoicePreview } from "@rhs-ui/primitives/invoice-preview";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex justify-center p-8">
      <InvoicePreview
        number="INV-2026-0412"
        issued="1 April 2026"
        due="1 May 2026"
        from={["Fieldwork Studio B.V.", "Katendrecht 12", "3072 AN Rotterdam", "VAT NL001234567B01"]}
        to={["Northwind B.V.", "Attn. Sara Haddad", "Haarlemmerstraat 112", "1013 EW Amsterdam"]}
        lines={[
          { id: "1", description: "Brand identity, phase 2", quantity: 1, unitPrice: 480000, vat: 0.21 },
          { id: "2", description: "Design system workshop (hours)", quantity: 6, unitPrice: 12500, vat: 0.21 },
          { id: "3", description: "Printed style guide", quantity: 2, unitPrice: 4500, vat: 0.09 },
        ]}
        footer="Please pay within 30 days to NL91 ABNA 0417 1643 00, quoting INV-2026-0412. Thank you."
      />
    </div>
  );
}
