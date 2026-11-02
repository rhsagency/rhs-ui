"use client";

import { useState, type ReactNode } from "react";

import { TourCard } from "@rhs-ui/application/tour-card";

/** Pictures drawn in flat shapes, so the demo needs no files. Use real photographs in an app. */
const scene = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 600'>${body}</svg>`);

/** A narrow canal house: a facade with a stepped gable and rows of windows. */
const house = (x: number, width: number, height: number, wall: string) => {
  const top = 372 - height;
  const windows = Array.from({ length: Math.floor(height / 78) }, (_, row) =>
    [0, 1].map((col) => `<rect x='${x + 18 + col * (width - 52)}' y='${top + 34 + row * 78}' width='34' height='48' fill='#e8dfcf'/><rect x='${x + 22 + col * (width - 52)}' y='${top + 38 + row * 78}' width='26' height='40' fill='#8da0ab'/>`).join(""),
  ).join("");
  return `<rect x='${x}' y='${top}' width='${width}' height='${height}' fill='${wall}'/><path d='M${x - 4} ${top}h${width + 8}l-${width * 0.14} -26h-${width * 0.72}z' fill='${wall}'/><rect x='${x + width * 0.3}' y='${top - 44}' width='${width * 0.4}' height='20' fill='${wall}'/>${windows}`;
};

const CANAL = scene(
  `<rect width='900' height='600' fill='#dfe5e8'/><rect y='372' width='900' height='228' fill='#8da0ab'/>` +
    house(40, 150, 260, "#a8664f") + house(196, 128, 300, "#c9b79c") + house(330, 150, 250, "#7a8793") + house(486, 130, 310, "#b4a590") + house(622, 150, 270, "#8a6f5a") + house(778, 110, 240, "#a8664f") +
    [410, 450, 492, 536].map((y, i) => `<rect x='${70 + i * 40}' y='${y}' width='${760 - i * 70}' height='4' fill='#aebcc6' opacity='.7'/>`).join("") +
    `<path d='M392 452h232l-26 44H420z' fill='#2f3a46'/><rect x='430' y='418' width='120' height='34' fill='#e8dfcf'/><rect x='438' y='426' width='20' height='18' fill='#8da0ab'/><rect x='466' y='426' width='20' height='18' fill='#8da0ab'/><rect x='494' y='426' width='20' height='18' fill='#8da0ab'/>` +
    `<circle cx='572' cy='438' r='9' fill='#b4634a'/><rect x='564' y='446' width='16' height='10' fill='#b4634a'/>`,
);

const MOUNTAINS = scene(
  `<rect width='900' height='600' fill='#e9e1d2'/><circle cx='680' cy='156' r='62' fill='#f3dcb6'/>` +
    `<path d='M0 330L170 150l120 120 110-150 190 210 150-90 160 130v230H0z' fill='#b6b0a6'/>` +
    `<path d='M0 400L210 210l140 140 150-190 230 240 170-100v300H0z' fill='#8f9aa0'/>` +
    `<path d='M170 150l-34 44 34-14 22 16zM400 120l-40 56 40-18 30 20z' fill='#f4f1ea'/>` +
    `<path d='M0 470q220-70 430-10t470-30v170H0z' fill='#5d6a6f'/><path d='M0 540q260-60 500-10t400-20v90H0z' fill='#9aa68a'/>` +
    `<circle cx='312' cy='486' r='9' fill='#2f3a46'/><path d='M300 540l12-48 12 48z' fill='#b4634a'/><path d='M342 470v72' stroke='#2f3a46' stroke-width='4'/>`,
);

const VINEYARD = scene(
  `<rect width='900' height='600' fill='#dde2dc'/><circle cx='210' cy='140' r='54' fill='#f2eddd'/>` +
    `<path d='M0 300q250-90 520-30t380-20v350H0z' fill='#b6c0a0'/><path d='M0 380q300-60 560 0t340-20v240H0z' fill='#a3b08f'/>` +
    Array.from({ length: 9 }, (_, i) => `<path d='M${450 + (i - 4) * 14} 380L${450 + (i - 4) * 150} 600' stroke='#5f7660' stroke-width='${5 + i * 0.4}' stroke-linecap='round' opacity='.85'/>`).join("") +
    `<rect x='640' y='306' width='96' height='58' fill='#e8dfcf'/><path d='M628 308l60-40 60 40z' fill='#8a6f5a'/><rect x='676' y='330' width='20' height='34' fill='#4a4e55'/>`,
);

const STREET = scene(
  `<rect width='900' height='600' fill='#d9d3c6'/><path d='M0 0h330l120 160v280L0 600z' fill='#b4a590'/><path d='M900 0H570L450 160v280l450 160z' fill='#8a6f5a'/>` +
    `<path d='M0 600L330 400h240l330 200z' fill='#a39d91'/><path d='M330 0h240v160H330z' fill='#e6dfd0'/><path d='M330 160L450 160 570 160 570 400H330z' fill='#c9bfae'/>` +
    `<g fill='#b4634a'><path d='M40 250h210l-30 54H70z'/><path d='M650 250h210l-30 54H680z'/></g><g fill='#f1ebdd'><path d='M84 250h30l-8 54H80zM162 250h30l-8 54h-26z'/><path d='M694 250h30l-8 54h-26zM772 250h30l-8 54h-26z'/></g>` +
    `<g fill='#f2d9a8'><circle cx='300' cy='96' r='15'/><circle cx='450' cy='72' r='15'/><circle cx='600' cy='96' r='15'/></g><path d='M300 0v80M450 0v56M600 0v80' stroke='#4a4e55' stroke-width='3'/>` +
    `<rect x='410' y='290' width='80' height='110' fill='#4a4e55'/><circle cx='150' cy='470' r='14' fill='#2f3a46'/><path d='M132 540l18-62 18 62z' fill='#5d7260'/>`,
);

function Case({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2.5 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set(["canal"]));
  const toggle = (id: string) => (next: boolean) =>
    setSaved((current) => {
      const copy = new Set(current);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  return (
    <div className="grid w-full max-w-4xl gap-x-6 gap-y-8 md:grid-cols-2">
      <Case caption="Facts with their units in words, and the price per person.">
        <TourCard
          title="Canal cruise with a local skipper"
          image={{ src: CANAL, alt: "Narrow canal houses on both sides of the water, with a small boat in the middle" }}
          location="Amsterdam, Netherlands"
          duration={90}
          groupSize={12}
          languages={["English", "Dutch", "German"]}
          rating={4.8}
          ratingCount={2193}
          priceFrom={45}
          cancellation
          badge="Bestseller"
          href="#canal-cruise"
          saved={saved.has("canal")}
          onSave={toggle("canal")}
          className="flex-1"
        />
      </Case>

      <Case caption="No free cancellation offered: the line is simply not there.">
        <TourCard
          title="Sunrise hike above the Dolomites"
          image={{ src: MOUNTAINS, alt: "Layered mountains under a pale sun, with a hiker on the ridge in front" }}
          location="Val Gardena, Italy"
          duration={300}
          groupSize={8}
          languages={["English", "Italian"]}
          rating={4.9}
          ratingCount={418}
          priceFrom={89}
          badge="New"
          href="#dolomites-hike"
          saved={saved.has("hike")}
          onSave={toggle("hike")}
          className="flex-1"
        />
      </Case>

      <Case caption="Sold out: the action says so, with the reason written.">
        <TourCard
          title="Vineyard lunch and tasting in Rioja"
          image={{ src: VINEYARD, alt: "Rows of vines running toward a farmhouse on a hill" }}
          location="Haro, Spain"
          duration={240}
          groupSize={14}
          languages={["English", "Spanish"]}
          rating={4.7}
          ratingCount={1032}
          priceFrom={72.5}
          cancellation="Free cancellation up to 48 hours before"
          soldOut="Fully booked until 14 Nov. The Thursday departure still has places."
          href="#rioja-lunch"
          saved={saved.has("rioja")}
          onSave={toggle("rioja")}
          className="flex-1"
        />
      </Case>

      <Case caption="Another locale: numbers, units and currency follow it.">
        <TourCard
          title="Streetfoodwandeling door de binnenstad"
          image={{ src: STREET, alt: "Een smal steegje met lantaarns en kraampjes onder gestreepte luifels" }}
          location="Utrecht, Nederland"
          duration={180}
          groupSize={10}
          languages={["Engels", "Nederlands"]}
          rating={4.6}
          ratingCount={86}
          priceFrom={38}
          cancellation="Gratis annuleren"
          href="#street-food-walk"
          saved={saved.has("street")}
          onSave={toggle("street")}
          className="flex-1"
          locale="nl-NL"
          labels={{
            save: "Bewaar {title}",
            location: "Locatie",
            duration: "Duur",
            groupSize: "Groepsgrootte",
            languages: "Talen",
            cancellationTerm: "Annulering",
            groupUpTo: "Maximaal {count} personen",
            from: "Vanaf",
            perPerson: "per persoon",
            cta: "Beschikbaarheid bekijken",
            soldOut: "Uitverkocht",
            photoFailed: "Foto niet beschikbaar",
            rated: "Beoordeeld met {rating} van 5",
            ratedCount: "Beoordeeld met {rating} van 5 door {count} gasten",
            noReviews: "Nog geen beoordelingen",
          }}
        />
      </Case>
    </div>
  );
}
