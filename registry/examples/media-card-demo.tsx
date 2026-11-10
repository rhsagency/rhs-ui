"use client";

import { useState, type ReactNode } from "react";

import { MediaCard } from "@rhs-ui/primitives/media-card";

/* The pictures are drawn as SVG, so the demo needs no files. */
const art = (body: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'>${body}</svg>`);

const DUNES = art(
  "<rect width='640' height='360' fill='#e8dfd0'/><circle cx='470' cy='108' r='50' fill='#f6f0e4'/><path d='M0 258C96 210 186 202 272 234S452 268 640 210V360H0Z' fill='#cdbba0'/><path d='M0 300C120 260 244 268 350 294S540 316 640 280V360H0Z' fill='#a8926f'/><path d='M0 342C160 320 304 326 448 342S580 350 640 336V360H0Z' fill='#6c5a40'/>",
);
const STUDIO = art(
  "<rect width='640' height='360' fill='#1f2326'/><rect x='64' y='56' width='512' height='248' rx='18' fill='#2c3236'/><rect x='92' y='86' width='150' height='14' rx='7' fill='#e6e9eb'/><rect x='92' y='116' width='260' height='10' rx='5' fill='#5a636a'/><rect x='92' y='136' width='214' height='10' rx='5' fill='#5a636a'/><rect x='92' y='196' width='96' height='72' rx='10' fill='#3b4247'/><rect x='204' y='196' width='96' height='72' rx='10' fill='#3b4247'/><rect x='316' y='196' width='96' height='72' rx='10' fill='#3b4247'/><circle cx='500' cy='120' r='34' fill='#8a949c'/>",
);
const SEA = art(
  "<rect width='640' height='360' fill='#c8d2da'/><circle cx='470' cy='280' r='250' fill='#b6c3cd'/><circle cx='470' cy='280' r='186' fill='#9fb0bd'/><circle cx='470' cy='280' r='120' fill='#7a8f9f'/><circle cx='470' cy='280' r='58' fill='#4f6577'/>",
);
const FOREST = art(
  "<rect width='640' height='360' fill='#dfe5dc'/><path d='M60 360L140 130L220 360Z' fill='#7e9484'/><path d='M180 360L280 90L380 360Z' fill='#5d7564'/><path d='M340 360L450 120L560 360Z' fill='#7e9484'/><path d='M470 360L560 170L640 360Z' fill='#43594a'/><path d='M-20 360L70 190L160 360Z' fill='#43594a'/><rect y='220' width='640' height='50' fill='#eef2ec' opacity='.55'/>",
);
const WAVE = art(
  `<rect width='640' height='360' fill='#e2ddd6'/>${Array.from({ length: 21 }, (_, i) => {
    const h = 40 + Math.round(Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 190);
    return `<rect x='${64 + i * 26}' y='${180 - h / 2}' width='12' height='${h}' rx='6' fill='${i < 9 ? "#5b554c" : "#8d857a"}'/>`;
  }).join("")}`,
);

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-4">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState("Press a card: one with an href is a link, one without is a button.");
  const open = (title: string) => () => setOpened(`Opening "${title}".`);

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-12">
      <Example caption="Video, podcast and image: the kind is an icon and a word on the picture. The line along the bottom is how far you got, and the name says where to resume.">
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          <MediaCard
            kind="video"
            thumbnail={DUNES}
            title="Slow mornings in the Dune House"
            meta="Kestrel Studio · 12K views · 3 days ago"
            duration={750}
            progress={0.42}
            onClick={open("Slow mornings in the Dune House")}
          />
          <MediaCard
            kind="video"
            thumbnail={STUDIO}
            title="A type scale that survives a redesign, and the rule that kept our marketing site and app in step"
            meta="Northwind Design · 48K views · 2 weeks ago"
            duration={1456}
            href="#type-scale"
          />
          <MediaCard
            kind="audio"
            thumbnail={SEA}
            title="Why we stopped shipping on Fridays"
            meta="The Slow Web · Episode 41"
            duration={4328}
            progress={0.18}
            labels={{ audio: "Podcast" }}
            onClick={open("Why we stopped shipping on Fridays")}
          />
          <MediaCard kind="image" thumbnail={FOREST} title="Larch forest at first light" meta="Halcyon Journal · 4.2 MB" href="#forest" />
          <MediaCard
            kind="audio"
            thumbnail={WAVE}
            title="Low Tide"
            meta="Halcyon Sessions · Ambient"
            duration={224}
            progress={1}
            labels={{ audio: "Track" }}
            onClick={open("Low Tide")}
          />
          <MediaCard kind="video" title="Quarterly all-hands, full recording" meta="Internal · Recorded on Thursday" duration={3840} href="#all-hands" />
        </div>
        <p role="status" className="text-xs text-muted-foreground">
          {opened}
        </p>
      </Example>

      <Example caption="One ratio for the whole grid, here 1 to 1: the pictures follow it and the rows stay aligned.">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4">
          <MediaCard kind="audio" thumbnail={WAVE} aspectRatio={1} title="Low Tide" meta="Halcyon Sessions" duration={224} labels={{ audio: "Track" }} href="#a" />
          <MediaCard kind="audio" thumbnail={SEA} aspectRatio={1} title="Harbour Lights" meta="Halcyon Sessions" duration={187} progress={0.5} labels={{ audio: "Track" }} href="#b" />
          <MediaCard kind="audio" thumbnail={DUNES} aspectRatio={1} title="First Light on the Dunes, extended mix" meta="Kestrel Radio" duration={412} labels={{ audio: "Track" }} href="#c" />
          <MediaCard kind="audio" aspectRatio={1} title="Untitled demo" meta="Draft" duration={96} labels={{ audio: "Track" }} href="#d" />
        </div>
      </Example>
    </div>
  );
}
