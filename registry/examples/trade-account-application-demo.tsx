"use client";

import { useState, type ReactNode } from "react";

import { TradeAccountApplication, type TradeApplicationValues } from "@rhs-ui/commerce/trade-account-application";

const SENT: TradeApplicationValues = {
  companyName: "Fieldwork Kitchens B.V.",
  registrationNumber: "81234567",
  vatNumber: "NL862345678B01",
  country: "NL",
  contactName: "Sanne de Vries",
  jobTitle: "Purchasing manager",
  email: "sanne@fieldwork.example",
  phone: "+31 6 5555 0142",
  businessType: "restaurant",
  monthlySpend: "10000-25000",
  reference: typeof File === "undefined" ? null : new File(["supplier invoice"], "supplier-invoice-0921.pdf", { type: "application/pdf" }),
  acceptedTerms: true,
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Send it empty to see the list of problems, or use the VAT number NL000000000B00 to see a send that fails and keeps every answer.");
  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A dealer asks for a trade account: three groups of fields, then the promise of an answer" note={log}>
        <TradeAccountApplication
          termsHref="#trade-terms"
          shopHref="#shop"
          locale="en-GB"
          reviewDays={2}
          onSubmit={async (values) => {
            await wait(900);
            if (values.vatNumber === "NL000000000B00") return "We could not check that VAT number against the register. Check it and send again.";
            setLog(`onSubmit received ${values.companyName}, ${values.vatNumber}, ${values.businessType}, ${values.monthlySpend}`);
          }}
        />
      </Example>
      <div className="border-t border-border pt-12">
        <Example caption="After a send the form is replaced by the confirmation, which a page can also show on its own with the answers it saved">
          <TradeAccountApplication headingAs="h3" submitted={SENT} shopHref="#shop" locale="en-GB" reviewDays={2} />
        </Example>
      </div>
    </div>
  );
}
