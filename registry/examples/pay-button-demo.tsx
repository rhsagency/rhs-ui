"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { PayButton, type PayStatus } from "@rhs-ui/commerce/pay-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const STATES: { status: PayStatus; caption: string }[] = [
  { status: "processing", caption: "Processing: locked, and the page must stay open" },
  { status: "authenticating", caption: "Authenticating: the bank step has its own words" },
  { status: "paid", caption: "Paid: a check and the amount" },
];

function Example({ caption, action, children }: { caption: string; action?: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">{caption}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

/** An example you can press more than once: a moment after it ends in Paid it starts over, so its caption stays true. */
function Cycle({ children }: { children: (finish: () => void) => ReactNode }): React.JSX.Element {
  const [round, setRound] = useState(0);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const finish = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRound((value) => value + 1), 2600);
  };
  return <Fragment key={round}>{children(finish)}</Fragment>;
}

/** A declined card: Try again runs the payment again, and this time it goes through. */
function Declined({ finish }: { finish: () => void }): React.JSX.Element {
  const [status, setStatus] = useState<PayStatus>("failed");
  return (
    <PayButton
      amount={4900}
      currency="EUR"
      locale="en-GB"
      status={status}
      error="Your bank declined the card. Nothing was charged."
      onRetry={() => {
        setStatus("processing");
        void wait(1300).then(() => {
          setStatus("paid");
          finish();
        });
      }}
    />
  );
}

/** Pays for real: a declined card first, then the bank step, then success. Every press logs the attempt id it would send as the idempotency key. */
function TryIt(): React.JSX.Element {
  const [log, setLog] = useState<string[]>([]);
  const presses = useRef(0);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <PayButton
        amount={4900}
        currency="EUR"
        locale="en-GB"
        note="Payments are encrypted"
        onPay={async (attemptId, step) => {
          presses.current += 1;
          const attempt = presses.current;
          setLog((lines) => [...lines, `Attempt ${attempt}: ${attemptId.slice(0, 8)}`]);
          await wait(900);
          step.authenticating();
          await wait(1500);
          if (attempt === 1) throw new Error("Your bank declined the card. Nothing was charged.");
        }}
      />
      <ul aria-label="Attempt ids sent" className="grid gap-0.5 font-mono text-xs text-muted-foreground tabular-nums">
        {log.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
      <Example
        caption="Press it: the first attempt is declined, the second goes through"
        action={
          <button type="button" onClick={() => setRound((value) => value + 1)} className="-my-0.5 shrink-0 rounded-sm px-1 py-0.5 text-xs font-medium underline underline-offset-4 outline-none hover:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            Start over
          </button>
        }
      >
        <TryIt key={round} />
      </Example>

      <Example caption="Not valid yet: the reason is shown and the button says no">
        <PayButton amount={4900} currency="EUR" locale="en-GB" disabledReason="Enter your card number to continue" note="Payments are encrypted" />
      </Example>

      <Example caption="Ready: the amount is on the button">
        <Cycle>
          {(finish) => (
            <PayButton
              amount={4900}
              currency="EUR"
              locale="en-GB"
              note="Payments are encrypted"
              onPay={async () => {
                await wait(1100);
                finish();
              }}
            />
          )}
        </Cycle>
      </Example>

      {STATES.map(({ status, caption }) => (
        <Example key={status} caption={caption}>
          <PayButton amount={4900} currency="EUR" locale="en-GB" status={status} note="Payments are encrypted" />
        </Example>
      ))}

      <Example caption="Failed: the reason in words, and Try again without resetting the form">
        <Cycle>{(finish) => <Declined finish={finish} />}</Cycle>
      </Example>

      <Example caption="Any wording: place the amount yourself, in your locale">
        <PayButton amount={129900} currency="EUR" locale="nl-NL" label="Place order for {amount}" note="Your order ships on Thursday" />
      </Example>
    </div>
  );
}
