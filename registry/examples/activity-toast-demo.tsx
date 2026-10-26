"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconFileText, IconMessage } from "@rhs-ui/icons";
import { toastActivity } from "@rhs-ui/primitives/activity-toast";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Toaster } from "@rhs-ui/primitives/toast";

/** A head and shoulders in two greys, drawn here so the demo needs no pictures. */
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='${background}'/><circle cx='32' cy='26' r='11' fill='${figure}'/><path d='M9 64c2-15 12-21 23-21s21 6 23 21z' fill='${figure}'/></svg>`,
  );

interface Person {
  name: string;
  image?: string;
}

const MAYA: Person = { name: "Maya Okafor", image: portrait("#d9d9d9", "#6b6b6b") };
const TOMAS: Person = { name: "Tomás Silva", image: portrait("#bdbdbd", "#4a4a4a") };
const PRIYA: Person = { name: "Priya Raman" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SECTIONS = [
  { title: "Hero", text: "Simple pricing that grows with your studio.", comments: 2 },
  { title: "Plans", text: "Starter €9, Studio €29 and Agency €79, billed monthly or yearly.", comments: 5 },
  { title: "FAQ", text: "Can I change plans later? Yes, at any time, and we prorate the difference.", comments: 0 },
] as const;

function Doc({ opened }: { opened: string | null }): React.JSX.Element {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted">
            <IconFileText size={16} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium tracking-[-0.01em]">Pricing page</h2>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Draft, edited 2 minutes ago</p>
          </div>
        </div>
        <AvatarGroup role="group" aria-label="Also here: Maya, Tomás and Priya">
          {[MAYA, TOMAS, PRIYA].map((person) => (
            <Avatar key={person.name} size="sm">
              {person.image ? <AvatarImage src={person.image} alt="" /> : null}
              <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      </header>
      <ul className="divide-y divide-border">
        {SECTIONS.map((section) => (
          <li key={section.title} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="grid min-w-0 gap-1">
              <h3 className="text-sm font-medium">{section.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{section.text}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
              <IconMessage size={14} aria-hidden="true" />
              {section.comments}
              <span className="sr-only"> comments</span>
            </span>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="min-h-10 border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
        {opened ? `View pressed: opened ${opened}.` : "Press View on a toast and it opens what happened."}
      </p>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const started = useRef(false);
  const timers = useRef(new Set<number>());

  const view = (what: string) => () => setOpened(what);
  const comment = (actor: Person, target: string, at?: number) =>
    toastActivity({ actor, action: "commented on", target, at, group: `comments:${target}`, mergedLabel: "{count} new comments on {target}", onView: view(target) });

  // The page opens with two toasts on screen: one comment from a few minutes ago, and three at once, merged.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const own = timers.current;
    comment(MAYA, "Pricing page", Date.now() - 2 * 60_000);
    comment(TOMAS, "Hero");
    comment(PRIYA, "Hero");
    comment(MAYA, "Hero");
    return () => own.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function burst() {
    [TOMAS, PRIYA, MAYA].forEach((actor, index) => {
      const timer = window.setTimeout(() => comment(actor, "Plans"), index * 450);
      timers.current.add(timer);
    });
  }

  return (
    <div className="mx-auto grid min-h-dvh w-full max-w-5xl grid-cols-1 content-center gap-x-10 gap-y-8 px-6 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
      <Example caption="A shared document: what teammates do shows up as a toast, not a badge">
        <Doc opened={opened} />
      </Example>
      <Example caption="Simulate your team, then watch the bottom of the screen">
        <div className="grid gap-3 rounded-xl border border-border bg-card p-5 shadow-xs">
          <Button variant="outline" onClick={() => comment(MAYA, "Pricing page")}>
            Maya comments on the page
          </Button>
          <Button variant="outline" onClick={burst}>
            Three comments in a row
          </Button>
          <Button
            variant="outline"
            onClick={() => toastActivity({ actor: TOMAS, action: "edited", target: "FAQ", group: "edits:faq", onView: view("FAQ") })}
          >
            Tomás edits the FAQ
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              toastActivity({ actor: { name: "You", self: true }, action: "commented on", target: "Pricing page" });
              setSkipped(true);
            }}
          >
            You comment
          </Button>
          <p aria-live="polite" className="min-h-8 text-xs leading-relaxed text-muted-foreground">
            {skipped ? "Nothing is shown for your own actions, so no toast came up." : "Events with the same group within 8 seconds merge into one toast and count up in place."}
          </p>
        </div>
      </Example>
      <Toaster />
    </div>
  );
}
