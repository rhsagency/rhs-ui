"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconShieldCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { giveConsent, hasConsent, revokeConsent, subscribeConsent } from "@rhs-ui/primitives/embed-consent/consent";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface EmbedConsentLabels {
  /** The question in the placeholder; `{provider}` is the provider's name. Default "Load content from {provider}?". */
  title?: string;
  /** The line under it, before the list of what is sent. Default "This content is hosted by {provider}. Loading it sends them:". */
  description?: string;
  /** The button that loads the embed. Default "Load content". */
  load?: string;
  /** The checkbox that makes the answer stick. Default "Always load content from {provider}". */
  always?: string;
  /** The link to the privacy policy. Default "Privacy policy". */
  privacy?: string;
  /** The line under a loaded embed that was agreed to for this visit. Default "Loaded from {provider}". */
  loaded?: string;
  /** The same line when the answer was remembered. Default "Always loading content from {provider}". */
  remembered?: string;
  /** The button that forgets a remembered answer. Default "Revoke consent". */
  revoke?: string;
  /** The button that takes a once-only embed away again. Default "Hide". */
  hide?: string;
  /** Said to a screen reader when the visitor loads the embed. Default "Content from {provider} loaded.". */
  announce?: string;
  /** Said to a screen reader when the visitor hides the embed or revokes consent, as focus returns to Load content. Default "Content from {provider} hidden.". */
  hidden?: string;
}

export interface EmbedConsentDecision {
  /** The provider the visitor answered for. */
  provider: string;
  /** True when "Always load content" was ticked, so the answer is kept for the next visit. */
  remembered: boolean;
}

export interface EmbedConsentProps extends Omit<ComponentProps<"div">, "children"> {
  /** Who runs the embed, in words: "Kestrel Maps". Shown in the placeholder, and the name a "yes, always" is remembered under, so two embeds of the same provider share one answer. */
  provider: string;
  /** The provider's privacy policy. Shown as a link that opens in a new tab. */
  privacyHref?: string;
  /** What the provider receives when the embed loads, as short phrases. Name what yours really sends; the default is the least any embed gets. */
  receives?: readonly string[];
  /** The embed itself, usually an iframe. It is not rendered until the visitor agrees, so it makes no request before then. */
  children: ReactNode;
  /** The shape of the embed as width divided by height. The placeholder keeps it, and grows only if its words need more room. Default 16 / 9. */
  aspect?: number;
  /** `always` also offers "Always load content from this provider" and remembers a yes in localStorage; `once` asks every visit and stores nothing. Default "always". */
  remember?: "once" | "always";
  /** Called when the visitor presses Load content. */
  onConsent?: (decision: EmbedConsentDecision) => void;
  /** Called when the visitor revokes consent or hides the embed. */
  onRevoke?: (provider: string) => void;
  /** Take over the decision yourself, for example from a cookie banner: true shows the embed, false the placeholder. The buttons then only call `onConsent` and `onRevoke`. */
  consented?: boolean;
  /** A glyph for the tile above the question. Default a shield with a check. */
  icon?: ReactNode;
  /** The words of the placeholder, for another language. */
  labels?: EmbedConsentLabels;
}

const DEFAULT_RECEIVES = ["Your IP address", "Your browser and device", "The address of this page"] as const;

/**
 * A gate in front of a third-party embed (a map, a calendar, a video, a form),
 * for sites that must not talk to a provider before the visitor agrees. Until
 * then it shows a placeholder that names the provider, lists what the provider
 * will receive and offers one button; the embed itself is never rendered, so
 * no request leaves the page. Pressing Load content swaps the embed in and moves
 * focus to it. Ticking "Always load content from this provider" remembers the
 * answer per provider in localStorage, and every embed of that provider, in any
 * tab, follows it; a line under the embed says so and offers Revoke consent,
 * which brings the placeholder back, puts focus on Load content and says so to
 * a screen reader. With `remember="once"` nothing is stored. Pass `consented`
 * to let your own consent manager decide instead.
 */
export function EmbedConsent({ provider, privacyHref, receives = DEFAULT_RECEIVES, children, aspect = 16 / 9, remember = "always", onConsent, onRevoke, consented, icon, labels, className, ...props }: EmbedConsentProps) {
  const say = (template: string) => template.replace("{provider}", provider);
  const text = {
    title: say(labels?.title ?? "Load content from {provider}?"),
    description: say(labels?.description ?? "This content is hosted by {provider}. Loading it sends them:"),
    load: labels?.load ?? "Load content",
    always: say(labels?.always ?? "Always load content from {provider}"),
    privacy: labels?.privacy ?? "Privacy policy",
    loaded: say(labels?.loaded ?? "Loaded from {provider}"),
    remembered: say(labels?.remembered ?? "Always loading content from {provider}"),
    revoke: labels?.revoke ?? "Revoke consent",
    hide: labels?.hide ?? "Hide",
    announce: say(labels?.announce ?? "Content from {provider} loaded."),
    hidden: say(labels?.hidden ?? "Content from {provider} hidden."),
  };
  const titleId = useId();
  const checkId = useId();
  // The server cannot know the answer, so it renders the placeholder and a returning visitor's embed arrives right after hydration.
  const saved = useSyncExternalStore(
    subscribeConsent,
    () => hasConsent(provider),
    () => false,
  );
  const [thisVisit, setThisVisit] = useState(false);
  const [always, setAlways] = useState(false);
  const [heard, setHeard] = useState("");
  const controlled = consented !== undefined;
  const loaded = controlled ? consented : saved || thisVisit;
  const box = useRef<HTMLDivElement>(null);
  const loadButton = useRef<HTMLButtonElement>(null);
  const pressed = useRef(false);
  const withdrawn = useRef(false);

  // Focus goes to the embed only when the visitor asked for it here, never when a remembered answer loads it with the page.
  useEffect(() => {
    if (!loaded || !pressed.current) return;
    pressed.current = false;
    const element = box.current;
    const target = element?.querySelector<HTMLElement>("iframe, a[href], button, input, [tabindex]:not([tabindex='-1'])") ?? element;
    target?.focus();
  }, [loaded]);

  // The way back mirrors the way in: the button that was pressed is gone, so focus lands on Load content instead of falling to the page.
  useEffect(() => {
    if (loaded || !withdrawn.current) return;
    withdrawn.current = false;
    loadButton.current?.focus();
  }, [loaded]);

  const load = () => {
    const keep = remember === "always" && always;
    pressed.current = true;
    if (!controlled) {
      setThisVisit(true);
      if (keep) giveConsent(provider);
    }
    setHeard(text.announce);
    onConsent?.({ provider, remembered: keep });
  };

  const withdraw = () => {
    pressed.current = false;
    withdrawn.current = true;
    if (!controlled) {
      setThisVisit(false);
      revokeConsent(provider);
    }
    setHeard(text.hidden);
    onRevoke?.(provider);
  };

  return (
    <div data-slot="embed-consent" data-state={loaded ? "loaded" : "blocked"} className={cn("w-full min-w-0", className)} {...props}>
      {loaded ? (
        <>
          <div ref={box} tabIndex={-1} style={{ aspectRatio: aspect }} className="relative overflow-hidden rounded-xl border border-border bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:size-full [&>iframe]:border-0">
            {children}
          </div>
          <div className="mt-2 flex items-start justify-between gap-3 text-xs text-muted-foreground">
            {/* pt-2 puts the first line level with the label of the 32px button; a long provider name wraps instead of being cut. */}
            <p className="min-w-0 pt-2">{saved && !controlled ? text.remembered : text.loaded}</p>
            <Button type="button" variant="ghost" size="sm" onClick={withdraw} className="-mr-2.5 shrink-0 text-muted-foreground">
              {saved || controlled ? text.revoke : text.hide}
            </Button>
          </div>
        </>
      ) : (
        // One grid cell holds two layers: an empty box with the shape of the embed, and the words. The box is as tall as the
        // shape or as the words, whichever is more, so a narrow phone grows the box instead of spilling out of it.
        <div role="group" aria-labelledby={titleId} className="grid min-w-0 grid-cols-1 rounded-xl border border-border bg-muted/50 *:col-start-1 *:row-start-1">
          <span aria-hidden="true" className="w-full" style={{ aspectRatio: aspect }} />
          <div className="grid min-w-0 content-center justify-items-center gap-6 px-5 py-8 text-center sm:px-10">
            <div className="grid justify-items-center gap-3">
              <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-border bg-background text-foreground shadow-xs">
                {icon ?? <IconShieldCheck className="size-5" />}
              </span>
              <p id={titleId} className="text-base font-semibold tracking-[-0.02em] text-balance">
                {text.title}
              </p>
              <p className="max-w-[34ch] text-sm text-pretty text-muted-foreground">{text.description}</p>
              {receives.length ? (
                <ul className="flex flex-wrap justify-center gap-1.5">
                  {receives.map((item) => (
                    <li key={item} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="grid justify-items-center gap-4">
              {remember === "always" ? (
                <div className="flex items-center gap-2.5">
                  <Checkbox id={checkId} checked={always} onCheckedChange={(next) => setAlways(next === true)} />
                  <Label htmlFor={checkId} className="cursor-pointer text-sm font-normal text-muted-foreground">
                    {text.always}
                  </Label>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                <Button ref={loadButton} type="button" onClick={load}>
                  {text.load}
                </Button>
                {privacyHref ? (
                  <a href={privacyHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    {text.privacy}
                    <IconArrowUpRight className="size-4" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
      <p role="status" className="sr-only">
        {heard}
      </p>
    </div>
  );
}
