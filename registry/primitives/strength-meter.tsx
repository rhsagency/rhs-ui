"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/** How strong a value is: 0 is too weak, 4 is strong. It is the scale zxcvbn uses. */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;

/** The five words for the five scores, weakest first. */
export type StrengthLabels = readonly [string, string, string, string, string];

export interface StrengthMeterProps extends Omit<ComponentProps<"div">, "children"> {
  /** How strong the value is, from 0 to 4, as your estimator reports it. Leave it out or pass null while nothing has been typed: the bar stays empty and quiet. */
  score?: StrengthScore | null;
  /** The one thing to fix next, in a few words: "Add another word". Shown under the bar. */
  hint?: string;
  /** The five words for the five levels, for another language or your own wording. Default: Too weak, Weak, Fair, Good, Strong. */
  labels?: StrengthLabels;
  /** What is being rated, said before the level to a screen reader. Default "Strength". */
  name?: string;
  /** How long the score and the hint must hold still before they are announced, in ms, so typing does not chatter. Default 800. */
  announceAfter?: number;
  /** Put the same id on your field's aria-describedby: it is read as "Fair. Add another word". */
  id?: string;
}

const DEFAULT_LABELS: StrengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

/** Where each score sits between destructive and success. The words carry the level, so the tone is only a second signal. */
const TONES = ["destructive", "destructive", "neutral", "neutral", "success"] as const;

const FILL = {
  destructive: "bg-destructive",
  neutral: "bg-foreground",
  success: "bg-[var(--color-success,oklch(0.62_0.15_150))]",
} as const;

/** The text, once it has stopped changing for `delay` ms. Starting text is never said, and an emptied one is cleared at once. */
function useSettledText(text: string, delay: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(text);
  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    if (!text) {
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(text), Math.max(0, delay));
    return () => window.clearTimeout(timer);
  }, [text, delay]);
  return said;
}

/**
 * How strong a password, or any scored input, is: four segments that fill in
 * turn beside a word for the level (Too weak to Strong), and under them the
 * one thing to fix next. The level never rests on colour: the word says it, the
 * extremes carry an icon, and the tone only moves from destructive through
 * neutral to success. Bring your own estimator and hand over its 0 to 4 score.
 * Point your field's aria-describedby at the id and it is read with the field;
 * a polite status repeats a change once it has held still, so typing does not
 * chatter. It stands alone from a rules checklist, and the two sit together.
 */
export function StrengthMeter({ score, hint, labels = DEFAULT_LABELS, name = "Strength", announceAfter = 800, id, className, ...props }: StrengthMeterProps) {
  const level = score === null || score === undefined ? null : (Math.min(4, Math.max(0, Math.round(score))) as StrengthScore);
  const label = level === null ? "" : (labels[level] ?? "");
  const tone = level === null ? null : TONES[level];
  // Five levels on four segments: the weakest score fills half of the first, so even "too weak" answers what was typed.
  const filled = level === null ? 0 : level === 0 ? 0.5 : level;
  const said = useSettledText(level === null ? "" : [label, hint].filter(Boolean).join(". "), announceAfter);

  return (
    <>
      <div id={id} data-slot="strength-meter" data-score={level ?? undefined} data-tone={tone ?? undefined} className={cn("grid gap-1.5", className)} {...props}>
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="grid min-w-0 flex-1 grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((index) => (
              <span key={index} className="h-1.5 overflow-hidden rounded-full bg-muted">
                <span
                  className={cn("block h-full rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none", tone ? FILL[tone] : "bg-foreground")}
                  style={{ width: `${Math.min(1, Math.max(0, filled - index)) * 100}%`, transitionDelay: index < filled ? `${index * 60}ms` : "0ms" }}
                />
              </span>
            ))}
          </div>
          <span className={cn("inline-flex min-h-4 min-w-[4.5rem] items-center gap-1 text-xs font-medium whitespace-nowrap", tone === "destructive" ? "text-destructive" : "text-foreground")}>
            {level === 0 ? <IconAlertCircle size={14} aria-hidden="true" /> : null}
            {level === 4 ? <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" className="text-[var(--color-success,oklch(0.62_0.15_150))]" /> : null}
            {level !== null ? (
              <>
                <span className="sr-only">{name}: </span>
                {label}
                {hint ? <span className="sr-only">. </span> : null}
              </>
            ) : null}
          </span>
        </div>
        {hint ? <p className="text-xs leading-snug text-muted-foreground">{hint}</p> : null}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
    </>
  );
}
