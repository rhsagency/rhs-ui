"use client";

import { useEffect, useRef } from "react";

import { SectionDotsNav } from "@rhs-ui/marketing/section-dots-nav";

const CHAPTERS: readonly { slug: string; label: string; heading: string; text: string }[] = [
  {
    slug: "idea",
    label: "The idea",
    heading: "Keep the night train. Change everything around it.",
    text: "Sleeper services were written off a decade ago. A small team in Malmo bet that the problem was never the train, but the booking, the bedding and the breakfast.",
  },
  {
    slug: "route",
    label: "The route",
    heading: "Seven stops between the Baltic and the Alps.",
    text: "The line leaves Stockholm at 21:10 and reaches Zurich the next morning in time for the first meeting. Nobody changes, and nobody is woken after midnight.",
  },
  {
    slug: "people",
    label: "The people",
    heading: "Forty-two staff, and most of them ride along.",
    text: "Every carriage has a host who knows the timetable by heart and the passengers by name. It is the part of the service nobody asked for and everybody remembers.",
  },
  {
    slug: "numbers",
    label: "The numbers",
    heading: "Eighty-one percent full, from the first month.",
    text: "Forty percent of passengers are on their first sleeper journey. Cancellations stay under three percent, which is lower than the airlines on the same corridors.",
  },
  {
    slug: "next",
    label: "What comes next",
    heading: "A second line to Vienna, if the track allows.",
    text: "Negotiations with two operators are under way. The earliest departure is the autumn timetable, and the first booking window opens in February.",
  },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          One dot per section in the gutter at the right edge. The dot of the section in view is filled and longer; hover or tab to a dot and its name appears, and a click scrolls to it. Below 1024px the rail is hidden. Here the page scrolls inside the frame, so the rail is told which element scrolls.
        </figcaption>
        <Page prefix="story-a" side="right" scrollTo="people" />
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">The same rail on the left edge, at the top of the page.</figcaption>
        <Page prefix="story-b" side="left" />
      </figure>
    </div>
  );
}

/**
 * A long page in a frame that scrolls on its own, so the rail can be seen with a section current. The frame has a transform, which makes it
 * the containing block of the fixed rail; in your page the window scrolls, the rail is fixed to it, and you leave out scrollContainer.
 */
function Page({ prefix, side, scrollTo }: { prefix: string; side: "left" | "right"; scrollTo?: string }): React.JSX.Element {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollTo) return;
    const section = document.getElementById(`${prefix}-${scrollTo}`);
    if (section) scroller.current?.scrollTo({ top: section.offsetTop });
  }, [prefix, scrollTo]);

  return (
    <div role="group" aria-label={`Long page, rail on the ${side}`} className="relative h-[30rem] transform-gpu overflow-hidden rounded-xl border border-border bg-background">
      <SectionDotsNav
        sections={CHAPTERS.map((chapter) => ({ id: `${prefix}-${chapter.slug}`, label: chapter.label }))}
        side={side}
        scrollContainer={`#${prefix}-scroller`}
        label={`Chapters, ${side} rail`}
      />
      {/* The frame is focusable, so a keyboard can scroll it as it would scroll the window of your page. */}
      <div id={`${prefix}-scroller`} ref={scroller} tabIndex={0} className="relative h-full overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
        {CHAPTERS.map((chapter, index) => (
          <section key={chapter.slug} id={`${prefix}-${chapter.slug}`} className="min-h-[24rem] border-b border-border px-8 py-14 last:border-b-0 sm:px-16">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span> · {chapter.label}
            </p>
            <h2 className="mt-5 max-w-xl text-3xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{chapter.heading}</h2>
            <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground">{chapter.text}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
