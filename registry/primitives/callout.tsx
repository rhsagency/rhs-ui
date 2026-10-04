import type { ReactNode } from "react";

import { IconAlertCircle, IconIdea, IconInfo, IconWarning } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CalloutProps {
  /** What kind of note this is; the word is read out before the text. */
  tone?: "note" | "tip" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  className?: string;
}

const TONE = {
  note: { icon: <IconInfo />, word: "Note", className: "border-border bg-muted/50" },
  tip: { icon: <IconIdea />, word: "Tip", className: "border-border bg-background" },
  warning: { icon: <IconWarning />, word: "Warning", className: "border-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_45%,transparent)] bg-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_10%,transparent)]" },
  danger: { icon: <IconAlertCircle />, word: "Danger", className: "border-destructive/40 bg-destructive/8" },
} as const;

/**
 * A note set apart inside docs or an article: note, tip, warning or danger,
 * each with its own icon and a word that says what it is. Not a live
 * alert; it does not interrupt a screen reader.
 */
export function Callout({ tone = "note", title, children, className }: CalloutProps) {
  const look = TONE[tone];
  return (
    <aside data-slot="callout" data-tone={tone} className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", look.className, className)}>
      <span aria-hidden="true" className="mt-0.5 shrink-0 [&_svg]:size-4">{look.icon}</span>
      <div className="min-w-0">
        <p className="font-medium"><span className="sr-only">{look.word}: </span>{title ?? look.word}</p>
        <div className="mt-1 text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono">{children}</div>
      </div>
    </aside>
  );
}
