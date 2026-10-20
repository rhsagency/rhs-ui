"use client";

import { Fragment, useEffect, useRef } from "react";

import { ScrollProgress } from "@rhs-ui/motion/scroll-progress";
import { ReadingTimeLeft } from "@rhs-ui/motion/reading-time-left";
import { Button } from "@rhs-ui/primitives/button";

const ARTICLE: readonly { heading?: string; paragraphs: readonly string[] }[] = [
  {
    paragraphs: [
      "For six years, every Monday at ten, thirty-one people joined a call to say what they had done last week. The call lasted fifty minutes on a good day. Nobody disliked it, which is how it survived so long.",
      "Last spring we tried to measure what it cost. Not the hour itself, but the hours around it: the slide nobody wanted to be the first to skip, the Friday afternoon spent writing an update that would be read by two people, the Sunday evening dread of a manager who had not yet looked at the board.",
    ],
  },
  {
    heading: "What we replaced it with",
    paragraphs: [
      "We did not cancel the meeting on a Monday. We cancelled it on a Wednesday, and by Thursday three people had asked whether they were still invited to anything. That told us the meeting had been doing a second job we had never written down: it was how people knew they belonged.",
      "So we split the two jobs. Status moved to a page that updates itself: each project shows what changed since yesterday, who is blocked and what is due this week. Belonging moved to a fifteen-minute call on Tuesdays where nobody reports anything and the only rule is that you cannot talk about work.",
      "The page took a developer two weeks. The call took a calendar invitation. We expected the page to be the hard part, and it was the call that nearly failed, because for the first month people used it to report anyway. We fixed that by moving the call to a different room, with no laptops, and by having whoever hosted it bring a question instead of an agenda.",
    ],
  },
  {
    heading: "What changed, and what did not",
    paragraphs: [
      "Planned work finished on time more often, from 71 percent to 83 percent, though we would not claim the meeting was the reason. What we can say is that questions that used to wait for Monday now get answered in the thread where they arise, usually within the hour.",
      "One number surprised us more than the on-time rate. The share of people who said they knew what the rest of the company was working on went from 38 percent to 74 percent, even though nobody was being told anything in a meeting any more. They could simply look it up, and it turned out that most of them had wanted to all along.",
      "What did not change is the cost of being unclear. A page can show that a task is blocked; it cannot make anyone care about unblocking it. We still have days where the board is green and the work is late, and on those days a person has to pick up the phone.",
    ],
  },
  {
    heading: "What we would do differently",
    paragraphs: [
      "We would have measured the call before replacing it. We guessed that people wanted a shorter meeting, and we were wrong: what they wanted was fewer people reading out the same numbers. Within two weeks the new page showed three projects with no owner at all, something nobody had noticed in a room of thirty-one.",
      "We would also have kept a written record of why decisions were made. The meeting used to be where context lived, and once it was gone we found that half of our decisions had no trail. A short decision log, one paragraph per decision, fixed that within a month.",
      "And we would have told the people outside the call sooner. Support and sales had never been on the Monday meeting, so they were the last to learn that questions now had a different home. For three weeks they kept emailing colleagues who had stopped checking that inbox.",
    ],
  },
  {
    heading: "Should you do the same?",
    paragraphs: [
      "None of this makes the Monday meeting a mistake. For six years it did what we needed: it kept thirty-one people roughly aligned with very little tooling. What changed is that we grew, and what worked for ten people stopped working for thirty. If your team is still small, keep the meeting: it is probably doing exactly what you need.",
      "If you want to try this, do not start by cancelling anything. Start by writing down every job your meeting does, including the ones nobody would admit to. Then move them one at a time, and keep the old meeting until the last of them has a home.",
    ],
  },
];

export default function Demo(): React.JSX.Element {
  const panel = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);

  // Open at the first heading, just under the header, so the readout is already counting down and the text starts on a
  // clean line. A web font that arrives late re-wraps the text, so the spot is measured again once fonts are ready,
  // as long as the reader has not scrolled yet.
  useEffect(() => {
    const el = panel.current;
    const heading = article.current?.querySelector<HTMLElement>("h3");
    if (!el || !heading) return;
    let placed = -1;
    const place = (): void => {
      if (placed >= 0 && Math.abs(el.scrollTop - placed) > 1) return;
      placed = Math.max(0, heading.offsetTop - 49 - 8);
      el.scrollTop = placed;
    };
    place();
    void document.fonts?.ready.then(place);
  }, []);

  const jump = (to: number): void => {
    const el = panel.current;
    if (!el) return;
    el.scrollTo({ top: (el.scrollHeight - el.clientHeight) * to, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <div ref={panel} role="region" aria-label="Scrollable article" tabIndex={0} className="relative h-[min(30rem,calc(100dvh-6.5rem))] overflow-y-auto rounded-xl border border-border bg-background outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        <div className="sticky top-0 z-10 border-b border-border bg-background">
          <div className="flex h-12 items-center justify-between gap-4 px-5">
            <span className="truncate text-sm font-medium tracking-[-0.01em]">Halcyon Journal</span>
            <ReadingTimeLeft target={article} />
          </div>
          <ScrollProgress source="nearest" className="absolute inset-x-0 top-auto -bottom-px" />
        </div>

        <article ref={article} className="mx-auto max-w-prose px-5 py-10">
          <p className="text-xs text-muted-foreground">Operations · 12 October 2026</p>
          <h2 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-balance">Why we stopped holding the Monday status meeting</h2>
          <p className="mt-2 text-sm text-muted-foreground">By Mara Okafor</p>

          <div className="mt-8 space-y-5 text-base leading-[1.75] text-foreground/90 [&_h3]:pt-4 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:tracking-[-0.02em] [&_h3]:text-foreground">
            {ARTICLE.map((block, index) => (
              <Fragment key={block.heading ?? index}>
                {block.heading ? <h3>{block.heading}</h3> : null}
                {block.paragraphs.map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </Fragment>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => jump(0)}>
          Top
        </Button>
        <Button variant="outline" size="sm" onClick={() => jump(0.5)}>
          Halfway
        </Button>
        <Button variant="outline" size="sm" onClick={() => jump(1)}>
          End
        </Button>
        <p className="text-xs text-muted-foreground">The total shows at the top, the minutes left count down, and the end says Done.</p>
      </div>
    </div>
  );
}
