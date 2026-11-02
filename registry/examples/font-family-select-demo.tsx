"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { FontFamilySelect, type FontFamilySelectProps, type FontOption } from "@rhs-ui/primitives/font-family-select";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

// Fonts every desktop has, so the preview looks the same wherever it opens. The brand font is the one this page does not load.
const FONTS: readonly FontOption[] = [
  { family: "Arial", stack: 'Arial, "Helvetica Neue", Helvetica, sans-serif', group: "Sans" },
  { family: "Verdana", stack: "Verdana, Geneva, sans-serif", group: "Sans" },
  { family: "Trebuchet MS", stack: '"Trebuchet MS", "Lucida Grande", sans-serif', group: "Sans" },
  { family: "Tahoma", stack: "Tahoma, Geneva, sans-serif", group: "Sans" },
  { family: "Halcyon Grotesk", stack: '"Halcyon Grotesk", "Helvetica Neue", Arial, sans-serif', group: "Sans" },
  { family: "Georgia", stack: 'Georgia, "Times New Roman", serif', group: "Serif" },
  { family: "Times New Roman", stack: '"Times New Roman", Times, serif', group: "Serif" },
  { family: "Courier New", stack: '"Courier New", Courier, monospace', group: "Mono" },
  { family: "Impact", stack: 'Impact, "Arial Black", sans-serif', group: "Display" },
  { family: "Arial Black", stack: '"Arial Black", Gadget, sans-serif', group: "Display" },
  { family: "Brush Script MT", stack: '"Brush Script MT", cursive', group: "Display" },
];

/** The fonts without the one this page does not load, for the fields that have nothing to say about a font that is missing. */
const AVAILABLE: readonly FontOption[] = FONTS.filter((font) => font.family !== "Halcyon Grotesk");

const stackOf = (family: string): string => FONTS.find((font) => font.family === family)?.stack ?? "";

/**
 * Holds the room a list that starts open needs, so the preview shows it whole and covers nothing. The room goes
 * back when the person uses what it holds (a press that ends in it, or a key in it), and never for a press
 * elsewhere on the page, or a swipe that scrolls it: a page that shrinks above a finger moves the very thing the
 * finger was about to tap.
 */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const [reserved, setReserved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A moment after the press ends, so that a control that moves away under the pointer still gets its click. A key sent by the demo itself is not use.
  const used = (event: SyntheticEvent) => {
    if (!event.nativeEvent.isTrusted) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReserved(false), 300);
  };
  return (
    <div onPointerUp={used} onKeyDown={used} className={cn("transition-[min-height] duration-200 ease-out motion-reduce:transition-none", reserved ? className : "min-h-0")}>
      {children}
    </div>
  );
}

/** Presses the down arrow in the list of the open field with this name, so the preview starts on a font that is highlighted and not yet chosen. The focus is never touched. */
function Nudge({ panel, times, children }: { panel: string; times: number; children: ReactNode }): React.JSX.Element {
  useEffect(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      const input = document.querySelector<HTMLInputElement>(`[role="dialog"][aria-label="${panel}"] [cmdk-input]`);
      tries += 1;
      if (!input && tries < 40) return;
      window.clearInterval(timer);
      for (let press = 0; press < times; press += 1) input?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    }, 50);
    return () => window.clearInterval(timer);
  }, [panel, times]);
  return <>{children}</>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The visible label also names the list, so what is seen and what is said are the same words. */
function Field({ label, fonts = AVAILABLE, ...props }: { label: string; fonts?: readonly FontOption[] } & Omit<FontFamilySelectProps, "id" | "label" | "fonts">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <FontFamilySelect id={id} label={label} fonts={fonts} {...props} />
    </div>
  );
}

function Typography(): React.JSX.Element {
  const id = useId();
  const [font, setFont] = useState(stackOf("Georgia"));
  // The page keeps its own recent list, so it survives a reload if it wants to.
  const [recent, setRecent] = useState<readonly string[]>([stackOf("Georgia"), stackOf("Arial")]);
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Set the Halcyon headline</h2>
        <p className="text-xs text-muted-foreground">Move through the list: the sample shows each font before you choose it. Escape puts it back.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Heading font</Label>
        <Reserve className="min-h-[39rem] max-[25rem]:min-h-[41rem]">
          <Nudge panel="Heading font" times={2}>
            <FontFamilySelect
              id={id}
              label="Heading font"
              name="heading-font"
              fonts={FONTS}
              value={font}
              recent={recent}
              onValueChange={(next) => {
                setFont(next);
                setRecent((now) => [next, ...now.filter((stack) => stack !== next)].slice(0, 3));
              }}
              defaultOpen
              placement="bottom"
            />
          </Nudge>
        </Reserve>
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{font}</code>
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: every font is set in itself, and the list opens under the sample">
        <Typography />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="A font this page has not loaded: the sample says what it falls back to">
          <Field label="Brand font" fonts={FONTS} defaultValue={stackOf("Halcyon Grotesk")} />
        </Example>
        <Example caption="Your own one-line sample and your own order of headings">
          <Field label="Quote font" sample="Quarterly results, 2026" sampleLines={1} groups={["Serif", "Sans"]} defaultValue={stackOf("Times New Roman")} />
        </Example>
        <Example caption="Nothing chosen yet">
          <Field label="Footer font" />
        </Example>
        <Example caption="Disabled">
          <Field label="Locked by the brand kit" disabled defaultValue={stackOf("Verdana")} />
        </Example>
      </div>
    </div>
  );
}
