"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconPlus, IconShare, IconSmartphone } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the prompt uses, for translation. `{app}` is filled in; `{share}` and `{add}` become the button as Safari prints it, with its icon and its name. */
export interface PwaInstallPromptLabels {
  /** The heading. Default "Install {app}". */
  title?: string;
  /** Under the heading where the browser can install. Default "Open it from your home screen or taskbar, in its own window, like any other app.". */
  description?: string;
  /** Under the heading on iPhone and iPad. Default "Open it from your Home Screen, full screen, like any other app. Two taps in Safari:". */
  iosDescription?: string;
  /** The main button. Default "Install". */
  install?: string;
  /** On the button while the browser's own dialog is open. Default "Installing…". */
  installing?: string;
  /** The quiet button. Default "Not now". */
  notNow?: string;
  /** The first step on iOS. Default "Tap {share} in the toolbar". */
  stepShare?: string;
  /** The second step on iOS. Default "Scroll down and tap {add}". */
  stepAdd?: string;
  /** The name Safari gives its share button. Default "Share". */
  shareName?: string;
  /** The name Safari gives the menu row that installs. Default "Add to Home Screen". */
  addName?: string;
  /** Said when the prompt appears. Default "You can install {app} on this device.". */
  spoken?: string;
}

export interface PwaInstallPromptProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The name people know the app by: "Acme". */
  appName: string;
  /** The app's icon, as an element sized by its box: an `<img>` of your launcher icon. It is drawn in a rounded tile. Default a phone glyph. */
  icon?: ReactNode;
  /** Called once the app was installed, whether from this prompt or from the browser's own menu. */
  onInstalled?: () => void;
  /** Called when Not now was pressed, or the browser's own dialog was dismissed, after the choice is remembered. */
  onDismiss?: () => void;
  /** How many days a dismissal is remembered, on this device, before the prompt may come back. Default 14. */
  dismissDays?: number;
  /** `auto` (the default) reads the browser: the Install button once it fires `beforeinstallprompt`, share-sheet steps on iOS Safari, nothing anywhere else. `ios` always shows the steps, for a preview or a test. */
  platform?: "auto" | "ios";
  /** How long, in ms, the iOS steps wait after the page is live before they appear, since iOS has no event to wait for. Default 2500. */
  delay?: number;
  /** Where this device remembers a dismissal, in localStorage. Default one for the site. */
  storageKey?: string;
  /** The level of the heading: 2 by default. */
  titleAs?: "h2" | "h3" | "h4";
  /** The words the prompt uses, for translation. */
  labels?: PwaInstallPromptLabels;
}

/** What Chromium browsers hand to a page that may install itself. It is not in the DOM typings. */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DEFAULT_LABELS = {
  title: "Install {app}",
  description: "Open it from your home screen or taskbar, in its own window, like any other app.",
  iosDescription: "Open it from your Home Screen, full screen, like any other app. Two taps in Safari:",
  install: "Install",
  installing: "Installing…",
  notNow: "Not now",
  stepShare: "Tap {share} in the toolbar",
  stepAdd: "Scroll down and tap {add}",
  shareName: "Share",
  addName: "Add to Home Screen",
  spoken: "You can install {app} on this device.",
} satisfies Required<PwaInstallPromptLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** How long the prompt takes to leave, in ms: the length of its transition. */
const LEAVE_MS = 220;

const KEY = "rhs-ui-pwa-install-until";

function dismissedUntil(key: string): number {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    // Storage can be blocked: the prompt then comes back every time, which is the safe way to be wrong.
    return 0;
  }
}

/** Already running as an installed app: nothing to offer. */
function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** iPhone, iPad and iPad-as-Mac, in Safari itself: the browsers that can add to the Home Screen without an install event. Other iOS browsers and in-app browsers are left out. */
function isIosSafari(): boolean {
  const agent = navigator.userAgent;
  const device = /iPad|iPhone|iPod/.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return device && /Safari\//.test(agent) && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA|DuckDuckGo)/.test(agent);
}

/** A sentence with icons printed in it wherever `{share}` or `{add}` stands. */
function WithGlyphs({ template, share, add }: { template: string; share: ReactNode; add: ReactNode }) {
  return (
    <>
      {template.split(/(\{share\}|\{add\})/).map((part, index) => (part === "{share}" ? <span key={index}>{share}</span> : part === "{add}" ? <span key={index}>{add}</span> : part))}
    </>
  );
}

/**
 * A prompt to install your web app, for the browsers that let a page do it.
 * Where the browser fires `beforeinstallprompt` it shows "Install Acme" with
 * a real Install button, which opens the browser's own dialog; on iPhone and
 * iPad, whose Safari has no such event, it shows the two steps instead (Share,
 * then Add to Home Screen) with the glyphs printed on the Safari button. It is
 * for installable web apps, not for sending people to an app store. It stays
 * hidden when the app already runs standalone, remembers a dismissal for a
 * number of days, and never appears on first paint: it waits for the browser's
 * event, or a beat on iOS. It is a bottom sheet on phones and a card in the
 * corner on wide screens, wherever it is placed, with room for the home
 * indicator. Mount it once, high in the app, so it is listening before the
 * browser fires its event.
 */
export function PwaInstallPrompt({
  appName,
  icon,
  onInstalled,
  onDismiss,
  dismissDays = 14,
  platform = "auto",
  delay = 2500,
  storageKey = KEY,
  titleAs: Title = "h2",
  labels,
  className,
  ...props
}: PwaInstallPromptProps) {
  const text: Required<PwaInstallPromptLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const offered = useRef<InstallEvent | null>(null);
  const leave = useRef<number | undefined>(undefined);
  const handlers = useRef({ onInstalled, onDismiss });
  const latest = useRef({ spoken: text.spoken, appName });
  // An install is reported once, although the dialog's answer and the browser's own `appinstalled` event both say so.
  const reported = useRef(false);
  useEffect(() => {
    handlers.current = { onInstalled, onDismiss };
    latest.current = { spoken: text.spoken, appName };
  });
  const installed = () => {
    if (reported.current) return;
    reported.current = true;
    handlers.current.onInstalled?.();
  };

  const [mode, setMode] = useState<"none" | "install" | "ios">("none");
  const [phase, setPhase] = useState<"open" | "leaving">("open");
  const [installing, setInstalling] = useState(false);
  const [said, setSaid] = useState("");

  useEffect(() => {
    // Installed already, or turned down recently: there is nothing to offer, and nothing to listen for.
    if (isStandalone() || dismissedUntil(storageKey) > Date.now()) return;
    let timer: number | undefined;
    const show = (next: "install" | "ios") => {
      reported.current = false;
      setPhase("open");
      setMode(next);
      setSaid(fill(latest.current.spoken, { app: latest.current.appName }));
    };
    const onOffer = (event: Event) => {
      // Keep the offer for the Install button, and stop the browser's own mini bar from asking first.
      event.preventDefault();
      offered.current = event as InstallEvent;
      show("install");
    };
    const onInstall = () => {
      offered.current = null;
      setMode("none");
      if (!reported.current) {
        reported.current = true;
        handlers.current.onInstalled?.();
      }
    };
    window.addEventListener("appinstalled", onInstall);
    if (platform === "ios") {
      timer = window.setTimeout(() => show("ios"), delay);
    } else {
      window.addEventListener("beforeinstallprompt", onOffer);
      // iOS Safari has no event to wait for, so the steps come after a beat, never with the first paint.
      if (isIosSafari()) timer = window.setTimeout(() => show("ios"), delay);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onOffer);
      window.removeEventListener("appinstalled", onInstall);
    };
  }, [platform, delay, storageKey]);

  useEffect(() => () => window.clearTimeout(leave.current), []);

  /** Folds the prompt away. A dismissal is remembered; an install is not, because installed is its own answer. */
  function close(remember: boolean) {
    if (remember) {
      try {
        window.localStorage.setItem(storageKey, String(Date.now() + Math.max(0, dismissDays) * 86_400_000));
      } catch {
        // Nothing to remember it with: the prompt may come back on the next visit.
      }
    }
    setPhase("leaving");
    window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => {
      setMode("none");
      setPhase("open");
    }, LEAVE_MS);
    if (remember) handlers.current.onDismiss?.();
  }

  async function install() {
    const offer = offered.current;
    if (!offer || installing) return;
    setInstalling(true);
    try {
      await offer.prompt();
      const choice = await offer.userChoice;
      // An offer can be used once: whatever the answer, it is spent.
      offered.current = null;
      if (choice.outcome === "accepted") {
        close(false);
        installed();
      } else {
        close(true);
      }
    } catch {
      // The browser would not open its dialog (an offer used before, a page not allowed to): fold away quietly and ask again some other day.
      offered.current = null;
      close(true);
    } finally {
      setInstalling(false);
    }
  }

  // The two buttons as Safari prints them, so the step can be matched by eye: its icon and its name, kept together on one line.
  const pill = "mx-0.5 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-[0.8125rem] leading-5 font-medium whitespace-nowrap text-foreground [&_svg]:size-3.5";
  const shareGlyph = (
    <span className={pill}>
      <IconShare />
      {text.shareName}
    </span>
  );
  const addGlyph = (
    <span className={pill}>
      <span aria-hidden="true" className="grid size-3.5 place-items-center rounded-[4px] border-[1.5px] border-current">
        <IconPlus className="size-2.5" />
      </span>
      {text.addName}
    </span>
  );

  return (
    <>
      {mode === "none" ? null : (
        // A box that fills the window and lets every click through: it is the container the card measures itself against, so the card is a sheet in a narrow window and a corner card in a wide one, wherever it is placed. Give it `className="absolute"` to put it inside a box of your own.
        <div data-slot="pwa-install-prompt" data-mode={mode} className={cn("@container pointer-events-none fixed inset-0 z-50", className)} {...props}>
          <section
            aria-labelledby={`${id}-title`}
            inert={phase === "leaving" || undefined}
            className={cn(
              "pointer-events-auto absolute inset-x-0 bottom-0 border-t border-border bg-card px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-card-foreground shadow-sm",
              "rounded-t-2xl @xl:inset-x-auto @xl:right-4 @xl:bottom-4 @xl:w-[22.5rem] @xl:rounded-2xl @xl:border @xl:pb-5",
              "transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none",
              phase === "leaving" ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100 starting:translate-y-6 starting:opacity-0",
            )}
          >
            <div className="flex items-start gap-3.5">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted text-foreground [&_img]:size-full [&_img]:object-cover [&_svg]:size-6">
                {icon ?? <IconSmartphone />}
              </span>
              <div className="min-w-0 pt-px">
                <Title id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">
                  {fill(text.title, { app: appName })}
                </Title>
                <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{mode === "ios" ? text.iosDescription : text.description}</p>
              </div>
            </div>

            {mode === "ios" ? (
              <ol className="mt-4 grid gap-2.5 text-sm leading-snug">
                {[text.stepShare, text.stepAdd].map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
                    <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-border bg-background text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 leading-[1.6]">
                      <WithGlyphs template={step} share={shareGlyph} add={addGlyph} />
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}

            <div className="mt-4 flex items-center gap-2">
              {mode === "install" ? (
                <Button type="button" size="sm" loading={installing} onClick={() => void install()} className="flex-1 @xl:flex-none">
                  {installing ? text.installing : text.install}
                </Button>
              ) : null}
              <Button type="button" size="sm" variant={mode === "install" ? "ghost" : "outline"} disabled={installing} onClick={() => close(true)} className={cn(mode === "install" ? "text-muted-foreground hover:text-foreground" : "flex-1 @xl:flex-none")}>
                {text.notNow}
              </Button>
            </div>
          </section>
        </div>
      )}
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
