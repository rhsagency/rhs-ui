"use client";

import { useEffect, useRef, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconBell, IconHome, IconSearch, IconUser } from "@rhs-ui/icons";
import { ChromeOffsets, useChromeOffsets } from "@rhs-ui/primitives/chrome-offsets";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

const SECTIONS = [
  { id: "co-sizing", title: "Sizing a pack", body: "Measure from the top of the hip bone to the C7 vertebra at the base of the neck. That length, not your height, decides the frame size. Between two sizes, choose the smaller and let the hip belt do the work." },
  { id: "co-fitting", title: "Fitting the harness", body: "Load the pack with about six kilos and tighten the hip belt first, so the weight sits on your pelvis and not your shoulders. The shoulder straps should wrap over without a gap, and the load lifters pull the top of the pack in at about forty-five degrees." },
  { id: "co-packing", title: "Packing for three days", body: "Heavy things go close to your spine and between your shoulder blades. Light things go at the bottom and at the top. Keep the rain shell, a snack and the map where you can reach them without taking the pack off." },
  { id: "co-repairs", title: "Repairs in the field", body: "A loose zip slider can be nudged back with pliers or the tip of a knife. A torn seam holds for a day with a strip of tape on both sides. Carry a few metres of cord and two spare buckles; they weigh nothing." },
  { id: "co-care", title: "Care and storage", body: "Empty it, open every pocket and let it dry in the shade. Never machine wash a framed pack. Store it loose, not compressed, with the straps undone so the foam keeps its shape." },
];

const TABS = [
  { label: "Home", icon: <IconHome /> },
  { label: "Search", icon: <IconSearch /> },
  { label: "Alerts", icon: <IconBell /> },
  { label: "Account", icon: <IconUser /> },
];

/** What the provider publishes, as the numbers a script would get from `useChromeOffsets`. */
function Readout(): React.JSX.Element {
  const { top, bottom } = useChromeOffsets();
  return (
    <div className="grid gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-6">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs" aria-label="The published variables">
        <dt className="text-muted-foreground">--chrome-top</dt>
        <dd className="tabular-nums">{top}px</dd>
        <dt className="text-muted-foreground">--chrome-bottom</dt>
        <dd className="tabular-nums">{bottom}px</dd>
      </dl>
      <p className="text-xs leading-relaxed text-pretty text-muted-foreground">The list on the left sticks at <code className="font-mono text-foreground">calc(var(--chrome-top) + 1.5rem)</code>, the headings carry the same offset as a scroll margin, and the page pads itself by both bars. Nothing here knows a height.</p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [narrow, setNarrow] = useState(false);
  const [banner, setBanner] = useState(true);
  const [tabs, setTabs] = useState(true);
  const scroller = useRef<HTMLDivElement>(null);
  // Start a little way down, so the pinned list is seen pinned: it only pins where it stands beside the article.
  useEffect(() => {
    const box = scroller.current;
    if (box && box.clientWidth >= 576) box.scrollTop = 130;
  }, []);
  return (
    <ChromeOffsets defaults={{ top: 57, bottom: 56 }} className="grid w-full max-w-3xl grid-cols-1 gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SegmentedControl
          label="Width of the window"
          value={narrow ? "narrow" : "wide"}
          onValueChange={(value) => setNarrow(value === "narrow")}
          options={[
            { value: "wide", label: "Wide" },
            { value: "narrow", label: "Narrow" },
          ]}
        />
        <div className="flex items-center gap-2.5">
          <Switch id="co-banner" checked={banner} onCheckedChange={setBanner} />
          <Label htmlFor="co-banner" className="text-sm">
            Announcement
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch id="co-tabs" checked={tabs} onCheckedChange={setTabs} />
          <Label htmlFor="co-tabs" className="text-sm">
            Tab bar
          </Label>
        </div>
      </div>

      {/* The transform makes this box the one the fixed bars are fixed to, so they stay inside the picture as they would inside a browser window. */}
      <div className="relative h-[28rem] max-w-full overflow-hidden rounded-xl border border-border bg-background [transform:translateZ(0)]" style={{ width: narrow ? "22rem" : "100%" }}>
        <ChromeOffsets.Top>
          <header className="fixed inset-x-0 top-0 z-20 border-b border-border bg-background">
            {banner ? (
              <p className="bg-foreground px-4 py-2 text-center text-xs text-background">
                Free shipping on orders over €75 this week.{" "}
                <a href="#co-details" className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-background/60">
                  Details
                </a>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-3">
              <p className="text-sm font-semibold tracking-[-0.02em]">kestrel</p>
              <nav aria-label="Sections" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <a href="#co-sizing" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Guides</a>
                <a href="#co-fitting" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Packs</a>
                <a href="#co-repairs" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Repairs</a>
                <a href="#co-care" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Care</a>
                <a href="#co-details" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Journal</a>
                <a href="#co-details" className="rounded-sm outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">Stockists</a>
              </nav>
            </div>
          </header>
        </ChromeOffsets.Top>

        <div ref={scroller} className="@container relative h-full overflow-y-auto scroll-smooth motion-reduce:scroll-auto">
          <div className="grid gap-x-8 gap-y-6 px-4 pt-[calc(var(--chrome-top)+1.5rem)] pb-[calc(var(--chrome-bottom)+1.5rem)] @xl:grid-cols-[10rem_minmax(0,1fr)]">
            <nav aria-label="On this page" className="@xl:sticky @xl:top-[calc(var(--chrome-top)+1.5rem)] @xl:self-start">
              <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
              <ul className="grid gap-0.5 border-s border-border text-sm">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="-ms-px block border-s border-transparent py-1 ps-3 text-muted-foreground outline-none hover:border-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <article className="min-w-0">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-balance">The field guide to light packing</h2>
              <p id="co-details" className="mt-1.5 text-sm text-muted-foreground">Written by the people who test every pack in the rain, on the same trail, before it goes on sale.</p>
              {SECTIONS.map((section) => (
                <section key={section.id} id={section.id} className="mt-7 scroll-mt-[calc(var(--chrome-top)+1.5rem)]">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">{section.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </article>
          </div>
        </div>

        {tabs ? (
          <ChromeOffsets.Bottom>
            <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background">
              {TABS.map((tab) => (
                <a key={tab.label} href="#co-sizing" className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [&_svg]:size-5">
                  {tab.icon}
                  {tab.label}
                </a>
              ))}
            </nav>
          </ChromeOffsets.Bottom>
        ) : null}
      </div>

      <Readout />
    </ChromeOffsets>
  );
}
