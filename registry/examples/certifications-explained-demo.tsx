import type { ReactNode } from "react";

import { CertificationsExplained } from "@rhs-ui/marketing/certifications-explained";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A seal drawn for the demo: two rings and a leaf. A real one would be your label's own artwork. */
const LeafSeal = (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" />
    <circle cx="24" cy="24" r="19" strokeOpacity="0.35" />
    <path d="M16 31c0-9 6-15 17-15 0 10-6 16-15 16" />
    <path d="M16 33l10-10" />
  </svg>
);

const ShieldSeal = (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="24" cy="24" r="22.5" />
    <circle cx="24" cy="24" r="19" strokeOpacity="0.35" />
    <path d="M24 13l8 3v7c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-7l8-3z" />
    <path d="M20.5 23.5l2.5 2.5 4.5-5" />
  </svg>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Six labels on an oat pack, each in plain words with the issuer, a registration number and a link to check it. Two carry their own seal and four get a typographic one drawn from the name">
        <CertificationsExplained
          eyebrow="Our labels"
          title="What the labels on our packs mean"
          description="A row of badges tells you very little. Here is what each one promises, who stands behind it and where you can check it yourself."
          footnote={
            <>
              Every certificate is audited once a year, and the audit report is public. If a link above does not open the registry, write to{" "}
              <a href="mailto:quality@northwind-oats.example" className="font-medium whitespace-nowrap text-foreground underline decoration-foreground/40 underline-offset-4">
                quality@northwind-oats.example
              </a>{" "}
              and we will send you the certificate.
            </>
          }
          certifications={[
            {
              id: "eu-organic",
              name: "EU Organic",
              issuer: "European Commission",
              meaning: "At least 95% of the farmed ingredients are organic: grown without synthetic pesticides, artificial fertilisers or GMOs.",
              number: "NL-BIO-01.2349",
              since: "2019",
              verifyHref: "#verify-eu-organic",
              mark: LeafSeal,
            },
            {
              id: "fairtrade",
              name: "Fairtrade",
              issuer: "Fairtrade International",
              meaning: "Farmers were paid a guaranteed minimum price, plus an extra premium that their community chooses how to spend.",
              number: "FLO ID 41823",
              since: "2021-04-12",
              verifyHref: "#verify-fairtrade",
            },
            {
              id: "b-corp",
              name: "B Corp Certified",
              issuer: "B Lab",
              meaning: "Audited on how we treat people and the planet, and legally bound to weigh both in every big decision.",
              number: "105-448",
              since: "2022-09-30",
              verifyHref: "#verify-b-corp",
            },
            {
              id: "rainforest",
              name: "Rainforest Alliance",
              issuer: "Rainforest Alliance",
              meaning: "The cocoa and hazelnuts come from farms audited for forest protection, fair work and safe pay.",
              number: "RA-2231-0047",
              since: "2020",
              verifyHref: "#verify-rainforest",
            },
            {
              id: "demeter",
              name: "Demeter",
              issuer: "Demeter International",
              meaning: "Grown on biodynamic farms: no synthetic inputs, a diverse landscape and compost made on the land itself.",
              number: "DE-DEM-0912",
              since: "2018",
              verifyHref: "#verify-demeter",
            },
            {
              id: "vegan",
              name: "Vegan Trademark",
              issuer: "The Vegan Society",
              meaning: "No animal products and no animal testing at any step: not in the ingredients, the processing or the packaging.",
              number: "VS-77421",
              since: "2020-01-15",
              verifyHref: "#verify-vegan",
              mark: ShieldSeal,
            },
          ]}
        />
      </Example>

      <div className="mx-auto mt-20 max-w-md border-t border-border pt-12 sm:mt-24">
        <Example caption="Two labels in a narrow column and in British English: the facts stack, a label without a number or a registry link simply shows less, and the date follows the locale">
          <CertificationsExplained
            headingLevel={3}
            title="Our standards"
            locale="en-GB"
            certifications={[
              {
                id: "iso-9001",
                name: "ISO 9001",
                issuer: "Kiwa",
                meaning: "Our way of working is written down, checked every year by an outsider and improved when it is found wanting.",
                number: "NL-QMS-5521",
                since: "2023-06-01",
                verifyHref: "#verify-iso-9001",
              },
              {
                id: "local",
                name: "Regional Product",
                issuer: "Provincie Gelderland",
                meaning: "Grown, milled and packed within 100 kilometres of the mill.",
                since: "2017",
              },
            ]}
          />
        </Example>
      </div>
    </div>
  );
}
