"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { RecommendationReasonPanel, RecommendationReasonPopover, type RecommendationReason, type Sponsorship } from "@rhs-ui/application/recommendation-reason-popover";
import { IconFootprints, IconMountain, IconNewspaper } from "@rhs-ui/icons";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

interface Entry {
  id: string;
  label: string;
  title: string;
  meta: string;
  icon: ReactNode;
  reasons: readonly RecommendationReason[];
  sponsored?: Sponsorship;
}

const FEED: readonly Entry[] = [
  {
    id: "shoes",
    label: "Recommended for you",
    title: "Kestrel TR 3 trail running shoes",
    meta: "Kestrel · €129 · Free returns",
    icon: <IconFootprints />,
    reasons: [
      { kind: "activity", label: "You viewed Trail running shoes yesterday", detail: "Based on what you looked at in the last 7 days" },
      { kind: "popular", label: "Popular in Utrecht this week" },
      { kind: "similar", label: "People who bought Halcyon trail socks also bought these" },
    ],
  },
  {
    id: "layers",
    label: "Sponsored",
    title: "Merino base layers, 20% off this week",
    meta: "Northwind Outfitters · northwind.example",
    icon: <IconMountain />,
    sponsored: { by: "Northwind Outfitters" },
    reasons: [
      { kind: "interest", label: "You follow topics about hiking and running", detail: "You can change these in your interests" },
      { kind: "location", label: "Shown to people in the Netherlands" },
    ],
  },
  {
    id: "taper",
    label: "From people you follow",
    title: "How to taper before a half marathon",
    meta: "Halcyon Journal · 6 min read",
    icon: <IconNewspaper />,
    reasons: [
      { kind: "following", label: "You follow Halcyon Journal" },
      { kind: "interest", label: "You read three other articles about running this month" },
    ],
  },
];

const AD = FEED[1];
const CONTEXT_AD: Sponsorship = { by: "Kestrel", note: "This ad sits next to articles about running, whoever reads them. It was not chosen using anything about you." };

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState<string | null>("taper");
  const [hidden, setHidden] = useState<readonly string[]>([]);
  const refused = useRef(false);
  const feed = useRef<HTMLUListElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  // Where the focus goes once a row has gone: the button of the row after it, else the one before it, else the heading.
  const heir = useRef<string | null>(null);

  const shown = FEED.filter((entry) => !hidden.includes(entry.id));
  const hide = (id: string) => async () => {
    await wait(600);
    // The feed lets go of the item a moment after the button has said so, so the confirmation can be read.
    setTimeout(() => {
      const rows = Array.from(feed.current?.children ?? []);
      const at = rows.findIndex((row) => row.getAttribute("data-id") === id);
      heir.current = (rows[at + 1] ?? rows[at - 1])?.getAttribute("data-id") ?? "";
      setHidden((list) => [...list, id]);
      // The panel went with its row: the stage does not keep room for it.
      setOpen((current) => (current === id ? null : current));
    }, 1600);
  };
  useEffect(() => {
    if (heir.current === null) return;
    const id = heir.current;
    heir.current = null;
    const button = id ? feed.current?.querySelector<HTMLElement>(`[data-id="${id}"] [data-slot="recommendation-reason-trigger"]`) : null;
    (button ?? heading.current)?.focus();
  }, [hidden]);
  const less = async () => {
    await wait(600);
  };

  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Case caption="Next to each item sits one small button, Why am I seeing this? The ad says so first and who paid; the reasons are plain sentences; the buttons confirm in place. Escape closes the panel and the focus returns to the button.">
        <div className={open ? "min-h-[36rem] max-sm:min-h-[42rem]" : undefined}>
          <section aria-labelledby="reason-feed" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="reason-feed" ref={heading} tabIndex={-1} className="text-sm font-semibold tracking-[-0.01em] outline-none">
                Because you like trail running
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">
                {shown.length} {shown.length === 1 ? "item" : "items"}
              </p>
            </div>
            {shown.length ? (
              <ul ref={feed} className="divide-y divide-border">
                {shown.map((entry) => (
                  <li key={entry.id} data-id={entry.id} className="flex items-start gap-3.5 px-4 py-3.5">
                    <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground [&_svg]:size-6">
                      {entry.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{entry.label}</p>
                      <p className="mt-0.5 text-sm leading-snug font-medium tracking-[-0.01em] text-pretty">{entry.title}</p>
                      <p className="mt-1 text-[0.8125rem] text-muted-foreground">{entry.meta}</p>
                    </div>
                    <RecommendationReasonPopover
                      reasons={entry.reasons}
                      sponsored={entry.sponsored}
                      onLessLikeThis={less}
                      onHide={hide(entry.id)}
                      settingsHref="#personalisation"
                      open={open === entry.id}
                      onOpenChange={(next) => setOpen((current) => (next ? entry.id : current === entry.id ? null : current))}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground">
                <p>Nothing left to show. Hidden items stay hidden.</p>
                <button
                  type="button"
                  onClick={() => setHidden([])}
                  className="shrink-0 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  Bring them back
                </button>
              </div>
            )}
          </section>
        </div>
      </Case>

      <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="An ad: it says it is one before anything else, names who paid and what that means, and gives the reasons it reached this person. Hide this fails the first time here, so you can see how a refusal reads.">
          <Surface>
            <RecommendationReasonPanel
              reasons={AD?.reasons ?? []}
              sponsored={AD?.sponsored}
              onLessLikeThis={less}
              onHide={async () => {
                await wait(600);
                if (!refused.current) {
                  refused.current = true;
                  throw new Error("The ad service did not answer.");
                }
              }}
              settingsHref="#personalisation"
            />
          </Surface>
        </Case>
        <Case caption="A contextual ad with nothing to change: it is not based on the person, so there are no buttons to offer, and the panel says that in one line.">
          <Surface>
            <RecommendationReasonPanel reasons={[{ kind: "context", label: "Shown next to articles about running", detail: "Everyone who reads this page sees it" }]} sponsored={CONTEXT_AD} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The popover a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">{children}</div>;
}
