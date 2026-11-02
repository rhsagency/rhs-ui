"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { IconCheck, IconCheckDouble, IconClose, IconCopy, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

import { contrastOn, formatColor, formatOf, formatRatio, gradeOf, parseColor, type ColorFormat, type ContrastGrade } from "./color";

export type { ColorFormat } from "./color";

/** The words the card uses, for translation. `{value}`, `{format}`, `{next}`, `{ratio}`, `{background}` and `{grade}` are filled in. */
export interface ColorTokenCardLabels {
  /** The name of the button that copies the value. Default "Copy {format} value". */
  copy?: string;
  /** What a screen reader hears after a copy. Default "Copied {value}". */
  copied?: string;
  /** What the card says when the clipboard refuses. Default "Could not copy. Select the value and copy it by hand." */
  failed?: string;
  /** The name of the button that moves to the next format; it always contains the format it shows. Default "{format}, switch to {next}". */
  switchFormat?: string;
  /** What a screen reader hears after the format changes. Default "Showing {format}". */
  showing?: string;
  /** The name of the list of contrast results. Default "Contrast". */
  contrast?: string;
  /** The word for the white background. Default "white". */
  white?: string;
  /** The word for the black background. Default "black". */
  black?: string;
  /** Between the ratio and the background: "4.8:1 on white". Default "on". */
  on?: string;
  /** The grade a ratio of 7 or more reaches. Default "AAA". */
  aaa?: string;
  /** From 4.5. Default "AA". */
  aa?: string;
  /** From 3: good enough for large text only. Default "AA large". */
  large?: string;
  /** Below 3. Default "Fail". */
  fail?: string;
  /** What a screen reader hears for each grade, after the ratio. Default "meets AAA, the highest level". */
  aaaNote?: string;
  /** Default "meets AA for text of any size". */
  aaNote?: string;
  /** Default "meets AA for large text only". */
  largeNote?: string;
  /** Default "does not meet AA". */
  failNote?: string;
  /** The line under the value for a colour that cannot be read, so it has no contrast. Default "No contrast: this value is not hex, rgb or oklch." */
  unreadable?: string;
}

export interface ColorTokenCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The colour's name: "Forest 600". It is the heading. */
  name: string;
  /** The colour as CSS: `#0A7D5C`, `rgb(10 125 92)` or `oklch(0.55 0.115 169)`. A colour with alpha is drawn over a checkerboard and measured as laid over white and over black. */
  value: string;
  /** The token that carries it in code: `--color-forest-600`, `text-forest-600`. Shown in mono. */
  token?: string;
  /** Where it is meant to be used: "Primary actions on light surfaces". */
  usage?: string;
  /** The formats the copy button cycles through, in order. Default hex, rgb and oklch. The card starts on the format `value` is written in when it is in the list. */
  copyFormats?: readonly ColorFormat[];
  /** Called after the value was copied, with the text and its format. */
  onCopied?: (text: string, format: ColorFormat) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: ColorTokenCardLabels;
}

const DEFAULT_LABELS = {
  copy: "Copy {format} value",
  copied: "Copied {value}",
  failed: "Could not copy. Select the value and copy it by hand.",
  switchFormat: "{format}, switch to {next}",
  showing: "Showing {format}",
  contrast: "Contrast",
  white: "white",
  black: "black",
  on: "on",
  aaa: "AAA",
  aa: "AA",
  large: "AA large",
  fail: "Fail",
  aaaNote: "meets AAA, the highest level",
  aaNote: "meets AA for text of any size",
  largeNote: "meets AA for large text only",
  failNote: "does not meet AA",
  unreadable: "No contrast: this value is not hex, rgb or oklch.",
} satisfies Required<ColorTokenCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const FORMATS: readonly ColorFormat[] = ["hex", "rgb", "oklch"];

/** The failure text, darkened toward the foreground so the small red word reaches 4.5:1 on its pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** A pass is a check, the narrow pass is a warning and a fail is a cross, so the result reads without colour. */
const GRADE_LOOK: Record<ContrastGrade, { variant: "outline" | "muted" | "destructive"; className?: string; icon: React.JSX.Element }> = {
  aaa: { variant: "outline", icon: <IconCheckDouble /> },
  aa: { variant: "outline", icon: <IconCheck /> },
  large: { variant: "muted", icon: <IconWarning /> },
  fail: { variant: "destructive", className: DANGER_TEXT, icon: <IconClose /> },
};

const CHECKERBOARD = "repeating-conic-gradient(color-mix(in oklch, var(--foreground) 12%, transparent) 0 25%, transparent 0 50%)";

/** How long "Copied" stays on the button. */
const COPIED_MS = 1800;

/**
 * A design colour documented the way a palette page needs it: a large swatch,
 * the name with its token and where to use it, the value in mono with one
 * button that cycles it through hex, rgb and oklch and one that copies what is
 * showing, and the contrast against white and black. The ratio comes from the
 * WCAG 2 formula, worked out in the browser, and each result is a grade in
 * words with a glyph (a check, a warning for large text only, a cross), never
 * colour alone. A grid of these cards is a palette page.
 */
export function ColorTokenCard({ name, value, token, usage, copyFormats = FORMATS, onCopied, headingLevel = 3, locale = "en-US", labels, className, ...props }: ColorTokenCardProps) {
  const text: Required<ColorTokenCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const color = parseColor(value);
  const origin = formatOf(value);
  const formats = (copyFormats.length ? copyFormats : FORMATS).filter((format, index, all) => all.indexOf(format) === index);
  const [format, setFormat] = useState<ColorFormat>(origin !== null && formats.includes(origin) ? origin : (formats[0] ?? "hex"));
  const shown = formats.includes(format) ? format : (formats[0] ?? "hex");
  const next = formats[(formats.indexOf(shown) + 1) % formats.length] ?? shown;
  const current = color ? formatColor(color, shown, value) : value.trim();

  const [said, setSaid] = useState("");
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(current);
      setFailed(false);
      setCopied(true);
      setSaid(fill(text.copied, { value: current }));
      onCopied?.(current, shown);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      setCopied(false);
      setFailed(true);
      setSaid(text.failed);
    }
  }

  function cycle() {
    setFormat(next);
    setCopied(false);
    setFailed(false);
    setSaid(fill(text.showing, { format: next.toUpperCase() }));
  }

  const swatch: CSSProperties =
    color && color.a < 1
      ? { backgroundImage: `linear-gradient(${value}, ${value}), ${CHECKERBOARD}`, backgroundSize: "auto, 14px 14px" }
      : { backgroundColor: value };

  const backgrounds = [
    { key: "white", word: text.white, rgb: { r: 255, g: 255, b: 255 } },
    { key: "black", word: text.black, rgb: { r: 0, g: 0, b: 0 } },
  ];
  const gradeWords: Record<ContrastGrade, string> = { aaa: text.aaa, aa: text.aa, large: text.large, fail: text.fail };
  const gradeNotes: Record<ContrastGrade, string> = { aaa: text.aaaNote, aa: text.aaNote, large: text.largeNote, fail: text.failNote };

  return (
    <Card data-slot="color-token-card" role="group" aria-labelledby={`${id}-name`} className={cn("h-full w-full gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="p-2">
        <div aria-hidden="true" className="h-28 rounded-lg ring-1 ring-foreground/15 ring-inset" style={swatch} />
      </div>
      <div className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
        <div className="grid gap-1">
          <Heading id={`${id}-name`} className="text-[0.9375rem] leading-5 font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">
            {name}
          </Heading>
          {token ? <p className="font-mono text-xs leading-5 break-all text-muted-foreground">{token}</p> : null}
          {usage ? <p className="text-[0.8125rem] leading-5 text-muted-foreground">{usage}</p> : null}
        </div>

        {/* The value and the contrast sit at the foot of the card, so a row of cards lines them up whatever the length of the usage lines above. */}
        <div className="mt-auto grid gap-4">
          <div className="grid gap-1.5">
            {/* The buttons sit beside the value, and drop to a line of their own when the value is too long to share one, so a value is never broken in the middle. */}
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg border border-border bg-muted/40 p-1 pl-2.5">
              <code className="max-w-full min-w-0 py-1 font-mono text-xs leading-5 tabular-nums [overflow-wrap:anywhere]">{current}</code>
              <span className="ml-auto flex shrink-0 items-center gap-0.5">
                {color && formats.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={fill(text.switchFormat, { format: shown.toUpperCase(), next: next.toUpperCase() })}
                    onClick={cycle}
                    className="h-8 shrink-0 px-1.5 font-mono text-[0.6875rem] tracking-[0.06em] text-muted-foreground uppercase hover:text-foreground"
                  >
                    {shown}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={fill(text.copy, { format: shown.toUpperCase() })}
                  onClick={() => void copy()}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                </Button>
              </span>
            </div>
            {failed ? <p className="text-xs leading-4 text-destructive">{text.failed}</p> : null}
          </div>

          {color ? (
            <ul role="list" aria-label={text.contrast} className="grid gap-1.5">
              {backgrounds.map((background) => {
                const ratio = contrastOn(color, background.rgb);
                const grade = gradeOf(ratio);
                const look = GRADE_LOOK[grade];
                const written = formatRatio(ratio, locale);
                return (
                  <li key={background.key} className="flex items-center gap-2.5 rounded-lg border border-border py-1.5 pr-2 pl-1.5">
                    {/* The specimen is drawn, not written: an empty span with generated "Aa" is decoration, so it is not text for a contrast checker to fail on a colour that is meant to fail. */}
                    <span
                      aria-hidden="true"
                      className="grid size-7 shrink-0 place-items-center rounded-md border border-border text-[0.8125rem] leading-none font-semibold before:content-['Aa']"
                      style={{ backgroundColor: background.key === "white" ? "#ffffff" : "#000000", color: value }}
                    />
                    <span aria-hidden="true" className="min-w-0 flex-1 text-[0.8125rem] leading-5">
                      <span className="font-medium tabular-nums">{written}</span> <span className="text-muted-foreground">{text.on} {background.word}</span>
                    </span>
                    <Badge aria-hidden="true" variant={look.variant} className={cn("shrink-0 gap-1", look.className)}>
                      {look.icon}
                      {gradeWords[grade]}
                    </Badge>
                    <span className="sr-only">{`${written} ${text.on} ${background.word}, ${gradeWords[grade]}: ${gradeNotes[grade]}`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">{text.unreadable}</p>
          )}
        </div>
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </Card>
  );
}
