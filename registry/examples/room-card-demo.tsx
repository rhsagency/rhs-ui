"use client";

import { useState, type ReactNode } from "react";

import { RoomCard, type RoomImage } from "@rhs-ui/commerce/room-card";

type Palette = { wall: string; floor: string; furniture: string; soft: string; accent: string };

const WARM: Palette = { wall: "#e8e3da", floor: "#cdc5b6", furniture: "#8a8374", soft: "#f3f0ea", accent: "#5f594d" };
const COOL: Palette = { wall: "#dfe3e6", floor: "#c1c8cd", furniture: "#707a82", soft: "#eef1f3", accent: "#454d54" };
const DARK: Palette = { wall: "#3b3d40", floor: "#2b2c2e", furniture: "#6c6f73", soft: "#a6a9ad", accent: "#1f2022" };

const svg = (body: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>${body}</svg>`);

/** Three rooms drawn in flat shapes, so the demo needs no pictures. */
function bedroom(p: Palette): string {
  return svg(
    `<rect width='800' height='500' fill='${p.wall}'/><rect y='360' width='800' height='140' fill='${p.floor}'/>` +
      `<rect x='610' y='80' width='150' height='210' rx='6' fill='${p.soft}'/><path d='M685 80v210M610 185h150' stroke='${p.wall}' stroke-width='8'/>` +
      `<rect x='225' y='165' width='350' height='125' rx='14' fill='${p.accent}'/><rect x='235' y='250' width='330' height='125' rx='16' fill='${p.furniture}'/>` +
      `<rect x='265' y='220' width='115' height='52' rx='14' fill='${p.soft}'/><rect x='420' y='220' width='115' height='52' rx='14' fill='${p.soft}'/>` +
      `<rect x='235' y='314' width='330' height='62' rx='12' fill='${p.soft}' opacity='.55'/><rect x='600' y='300' width='54' height='72' rx='6' fill='${p.accent}'/><circle cx='627' cy='282' r='16' fill='${p.soft}'/>`,
  );
}

function canalView(p: Palette): string {
  return svg(
    `<rect width='800' height='500' fill='${p.wall}'/><rect x='80' y='60' width='640' height='330' rx='8' fill='${p.soft}'/>` +
      `<rect x='80' y='60' width='640' height='150' fill='${p.floor}' opacity='.7'/><path d='M120 210V120h70v90M220 210V90h90v120M340 210V130h60v90M430 210V100h100v110M560 210V125h70v85M650 210V140h60v70' fill='${p.furniture}'/>` +
      `<path d='M80 250h640M80 290h640M80 330h640' stroke='${p.furniture}' stroke-width='3' opacity='.45'/><path d='M400 60v330M80 225h640' stroke='${p.wall}' stroke-width='10'/>` +
      `<rect y='410' width='800' height='90' fill='${p.floor}'/><rect x='300' y='370' width='200' height='50' rx='10' fill='${p.accent}'/>`,
  );
}

function bathroom(p: Palette): string {
  return svg(
    `<rect width='800' height='500' fill='${p.wall}'/><path d='M0 0h800v360H0z' fill='${p.soft}' opacity='.55'/><path d='M0 120h800M0 240h800M160 0v360M320 0v360M480 0v360M640 0v360' stroke='${p.floor}' stroke-width='3'/>` +
      `<rect y='360' width='800' height='140' fill='${p.floor}'/><rect x='170' y='270' width='420' height='120' rx='40' fill='${p.soft}'/><rect x='190' y='286' width='380' height='60' rx='28' fill='${p.wall}'/>` +
      `<path d='M650 60v120a40 40 0 0 1-40 40' fill='none' stroke='${p.accent}' stroke-width='10' stroke-linecap='round'/><circle cx='610' cy='222' r='22' fill='${p.accent}'/>`,
  );
}

const CANAL_ROOM: RoomImage[] = [
  { src: bedroom(WARM), alt: "King bed beside a tall window" },
  { src: canalView(WARM), alt: "The window and its view of the canal houses" },
  { src: bathroom(WARM), alt: "Bathroom with a deep tub and a rain shower" },
];
const TWIN_ROOM: RoomImage[] = [
  { src: bedroom(COOL), alt: "Two single beds against a pale wall" },
  { src: bathroom(COOL), alt: "Bathroom with a walk-in shower" },
];
const SUITE: RoomImage[] = [
  { src: bedroom(DARK), alt: "Large bed in a dark panelled suite" },
  { src: canalView(DARK), alt: "Terrace doors onto the garden" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-10">
      <Example caption="In a wide column the pictures sit beside the details. Only 2 left says so in words">
        <RoomCard
          name="Canal view double room"
          images={CANAL_ROOM}
          size="28 m²"
          beds="1 king bed"
          sleeps={2}
          amenities={["Free Wi-Fi", "Air conditioning", "Rain shower", "Nespresso machine", "Safe", "Desk", "Minibar", "Bathrobes", "Blackout curtains"]}
          amenitiesHref="#amenities"
          pricePerNight={18900}
          totalPrice={37800}
          nights={2}
          refundable
          roomsLeft={2}
          locale="en-GB"
          onSelect={() => setSelected("Canal view double room")}
        />
        <p role="status" className="min-h-4 text-xs text-muted-foreground">
          {selected ? `Selected: ${selected}.` : ""}
        </p>
      </Example>

      <div className="grid min-w-0 gap-x-6 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
        <Example caption="In a narrow column it stacks. This rate cannot be cancelled, and the amenities open a dialog">
          <RoomCard
            name="Twin room with courtyard view"
            images={TWIN_ROOM}
            size="22 m²"
            beds="2 single beds"
            sleeps={2}
            amenities={["Free Wi-Fi", "Walk-in shower", "Desk", "Kettle and tea", "Safe", "Hairdryer"]}
            onSeeAllAmenities={() => setOpened(true)}
            pricePerNight={13400}
            totalPrice={26800}
            nights={2}
            refundable={false}
            locale="en-GB"
          />
          <p role="status" className="min-h-4 text-xs text-muted-foreground">
            {opened ? "The full list of amenities would open here." : ""}
          </p>
        </Example>

        <Example caption="Sold out for the dates: it says so where the price was, and the button says why it is off">
          <RoomCard
            name="Garden terrace suite"
            images={SUITE}
            size="46 m²"
            beds="1 king bed and a sofa bed"
            sleeps={4}
            amenities={["Private terrace", "Free Wi-Fi", "Bathtub", "Espresso machine"]}
            pricePerNight={32500}
            totalPrice={65000}
            nights={2}
            roomsLeft={0}
            locale="en-GB"
          />
        </Example>
      </div>
    </div>
  );
}
