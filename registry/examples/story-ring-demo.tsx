"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { StoryRing, StoryRingRow, type StoryRingItem } from "@rhs-ui/primitives/story-ring";
import { cn } from "@/lib/utils";

/* The portraits are drawn as SVG, so the demo needs no files. */
const PEOPLE = [
  { bg: "#d8d2c4", skin: "#c99a7a", hair: "#3b2f2a", top: "#6b7a6e", style: "short" },
  { bg: "#c9d3da", skin: "#e2b99a", hair: "#2a2a2e", top: "#44505c", style: "long" },
  { bg: "#dcd0cf", skin: "#8d5e45", hair: "#1e1a19", top: "#8a6f68", style: "bun" },
  { bg: "#d2d6c6", skin: "#f0c8a8", hair: "#7a5a3c", top: "#556057", style: "short" },
  { bg: "#d6d0dc", skin: "#b98366", hair: "#2b211d", top: "#5a5568", style: "long" },
  { bg: "#cfd8d2", skin: "#d9a98a", hair: "#4a3a30", top: "#3f5249", style: "bun" },
] as const;

const HAIR = {
  short: "M33 41c0-13 6-20 15-20s15 7 15 20c-4-7-9-10-15-10s-11 3-15 10z",
  long: "M31 52c-2-18 3-31 17-31s19 13 17 31c-2-3-3-8-3-12-4-6-9-8-14-8s-10 2-14 8c0 4-1 9-3 12z",
  bun: "M33 41c0-13 6-20 15-20s15 7 15 20c-4-7-9-10-15-10s-11 3-15 10zM48 14a7 7 0 1 1 0 14 7 7 0 0 1 0-14z",
} as const;

function portrait(index: number): string {
  const p = PEOPLE[index % PEOPLE.length] as (typeof PEOPLE)[number];
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><rect width='96' height='96' fill='${p.bg}'/><path d='M8 96c0-21 17-31 40-31s40 10 40 31z' fill='${p.top}'/><rect x='41' y='54' width='14' height='16' rx='6' fill='${p.skin}'/><ellipse cx='48' cy='43' rx='15' ry='17' fill='${p.skin}'/><path d='${HAIR[p.style]}' fill='${p.hair}'/></svg>`,
    )
  );
}

const START: StoryRingItem[] = [
  { id: "maya", name: "Maya", src: portrait(0), state: "live" },
  { id: "tomas", name: "Tomás", src: portrait(1), state: "unseen" },
  { id: "lena", name: "Lena", src: portrait(2), state: "unseen" },
  { id: "idris", name: "Idris", state: "unseen" },
  { id: "priya", name: "Priya", src: portrait(4), state: "seen" },
  { id: "jonas", name: "Jonas", src: portrait(3), state: "seen" },
  { id: "amara", name: "Amara", src: portrait(5), state: "unseen" },
  { id: "noor", name: "Noor", state: "seen" },
  { id: "sven", name: "Sven", src: portrait(1), state: "unseen" },
  { id: "kofi", name: "Kofi", src: portrait(4), state: "unseen" },
  { id: "hana", name: "Hana", src: portrait(2), state: "seen" },
  { id: "ingrid", name: "Ingrid", src: portrait(3), state: "unseen" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const card = "grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5";

export default function Demo(): React.JSX.Element {
  const [stories, setStories] = useState(START);
  const [message, setMessage] = useState("Press a ring. A story you open turns thin and muted; a live one stays dashed.");
  const [mine, setMine] = useState<"none" | "unseen">("none");

  return (
    <div className="grid w-full max-w-xl grid-cols-1 gap-9">
      <Example caption="Four states, told apart by weight, dashes and a word, never by colour alone. The picture is the same size in all four.">
        <div className={cn(card, "grid-cols-2 justify-items-center gap-y-6 sm:grid-cols-4")}>
          {(
            [
              ["Maya", "unseen", "A new story", 0],
              ["Tomás", "seen", "Already seen", 1],
              ["Lena", "live", "Live now", 2],
              ["Idris", "none", "No story", undefined],
            ] as const
          ).map(([name, state, note, face]) => (
            <div key={name} className="grid justify-items-center gap-1">
              <StoryRing name={name} state={state} size="lg" src={face === undefined ? undefined : portrait(face)} showName />
              <p className="text-center text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </div>
      </Example>

      <Example caption="A row that scrolls and snaps ring by ring. With a mouse, arrows appear at the ends that can still be scrolled.">
        <div className={cn(card, "gap-3 px-0 sm:px-0")}>
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5">
            <h2 className="text-sm font-medium tracking-[-0.01em]">Stories</h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStories(START);
                setMine("none");
                setMessage("Back to the start.");
              }}
            >
              Reset
            </Button>
          </div>
          <StoryRingRow
            items={stories}
            you={{
              name: "Sam Rivera",
              state: mine,
              onAdd: () => {
                setMine("unseen");
                setMessage("Opening the camera: your story is posted.");
              },
              onOpen: () => setMessage("Opening your own story."),
            }}
            onOpen={(item) => {
              setMessage(item.state === "live" ? `${item.name} is live. Joining the broadcast.` : `Opening ${item.name}'s story.`);
              setStories((all) => all.map((one) => (one.id === item.id && one.state === "unseen" ? { ...one, state: "seen" } : one)));
            }}
          />
          <p role="status" className="px-4 text-xs text-muted-foreground sm:px-5">
            {message}
          </p>
        </div>
      </Example>

      <Example caption="Three sizes, with the name inside the button so the ring and its name are one target">
        <div className={cn(card, "grid-cols-3 items-end justify-items-center")}>
          <StoryRing name="Tomás" size="sm" src={portrait(1)} showName />
          <StoryRing name="Lena" size="md" src={portrait(2)} showName />
          <StoryRing name="Amara" size="lg" src={portrait(5)} showName />
        </div>
      </Example>
    </div>
  );
}
