"use client";

import { ImageGrid } from "@rhs-ui/primitives/image-grid";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 600'><rect width='600' height='600' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <ImageGrid
        images={[
          { id: "1", src: art("#d9d4ca", "<circle cx='300' cy='300' r='140' fill='#8d877c'/>"), alt: "Stone circle on sand", caption: "Studio, morning light" },
          { id: "2", src: art("#2e3135", "<rect x='180' y='180' width='240' height='240' rx='30' fill='#6a6f77'/>"), alt: "Grey block on black", caption: "The night shift" },
          { id: "3", src: art("#e7e5df", "<path d='M120 460L300 140L480 460Z' fill='#a39c90'/>"), alt: "Pale triangle", caption: "Paper mountain" },
          { id: "4", src: art("#bfbab0", "<path d='M60 380 Q300 120 540 380' stroke='#3a3c40' stroke-width='22' fill='none'/>"), alt: "One dark arc", caption: "One line" },
          { id: "5", src: art("#cfc8bd", "<rect x='120' y='260' width='360' height='80' fill='#6d665b'/>"), alt: "A horizon", caption: "Horizon" },
          { id: "6", src: art("#9aa0a6", "<circle cx='200' cy='300' r='80' fill='#e5e2dc'/><circle cx='400' cy='300' r='80' fill='#3c4046'/>"), alt: "Two circles", caption: "Pair" },
        ]}
      />
    </div>
  );
}
