"use client";

import { createContext, useContext, useState, type ComponentProps } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { BlogIndexSidebar, type BlogTopic } from "@rhs-ui/marketing/blog-index-sidebar";
import { PostFeed, type FeedPost } from "@rhs-ui/marketing/post-feed";
import { Button } from "@rhs-ui/primitives/button";
import { EmptySearch } from "@rhs-ui/primitives/empty-search";
import { Input } from "@rhs-ui/primitives/input";

const uri = (width: number, height: number, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>${body}</svg>`);

const PEOPLE = [
  { bg: "#ddd6ca", skin: "#c8baa6", hair: "#3f3a33", top: "#8a8174" },
  { bg: "#cfd4da", skin: "#d2c2b0", hair: "#2a2b2f", top: "#5b6470" },
  { bg: "#e6dfd2", skin: "#b79f86", hair: "#6a5a49", top: "#2f3236" },
  { bg: "#d5d9d2", skin: "#e0d0be", hair: "#8d7f66", top: "#7a8089" },
];

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
} as const;

interface Post extends FeedPost {
  topic: string;
}

const POSTS: readonly Post[] = [
  {
    topic: "engineering",
    title: "Moving search to Postgres saved us a vendor",
    href: "#postgres-search",
    excerpt: "A practical write-up of full-text search, ranking and the one index that mattered, with the numbers from our own migration.",
    author: { name: "Mees Jansen", avatar: portrait(0) },
    date: "14 October 2026",
    dateTime: "2026-10-14",
    readingTime: "11 min read",
    topics: ["Engineering"],
    image: { src: ART.bars, alt: "Four bars rising from left to right in shades of grey" },
  },
  {
    topic: "culture",
    title: "What happened when we closed on Fridays",
    href: "#four-day-week",
    excerpt: "Six months of a four-day week, measured in releases, sick days and support tickets.",
    author: { name: "Anouk de Wit", avatar: portrait(1) },
    date: "8 October 2026",
    dateTime: "2026-10-08",
    readingTime: "8 min read",
    topics: ["Culture"],
    image: { src: ART.dunes, alt: "Sand dunes under a pale sun" },
  },
  {
    topic: "product",
    title: "The decision log that outlived three reorgs",
    href: "#decision-log",
    excerpt: "Why the most useful document we have is a list of things we decided not to do, and how we keep it honest.",
    author: { name: "Sofia Marín", avatar: portrait(2) },
    date: "30 September 2026",
    dateTime: "2026-09-30",
    readingTime: "5 min read",
    topics: ["Product", "Process"],
  },
  {
    topic: "design",
    title: "A type scale that survives a redesign",
    href: "#type-scale",
    excerpt: "Five sizes, one ratio and the rule that kept our marketing site and our app in step for two years.",
    author: { name: "Tobias Lindqvist", avatar: portrait(3) },
    date: "21 September 2026",
    dateTime: "2026-09-21",
    readingTime: "4 min read",
    topics: ["Design"],
    image: { src: ART.arches, alt: "Three arches in light, mid and dark grey" },
  },
  {
    topic: "engineering",
    title: "Shipping on Fridays, safely",
    href: "#friday-deploys",
    excerpt: "Feature flags, a five-minute rollback and the checklist we run before every release, including the Friday ones.",
    author: { name: "Mees Jansen", avatar: portrait(0) },
    date: "11 September 2026",
    dateTime: "2026-09-11",
    readingTime: "8 min read",
    topics: ["Engineering", "Process"],
    image: { src: ART.rings, alt: "Concentric rings in sand tones" },
  },
  {
    topic: "culture",
    title: "Notes from our first all-remote offsite",
    href: "#offsite",
    excerpt: "Forty people, three time zones and one shared kitchen in Lisbon. What we would do again, and what we would cancel.",
    author: { name: "Anouk de Wit", avatar: portrait(1) },
    date: "2 September 2026",
    dateTime: "2026-09-02",
    readingTime: "6 min read",
    topics: ["Culture", "Company"],
    image: { src: ART.leaf, alt: "A single grey-green leaf" },
  },
];

const TOPIC_NAMES: readonly { slug: string; label: string }[] = [
  { slug: "engineering", label: "Engineering" },
  { slug: "design", label: "Design" },
  { slug: "product", label: "Product" },
  { slug: "culture", label: "Culture" },
];

const POPULAR = [
  { title: "Moving search to Postgres saved us a vendor", href: "#popular-postgres", meta: "12,480 reads" },
  { title: "What happened when we closed on Fridays", href: "#popular-fridays", meta: "9,215 reads" },
  { title: "A type scale that survives a redesign", href: "#popular-type", meta: "5,947 reads" },
];

const PickTopic = createContext<(slug: string) => void>(() => {});

/** Stands in for your router's Link: topic links filter this demo, every other link stays on the page. */
function DemoLink({ href, onClick, ...props }: ComponentProps<"a">) {
  const pick = useContext(PickTopic);
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        if (href?.startsWith("#topic-")) pick(href.slice("#topic-".length));
        onClick?.(event);
      }}
      {...props}
    />
  );
}

function Newsletter(): React.JSX.Element {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-semibold tracking-[-.01em]">The Friday digest</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Three posts worth your time, once a week. No tracking pixels.</p>
      {done ? (
        <p role="status" className="mt-4 flex items-start gap-2 text-sm font-medium">
          <IconCheck size={16} className="mt-0.5 shrink-0" />
          Check your inbox to confirm.
        </p>
      ) : (
        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setDone(true);
          }}
        >
          <Input type="email" required aria-label="Email address" placeholder="you@company.com" />
          <Button type="submit">Subscribe</Button>
        </form>
      )}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const needle = query.toLowerCase();
  const shown = POSTS.filter((post) => (topic === "all" || post.topic === topic) && (!needle || `${post.title} ${post.excerpt}`.toLowerCase().includes(needle)));
  const topics: BlogTopic[] = [
    { slug: "all", label: "All posts", href: "#topic-all", count: POSTS.length },
    ...TOPIC_NAMES.map((entry) => ({ ...entry, href: `#topic-${entry.slug}`, count: POSTS.filter((post) => post.topic === entry.slug).length })),
  ];
  const label = TOPIC_NAMES.find((entry) => entry.slug === topic)?.label;
  return (
    <PickTopic.Provider value={setTopic}>
      <div className="mx-auto max-w-6xl px-6">
        <BlogIndexSidebar
          className="[--sticky-top:4rem]"
          onSearch={setQuery}
          searchPlaceholder="Search the journal"
          topics={topics}
          currentTopic={topic}
          popular={POPULAR}
          aside={<Newsletter />}
          asideLabel="Newsletter"
          linkAs={DemoLink}
        >
          <header className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="text-3xl font-medium tracking-[-.04em] sm:text-4xl">{label ?? "The journal"}</h2>
            <p role="status" className="text-sm text-muted-foreground tabular-nums">
              {query ? `${shown.length} of ${POSTS.length} posts match “${query}”` : `${shown.length} ${shown.length === 1 ? "post" : "posts"}`}
            </p>
          </header>
          <PostFeed
            headingLevel={3}
            linkAs={DemoLink}
            posts={shown}
            empty={
              <EmptySearch
                query={query || (label ?? "")}
                filters={label && query ? [label] : []}
                onClearFilters={() => setTopic("all")}
              />
            }
          />
        </BlogIndexSidebar>
      </div>
    </PickTopic.Provider>
  );
}
