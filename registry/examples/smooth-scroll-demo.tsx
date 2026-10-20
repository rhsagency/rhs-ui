"use client";

import { useState } from "react";

import { SmoothScroll, useSmoothScroll } from "@rhs-ui/motion/smooth-scroll";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const SECTIONS: readonly { id: string; title: string }[] = [
  { id: "overview", title: "Overview" },
  { id: "method", title: "Method" },
  { id: "limits", title: "Limits" },
];

/** The sticky bar lives inside the provider, so it can ask whether the easing is running and jump on request. How much of it shows depends on the width of the panel. */
function Bar({ top }: { top: number }): React.JSX.Element {
  const { scrollTo, active } = useSmoothScroll();
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-card px-3 py-2.5 sm:px-5">
      <nav aria-label="In this article" className="flex min-w-0 items-center gap-0.5">
        {SECTIONS.map((section, index) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
              index === 1 && "hidden @min-[22rem]:block",
              index === 2 && "hidden @min-[30rem]:block",
            )}
          >
            {section.title}
          </a>
        ))}
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground @min-[36rem]:inline-flex">
          <span aria-hidden="true" className={cn("size-2 rounded-full border border-foreground", active ? "bg-foreground" : "bg-transparent")} />
          {active ? "Eased" : "Native"}
        </span>
        <span aria-hidden="true" className="hidden w-16 text-right text-xs text-muted-foreground tabular-nums @min-[30rem]:inline">
          {top.toLocaleString("en-US")} px
        </span>
        <Button size="sm" variant="outline" onClick={() => scrollTo("#end", -24)}>
          Jump to end
        </Button>
      </div>
    </div>
  );
}

function Heading({ index, id, children }: { index: string; id: string; children: string }): React.JSX.Element {
  return (
    <h3 id={id} className="scroll-mt-16 text-xl font-medium tracking-[-0.025em]">
      <span className="mr-3 text-sm font-normal text-muted-foreground tabular-nums">{index}</span>
      {children}
    </h3>
  );
}

export default function Demo(): React.JSX.Element {
  const [smooth, setSmooth] = useState(true);
  const [top, setTop] = useState(0);
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Scroll feel</p>
          <h2 className="mt-2 max-w-[20ch] text-3xl leading-[1.08] font-medium tracking-[-0.04em] text-balance sm:text-4xl">Slow the scroll, not the reader.</h2>
        </div>
        <div className="flex items-center gap-3 pb-1">
          <Label htmlFor="smooth-scroll-on" className="text-sm font-normal text-muted-foreground">
            Smooth scrolling
          </Label>
          <Switch id="smooth-scroll-on" checked={smooth} onCheckedChange={setSmooth} />
        </div>
      </header>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Use the wheel, drag the scrollbar, press Page Down or follow a link. Only the wheel is eased; the rest stays exactly as the browser makes it. Touch screens and reduced motion keep the browser's own scrolling whatever the switch says.</p>

      <div className="@container mt-6">
        <SmoothScroll
          root={false}
          enabled={smooth}
          onScroll={(event) => setTop(Math.round(event.currentTarget.scrollTop))}
          tabIndex={0}
          role="region"
          aria-label="Notes on smooth scrolling"
          className="h-[26rem] rounded-xl border border-border bg-card shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          <Bar top={top} />
          <article className="px-5 pt-8 pb-32 sm:px-8">
            <Heading index="01" id="overview">
              Overview
            </Heading>
            <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
              Smooth scrolling is seasoning. A wheel notch that eases out over a second makes a long page feel considered; one that fights the reader makes it feel broken. This provider only ever touches the wheel.
            </p>
            <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
              Everything else keeps working the way the browser built it: the scrollbar, Page Up and Page Down, Home and End, find in page and the arrow keys.
            </p>

            <div className="mt-12">
              <Heading index="02" id="method">
                How it works
              </Heading>
              <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
                It drives the scroll position the browser already has, one frame at a time, and sleeps while the page is still. Nothing is transformed and nothing is laid out again, so sticky headers, anchors and your own scroll listeners behave as before.
              </p>
              <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-muted-foreground">
                Grab the scrollbar, press a paging key or follow a link while an ease is running and it lets go at once and carries on from where the browser put you. Nothing snaps back.
              </p>
            </div>

            <div className="mt-12">
              <Heading index="03" id="limits">
                Where it steps aside
              </Heading>
              <ul className="mt-4 max-w-[70ch] space-y-3 text-sm leading-relaxed text-muted-foreground">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  Touch screens keep their own momentum.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  Reduced motion gets the plain browser scroll.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  Dialogs, menus and any area marked data-lenis-prevent scroll on their own.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                  If the script never loads, the page is simply a normal page.
                </li>
              </ul>
            </div>

            <p id="end" className="mt-16 border-t border-border pt-6 text-sm text-foreground">
              That is the whole page. Scroll back up with the wheel, or press Home.
            </p>
          </article>
        </SmoothScroll>
      </div>
    </section>
  );
}
