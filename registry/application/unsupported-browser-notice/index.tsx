"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconArrowUpRight, IconClose, IconGlobe } from "@rhs-ui/icons";
import { assess, hasContinued, rememberContinue, sameBrowser, type Assessment, type BrowserRequirement, type SupportedBrowser } from "@rhs-ui/application/unsupported-browser-notice/support";
import { Alert } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { BrowserCheck, BrowserCheckSpec, BrowserRequirement, SupportedBrowser } from "@rhs-ui/application/unsupported-browser-notice/support";

/** The words the notice uses, for translation. `{browser}`, `{version}` and `{minimum}` are filled in. */
export interface UnsupportedBrowserNoticeLabels {
  /** The first line. Default "Your browser may not run this app properly". */
  title?: string;
  /** Under the title. Default "Some parts can look wrong or stop responding. A recent version of one of the browsers below works best." */
  description?: string;
  /** Said when the visitor's browser is on your list and older than the version you gave. Default "You are using {browser} {version}. This app needs {browser} {minimum} or newer." */
  outdated?: string;
  /** The heading above what is missing. Default "Missing in this browser". */
  missing?: string;
  /** The heading above the list of browsers. Default "Works well in". */
  browsers?: string;
  /** Under a browser's name; `{version}` is its minimum. Default "{version} or newer". */
  version?: string;
  /** On the card of the browser the visitor is using; `{version}` is theirs. Default "You have {version}". */
  yours?: string;
  /** Read after the name of a link that opens in a new tab. Default "opens in a new tab". */
  newTab?: string;
  /** The button that keeps the page as it is. Default "Continue anyway". */
  continue?: string;
  /** The name of the close button. Default "Dismiss". */
  dismiss?: string;
  /** Said when the visitor chose to continue. Default "Continuing anyway. This notice will not come back during this visit." */
  continued?: string;
  /** Said when the visitor closed the notice. Default "Notice closed." */
  closed?: string;
}

export interface UnsupportedBrowserNoticeProps extends Omit<ComponentProps<"div">, "children"> {
  /** What the app needs, one entry each. A `test` is a function that returns `false` when the browser lacks it, or data: `{ css: "container-type: inline-size" }`, `{ api: "IntersectionObserver" }`. Data works from a Server Component. */
  requires?: readonly BrowserRequirement[];
  /** The browsers that work, with the oldest version of each and the official page to get it. The visitor's browser is compared with this list when it can be read. */
  browsers?: readonly SupportedBrowser[];
  /** Called once when the visitor chooses Continue anyway, for a fallback mode or for analytics. */
  onContinue?: () => void;
  /** Called once when the visitor closes the notice with its close button (see `dismissible`). */
  onDismiss?: () => void;
  /** Adds a close button that hides the notice for this page view only. Continue anyway is the choice that is remembered. Default `false`. */
  dismissible?: boolean;
  /** Where Continue anyway is remembered for the session. Give each notice on a site its own. Default "rhs-ui:unsupported-browser-notice". */
  storageKey?: string;
  /** The user agent to read the browser from. Leave it out to use the visitor's own; it is for previews and tests. */
  userAgent?: string;
  /** The words the notice uses, for translation. */
  labels?: UnsupportedBrowserNoticeLabels;
}

const DEFAULT_STORAGE_KEY = "rhs-ui:unsupported-browser-notice";

const DEFAULT_LABELS = {
  title: "Your browser may not run this app properly",
  description: "Some parts can look wrong or stop responding. A recent version of one of the browsers below works best.",
  outdated: "You are using {browser} {version}. This app needs {browser} {minimum} or newer.",
  missing: "Missing in this browser",
  browsers: "Works well in",
  version: "{version} or newer",
  yours: "You have {version}",
  newTab: "opens in a new tab",
  continue: "Continue anyway",
  dismiss: "Dismiss",
  continued: "Continuing anyway. This notice will not come back during this visit.",
  closed: "Notice closed.",
} satisfies Required<UnsupportedBrowserNoticeLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** pending: the browser is not known yet (the server, and the first paint). clear: nothing to say. open: the notice. continued and closed: it is gone and a quiet message is left behind. */
type Phase = "pending" | "clear" | "open" | "continued" | "closed";

const HEADING = "text-xs leading-4 font-medium tracking-[0.02em] text-muted-foreground uppercase";
// Under the title on a narrow container; in the text column, beside the icon, once there is room.
const BODY = "col-span-2 @2xl:col-span-1 @2xl:col-start-2";

/**
 * The notice for a browser that cannot run your app: what is missing in plain
 * words, the browsers that work with the oldest version of each and a link to
 * the official page, and a way to continue anyway. It checks what you list in
 * `requires` (a function, or `{ css }` and `{ api }` data) and, when it can
 * read the visitor's browser and it is on your list and older, the version too.
 * Feature detection can be wrong, so Continue anyway is always there, and the
 * choice is remembered for the session. The checks run once the page is live:
 * the server renders nothing, and so does a browser that passes every check,
 * so a working browser pays no layout shift. It is a labelled region in the
 * calm info style, with no browser logos; a close button hides it for this
 * page view only. When it goes, focus moves to a quiet message in its place
 * instead of dropping to the top of the page, and the message is spoken.
 */
export function UnsupportedBrowserNotice({
  requires = [],
  browsers = [],
  onContinue,
  onDismiss,
  dismissible = false,
  storageKey = DEFAULT_STORAGE_KEY,
  userAgent,
  labels,
  className,
  ...props
}: UnsupportedBrowserNoticeProps) {
  const text: Required<UnsupportedBrowserNoticeLabels> = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("pending");
  const [found, setFound] = useState<Assessment | null>(null);

  // The browser is only known once the page is live. Until then nothing is drawn, so the server and the first client paint agree.
  useEffect(() => {
    if (hasContinued(storageKey)) {
      setPhase("clear");
      return;
    }
    const result = assess(requires, browsers, userAgent ?? navigator.userAgent);
    if (result.missing.length === 0 && result.outdated === null) {
      setPhase("clear");
      return;
    }
    setFound(result);
    setPhase("open");
    // The checks describe the browser, which does not change while the page is open: they run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The button that was pressed leaves with the notice; focus goes to what is left in its place.
  useEffect(() => {
    if (phase === "continued" || phase === "closed") root.current?.focus({ preventScroll: true });
  }, [phase]);

  if (phase === "pending" || phase === "clear" || found === null) return null;
  const open = phase === "open";

  function keepGoing() {
    rememberContinue(storageKey);
    setPhase("continued");
    onContinue?.();
  }

  function close() {
    setPhase("closed");
    onDismiss?.();
  }

  return (
    <div
      ref={root}
      data-slot="unsupported-browser-notice"
      data-state={phase}
      tabIndex={open ? undefined : -1}
      // No width of its own: a block fills its parent, and `fixed inset-x-4` can stretch it between the insets (an explicit width would win over them).
      className={cn("@container", !open && "sr-only outline-none", className)}
      {...props}
    >
      {open ? (
        <Alert
          tone="info"
          role="region"
          aria-labelledby={titleId}
          // The info tint, mixed into the page colour instead of laid over it: it looks the same in the flow, and when the notice floats the page does not show through.
          className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-4 rounded-xl bg-[color-mix(in_srgb,var(--muted)_60%,var(--background))] p-4 @xl:p-5"
        >
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-lg border border-border bg-background text-foreground [&_svg]:size-[18px]">
            <IconGlobe />
          </span>
          <div className={cn("min-w-0", dismissible && "pe-9")}>
            <p id={titleId} className="pt-[7px] text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-balance">
              {text.title}
            </p>
            <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">{text.description}</p>
            {found.outdated ? (
              <p className="mt-2 max-w-prose text-sm leading-relaxed font-medium text-pretty tabular-nums">
                {fill(text.outdated, { browser: found.outdated.name, version: found.outdated.version, minimum: found.outdated.minVersion })}
              </p>
            ) : null}
          </div>

          {found.missing.length > 0 ? (
            <div className={BODY}>
              <p className={HEADING}>{text.missing}</p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {found.missing.map((label, index) => (
                  <li key={`${index}-${label}`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[0.8125rem] leading-5 font-medium">
                    <IconClose aria-hidden="true" className="size-3 shrink-0 text-muted-foreground" />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {browsers.length > 0 ? (
            <div className={BODY}>
              <p className={HEADING}>{text.browsers}</p>
              <ul className="mt-2.5 grid grid-cols-2 gap-2 @2xl:grid-cols-4">
                {browsers.map((browser) => {
                  const mine = found.outdated && sameBrowser(browser.name, found.outdated.name) ? found.outdated.version : null;
                  return (
                    <li key={`${browser.name}-${browser.minVersion}`}>
                      <a
                        href={browser.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/link flex h-full items-start justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 outline-none transition-colors duration-150 hover:bg-muted focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm leading-5 font-medium">{browser.name}</span>
                          <span className="block text-xs leading-5 text-muted-foreground tabular-nums">{fill(text.version, { version: browser.minVersion })}</span>
                          {mine ? <span className="mt-1 block text-xs leading-4 font-medium tabular-nums">{fill(text.yours, { version: mine })}</span> : null}
                        </span>
                        <IconArrowUpRight aria-hidden="true" className="mt-[3px] size-3.5 shrink-0 text-muted-foreground transition-colors group-hover/link:text-foreground motion-reduce:transition-none" />
                        <span className="sr-only">({text.newTab})</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className={cn(BODY, "flex flex-wrap items-center gap-2")}>
            <Button type="button" variant="outline" size="sm" onClick={keepGoing}>
              {text.continue}
            </Button>
          </div>

          {dismissible ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={text.dismiss} onClick={close} className="absolute top-3 right-3 size-7 text-muted-foreground hover:text-foreground">
              <IconClose size={14} />
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {/* Mounted with the notice, so the words it gets when the notice goes are spoken. */}
      <p role="status" className="sr-only">
        {phase === "continued" ? text.continued : phase === "closed" ? text.closed : ""}
      </p>
    </div>
  );
}
