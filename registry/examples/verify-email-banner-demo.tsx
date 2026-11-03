"use client";

import { useState, type ReactNode } from "react";

import { VerifyEmailBanner } from "@rhs-ui/application/verify-email-banner";
import { Button } from "@rhs-ui/primitives/button";
import { Switch } from "@rhs-ui/primitives/switch";

const KEYS = { fresh: "demo-verify-fresh", waiting: "demo-verify-waiting" } as const;

/**
 * A wait that was running before a reload: the second banner was resent 38 seconds before the page opened, and picks the count up where it was.
 * A reload of the demo keeps whatever wait is still running, as a real page would; only Start over begins again.
 */
function seedWait(reset: boolean): void {
  try {
    if (reset) window.sessionStorage.removeItem(KEYS.fresh);
    const running = Number(window.sessionStorage.getItem(KEYS.waiting)) || 0;
    if (reset || running <= Date.now()) window.sessionStorage.setItem(KEYS.waiting, String(Date.now() + 38_000));
  } catch {
    // Storage is blocked: the second banner simply starts at rest.
  }
}

/** A small app to put the banner in, the way it sits above the content of a page. */
function AppWindow({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xs">
      <div className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-[-0.03em]">Halcyon</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Teams</span>
          <span className="font-medium text-foreground">Invites</span>
          <span>Settings</span>
        </span>
      </div>
      <div className="grid gap-5 px-4 py-5 sm:px-6 sm:py-6">
        {children}
        <div aria-hidden="true" className="grid gap-2.5">
          <div className="h-2.5 w-1/4 rounded-full bg-muted" />
          <div className="h-2.5 w-1/2 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

export default function Demo(): React.JSX.Element {
  // Written during the first render on the client, so it is in storage before the banners' own effects read it. The server render skips it.
  useState(() => {
    if (typeof window !== "undefined") seedWait(false);
    return true;
  });
  const [round, setRound] = useState(0);
  const [verified, setVerified] = useState(false);
  const [failNext, setFailNext] = useState(false);

  async function resend() {
    await wait(900);
    if (failNext) {
      setFailNext(false);
      throw new Error("The mail service is busy. Try again in a moment.");
    }
  }

  /** The new address is sent a fresh email. An address that "belongs to someone" shows what a message from your server looks like under the field. */
  async function change(address: string) {
    await wait(800);
    if (address.toLowerCase().includes("taken")) return "That address already has an account.";
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-9 px-4 py-8 sm:px-6 sm:py-10">
      <Case caption="At rest. Resend email counts down after a send, and the end of the wait is kept for the tab, so a reload does not hand out a fresh minute. Change address fixes a typo in place; try an address with “taken” in it.">
        <AppWindow>
          <VerifyEmailBanner
            key={`fresh-${round}`}
            email="jane@acme.com"
            reason="to start sending invites"
            verified={verified}
            cooldownSeconds={30}
            storageKey={KEYS.fresh}
            onResend={resend}
            onChangeEmail={change}
          />
        </AppWindow>
      </Case>

      <Case caption="A page that was reloaded in the middle of a wait: this banner was resent 38 seconds before it opened, so it picks the countdown up where it was.">
        <AppWindow>
          <VerifyEmailBanner key={`waiting-${round}`} email="mara@northwind.example" reason="to publish your first report" cooldownSeconds={60} storageKey={KEYS.waiting} onResend={resend} />
        </AppWindow>
      </Case>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button type="button" size="sm" variant="outline" disabled={verified} onClick={() => setVerified(true)}>
          Mark the first as verified
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            seedWait(true);
            setVerified(false);
            setRound((count) => count + 1);
          }}
        >
          Start over
        </Button>
        <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Switch checked={failNext} onCheckedChange={setFailNext} aria-label="Make the next send fail" />
          Make the next send fail, to see the error
        </label>
      </div>
    </div>
  );
}
