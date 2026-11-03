"use client";

import { useState } from "react";

import { AlignedCardGrid } from "@rhs-ui/primitives/aligned-card-grid";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { IconCalendarCheck, IconCheck, IconFileSheet, IconPackage } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const svg = (body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>${body}</svg>`)}`;

/** Three bags, drawn flat on a warm ground: a daypack, a tote and a weekender. */
const PICTURES = {
  daypack: svg(
    [
      "<rect width='400' height='300' fill='#e6e3dc'/>",
      "<ellipse cx='200' cy='262' rx='96' ry='9' fill='#d3cfc5'/>",
      "<path d='M160 70c0-26 80-26 80 0' fill='none' stroke='#2b2e32' stroke-width='9' stroke-linecap='round'/>",
      "<rect x='128' y='64' width='144' height='194' rx='40' fill='#2b2e32'/>",
      "<rect x='148' y='170' width='104' height='68' rx='16' fill='#41454b'/>",
      "<rect x='156' y='98' width='88' height='8' rx='4' fill='#5b6068'/>",
      "<rect x='192' y='140' width='16' height='20' rx='8' fill='#8d9199'/>",
    ].join(""),
  ),
  tote: svg(
    [
      "<rect width='400' height='300' fill='#dfdcd3'/>",
      "<ellipse cx='200' cy='264' rx='108' ry='9' fill='#cdc9be'/>",
      "<path d='M150 96c0-70 100-70 100 0' fill='none' stroke='#8a7f69' stroke-width='9' stroke-linecap='round'/>",
      "<path d='M104 96h192l-14 160H118z' fill='#c9c0aa'/>",
      "<path d='M110 218h180l-3 38H113z' fill='#2b2e32'/>",
      "<rect x='164' y='140' width='72' height='44' rx='8' fill='#b4aa92'/>",
    ].join(""),
  ),
  weekender: svg(
    [
      "<rect width='400' height='300' fill='#e8e5de'/>",
      "<ellipse cx='200' cy='252' rx='140' ry='9' fill='#d6d2c8'/>",
      "<path d='M120 112c0-56 160-56 160 0' fill='none' stroke='#41454b' stroke-width='9' stroke-linecap='round'/>",
      "<rect x='68' y='106' width='264' height='140' rx='46' fill='#41454b'/>",
      "<rect x='68' y='146' width='264' height='6' fill='#2b2e32'/>",
      "<rect x='176' y='160' width='48' height='30' rx='8' fill='#2b2e32'/>",
      "<path d='M96 128c60 36 148 36 208 0' fill='none' stroke='#8d9199' stroke-width='5' stroke-linecap='round'/>",
    ].join(""),
  ),
};

const PRODUCTS = [
  {
    name: "Kestrel 24L daypack",
    body: "A weatherproof pack for the commute and the weekend, with a padded sleeve for a 16 inch laptop.",
    price: "€129",
    picture: PICTURES.daypack,
    alt: "A charcoal daypack with a front pocket",
  },
  {
    name: "Halcyon roll-top tote with removable laptop sleeve and a waxed-canvas base",
    body: "Natural canvas, seam-taped.",
    price: "€96",
    picture: PICTURES.tote,
    alt: "A natural canvas tote with a dark base",
  },
  {
    name: "Northwind weekender 45L",
    body: "Two nights away without checking a bag. The lid unzips into a shoe compartment, the strap pads out for a long walk to the platform, and the whole thing packs flat into its own pocket when you are home again.",
    price: "€184",
    picture: PICTURES.weekender,
    alt: "A charcoal duffel with a curved carry strap",
  },
] as const;

const PLANS = [
  {
    name: "Starter",
    blurb: "For one maker trying the shop out.",
    price: "€0",
    per: "for ever",
    features: ["3 products", "1 staff account", "Community support"],
    cta: "Start free",
    featured: false,
  },
  {
    name: "Scale",
    blurb: "For shops that ship every day and want fewer clicks between an order and a parcel.",
    price: "€49",
    per: "a month",
    features: ["Unlimited products", "5 staff accounts", "Scheduled restocks", "Order exports", "Priority support"],
    cta: "Choose Scale",
    featured: true,
  },
  {
    name: "Enterprise",
    blurb: "Volume pricing, single sign-on, a named contact and an uptime agreement, for teams with many storefronts and a long procurement process.",
    price: "Custom",
    per: "talk to us",
    features: ["Everything in Scale", "SSO and audit log", "Dedicated manager"],
    cta: "Contact sales",
    featured: false,
  },
];

/** Feature cards stop at the body: no price, no button, so no footer. */
const FEATURES = [
  {
    title: "Scheduled restocks",
    body: "Pick the day a sold-out product comes back and the shop shows it, so nobody has to email to ask.",
    icon: <IconCalendarCheck />,
  },
  {
    title: "Order exports in the format your bookkeeper already uses",
    body: "A CSV every Monday morning, or one on demand, with the VAT split out per line.",
    icon: <IconFileSheet />,
  },
  {
    title: "Parcel returns",
    body: "One link per parcel: the customer prints a label at home, and you see the refund waiting the moment the carrier scans it in. Nothing to type, and nothing to reconcile at the end of the month.",
    icon: <IconPackage />,
  },
];

export default function Demo(): React.JSX.Element {
  const [aligned, setAligned] = useState(true);
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-12 px-4 py-8 sm:px-6">
      <section aria-labelledby="acg-products">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="acg-products" className="text-lg font-semibold tracking-[-0.02em]">
              Packs for the long way round
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Titles of one and three lines, bodies of one to six. The text and the buttons below them stay level.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Label htmlFor="acg-aligned" className="text-sm">
              Align the rows
            </Label>
            <Switch id="acg-aligned" checked={aligned} onCheckedChange={setAligned} />
          </div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {aligned ? "Aligned: every card is a subgrid of the grid, with one row for each part." : "A plain grid of the same cards: the footers are pushed down, but every title and body starts where its own card says."}
        </p>

        {aligned ? (
          <AlignedCardGrid minCardWidth="15rem" role="list" aria-label="Packs">
            {PRODUCTS.map((product) => (
              <AlignedCardGrid.Card key={product.name} role="listitem">
                <AlignedCardGrid.Media ratio="4/3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.picture} alt={product.alt} />
                </AlignedCardGrid.Media>
                <AlignedCardGrid.Title>{product.name}</AlignedCardGrid.Title>
                <AlignedCardGrid.Body>{product.body}</AlignedCardGrid.Body>
                <AlignedCardGrid.Footer>
                  <p className="me-auto text-base font-semibold tracking-[-0.02em] tabular-nums">{product.price}</p>
                  <Button size="sm" variant="outline">
                    Add to cart
                  </Button>
                </AlignedCardGrid.Footer>
              </AlignedCardGrid.Card>
            ))}
          </AlignedCardGrid>
        ) : (
          // The same cards in a plain grid, as card code usually is: each is its own flex column with the footer pushed down (mt-auto), so the buttons line up and nothing else does.
          <div role="list" aria-label="Packs" className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(15rem,100%),1fr))]">
            {PRODUCTS.map((product) => (
              <Card key={product.name} role="listitem" className="min-w-0 gap-0 overflow-hidden py-0 pb-5">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.picture} alt={product.alt} className="block size-full object-cover" />
                </div>
                <h3 className="px-5 pt-5 text-base leading-snug font-semibold tracking-[-0.02em] text-balance">{product.name}</h3>
                <p className="px-5 pt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{product.body}</p>
                <div className="mt-auto flex items-center gap-3 px-5 pt-5">
                  <p className="me-auto text-base font-semibold tracking-[-0.02em] tabular-nums">{product.price}</p>
                  <Button size="sm" variant="outline">
                    Add to cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="acg-plans">
        <h2 id="acg-plans" className="text-lg font-semibold tracking-[-0.02em]">
          Rows of your own
        </h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">Plans with a name, a line about who it is for, a price, the features and a button. A description of one line or of five changes nothing below it.</p>
        <AlignedCardGrid rows={["title", "body", "price", "features", "footer"]} minCardWidth="14rem" role="list" aria-label="Plans">
          {PLANS.map((plan) => (
            <AlignedCardGrid.Card key={plan.name} role="listitem" className={cn(plan.featured && "border-foreground/40 shadow-sm")}>
              <AlignedCardGrid.Title className="flex items-center justify-between gap-2">
                {plan.name}
                {plan.featured ? <Badge variant="secondary">Most chosen</Badge> : null}
              </AlignedCardGrid.Title>
              <AlignedCardGrid.Body>{plan.blurb}</AlignedCardGrid.Body>
              <AlignedCardGrid.Part name="price" className="flex items-baseline gap-1.5 pt-5">
                <span className="text-3xl font-semibold tracking-[-0.04em] tabular-nums">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.per}</span>
              </AlignedCardGrid.Part>
              <AlignedCardGrid.Part name="features" className="pt-5">
                <ul className="grid gap-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </AlignedCardGrid.Part>
              <AlignedCardGrid.Footer>
                <Button variant={plan.featured ? "default" : "outline"} className="w-full">
                  {plan.cta}
                </Button>
              </AlignedCardGrid.Footer>
            </AlignedCardGrid.Card>
          ))}
        </AlignedCardGrid>
      </section>

      <section aria-labelledby="acg-features">
        <h2 id="acg-features" className="text-lg font-semibold tracking-[-0.02em]">
          Leave a part out
        </h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">Feature cards with a title and a body and nothing else. List only those two rows and each card still ends the same distance under its last line.</p>
        <AlignedCardGrid rows={["title", "body"]} minCardWidth="14rem" role="list" aria-label="Features">
          {FEATURES.map((feature) => (
            <AlignedCardGrid.Card key={feature.title} role="listitem">
              <AlignedCardGrid.Title className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[3px] inline-flex shrink-0 text-muted-foreground [&_svg]:size-4">
                  {feature.icon}
                </span>
                <span className="min-w-0">{feature.title}</span>
              </AlignedCardGrid.Title>
              <AlignedCardGrid.Body>{feature.body}</AlignedCardGrid.Body>
            </AlignedCardGrid.Card>
          ))}
        </AlignedCardGrid>
      </section>
    </div>
  );
}
