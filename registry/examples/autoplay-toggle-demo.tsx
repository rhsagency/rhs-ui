"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AutoplayToggle, useAutoplay } from "@rhs-ui/primitives/autoplay-toggle";
import { Marquee } from "@rhs-ui/primitives/marquee";

const SLIDES = [
  { quote: "Moving our onboarding onto the kit took the time to a first merged pull request from three days to an afternoon.", name: "Ines Kowalski", role: "Head of Design, Northwind" },
  { quote: "The states are all there: empty, loading, error. We stopped inventing them again in every project.", name: "Tomas Brandt", role: "Engineering lead, Halcyon" },
  { quote: "Accessibility stopped being a comment in review and became the default we start from.", name: "Mara Okafor", role: "Accessibility lead, Kestrel" },
] as const;

const HOLDS = { hover: "Held while you hover", focus: "Held while a control has focus", hidden: "Held while this tab is hidden" } as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Testimonials(): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const autoplay = useAutoplay();

  // The one line the content obeys: it only runs while `running` is true.
  useEffect(() => {
    if (!autoplay.running) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % SLIDES.length), 4500);
    return () => window.clearInterval(timer);
  }, [autoplay.running]);

  const status = !autoplay.playing ? "Paused" : autoplay.held ? HOLDS[autoplay.held] : "Playing";
  return (
    <section aria-roledescription="carousel" aria-label="Customer testimonials" {...autoplay.contentProps} className="w-full rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
      <div className="grid" aria-live={autoplay.running ? "off" : "polite"}>
        {SLIDES.map((slide, position) => (
          <figure
            key={slide.name}
            aria-hidden={position !== index}
            aria-roledescription="slide"
            aria-label={`${position + 1} of ${SLIDES.length}`}
            className={position === index ? "col-start-1 row-start-1 grid content-start gap-5 opacity-100 transition-opacity duration-500 motion-reduce:transition-none" : "pointer-events-none col-start-1 row-start-1 grid content-start gap-5 opacity-0 transition-opacity duration-500 motion-reduce:transition-none"}
          >
            <blockquote className="text-lg leading-snug font-medium tracking-[-0.02em] text-balance sm:text-xl">“{slide.quote}”</blockquote>
            <figcaption className="flex items-center gap-3 text-sm">
              <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {slide.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")}
              </span>
              <span className="grid">
                <span className="font-medium">{slide.name}</span>
                <span className="text-muted-foreground">{slide.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4">
        <div className="flex items-center">
          {SLIDES.map((slide, position) => (
            <button
              key={slide.name}
              type="button"
              aria-label={`Show testimonial ${position + 1}`}
              aria-current={position === index}
              onClick={() => setIndex(position)}
              className="group/segment flex h-6 w-10 items-center rounded-sm px-0.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <span
                className={
                  position === index
                    ? "h-[3px] w-full rounded-full bg-foreground transition-colors duration-300 motion-reduce:transition-none"
                    : "h-[3px] w-full rounded-full bg-border transition-colors duration-300 group-hover/segment:bg-muted-foreground motion-reduce:transition-none"
                }
              />
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {/* Visual only (the toggle announces the change itself), and on one line: from sm up. A phone has the icon, and no room for a sentence. */}
          <span className="hidden text-xs whitespace-nowrap text-muted-foreground sm:inline" aria-hidden="true">
            {status}
          </span>
          <AutoplayToggle label="testimonials" {...autoplay.toggleProps} />
        </div>
      </div>
    </section>
  );
}

function Ticker(): React.JSX.Element {
  const ticker = useAutoplay();
  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card py-3 pr-3 pl-5 shadow-xs">
      <div {...ticker.contentProps} data-paused={!ticker.running} className="min-w-0 flex-1 [&[data-paused=true]_*]:[animation-play-state:paused]">
        <Marquee label="Customers" duration={26} className="[&>div]:gap-10 [&>div]:pr-10">
          <span className="text-lg font-semibold tracking-[-0.03em]">Northwind</span>
          <span className="text-sm font-semibold tracking-[0.18em] uppercase">Halcyon</span>
          <span className="text-lg font-medium tracking-[-0.02em] italic">kestrel</span>
          <span className="text-lg font-semibold tracking-[-0.04em]">Polder &amp; Co</span>
          <span className="text-base font-medium tracking-[0.04em]">LUMEN</span>
        </Marquee>
      </div>
      <AutoplayToggle label="customer logos" size="sm" {...ticker.toggleProps} />
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="A carousel that moves by itself. The toggle stops it for good; hover or keyboard focus only holds it, and so does a hidden tab.">
        <Testimonials />
      </Example>

      <Example caption="A ticker, obeying the same hook with a data attribute">
        <Ticker />
      </Example>

      <Example caption="Playing shows pause, paused shows play. Three sizes, each with a 44px touch target.">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <AutoplayToggle label="slides" defaultPlaying respectReducedMotion={false} />
            Playing
          </span>
          <span className="flex items-center gap-2.5 text-sm text-muted-foreground">
            <AutoplayToggle label="slides" defaultPlaying={false} />
            Paused
          </span>
          <span className="flex items-center gap-2">
            <AutoplayToggle label="slides, small" size="sm" defaultPlaying respectReducedMotion={false} />
            <AutoplayToggle label="slides, default" defaultPlaying respectReducedMotion={false} />
            <AutoplayToggle label="slides, large" size="lg" defaultPlaying respectReducedMotion={false} />
          </span>
        </div>
      </Example>
    </div>
  );
}
