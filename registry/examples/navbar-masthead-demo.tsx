"use client";

import { createContext, useContext, useEffect, useRef, useState, type ComponentProps } from "react";

import { NavbarMasthead } from "@rhs-ui/marketing/navbar-masthead";
import { Button } from "@rhs-ui/primitives/button";

const STORIES: readonly { slug: string; section: string; headline: string; dek: string; byline: string }[] = [
  {
    slug: "top-stories",
    section: "Top stories",
    headline: "Councils across the north agree one timetable for buses, trains and ferries",
    dek: "After three years of talks, fourteen authorities will publish a single schedule from March, with a shared fare cap on every leg.",
    byline: "Anouk Verbeek, 6 min read",
  },
  {
    slug: "world",
    section: "World",
    headline: "A border that reopened after eleven years brings a village back to its market",
    dek: "On the first Saturday, two hundred stalls set up on a street that had been a car park since 2015.",
    byline: "Marta Kowalska, 7 min read",
  },
  {
    slug: "business",
    section: "Business",
    headline: "Energy bills fall for the third month running, but the cheapest tariffs are disappearing",
    dek: "Suppliers are quietly withdrawing fixed deals as wholesale prices settle. What to check before your contract renews.",
    byline: "Callum Reid, 4 min read",
  },
  {
    slug: "technology",
    section: "Technology",
    headline: "Why the next generation of home batteries is built from sodium, not lithium",
    dek: "Cheaper, safer and slower to degrade: the chemistry that could take storage out of the premium aisle.",
    byline: "Ife Adeyemi, 8 min read",
  },
  {
    slug: "culture",
    section: "Culture",
    headline: "A small cinema in Leeuwarden has sold out for a hundred nights in a row",
    dek: "Its programme is a single film a week, introduced from the stage by whoever in town loves it most.",
    byline: "Pieter Dijkstra, 5 min read",
  },
  {
    slug: "opinion",
    section: "Opinion",
    headline: "In defence of the boring timetable",
    dek: "The best public transport is the kind you stop noticing. Why the dull answer keeps winning.",
    byline: "Leonie Baas, 4 min read",
  },
  {
    slug: "sport",
    section: "Sport",
    headline: "The quiet revolution on the Amstel: rowing clubs that train in the dark, together",
    dek: "Five o'clock starts, a shared boathouse and a waiting list for the novice crew.",
    byline: "Sven Hartog, 5 min read",
  },
];

const actions = (
  <>
    <a href="#sign-in" className="rounded-sm px-2 py-1 text-xs font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
      Sign in
    </a>
    <Button size="sm" className="h-7 px-3 text-xs">
      Subscribe
    </Button>
  </>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          Three tiers like a printed front page: the date and the account line, the name set large, and the ruled sections with the current one underlined (click another section and the underline moves). The date is written in a stated locale and time zone, so the server and the browser agree.
        </figcaption>
        <Page label="Front page at the top" prefix="top" current="technology" />
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The same page after a scroll: the name has slid away behind the top line, and only the top line and the sections stay pinned. It is plain sticky positioning, so nothing moves but the scroll. Below 768px the sections become a row that scrolls sideways.
        </figcaption>
        <Page label="Front page scrolled down" prefix="scrolled" current="business" scrolled={420} />
      </figure>
    </div>
  );
}

/** What a click on a link tells the preview: which address is current now. Your site gets this from its router. */
const Choose = createContext<(href: string) => void>(() => {});

/**
 * The link the masthead renders in place of your router's Link. A click makes its address the current one, so the underline and its
 * transition can be tried; the browser still scrolls the frame to the story, as it would to any anchor.
 */
function DemoLink({ href, onClick, ...props }: ComponentProps<"a">): React.JSX.Element {
  const choose = useContext(Choose);
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (href) choose(href);
      }}
      {...props}
    />
  );
}

/**
 * A page in a frame that scrolls on its own, so the masthead can be seen at the top and after a scroll in one preview. In your page the
 * window scrolls and the header is sticky to it. The frame is focusable so a keyboard can scroll it. The current section is held in state,
 * starting at `current`, and moves when a section (or the name, which is the front page) is clicked.
 */
function Page({ label, prefix, current, scrolled = 0 }: { label: string; prefix: string; current: string; scrolled?: number }): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  const [href, setHref] = useState(`#${prefix}-${current}`);
  useEffect(() => {
    if (scrolled) scroller.current?.scrollTo({ top: scrolled });
  }, [scrolled]);
  return (
    <section aria-label={label} className="relative overflow-hidden rounded-xl border border-border bg-background">
      <div ref={scroller} tabIndex={0} className="relative h-[30rem] overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        <Choose.Provider value={setHref}>
          <NavbarMasthead
            name="The Meridian Review"
            nameHref={`#${prefix}-top`}
            date="2026-11-10"
            locale="en-GB"
            timeZone="Europe/Amsterdam"
            navLabel={`Sections, ${prefix}`}
            sections={STORIES.map((story) => ({ label: story.section, href: `#${prefix}-${story.slug}` }))}
            currentHref={href}
            linkAs={DemoLink}
            actions={actions}
          />
        </Choose.Provider>
        <Stories prefix={prefix} />
      </div>
    </section>
  );
}

function Stories({ prefix }: { prefix: string }): React.JSX.Element {
  return (
    <div id={`${prefix}-top`} className="mx-auto max-w-6xl px-4 pt-8 pb-14 sm:px-6">
      <ul>
        {STORIES.map((story, index) => (
          <li key={story.slug} id={`${prefix}-${story.slug}`} className="scroll-mt-28 border-t border-border py-7 first:border-t-0 first:pt-2">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{story.section}</p>
            <h2 className={index === 0 ? "mt-3 max-w-3xl text-3xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-4xl" : "mt-3 max-w-2xl text-xl leading-snug font-medium tracking-[-0.03em] text-balance sm:text-2xl"}>
              {story.headline}
            </h2>
            <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">{story.dek}</p>
            <p className="mt-3 text-xs text-muted-foreground">{story.byline}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
