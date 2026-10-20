import { ImprintDetails } from "@rhs-ui/marketing/imprint-details";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <p className="mb-8 text-xs text-muted-foreground">A full imprint page</p>
      <ImprintDetails
        title="Imprint"
        description="The legal details of the company behind Northwind, as the law in the Netherlands and Germany expects to find them."
        locale="en-GB"
        updated="2026-03-12"
        entity={{
          legalName: "Northwind Software B.V.",
          legalForm: "Private limited company (besloten vennootschap)",
          address: ["Keizersgracht 120", "1015 CW Amsterdam", "The Netherlands"],
          register: { label: "KVK number", number: "81234567", name: "Chamber of Commerce, Amsterdam" },
          vatId: "NL862348975B01",
          managingDirector: ["Anouk de Wit", "Ravi Menon"],
          email: "legal@northwind.example",
          phone: "+31 20 555 0142",
          authority: { name: "Authority for Consumers and Markets", href: "https://example.com/authority" },
          disputes: {
            label: "Consumer complaints board",
            href: "https://example.com/complaints",
            note: "We are willing to take part in dispute resolution before this board.",
          },
        }}
        sections={[
          {
            title: "Editorial responsibility",
            items: [
              { term: "Responsible for content", value: "Anouk de Wit, at the address above" },
              { term: "Photography", value: "Studio Vale, Utrecht" },
            ],
          },
        ]}
      />

      <p className="mt-16 mb-8 border-t border-border pt-8 text-xs text-muted-foreground">Only what a small studio has: empty fields leave no dashes behind</p>
      <ImprintDetails
        headingLevel={3}
        entity={{
          legalName: "Studio Vale",
          address: "Oudegracht 48, 3511 AE Utrecht",
          email: "hello@studiovale.example",
        }}
      />
    </div>
  );
}
