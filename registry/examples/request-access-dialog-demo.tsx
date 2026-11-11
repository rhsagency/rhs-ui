"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { RequestAccessDialog, RequestAccessPanel, type AccessOwner, type RequestLevel } from "@rhs-ui/application/request-access-dialog";
import { IconLock } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// A fixed "now" keeps "Already requested 2 hours ago" the same on every load. In an app, leave `now` out and the words read the browser's clock.
const NOW = Date.parse("2026-11-10T11:30:00Z");
const HOURS_AGO = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString();

const OWNER: AccessOwner = { name: "Maya Okafor", email: "maya@halcyon.example" };

const LEVELS: readonly RequestLevel[] = [
  { id: "view", label: "View", description: "Read the plan and follow its changes" },
  { id: "edit", label: "Edit", description: "Change the plan and leave comments" },
];

const SIGNED_IN = "dana@kestrel.example";

export default function Demo(): React.JSX.Element {
  const [since, setSince] = useState<string | undefined>(undefined);
  const [note, setNote] = useState("");
  const refused = useRef(false);

  // The first attempt fails, to show that the note is still in the form and the button says Try again.
  async function request({ level, message }: { level: string; message: string }) {
    await wait(1000);
    if (!refused.current) {
      refused.current = true;
      throw new Error("The request service is busy. Try again in a minute.");
    }
    setSince(new Date(NOW).toISOString());
    setNote(`Asked for ${level === "edit" ? "Edit" : "View"} access${message ? ` with a note of ${message.length} characters` : ""}.`);
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl gap-12">
        <Case caption="What someone sees on a page they cannot open. The button opens the dialog: the first attempt fails and keeps the note, the second works, and asking again after that is recognised.">
          <section aria-labelledby="request-access-demo-title" className="flex flex-col items-center rounded-xl border border-border bg-card px-6 py-12 text-center text-card-foreground shadow-xs">
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-5">
              <IconLock />
            </span>
            <h2 id="request-access-demo-title" className="mt-5 text-xl font-medium tracking-[-0.02em]">
              You need access to Q4 launch plan
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Maya Okafor owns this document. Ask for access and she gets an email.</p>
            <div className="mt-6">
              <RequestAccessDialog
                trigger={<Button>{since ? "Ask again" : "Request access"}</Button>}
                resourceName="Q4 launch plan"
                owner={OWNER}
                levels={LEVELS}
                signedInAs={SIGNED_IN}
                pendingSince={since}
                now={NOW}
                onRequest={request}
              />
            </div>
            <p aria-live="polite" className="mt-4 min-h-4 text-xs text-muted-foreground">
              {note}
            </p>
          </section>
        </Case>

        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="First time. Who gets it, as whom you ask, the level as a short radio group and an optional note with a counter.">
            <Surface>
              <RequestAccessPanel standalone resourceName="Q4 launch plan" owner={OWNER} levels={LEVELS} signedInAs={SIGNED_IN} onRequest={() => undefined} />
            </Surface>
          </Case>
          <Case caption="Already asked 2 hours ago. The notice says so and the button offers to send it again.">
            <Surface>
              <RequestAccessPanel standalone resourceName="Q4 launch plan" owner={OWNER} levels={LEVELS} signedInAs={SIGNED_IN} pendingSince={HOURS_AGO(2)} now={NOW} showOwnerEmail onRequest={() => undefined} />
            </Surface>
          </Case>
          <Case caption="Failed. The note is still there, nothing has to be retyped, and the button now says Try again.">
            <Surface>
              <Sent note="I am joining the launch review on Thursday and need to read the plan.">
                <RequestAccessPanel
                  standalone
                  resourceName="Q4 launch plan"
                  owner={OWNER}
                  levels={LEVELS}
                  signedInAs={SIGNED_IN}
                  onRequest={() => Promise.reject(new Error("The request service is busy. Try again in a minute."))}
                />
              </Sent>
            </Surface>
          </Case>
          <Case caption="Sent. The form gives way to who got it and what happens next. After a press by hand, focus moves to Close.">
            <Surface>
              <Sent>
                <RequestAccessPanel standalone resourceName="Q4 launch plan" owner={OWNER} levels={LEVELS} signedInAs={SIGNED_IN} onRequest={() => Promise.resolve()} />
              </Sent>
            </Surface>
          </Case>
        </div>
      </div>
    </div>
  );
}

/** Types a note, if it is given, and presses the panel's own button once it is on screen, so a preview shows the state after a press. */
function Sent({ note, children }: { note?: string; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const area = box.current?.querySelector("textarea");
    if (area && note) {
      // React listens to the native value setter, so the note is set the way a browser would set it.
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set?.call(area, note);
      area.dispatchEvent(new Event("input", { bubbles: true }));
    }
    // One frame later, so the note is in the form's state when the button is pressed.
    const frame = requestAnimationFrame(() => box.current?.querySelector("form")?.requestSubmit());
    return () => cancelAnimationFrame(frame);
  }, [note]);
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
