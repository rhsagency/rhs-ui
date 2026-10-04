"use client";

import { useState } from "react";

import { Lightbox } from "@rhs-ui/primitives/lightbox";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><rect width='1200' height='800' fill='${fill}'/>${shape}</svg>`);
const IMAGES = [
  { src: art("#d8d3c9", "<circle cx='600' cy='400' r='220' fill='#8d877c'/>"), alt: "Stone circle on sand", caption: "Morning light" },
  { src: art("#2e3135", "<rect x='420' y='220' width='360' height='360' rx='40' fill='#6a6f77'/>"), alt: "Grey block on black", caption: "The night shift" },
  { src: art("#e7e5df", "<path d='M300 640L600 160L900 640Z' fill='#a39c90'/>"), alt: "Pale triangle", caption: "Paper mountain" },
];

export default function Demo(): React.JSX.Element {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <div className="mx-auto grid max-w-xl grid-cols-3 gap-3 p-8">
      {IMAGES.map((image, i) => (
        <button key={image.src} type="button" onClick={() => setIndex(i)} aria-label={`Open ${image.alt}`} className="overflow-clip rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <img src={image.src} alt="" className="aspect-square w-full object-cover" />
        </button>
      ))}
      <Lightbox images={IMAGES} index={index} onIndexChange={setIndex} />
    </div>
  );
}
