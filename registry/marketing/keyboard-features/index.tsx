"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconKeyboard } from "@rhs-ui/icons";
import { endsWith, keyLabel, MODIFIER_KEYS, modifierLabel, parseShortcut, type KeyLabel, type KeyLike, type Platform } from "@rhs-ui/marketing/keyboard-features/keys";
import { Card, CardContent, CardDescription } from "@rhs-ui/primitives/card";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface KeyboardShortcut {
  /** A stable key for the shortcut: "palette". */
  id: string;
  /**
   * The keys, written as text. "Mod+K" holds Mod (Cmd on a Mac, Ctrl elsewhere) and presses K, and "?" and "Esc" are
   * single keys. A sequence is written the way it is said, "G then P", or as a list, ["G", "P"]: press G, let go,
   * then press P. Modifiers are Mod, Ctrl, Alt, Shift and Meta.
   */
  keys: string | readonly string[];
  /** What it does, verb first: "Open the command palette". */
  title: string;
  /** One line more: where it works, or what it saves. */
  description: string;
}

export interface KeyboardFeaturesLabels {
  /** Said between the steps of a sequence: "G then P". */
  then: string;
  /** Read out between the keys of one step: "Command plus K". It is not shown. */
  plus: string;
  /** The line under the cards that invites a reader to press the keys. */
  hint: string;
}

const LABELS: KeyboardFeaturesLabels = { then: "then", plus: "plus", hint: "Try it: press any of these shortcuts and its card lights up." };

export interface KeyboardFeaturesProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Everything is a keystroke away". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Six to nine shortcuts, the ones people learn first at the top. They are also the index of what the keyboard can do, so every key is written out as text. */
  shortcuts: readonly KeyboardShortcut[];
  /** Which keyboard to write the keys for. "auto" reads it after the page has loaded, and until then Mod says Cmd/Ctrl, so the server never shows a Mac key to a Windows reader. "mac" and "other" fix it, for a page that knows. */
  platform?: "auto" | "mac" | "other";
  /** The action under the cards: a Button or a link styled as one, such as "See every shortcut". */
  cta?: ReactNode;
  /** Stops the browser from doing its own thing with a shortcut that matches a card: no quick find on "/", no address bar on Ctrl+K. Off by default, because a marketing page should not take keys from its visitor. */
  preventDefault?: boolean;
  /** The level of the heading: 2 by default. Each card's title sits one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<KeyboardFeaturesLabels>;
}

/** How long a card stays lit after its shortcut, in ms. */
const LIT_MS = 1000;
/** How long the next key of a sequence may take, in ms. */
const SEQUENCE_MS = 1200;

const subscribeNever = (): (() => void) => () => undefined;

/** No sequence under way: one object, so setting it again is not a change. */
const NONE: Record<string, number> = {};

/** The keyboard the reader has. Only read in the browser, and only after hydration. */
function detectPlatform(): Platform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const hint = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(hint) || /mac|iphone|ipad/i.test(navigator.userAgent) ? "mac" : "other";
}

/** Whether a key is going into a field. A shortcut must never fire while someone types a sentence. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.closest("input, textarea, select, [contenteditable=''], [contenteditable='true'], [role='textbox'], [role='searchbox'], [role='combobox']") !== null;
}

/** A keycap: the key as text, drawn with a heavier bottom edge. When it is pressed it turns solid and sinks a pixel, unless motion is reduced. */
function Key({ label, pressed }: { label: KeyLabel; pressed: boolean }) {
  return (
    <Kbd
      data-pressed={pressed || undefined}
      className="h-9 min-w-9 rounded-lg border border-b-[3px] border-foreground/15 border-b-foreground/25 bg-background px-2.5 text-[0.8125rem] font-medium text-foreground shadow-xs transition-[background-color,color,border-color,translate] duration-150 motion-safe:data-[pressed]:translate-y-px motion-safe:data-[pressed]:border-foreground motion-safe:data-[pressed]:bg-foreground motion-safe:data-[pressed]:text-background motion-reduce:transition-none"
    >
      <span aria-hidden={label.spoken ? "true" : undefined} className={cn(label.spoken && label.text.length === 1 && "text-base leading-none")}>
        {label.text}
      </span>
      {label.spoken ? <span className="sr-only">{label.spoken}</span> : null}
    </Kbd>
  );
}

/**
 * The shortcuts of a keyboard-first product as a grid of cards: the keys drawn
 * as keycaps, a title that starts with a verb and a line of detail. It is
 * playful and it is also the index of what the keyboard can do. Press a real
 * shortcut while no field has focus and its card lights up for a second, its
 * keys turn solid, and its title is announced politely to a screen reader; a
 * sequence such as G then P lights its first key and waits a moment for the
 * second. Under reduced motion nothing fades, lifts or flips: the card gets a
 * bold outline instead. Mod is Cmd on a Mac and Ctrl elsewhere, chosen after
 * hydration, so the server HTML says Cmd/Ctrl and no reader is shown a key
 * they do not have. Every key is text, with a spoken name where it is a
 * symbol, so the cards read as a plain list of shortcuts without scripting.
 * Nothing is taken from the browser unless you ask for it.
 */
export function KeyboardFeatures({ title, description, shortcuts, platform = "auto", cta, preventDefault = false, headingLevel = 2, labels: custom, className, ...props }: KeyboardFeaturesProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Name = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const detected = useSyncExternalStore(subscribeNever, detectPlatform, () => "unknown" as const);
  const resolved: Platform | "unknown" = platform === "auto" ? detected : platform;
  const parsed = useMemo(() => shortcuts.map((shortcut) => ({ shortcut, steps: parseShortcut(shortcut.keys) })), [shortcuts]);

  const [lit, setLit] = useState<string | null>(null);
  const [partial, setPartial] = useState<Record<string, number>>(NONE);
  const [said, setSaid] = useState({ text: "", count: 0 });
  const history = useRef<(KeyLike & { at: number })[]>([]);
  const timers = useRef<{ lit?: number; partial?: number; said?: number }>({});

  useEffect(() => {
    if (resolved === "unknown") return;
    const light = (item: (typeof parsed)[number]) => {
      setLit(item.shortcut.id);
      setPartial(NONE);
      setSaid((before) => ({ text: item.shortcut.title, count: before.count + 1 }));
      window.clearTimeout(timers.current.lit);
      timers.current.lit = window.setTimeout(() => setLit(null), LIT_MS);
      window.clearTimeout(timers.current.said);
      timers.current.said = window.setTimeout(() => setSaid((before) => ({ text: "", count: before.count })), 2500);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.repeat || MODIFIER_KEYS.has(event.key) || isTyping(event.target)) return;
      const entry = { key: event.key, code: event.code, metaKey: event.metaKey, ctrlKey: event.ctrlKey, altKey: event.altKey, shiftKey: event.shiftKey, at: event.timeStamp };
      // The keys of the last moment, oldest first: a sequence is the tail of them.
      const recent = [...history.current.filter((past) => entry.at - past.at <= SEQUENCE_MS).slice(-3), entry];
      history.current = recent;

      let match: (typeof parsed)[number] | undefined;
      // Every sequence the keys so far could be the start of, and how many of its steps are done.
      const progress: Record<string, number> = {};
      for (const item of parsed) {
        const count = item.steps.length;
        if (endsWith(recent, item.steps, resolved)) {
          if (!match || count > match.steps.length) match = item;
          continue;
        }
        // How much of a sequence has been pressed so far: its first key, or its first two.
        for (let steps = Math.min(count - 1, recent.length); steps >= 1; steps--) {
          if (endsWith(recent, item.steps.slice(0, steps), resolved)) {
            progress[item.shortcut.id] = steps;
            break;
          }
        }
      }

      if (match) {
        history.current = [];
        if (preventDefault) event.preventDefault();
        light(match);
        return;
      }
      const started = Object.keys(progress).length > 0;
      setPartial(started ? progress : NONE);
      window.clearTimeout(timers.current.partial);
      if (started) timers.current.partial = window.setTimeout(() => setPartial(NONE), SEQUENCE_MS);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [parsed, resolved, preventDefault]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      window.clearTimeout(pending.lit);
      window.clearTimeout(pending.partial);
      window.clearTimeout(pending.said);
    };
  }, []);

  return (
    <section data-slot="keyboard-features" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      <ul role="list" className="mt-10 grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3 @3xl:mt-14">
        {parsed.map(({ shortcut, steps }) => {
          const isLit = lit === shortcut.id;
          const progressed = partial[shortcut.id] ?? 0;
          return (
            <li key={shortcut.id} className="min-w-0">
              <Card
                data-lit={isLit || undefined}
                data-partial={progressed > 0 || undefined}
                className="h-full gap-0 py-0 transition-[border-color,background-color,box-shadow,transform] duration-300 data-[partial]:border-foreground/50 data-[lit]:border-foreground motion-safe:data-[lit]:-translate-y-0.5 motion-safe:data-[lit]:bg-muted motion-safe:data-[lit]:shadow-sm motion-reduce:transition-none motion-reduce:data-[lit]:outline-2 motion-reduce:data-[lit]:outline-offset-2 motion-reduce:data-[lit]:outline-foreground"
              >
                <CardContent className="flex h-full flex-col gap-6 py-6">
                  <div className="flex min-h-9 flex-wrap items-center gap-x-2.5 gap-y-2">
                    {steps.map((step, stepIndex) => {
                      const caps = [...step.modifiers.map((modifier) => modifierLabel(modifier, resolved)), keyLabel(step.key, resolved)];
                      return (
                        <Fragment key={stepIndex}>
                          {stepIndex > 0 ? <span className="text-xs text-muted-foreground">{labels.then}</span> : null}
                          <span className="inline-flex items-center gap-1">
                            {caps.map((cap, capIndex) => (
                              <Fragment key={capIndex}>
                                {capIndex > 0 ? <span className="sr-only"> {labels.plus} </span> : null}
                                <Key label={cap} pressed={isLit || stepIndex < progressed} />
                              </Fragment>
                            ))}
                          </span>
                        </Fragment>
                      );
                    })}
                  </div>
                  <div>
                    <Name data-slot="card-title" className="text-base leading-snug font-medium tracking-[-0.01em] text-balance">
                      {shortcut.title}
                    </Name>
                    <CardDescription className="mt-1.5 leading-relaxed text-pretty">{shortcut.description}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <p className="mt-8 hidden items-center justify-center gap-2 text-center text-sm text-muted-foreground [@media(hover:hover)]:flex">
        <IconKeyboard aria-hidden="true" className="size-4 shrink-0" />
        {labels.hint}
      </p>
      {cta ? <div className="mt-6 flex justify-center">{cta}</div> : null}

      {/* The title of the shortcut just pressed, said politely. A new element for every press makes a repeated press a new message. */}
      <p role="status" aria-live="polite" className="sr-only">
        <span key={said.count}>{said.text}</span>
      </p>
    </section>
  );
}
