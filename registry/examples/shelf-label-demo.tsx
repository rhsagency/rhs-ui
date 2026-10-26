"use client";

import type { ReactNode } from "react";

import { IconPrinter } from "@rhs-ui/icons";
import { ShelfLabel } from "@rhs-ui/commerce/shelf-label";
import { Button } from "@rhs-ui/primitives/button";

function Group({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="flex flex-wrap items-start gap-x-6 gap-y-6">{children}</div>
    </div>
  );
}

/** A label with its own muted caption under it. The caption takes the label's width and never makes it wider. */
function Labelled({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="m-0 grid max-w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-2">
      {children}
      <figcaption className="w-0 min-w-full text-xs text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl min-w-0 grid-cols-[minmax(0,1fr)] gap-y-10">
      <Group caption="The three formats, each printed at its true size">
        <Labelled caption="Small, 50 × 30 mm">
          <ShelfLabel size="small" printable product="Oat drink barista" detail="1 l" price={189} unitPrice={{ amount: 189, per: "l" }} barcode="8710400123453" locale="en-GB" />
        </Labelled>
        <Labelled caption="Medium, 60 × 40 mm, with a promotion">
          <ShelfLabel size="medium" printable product="Linen shirt, stone" detail="Regular fit, size M" price={4995} promotion="Offer until 30 Nov" barcode="8710400987611" locale="en-GB" />
        </Labelled>
        <Labelled caption="Large, 100 × 60 mm, with a promotion and a price per litre">
          <ShelfLabel
            size="large"
            printable
            product="Extra virgin olive oil"
            detail="Cold pressed, 750 ml"
            price={1249}
            unitPrice={{ amount: 1665, per: "l" }}
            promotion="2 for €22"
            barcode="8710400555025"
            locale="en-GB"
          />
        </Labelled>
      </Group>

      <Group caption="The tightest label: small, with a promotion, a name on two lines and a detail">
        <Labelled caption="The barcode takes the room that is left">
          <ShelfLabel size="small" printable product="Oat drink barista edition, unsweetened" detail="1 l" price={189} promotion="2 for 1" barcode="8710400123453" locale="en-GB" />
        </Labelled>
        <Labelled caption="A promotion that is too long stays on one line">
          <ShelfLabel size="small" printable product="Oat drink barista edition, unsweetened" detail="1 l" price={189} promotion="Offer until 30 November, while stocks last" barcode="8710400123453" locale="en-GB" />
        </Labelled>
      </Group>

      <Group caption="Other barcodes, currencies and languages">
        <Labelled caption="An EAN-8, small">
          <ShelfLabel size="small" printable product="Spice mix, ras el hanout" detail="40 g" price={159} unitPrice={{ amount: 3975, per: "kg" }} barcode="96385074" locale="en-GB" />
        </Labelled>
        <Labelled caption="A UPC-A in dollars, medium">
          <ShelfLabel size="medium" printable product="Peanut butter, crunchy" detail="340 g" price={349} unitPrice={{ amount: 1026, per: "kg" }} barcode="036000291452" currency="USD" locale="en-US" />
        </Labelled>
        <Labelled caption="A four-digit price in Dutch, medium">
          <ShelfLabel
            size="medium"
            printable
            product="Kestrel koelkast 220 l"
            detail="Energielabel D"
            price={129900}
            promotion="Aanbieding"
            barcode="8710400222149"
            currency="EUR"
            locale="nl-NL"
            labels={{ label: "Schaplabel: {product}", barcode: "{format}-streepjescode {digits}" }}
          />
        </Labelled>
      </Group>

      <Group caption="A wrong check digit is never drawn as a code: the label says what is wrong">
        <Labelled caption="Check digit 0 where it should be 9">
          <ShelfLabel size="small" printable product="Sparkling water" detail="6 × 1.5 l" price={329} unitPrice={{ amount: 37, per: "l" }} barcode="8710400312230" locale="en-GB" />
        </Labelled>
      </Group>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="button" variant="outline" onClick={() => window.print()}>
          <IconPrinter />
          Print these labels
        </Button>
        <p className="text-xs text-muted-foreground">Everything else leaves the paper: each label prints at its true size, in black on white.</p>
      </div>
    </div>
  );
}
