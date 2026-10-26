import type { ReactNode } from "react";

import { IconThermometer, IconWind } from "@rhs-ui/icons";
import { ProductPassport } from "@rhs-ui/commerce/product-passport";

/** A caption and the passport under it. Side by side, the two share their rows, so the passports start at the same height whatever the captions say. */
function Example({ caption, paired = false, children }: { caption: string; paired?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    <div className={paired ? "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 md:row-span-2 md:grid-rows-subgrid md:items-start" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="The whole passport of a sweatshirt, on a product page: care, repair and end of life start open">
        <ProductPassport
          title="Northwind crewneck sweatshirt"
          description="Style NW-2210 in Stone, sizes XS to XXL."
          identifier="DPP-NW-2210-0042"
          materials={[
            { name: "Organic cotton", share: 80, note: "GOTS certified, grown in Turkey" },
            { name: "Recycled polyester", share: 20, note: "From post-consumer PET bottles" },
          ]}
          origin={{ place: "Porto, Portugal", factory: "Têxtil Norte Lda.", year: 2026, note: "Cut, sewn and finished in one workshop of 42 people." }}
          footprint={{ value: "8.4 kg CO₂e", label: "per sweatshirt", method: "Cradle to gate, calculated with the Higg MSI on 2026 data." }}
          certificates={[
            { name: "GOTS 7.0", issuer: "Control Union", number: "CU-873421", href: "#gots" },
            { name: "OEKO-TEX Standard 100", issuer: "Hohenstein", number: "26.HTR.01482", href: "#oeko-tex" },
            { name: "Recycled Claim Standard", issuer: "Textile Exchange", number: "TE-RCS-5520", href: "#rcs" },
          ]}
          care={[
            { title: "Wash cold, 30 °C", detail: "Gentle cycle, with similar colours. Turn it inside out." },
            { title: "Dry flat or on a line", detail: "No tumble dryer: it keeps its shape and its size.", icon: <IconWind /> },
            { title: "Iron on low, if you must", detail: "On the reverse side of the print only.", icon: <IconThermometer /> },
          ]}
          repair={[
            { title: "Free repairs for 5 years", detail: "Holes, seams and zips are mended in our Porto workshop.", href: "#repair", linkLabel: "Book a repair" },
            { title: "Spare drawcords and buttons", detail: "They are in the shop for a few euros, with a short video of how to fit them." },
          ]}
          endOfLife={[
            { title: "Hand it in at any Northwind store", detail: "We take worn-out clothes back for recycling, in any state and from any brand." },
            { title: "Post it back with the free label", detail: "Print the label from your account and drop the parcel at a pick-up point.", href: "#return", linkLabel: "Print a return label" },
          ]}
          updatedAt="2026-10-12"
          timeZone="Europe/Amsterdam"
          locale="en-GB"
        />
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-16 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:items-start md:gap-y-4">
        <Example paired caption="With little data: what is not known is left out, the bar says what it does not account for, and the groups start closed">
          <ProductPassport
            headingAs="h3"
            title="Kestrel wool scarf"
            description="Style KS-0814, Oatmeal."
            materials={[
              { name: "Merino wool", share: 72, note: "Mulesing-free, from South Africa" },
              { name: "Cashmere", share: 18 },
            ]}
            origin={{ place: "Biella, Italy", year: 2025 }}
            care={[{ title: "Hand wash, 30 °C", detail: "Lay it flat to dry, away from the radiator." }]}
            endOfLife={[{ title: "Wool and cashmere can be recycled", detail: "Hand it in at a textile collection point." }]}
            defaultOpen={[]}
            locale="en-GB"
          />
        </Example>
        <Example paired caption="A passport with only the proof: the certificates are links, and each one opens the certificate in a new tab">
          <ProductPassport
            headingAs="h3"
            certificates={[
              { name: "Fairtrade Cotton", issuer: "FLOCERT", number: "FLO ID 41870", href: "#fairtrade" },
              { name: "Cradle to Cradle Gold", issuer: "C2C Products Innovation Institute", href: "#c2c" },
            ]}
            footprint={{ value: "2.1 kg CO₂e", label: "per metre of fabric" }}
            updatedAt="2026-09-30"
            timeZone="Europe/Amsterdam"
            locale="en-GB"
          />
        </Example>
      </div>
    </div>
  );
}
