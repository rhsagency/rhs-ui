import type { ComponentProps, ReactNode } from "react";

import { IconAlertCircle, IconArchive, IconCheck, IconCircle, IconCircleDot, IconClock, IconClose, IconEye, IconPause, IconUndo } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

/**
 * How loudly a status speaks, in fill and weight rather than hue: `quiet` is
 * a muted fill, `outline` a hairline, `soft` a light fill, `strong` a solid
 * one in semibold, and `critical` the destructive token.
 */
export type StatusEmphasis = "quiet" | "outline" | "soft" | "strong" | "critical";

export interface StatusDefinition {
  /** The word. */
  label: string;
  /** A small glyph drawn before the word, such as `<IconClock />`. It is decorative: the word is the status. */
  glyph?: ReactNode;
  /** Defaults to `outline`. */
  emphasis?: StatusEmphasis;
  /** Extra classes for this status only, such as `border-dashed`. */
  className?: string;
}

/** The vocabulary StatusBadge knows. Spread it into your own map to add statuses: `{ ...defaultStatuses, shipped: { ... } }`. */
export const defaultStatuses: Readonly<Record<string, StatusDefinition>> = {
  draft: { label: "Draft", glyph: <IconCircle />, emphasis: "outline", className: "border-dashed text-muted-foreground" },
  pending: { label: "Pending", glyph: <IconClock />, emphasis: "outline" },
  "in-review": { label: "In review", glyph: <IconEye />, emphasis: "outline" },
  approved: { label: "Approved", glyph: <IconCheck />, emphasis: "soft" },
  active: { label: "Active", glyph: <IconCircleDot />, emphasis: "strong" },
  paused: { label: "Paused", glyph: <IconPause />, emphasis: "quiet" },
  paid: { label: "Paid", glyph: <IconCheck />, emphasis: "soft" },
  overdue: { label: "Overdue", glyph: <IconAlertCircle />, emphasis: "critical" },
  failed: { label: "Failed", glyph: <IconClose />, emphasis: "critical", className: "bg-destructive text-destructive-foreground" },
  refunded: { label: "Refunded", glyph: <IconUndo />, emphasis: "soft" },
  archived: { label: "Archived", glyph: <IconArchive />, emphasis: "quiet" },
};

const EMPHASIS: Record<StatusEmphasis, { variant: BadgeProps["variant"]; className?: string }> = {
  quiet: { variant: "muted" },
  outline: { variant: "outline" },
  soft: { variant: "secondary" },
  strong: { variant: "default", className: "font-semibold" },
  // Darkened toward the foreground so the small red word reaches 4.5:1 on its pale fill.
  critical: { variant: "destructive", className: "font-semibold text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]" },
};

const SIZES = {
  sm: "",
  md: "h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5",
  lg: "h-7 gap-1.5 px-3 text-sm [&>svg]:size-4",
  dot: "size-5 gap-0 px-0 [&>svg]:size-3",
} as const;

export interface StatusBadgeProps extends Omit<ComponentProps<"span">, "children"> {
  /** A key from the vocabulary (draft, pending, in-review, approved, active, paused, paid, overdue, failed, refunded, archived) or any string. "In review" and "in_review" find the same entry. */
  status: string;
  /** The word to show instead of the vocabulary's. */
  label?: string;
  /** Your own statuses, by key. They win over the defaults with the same key; spread `defaultStatuses` to keep the rest. */
  statuses?: Readonly<Record<string, StatusDefinition>>;
  /** 20px, 24px or 28px with the word, or `dot`: only the glyph in a 20px circle, with the word kept for screen readers and in a title. */
  size?: "sm" | "md" | "lg" | "dot";
}

const keyOf = (status: string) => status.trim().toLowerCase().replace(/[\s_]+/g, "-");
const humanise = (status: string) => {
  const words = status.trim().replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * A record's state as a glyph and a word: draft, paid, overdue, archived.
 * States are told apart by glyph, fill, weight and wording, never by colour
 * alone, and only failed and overdue use the destructive token. The text is
 * the status, so a screen reader needs nothing extra; the compact `dot` size
 * keeps the word as hidden text for dense tables. It composes the Badge, so
 * spacing, radius and focus match the rest of the kit.
 */
export function StatusBadge({ status, label, statuses, size = "md", className, ...props }: StatusBadgeProps) {
  const key = keyOf(status);
  const known = statuses?.[key] ?? statuses?.[status] ?? defaultStatuses[key];
  const text = label ?? known?.label ?? humanise(status);
  const look = EMPHASIS[known?.emphasis ?? "outline"];
  const dot = size === "dot";
  return (
    <Badge
      data-slot="status-badge"
      data-status={key}
      data-size={size}
      variant={look.variant}
      title={dot ? text : undefined}
      className={cn(SIZES[size], look.className, known?.className, className)}
      {...props}
    >
      {known?.glyph ?? (dot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current" /> : null)}
      {dot ? <span className="sr-only">{text}</span> : text}
    </Badge>
  );
}
