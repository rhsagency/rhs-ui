"use client";

import { useState } from "react";

import { BillingDetailsSection, type BillingDetails } from "@rhs-ui/application/billing-details-section";

const INITIAL: BillingDetails = {
  company: "Northwind Trading B.V.",
  line1: "Keizersgracht 241",
  line2: "Floor 3",
  postalCode: "1016 EA",
  city: "Amsterdam",
  country: "NL",
  taxId: "NL859123456B01",
  emails: ["finance@northwind.example", "ap@northwind.example"],
  reference: "PO-2291",
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  const [details, setDetails] = useState(INITIAL);
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <p className="mb-4 text-xs text-muted-foreground">In this preview a Dutch VAT number is valid when it ends in B01, and any other number of the right shape cannot be verified.</p>
      <BillingDetailsSection
        value={details}
        // The lookup here is a stand-in, as the note above says: a Dutch number ending in B01 is "valid", every other number cannot be verified.
        onValidateTaxId={async (country, id) => {
          await wait(250);
          return country === "NL" && id.endsWith("B01");
        }}
        onSave={async (next) => {
          await wait(800);
          setDetails(next);
        }}
      />
    </div>
  );
}
