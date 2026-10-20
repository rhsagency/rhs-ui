"use client";

import { useMemo, useState, type ComponentProps, type ReactNode } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconCalendar, IconEye, IconEyeOff, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface BalanceAction {
  /** What the action does: "Withdraw", "Top up". */
  label: string;
  /** An icon element, drawn at 16px: `<IconArrowUp />`. */
  icon?: ReactNode;
  /** Makes the action a link. */
  href?: string;
  /** Called when the action is pressed. */
  onClick?: () => void;
  /** The first action is the main one unless you say otherwise. */
  variant?: "default" | "outline";
  /** Switches a button off, for an action that is not available right now. */
  disabled?: boolean;
}

export interface BalanceCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The total in major units: 12480.5 is 12,480.50. Negative means overdrawn. */
  balance: number;
  /** Part of the balance that can be spent or withdrawn now. */
  available?: number;
  /** Part of the balance that has not cleared yet. */
  pending?: number;
  /** ISO 4217 code. */
  currency?: string;
  /** When the next payout lands and, if you know it, how much. A date-only string ("2026-10-23") is a calendar day and reads as that day in every time zone; a date that cannot be read leaves the line out. */
  nextPayout?: { date: Date | string | number; amount?: number };
  /** One or two actions: Withdraw, Top up. */
  actions?: readonly BalanceAction[];
  /** Controlled: the figures are hidden. */
  hidden?: boolean;
  /** Uncontrolled: start with the figures hidden. */
  defaultHidden?: boolean;
  /** Called with the new state when the eye button is pressed. */
  onToggleHidden?: (hidden: boolean) => void;
  /** Skeleton in the same footprint as a full card (figure, split, payout, two actions) while the balance loads. */
  loading?: boolean;
  /** The card's label above the figure. */
  title?: string;
  /** BCP 47 locale for the figures and the payout date. */
  locale?: string;
  /** IANA zone for a payout date that carries a time of day. */
  timeZone?: string;
}

/** Dots for a hidden figure. They are drawn, not typed, so they stay round and the same size in every font. */
function Dots({ size, count = 6 }: { size: "sm" | "md" | "lg"; count?: number }) {
  return (
    <span aria-hidden="true" className={cn("inline-flex h-[1em] items-center align-middle", size === "lg" ? "gap-2" : size === "md" ? "gap-1.5" : "ml-1 gap-1")}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className={cn("rounded-full bg-current", size === "lg" ? "size-3" : size === "md" ? "size-2" : "size-1.5")} />
      ))}
    </span>
  );
}

/**
 * The hero figure of a fintech or marketplace dashboard: the total balance
 * large in tabular numbers, split into available and pending, with the date
 * of the next payout and the main actions. The eye button hides every figure
 * behind dots and announces it. A negative balance is written with a minus
 * sign and the word "Overdrawn", never colour alone, and a skeleton matches
 * the layout while it loads.
 */
export function BalanceCard({
  balance,
  available,
  pending,
  currency = "USD",
  nextPayout,
  actions = [],
  hidden: hiddenProp,
  defaultHidden = false,
  onToggleHidden,
  loading = false,
  title = "Total balance",
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: BalanceCardProps) {
  const [ownHidden, setOwnHidden] = useState(defaultHidden);
  const [announcement, setAnnouncement] = useState("");
  const hidden = hiddenProp ?? ownHidden;
  const format = useMemo<Intl.NumberFormatOptions>(() => ({ style: "currency", currency }), [currency]);
  const money = new Intl.NumberFormat(locale, format);
  const overdrawn = balance < 0;
  const breakdown = available !== undefined && pending !== undefined && available >= 0 && pending >= 0 && available + pending > 0;
  const share = breakdown ? (available / (available + pending)) * 100 : 0;

  // "2026-10-23" is a calendar day. It parses as midnight UTC, so it is also written in UTC; in another zone it would slip a day west of Greenwich.
  const payoutDay = typeof nextPayout?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(nextPayout.date) ? nextPayout.date : null;
  const payoutMs = nextPayout ? new Date(nextPayout.date).getTime() : Number.NaN;
  // A date that cannot be read leaves the payout line out; it must never take the card down with it.
  const payoutText = Number.isFinite(payoutMs)
    ? new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: payoutDay ? "UTC" : timeZone }).format(payoutMs)
    : null;

  const toggle = () => {
    const next = !hidden;
    if (hiddenProp === undefined) setOwnHidden(next);
    setAnnouncement(next ? "Balance hidden" : "Balance shown");
    onToggleHidden?.(next);
  };

  /** A figure, or dots with the same footprint when hidden. */
  const figure = (value: number, size: "sm" | "md" = "md") =>
    hidden ? (
      <>
        <Dots size={size} />
        <span className="sr-only">hidden</span>
      </>
    ) : (
      money.format(value)
    );

  if (loading) {
    return (
      <Card data-slot="balance-card" aria-busy="true" className={cn("@container w-full", className)} {...props}>
        <p role="status" className="sr-only">
          Loading balance
        </p>
        <div aria-hidden="true" className="grid gap-6">
          {/* Every block has the height of what it stands in for, line for line, so the card does not jump when the balance arrives. */}
          <CardHeader className="min-h-7">
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="grid grid-cols-[minmax(0,1fr)] gap-6">
            <Skeleton className="h-9 w-56 max-w-full @md:h-12" delay={60} />
            <div className="grid gap-4">
              <Skeleton className="h-1.5 w-full rounded-full" delay={100} />
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <div className="grid min-w-max flex-1 gap-1.5">
                  <Skeleton className="h-4 w-16" delay={140} />
                  <Skeleton className="h-7 w-24" delay={180} />
                </div>
                <div className="grid min-w-max flex-1 gap-1.5">
                  <Skeleton className="h-4 w-14" delay={160} />
                  <Skeleton className="h-7 w-20" delay={200} />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <Skeleton className="h-5 w-48 max-w-full" delay={220} />
            </div>
          </CardContent>
          <CardFooter className="grid grid-flow-col auto-cols-fr gap-2">
            <Skeleton className="h-9" delay={240} />
            <Skeleton className="h-9" delay={280} />
          </CardFooter>
        </div>
      </Card>
    );
  }

  return (
    <Card data-slot="balance-card" data-hidden={hidden || undefined} data-overdrawn={overdrawn || undefined} className={cn("@container w-full gap-6", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-sm leading-snug font-medium text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <Button type="button" variant="ghost" size="icon-sm" aria-pressed={hidden} aria-label="Hide balance" onClick={toggle} className="-mt-1 -mr-2 text-muted-foreground">
            {hidden ? <IconEyeOff /> : <IconEye />}
          </Button>
        </CardAction>
      </CardHeader>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <CardContent className="grid gap-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-4xl leading-none font-medium tracking-[-0.04em] tabular-nums @md:text-5xl">
            {hidden ? (
              <>
                <Dots size="lg" />
                <span className="sr-only">Balance hidden</span>
              </>
            ) : (
              <AnimatedNumber value={balance} locale={locale} format={format} />
            )}
          </p>
          {overdrawn ? (
            <Badge variant="outline" className="border-destructive/50 text-destructive">
              <IconWarning aria-hidden="true" />
              Overdrawn
            </Badge>
          ) : null}
        </div>

        {available !== undefined || pending !== undefined ? (
          <div className="grid gap-4">
            {breakdown ? (
              <div aria-hidden="true" className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                {hidden ? null : (
                  <>
                    <span className="h-full bg-foreground transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${share}%` }} />
                    <span className="h-full flex-1 bg-foreground/25" />
                  </>
                )}
              </div>
            ) : null}
            {/* A figure is never cut short: the pair sits side by side while both fit and stacks when they do not, however large the amounts. */}
            <dl className="flex flex-wrap gap-x-6 gap-y-4">
              {available !== undefined ? (
                <div className="min-w-max flex-1">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span aria-hidden="true" className="size-2 rounded-[2px] bg-foreground" />
                    Available
                  </dt>
                  <dd className="mt-1.5 text-lg font-medium tracking-[-0.01em] whitespace-nowrap tabular-nums">{figure(available)}</dd>
                </div>
              ) : null}
              {pending !== undefined ? (
                <div className="min-w-max flex-1">
                  <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span aria-hidden="true" className="size-2 rounded-[2px] bg-foreground/25" />
                    Pending
                  </dt>
                  <dd className="mt-1.5 text-lg font-medium tracking-[-0.01em] whitespace-nowrap tabular-nums">{figure(pending)}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        {nextPayout && payoutText !== null ? (
          <p className="flex items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
            <IconCalendar size={16} className="shrink-0" />
            <span>
              Next payout{" "}
              <time dateTime={payoutDay ?? new Date(payoutMs).toISOString()} className="font-medium text-foreground">
                {payoutText}
              </time>
              {nextPayout.amount !== undefined ? <span className="tabular-nums">, {figure(nextPayout.amount, "sm")}</span> : null}
            </span>
          </p>
        ) : null}
      </CardContent>

      {actions.length > 0 ? (
        <CardFooter className="grid grid-flow-col auto-cols-fr gap-2">
          {actions.map((action, index) => {
            const variant = action.variant ?? (index === 0 ? "default" : "outline");
            return action.href ? (
              <Button key={action.label} asChild variant={variant}>
                <a href={action.href} onClick={action.onClick}>
                  {action.icon}
                  {action.label}
                </a>
              </Button>
            ) : (
              <Button key={action.label} type="button" variant={variant} disabled={action.disabled} onClick={action.onClick}>
                {action.icon}
                {action.label}
              </Button>
            );
          })}
        </CardFooter>
      ) : null}
    </Card>
  );
}
