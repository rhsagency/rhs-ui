"use client";

import { useId, useState } from "react";

import { IconStar } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. */
  max?: number;
  /** Show a score without letting anyone change it; fractions round to the half star. */
  readOnly?: boolean;
  label?: string;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * Stars to give or show a score. Giving one is a radio group underneath, so
 * arrow keys change it and a form submits it; showing one is a single image
 * with its score in words ("4.5 out of 5").
 */
export function Rating({ value, defaultValue = 0, onValueChange, max = 5, readOnly = false, label = "Rating", name, size = 20, className }: RatingProps) {
  const id = useId();
  const [own, setOwn] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const current = value ?? own;
  if (readOnly) {
    const rounded = Math.round(current * 2) / 2;
    return (
      <span data-slot="rating" role="img" aria-label={`${label}: ${rounded} out of ${max}`} className={cn("inline-flex items-center gap-0.5", className)}>
        {Array.from({ length: max }, (_, index) => {
          const fill = Math.max(0, Math.min(1, rounded - index));
          return (
            <span key={index} className="relative inline-flex" style={{ width: size, height: size }}>
              <IconStar size={size} className="text-muted-foreground/40" />
              {fill > 0 ? (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <IconStar size={size} fill="currentColor" className="text-foreground" />
                </span>
              ) : null}
            </span>
          );
        })}
      </span>
    );
  }
  const shown = hover ?? current;
  return (
    <fieldset data-slot="rating" className={cn("inline-flex items-center gap-0.5", className)} onMouseLeave={() => setHover(null)}>
      <legend className="sr-only">{label}</legend>
      {Array.from({ length: max }, (_, index) => {
        const score = index + 1;
        return (
          <label key={score} className="group relative cursor-pointer" onMouseEnter={() => setHover(score)}>
            <input
              type="radio"
              name={name ?? id}
              value={score}
              checked={current === score}
              onChange={() => {
                if (value === undefined) setOwn(score);
                onValueChange?.(score);
              }}
              className="peer sr-only"
            />
            <span className="sr-only">{`${score} ${score === 1 ? "star" : "stars"}`}</span>
            <IconStar
              size={size}
              fill={score <= shown ? "currentColor" : "none"}
              className={cn("transition-[color,transform] duration-150 peer-focus-visible:rounded-sm peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40 motion-safe:group-hover:scale-110", score <= shown ? "text-foreground" : "text-muted-foreground/50")}
            />
          </label>
        );
      })}
    </fieldset>
  );
}
