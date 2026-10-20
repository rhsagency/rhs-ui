"use client";

import { useEffect, useState, type ReactNode } from "react";

import { InsertBetweenButton } from "@rhs-ui/primitives/insert-between-button";

interface Item {
  id: string;
  title: string;
  detail: string;
}

const STEPS: Item[] = [
  { id: "welcome", title: "Welcome email", detail: "Sent as soon as someone signs up" },
  { id: "tour", title: "Product tour", detail: "After 2 days, if they have not opened the app" },
  { id: "checkin", title: "Check-in from the team", detail: "After 5 days, from a real person" },
];

const PAGES: Item[] = [
  { id: "intro", title: "Intro", detail: "" },
  { id: "details", title: "Details", detail: "" },
  { id: "review", title: "Review", detail: "" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A copy of the list with a new item at `index`. */
function insertAt(list: Item[], index: number, item: Item): Item[] {
  return [...list.slice(0, index), item, ...list.slice(index)];
}

export default function Demo(): React.JSX.Element {
  const [steps, setSteps] = useState(STEPS);
  const [pages, setPages] = useState(PAGES);
  const [fresh, setFresh] = useState<string | null>(null);
  const [made, setMade] = useState(0);

  // The callback moves focus to the new item, so a keyboard user lands where they added it.
  useEffect(() => {
    if (fresh) document.getElementById(`insert-demo-${fresh}`)?.focus();
  }, [fresh, steps, pages]);

  const addStep = (index: number) => {
    const id = `step-${made}`;
    setMade((count) => count + 1);
    setSteps((list) => insertAt(list, index, { id, title: "Untitled step", detail: "Choose when it is sent" }));
    setFresh(id);
  };
  const addPage = (index: number) => {
    const id = `page-${made}`;
    setMade((count) => count + 1);
    setPages((list) => insertAt(list, index, { id, title: `Page ${list.length + 1}`, detail: "" }));
    setFresh(id);
  };

  return (
    <div className="grid w-full max-w-xl gap-9">
      <Example caption="Hover a gap, or Tab to it, and a plus appears. The first one is pinned open here. Enter inserts a step and focus follows it.">
        <ol className="w-full">
          {steps.map((step, position) => {
            const next = steps[position + 1];
            return (
              <li key={step.id}>
                <article
                  id={`insert-demo-${step.id}`}
                  tabIndex={-1}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground tabular-nums">{position + 1}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{step.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">{step.detail}</p>
                  </div>
                </article>
                {next ? <InsertBetweenButton index={position + 1} label="Insert step here" between={[step.title, next.title]} alwaysVisible={position === 0} onInsert={addStep} /> : null}
              </li>
            );
          })}
        </ol>
      </Example>

      <Example caption="Between items in a row, pinned open: this is how it looks on a touch screen, where there is no hover">
        <div className="relative flex w-full items-stretch overflow-x-auto py-1">
          {pages.map((page, position) => {
            const next = pages[position + 1];
            return (
              <div key={page.id} className="flex items-stretch">
                <div
                  id={`insert-demo-${page.id}`}
                  tabIndex={-1}
                  className="flex min-w-16 items-center justify-center rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium shadow-xs outline-none sm:min-w-20 sm:px-4 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {page.title}
                </div>
                {next ? <InsertBetweenButton orientation="vertical" alwaysVisible index={position + 1} label="Insert page here" between={[page.title, next.title]} onInsert={addPage} /> : null}
              </div>
            );
          })}
        </div>
      </Example>
    </div>
  );
}
