"use client";

import { useState, type ReactNode } from "react";

import { ReviewsToWrite, type ReviewItem } from "@rhs-ui/commerce/reviews-to-write";
import { Toaster } from "@rhs-ui/primitives/toast";

const pic = (bg: string, body: string) =>
  "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='${bg}'/>${body}</svg>`);

const APRON = pic("#ebe7e0", "<path d='M46 34c0-16 28-16 28 0' fill='none' stroke='#7a7060' stroke-width='4' stroke-linecap='round'/><path d='M40 34h40l9 9-3 55H34l-3-55z' fill='#b9b09f'/><rect x='46' y='68' width='28' height='18' rx='3' fill='none' stroke='#7a7060' stroke-opacity='.55' stroke-width='2' stroke-dasharray='4 3'/>");
const PAN = pic("#e4e3df", "<circle cx='54' cy='62' r='32' fill='#3b3e43'/><circle cx='54' cy='62' r='26' fill='#2b2d31'/><rect x='82' y='58' width='30' height='8' rx='4' fill='#7a6650'/>");
const TOWELS = pic("#e6e9e3", "<rect x='30' y='74' width='60' height='22' rx='3' fill='#cfd6c9'/><rect x='27' y='54' width='66' height='22' rx='3' fill='#dde2d7'/><rect x='24' y='34' width='72' height='22' rx='3' fill='#eceee8'/><path d='M24 42h72M24 49h72' stroke='#8d9a87' stroke-width='2'/><path d='M27 62h66M27 69h66' stroke='#8d9a87' stroke-width='2' opacity='.8'/>");
const ROLL = pic("#dcdfe4", "<rect x='24' y='38' width='72' height='46' rx='8' fill='#3b4252'/><rect x='34' y='50' width='52' height='6' rx='3' fill='#d8dee9'/><rect x='34' y='62' width='52' height='6' rx='3' fill='#d8dee9'/><path d='M96 52h10' stroke='#9aa3b2' stroke-width='3' stroke-linecap='round'/>");

const ITEMS: readonly ReviewItem[] = [
  { id: "apron", name: "Linen bib apron", variant: "Stone, medium", image: APRON, deliveredAt: "2026-10-22", href: "#apron", reviewHref: "#review-apron" },
  { id: "pan", name: "Carbon steel pan, 28 cm", variant: "Pre-seasoned", image: PAN, deliveredAt: "2026-10-20", href: "#pan" },
  { id: "towels", name: "Tea towels, set of 3", variant: "Sage stripe", image: TOWELS, deliveredAt: "2026-10-19", href: "#towels", rating: 4 },
  { id: "roll", name: "Waxed canvas knife roll", variant: "Slate, six pockets", image: ROLL, deliveredAt: "2026-10-17", href: "#roll", reviewHref: "#review-roll" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, note, children }: { caption: string; note?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
      {note ? (
        <p role="status" className="text-xs text-muted-foreground tabular-nums">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [log, setLog] = useState("Tap a star to answer, and Change if it was a slip. Or Skip, and use Undo in the toast.");
  return (
    <div className="mx-auto grid w-full max-w-3xl min-w-0 gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <Example caption="Four deliveries from last week: one was already rated in the order email" note={log}>
        <ReviewsToWrite
          title="How did these go?"
          items={ITEMS}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          onRate={async (id, rating) => {
            await wait(300);
            setLog(`onRate("${id}", ${rating})`);
          }}
          onSkip={(id) => setLog(`onSkip("${id}")`)}
          onUnskip={(id) => setLog(`onUnskip("${id}")`)}
          onWrite={(id, rating) => setLog(`onWrite("${id}"${rating ? `, ${rating}` : ""})`)}
        />
      </Example>
      <Example caption="When nothing is left to review">
        <ReviewsToWrite items={[]} headingAs="h3" locale="en-GB" />
      </Example>
      <Toaster />
    </div>
  );
}
