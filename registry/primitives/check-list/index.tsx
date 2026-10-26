import type { ComponentProps, ReactNode } from "react";

import { IconCheck, IconMinus } from "@rhs-ui/icons";
import { InfoTip } from "@rhs-ui/primitives/check-list/tip";
import { cn } from "@/lib/utils";

export interface CheckListItem {
  /** The line: "Unlimited projects". */
  label: ReactNode;
  /** Whether it is part of the plan, the product or the setup. Default true. An excluded line shows a dash and quieter text. */
  included?: boolean;
  /** One short line under the label, in muted text: "Billed per workspace". */
  hint?: ReactNode;
  /** A longer explanation in a tooltip, opened by a small info button after the label. Opens on hover, on focus and on a tap. */
  tooltip?: ReactNode;
  /** A stable key, when the labels are not unique. */
  id?: string;
}

export interface CheckListProps extends Omit<ComponentProps<"ul">, "children"> {
  /** The lines, each with a label and optionally `included`, a `hint` and a `tooltip`. */
  items: readonly CheckListItem[];
  /** The text and icon size: 13, 14 or 16px. Default "md". */
  size?: "sm" | "md" | "lg";
  /** How loud the list is. `default` is for a card on the page, `muted` for a secondary list, `inverted` for a card with a solid fill. */
  tone?: "default" | "muted" | "inverted";
  /** The words only a screen reader hears before each line, for another language. */
  labels?: { included?: string; excluded?: string };
}

const SIZE = {
  sm: { list: "gap-y-2", row: "gap-x-2.5 text-[0.8125rem] leading-5", icon: "h-5", glyph: "size-3.5" },
  md: { list: "gap-y-3", row: "gap-x-3 text-sm leading-5", icon: "h-5", glyph: "size-4" },
  lg: { list: "gap-y-3.5", row: "gap-x-3.5 text-base leading-6", icon: "h-6", glyph: "size-[1.125rem]" },
} as const;

const TONE = {
  default: { yes: "text-foreground", yesIcon: "text-foreground", no: "text-muted-foreground", noIcon: "text-muted-foreground/70", hint: "text-muted-foreground", tip: "" },
  muted: { yes: "text-muted-foreground", yesIcon: "text-muted-foreground", no: "text-muted-foreground/80", noIcon: "text-muted-foreground/50", hint: "text-muted-foreground/80", tip: "" },
  inverted: { yes: "text-primary-foreground", yesIcon: "text-primary-foreground", no: "text-primary-foreground/60", noIcon: "text-primary-foreground/45", hint: "text-primary-foreground/65", tip: "text-primary-foreground/70 hover:text-primary-foreground" },
} as const;

/**
 * What is included and what is not, one line each: a check or a dash with the
 * label, and for a screen reader the words "Included" or "Not included", so a
 * plan comparison reads correctly aloud and never depends on an icon. The icon
 * is centred on the first line of its text, also when the text wraps. A line
 * can carry a short hint underneath and a tooltip behind a small info button.
 * It is a plain unordered list, a Server Component unless a line has a tooltip.
 * Use it in plan cards, product benefits and requirements.
 */
export function CheckList({ items, size = "md", tone = "default", labels, className, ...props }: CheckListProps) {
  const look = SIZE[size];
  const colors = TONE[tone];
  return (
    <ul role="list" data-slot="check-list" data-size={size} data-tone={tone} className={cn("grid content-start", look.list, className)} {...props}>
      {items.map((item, index) => {
        const included = item.included ?? true;
        const Icon = included ? IconCheck : IconMinus;
        const name = typeof item.label === "string" ? item.label : undefined;
        return (
          <li key={item.id ?? `${index}-${name ?? ""}`} data-included={included} className={cn("grid grid-cols-[auto_minmax(0,1fr)]", look.row)}>
            <span aria-hidden="true" className={cn("flex w-4 items-center justify-center", look.icon)}>
              <Icon strokeWidth={included ? 2 : 1.75} className={cn(look.glyph, included ? colors.yesIcon : colors.noIcon)} />
            </span>
            <span className="min-w-0">
              <span className="sr-only">{included ? (labels?.included ?? "Included") : (labels?.excluded ?? "Not included")}: </span>
              <span className={included ? colors.yes : colors.no}>{item.label}</span>
              {item.tooltip ? (
                <InfoTip label={name ? `More about ${name}` : "More information"} tone={tone} className={cn("-my-1 ms-1 align-middle", colors.tip)}>
                  {item.tooltip}
                </InfoTip>
              ) : null}
              {item.hint ? <span className={cn("mt-0.5 block text-xs leading-4", colors.hint)}>{item.hint}</span> : null}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
