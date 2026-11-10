"use client";

import { useState, type ReactNode } from "react";

import { IconClose, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { StoryProgress } from "@rhs-ui/primitives/story-progress";

/** Three pictures drawn with shapes, so they follow the theme. */
function ArtDark(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="grid aspect-[16/10] grid-cols-2 overflow-hidden rounded-xl border border-border">
      <div className="grid content-center gap-2 bg-background px-5">
        <span className="h-2 w-2/3 rounded-full bg-foreground/80" />
        <span className="h-2 w-full rounded-full bg-foreground/15" />
        <span className="h-2 w-4/5 rounded-full bg-foreground/15" />
      </div>
      <div className="grid content-center gap-2 bg-foreground px-5">
        <span className="h-2 w-2/3 rounded-full bg-background/80" />
        <span className="h-2 w-full rounded-full bg-background/20" />
        <span className="h-2 w-4/5 rounded-full bg-background/20" />
      </div>
    </div>
  );
}

function ArtSearch(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="grid aspect-[16/10] content-center gap-2.5 rounded-xl border border-border bg-muted/50 px-5">
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs text-muted-foreground">
        <IconSearch size={14} />
        invoice march
      </div>
      {[0.9, 0.7, 0.55].map((width) => (
        <div key={width} className="flex items-center gap-2.5">
          <span className="size-6 shrink-0 rounded-md bg-foreground/10" />
          <span className="h-2 rounded-full bg-foreground/15" style={{ width: `${width * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function ArtExport(): React.JSX.Element {
  return (
    <div aria-hidden="true" className="grid aspect-[16/10] content-center gap-4 rounded-xl border border-border bg-muted/50 px-5">
      {[
        ["Before", 0.86],
        ["Now", 0.28],
      ].map(([name, share]) => (
        <div key={name} className="grid gap-1.5">
          <span className="text-xs text-muted-foreground">{name}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-foreground/10">
            <span className="block h-full rounded-full bg-foreground" style={{ width: `${Number(share) * 100}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}

interface Update {
  title: string;
  text: string;
  art: ReactNode;
}

const UPDATES: readonly Update[] = [
  { title: "Dark mode, finally", text: "Every screen follows your system setting, and the exports keep their own colours.", art: <ArtDark /> },
  { title: "Search that keeps up", text: "Results appear as you type, across invoices, customers and notes.", art: <ArtSearch /> },
  { title: "Exports in a third of the time", text: "A 40,000 row export now finishes in 9 seconds instead of 31.", art: <ArtExport /> },
  { title: "That is the whole release", text: "Fourteen smaller fixes are in the changelog, with the three you asked for most.", art: null },
];

function WhatsNew(): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const update = UPDATES[index] ?? UPDATES[0]!;
  return (
    <StoryProgress
      label="What's new in Halcyon 4.2"
      count={UPDATES.length}
      index={index}
      onIndexChange={setIndex}
      duration={[5000, 5000, 6000, 9000]}
      onComplete={() => setIndex(0)}
      className="h-[28rem] overflow-hidden rounded-2xl border border-border bg-card text-card-foreground"
    >
      <div className="grid h-full content-start gap-4 px-5 pt-14 pb-5">
        <p className="text-xs font-medium text-muted-foreground tabular-nums">New in 4.2</p>
        {update.art}
        <div className="grid gap-1.5">
          <h3 className="text-xl leading-tight font-semibold tracking-[-0.03em]">{update.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{update.text}</p>
        </div>
        {index === UPDATES.length - 1 ? (
          <Button type="button" className="mt-1 w-fit" onClick={() => setIndex(0)}>
            Watch it again
          </Button>
        ) : null}
      </div>
    </StoryProgress>
  );
}

interface Place {
  name: string;
  where: string;
  line: string;
}

const PLACES: readonly Place[] = [
  { name: "Kestrel Ridge", where: "Day 1, Dolomites", line: "Up before the light, and the valley was still full of cloud." },
  { name: "Rifugio Lagazuoi", where: "Day 2, 2,752 m", line: "Lunch above the tree line. Four hours up, forty minutes down." },
  { name: "Cinque Torri", where: "Day 3, the last pass", line: "We stayed until the wind sent us home." },
];

function Trail(): React.JSX.Element {
  const [index, setIndex] = useState(0);
  const [closed, setClosed] = useState(false);
  const place = PLACES[index] ?? PLACES[0]!;
  // Closing a story is the host's job: here it leaves a quiet panel with a way back.
  if (closed) {
    return (
      <div className="grid h-[28rem] place-content-center justify-items-center gap-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 text-center">
        <div className="grid gap-1">
          <p className="text-sm font-medium">Story closed</p>
          <p className="max-w-[14rem] text-sm leading-relaxed text-muted-foreground">The Dolomites trip is out of the way until you want to see it again.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          // The close button that had focus is gone, so focus goes to the way back.
          autoFocus
          onClick={() => {
            setIndex(0);
            setClosed(false);
          }}
        >
          Replay story
        </Button>
      </div>
    );
  }
  return (
    <StoryProgress
      tone="media"
      label="Dolomites trip"
      count={PLACES.length}
      index={index}
      onIndexChange={setIndex}
      onComplete={() => setIndex(0)}
      duration={4000}
      actions={
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close story" onClick={() => setClosed(true)} className="shrink-0 text-white hover:bg-white/20 hover:text-white focus-visible:border-white/70 focus-visible:ring-white/40">
          <IconClose />
        </Button>
      }
      className="h-[28rem] overflow-hidden rounded-2xl bg-black text-white"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-0 overflow-hidden">
        <span className="absolute top-[22%] right-[14%] size-14 rounded-full bg-white/15" />
        <span className="absolute -bottom-[22%] -left-[10%] h-[62%] w-[90%] rounded-[50%] bg-white/10" />
        <span className="absolute -right-[20%] -bottom-[30%] h-[58%] w-[100%] rounded-[50%] bg-white/[0.07]" style={{ transform: `translateX(${index * -8}%)` }} />
      </div>
      <div className="relative grid h-full content-between px-5 pt-14 pb-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-white/15 text-xs font-medium">
            MO
          </span>
          <div className="grid gap-0.5">
            <p className="text-sm leading-none font-medium">Mara Okafor</p>
            <p className="text-xs text-white/70">{place.where}</p>
          </div>
        </div>
        <div className="grid gap-2">
          <h3 className="text-3xl leading-none font-semibold tracking-[-0.04em]">{place.name}</h3>
          <p className="max-w-[16rem] text-sm leading-relaxed text-white/80">{place.line}</p>
        </div>
      </div>
    </StoryProgress>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-4">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-10 gap-y-12 md:grid-cols-2">
      <Example caption="A what's new panel. Press the right third to go on and the left third to go back; hold anywhere to pause. Left and Right work from the keyboard, and Pause is a real button.">
        <WhatsNew />
      </Example>
      <Example caption="tone=media: white segments for a photo or a dark slide, with a close button in actions that hides the story, and a way back. The last slide ends, and onComplete starts it over.">
        <Trail />
      </Example>
    </div>
  );
}
