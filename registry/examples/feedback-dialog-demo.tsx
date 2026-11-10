"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { FeedbackDialog, FeedbackPanel, type FeedbackValues } from "@rhs-ui/application/feedback-dialog";
import { IconMessage } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Facts that go along with the message, shown to the sender in plain words before it is sent. */
const METADATA = { Page: "app.northwind.dev/settings/billing", Version: "4.12.0", "Signed in as": "ana@northwind.dev" };

const PRIVACY = (
  <>
    We only use your address to answer this message. <a href="#privacy">Read how we handle it.</a>
  </>
);

const DRAFT = {
  type: "problem",
  message: "The invoice download on the billing page fails with a blank tab whenever I pick a date range that crosses a year end. I tried Safari and Firefox on two machines and it happens every time, so it is probably not my browser or my network. It worked fine until last week.",
  email: "ana@northwind.dev",
};

export default function Demo(): React.JSX.Element {
  const [sent, setSent] = useState("Nothing sent yet.");
  const tries = useRef(0);

  // The first attempt fails, to show that the text stays and the button says "Try again".
  const submit = async ({ type, message }: FeedbackValues) => {
    await wait(1000);
    if (tries.current++ === 0) throw new Error("The feedback service did not answer. Your message is still here.");
    setSent(`Sent as ${type}, ${message.length} characters.`);
  };

  return (
    <div className="grid w-full gap-10">
      <Case caption="The Feedback button of a header. The kind of feedback changes the hint in the field, the counter appears only near the limit, and the page address and version are listed before anything is sent. The first send fails; close the dialog by accident and what you typed is still there.">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-xs sm:px-5">
          <span className="text-sm font-semibold tracking-[-0.02em]">Northwind</span>
          <FeedbackDialog
            trigger={
              <Button variant="outline" size="sm">
                <IconMessage />
                Feedback
              </Button>
            }
            metadata={METADATA}
            defaultEmail="ana@northwind.dev"
            privacyNote={PRIVACY}
            maxLength={600}
            onSubmit={submit}
          />
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {sent}
        </p>
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="Typing. Problem is chosen, so the field asks what went wrong. Few characters are left, so the counter shows; it is silent until then.">
          <Surface>
            <FeedbackPanel standalone metadata={METADATA} privacyNote={PRIVACY} maxLength={280} defaultDraft={DRAFT} onSubmit={() => undefined} />
          </Surface>
        </Case>
        <Case caption="Failed. The message and the address are still there, the reason is above them, and the button offers a retry.">
          <Surface>
            <Sent>
              <FeedbackPanel
                standalone
                metadata={METADATA}
                privacyNote={PRIVACY}
                maxLength={280}
                defaultDraft={DRAFT}
                onSubmit={() => Promise.reject(new Error("The feedback service did not answer. Your message is still here."))}
              />
            </Sent>
          </Surface>
        </Case>
        <Case caption="Sent. A thank-you that says where replies go, and a line that runs down while the window waits to close itself. It holds still while keyboard focus is on its button.">
          <Surface>
            <Sent>
              <FeedbackPanel standalone defaultDraft={DRAFT} closeAfterMs={600_000} onSubmit={() => Promise.resolve()} />
            </Sent>
          </Surface>
        </Case>
        <Case caption="No email field. askEmail={false} leaves it out, for a product that already knows who is writing, and the form is only the kind and the message.">
          <Surface>
            <FeedbackPanel standalone askEmail={false} onSubmit={() => undefined} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

/**
 * Presses the panel's own button once it is on screen, so a preview shows the state after a press. Nobody pressed it, so the page keeps
 * its place and its focus: wherever the panel moves focus while it settles (the button, the message after a failure, the thank-you
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
