"use client";

import { useRef, useState } from "react";

import { IconList } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { TableOfContents } from "@rhs-ui/primitives/table-of-contents";
import { TocRail, type TocRailItem } from "@rhs-ui/primitives/toc-rail";

interface Section {
  id: string;
  title: string;
  level: 2 | 3;
  text: readonly string[];
}

const SECTIONS: readonly Section[] = [
  {
    id: "intro",
    title: "Why a quiet system",
    level: 2,
    text: [
      "Most interface libraries are loud by default. Every card has a shadow, every button a gradient, every list item a coloured badge. The result looks busy before anyone has read a word.",
      "We started Halcyon with the opposite rule: nothing on the screen may carry meaning twice. A heading is larger or it is bold, not both. A status is a word with an icon, not a word, an icon and a colour.",
    ],
  },
  {
    id: "grid",
    title: "Start with the grid",
    level: 2,
    text: [
      "Every measurement in the system is a multiple of four pixels. That sounds rigid, and it is the most freeing decision in the whole project, because it removes the question of whether a gap should be 13 or 14.",
      "Components sit on the grid, but text does not have to. Line heights are set so that two lines of body copy and one of caption fill exactly four rows.",
    ],
  },
  {
    id: "spacing",
    title: "The spacing scale",
    level: 3,
    text: [
      "Eight steps are enough: 4, 8, 12, 16, 24, 32, 48 and 64. We tried a ninth for a month and never once missed it when it was gone.",
    ],
  },
  {
    id: "type",
    title: "The type scale",
    level: 3,
    text: [
      "Four sizes carry the product: 12 for meta, 14 for interface text, 16 for reading and 24 for page titles. Anything larger belongs on a marketing page, not in the app.",
    ],
  },
  {
    id: "colour",
    title: "Colour is a signal",
    level: 2,
    text: [
      "The palette is black, white and the greys between them. Colour appears in exactly three places: destructive actions, a failed field and a success that needs to be noticed. Everywhere else it would be decoration.",
      "This makes the rare red mean something. A page with one red button is a page where the reader knows which button is dangerous before they read it.",
    ],
  },
  {
    id: "motion",
    title: "Motion with a reason",
    level: 2,
    text: [
      "An animation has to answer a question the reader would otherwise ask: where did that go, what just changed, is it working. If it answers none of them, it is removed.",
      "Most of ours last 150 to 250 milliseconds and use the same curve, so a menu, a dialog and a tooltip feel like the same hand made them.",
    ],
  },
  {
    id: "reduced",
    title: "Reduced motion",
    level: 3,
    text: [
      "When the reader asks for less motion, slides become instant changes and nothing moves by itself. The interface is complete without the animation, which is how we know the animation was never carrying the meaning.",
    ],
  },
  {
    id: "shipping",
    title: "Shipping it",
    level: 2,
    text: [
      "We released the first version to three teams with a single instruction: build something real and tell us where the system got in the way. Eleven of the first fourteen reports were missing states, not missing components.",
      "So the second release added no new components. It added the empty, loading and error state of the twenty we had.",
    ],
  },
  {
    id: "again",
    title: "What we would do again",
    level: 2,
    text: [
      "Write the rules down before the components. Build the boring ones first. Let someone outside the team use it in anger before calling it done.",
      "And keep the list of things the system will never do. It is shorter than the list of things it does, and it is the part people trust.",
    ],
  },
];

const ITEMS: readonly TocRailItem[] = SECTIONS.map(({ id, title, level }) => ({ id, title, level }));

/** For a phone, where the rail is hidden: a button at the top of the article that opens the same headings. Choosing a heading jumps there and closes the list. */
function MobileContents(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const chose = useRef(false);
  return (
    <div className="mb-8 lg:hidden">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <IconList />
            On this page
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72"
          // Focus goes back to the button when it closes, which would scroll the page back up and undo the jump; after choosing a heading it stays where the jump put it.
          onCloseAutoFocus={(event) => {
            if (!chose.current) return;
            chose.current = false;
            event.preventDefault();
          }}
        >
          {/* The list has no callback for a chosen heading, so a click on one of its links is caught on the way up. */}
          <div
            onClick={(event) => {
              if (!(event.target instanceof Element) || !event.target.closest("a")) return;
              chose.current = true;
              setOpen(false);
            }}
          >
            <TableOfContents items={SECTIONS.map(({ id, title, level }) => ({ id, title, level }))} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 py-12 sm:px-6">
      {/* The gutters keep 16rem each, the room an opened rail needs, and the article column gives way instead: on a narrower preview the rail never covers the text. */}
      <div className="grid gap-x-8 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,40rem)_minmax(16rem,1fr)]">
        <aside className="max-lg:hidden" aria-label="Held open">
          <p className="mb-4 max-w-[13rem] text-xs leading-relaxed text-muted-foreground">Held open with <code className="font-mono">open</code>: this is what hover, or Tab, shows. The marks stay put and the titles open towards the article.</p>
          <TocRail items={ITEMS} side="left" activeId="colour" defaultOpen title="Contents, held open" />
        </aside>
        <article className="min-w-0">
          <MobileContents />
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">Design notes</p>
          <h2 className="mt-3 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] text-balance">Notes on building a quiet design system</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">What we kept, what we cut and what we would do again, one year into Halcyon.</p>
          <div className="mt-12 grid gap-12">
            {SECTIONS.map((section) =>
              section.level === 2 ? (
                <section key={section.id} className="grid gap-4">
                  <h3 id={section.id} className="scroll-mt-24 text-2xl font-semibold tracking-[-0.03em]">
                    {section.title}
                  </h3>
                  {section.text.map((paragraph) => (
                    <p key={paragraph} className="text-[0.9375rem] leading-[1.75]">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ) : (
                <section key={section.id} className="-mt-5 grid gap-3">
                  <h4 id={section.id} className="scroll-mt-24 text-lg font-semibold tracking-[-0.02em]">
                    {section.title}
                  </h4>
                  {section.text.map((paragraph) => (
                    <p key={paragraph} className="text-[0.9375rem] leading-[1.75]">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ),
            )}
          </div>
        </article>
        <aside className="max-lg:hidden" aria-label="Contents">
          <p className="mb-4 ml-auto max-w-[13rem] text-right text-xs leading-relaxed text-muted-foreground">Scroll the article, then point at the marks. Each one is a heading, and the dark one is where you are.</p>
          <TocRail items={ITEMS} />
        </aside>
      </div>
    </div>
  );
}
