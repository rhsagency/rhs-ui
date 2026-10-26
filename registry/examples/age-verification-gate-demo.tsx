"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { IconArrowUpRight, IconCheck } from "@rhs-ui/icons";
import { AgeVerificationGate, type AgeVerificationGateProps } from "@rhs-ui/commerce/age-verification-gate";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

const BRAND = <span className="text-xs font-medium tracking-[0.22em] uppercase">Halcyon Spirits</span>;

/** What an example sets on the gate itself. How the frame hosts it, and what it does when the visitor answers, belongs to the frame. */
type GateExample = Omit<AgeVerificationGateProps, "presentation" | "autoFocus" | "className" | "onVerify" | "onDecline" | "leaveHref">;

/** A caption over what it is about. Side by side, two examples share their rows, so what they show starts at the same height whatever the captions say. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:row-span-2 md:grid-rows-subgrid">
      <p className="text-xs text-muted-foreground">{caption}</p>
      <div className="grid min-w-0 content-start gap-3">{children}</div>
    </div>
  );
}

interface Outcome {
  kind: "passed" | "left";
  /** The call the gate made, as the page would receive it. */
  call: string;
}

/** What the shop does once the visitor has answered: a quiet line, and a way to try the example again. */
function Result({ outcome, tall, onAgain }: { outcome: Outcome; tall: string; onAgain: () => void }): React.JSX.Element {
  const id = useId();
  const again = useRef<HTMLButtonElement>(null);
  // The button the visitor pressed has just gone, so focus goes to the next thing to press.
  useEffect(() => {
    again.current?.focus();
  }, []);
  const passed = outcome.kind === "passed";
  return (
    <div className={cn("grid place-items-center bg-muted/30 px-4 py-10", tall)}>
      <div className="grid justify-items-center gap-5 text-center">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full border border-border bg-card">
          {passed ? <IconCheck className="size-4" /> : <IconArrowUpRight className="size-4" />}
        </span>
        <div id={id} className="grid gap-1.5">
          <p className="text-sm font-medium">{passed ? "Visitor passed" : "Visitor left the site"}</p>
          <p className="font-mono text-xs text-muted-foreground">{outcome.call}</p>
        </div>
        <Button ref={again} type="button" variant="outline" size="sm" aria-describedby={id} onClick={onAgain}>
          Start again
        </Button>
      </div>
    </div>
  );
}

/** One page gate in a frame. When the visitor passes or leaves, the frame says so and offers to start again, so an example can be tried as often as you like. */
function GateFrame({ tall, ...gate }: GateExample & { tall: string }): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {outcome ? (
        <Result
          outcome={outcome}
          tall={tall}
          onAgain={() => {
            setOutcome(null);
            setRound((count) => count + 1);
          }}
        />
      ) : (
        <AgeVerificationGate
          key={round}
          {...gate}
          presentation="page"
          autoFocus={round > 0}
          className={tall}
          onVerify={(birthdate, remember) => setOutcome({ kind: "passed", call: `onVerify(${birthdate ? `"${birthdate}"` : "undefined"}, ${remember})` })}
          onDecline={() => setOutcome({ kind: "left", call: "onDecline()" })}
        />
      )}
    </div>
  );
}

/** The gate as a dialog over a shop. It has no trigger of its own, so it hands focus back to the button that opened it. */
function DialogExample(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [log, setLog] = useState("The dialog cannot be closed with Escape or a click outside: it can only be answered.");
  const opener = useRef<HTMLButtonElement>(null);
  return (
    <Example caption="As a dialog over the shop: focus lands on the first field, nothing behind it can be reached until it is answered, and focus goes back to the button">
      <div className="grid justify-items-start gap-3 rounded-xl border border-dashed border-border p-6">
        <p className="text-sm text-muted-foreground">Halcyon Spirits sells whisky, gin and rum. Visitors meet the gate before they see a single bottle.</p>
        <Button
          ref={opener}
          type="button"
          onClick={() => {
            // Safari does not focus a button when it is clicked: do it, so the gate knows where to give focus back to.
            opener.current?.focus();
            setAttempt((count) => count + 1);
            setOpen(true);
          }}
        >
          Open the gate
        </Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {log}
      </p>
      <AgeVerificationGate
        key={attempt}
        presentation="dialog"
        mode="confirm"
        open={open}
        title="This shop sells alcohol"
        brand={BRAND}
        rememberLabel="Remember me for 30 days"
        helpHref="#age-policy"
        locale="en-GB"
        onVerify={(_, remember) => {
          setOpen(false);
          setLog(`onVerify(undefined, ${remember}): the dialog closed, focus is back on the button and the shop is reachable`);
        }}
        onDecline={() => {
          setOpen(false);
          setLog("onDecline(): the visitor chose to leave, and focus is back on the button");
        }}
      />
    </Example>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl min-w-0 gap-12 px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid min-w-0 gap-x-8 gap-y-12 md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-y-3">
        <Example caption="As a page, asking for a date of birth: the order of the fields follows the locale">
          <GateFrame
            tall="min-h-[44rem]"
            title="This shop sells alcohol"
            brand={BRAND}
            rememberLabel="Remember me on this device for 30 days"
            helpHref="#age-policy"
            note="We only check your age. We do not keep your date of birth."
            now="2026-10-26"
            timeZone="Europe/Amsterdam"
            locale="en-GB"
          />
          <p className="text-xs text-muted-foreground">Enter 14 03 2010 to be turned away, or 14 03 1992 to pass. Impossible dates such as 31 02 are refused.</p>
        </Example>

        <Example caption="The plain question: two buttons, for shops that only need a promise, and a way out for the answer that turns a visitor away">
          <GateFrame tall="min-h-[44rem]" mode="confirm" minimumAge={21} title="This shop sells vaping products" brand={BRAND} helpHref="#age-policy" locale="en-GB" />
        </Example>
      </div>

      <div className="grid min-w-0 gap-x-8 gap-y-12 md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-y-3">
        <Example caption="A visitor who is too young gets a calm message and a way out, not an error">
          <GateFrame tall="min-h-[34rem]" defaultDeclined title="This shop sells alcohol" brand={BRAND} helpHref="#age-policy" locale="en-GB" />
        </Example>

        <DialogExample />
      </div>
    </div>
  );
}
