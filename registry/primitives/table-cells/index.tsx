import type { ComponentProps, ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconInfo, IconMinus, IconWarning, type IconProps } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge, badgeVariants } from "@rhs-ui/primitives/badge";
import { Progress } from "@rhs-ui/primitives/progress";
import { DateCellView } from "@rhs-ui/primitives/table-cells/date-cell";
import { formatAmount } from "@rhs-ui/primitives/table-cells/format";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/*
 * The seven cells every table needs: a person, a date, an amount, a status, a meter, tags and actions. Each one is the
 * content of a TableCell, not a cell itself, so it fits a hand-written table, a `cell` function of a column list and a
 * plain list alike. Each fixes what tables get wrong: the flex children that must be `min-w-0` for a long name to
 * truncate, a width cap so the column does not grow with the longest name, numbers that never wrap, and one vertical
 * rhythm (two lines of text are as tall as the avatar, and a button row does not stretch the row). None of them knows
 * your data: they take plain values. Only the date cell needs the browser; the rest render on the server.
 */

const fill = (template: string, values: Readonly<Record<string, string | number>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** A cell with nothing to show: a quiet dash for the eye, and a word for a screen reader. */
function Nothing({ slot, label, className, ...props }: { slot: string; label: string } & ComponentProps<"span">) {
  return (
    <span data-slot={slot} className={cn("whitespace-nowrap text-muted-foreground", className)} {...props}>
      <span aria-hidden="true">-</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface DateCellProps extends Omit<ComponentProps<"time">, "dateTime" | "children"> {
  /** The moment: a Date, a timestamp or an ISO string. A string like "2026-11-07" is a calendar date with no time. */
  value: Date | string | number | null | undefined;
  /** The locale that writes the words and the date. Default "en-US". */
  locale?: string;
  /** The time zone dates are written in and days are counted in. Default "UTC", so the server and the browser agree. */
  timeZone?: string;
  /** What "now" is, for the relative form. Pass it when the text must be the same every time (a report, a screenshot). Without it the relative form is worked out in the browser after the first paint, and the first paint shows the date. */
  now?: Date | string | number;
  /** Write "3 days ago" instead of the date, while the date is close enough. Default true. */
  relative?: boolean;
  /** How many days away a date may be and still be written as "3 days ago"; further than that it shows the date. Default 30. */
  relativeWithin?: number;
  /** The value has no time of day, so the tooltip leaves the time out. Default true for a string like "2026-11-07". */
  dateOnly?: boolean;
  /** What a screen reader hears when there is no date. Default "No date". */
  emptyLabel?: string;
}

/**
 * A date in a table cell, as a real `time` element with its machine-readable value. It reads "3 days ago" or "yesterday"
 * while the date is close, then the date itself, and the full date with the day of the week, the time and the zone is in a
 * tooltip on hover and is read by a screen reader after the relative form. Dates are written in the locale and time zone
 * you pass, with the time zone defaulting to UTC so the server and the browser print the same text. The text never wraps,
 * and digits are tabular so a column of dates lines up.
 */
export function DateCell(props: DateCellProps) {
  return <DateCellView {...props} />;
}

export interface IdentityCellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The person's name, or the name of a company or a product. */
  name: string;
  /** A second, quieter line: an email address, a role, a handle. */
  detail?: string;
  /** The picture. The initials of the name show until it loads, and when it fails. */
  src?: string;
  /** The size of the picture: 28, 36 or 48 pixels. It is the same whether or not there is a second line, so the pictures and the names of a column line up when some rows have no detail. Default "default". */
  size?: "sm" | "default" | "lg";
}

/**
 * Who a row is about: an avatar, the name and a second line. The name is the strong line and the detail the quiet one,
 * each cut with an ellipsis when it does not fit (the cell is held to 18rem so the column does not grow with the longest
 * name). The avatar keeps one size (36 pixels, as tall as the two lines together) whatever the row has, and a name with
 * no second line is centred beside it, so a column of people stays straight when some have an email and some do not.
 * The picture is decorative, since the name is written beside it.
 */
export function IdentityCell({ name, detail, src, size = "default", className, ...props }: IdentityCellProps) {
  return (
    <div data-slot="identity-cell" className={cn("flex min-w-0 max-w-72 items-center gap-3", className)} {...props}>
      <Avatar size={size}>
        {src ? <AvatarImage src={src} alt="" /> : null}
        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm leading-5 font-medium text-foreground">{name}</p>
        {detail ? <p className="truncate text-xs leading-4 text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

export interface MoneyCellProps extends Omit<ComponentProps<"span">, "children"> {
  /** The amount in major units: 1240.5 is one thousand two hundred and forty euros fifty. Null writes a dash. */
  value: number | null | undefined;
  /** An ISO 4217 currency code. Default "USD". */
  currency?: string;
  /** The locale that writes the number. Default "en-US". */
  locale?: string;
  /** Put a plus in front of a positive amount. A negative amount always has its minus. Default false. */
  signed?: boolean;
  /** What a screen reader hears when there is no amount. Default "No amount". */
  emptyLabel?: string;
}

/**
 * An amount of money, aligned to the right with tabular digits so a column of amounts lines up on the decimal. It
 * never wraps. The currency and the locale are props, so "1.240,50 €" and "$1,240.50" both come out right, and a
 * negative amount gets a true minus sign. With `signed` a positive amount carries a plus, for statements and balances
 * where the direction is the point. Give its header `text-right` as well.
 */
export function MoneyCell({ value, currency = "USD", locale = "en-US", signed = false, emptyLabel = "No amount", className, ...props }: MoneyCellProps) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return <Nothing slot="money-cell" label={emptyLabel} className={cn("block text-right", className)} {...props} />;
  }
  return (
    <span data-slot="money-cell" className={cn("block whitespace-nowrap text-right tabular-nums", className)} {...props}>
      {formatAmount(value, { currency, locale, signed })}
    </span>
  );
}

/** What a status looks like: the weight of the badge and the glyph in front of the word. */
export type StatusTone = "success" | "pending" | "warning" | "danger" | "info" | "neutral";

const TONES: Record<StatusTone, { variant: "outline" | "secondary" | "muted" | "destructive"; Icon: (props: IconProps) => React.JSX.Element; className?: string }> = {
  success: { variant: "outline", Icon: IconCheck },
  pending: { variant: "outline", Icon: IconClock },
  warning: { variant: "secondary", Icon: IconWarning, className: "font-semibold" },
  // The destructive tint on its own is 4.0:1 in the light theme; a little foreground in the text takes it past 4.5:1.
  danger: { variant: "destructive", Icon: IconAlertCircle, className: "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_25%)]" },
  info: { variant: "muted", Icon: IconInfo },
  neutral: { variant: "muted", Icon: IconMinus },
};

export interface StatusCellProps extends Omit<ComponentProps<"span">, "children"> {
  /** The word: "Paid", "Overdue", "Draft". A status is always said in words, never by colour alone. */
  label: string;
  /** How it looks: `success` and `pending` are quiet outlines with a check and a clock, `warning` is filled and heavier, `danger` is the destructive tone, `info` and `neutral` are muted. Default "neutral". */
  tone?: StatusTone;
  /** Your own glyph in place of the one the tone brings, or null for none. */
  icon?: ReactNode | null;
}

/**
 * The state of a row as a badge with a glyph and a word. The meaning never rests on colour: success is a check on a
 * quiet outline, pending a clock, a warning a triangle on a filled badge, a failure the destructive tone with an alert
 * mark, so it reads in greyscale and for people who cannot tell the tones apart. The glyph is decoration; the word is
 * what a screen reader hears.
 */
export function StatusCell({ label, tone = "neutral", icon, className, ...props }: StatusCellProps) {
  const { variant, Icon, className: weight } = TONES[tone];
  return (
    <Badge data-slot="status-cell" data-tone={tone} variant={variant} className={cn("[&>svg]:size-3.5", weight, className)} {...props}>
      {icon === undefined ? <Icon aria-hidden="true" /> : icon}
      {label}
    </Badge>
  );
}

export interface MeterCellProps extends Omit<ComponentProps<"div">, "children"> {
  /** How far along it is, from 0 to `max`. */
  value: number;
  /** The value that means full. Default 100. */
  max?: number;
  /** What the bar measures: "Storage used". It names the progress bar for a screen reader. */
  label: string;
  /** The text beside the bar. Default the percentage, "68%". Keep it short: "68%", "4.1 GB". */
  valueLabel?: string;
  /** `danger` fills the bar with the destructive tone and sets the value in weight, for a quota that is nearly gone. Default "default". */
  tone?: "default" | "danger";
}

/**
 * A thin bar with its value written beside it, for storage, seats, completion or any share of a whole. The bar is a real
 * progress bar with a name and the written value, so a screen reader hears "Storage used, 68%" once; the visible
 * number is only for the eye. The value sits in a fixed column so the bars of every row start and end at the same
 * place.
 */
export function MeterCell({ value, max = 100, label, valueLabel, tone = "default", className, ...props }: MeterCellProps) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const text = valueLabel ?? `${Math.round(percent)}%`;
  return (
    <div
      data-slot="meter-cell"
      data-tone={tone}
      className={cn("flex min-w-0 max-w-40 items-center gap-2 data-[tone=danger]:[&_[data-slot=progress-indicator]]:bg-destructive", className)}
      {...props}
    >
      <Progress value={value} max={max} aria-label={label} aria-valuetext={text} className="h-1.5 w-16 min-w-10 shrink" />
      <span aria-hidden="true" className={cn("w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground", tone === "danger" && "font-medium text-foreground")}>
        {text}
      </span>
    </div>
  );
}

export interface TagsCellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The tags, in order. */
  tags: readonly string[];
  /** How many chips to draw before the "+N" chip. Default 2. */
  max?: number;
  /** The name of the "+N" chip, which lists the tags it stands for. `{count}` and `{tags}` are filled in. Default "+{count} more: {tags}". */
  moreLabel?: string;
  /** What a screen reader hears when there are no tags. Default "No tags". */
  emptyLabel?: string;
}

/**
 * Tags as chips that never break the row: the first few in full (each cut with an ellipsis if it is long), then a "+3"
 * chip. The chip can take the keyboard focus and shows the rest in a tooltip, and its name already lists them
 * ("+3 more: Design, Billing, EU"), so nobody has to hover to learn what is hidden. Nothing wraps, so every row keeps
 * the same height.
 */
export function TagsCell({ tags, max = 2, moreLabel = "+{count} more: {tags}", emptyLabel = "No tags", className, ...props }: TagsCellProps) {
  if (tags.length === 0) return <Nothing slot="tags-cell" label={emptyLabel} className={className} {...props} />;
  const shown = tags.slice(0, Math.max(0, max));
  const rest = tags.slice(shown.length);
  return (
    <div data-slot="tags-cell" className={cn("flex min-w-0 max-w-64 items-center gap-1", className)} {...props}>
      {shown.map((tag, index) => (
        <Badge key={`${index}-${tag}`} variant="outline" className="min-w-0 shrink font-normal">
          <span className="truncate">{tag}</span>
        </Badge>
      ))}
      {rest.length > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={fill(moreLabel, { count: rest.length, tags: rest.join(", ") })}
                className={cn(badgeVariants({ variant: "muted" }), "shrink-0 cursor-default tabular-nums hover:bg-border")}
              >
                +{rest.length}
              </button>
            </TooltipTrigger>
            <TooltipContent className="grid gap-0.5">
              {rest.map((tag, index) => (
                <span key={`${index}-${tag}`}>{tag}</span>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </div>
  );
}

/**
 * The last cell of a row: a right-aligned slot for its buttons and menus. The buttons sit on one line with a small gap,
 * and the row does not grow to fit them, so a row of icon buttons is as tall as a row of text. Put the row's actions
 * menu here, and name each button for its row.
 */
export function ActionsCell({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="actions-cell" className={cn("flex items-center justify-end gap-1 -my-1", className)} {...props} />;
}
