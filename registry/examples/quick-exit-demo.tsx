"use client";

import { useState, type ReactNode } from "react";

import { IconArrowRight, IconKeyboard, IconMessageCircle, IconMessageText, IconPhone, IconTrash } from "@rhs-ui/icons";
import { QuickExit } from "@rhs-ui/application/quick-exit";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";

export default function Demo(): React.JSX.Element {
  const [left, setLeft] = useState(false);

  if (left) return <NeutralSite onReturn={() => setLeft(false)} />;

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* First in the page, so the first Tab reaches it. In your app leave onExit out: the visitor is then sent to the neutral site for real. */}
      <QuickExit
        href="https://weather.example/eindhoven"
        onExit={(event) => {
          event.preventDefault();
          setLeft(true);
        }}
      />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            H
          </span>
          {/* The exit button sits over the top right corner of every page: on the narrowest phones the name is only said, not drawn, so the two never overlap. */}
          <p className="text-[0.9375rem] font-semibold tracking-[-0.02em] max-[359px]:sr-only">Haven Line</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-12 px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-4">
          <h2 className="max-w-xl text-3xl leading-[1.1] font-semibold tracking-[-0.04em] text-balance sm:text-4xl">Help for anyone who is afraid at home</h2>
          <p className="max-w-xl text-base text-pretty text-muted-foreground">Free, private and open every hour of every day. You choose how to reach us, and nobody is told that you did.</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          <Way icon={<IconPhone />} title="Call" detail="0800 555 0142" note="Free from any phone" />
          <Way icon={<IconMessageText />} title="Text" detail="07700 900 123" note="Replies within minutes" />
          <Way icon={<IconMessageCircle />} title="Chat" detail="Start a chat" note="Open 24 hours" action />
        </ul>

        <section aria-labelledby="demo-safe" className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
          <div className="grid gap-1">
            <h3 id="demo-safe" className="text-base font-semibold tracking-[-0.02em]">
              Leaving quickly
            </h3>
            <p className="text-sm text-muted-foreground">If someone walks in, you can leave this site in a second. Try it: the page is replaced by an ordinary weather site.</p>
          </div>
          <ul className="grid gap-3.5 text-sm">
            <Fact icon={<IconArrowRight />}>
              <strong className="font-medium">Leave this site now</strong> stays in the corner of every page, on a phone too.
            </Fact>
            <Fact icon={<IconKeyboard />}>
              Press <Kbd>Esc</Kbd> three times within a second, from anywhere on the page, even in a form.
            </Fact>
            <Fact icon={<IconTrash />}>
              The page is blanked first and then replaced, so <strong className="font-medium">Back</strong> does not bring it back. A browser still keeps its history, so it helps to know how to clear it.
            </Fact>
          </ul>
        </section>
      </main>
    </div>
  );
}

function Way({ icon, title, detail, note, action = false }: { icon: ReactNode; title: string; detail: string; note: string; action?: boolean }): React.JSX.Element {
  return (
    <li className="grid content-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <span className="grid size-9 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-[1.125rem]">{icon}</span>
      <div className="grid gap-0.5">
        <p className="text-sm font-semibold">{title}</p>
        {action ? (
          <Button variant="outline" size="sm" className="mt-1 w-fit">
            {detail}
          </Button>
        ) : (
          <p className="text-base font-medium tracking-[-0.01em] tabular-nums">{detail}</p>
        )}
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <li className="flex items-start gap-3">
      <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="min-w-0 text-pretty">{children}</span>
    </li>
  );
}

/** What the visitor sees after the exit: an ordinary site, nothing to do with the one they left. */
function NeutralSite({ onReturn }: { onReturn: () => void }): React.JSX.Element {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <p className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-muted px-4 py-2.5 text-xs text-muted-foreground">
        <span>Preview: the visitor has left. In your app the browser is sent to the neutral site for real, and Back does not return.</span>
        <Button variant="outline" size="sm" onClick={onReturn}>
          Return to the demo
        </Button>
      </p>
      <div className="mx-auto grid max-w-3xl gap-8 px-4 py-12 sm:px-6">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">Eindhoven, today</p>
          <p className="text-6xl font-semibold tracking-[-0.05em] tabular-nums">11°</p>
          <p className="text-base text-muted-foreground">Light rain, wind from the west</p>
        </div>
        <ul className="grid grid-cols-5 gap-2 text-center text-sm">
          {FORECAST.map(([day, high, low]) => (
            <li key={day} className="grid gap-1 rounded-lg border border-border bg-card px-2 py-3">
              <span className="text-xs text-muted-foreground">{day}</span>
              <span className="font-medium tabular-nums">{high}°</span>
              <span className="text-xs text-muted-foreground tabular-nums">{low}°</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const FORECAST: readonly [string, number, number][] = [
  ["Wed", 12, 6],
  ["Thu", 10, 5],
  ["Fri", 13, 7],
  ["Sat", 15, 8],
  ["Sun", 14, 8],
];
