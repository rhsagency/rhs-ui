"use client";

import { useState, type ReactNode } from "react";

import { VenueCard } from "@rhs-ui/application/venue-card";

/** Pictures drawn in flat shapes, so the demo needs no files. Use real photographs in an app. */
const scene = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>${body}</svg>`);

const sign = (label: string, ink: string) =>
  `<text x='400' y='97' text-anchor='middle' font-family='Arial, sans-serif' font-weight='700' font-size='20' letter-spacing='9' fill='${ink}'>${label}</text>`;

const CAFE = scene(
  `<rect width='800' height='500' fill='#dfe3e2'/><rect y='402' width='800' height='98' fill='#b9b5ab'/>` +
    `<rect x='120' y='88' width='560' height='316' fill='#e8dfcf'/><rect x='100' y='66' width='600' height='44' fill='#4a4e55'/>` +
    sign("HALCYON", "#e8dfcf") +
    Array.from({ length: 11 }, (_, i) => `<rect x='${130 + i * 49}' y='122' width='49' height='56' fill='${i % 2 ? "#f1ebdd" : "#b4634a"}'/><circle cx='${154.5 + i * 49}' cy='178' r='24.5' fill='${i % 2 ? "#f1ebdd" : "#b4634a"}'/>`).join("") +
    `<rect x='168' y='236' width='256' height='148' fill='#4a4e55'/><rect x='176' y='244' width='240' height='132' fill='#aebcc6'/>` +
    `<rect x='200' y='318' width='56' height='5' fill='#6f6a5d'/><rect x='224' y='323' width='5' height='46' fill='#6f6a5d'/><circle cx='214' cy='306' r='9' fill='#f1ebdd'/><circle cx='318' cy='328' r='24' fill='#e8dfcf'/><rect x='312' y='350' width='12' height='22' fill='#6f6a5d'/>` +
    `<rect x='468' y='236' width='116' height='168' fill='#2f3a36'/><rect x='480' y='250' width='92' height='84' fill='#aebcc6'/><circle cx='560' cy='364' r='5' fill='#e8dfcf'/>` +
    `<rect x='612' y='348' width='56' height='56' fill='#6b7078'/><circle cx='628' cy='338' r='18' fill='#7d9180'/><circle cx='652' cy='334' r='20' fill='#6c8070'/>`,
);

const BOOKS = scene(
  `<rect width='800' height='500' fill='#dcdfe0'/><rect y='404' width='800' height='96' fill='#b4b1a8'/>` +
    `<rect x='110' y='80' width='580' height='326' fill='#46594a'/><rect x='90' y='58' width='620' height='46' fill='#2d3a31'/>` +
    sign("NORTHWIND BOOKS", "#e8dfcf") +
    `<rect x='150' y='140' width='330' height='230' fill='#2d3a31'/><rect x='158' y='148' width='314' height='214' fill='#e8dfcf'/>` +
    [0, 1, 2].map((row) => Array.from({ length: 12 }, (_, i) => `<rect x='${166 + i * 25}' y='${160 + row * 66}' width='19' height='${46 + ((i * 7 + row * 3) % 3) * 6}' fill='${["#b4634a", "#46594a", "#7a8793", "#2f3a46", "#b4a590", "#8a6f5a"][(i + row * 2) % 6]}'/>`).join("") + `<rect x='158' y='${212 + row * 66}' width='314' height='6' fill='#6f6a5d'/>`).join("") +
    `<rect x='520' y='140' width='132' height='266' fill='#2d3a31'/><rect x='532' y='152' width='108' height='160' fill='#aebcc6'/><circle cx='626' cy='360' r='6' fill='#e8dfcf'/>`,
);

const WALL = scene(
  `<rect width='800' height='500' fill='#d9d3c6'/><rect y='408' width='800' height='92' fill='#3d3d3d'/><rect y='398' width='800' height='14' fill='#6f6a5d'/>` +
    `<path d='M0 0h800v398H0z' fill='#cfc8bb'/><path d='M0 120l800-60v70L0 190z' fill='#c5beb0'/><path d='M0 270l800-70v80L0 350z' fill='#c5beb0'/>` +
    Array.from({ length: 26 }, (_, i) => {
      const x = 40 + ((i * 97) % 720);
      const y = 40 + ((i * 53) % 330);
      return `<ellipse cx='${x}' cy='${y}' rx='${12 + (i % 3) * 5}' ry='${9 + (i % 4) * 3}' fill='${["#b4634a", "#46594a", "#7a8793", "#2f3a46", "#e8dfcf", "#8a6f5a"][i % 6]}' transform='rotate(${(i * 37) % 180} ${x} ${y})'/>`;
    }).join("") +
    `<path d='M610 0c-22 90 26 150-8 240s14 110 4 158' fill='none' stroke='#2f3a46' stroke-width='7'/>`,
);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const ZONE = { locale: "en-GB", timeZone: "Europe/Amsterdam" } as const;

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set(["halcyon"]));
  const toggle = (id: string) => (next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Open: a filled dot, the closing time, features counted.">
        <VenueCard
          name="Café Halcyon"
          image={{ src: CAFE, alt: "The front of Café Halcyon, with a striped awning and two tables in the window" }}
          category="Coffee shop"
          rating={4.6}
          ratingCount={1204}
          priceLevel={2}
          priceSymbol="€"
          distance={450}
          openNow
          closesAt="22:00"
          tags={["Vegan options", "Outdoor seating", "Wi-Fi", "Dog friendly", "Step-free"]}
          href="#cafe-halcyon"
          saved={saved.has("halcyon")}
          onSave={toggle("halcyon")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="Closed: a hollow dot, the word, and when it opens.">
        <VenueCard
          name="Northwind Books"
          image={{ src: BOOKS, alt: "A green bookshop front with a window full of books" }}
          category="Bookshop"
          rating={4.8}
          ratingCount={312}
          priceLevel={2}
          priceSymbol="€"
          distance={1230}
          openNow={false}
          opensAt="09:30"
          tags={["Rare books", "Readings"]}
          href="#northwind-books"
          saved={saved.has("books")}
          onSave={toggle("books")}
          className="flex-1"
          {...ZONE}
        />
      </Case>

      <Case caption="A dearer place, farther away, in miles.">
        <VenueCard
          name="Kestrel Climbing"
          image={{ src: WALL, alt: "A climbing wall covered in coloured holds" }}
          category="Climbing gym"
          rating={4.4}
          ratingCount={86}
          priceLevel={3}
          priceSymbol="€"
          distance={3400}
          units="imperial"
          openNow
          closesAt="23:00"
          tags={["Bouldering", "Lead", "Showers"]}
          href="#kestrel-climbing"
          saved={saved.has("climbing")}
          onSave={toggle("climbing")}
          className="flex-1"
          locale="en-US"
          timeZone="Europe/Amsterdam"
        />
      </Case>

      <Case caption="No photo and no reviews yet: the card says so.">
        <VenueCard
          name="Fernleaf Pharmacy"
          category="Pharmacy"
          rating={0}
          ratingCount={0}
          priceLevel={1}
          priceSymbol="€"
          distance={90}
          openNow
          href="#fernleaf-pharmacy"
          saved={saved.has("pharmacy")}
          onSave={toggle("pharmacy")}
          className="flex-1"
          {...ZONE}
        />
      </Case>
    </div>
  );
}
