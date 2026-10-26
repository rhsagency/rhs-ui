import type { ReactNode } from "react";

import { IconClose, IconShieldAlert } from "@rhs-ui/icons";
import { ProductSafetyInfo } from "@rhs-ui/commerce/product-safety-info";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";

const MAKER = {
  name: "Kestrel Home Appliances Co., Ltd.",
  address: ["No. 18 Lianhua Road, Xiaoshan District", "Hangzhou 311200", "China"],
  email: "safety@kestrel-home.example",
};

const EU = {
  name: "Northwind Compliance B.V.",
  address: "Keizersgracht 217\n1016 DS Amsterdam\nThe Netherlands",
  email: "product-safety@northwind.example",
  phone: "+31 20 555 0142",
  website: "northwind.example/product-safety",
};

const IDENTIFIERS = [
  { label: "Model", value: "KT-220", where: "On the rating plate under the base" },
  { label: "Batch", value: "B2610-04", where: "Printed on the underside of the power base, next to the barcode" },
  { label: "EAN", value: "8719 8830 22040", where: "On the box and under the base" },
];

const WARNINGS = [
  { severity: "danger", title: "Scalding", text: "Never open the lid while the water is boiling. Steam and hot water cause severe burns." },
  { severity: "warning", title: "Electric shock", text: "Do not put the kettle, its cord or its base in water or any other liquid." },
  { severity: "caution", title: "Children", text: "Keep it out of reach of children under 8. Children must not clean it unless they are supervised." },
  { severity: "notice", text: "Descale every four to six weeks in hard water areas. Use the kettle only with the power base that came with it." },
] as const;

const MARKS = [
  { name: "CE", description: "Meets the EU's health, safety and environmental requirements.", href: "#declaration-ce" },
  { name: "UKCA", description: "Meets the requirements for sale in Great Britain.", href: "#declaration-ukca" },
  { name: "RoHS", description: "Contains no restricted substances above the EU limits." },
];

const DOCUMENTS = [
  { title: "User manual", href: "#manual-en", type: "PDF", size: 2_411_724, language: "English" },
  { title: "Gebruiksaanwijzing", href: "#manual-nl", type: "PDF", size: 2_388_410, language: "Dutch" },
  { title: "EU declaration of conformity", href: "#doc-eu", type: "PDF", size: 184_320, language: "English" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl min-w-0 gap-16 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="In a tab of a product page: the warnings first, then the marks, the people responsible, how to recognise the product and the files">
        <Tabs defaultValue="safety" className="gap-5">
          <TabsList className="max-w-full overflow-x-auto relative">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="care">Care</TabsTrigger>
            <TabsTrigger value="safety">Safety information</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="text-sm text-muted-foreground">
            1.7 litre kettle in brushed steel with a temperature dial and a keep-warm setting.
          </TabsContent>
          <TabsContent value="care" className="text-sm text-muted-foreground">
            Wipe the outside with a damp cloth. Descale with citric acid.
          </TabsContent>
          <TabsContent value="safety">
            <ProductSafetyInfo
              description="Northwind Aura kettle KT-220"
              manufacturer={MAKER}
              euContact={EU}
              identifiers={IDENTIFIERS}
              warnings={WARNINGS}
              marks={MARKS}
              documents={DOCUMENTS}
              updatedAt="2026-10-12"
              timeZone="Europe/Amsterdam"
              locale="en-GB"
            />
          </TabsContent>
        </Tabs>
      </Example>

      <div className="grid min-w-0 gap-x-10 gap-y-16 md:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] md:items-start">
        <Example caption="With little to say: only what is known is shown, and nothing appears as an empty field">
          <ProductSafetyInfo
            headingAs="h3"
            title="Safety information"
            manufacturer={{ name: "Halcyon Lighting Ltd.", address: ["Unit 4, Mill Lane", "Leeds LS11 5AB", "United Kingdom"], website: "halcyon-lighting.example" }}
            warnings={[{ severity: "warning", title: "Heat", text: "The lamp gets hot. Let it cool for ten minutes before you touch the shade." }]}
            marks={[{ name: "UKCA", description: "Meets the requirements for sale in Great Britain." }]}
            locale="en-GB"
          />
        </Example>

        <Example caption="Or in a dialog, from a link beside the price, for a page that has no room for a tab">
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <IconShieldAlert />
                  Safety information
                </Button>
              </DialogTrigger>
              <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
                <DialogTitle className="sr-only">Product safety information</DialogTitle>
                <DialogDescription className="sr-only">Warnings, compliance marks, who is responsible and the documents for the Northwind Aura kettle KT-220.</DialogDescription>
                <div className="relative max-h-[85vh] overflow-y-auto">
                  <ProductSafetyInfo
                    className="rounded-none border-0 shadow-none"
                    stickyHeader
                    action={
                      <DialogClose asChild>
                        <Button variant="ghost" size="icon-sm" aria-label="Close">
                          <IconClose />
                        </Button>
                      </DialogClose>
                    }
                    description="Northwind Aura kettle KT-220"
                    manufacturer={MAKER}
                    euContact={EU}
                    identifiers={IDENTIFIERS}
                    warnings={WARNINGS}
                    marks={MARKS}
                    documents={DOCUMENTS}
                    updatedAt="2026-10-12"
                    timeZone="Europe/Amsterdam"
                    locale="en-GB"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </Example>
      </div>
    </div>
  );
}
