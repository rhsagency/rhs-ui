"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { NavbarEntry } from "@rhs-ui/marketing/navbar";
import { NavbarTransparent } from "@rhs-ui/marketing/navbar-transparent";
import { Button } from "@rhs-ui/primitives/button";

/* Two scenes drawn for the demo, so they need no file: a night valley for a dark hero, and a pale one for a light hero. In your site: your own photograph. */
const scene = (sky: string, ridges: [string, string, string], sun: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><rect width='1600' height='900' fill='${sky}'/><circle cx='1180' cy='250' r='190' fill='none' stroke='${sun}' stroke-opacity='.08'/><circle cx='1180' cy='250' r='120' fill='none' stroke='${sun}' stroke-opacity='.14'/><circle cx='1180' cy='250' r='64' fill='${sun}' fill-opacity='.95'/><path d='M0 640 180 520l150 80 190-170 180 150 180-100 180 130 180-110 180 90 180-70v370H0z' fill='${ridges[0]}'/><path d='M0 720l220-110 180 80 210-130 210 140 200-100 210 110 190-70 180 60v250H0z' fill='${ridges[1]}'/><path d='M0 810l260-70 260 60 240-70 250 80 270-60 320 60v150H0z' fill='${ridges[2]}'/></svg>`,
  );

const NIGHT = scene("#141414", ["#202020", "#2a2a2a", "#353535"], "#ececec");
const DAWN = scene("#efefef", ["#dcdcdc", "#cbcbcb", "#b9b9b9"], "#ffffff");

const ITEMS: readonly NavbarEntry[] = [
  {
    label: "Stay",
    links: [
      { label: "Rooms", href: "#rooms", description: "Eleven rooms, none of them with a television." },
      { label: "Chalets", href: "#chalets", description: "For a family, or for a long silence." },
    ],
  },
  { label: "Dining", href: "#dining" },
  { label: "Spa", href: "#spa" },
  { label: "The valley", href: "#valley" },
];

const BRAND = (
  <a href="#top" className="rounded-sm text-lg font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
    Halden
  </a>
);

const ACTIONS = (
  <>
    <Button variant="ghost" size="sm">
      Sign in
    </Button>
    <Button size="sm">Book a stay</Button>
  </>
);

/** A page in a frame that scrolls on its own, as an app layout does, so the bar can be seen at rest and scrolled in one preview. In your page the window scrolls and the bar is fixed to it. */
function Page({ children, label, height = "h-[30rem]", scrolled = 0 }: { children: ReactNode; label: string; height?: string; scrolled?: number }): React.JSX.Element {
  const frame = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scrolled) frame.current?.scrollTo({ top: scrolled });
  }, [scrolled]);
  return (
    <section ref={frame} aria-label={label} className={`relative ${height} overflow-y-auto overscroll-contain rounded-xl border border-border bg-background`}>
      {children}
    </section>
  );
}

function Rooms(): React.JSX.Element {
  return (
    <div className="grid gap-5 px-6 py-14 sm:px-10">
      <h2 className="text-2xl font-medium tracking-[-0.035em]">Eleven rooms above the cloud line</h2>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">Larch floors, wool blankets and a window that faces the glacier. Breakfast is included, and so is the silence.</p>
      <ul className="grid gap-3 sm:grid-cols-3">
        {[
          ["Ridge room", "From €240 a night"],
          ["Glacier suite", "From €410 a night"],
          ["The loft", "From €520 a night"],
        ].map(([name, price]) => (
          <li key={name} className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <p className="font-medium">{name}</p>
            <p className="mt-1 text-sm text-muted-foreground tabular-nums">{price}</p>
          </li>
        ))}
      </ul>
      <h2 className="mt-6 text-2xl font-medium tracking-[-0.035em]">Dinner at half past seven</h2>
      <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">One table, one menu, and whatever the valley gave that week: cheese from the next village, trout from the lake, rye from the mill below the road.</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-6">
      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">At rest the bar has no background, so the hero fills the frame. Scroll this one: past 24px it takes the page colour and a hairline.</figcaption>
        <Page label="Page at the top">
          <NavbarTransparent className="sticky -mb-16" brand={BRAND} items={ITEMS} actions={ACTIONS} currentHref="#rooms" />
          <div id="top" className="dark relative grid h-[30rem] content-end bg-cover bg-center px-6 pb-14 text-foreground sm:px-10" style={{ backgroundImage: `url("${NIGHT}")` }}>
            <p className="text-xs font-medium tracking-[0.18em] text-foreground/80 uppercase">Verbier, 2,100 m</p>
            <h2 className="mt-4 max-w-xl text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Quiet rooms above the cloud line.</h2>
            <div className="mt-7">
              <Button size="lg">Check availability</Button>
            </div>
          </div>
          <Rooms />
        </Page>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">The same bar, already scrolled: solid, with a hairline. The state starts from the real scroll position.</figcaption>
        <Page label="Page scrolled down" scrolled={390}>
          <NavbarTransparent className="sticky -mb-16" navLabel="Main, scrolled" brand={BRAND} items={ITEMS} actions={ACTIONS} currentHref="#rooms" />
          <div className="dark relative grid h-[30rem] content-end bg-cover bg-center px-6 pb-14 text-foreground sm:px-10" style={{ backgroundImage: `url("${NIGHT}")` }}>
            <h2 className="max-w-xl text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Quiet rooms above the cloud line.</h2>
          </div>
          <Rooms />
        </Page>
      </figure>

      <figure className="grid gap-3">
        <figcaption className="text-xs text-muted-foreground">tone=&quot;dark&quot; over a light hero: dark text at rest, and the page colour once solid.</figcaption>
        <Page label="Page with a light hero" height="h-[22rem]">
          <NavbarTransparent className="sticky -mb-16" tone="dark" navLabel="Main, dark tone" brand={BRAND} items={ITEMS} actions={<Button size="sm">Book a stay</Button>} />
          <div className="relative grid h-[22rem] content-end bg-cover bg-center px-6 pb-12 text-neutral-950 sm:px-10" style={{ backgroundImage: `url("${DAWN}")` }}>
            <h2 className="max-w-xl text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-4xl">Morning arrives early here.</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-700">Breakfast is served from half past six, to people already dressed for the mountain.</p>
          </div>
          <Rooms />
        </Page>
      </figure>
    </div>
  );
}
