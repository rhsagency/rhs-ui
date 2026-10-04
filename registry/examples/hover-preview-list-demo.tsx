"use client";

import { HoverPreviewList } from "@rhs-ui/motion/hover-preview-list";

const art = (fill: string, shape: string) => ({ src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='${fill}'/>${shape}</svg>`), alt: "" });

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <HoverPreviewList
        items={[
          { id: "1", title: "Korenschoof", meta: "Shop, 2026", href: "#", image: art("#d9d4ca", "<circle cx='200' cy='150' r='80' fill='#8d877c'/>") },
          { id: "2", title: "Halcyon Health", meta: "App, 2025", href: "#", image: art("#2e3135", "<rect x='120' y='70' width='160' height='160' rx='28' fill='#6a6f77'/>") },
          { id: "3", title: "Atlas & Co", meta: "Identity, 2025", href: "#", image: art("#e7e5df", "<path d='M80 240L200 60L320 240Z' fill='#a39c90'/>") },
          { id: "4", title: "Meridian", meta: "Website, 2024", href: "#", image: art("#bfbab0", "<path d='M40 200 Q200 40 360 200' stroke='#3a3c40' stroke-width='18' fill='none'/>") },
        ]}
      />
    </div>
  );
}
