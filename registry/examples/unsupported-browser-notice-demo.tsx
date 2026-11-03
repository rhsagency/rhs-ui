"use client";

import { useState, type ReactNode } from "react";

import { UnsupportedBrowserNotice, type BrowserRequirement, type SupportedBrowser } from "@rhs-ui/application/unsupported-browser-notice";
import { forgetContinue } from "@rhs-ui/application/unsupported-browser-notice/support";
import { Button } from "@rhs-ui/primitives/button";

const BROWSERS: readonly SupportedBrowser[] = [
  { name: "Chrome", minVersion: "111", href: "https://www.google.com/chrome/" },
  { name: "Microsoft Edge", minVersion: "111", href: "https://www.microsoft.com/edge/download" },
  { name: "Firefox", minVersion: "110", href: "https://www.mozilla.org/firefox/new/" },
  { name: "Safari", minVersion: "16.4", href: "https://support.apple.com/en-us/102665" },
];

// What the app really needs, written as data. Nothing here fails in a current browser, so the third example renders nothing.
const REAL_CHECKS: readonly BrowserRequirement[] = [
  { label: "CSS grid", test: { css: "display: grid" } },
  { label: "Container queries", test: { css: "container-type: inline-size" } },
  { label: "IntersectionObserver", test: { api: "IntersectionObserver" } },
];

// A browser cannot be made to lack a feature, so these checks are forced to fail. In an app they are CSS.supports() calls like the ones above.
const MISSING_CHECKS: readonly BrowserRequirement[] = [
  { label: "CSS grid", test: { css: "display: grid" } },
  { label: "Container queries", test: () => false },
  { label: "The View Transitions API", test: () => false },
];

const SAFARI_15 = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15";

const KEYS = { missing: "demo:browser-notice:missing", old: "demo:browser-notice:old", fine: "demo:browser-notice:fine" } as const;

// The room each notice takes once the page is live, at three widths of its window. Until then (the server's HTML, the first paint) the slot holds it, so nothing below it moves when the notice appears. They are floors: a notice that is taller just pushes.
const HOLD = {
  missing: "min-h-[30.5rem] @xl:min-h-[24rem] @min-[45rem]:min-h-[21.5rem]",
  old: "min-h-[30.5rem] @xl:min-h-[24rem] @min-[45rem]:min-h-[20.25rem]",
} as const;

/** Holds the room of a notice that has not appeared yet, and lets go of it when the notice is gone: the empty wrapper then drops out of the window's grid, so no gap is left behind. */
function Slot({ hold, gone, children }: { hold: string; gone: boolean; children: ReactNode }): React.JSX.Element {
  return <div className={gone ? "contents" : hold}>{children}</div>;
}

/** A small app to put the notice in, the way it sits at the top of a page. */
function AppWindow({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="@container overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Schedule</span>
          <span>Members</span>
          <span className="font-medium text-foreground">Reports</span>
        </span>
      </div>
      <div className="grid gap-5 px-4 py-5 sm:px-6 sm:py-6">
        {children}
        <div aria-hidden="true" className="grid gap-2.5">
          <div className="h-3 w-1/3 rounded-full bg-muted" />
          <div className="h-2.5 w-2/3 rounded-full bg-muted/70" />
          <div className="h-2.5 w-1/2 rounded-full bg-muted/70" />
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // A round remounts the notices, which read the session again.
  const [round, setRound] = useState(0);
  const [continued, setContinued] = useState(0);
  const [gone, setGone] = useState({ missing: false, old: false });

  function replay() {
    for (const key of Object.values(KEYS)) forgetContinue(key);
    setContinued(0);
    setGone({ missing: false, old: false });
    setRound((count) => count + 1);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <Case caption="Something the app needs is missing. The checks here are forced to fail so the notice can be seen. The list names only what failed, and the browsers link to their official pages.">
        <AppWindow>
          <Slot hold={HOLD.missing} gone={gone.missing}>
            <UnsupportedBrowserNotice
              key={`missing-${round}`}
              storageKey={KEYS.missing}
              requires={MISSING_CHECKS}
              browsers={BROWSERS}
              onContinue={() => {
                setContinued((count) => count + 1);
                setGone((current) => ({ ...current, missing: true }));
              }}
              labels={{ title: "This browser is missing features Halcyon needs" }}
            />
          </Slot>
        </AppWindow>
      </Case>

      <Case caption="The browser is recognised and older than the version on the list. The notice names it, and its card says which version it has. This one also has a close button, which hides it for this page view only.">
        <AppWindow>
          <Slot hold={HOLD.old} gone={gone.old}>
            <UnsupportedBrowserNotice
              key={`old-${round}`}
              storageKey={KEYS.old}
              requires={REAL_CHECKS}
              browsers={BROWSERS}
              userAgent={SAFARI_15}
              dismissible
              onContinue={() => {
                setContinued((count) => count + 1);
                setGone((current) => ({ ...current, old: true }));
              }}
              onDismiss={() => setGone((current) => ({ ...current, old: true }))}
              labels={{ title: "Your browser is out of date" }}
            />
          </Slot>
        </AppWindow>
      </Case>

      <Case caption="Every check passes in your browser, so the notice renders nothing and takes no space: there is no gap above the page, and nothing moves when it is done checking.">
        <AppWindow>
          <UnsupportedBrowserNotice key={`fine-${round}`} storageKey={KEYS.fine} requires={REAL_CHECKS} browsers={BROWSERS} />
        </AppWindow>
      </Case>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5">
        <Button variant="ghost" size="sm" className="-ml-3" onClick={replay}>
          Show the notices again
        </Button>
        <p className="text-xs text-muted-foreground tabular-nums">
          Continue anyway is kept for this browser session. onContinue ran {continued} {continued === 1 ? "time" : "times"}.
        </p>
      </div>
    </div>
  );
}
