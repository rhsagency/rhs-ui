"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { NavbarFloating } from "@rhs-ui/marketing/navbar-floating";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const brand = (
    <a href="#top" className="rounded-sm text-base font-semibold tracking-[-0.03em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
      Atelier Nord
    </a>
  );
  const items = [
    { label: "Work", href: "#work" },
    { label: "Studio", href: "#studio" },
    { label: "Journal", href: "#journal" },
    { label: "Contact", href: "#contact" },
  ];
  const actions = (
    <Button size="sm" className="rounded-full">
      Start a project
    </Button>
  );

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">
          The pill floats clear of the edges and the hero sits behind it. The highlight rests on the current page; hover or tab along the links and it follows, then settles back. Below 768px it shrinks to the mark and a menu button.
        </figcaption>
        <Page label="Page at the top">
          <NavbarFloating className="-mb-[4.5rem]" brand={brand} items={items} currentHref="#work" actions={actions} />
          <Content prefix="top" />
        </Page>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs leading-relaxed text-muted-foreground">The same bar after scrolling: the pill stays put and the content passes behind it. With no current page the highlight only appears under the pointer.</figcaption>
        <Page label="Page scrolled down" scrolled={300}>
          <NavbarFloating className="-mb-[4.5rem]" navLabel="Main, scrolled" brand={brand} items={items} actions={actions} />
          <Content prefix="scrolled" />
        </Page>
      </figure>
    </div>
  );
}

/* A scene drawn for the demo, so it needs no file: a pale valley with a low sun. In your site: your own photograph. */
const SCENE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><rect width='1600' height='900' fill='#ececec'/><circle cx='1130' cy='330' r='170' fill='none' stroke='#161616' stroke-opacity='.08'/><circle cx='1130' cy='330' r='104' fill='none' stroke='#161616' stroke-opacity='.14'/><circle cx='1130' cy='330' r='56' fill='#161616' fill-opacity='.92'/><path d='M0 650 190 540l150 76 190-160 170 140 190-100 180 120 190-110 180 90 160-60v360H0z' fill='#d6d6d6'/><path d='M0 730l230-100 190 72 220-122 210 130 210-96 200 104 180-66 160 56v292H0z' fill='#c2c2c2'/><path d='M0 820l260-64 270 56 250-66 260 74 280-56 280 56v110H0z' fill='#a9a9a9'/></svg>",
  );

/** A page in a frame that scrolls on its own, so the pill can be seen on the hero and over the content in one preview. In your page the window scrolls and the pill is sticky to it. */
function Page({ label, scrolled = 0, children }: { label: string; scrolled?: number; children: ReactNode }): React.JSX.Element {
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scrolled) frame.current?.scrollTo({ top: scrolled });
  }, [scrolled]);
  return (
    <section ref={frame} aria-label={label} className="relative h-[30rem] overflow-y-auto overscroll-contain rounded-xl border border-border bg-background">
      {children}
    </section>
  );
}

function Content({ prefix }: { prefix: string }): React.JSX.Element {
  return (
    <>
      <div id={`${prefix}-top`} className="relative grid h-[24rem] content-end bg-cover bg-center px-6 pb-12 sm:px-10" style={{ backgroundImage: `url("${SCENE}")` }}>
        <p className="text-xs font-medium tracking-[0.18em] text-neutral-600 uppercase">Architecture and interiors, Oslo</p>
        <h2 className="mt-4 max-w-xl text-4xl leading-[1.04] font-medium tracking-[-0.045em] text-balance text-neutral-950 sm:text-5xl">Houses that sit quietly in their landscape.</h2>
      </div>
      <div className="grid gap-8 px-6 pt-10 pb-14 sm:px-10">
        <h2 id={`${prefix}-work`} className="text-2xl font-medium tracking-[-0.035em]">
          Selected work
        </h2>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          {[
            ["Fjord house", "Lofoten, 2025"],
            ["Library at Lillestrom", "Akershus, 2024"],
            ["Sauna pavilion", "Nesodden, 2023"],
          ].map(([name, place]) => (
            <li key={name} className="bg-card p-5 text-card-foreground">
              <p className="font-medium">{name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{place}</p>
            </li>
          ))}
        </ul>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">Eleven people, one long table and a workshop where every model is built by hand before a drawing is final.</p>
        <h2 id={`${prefix}-studio`} className="text-2xl font-medium tracking-[-0.035em]">
          The studio
        </h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">We take few commissions a year and see each one through the first winter, when a house shows what it is.</p>
      </div>
    </>
  );
}
