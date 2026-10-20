"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FormEvent, type KeyboardEvent } from "react";

import { IconArrowRight, IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface PromptHeroProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** The headline above the box. */
  title: string;
  /** One line under the title. */
  description?: string;
  /** What the empty box suggests. */
  placeholder?: string;
  /** Text the box starts with, for a prompt carried over from a link or an earlier visit. */
  defaultValue?: string;
  /** The text in the box when your app owns it: clear it after a send, or keep a draft through sign-up. Pair it with onValueChange. */
  value?: string;
  /** Called with the new text whenever it changes, by typing or by pressing an example. */
  onValueChange?: (value: string) => void;
  /** Example prompts, shown as chips. Pressing one fills the box; it never submits. */
  examples?: readonly string[];
  /** Called with the trimmed prompt. Return a promise to show the busy state until it settles. */
  onSubmit: (prompt: string) => void | Promise<void>;
  /** The most characters the box accepts. The count appears in the last tenth. */
  maxLength?: number;
  /** The button's text. */
  submitLabel?: string;
  /** What happens to the prompt next, in one line under the chips: "We save it, then ask you to create a free account." */
  next?: string;
  /** Up to three short things the product does, each with a check. */
  capabilities?: readonly string[];
  /** The box's accessible name; it has no visible label. */
  label?: string;
  /** The line above the example chips. */
  examplesLabel?: string;
  /** Shown when onSubmit rejects. The prompt stays in the box. */
  errorMessage?: string;
}

/** The box grows with the text up to this many lines, then scrolls. */
const MAX_LINES = 6;

function fitToText(node: HTMLTextAreaElement) {
  node.style.height = "auto";
  const style = getComputedStyle(node);
  const line = Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.5;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const max = line * MAX_LINES + padding;
  node.style.height = `${Math.min(node.scrollHeight, max)}px`;
  node.style.overflowY = node.scrollHeight > max ? "auto" : "hidden";
}

/**
 * An AI product's opening where the first action is typing: a large prompt
 * box that grows to six lines, a submit button with a keyboard hint, and
 * example chips that fill the box. Enter submits and Shift+Enter adds a line;
 * on a touch screen, which has no Shift+Enter, Enter adds the line and the
 * button submits. An empty prompt disables the button and says why in words.
 * There is no streaming and no model logic here: the prompt is handed to your
 * app, typically to carry it through sign-up. The text is uncontrolled by
 * default; pass value and onValueChange to clear it after a send or to keep a
 * draft.
 */
export function PromptHero({
  titleAs: Title = "h2",
  title,
  description,
  placeholder = "Describe what you want to make",
  defaultValue = "",
  value: valueProp,
  onValueChange,
  examples = [],
  onSubmit,
  maxLength = 1000,
  submitLabel = "Start",
  next,
  capabilities = [],
  label = "Your prompt",
  examplesLabel = "Or start from an example",
  errorMessage = "That did not go through. Your prompt is still here, so try again.",
  className,
  ...props
}: PromptHeroProps) {
  const id = useId();
  const field = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue.slice(0, maxLength));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const value = valueProp ?? inner;
  const prompt = value.trim();
  const empty = prompt.length === 0;
  const counting = value.length >= Math.ceil(maxLength * 0.9);
  const remaining = maxLength - value.length;
  // The count a screen reader hears moves in steps of ten, from the moment the last tenth begins to the limit; the visible one moves on every key.
  const step = counting ? Math.max(0, Math.ceil(remaining / 10)) : -1;
  const [heard, setHeard] = useState({ step, remaining });
  if (heard.step !== step) setHeard({ step, remaining });
  const heardText = heard.step < 0 ? "" : `${heard.remaining} ${heard.remaining === 1 ? "character" : "characters"} left`;

  function setValue(text: string) {
    if (valueProp === undefined) setInner(text);
    onValueChange?.(text);
  }

  useLayoutEffect(() => {
    if (field.current) fitToText(field.current);
  }, [value]);

  // A narrower screen wraps the same text onto more lines.
  useEffect(() => {
    const refit = () => {
      if (field.current) fitToText(field.current);
    };
    window.addEventListener("resize", refit);
    return () => window.removeEventListener("resize", refit);
  }, []);

  async function submit() {
    if (empty || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await onSubmit(prompt);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    // A touch keyboard has no Shift+Enter, so there Enter adds a line and only the button sends. Ctrl or Cmd with Enter sends on any device.
    const touch = !event.ctrlKey && !event.metaKey && typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    if (touch) return;
    event.preventDefault();
    void submit();
  }

  function fillWith(example: string) {
    setValue(example.slice(0, maxLength));
    setFailed(false);
    requestAnimationFrame(() => {
      const node = field.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(node.value.length, node.value.length);
    });
  }

  return (
    <section data-slot="prompt-hero" className={cn("py-16 text-center sm:py-24", className)} {...props}>
      <Title className="mx-auto max-w-3xl text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
      {description ? <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
      <form
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void submit();
        }}
        className="mx-auto mt-10 max-w-2xl rounded-2xl border border-input bg-card text-left shadow-sm transition-[border-color,box-shadow] duration-150 has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-[3px] has-[textarea:focus-visible]:ring-ring/40 motion-reduce:transition-none"
      >
        <label htmlFor={`${id}-prompt`} className="sr-only">
          {label}
        </label>
        <Textarea
          ref={field}
          id={`${id}-prompt`}
          value={value}
          rows={2}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setValue(event.target.value);
            setFailed(false);
          }}
          onKeyDown={onKeyDown}
          className="min-h-28 resize-none rounded-2xl border-0 bg-transparent px-5 pt-5 pb-2 text-base shadow-none placeholder:text-muted-foreground/80 focus-visible:border-transparent focus-visible:ring-0 sm:text-lg"
        />
        <div className="flex items-center gap-3 px-3 pb-3 pl-5">
          <p id={`${id}-hint`} className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
            {empty ? (
              "Write a prompt or pick an example to start."
            ) : (
              <span className="hidden items-center gap-x-4 gap-y-1 sm:flex sm:flex-wrap [@media(pointer:coarse)]:invisible">
                <span className="inline-flex items-center gap-1.5">
                  <Kbd>Enter</Kbd> to send
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <KbdGroup>
                    <Kbd>Shift</Kbd>
                    <Kbd>Enter</Kbd>
                  </KbdGroup>
                  for a new line
                </span>
              </span>
            )}
          </p>
          <span aria-hidden="true" className={cn("shrink-0 text-xs tabular-nums text-muted-foreground", value.length >= maxLength && "font-medium text-destructive")}>
            {counting ? `${value.length} / ${maxLength}` : ""}
          </span>
          <span role="status" className="sr-only">
            {heardText}
          </span>
          <Button type="submit" disabled={empty} loading={busy} aria-describedby={`${id}-hint`} className="shrink-0">
            {submitLabel}
            <IconArrowRight />
          </Button>
        </div>
        {failed ? (
          <p role="alert" className="px-5 pb-3 text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}
      </form>
      {examples.length ? (
        <div className="mx-auto mt-6 max-w-2xl">
          <p id={`${id}-examples`} className="text-xs text-muted-foreground">
            {examplesLabel}
          </p>
          <ul aria-labelledby={`${id}-examples`} className="mt-3 flex flex-wrap justify-center gap-2">
            {examples.map((example) => (
              <li key={example} className="flex max-w-full min-w-0">
                <button
                  type="button"
                  onClick={() => fillWith(example)}
                  className="inline-flex max-w-full min-w-0 items-center rounded-[1.25rem] border border-border bg-background px-3.5 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 outline-none hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  <span className="sr-only">Use this example: </span>
                  <span>{example}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {next ? <p className="mt-8 text-sm text-muted-foreground">{next}</p> : null}
      {capabilities.length ? (
        <ul className="mx-auto mt-6 flex w-fit max-w-full flex-col items-start gap-y-2 text-left text-sm sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-7 sm:text-center">
          {capabilities.slice(0, 3).map((capability) => (
            <li key={capability} className="inline-flex items-center gap-2">
              <IconCheck className="size-4 text-muted-foreground" />
              {capability}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
