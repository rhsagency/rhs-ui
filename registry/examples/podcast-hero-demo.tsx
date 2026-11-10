"use client";

import { useState } from "react";

import { PodcastHero } from "@rhs-ui/marketing/podcast-hero";

/* The cover is drawn for the demo, so it needs no file. In your site: the show's artwork, square, at least 1400 pixels wide. */
const slowSignal =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'>` +
      `<rect width='1000' height='1000' fill='#e7ddc8'/>` +
      `<circle cx='700' cy='300' r='236' fill='#1e3a3f'/>` +
      `<circle cx='700' cy='300' r='168' fill='none' stroke='#e7ddc8' stroke-width='5' opacity='.5'/>` +
      `<circle cx='700' cy='300' r='108' fill='none' stroke='#e7ddc8' stroke-width='5' opacity='.5'/>` +
      `<circle cx='700' cy='300' r='46' fill='#d4623a'/>` +
      `<path d='M-20 596Q70 524 160 596T340 596T520 596T700 596T880 596T1060 596' fill='none' stroke='#161616' stroke-width='7' stroke-linecap='round'/>` +
      `<text x='62' y='806' font-family='Helvetica Neue, Helvetica, Arial, sans-serif' font-size='172' font-weight='700' letter-spacing='-9' fill='#161616'>Slow</text>` +
      `<text x='62' y='960' font-family='Helvetica Neue, Helvetica, Arial, sans-serif' font-size='172' font-weight='700' letter-spacing='-9' fill='#161616'>Signal</text>` +
      `</svg>`,
  );

const listen = [
  { label: "Apple Podcasts", href: "#apple" },
  { label: "Spotify", href: "#spotify" },
  { label: "RSS", href: "#rss" },
];

export default function Demo(): React.JSX.Element {
  const [firstPlaying, setFirstPlaying] = useState(false);
  const [secondPlaying, setSecondPlaying] = useState(true);

  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">With the show&apos;s own cover art. Play calls onPlay; your player reports back with playing.</p>
      <PodcastHero
        className="py-8 sm:py-10 lg:py-12"
        show={{
          title: "Slow Signal",
          hosts: ["Maya Okafor", "Luis Brandt"],
          description: "Conversations about the technology that works quietly in the background, and the people who keep it running.",
          cover: { src: slowSignal, alt: "Slow Signal: the title in black over a dark circle with rings, on sand", width: 1000, height: 1000 },
        }}
        latest={{
          number: 48,
          title: "The cable under the sea",
          duration: 2886,
          publishedAt: "2026-10-27",
          description: "Nearly all of the world's data crosses the ocean in cables no thicker than a garden hose. We join the crew that repairs them, six hours from land.",
        }}
        listenLinks={listen}
        playing={firstPlaying}
        onPlay={() => setFirstPlaying((value) => !value)}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">No cover art, so the hero sets one from the show name. While an episode plays the button says Pause and the card says Now playing.</p>
      <PodcastHero
        className="py-8 sm:py-10 lg:py-12"
        show={{
          title: "The Long Table",
          hosts: ["Imke de Jong", "Tomás Rey", "Aya Mori"],
          description: "Home cooks and farmers spend an hour on one ingredient, from the field to the plate.",
        }}
        latest={{
          number: 11,
          title: "Everything you wanted to know about rye",
          duration: 4380,
          publishedAt: "2026-11-02",
          description: "A baker, a miller and a grower argue about why dark bread went out of fashion, and what brought it back.",
        }}
        listenLinks={listen}
        playing={secondPlaying}
        onPlay={() => setSecondPlaying((value) => !value)}
      />
    </div>
  );
}
