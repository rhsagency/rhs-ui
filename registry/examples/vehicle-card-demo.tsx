"use client";

import { useState, type ReactNode } from "react";

import { VehicleCard, type VehicleImage } from "@rhs-ui/application/vehicle-card";

/** Photos drawn in flat shapes, so the demo needs no files. Use real photographs in an app. */
const uri = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'>${body}</svg>`);

const wheel = (cx: number) =>
  `<circle cx='${cx}' cy='440' r='74' fill='#202224'/><circle cx='${cx}' cy='440' r='62' fill='#2b2d30'/><circle cx='${cx}' cy='440' r='38' fill='#d6d6d2'/>` +
  [0, 1, 2, 3, 4].map((i) => `<rect x='${cx - 4}' y='408' width='8' height='32' rx='3' fill='#a9a9a4' transform='rotate(${i * 72} ${cx} 440)'/>`).join("") +
  `<circle cx='${cx}' cy='440' r='11' fill='#8a8a85'/>`;

interface Shape {
  /** The paint. */
  body: string;
  /** Where the cabin starts, peaks and ends along the car: left foot, left top, right top, right foot. */
  cabin: readonly [number, number, number, number];
  /** How high the roof is. */
  top: number;
}

/** A car in profile in a quiet showroom, in flat shapes. */
const exterior = ({ body, cabin: [a, b, c, d], top }: Shape) =>
  uri(
    `<rect width='900' height='600' fill='#e7e4dd'/><g fill='#dedbd2'><rect x='90' y='60' width='170' height='290'/><rect x='300' y='60' width='170' height='290'/><rect x='510' y='60' width='170' height='290'/><rect x='720' y='60' width='120' height='290'/></g>` +
    `<rect y='440' width='900' height='160' fill='#cfcac0'/><ellipse cx='470' cy='506' rx='392' ry='20' fill='#000' opacity='.13'/>` +
    `<path d='M${a} 336L${b} ${top}H${c}L${d} 336z' fill='${body}' stroke='${body}' stroke-width='20' stroke-linejoin='round'/>` +
    `<path d='M${a + 34} 328L${b + 12} ${top + 26}H${(b + c) / 2 - 8}V328zM${(b + c) / 2 + 8} ${top + 26}H${c - 12}L${d - 34} 328H${(b + c) / 2 + 8}z' fill='#aebcc6'/>` +
    `<rect x='110' y='322' width='720' height='118' rx='36' fill='${body}'/><rect x='128' y='326' width='684' height='4' rx='2' fill='#fff' opacity='.28'/><rect x='134' y='418' width='672' height='14' rx='7' fill='#000' opacity='.14'/>` +
    `<rect x='${(b + c) / 2 - 78}' y='350' width='34' height='7' rx='3.5' fill='#000' opacity='.28'/><rect x='${(b + c) / 2 + 52}' y='350' width='34' height='7' rx='3.5' fill='#000' opacity='.28'/>` +
    `<rect x='798' y='346' width='32' height='17' rx='7' fill='#f6f1e2'/><rect x='102' y='348' width='24' height='19' rx='7' fill='#b4634a'/>` +
    wheel(290) +
    wheel(640),
  );

const interior = (dash: string, screen: string) =>
  uri(
    `<rect width='900' height='600' fill='#cdd5d9'/><path d='M0 0h900v262H0z' fill='#aebcc6'/><rect y='262' width='900' height='338' fill='${dash}'/>` +
      `<path d='M0 262q450-56 900 0v34q-450-56-900 0z' fill='#000' opacity='.2'/>` +
      `<rect x='514' y='306' width='276' height='150' rx='16' fill='#0f1113'/><rect x='528' y='320' width='248' height='122' rx='9' fill='${screen}'/>` +
      `<path d='M544 410h112M544 386h160M544 362h80' stroke='#fff' stroke-opacity='.7' stroke-width='6' stroke-linecap='round'/><circle cx='730' cy='372' r='26' fill='none' stroke='#fff' stroke-opacity='.7' stroke-width='6'/>` +
      `<circle cx='260' cy='444' r='150' fill='none' stroke='#15171a' stroke-width='38'/><circle cx='260' cy='444' r='48' fill='#15171a'/><rect x='108' y='428' width='104' height='32' fill='#15171a'/><rect x='308' y='428' width='104' height='32' fill='#15171a'/>` +
      `<rect x='0' y='520' width='900' height='80' fill='#000' opacity='.18'/>`,
  );

const rim = (tyre: string) =>
  uri(
    `<rect width='900' height='600' fill='#d9d5cb'/><ellipse cx='450' cy='572' rx='290' ry='16' fill='#000' opacity='.12'/>` +
      `<circle cx='450' cy='300' r='262' fill='${tyre}'/><circle cx='450' cy='300' r='196' fill='#cdcdc8'/><circle cx='450' cy='300' r='174' fill='#e4e4e0'/>` +
      [0, 1, 2, 3, 4].map((i) => `<rect x='430' y='132' width='40' height='168' rx='12' fill='#bdbdb8' transform='rotate(${i * 72} 450 300)'/>`).join("") +
      `<circle cx='450' cy='300' r='52' fill='#8c8c88'/><circle cx='450' cy='300' r='22' fill='#e9e9e5'/><path d='M300 418a186 186 0 0 0 150 82v-34a152 152 0 0 1-118-64z' fill='#b4634a'/>`,
  );

const photo = (src: string, alt: string): VehicleImage => ({ src, alt });

const LISTINGS = [
  {
    id: "etourer",
    title: "Halcyon E-Tourer",
    variant: "Long Range 77 kWh, 5 doors",
    price: 38950,
    monthlyPrice: 459,
    year: 2024,
    mileage: 12400,
    fuel: "Electric",
    transmission: "Automatic",
    power: "210 kW (286 hp)",
    status: "available" as const,
    images: [
      photo(exterior({ body: "#7a8793", cabin: [236, 318, 612, 706], top: 214 }), "Side view of a blue-grey electric crossover in a showroom"),
      photo(interior("#2b2f33", "#46594a"), "The dashboard with a wide touchscreen and a leather steering wheel"),
      photo(rim("#2b2d30"), "A five-spoke alloy wheel with a copper brake caliper behind it"),
    ],
  },
  {
    id: "estate",
    title: "Northwind Estate",
    variant: "2.0 TDI Comfort, 5 doors",
    price: 24500,
    monthlyPrice: 329,
    year: 2021,
    mileage: 68200,
    fuel: "Diesel",
    transmission: "Manual",
    power: "110 kW (150 hp)",
    status: "available" as const,
    images: [
      photo(exterior({ body: "#8a6f5a", cabin: [226, 300, 676, 748], top: 232 }), "Side view of a brown estate car with a long roofline"),
      photo(interior("#3a3d40", "#2f3a46"), "The dashboard with a small display and a manual gear lever"),
    ],
  },
  {
    id: "swift",
    title: "Kestrel Swift",
    variant: "1.0 Turbo Active, 3 doors",
    price: 15900,
    year: 2020,
    mileage: 41300,
    fuel: "Petrol",
    transmission: "Manual",
    power: "74 kW (100 hp)",
    status: "reserved" as const,
    images: [photo(exterior({ body: "#b4634a", cabin: [262, 336, 584, 664], top: 230 }), "Side view of a small red hatchback")],
  },
  {
    id: "classic",
    title: "Northwind Estate",
    variant: "1.6 Hybrid Business, 5 doors",
    price: 11250,
    year: 2018,
    mileage: 98700,
    fuel: "Hybrid",
    transmission: "Automatic",
    status: "sold" as const,
    images: [photo(exterior({ body: "#4a5a50", cabin: [226, 300, 676, 748], top: 232 }), "Side view of a dark green estate car"), photo(interior("#33373a", "#2f3a46"), "The dashboard of the estate")],
  },
];

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const CAPTIONS: Record<string, string> = {
  etourer: "For sale, with a monthly figure. Step through the photos.",
  estate: "Key specs as a labelled list, with units.",
  swift: "Reserved: marked in words on the photo, figures muted.",
  classic: "Sold: the photos lose their colour.",
};

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set(["swift"]));
  const toggle = (id: string) => (next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      {LISTINGS.map(({ id, ...vehicle }, position) => (
        <Case key={id} caption={CAPTIONS[id] ?? ""}>
          {/* The first card is the one above the fold: its first photo is fetched at once, the rest as they come near the screen. */}
          <VehicleCard {...vehicle} href={`#${id}`} saved={saved.has(id)} onSave={toggle(id)} priority={position === 0} locale="en-GB" className="flex-1" />
        </Case>
      ))}
    </div>
  );
}
