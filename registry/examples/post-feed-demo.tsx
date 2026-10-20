"use client";

import { useState } from "react";

import { PostFeed, type FeedPost } from "@rhs-ui/marketing/post-feed";
import { LoadMore } from "@rhs-ui/primitives/load-more";

const uri = (width: number, height: number, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>${body}</svg>`);

const PEOPLE = [
  { bg: "#ddd6ca", skin: "#c8baa6", hair: "#3f3a33", top: "#8a8174" },
  { bg: "#cfd4da", skin: "#d2c2b0", hair: "#2a2b2f", top: "#5b6470" },
  { bg: "#e6dfd2", skin: "#b79f86", hair: "#6a5a49", top: "#2f3236" },
  { bg: "#d5d9d2", skin: "#e0d0be", hair: "#8d7f66", top: "#7a8089" },
  { bg: "#d9d5df", skin: "#a88d76", hair: "#1f2023", top: "#4a443c" },
];

/** A drawn portrait: shoulders, neck, head and hair in a muted palette. */
const portrait = (index: number) => {
  const p = PEOPLE[index % PEOPLE.length]!;
  const long = index % 3 === 1;
  const hair = long
    ? `<path d='M29 46c-3-21 6-33 19-33s22 12 19 33c0 13 2 22 4 28H25c2-6 4-15 4-28z' fill='${p.hair}'/>`
    : `<path d='M32 41c-2-17 6-26 16-26s18 9 16 26c-5-7-10-10-16-10s-11 3-16 10z' fill='${p.hair}'/>`;
  return uri(96, 96, `<rect width='96' height='96' fill='${p.bg}'/>${long ? hair : ""}<path d='M6 96c3-22 20-32 42-32s39 10 42 32z' fill='${p.top}'/><rect x='41' y='50' width='14' height='18' rx='6' fill='${p.skin}'/><ellipse cx='48' cy='40' rx='15' ry='17' fill='${p.skin}'/>${long ? "" : hair}`);
};

const scene = (body: string) => uri(400, 400, body);
const ART = {
  dunes: scene(
    "<rect width='400' height='400' fill='#e8e1d3'/><circle cx='286' cy='128' r='54' fill='#f7f2e8'/><path d='M0 250C70 205 140 215 205 245S330 270 400 228V400H0Z' fill='#d6cbb7'/><path d='M0 300C80 262 150 280 220 306S340 318 400 286V400H0Z' fill='#b9ab92'/><path d='M0 352C90 326 170 340 250 360S350 372 400 350V400H0Z' fill='#8d7f66'/>",
  ),
  arches: scene(
    "<rect width='400' height='400' fill='#dde0e4'/><circle cx='118' cy='96' r='22' fill='#f4f5f7'/><path d='M60 400V230a70 70 0 0 1 140 0V400Z' fill='#b4bac2'/><path d='M150 400V190a70 70 0 0 1 140 0V400Z' fill='#8b939e'/><path d='M240 400V250a70 70 0 0 1 140 0V400Z' fill='#5d6671'/>",
  ),
  bars: scene(
    "<rect width='400' height='400' fill='#26282c'/><rect x='56' y='250' width='56' height='94' rx='8' fill='#3d4045'/><rect x='128' y='200' width='56' height='144' rx='8' fill='#575b62'/><rect x='200' y='150' width='56' height='194' rx='8' fill='#7a8089'/><rect x='272' y='92' width='56' height='252' rx='8' fill='#b3b8bf'/>",
  ),
  rings: scene(
    "<rect width='400' height='400' fill='#ece8e0'/><circle cx='200' cy='200' r='130' fill='#d5cec0'/><circle cx='200' cy='200' r='92' fill='#b9b0a0'/><circle cx='200' cy='200' r='54' fill='#6f6759'/><circle cx='200' cy='200' r='18' fill='#2b2822'/>",
  ),
  leaf: scene(
    "<rect width='400' height='400' fill='#e3e4de'/><path d='M200 64C304 118 332 246 200 340C68 246 96 118 200 64Z' fill='#9da398'/><path d='M200 64C304 118 332 246 200 340Z' fill='#7d8478'/><path d='M200 110V336' stroke='#e3e4de' stroke-width='6' stroke-linecap='round'/>",
  ),
  stairs: scene(
    "<rect width='400' height='400' fill='#d9d6d0'/><path d='M0 400V300h100V240h100V180h100V120h100V400Z' fill='#a39e94'/><path d='M0 400V340h100V300h100V260h100V220h100V400Z' fill='#6c675e'/><circle cx='320' cy='70' r='28' fill='#f3f0ea'/>",
  ),
} as const;

const ALL_POSTS: readonly FeedPost[] = [
  {
    title: "Why our drivers' app stopped asking for a password",
    href: "#passkeys",
    excerpt: "Passkeys cut sign-in from 41 seconds to 6 and removed the biggest source of calls from the depot floor. Here is how we rolled them out to 2,300 drivers.",
    author: { name: "Mees Jansen", avatar: portrait(0) },
    date: "14 October 2026",
    dateTime: "2026-10-14",
    readingTime: "7 min read",
    topics: ["Engineering", "Security"],
    image: { src: ART.bars, alt: "Four bars rising from left to right in shades of grey" },
  },
  {
    title: "A year of closing on Fridays",
    href: "#four-day-week",
    excerpt: "What we measured, what we only guessed, and the three things we would tell any team about to try a four-day week.",
    author: { name: "Anouk de Wit", avatar: portrait(1) },
    date: "8 October 2026",
    dateTime: "2026-10-08",
    readingTime: "9 min read",
    topics: [{ label: "Culture", href: "#culture" }],
    image: { src: ART.dunes, alt: "Sand dunes under a pale sun" },
  },
  {
    title: "How we plan a route when the map is wrong",
    href: "#route-corrections",
    excerpt: "Roundabouts that no longer exist, gates that close at six. The correction layer our drivers write by hand, and why it stays manual.",
    author: { name: "Sofia Marín", avatar: portrait(2) },
    date: "2 October 2026",
    dateTime: "2026-10-02",
    readingTime: "6 min read",
    topics: ["Product"],
  },
  {
    title: "Rebuilding the depot dashboard for a dim screen",
    href: "#dark-dashboard",
    excerpt: "Warehouses are bright, phones are dim, and nobody has time to squint. Notes on contrast, type size and one very large button.",
    author: { name: "Tobias Lindqvist", avatar: portrait(3) },
    date: "24 September 2026",
    dateTime: "2026-09-24",
    readingTime: "5 min read",
    topics: [{ label: "Design", href: "#design" }, "Accessibility"],
    image: { src: ART.arches, alt: "Three arches in light, mid and dark grey" },
  },
  {
    title: "Postmortem: the Tuesday we lost the barcode scanner",
    href: "#scanner-outage",
    excerpt: "A forty-minute outage, a certificate that expired on a Sunday, and the checklist that came out of it.",
    author: { name: "Femke Bos", avatar: portrait(4) },
    date: "17 September 2026",
    dateTime: "2026-09-17",
    readingTime: "11 min read",
    topics: ["Engineering"],
    image: { src: ART.rings, alt: "Concentric rings in sand tones" },
  },
  {
    title: "Ten things we learned from ten thousand parcel photos",
    href: "#parcel-photos",
    excerpt: "People photograph the door, not the parcel. What that taught us about proof of delivery and about asking for less.",
    author: { name: "Mees Jansen", avatar: portrait(0) },
    date: "9 September 2026",
    dateTime: "2026-09-09",
    readingTime: "8 min read",
    topics: ["Product", "Research"],
    image: { src: ART.leaf, alt: "A single grey-green leaf" },
  },
  {
    title: "Hiring drivers who have never used a smartphone for work",
    href: "#onboarding",
    excerpt: "Our onboarding is eleven minutes long and has no tutorial. Why we removed it, and what replaced it.",
    author: { name: "Anouk de Wit", avatar: portrait(1) },
    date: "28 August 2026",
    dateTime: "2026-08-28",
    readingTime: "6 min read",
    topics: ["Culture"],
  },
  {
    title: "The staircase we use to explain our roadmap",
    href: "#roadmap",
    excerpt: "One picture, four steps and a rule: nothing goes on the second step until the first is boring.",
    author: { name: "Sofia Marín", avatar: portrait(2) },
    date: "19 August 2026",
    dateTime: "2026-08-19",
    readingTime: "4 min read",
    topics: ["Product"],
    image: { src: ART.stairs, alt: "A staircase of grey blocks under a pale moon" },
  },
  {
    title: "What a quiet pager taught us about alerts",
    href: "#alerts",
    excerpt: "We deleted 70 percent of our alerts and caught the next incident two minutes sooner.",
    author: { name: "Femke Bos", avatar: portrait(4) },
    date: "6 August 2026",
    dateTime: "2026-08-06",
    readingTime: "7 min read",
    topics: ["Engineering"],
  },
];

const PAGE = 5;

export default function Demo(): React.JSX.Element {
  const [shown, setShown] = useState(PAGE);
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-8">
        <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">Field notes</h2>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">How Kestrel builds the software behind 40,000 deliveries a day, written by the people who ship it.</p>
      </header>
      <PostFeed
        headingLevel={3}
        posts={ALL_POSTS.slice(0, shown)}
        loadMore={
          <LoadMore
            shown={shown}
            total={ALL_POSTS.length}
            noun="posts"
            onLoadMore={async () => {
              await new Promise((resolve) => setTimeout(resolve, 700));
              setShown((count) => Math.min(count + 4, ALL_POSTS.length));
            }}
          />
        }
      />
    </div>
  );
}
