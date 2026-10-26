"use client";

import { useEffect, useState, type ReactNode } from "react";

import { RecentSearchesField } from "@rhs-ui/primitives/recent-searches-field";

const HISTORY = ["kestrel pricing", "marit de vries", "invoice 2041", "export to csv", "halcyon onboarding"];

/** True until the page is first used. A panel that starts open needs room under its field, so that the preview shows it whole; the first press or Tab closes it, and the room goes with it. */
function useReserved(): boolean {
  const [reserved, setReserved] = useState(true);
  useEffect(() => {
    let pressing = false;
    let timer: number | undefined;
    const release = () => setReserved(false);
    // A press that is still going on keeps the page where it is: a button that moved away under the pointer would never get its click.
    const down = () => {
      pressing = true;
    };
    const up = () => {
      pressing = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(release, 300);
    };
    // Focus that moves by itself (Tab, a screen reader) has no pointer to wait for.
    const focus = () => {
      if (!pressing) release();
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointerup", up, true);
    document.addEventListener("pointercancel", up, true);
    document.addEventListener("focusin", focus, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointerup", up, true);
      document.removeEventListener("pointercancel", up, true);
      document.removeEventListener("focusin", focus, true);
    };
  }, []);
  return reserved;
}

/** Holds the room a panel that starts open needs, until the first press or Tab. After that the panel overlays what is below it, as it does on a real page. */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const reserved = useReserved();
  return <div className={`transition-[min-height] duration-200 ease-out motion-reduce:transition-none ${reserved ? className : "min-h-0"}`}>{children}</div>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function HelpCentre(): React.JSX.Element {
  // The field keeps nothing: the history lives here, and could as well live in local storage or on a server.
  const [recent, setRecent] = useState<string[]>(HISTORY);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Search the Northwind help centre</h2>
        <p className="text-xs text-muted-foreground">Arrows move, Enter searches, Delete removes one.</p>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-y border-border py-3 text-xs text-muted-foreground">
        <span>onSearch</span>
        <code className="font-mono text-[0.6875rem] text-foreground">{last === null ? "nothing yet" : JSON.stringify(last)}</code>
      </p>
      {/* The panel opens over what is below the field, so there is room for it until the page is first used. */}
      <Reserve className="min-h-[18rem]">
        <RecentSearchesField label="Search help articles" placeholder="Search help articles" recent={recent} onRecentChange={setRecent} onSearch={setLast} max={5} defaultOpen placement="bottom" />
      </Reserve>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [other, setOther] = useState<string[]>(HISTORY);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: search, remove one, or clear them all">
          <HelpCentre />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Typing narrows the list to what begins with it">
          <Reserve className="min-h-[6.5rem]">
            <RecentSearchesField label="Search the archive" placeholder="Search the archive" recent={other} onRecentChange={setOther} defaultValue="ma" defaultOpen placement="bottom" />
          </Reserve>
        </Example>
        <Example caption="No history: one quiet line, not an empty box">
          <Reserve className="min-h-[6.5rem]">
            <RecentSearchesField label="Search the changelog" placeholder="Search the changelog" recent={[]} defaultOpen placement="bottom" />
          </Reserve>
        </Example>
        <Example caption="Disabled">
          <RecentSearchesField label="Search" placeholder="Search" recent={HISTORY} disabled />
        </Example>
      </div>
    </div>
  );
}
