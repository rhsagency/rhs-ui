"use client";

import { useState } from "react";

import { VideoLibrary, type LibraryVideo } from "@rhs-ui/marketing/video-library";

/** A 16:9 thumbnail drawn in SVG: a plain ground and a few shapes. */
const thumb = (background: string, art: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 360'><rect width='640' height='360' fill='${background}'/>${art}</svg>`);

const keynote = thumb(
  "#1c1d1f",
  "<circle cx='450' cy='180' r='128' fill='#34373b'/><circle cx='450' cy='180' r='58' fill='#e9e7e2'/><rect x='56' y='118' width='220' height='16' rx='8' fill='#5a5e66'/><rect x='56' y='152' width='164' height='16' rx='8' fill='#46494f'/><rect x='56' y='186' width='190' height='16' rx='8' fill='#46494f'/>",
);
const bars = thumb(
  "#e9e7e2",
  "<rect x='96' y='190' width='56' height='110' rx='8' fill='#b8b3a8'/><rect x='184' y='140' width='56' height='160' rx='8' fill='#b8b3a8'/><rect x='272' y='100' width='56' height='200' rx='8' fill='#2f3236'/><rect x='360' y='160' width='56' height='140' rx='8' fill='#b8b3a8'/><rect x='448' y='120' width='56' height='180' rx='8' fill='#b8b3a8'/>",
);
const arcs = thumb(
  "#2f3236",
  "<circle cx='320' cy='180' r='150' fill='none' stroke='#464a50' stroke-width='16'/><circle cx='320' cy='180' r='96' fill='none' stroke='#6b7078' stroke-width='16'/><circle cx='320' cy='180' r='42' fill='#e9e7e2'/>",
);
const blocks = thumb(
  "#d9d6cf",
  "<rect x='120' y='80' width='120' height='90' rx='12' fill='#a39d91'/><rect x='260' y='80' width='120' height='90' rx='12' fill='#8d877c'/><rect x='400' y='80' width='120' height='90' rx='12' fill='#a39d91'/><rect x='120' y='190' width='260' height='90' rx='12' fill='#2f3236'/><rect x='400' y='190' width='120' height='90' rx='12' fill='#a39d91'/>",
);
const route = thumb(
  "#efede8",
  "<path d='M70 270C170 270 170 120 270 120S370 250 470 250 560 150 580 90' fill='none' stroke='#2f3236' stroke-width='14' stroke-linecap='round'/><circle cx='70' cy='270' r='20' fill='#2f3236'/><circle cx='580' cy='90' r='20' fill='#8d877c'/>",
);
const grid = thumb(
  "#3a3d42",
  "<g fill='#5a5e66'><rect x='150' y='70' width='80' height='60' rx='10'/><rect x='250' y='70' width='80' height='60' rx='10'/><rect x='350' y='70' width='80' height='60' rx='10'/><rect x='450' y='70' width='80' height='60' rx='10'/><rect x='150' y='150' width='80' height='60' rx='10'/><rect x='350' y='150' width='80' height='60' rx='10'/><rect x='450' y='150' width='80' height='60' rx='10'/><rect x='150' y='230' width='80' height='60' rx='10'/><rect x='250' y='230' width='80' height='60' rx='10'/><rect x='450' y='230' width='80' height='60' rx='10'/></g><rect x='250' y='150' width='80' height='60' rx='10' fill='#e9e7e2'/>",
);
const peaks = thumb("#cfcac0", "<path d='M60 300L220 120L320 230L430 90L580 300Z' fill='#8d877c'/><path d='M220 120L270 176L200 190Z' fill='#e9e7e2'/>");

const SPEAKERS = {
  amara: "Amara Okonkwo",
  lukas: "Lukas Brandt",
  mei: "Mei Tanaka",
  ingrid: "Ingrid Solberg",
  daniel: "Daniel Reyes",
} as const;

function Playing(): React.JSX.Element {
  const [playing, setPlaying] = useState<LibraryVideo | null>(null);
  return (
    <div>
      <div className="mb-6 flex min-h-14 items-center rounded-xl border border-border bg-muted/40 px-5 text-sm" role="status">
        {playing ? (
          <p>
            Now playing <span className="font-medium">{playing.title}</span>, {playing.duration}
          </p>
        ) : (
          <p className="text-muted-foreground">Press a card to hand its video to your own player.</p>
        )}
      </div>
      <VideoLibrary
        headingLevel={3}
        onPlay={(video) => setPlaying(video)}
        playlists={[
          {
            title: "Product tours",
            description: "Short walk-throughs that open in the page, with no navigation.",
            videos: [
              { title: "Dispatch board in four minutes", duration: "4:08", speaker: SPEAKERS.ingrid, date: "2026-08-19", thumbnail: grid },
              { title: "Technician app, offline", duration: "6:51", speaker: SPEAKERS.daniel, date: "2026-08-19", thumbnail: route },
              { title: "Invoicing from the van", duration: "5:30", speaker: SPEAKERS.ingrid, date: "2026-08-26" },
            ],
          },
        ]}
      />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <p className="mb-6 text-xs text-muted-foreground">Links to the video pages, with the first talk featured and one card without a thumbnail</p>
      <VideoLibrary
        featured
        title="Talks and demos"
        description="Every session from Halcyon Summit 2026, plus short tutorials for your first week."
        playlists={[
          {
            title: "Keynotes",
            description: "The opening and closing sessions, on the main stage.",
            videos: [
              { title: "Why scheduling is the hardest problem in field service", href: "#keynote-1", duration: "42:16", speaker: SPEAKERS.amara, date: "2026-09-12", thumbnail: keynote },
              { title: "What we learned from 10,000 customers", href: "#keynote-2", duration: "28:40", speaker: SPEAKERS.lukas, date: "2026-09-12", thumbnail: bars },
              { title: "Building Atlas: a week planned in under a second", href: "#keynote-3", duration: "31:05", speaker: SPEAKERS.mei, date: "2026-09-13", thumbnail: arcs },
            ],
          },
          {
            title: "Getting started",
            description: "Short tutorials for your first week with Northwind.",
            videos: [
              { title: "Set up your first team in ten minutes", href: "#start-1", duration: "9:48", speaker: SPEAKERS.ingrid, date: "2026-06-04", thumbnail: blocks },
              { title: "Import jobs from a spreadsheet", href: "#start-2", duration: "6:12", speaker: SPEAKERS.ingrid, date: "2026-06-11", thumbnail: grid },
              { title: "Plan a week with Atlas", href: "#start-3", duration: "12:04", speaker: SPEAKERS.mei, date: "2026-06-18", thumbnail: route },
            ],
          },
          {
            title: "Deep dives",
            videos: [
              { title: "Routing under constraints: how Atlas thinks", href: "#deep-1", duration: "1:02:30", speaker: SPEAKERS.mei, date: "2026-09-12", thumbnail: arcs },
              { title: "Offline-first technician apps", href: "#deep-2", duration: "54:18", speaker: SPEAKERS.daniel, date: "2026-09-13", thumbnail: peaks },
              { title: "Migrating a 40-year-old dispatch system", href: "#deep-3", duration: "47:25", speaker: SPEAKERS.lukas, date: "2026-09-13" },
            ],
          },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">With onPlay: the cards are buttons, and the video goes to your own player</p>
      <Playing />
    </div>
  );
}
