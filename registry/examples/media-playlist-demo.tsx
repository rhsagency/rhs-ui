"use client";

import { useState, type ReactNode } from "react";

import { MediaPlaylist, type PlaylistItem } from "@rhs-ui/application/media-playlist";
import { IconPause, IconPlay, IconSkipBack, IconSkipForward } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A square cover drawn with a few shapes: flat greys, no colour. */
const cover = (background: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' fill='${background}'/>${shape}</svg>`);

/** A 16:9 thumbnail in the same hand. */
const thumb = (background: string, shape: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 90'><rect width='160' height='90' fill='${background}'/>${shape}</svg>`);

const RING = "<circle cx='40' cy='40' r='24' fill='none' stroke='#f1f1f1' stroke-width='4'/><circle cx='40' cy='40' r='9' fill='#f1f1f1'/>";
const BARS = "<g fill='#1b1b1b'><rect x='14' y='44' width='9' height='22'/><rect x='27' y='30' width='9' height='36'/><rect x='40' y='20' width='9' height='46'/><rect x='53' y='36' width='9' height='30'/></g>";
const SUN = "<path d='M12 56a28 28 0 0 1 56 0z' fill='#f1f1f1'/><path d='M8 62h64' stroke='#f1f1f1' stroke-width='3'/>";
const LINES = "<g stroke='#9b9b9b' stroke-width='3'><path d='M12 24h56M12 36h56M12 48h56M12 60h56'/></g><circle cx='54' cy='36' r='8' fill='#f1f1f1'/>";
const TRI = "<path d='M40 14L68 62H12z' fill='none' stroke='#1b1b1b' stroke-width='4' stroke-linejoin='round'/>";
const DOTS = "<g fill='#f1f1f1'><circle cx='22' cy='22' r='5'/><circle cx='40' cy='22' r='5'/><circle cx='58' cy='22' r='5'/><circle cx='22' cy='40' r='5'/><circle cx='58' cy='40' r='5'/><circle cx='22' cy='58' r='5'/><circle cx='40' cy='58' r='5'/><circle cx='58' cy='58' r='5'/></g>";
const WAVE = "<path d='M8 40c8-20 16-20 24 0s16 20 24 0 8-10 16-2' fill='none' stroke='#f1f1f1' stroke-width='4' stroke-linecap='round'/>";

const ALBUM: readonly PlaylistItem[] = [
  { id: "freight", title: "Morning Freight", subtitle: "Kestrel Quartet", duration: 252, artwork: cover("#2a2a2a", RING) },
  { id: "tide", title: "Low Tide Signals", subtitle: "Kestrel Quartet", duration: 228, artwork: cover("#e4e4e4", BARS) },
  { id: "drift", title: "Halcyon Drift", subtitle: "Kestrel Quartet, with Ines Varga", duration: 321, artwork: cover("#1a1a1a", SUN) },
  { id: "lanterns", title: "Paper Lanterns", subtitle: "Kestrel Quartet", duration: 185, artwork: cover("#3a3a3a", LINES) },
  { id: "round", title: "The Long Way Round", subtitle: "Kestrel Quartet", duration: 362, artwork: cover("#dcdcdc", TRI) },
  { id: "reprise", title: "Northwind (Reprise)", subtitle: "Kestrel Quartet", duration: 167, artwork: cover("#242424", DOTS) },
  { id: "garden", title: "Static Garden", subtitle: "Kestrel Quartet", duration: 276, artwork: cover("#333333", WAVE) },
  { id: "train", title: "Last Train to Utrecht", subtitle: "Kestrel Quartet", duration: 358, artwork: cover("#e9e9e9", RING.replace(/#f1f1f1/g, "#1b1b1b")) },
];

const SCREEN = (label: string, ink: string) =>
  `<rect x='28' y='18' width='104' height='54' rx='5' fill='none' stroke='${ink}' stroke-width='3'/><text x='80' y='52' text-anchor='middle' font-family='system-ui,sans-serif' font-size='22' font-weight='600' fill='${ink}'>${label}</text>`;

const COURSE: readonly PlaylistItem[] = [
  { id: "tour", title: "Welcome to Northwind: a five minute tour", subtitle: "Imani Okafor", duration: 312, artwork: thumb("#222222", SCREEN("01", "#f1f1f1")) },
  { id: "workspace", title: "Setting up your workspace, teams and permissions", subtitle: "Imani Okafor", duration: 524, artwork: thumb("#e6e6e6", SCREEN("02", "#1b1b1b")) },
  { id: "import", title: "Importing your existing projects from spreadsheets, Trello and Jira without losing a single comment or attachment", subtitle: "Tomás Reyes", duration: 801, artwork: thumb("#2d2d2d", SCREEN("03", "#f1f1f1")) },
  { id: "automations", title: "Automations that save you an hour a day", subtitle: "Imani Okafor", duration: 436, artwork: thumb("#dedede", SCREEN("04", "#1b1b1b")) },
  { id: "reports", title: "Reading your first report", subtitle: "Tomás Reyes", duration: 388, artwork: thumb("#1c1c1c", SCREEN("05", "#f1f1f1")) },
  { id: "billing", title: "Billing, seats and invoices explained", subtitle: "Aiko Tanaka", duration: 271, artwork: thumb("#e9e9e9", SCREEN("06", "#1b1b1b")) },
  { id: "keys", title: "Keyboard shortcuts worth learning", subtitle: "Imani Okafor", duration: 195, artwork: thumb("#2a2a2a", SCREEN("07", "#f1f1f1")) },
];

function AlbumExample(): React.JSX.Element {
  const [currentId, setCurrentId] = useState("drift");
  const [playing, setPlaying] = useState(true);
  const index = ALBUM.findIndex((item) => item.id === currentId);
  const go = (to: number) => {
    const next = ALBUM[(to + ALBUM.length) % ALBUM.length];
    if (next) {
      setCurrentId(next.id);
      setPlaying(true);
    }
  };
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous track" onClick={() => go(index - 1)}>
            <IconSkipBack />
          </Button>
          <Button type="button" size="icon-sm" aria-pressed={playing} aria-label="Play" onClick={() => setPlaying((before) => !before)} className="rounded-full">
            {playing ? <IconPause strokeWidth={2.5} /> : <IconPlay fill="currentColor" className="translate-x-px" />}
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next track" onClick={() => go(index + 1)}>
            <IconSkipForward />
          </Button>
        </div>
        <p role="status" className="min-w-0 truncate text-xs text-muted-foreground">
          {playing ? "Playing" : "Paused"}: <span className="font-medium text-foreground">{ALBUM[index]?.title}</span>
        </p>
      </div>
      <MediaPlaylist
        title="Halcyon Sessions, Vol. 2"
        headingLevel={2}
        items={ALBUM}
        currentId={currentId}
        playing={playing}
        showUpNext
        maxHeight="26rem"
        onSelect={(id) => {
          if (id === currentId) setPlaying((before) => !before);
          else {
            setCurrentId(id);
            setPlaying(true);
          }
        }}
      />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [video, setVideo] = useState("workspace");

  return (
    <div className="grid w-full max-w-4xl gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
      <Example caption="Try it: the bars move while a track plays and rest when you pause. Choose a row, or use the arrow keys and Enter. Up next starts after the current track.">
        <AlbumExample />
      </Example>

      <Example caption="Videos, paused: a 16:9 thumbnail, bars at rest, and a long title cut with an ellipsis. Hover or focus the third row to read it whole.">
        <MediaPlaylist title="Getting started with Northwind" kind="video" items={COURSE} currentId={video} playing={false} maxHeight="26rem" onSelect={setVideo} headingLevel={2} />
      </Example>
    </div>
  );
}
