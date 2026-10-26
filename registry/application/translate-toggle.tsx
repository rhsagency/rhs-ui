"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconLanguage } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** Where the translation stands: not asked for, on its way, shown, or failed. */
export type TranslateState = "original" | "translating" | "translated" | "failed";

/** The words of the control, for another language or another tone. `{language}` stands for the name of a language. */
export interface TranslateLabels {
  /** At rest; `{language}` is the language it is translated to. Default "Translate to {language}". */
  translate: string;
  /** While the translation is on its way. Default "Translating…". */
  translating: string;
  /** Once translated, before the way back; `{language}` is the language it was written in. Default "Translated from {language}". */
  translated: string;
  /** The way back to the original. Default "Show original". */
  showOriginal: string;
  /** When it did not work. Default "Could not translate, try again". */
  failed: string;
  /** Said when the translation is shown; `{language}` is the language it is translated to. Default "Showing the {language} translation." */
  spokenTranslated: string;
  /** Said when the original is back; `{language}` is the language it was written in. Default "Showing the original {language} text." */
  spokenOriginal: string;
}

export interface TranslateToggleProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The text as it was written. */
  text: string;
  /** Controlled: where things stand. Pair it with `onStateChange`, and with `translation` once it is `translated`. */
  state?: TranslateState;
  /** Where an uncontrolled control starts. Default "original". */
  defaultState?: TranslateState;
  /** Called with every new state: translating, then translated or failed, and original when the person goes back. */
  onStateChange?: (state: TranslateState) => void;
  /** The translated text. Uncontrolled, it is whatever `onTranslate` returned, kept so going back and forth asks only once. */
  translation?: string;
  /** Translates the text and returns the result. Nothing is ever translated unless this runs, and it only runs when the button is pressed. A rejection shows "Could not translate, try again" and keeps the original. */
  onTranslate?: (text: string) => Promise<string>;
  /** Called when the person goes back to the original. */
  onShowOriginal?: () => void;
  /** The language it was written in, as a name for people: "Dutch". */
  sourceLanguage: string;
  /** The language it is translated to, as a name: "English". */
  targetLanguage: string;
  /** The code of the original text's language, for `lang`: "nl". Lets a screen reader read it in the right voice. */
  sourceLocale?: string;
  /** The code of the translation's language, for `lang`. Default "en". */
  locale?: string;
  /** The words of the control, in another language for a site that is not in English. */
  labels?: Partial<TranslateLabels>;
  /** Classes for the text, so it can match the paragraph around it. */
  textClassName?: string;
}

const WORDS: TranslateLabels = {
  translate: "Translate to {language}",
  translating: "Translating…",
  translated: "Translated from {language}",
  showOriginal: "Show original",
  failed: "Could not translate, try again",
  spokenTranslated: "Showing the {language} translation.",
  spokenOriginal: "Showing the original {language} text.",
};

const fill = (template: string, language: string) => template.replace("{language}", language);

/**
 * Translate a review or a comment and back to the original, for text people
 * wrote in another language. One quiet control: "Translate to English", a
 * spinner that does not move the text, then "Translated from Dutch, show
 * original". A failure says "Could not translate, try again" and keeps the
 * original. The translated text is marked with `lang` so a screen reader
 * switches voice, a polite message announces each swap, and nothing is ever
 * translated by itself: you pass the function that does it.
 */
export function TranslateToggle({
  text,
  state: controlled,
  defaultState = "original",
  onStateChange,
  translation,
  onTranslate,
  onShowOriginal,
  sourceLanguage,
  targetLanguage,
  sourceLocale,
  locale = "en",
  labels,
  textClassName,
  className,
  ...props
}: TranslateToggleProps) {
  const words = { ...WORDS, ...labels };
  const [own, setOwn] = useState<TranslateState>(defaultState);
  const [kept, setKept] = useState<{ source: string; result: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pending = useRef(false);
  const alive = useRef(true);

  const state = controlled ?? own;
  const result = translation ?? (kept && kept.source === text ? kept.result : undefined);
  // The translation is only shown once there is one, so a controlled "translated" without text never blanks the review.
  const showing = state === "translated" && result !== undefined;
  const busy = state === "translating";

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  function move(next: TranslateState): void {
    if (controlled === undefined) setOwn(next);
    onStateChange?.(next);
  }

  // Whoever changes the state, the swap is said once; the first render says nothing.
  const said = useRef(state);
  const latest = useRef({ words, sourceLanguage, targetLanguage });
  latest.current = { words, sourceLanguage, targetLanguage };
  useEffect(() => {
    if (said.current === state) return;
    said.current = state;
    const { words: now, sourceLanguage: from, targetLanguage: to } = latest.current;
    setAnnouncement(
      state === "translating" ? now.translating : state === "translated" ? fill(now.spokenTranslated, to) : state === "failed" ? now.failed : fill(now.spokenOriginal, from),
    );
  }, [state]);

  async function translate(): Promise<void> {
    if (pending.current) return;
    pending.current = true;
    move("translating");
    try {
      if (!onTranslate) throw new Error("No onTranslate was given.");
      const next = await onTranslate(text);
      if (!alive.current) return;
      setKept({ source: text, result: next });
      move("translated");
    } catch {
      if (alive.current) move("failed");
    } finally {
      pending.current = false;
    }
  }

  function press(): void {
    if (busy) return;
    if (state === "translated") {
      move("original");
      onShowOriginal?.();
    } else if (state === "original" && result !== undefined) {
      move("translated");
    } else {
      void translate();
    }
  }

  const failed = state === "failed";
  const back = words.showOriginal.charAt(0).toLowerCase() + words.showOriginal.slice(1);
  const name = showing ? `${fill(words.translated, sourceLanguage)}, ${back}` : busy ? words.translating.replace(/…$/, "") : failed ? words.failed : fill(words.translate, targetLanguage);

  return (
    <div data-slot="translate-toggle" data-state={state} className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {/* The text is marked with its own language, so a screen reader reads each version in the right voice. */}
      <p
        key={showing ? "translated" : "original"}
        lang={showing ? locale : sourceLocale}
        aria-busy={busy || undefined}
        className={cn("text-sm leading-relaxed break-words transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none", busy && "opacity-60", textClassName)}
      >
        {showing ? result : text}
      </p>
      <div className="flex min-h-6 items-center">
        <Button
          type="button"
          variant="link"
          aria-label={name}
          aria-busy={busy || undefined}
          aria-disabled={busy || undefined}
          onClick={press}
          className={cn(
            // The side padding is pulled back out with a negative margin: the words stay in line with the text, and the focus ring has room.
            "-mx-1 h-6 min-w-0 gap-1.5 rounded-sm px-1 text-[0.8125rem] font-medium text-muted-foreground hover:text-foreground hover:no-underline aria-disabled:cursor-progress aria-disabled:hover:text-muted-foreground",
            // A failed control reads as red text but is a retry, so it underlines on hover like a link.
            failed && "text-destructive hover:text-destructive hover:underline",
          )}
        >
          {busy ? <Spinner size={14} label="" role="presentation" aria-hidden="true" /> : failed ? <IconAlertCircle className="size-3.5" /> : <IconLanguage className="size-3.5" />}
          <span aria-hidden="true" className="min-w-0 truncate">
            {showing ? (
              <>
                {fill(words.translated, sourceLanguage)}
                <span className="px-1.5 font-normal opacity-60">&middot;</span>
                <span className="text-foreground underline decoration-border underline-offset-4 transition-colors group-hover/button:decoration-foreground">{words.showOriginal}</span>
              </>
            ) : busy ? (
              words.translating
            ) : failed ? (
              words.failed
            ) : (
              fill(words.translate, targetLanguage)
            )}
          </span>
        </Button>
      </div>
    </div>
  );
}
