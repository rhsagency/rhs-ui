"use client";

import { useRef, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconArrowUp, IconBell, IconHome, IconMessage, IconSearch, IconUser } from "@rhs-ui/icons";
import { ChromeOffsets } from "@rhs-ui/primitives/chrome-offsets";
import { FloatingStack, type FloatingStackCorner } from "@rhs-ui/primitives/floating-stack";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const NOTES = [
  { title: "Doors and coffee", body: "Four hundred people queued in the rain for a flat white, and nobody complained. The terrace heaters were the best purchase of the year." },
  { title: "Keynote: building for the slowest phone", body: "Lena Vos showed the same checkout on a three-year-old handset over a train connection. Every extra script cost a second, and every second cost a sale. The room went very quiet." },
  { title: "Workshop: layout that survives a translation", body: "German headings run a third longer than English ones, and Finnish buttons longer still. The groups that built with grids and gaps instead of fixed widths finished with time to spare." },
  { title: "Lunch on the terrace", body: "Pumpkin soup, rye bread and a table of people comparing their analytics dashboards. Somebody found out that their best-selling product was a typo." },
  { title: "Panel: what we would delete", body: "Carousels, three kinds of modal, the cookie wall that asks twice and every popup that appears before you have read a word. The applause was louder than for the keynote." },
  { title: "Closing", body: "Next year's summit is in Rotterdam on the second Saturday of November. Tickets go on sale in March, and the early ones are cheaper." },
];

const TABS = [
  { label: "Home", icon: <IconHome /> },
  { label: "Search", icon: <IconSearch /> },
  { label: "Alerts", icon: <IconBell /> },
  { label: "Account", icon: <IconUser /> },
];

const WIDGET = "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium shadow-sm outline-none transition-[background-color,border-color] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** A rough drawing of the on-screen keyboard, so the demo can show the stack riding above one. The keys share the row, so it fits a window of any width. */
function FakeKeyboard({ height }: { height: number }): React.JSX.Element {
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-30 grid content-start gap-2 border-t border-border bg-muted px-1.5 pt-2" style={{ height }}>
      {[10, 9, 7].map((count) => (
        <div key={count} className="flex justify-center gap-1">
          {Array.from({ length: count }, (_, index) => (
            <span key={index} className="h-9 max-w-9 min-w-0 flex-1 rounded-md bg-background shadow-xs" />
          ))}
        </div>
      ))}
      <div className="mx-auto flex w-full max-w-[24.75rem] gap-1">
        <span className="h-9 min-w-0 flex-[1.2] rounded-md bg-background/70 shadow-xs" />
        <span className="h-9 min-w-0 flex-[5] rounded-md bg-background shadow-xs" />
        <span className="h-9 min-w-0 flex-[1.6] rounded-md bg-background/70 shadow-xs" />
      </div>
    </div>
  );
}

const KEYBOARD = 190;

export default function Demo(): React.JSX.Element {
  const [edge, setEdge] = useState<"bottom" | "top">("bottom");
  const [side, setSide] = useState<"end" | "start">("end");
  const [bar, setBar] = useState(true);
  const corner: FloatingStackCorner = `${edge}-${side}`;
  const [keyboard, setKeyboard] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <ChromeOffsets defaults={{ top: 0, bottom: 0 }} className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 px-4 py-8 sm:px-6">
      <div>
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Three widgets, one corner</h2>
        <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">A chat launcher, a back-to-top button and a feedback tab. They keep an even gap, and the page behind the gaps stays clickable. Switch on the tab bar or the keyboard and the stack lifts clear of it; with both on, it clears whichever reaches higher.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <SegmentedControl
          label="Edge"
          value={edge}
          onValueChange={(value) => setEdge(value === "top" ? "top" : "bottom")}
          options={[
            { value: "bottom", label: "Bottom" },
            { value: "top", label: "Top" },
          ]}
        />
        <SegmentedControl
          label="Side"
          value={side}
          onValueChange={(value) => setSide(value === "start" ? "start" : "end")}
          options={[
            { value: "end", label: "Right" },
            { value: "start", label: "Left" },
          ]}
        />
        <div className="flex items-center gap-2.5">
          <Switch id="fs-bar" checked={bar} onCheckedChange={setBar} />
          <Label htmlFor="fs-bar" className="text-sm">
            Tab bar
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch id="fs-keyboard" checked={keyboard} onCheckedChange={setKeyboard} />
          <Label htmlFor="fs-keyboard" className="text-sm">
            Keyboard
          </Label>
        </div>
      </div>

      {/* The transform makes this box the one the fixed elements are fixed to, so they stay inside the picture as they would inside a browser window. */}
      <div className="relative h-[30rem] overflow-hidden rounded-xl border border-border bg-background [transform:translateZ(0)]">
        {/* A scroll container with nothing to focus in it is out of reach for a keyboard in some browsers, so it takes focus itself. */}
        <div
          ref={scroller}
          role="region"
          aria-label="Article"
          tabIndex={0}
          className="relative h-full overflow-y-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          {/* A centred column, so the left and the top corners are free of text on a wide window. */}
          <article className="mx-auto max-w-[26rem] px-6 py-8">
            <p className="text-xs font-medium text-muted-foreground">Recap</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-balance">Kestrel Summit, the day in six moments</h3>
            {NOTES.map((note) => (
              <section key={note.title} className="mt-7">
                <h4 className="text-base font-semibold tracking-[-0.02em]">{note.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{note.body}</p>
              </section>
            ))}
          </article>
        </div>

        {bar ? (
          <ChromeOffsets.Bottom as="nav" aria-label="App" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-border bg-background">
            {TABS.map((tab) => (
              <a key={tab.label} href="#fs-top" className="flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [&_svg]:size-5">
                {tab.icon}
                {tab.label}
              </a>
            ))}
          </ChromeOffsets.Bottom>
        ) : null}
        {keyboard ? <FakeKeyboard height={KEYBOARD} /> : null}

        <FloatingStack corner={corner} respectChrome keyboardInset={keyboard ? KEYBOARD : undefined} label="Page actions">
          <button type="button" className={cn(WIDGET, "h-11 bg-primary px-4 text-primary-foreground hover:bg-primary/90")}>
            <IconMessage className="size-4" />
            Chat with us
          </button>
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => scroller.current?.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            className={cn(WIDGET, "size-11 border border-border bg-background hover:bg-muted")}
          >
            <IconArrowUp className="size-4" />
          </button>
          <button type="button" className={cn(WIDGET, "h-9 border border-border bg-background px-3.5 text-xs hover:bg-muted")}>
            Feedback
          </button>
        </FloatingStack>
      </div>
    </ChromeOffsets>
  );
}
