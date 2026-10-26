"use client";

import { useState, type ComponentProps } from "react";

import { FollowButton } from "@rhs-ui/application/follow-button";
import { FeedShell, type FeedNavItem } from "@rhs-ui/application/feed-shell";
import { IconBell, IconCompass, IconHeart, IconHome, IconMail, IconMessageCircle, IconMoreHorizontal, IconPlus, IconRepeat, IconShare, IconUser } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

const NAV: readonly FeedNavItem[] = [
  { href: "/home", label: "Home", icon: <IconHome /> },
  { href: "/explore", label: "Explore", icon: <IconCompass /> },
  { href: "/notifications", label: "Notifications", icon: <IconBell />, badge: 3 },
  { href: "/messages", label: "Messages", icon: <IconMail /> },
  { href: "/profile", label: "Profile", icon: <IconUser /> },
];

const TABS = [
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
];

const SCENES = {
  dunes:
    "<circle cx='300' cy='70' r='26' fill='SH' opacity='.3'/><path d='M0 150Q90 96 190 142T400 120V240H0Z' fill='FG'/><path d='M0 196Q110 156 230 198T400 184V240H0Z' fill='SH'/>",
  ridge:
    "<path d='M0 170L70 96 120 140 190 54 270 150 330 104 400 160V240H0Z' fill='FG'/><path d='M190 54L214 92 196 88 186 108 170 84Z' fill='BG' opacity='.7'/><path d='M0 206Q100 186 200 206T400 200V240H0Z' fill='SH'/>",
  lines:
    "<g fill='none' stroke='SH' stroke-width='2' opacity='.55'><path d='M0 70Q100 30 200 70T400 70'/><path d='M0 100Q100 60 200 100T400 100'/><path d='M0 130Q100 90 200 130T400 130'/></g><path d='M0 170Q100 140 200 172T400 160V240H0Z' fill='FG'/>",
} as const;
const TINTS = [
  { bg: "#e7e4dd", fg: "#a39d8f", sh: "#6f6a5f" },
  { bg: "#dfe3e6", fg: "#97a1ab", sh: "#586470" },
] as const;
const scene = (kind: keyof typeof SCENES, tint: 0 | 1) => {
  const t = TINTS[tint];
  const body = SCENES[kind].replaceAll("FG", t.fg).replaceAll("SH", t.sh).replaceAll("BG", t.bg);
  return (
    "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240'><rect width='400' height='240' fill='${t.bg}'/>${body}</svg>`)
  );
};

interface Post {
  id: string;
  name: string;
  handle: string;
  time: string;
  text: string;
  image?: { src: string; alt: string };
  replies: number;
  reposts: number;
  likes: number;
}

const FOR_YOU: readonly Post[] = [
  {
    id: "p1",
    name: "Priya Nair",
    handle: "priya",
    time: "12m",
    text: "Finished the keyboard pass of our checkout today. Tab order, focus rings, a skip link, the error summary. Found two traps where focus disappeared into a closed drawer. Write-up on Friday.",
    replies: 14,
    reposts: 9,
    likes: 86,
  },
  {
    id: "p2",
    name: "Sofia Rossi",
    handle: "sofia",
    time: "48m",
    text: "Colour study for the Larkspur refresh. Three greys, one green that only appears on success. Everything else stays quiet.",
    image: { src: scene("ridge", 1), alt: "A ridge line in two greys under a pale sky" },
    replies: 23,
    reposts: 17,
    likes: 312,
  },
  {
    id: "p3",
    name: "Leo Martins",
    handle: "leo",
    time: "2h",
    text: "Small habit that paid off: every pull request description starts with what the reader should not have to check. Reviews got shorter and kinder.",
    replies: 31,
    reposts: 44,
    likes: 540,
  },
  {
    id: "p4",
    name: "Dan Cho",
    handle: "dan",
    time: "3h",
    text: "Rolled back a deploy in 40 seconds this morning because the rehearsal last week made the steps boring. Boring is the goal.",
    replies: 6,
    reposts: 12,
    likes: 178,
  },
  {
    id: "p5",
    name: "Hana Sato",
    handle: "hana",
    time: "5h",
    text: "Question for support folks: do you tell customers when a macro answered them? We started adding one line at the end and complaints went down, not up.",
    replies: 52,
    reposts: 8,
    likes: 129,
  },
  {
    id: "p6",
    name: "Mara Okafor",
    handle: "mara",
    time: "7h",
    text: "Dunes at 6 a.m. outside Marrakech. No filter, a cheap lens, and a lot of patience.",
    image: { src: scene("dunes", 0), alt: "Sand dunes in two warm greys with a faint sun" },
    replies: 9,
    reposts: 5,
    likes: 204,
  },
  {
    id: "p7",
    name: "Tomas Brandt",
    handle: "tomas",
    time: "Yesterday",
    text: "The release checklist is now eleven lines long and fits on one screen. It used to be four pages. Deleting steps is a feature.",
    replies: 18,
    reposts: 27,
    likes: 391,
  },
];
const FOLLOWING: readonly Post[] = [FOR_YOU[3]!, FOR_YOU[0]!, FOR_YOU[5]!, FOR_YOU[2]!];

const PEOPLE = [
  { name: "Imogen Hale", handle: "imogen", bio: "Product designer" },
  { name: "Rafael Ortiz", handle: "rafael", bio: "Operations lead" },
  { name: "Wen Zhao", handle: "wen", bio: "Writes about teams" },
];
const TOPICS = [
  { name: "Accessibility", posts: "1,284 posts this week" },
  { name: "Release notes", posts: "962 posts this week" },
  { name: "Support craft", posts: "715 posts this week" },
  { name: "Design systems", posts: "640 posts this week" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

// There is no router in a preview: a link that is pressed stays where it is.
function AppLink(props: ComponentProps<"a">): React.JSX.Element {
  return <a {...props} onClick={(event) => event.preventDefault()} />;
}

function PostCard({ post }: { post: Post }): React.JSX.Element {
  const [liked, setLiked] = useState(false);
  const action =
    "group/action -ml-2 inline-flex h-8 min-w-12 items-center gap-1.5 rounded-full px-2 text-xs text-muted-foreground tabular-nums outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:size-[1.125rem]";
  return (
    <article className="flex gap-3 border-b border-border px-4 py-4 transition-colors duration-150 hover:bg-muted/30 motion-reduce:transition-none">
      <Avatar>
        <AvatarFallback>{initials(post.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-baseline gap-x-1.5 text-sm">
          <span className="font-semibold">{post.name}</span>
          <span className="text-muted-foreground">
            @{post.handle} · {post.time}
          </span>
        </header>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-pretty">{post.text}</p>
        {post.image ? (
          <img
            src={post.image.src}
            alt={post.image.alt}
            width={400}
            height={240}
            loading="lazy"
            className="mt-3 aspect-[5/3] w-full rounded-xl border border-border object-cover dark:brightness-90"
          />
        ) : null}
        <footer className="mt-2 flex items-center justify-between">
          <button type="button" className={action} aria-label={`Reply, ${post.replies} replies`}>
            <IconMessageCircle />
            {post.replies}
          </button>
          <button type="button" className={action} aria-label={`Repost, ${post.reposts} reposts`}>
            <IconRepeat />
            {post.reposts}
          </button>
          <button
            type="button"
            className={cn(action, "aria-pressed:font-semibold aria-pressed:text-foreground")}
            aria-pressed={liked}
            aria-label={`Like, ${post.likes + (liked ? 1 : 0)} likes`}
            onClick={() => setLiked(!liked)}
          >
            <IconHeart fill={liked ? "currentColor" : "none"} />
            {post.likes + (liked ? 1 : 0)}
          </button>
          <button type="button" className={action} aria-label="Share">
            <IconShare />
          </button>
        </footer>
      </div>
    </article>
  );
}

const card = "rounded-xl border border-border bg-card p-4";

export default function Demo(): React.JSX.Element {
  const [tab, setTab] = useState("for-you");
  const posts = tab === "for-you" ? FOR_YOU : FOLLOWING;

  return (
    // A phone scrolls inside this box, so the bar that is fixed to the bottom of the screen shows where it belongs in a preview; from md the page scrolls itself.
    <div className="relative max-md:h-[calc(100dvh-3rem)] max-md:overflow-y-auto">
      <FeedShell
        mainId="feed-main"
        nav={NAV}
        currentHref="/home"
        linkAs={AppLink}
        brand={
          <span className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-foreground text-background">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M2.5 12.5a5.5 5.5 0 0 1 11 0" />
                <path d="M5.5 12.5a2.5 2.5 0 0 1 5 0" />
              </svg>
            </span>
            Commons
          </span>
        }
        primaryAction={
          <Button size="lg" className="h-12 rounded-full px-6 text-base">
            <IconPlus />
            Post
          </Button>
        }
        account={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-full p-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <Avatar>
              <AvatarFallback>MO</AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 text-sm leading-tight">
              <span className="block truncate font-semibold">Mara Okafor</span>
              <span className="block truncate text-muted-foreground">@mara</span>
            </span>
            <IconMoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
            <span className="sr-only">Account menu</span>
          </button>
        }
        header="Home"
        tabs={TABS}
        activeTab={tab}
        onTabChange={setTab}
        widgets={
          <>
            <SearchInput aria-label="Search Commons" placeholder="Search Commons" className="h-11 [&_input]:rounded-full" />
            <section aria-labelledby="who-to-follow" className={card}>
              <h2 id="who-to-follow" className="text-[1.0625rem] font-semibold tracking-[-0.02em]">
                Who to follow
              </h2>
              <ul className="mt-3 grid grid-cols-1 gap-4">
                {PEOPLE.map((person) => (
                  <li key={person.handle} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{initials(person.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 text-sm leading-tight">
                      <p className="truncate font-semibold">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{person.bio}</p>
                    </div>
                    <FollowButton name={person.name} size="sm" variant="outline" />
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="topics" className={card}>
              <h2 id="topics" className="text-[1.0625rem] font-semibold tracking-[-0.02em]">
                Topics for you
              </h2>
              <ul className="mt-2 grid grid-cols-1">
                {TOPICS.map((topic) => (
                  <li key={topic.name}>
                    <a
                      href={`#${topic.name}`}
                      onClick={(event) => event.preventDefault()}
                      className="-mx-2 block rounded-lg px-2 py-2 text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <span className="block font-semibold">{topic.name}</span>
                      <span className="block text-xs text-muted-foreground">{topic.posts}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </>
        }
      >
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </FeedShell>
    </div>
  );
}
