"use client";

import { useState, type ReactNode } from "react";

import { WarrantyRegistration, type WarrantyProduct, type WarrantyValues } from "@rhs-ui/commerce/warranty-registration";

const art = (body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#e6e8e6'/><ellipse cx='200' cy='266' rx='92' ry='9' fill='#000' opacity='.08'/>${body}</svg>`);

/** An air purifier: a tall body with a grille, a small display and a dark base. */
const PURIFIER = art(
  "<rect x='146' y='34' width='108' height='226' rx='36' fill='#f8f8f6'/><rect x='146' y='34' width='108' height='226' rx='36' fill='none' stroke='#cdd0cc' stroke-width='3'/><g fill='#d6d9d5'><rect x='168' y='70' width='64' height='6' rx='3'/><rect x='168' y='84' width='64' height='6' rx='3'/><rect x='168' y='98' width='64' height='6' rx='3'/><rect x='168' y='112' width='64' height='6' rx='3'/><rect x='168' y='126' width='64' height='6' rx='3'/><rect x='168' y='140' width='64' height='6' rx='3'/></g><rect x='172' y='172' width='56' height='30' rx='8' fill='#2c2f31'/><circle cx='184' cy='187' r='4' fill='#8fd0a8'/><path d='M194 187h26' stroke='#6b7073' stroke-width='3' stroke-linecap='round'/><rect x='156' y='240' width='88' height='20' rx='10' fill='#2c2f31'/>",
);

const PRODUCT: WarrantyProduct = { name: "Halcyon Aria air purifier", model: "HX-200", image: PURIFIER };

const SENT: WarrantyValues & { reference: string } = {
  product: "Halcyon Aria air purifier",
  serial: "HX-4821-K9Q2",
  purchaseDate: "2026-03-14",
  store: "Northwind Home, order NW-48213",
  proof: typeof File === "undefined" ? null : new File(["receipt"], "northwind-receipt-48213.pdf", { type: "application/pdf" }),
  consent: true,
  coveredUntil: "2028-03-14",
  reference: "WR-2026-048213",
};

const COVERS = ["Faults in the motor, fan and electronics", "Repair or replacement at no cost to you", "Free collection and return of the unit"];
const EXCLUDES = ["Filters and other parts that wear out", "Damage from drops, water or use outside the manual", "Repairs by anyone but a Halcyon service partner"];

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
  const [log, setLog] = useState("Fill in the serial number and send it, or use HX-0000-0000 to see a send that fails and keeps every answer, the receipt too.");
  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-20 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="A customer registers a purchase: the day comes from the order, so the end of the cover is on the page before anything is sent" note={log}>
        <WarrantyRegistration
          product={PRODUCT}
          warrantyMonths={24}
          serialPattern="^HX-\d{4}-[A-Z0-9]{4}$"
          serialExample="HX-4821-K9Q2"
          serialHelp="On the label under the base, after S/N. It starts with HX."
          covers={COVERS}
          excludes={EXCLUDES}
          privacyHref="#privacy"
          shopHref="#shop"
          defaultValues={{ store: "Northwind Home, order NW-48213", purchaseDate: "2026-03-14" }}
          now="2026-10-26"
          timeZone="Europe/Amsterdam"
          locale="en-GB"
          onSubmit={async (values) => {
            await wait(900);
            if (values.serial === "HX-0000-0000") return "We could not reach the warranty service. Nothing was registered.";
            setLog(`onSubmit received ${values.serial}, bought ${values.purchaseDate}, covered until ${values.coveredUntil}`);
            return { reference: "WR-2026-048213" };
          }}
        />
      </Example>

      <div className="border-t border-border pt-16">
        <Example caption="After a send the form is replaced by the confirmation, which a page can also show on its own with the answers it saved">
          <WarrantyRegistration
            headingAs="h3"
            product={PRODUCT}
            warrantyMonths={24}
            submitted={SENT}
            covers={COVERS}
            excludes={EXCLUDES}
            shopHref="#shop"
            locale="en-GB"
            timeZone="Europe/Amsterdam"
          />
        </Example>
      </div>

      <div className="border-t border-border pt-16">
        <Example caption="Without a product the form asks for one, and an optional receipt is marked as optional">
          <div className="max-w-xl min-w-0">
            <WarrantyRegistration
              headingAs="h3"
              title="Register a Kestrel product"
              description="Bought a Kestrel product from a shop? Tell us which one and the warranty starts from the day you bought it."
              warrantyMonths={36}
              proofRequired={false}
              now="2026-10-26"
              timeZone="Europe/Amsterdam"
              locale="en-GB"
            />
          </div>
        </Example>
      </div>
    </div>
  );
}
