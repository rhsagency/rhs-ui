"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { PwaInstallPrompt } from "@rhs-ui/application/pwa-install-prompt";
import { Button } from "@rhs-ui/primitives/button";
import { Switch } from "@rhs-ui/primitives/switch";

const KEYS = ["demo-pwa-browser", "demo-pwa-iphone"];

/** The launcher icon, drawn in place: a rounded square with a K. */
const ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#171717"/><path d="M33 24v48M33 50l26-26M42 45l21 27" fill="none" stroke="#fafafa" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  );

const ROWS = [
  { name: "Dispatch board", detail: "14 jobs today, 3 unassigned" },
  { name: "Northwind depot run", detail: "Leaves 09:30, 6 stops" },
  { name: "Halcyon service visit", detail: "Tomorrow, 08:15" },
  { name: "Weekly stock count", detail: "Friday, 16:00" },
] as const;

/** A small app for the prompt to sit over. The prompt is placed in this box with `className="absolute"`; on a real page it is fixed to the window. */
function AppWindow({ narrow, children }: { narrow?: boolean; children: ReactNode }): React.JSX.Element {
  return (
    // The narrow box is as tall as the sheet needs for its top edge to land on the divider under the first row, so the sheet never cuts a line of text in half.
    <div className={narrow ? "relative mx-auto h-[30.5rem] w-full max-w-[22rem] overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-xs" : "relative h-[28rem] w-full overflow-hidden rounded-xl border border-border bg-background shadow-xs"}>
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-semibold tracking-[-0.03em]">Kestrel</span>
        <span aria-hidden="true" className="flex gap-4 text-xs text-muted-foreground">
          <span>Jobs</span>
          <span>Crew</span>
        </span>
      </div>
      <div className="px-4 py-5">
        <p className="text-base font-semibold tracking-[-0.02em]">Today</p>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
          {ROWS.map((row) => (
            <li key={row.name} className="px-3 py-2.5">
              <p className="text-sm font-medium">{row.name}</p>
              <p className="text-xs text-muted-foreground">{row.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="min-h-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function forget() {
  for (const key of KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is blocked: there is nothing to forget.
    }
  }
}

/** What a Chromium browser does: it fires `beforeinstallprompt` with an offer, and the offer's own dialog opens when `prompt()` is called. */
function offerInstall(outcome: "accepted" | "dismissed"): void {
  const offer = new Event("beforeinstallprompt", { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
  let answer: (choice: { outcome: "accepted" | "dismissed" }) => void = () => undefined;
  offer.userChoice = new Promise((resolve) => {
    answer = resolve;
  });
  // The browser's own dialog: the demo waits a moment, then gives the answer the switch asks for.
  offer.prompt = () =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        answer({ outcome });
        resolve();
      }, 900);
    });
  window.dispatchEvent(offer);
}

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [refuse, setRefuse] = useState(false);
  const [log, setLog] = useState("Nothing installed yet.");
  const answer = useRef<"accepted" | "dismissed">("accepted");
  useEffect(() => {
    answer.current = refuse ? "dismissed" : "accepted";
  }, [refuse]);

  // The browser fires its event a moment after the page is live, never with the first paint. Here it is fired by hand.
  useEffect(() => {
    const timer = window.setTimeout(() => offerInstall(answer.current), 150);
    return () => window.clearTimeout(timer);
  }, [round]);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-7 px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid items-start gap-x-8 gap-y-9 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Case caption="Chrome, Edge and Android: the browser fires beforeinstallprompt, so Install is a real button that opens its own dialog. In a wide window it is a card in the corner.">
          <AppWindow>
            <PwaInstallPrompt
              key={`browser-${round}`}
              className="absolute"
              appName="Kestrel"
              icon={<img src={ICON} alt="" />}
              labels={{ title: "Install {app} on this computer" }}
              storageKey={KEYS[0]}
              onInstalled={() => setLog("Installed: onInstalled ran, and the prompt will not come back.")}
              onDismiss={() => setLog("Dismissed: remembered on this device for 14 days.")}
            />
          </AppWindow>
        </Case>

        <Case caption="iPhone and iPad: Safari has no such event, so the prompt says what to tap. In a narrow window it is a sheet, clear of the home indicator.">
          <AppWindow narrow>
            <PwaInstallPrompt key={`iphone-${round}`} className="absolute" platform="ios" delay={150} appName="Kestrel" icon={<img src={ICON} alt="" />} labels={{ title: "Install {app} on your iPhone" }} storageKey={KEYS[1]} />
          </AppWindow>
        </Case>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            forget();
            setLog("Nothing installed yet.");
            setRound((count) => count + 1);
          }}
        >
          Show the prompts again
        </Button>
        <label className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Switch checked={refuse} onCheckedChange={setRefuse} aria-label="Dismiss the browser's own dialog" />
          Dismiss the browser&rsquo;s own dialog instead of accepting it
        </label>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {log}
        </p>
      </div>
    </div>
  );
}
