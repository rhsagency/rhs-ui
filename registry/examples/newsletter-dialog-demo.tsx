"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { NewsletterDialog, NewsletterPanel, type NewsletterDismissal, type NewsletterStorage } from "@rhs-ui/application/newsletter-dialog";
import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const MANNERS = ["Never on the first page view of a session", "Never while someone is typing in a field", "Away for 30 days after a dismissal or a sign-up", "Escape, the corner button and No thanks are as easy as Subscribe"] as const;

const INCENTIVE = "One email a week: what we shipped, what we learned, and the one link worth your Friday. No spam.";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [kept, setKept] = useState<number | null>(null);
  const [how, setHow] = useState("");
  const tries = useRef(0);

  // `storage` is a pair of functions, so a page decides where "not again" is remembered. This one keeps it in memory for the demo.
  const storage: NewsletterStorage = { read: () => kept, write: (at) => setKept(at) };

  const subscribe = async (email: string) => {
    await wait(900);
    // The first sign-up fails, to show that the address stays and where the message goes.
    if (tries.current++ === 0) throw new Error(`We could not reach the mail service for ${email}. Try again in a moment.`);
  };

  return (
    <div className="grid w-full gap-10">
      <Case caption="On a real page this opens by itself, after a delay or a depth of scrolling, and only when it is welcome. Here you open it by hand (trigger=&quot;manual&quot;) and it still remembers a dismissal with the storage you give it. The first sign-up fails.">
        <div className="grid gap-5 rounded-xl border border-border bg-card px-4 py-5 text-card-foreground shadow-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-6">
          <ul className="m-0 grid list-none gap-2 p-0 text-sm">
            {MANNERS.map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background [&_svg]:size-3">
                  <IconCheck strokeWidth={2.5} />
                </span>
                <span className="leading-snug">{line}</span>
              </li>
            ))}
          </ul>
          <Button onClick={() => setOpen(true)}>Open the dialog</Button>
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {kept === null ? "Nothing remembered yet." : `${how || "Dismissed"}: remembered, so it stays away for the next 30 days.`}
        </p>
        <NewsletterDialog
          trigger="manual"
          open={open}
          onOpenChange={setOpen}
          incentive={INCENTIVE}
          storage={storage}
          suppressDays={30}
          onDismiss={(reason: NewsletterDismissal) => setHow(reason === "decline" ? "No thanks" : reason === "escape" ? "Escape" : reason === "outside" ? "A click outside" : "The corner button")}
          onSubscribe={subscribe}
        />
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="The invitation. One field, a plain line about privacy, and two answers that are equally easy to find.">
          <Surface>
            <NewsletterPanel standalone incentive={INCENTIVE} onSubscribe={() => undefined} />
          </Surface>
        </Case>
        <Case caption="Failed. The address stays, the reason is above it, and Subscribe is still the one button to press.">
          <Surface>
            <Sent>
              <NewsletterPanel standalone incentive={INCENTIVE} defaultEmail="ana@northwind.dev" onSubscribe={() => Promise.reject(new Error("We could not reach the mail service for ana@northwind.dev. Try again in a moment."))} />
            </Sent>
          </Surface>
        </Case>
        <Case caption="Subscribed. The form is replaced in place, and a line runs down while the window waits to close itself.">
          <Surface>
            <Sent>
              <NewsletterPanel standalone incentive={INCENTIVE} defaultEmail="ana@northwind.dev" closeAfterMs={600_000} onSubscribe={() => Promise.resolve()} />
            </Sent>
          </Surface>
        </Case>
        <Case caption="Without an incentive it falls back to a plain description, and the words are all yours to change with labels.">
          <Surface>
            <NewsletterPanel standalone onSubscribe={() => undefined} labels={{ title: "Join the Halcyon letter" }} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

/**
 * Presses the panel's own button once it is on screen, so a preview shows the state after a press. Nobody pressed it, so the page keeps
 * its place and its focus: wherever the panel moves focus while it settles (the button, the address after a failure, the confirmation
 * after a success) is let go of again, until somebody touches the preview.
 */
function Sent({ children }: { children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const letGo = (event: FocusEvent) => (event.target as HTMLElement).blur();
    const stop = () => element.removeEventListener("focusin", letGo);
    element.addEventListener("focusin", letGo);
    const timer = window.setTimeout(stop, 1000);
    document.addEventListener("pointerdown", stop, { capture: true, once: true });
    document.addEventListener("keydown", stop, { capture: true, once: true });
    element.querySelector("form")?.requestSubmit();
    return () => {
      window.clearTimeout(timer);
      stop();
      document.removeEventListener("pointerdown", stop, { capture: true });
      document.removeEventListener("keydown", stop, { capture: true });
    };
  }, []);
  return <div ref={box}>{children}</div>;
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}
