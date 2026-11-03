"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconBell, IconBellOff, IconCamera, IconCheck, IconMic, IconMicOff, IconPin } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** What the browser says about a permission, with its three answers folded into the ones a person can act on: not asked yet, allowed, blocked. */
export type PermissionPrimerState = "default" | "granted" | "denied";

export type PermissionPrimerKind = "notifications" | "camera" | "microphone" | "location";

/** The words the card uses, for translation. `{name}` is the permission's name: "Notifications", "Camera". */
export interface PermissionPrimerLabels {
  /** The permission's name, for the steps. Default "Notifications", "Camera", "Microphone" or "Location". */
  name?: string;
  /** The heading of the ask. Default "Turn on notifications", "Use your camera" and so on. */
  title?: string;
  /** The main button. Default "Allow notifications", "Allow camera" and so on. */
  allow?: string;
  /** The quiet button. Default "Not now". */
  notNow?: string;
  /** Under the buttons, so nobody is surprised by what happens next. Default "Your browser will ask you to confirm next.". */
  next?: string;
  /** On the button while the browser's own question is open. Default "Waiting for your answer…". */
  waiting?: string;
  /** When the browser closed its question without an answer. Default "No answer yet. You can ask again whenever you like.". */
  noAnswer?: string;
  /** When asking the browser failed outright. Default "We could not ask your browser. Try again.". */
  failed?: string;
  /** The quiet line once it is allowed. Default "Notifications are on", "Camera access is on" and so on. */
  on?: string;
  /** The heading once it is blocked. Default "Notifications are blocked", "Camera access is blocked" and so on. */
  blocked?: string;
  /** Under that heading. Default "Your browser will not ask again, so turn {name} back on in its settings for this site:". */
  blockedIntro?: string;
  /** The steps for turning it back on, in order. Default three short generic ones. */
  steps?: readonly string[];
  /** Said when Not now was pressed. Default "Okay. We will not ask again for now.". */
  dismissedSpoken?: string;
}

export interface PermissionPrimerProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** Which permission this asks for. */
  kind: PermissionPrimerKind;
  /** Why it is worth saying yes, in one line and in terms of what the person gets: "Hear about replies and mentions when you are in another tab." */
  benefit: string;
  /** Asks the browser, and returns its answer. It runs only when Allow is pressed, never on load. For notifications: `() => Notification.requestPermission()`. Leave it out and the card asks the browser itself for the four kinds it knows (the camera and microphone are opened for a moment and let go at once). */
  onRequest?: () => PermissionPrimerState | "prompt" | Promise<PermissionPrimerState | "prompt">;
  /** The permission as you know it, when you track it yourself or want a fixed preview. Leave it out and the card reads the browser (the Permissions API, or `Notification.permission`) and follows changes made in its settings. */
  state?: PermissionPrimerState;
  /** Called with the answer after Allow, and when the browser's own settings change the state. */
  onStateChange?: (state: PermissionPrimerState) => void;
  /** Called when Not now was pressed, after the choice is remembered. */
  onDismiss?: () => void;
  /** How many days Not now is remembered. Default 14. */
  snoozeDays?: number;
  /** Where this device remembers Not now, in localStorage. Default one per kind. */
  storageKey?: string;
  /** The level of the card's heading: 3 by default. */
  titleAs?: "h2" | "h3" | "h4";
  /** The words the card uses, for translation. */
  labels?: PermissionPrimerLabels;
}

const KINDS: Record<PermissionPrimerKind, { on: ReactNode; off: ReactNode; copy: Required<Pick<PermissionPrimerLabels, "name" | "title" | "allow" | "on" | "blocked">> }> = {
  notifications: {
    on: <IconBell />,
    off: <IconBellOff />,
    copy: { name: "Notifications", title: "Turn on notifications", allow: "Allow notifications", on: "Notifications are on", blocked: "Notifications are blocked" },
  },
  camera: {
    on: <IconCamera />,
    off: <IconCamera />,
    copy: { name: "Camera", title: "Use your camera", allow: "Allow camera", on: "Camera access is on", blocked: "Camera access is blocked" },
  },
  microphone: {
    on: <IconMic />,
    off: <IconMicOff />,
    copy: { name: "Microphone", title: "Use your microphone", allow: "Allow microphone", on: "Microphone access is on", blocked: "Microphone access is blocked" },
  },
  location: {
    on: <IconPin />,
    off: <IconPin />,
    copy: { name: "Location", title: "Use your location", allow: "Allow location", on: "Location access is on", blocked: "Location access is blocked" },
  },
};

const GENERIC = {
  notNow: "Not now",
  next: "Your browser will ask you to confirm next.",
  waiting: "Waiting for your answer…",
  noAnswer: "No answer yet. You can ask again whenever you like.",
  failed: "We could not ask your browser. Try again.",
  blockedIntro: "Your browser will not ask again, so turn {name} back on in its settings for this site:",
  steps: ["Click the icon to the left of the address bar.", "Set {name} to Allow.", "Reload this page."],
  dismissedSpoken: "Okay. We will not ask again for now.",
} as const;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

function normalise(value: string): PermissionPrimerState {
  return value === "granted" ? "granted" : value === "denied" ? "denied" : "default";
}

/** The Permissions API's name for each kind. The camera and microphone are missing from older DOM typings, hence the cast where it is used. */
const QUERY: Record<PermissionPrimerKind, string> = { notifications: "notifications", camera: "camera", microphone: "microphone", location: "geolocation" };

/** The browser's own answer for each kind, asked from a button press: the same call the page would make. */
async function askBrowser(kind: PermissionPrimerKind): Promise<PermissionPrimerState> {
  if (kind === "notifications") return normalise(await Notification.requestPermission());
  if (kind === "location") {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve("granted"),
        (error) => resolve(error.code === error.PERMISSION_DENIED ? "denied" : "default"),
        { timeout: 15_000 },
      );
    });
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia(kind === "camera" ? { video: true } : { audio: true });
    // Only the answer was wanted: let the device go at once, so no light stays on.
    for (const track of stream.getTracks()) track.stop();
    return "granted";
  } catch (error) {
    return error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError") ? "denied" : "default";
  }
}

function snoozedUntil(key: string): number {
  try {
    return Number(window.localStorage.getItem(key)) || 0;
  } catch {
    // Storage can be blocked: the card then asks every time, which is the safe way to be wrong.
    return 0;
  }
}

/** The card takes this long to leave, in ms: the length of its transition. */
const LEAVE_MS = 220;

/**
 * The soft ask before the browser's own permission prompt. The browser asks
 * once, in words the page does not control, and a "Block" is forever, so the
 * page asks first, in its own words: what you get, with Allow and Not now.
 * The browser's question opens only from the Allow button, never on load,
 * and the card says that it is coming. It reads the permission: not asked yet
 * shows the ask; allowed shows a quiet "Notifications are on"; blocked
 * switches to short steps for turning it back on in the browser's settings,
 * because the prompt cannot be shown again. Not now is remembered on the
 * device for a number of days, so it does not nag, and the card follows a
 * change made in the browser's settings while the page is open. If the
 * browser closes its question without an answer, or cannot ask at all, the
 * card says so, out loud as well, and puts the focus back on Allow so that it
 * can be pressed again. It is drawn after the page is live, never in the
 * server HTML, because the server cannot know any of this.
 */
export function PermissionPrimer({ kind, benefit, onRequest, state, onStateChange, onDismiss, snoozeDays = 14, storageKey, titleAs: Title = "h3", labels, className, ...props }: PermissionPrimerProps) {
  const base = KINDS[kind];
  const text = {
    name: labels?.name ?? base.copy.name,
    title: labels?.title ?? base.copy.title,
    allow: labels?.allow ?? base.copy.allow,
    on: labels?.on ?? base.copy.on,
    blocked: labels?.blocked ?? base.copy.blocked,
    notNow: labels?.notNow ?? GENERIC.notNow,
    next: labels?.next ?? GENERIC.next,
    waiting: labels?.waiting ?? GENERIC.waiting,
    noAnswer: labels?.noAnswer ?? GENERIC.noAnswer,
    failed: labels?.failed ?? GENERIC.failed,
    blockedIntro: labels?.blockedIntro ?? GENERIC.blockedIntro,
    steps: labels?.steps ?? GENERIC.steps,
    dismissedSpoken: labels?.dismissedSpoken ?? GENERIC.dismissedSpoken,
  };
  const id = useId();
  const key = storageKey ?? `rhs-ui-permission-primer:${kind}`;

  // What the browser says, once read: null until then, so the server and the first paint draw nothing.
  const [read, setRead] = useState<PermissionPrimerState | null>(null);
  const [snoozed, setSnoozed] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<"open" | "leaving" | "gone">("open");
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });
  const target = useRef<HTMLElement | null>(null);
  const allowButton = useRef<HTMLButtonElement>(null);
  const again = useRef(false);
  const moved = useRef(false);
  const last = useRef<PermissionPrimerState | null>(null);
  const leave = useRef<number | undefined>(undefined);
  const change = useRef(onStateChange);
  useEffect(() => {
    change.current = onStateChange;
  });

  const current = state ?? read;
  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  // Read the permission, and follow it when the browser's settings change it.
  useEffect(() => {
    if (state !== undefined) return;
    let alive = true;
    let watched: PermissionStatus | undefined;
    const apply = (value: string) => {
      if (!alive) return;
      const next = normalise(value);
      const before = last.current;
      last.current = next;
      setRead(next);
      // The first reading is not a change; a later one is, whether the person made it in the browser's settings or by answering the prompt elsewhere.
      if (before !== null && before !== next) change.current?.(next);
    };
    const fallback = () => apply(kind === "notifications" && typeof Notification !== "undefined" ? Notification.permission : "default");
    try {
      if (!navigator.permissions?.query) throw new Error("no Permissions API");
      navigator.permissions
        .query({ name: QUERY[kind] as PermissionName })
        .then((status) => {
          if (!alive) return;
          watched = status;
          apply(status.state);
          status.onchange = () => apply(status.state);
        })
        .catch(fallback);
    } catch {
      // Safari has no Permissions API for most kinds, and Firefox throws for the camera and microphone: the notification setting is still readable, and everything else is "not asked yet".
      fallback();
    }
    return () => {
      alive = false;
      if (watched) watched.onchange = null;
    };
  }, [kind, state]);

  useEffect(() => {
    setSnoozed(snoozedUntil(key) > Date.now());
  }, [key]);

  useEffect(() => () => window.clearTimeout(leave.current), []);

  // Focus follows a change the person asked for: Allow is gone once the browser has answered, so the new line or heading takes the focus.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    target.current?.focus();
  }, [current]);

  // A disabled button cannot keep the focus, so the browser lets go of it while its question is open. When the question closed without an answer, or could not be asked, Allow is back and the focus returns to it, unless the person has moved on by then.
  useEffect(() => {
    if (asking || !again.current) return;
    again.current = false;
    if (!document.activeElement || document.activeElement === document.body) allowButton.current?.focus({ preventScroll: true });
  }, [asking]);

  async function allow() {
    if (asking) return;
    again.current = document.activeElement === allowButton.current;
    setAsking(true);
    setNote("");
    let answer: PermissionPrimerState;
    try {
      answer = normalise(await (onRequest ? onRequest() : askBrowser(kind)));
    } catch {
      setAsking(false);
      setNote(text.failed);
      say(text.failed);
      return;
    }
    setAsking(false);
    if (answer === "default") {
      setNote(text.noAnswer);
      say(text.noAnswer);
      return;
    }
    // An answer swaps Allow for the new line or heading, which takes the focus below.
    again.current = false;
    moved.current = true;
    // Written down before the browser's own change event arrives, so the same answer is not reported twice.
    last.current = answer;
    if (state === undefined) setRead(answer);
    say(answer === "granted" ? text.on : text.blocked);
    onStateChange?.(answer);
  }

  function notNow() {
    try {
      window.localStorage.setItem(key, String(Date.now() + Math.max(0, snoozeDays) * 86_400_000));
    } catch {
      // Nothing to remember it with: the card asks again next time.
    }
    say(text.dismissedSpoken);
    setPhase("leaving");
    window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => setPhase("gone"), LEAVE_MS);
    onDismiss?.();
  }

  const view = current === null ? null : current === "granted" ? "granted" : current === "denied" ? "denied" : snoozed === null || snoozed || phase === "gone" ? null : "ask";
  const tile = "grid size-10 shrink-0 place-items-center rounded-lg border [&_svg]:size-5";

  return (
    <>
      {view ? (
        <div
          data-slot="permission-primer"
          data-kind={kind}
          data-state={view}
          inert={phase === "leaving" || undefined}
          // A grid row grows from nothing on arrival and folds back on Not now: height animates without measuring anything.
          className={cn(
            "grid w-full transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
            phase === "leaving" ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0",
            className,
          )}
          {...props}
        >
          {/* The padding gives the focus ring room inside the clip; the negative margin takes it back out of the layout. */}
          <div className="-m-1 min-h-0 overflow-hidden p-1">
            {view === "granted" ? (
              <p
                ref={(node) => {
                  target.current = node;
                }}
                tabIndex={-1}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm leading-5 text-muted-foreground outline-none"
              >
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-3.5">
                  <IconCheck />
                </span>
                {text.on}
              </p>
            ) : (
              <div className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs sm:gap-4 sm:p-5">
                <span aria-hidden="true" className={cn(tile, view === "denied" ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted text-foreground")}>
                  {view === "denied" ? base.off : base.on}
                </span>
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <Title
                    ref={(node: HTMLHeadingElement | null) => {
                      target.current = node;
                    }}
                    id={`${id}-title`}
                    tabIndex={-1}
                    className="pt-px text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] outline-none"
                  >
                    {view === "denied" ? text.blocked : text.title}
                  </Title>
                  {view === "denied" ? (
                    <>
                      <p className="text-sm leading-relaxed text-muted-foreground">{fill(text.blockedIntro, { name: text.name })}</p>
                      <ol className="mt-2 grid gap-2.5 text-sm leading-snug">
                        {text.steps.map((step, index) => (
                          <li key={`${index}-${step}`} className="flex items-start gap-3">
                            <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-full border border-border bg-muted text-[0.6875rem] font-medium text-muted-foreground tabular-nums">
                              {index + 1}
                            </span>
                            <span className="min-w-0 pt-px">{fill(step, { name: text.name })}</span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="text-sm leading-relaxed text-muted-foreground">{benefit}</p>
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <Button ref={allowButton} type="button" size="sm" loading={asking} aria-describedby={`${id}-next`} onClick={() => void allow()}>
                          {asking ? text.waiting : text.allow}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" disabled={asking} onClick={notNow} className="text-muted-foreground hover:text-foreground">
                          {text.notNow}
                        </Button>
                      </div>
                      <p id={`${id}-next`} className="mt-1 text-xs leading-snug text-muted-foreground">
                        {note || text.next}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </>
  );
}
