"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconCheck, IconClose } from "@rhs-ui/icons";
import { ColorPicker } from "@rhs-ui/primitives/color-picker";
import { contrastRatio, contrastVerdicts, formatRatio, normalizeHex } from "@rhs-ui/primitives/contrast-pair-field/contrast";
import { SwapButton } from "@rhs-ui/primitives/swap-button";
import { cn } from "@/lib/utils";

/** A text colour and the colour it sits on, as `#rrggbb`. */
export interface ContrastPair {
  foreground: string;
  background: string;
}

/** What the field reports: the pair and the contrast ratio between them, from 1 to 21. */
export interface ContrastReading extends ContrastPair {
  ratio: number;
}

export interface ContrastPairFieldProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children" | "name"> {
  /** The pair, when you control it. A colour may be written `#rgb` or `#rrggbb`. */
  value?: ContrastPair;
  /** The pair to start with, when you do not control it. Default dark grey on white. */
  defaultValue?: ContrastPair;
  /** Called with `{ foreground, background, ratio }` whenever either colour changes or the two are swapped. */
  onValueChange?: (reading: ContrastReading) => void;
  /** The colours offered in both pickers, as `#rrggbb`. Default: a set of greys and a few brand-like colours. */
  swatches?: readonly string[];
  /** The name of the group for a screen reader. Default "Text and background colours". */
  label?: string;
  /** The words set in the colours in the sample: a large line (24px) and a normal one (16px). */
  sample?: { large?: string; normal?: string };
  /** The field's name for a plain form submit: the colours go out as `<name>-foreground` and `<name>-background`. */
  name?: string;
}

const DEFAULT_SWATCHES = ["#000000", "#1f2937", "#4b5563", "#9ca3af", "#ffffff", "#f3f4f6", "#fef3c7", "#dbeafe", "#1d4ed8", "#be123c"];
const DEFAULT_PAIR: ContrastPair = { foreground: "#1f2937", background: "#ffffff" };
const DEFAULT_SAMPLE = { large: "Spring sale", normal: "Free shipping on orders over $75. Returns are free for 30 days." };

const tidy = (pair: ContrastPair): ContrastPair => ({ foreground: normalizeHex(pair.foreground) ?? DEFAULT_PAIR.foreground, background: normalizeHex(pair.background) ?? DEFAULT_PAIR.background });

/** The text, once it has stopped changing for `delay` ms. Starting text is never said, and an emptied one is cleared at once. */
function useSettled(text: string, delay: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(text);
  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    if (!text) {
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timer);
  }, [text, delay]);
  return said;
}

/**
 * Chooses a text colour and a background and shows, before the pair ships, how
 * well one can be read on the other. A sample is set in the pair at a normal
 * and a large size, the contrast ratio is written large ("4.8:1") in tabular
 * figures, and the four WCAG checks are answered in words: Normal text AA and
 * AAA, Large text AA and AAA, each with an icon and a word and never colour
 * alone. A Swap button trades the two colours. The ratio is cut, never rounded
 * up to a number it does not reach. The luminance and ratio arithmetic is
 * exported from `contrast-pair-field/contrast`, for a build step or a server.
 */
export function ContrastPairField({ value, defaultValue, onValueChange, swatches = DEFAULT_SWATCHES, label = "Text and background colours", sample, name, className, ...props }: ContrastPairFieldProps) {
  const [own, setOwn] = useState<ContrastPair>(() => tidy(defaultValue ?? DEFAULT_PAIR));
  const pair = tidy(value ?? own);
  const ratio = contrastRatio(pair.foreground, pair.background);
  const verdicts = contrastVerdicts(ratio);
  const words = { ...DEFAULT_SAMPLE, ...sample };

  function change(next: Partial<ContrastPair>) {
    const merged = tidy({ ...pair, ...next });
    if (value === undefined) setOwn(merged);
    onValueChange?.({ ...merged, ratio: contrastRatio(merged.foreground, merged.background) });
  }

  const said = useSettled(`Contrast ${formatRatio(ratio)}. ${verdicts.map((verdict) => `${verdict.label} ${verdict.passes ? "passes" : "fails"}`).join(". ")}.`, 900);

  return (
    <fieldset data-slot="contrast-pair-field" className={cn("@container m-0 grid min-w-0 gap-4 border-0 p-0", className)} {...props}>
      <legend className="sr-only">{label}</legend>

      {/* Side by side with the swap button between them. Where the field is narrower than 17.5rem two hex codes no longer fit on a row, so the pickers stack, the swap button turns to point up and down and sits at the end of the second label. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2.5 gap-y-1.5 @max-[17.5rem]:grid-cols-[minmax(0,1fr)_auto]">
        <span className="text-xs font-medium text-muted-foreground @max-[17.5rem]:col-span-2 @max-[17.5rem]:row-start-1">Text</span>
        <span aria-hidden="true" className="@max-[17.5rem]:hidden" />
        <span className="text-xs font-medium text-muted-foreground @max-[17.5rem]:col-start-1 @max-[17.5rem]:row-start-3 @max-[17.5rem]:self-center">Background</span>
        <ColorPicker
          label="Text"
          value={pair.foreground}
          swatches={swatches}
          name={name ? `${name}-foreground` : undefined}
          onValueChange={(foreground) => change({ foreground })}
          className="w-full min-w-0 @max-[17.5rem]:col-span-2 @max-[17.5rem]:row-start-2 [&>span:first-child]:shrink-0"
        />
        <div className="relative flex @max-[17.5rem]:hidden">
          <SwapButton labelA="Text" labelB="Background" valueA={pair.foreground} valueB={pair.background} onSwap={() => change({ foreground: pair.background, background: pair.foreground })} />
        </div>
        <div className="hidden @max-[17.5rem]:col-start-2 @max-[17.5rem]:row-start-3 @max-[17.5rem]:flex @max-[17.5rem]:self-center">
          <SwapButton labelA="Text" labelB="Background" valueA={pair.foreground} valueB={pair.background} orientation="vertical" size="sm" onSwap={() => change({ foreground: pair.background, background: pair.foreground })} />
        </div>
        <ColorPicker
          label="Background"
          value={pair.background}
          swatches={swatches}
          name={name ? `${name}-background` : undefined}
          onValueChange={(background) => change({ background })}
          className="w-full min-w-0 @max-[17.5rem]:col-span-2 @max-[17.5rem]:row-start-4 [&>span:first-child]:shrink-0"
        />
      </div>

      <div className="grid gap-1.5 overflow-hidden rounded-lg border border-border px-5 py-5 transition-colors duration-150 motion-reduce:transition-none" style={{ color: pair.foreground, backgroundColor: pair.background }}>
        <p className="text-2xl leading-tight font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">{words.large}</p>
        <p className="text-base leading-snug [overflow-wrap:anywhere]">{words.normal}</p>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">Contrast ratio</span>
        <span className="text-3xl leading-none font-semibold tracking-[-0.04em] tabular-nums">{formatRatio(ratio)}</span>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {verdicts.map((verdict) => (
          // The ratio a check needs sits under its name on a narrow screen and in a column of its own where there is room.
          <li key={verdict.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-x-3 px-3.5 py-2.5 text-sm @sm:grid-cols-[1.25rem_minmax(0,1fr)_auto_5.5rem]">
            <span
              aria-hidden="true"
              className={cn(
                "col-start-1 row-span-2 row-start-1 grid size-5 place-items-center rounded-full @sm:row-span-1",
                verdict.passes ? "bg-foreground text-background" : "border border-muted-foreground/60 text-muted-foreground",
              )}
            >
              {verdict.passes ? <IconCheck size={12} strokeWidth={3} /> : <IconClose size={12} strokeWidth={2.5} />}
            </span>
            <span className="col-start-2 row-start-1 min-w-0">
              {verdict.label}
              <span className="sr-only">: </span>
            </span>
            <span className={cn("col-start-3 row-span-2 row-start-1 font-medium @sm:row-span-1", !verdict.passes && "text-muted-foreground")}>{verdict.passes ? "Passes" : "Fails"}</span>
            <span className="col-start-2 row-start-2 text-xs text-muted-foreground tabular-nums @sm:col-start-4 @sm:row-start-1 @sm:text-right">needs {verdict.needs}:1</span>
          </li>
        ))}
      </ul>
      <span role="status" className="sr-only">
        {said}
      </span>
    </fieldset>
  );
}
