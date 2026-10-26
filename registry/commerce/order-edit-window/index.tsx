"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconClock, IconEdit, IconPackage, IconPin, IconXCircle } from "@rhs-ui/icons";
import { durationWords, minutesLeft, phaseOf, toMs, untilNextChange, type EditMoment, type EditPhase } from "@rhs-ui/commerce/order-edit-window/remaining";
import { Alert } from "@rhs-ui/primitives/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@rhs-ui/primitives/alert-dialog";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { EditMoment } from "@rhs-ui/commerce/order-edit-window/remaining";

/** What the shopper can still do to a fresh order. */
export type OrderEditAction = "address" | "items" | "cancel";

export interface OrderEditWindowLabels {
  /** The sentence while there is time. `{time}` is how long: "24 minutes", "1 hour 5 minutes". */
  editable?: string;
  /** The same in the last minute. */
  editableSoon?: string;
  /** The same before the time left is known, on the server. */
  editableUnknown?: string;
  /** Under it. */
  editableNote?: string;
  /** The sentence once the time is up. */
  prepared?: string;
  /** Under it. */
  preparedNote?: string;
  address?: string;
  items?: string;
  cancel?: string;
  /** Said once, when the words reach 10 minutes. */
  statusTen?: string;
  /** Said once, when the words reach "less than a minute". */
  statusLast?: string;
  /** Said once, when the time is up. */
  statusExpired?: string;
  /** The question before an order is cancelled. */
  cancelTitle?: string;
  cancelText?: string;
  /** The safe answer: keep the order. */
  cancelKeep?: string;
  /** The button that cancels it. */
  cancelConfirm?: string;
}

const WORDS = {
  editable: "You can still change this order for {time}",
  editableSoon: "You can still change this order for less than a minute",
  editableUnknown: "You can still change this order",
  editableNote: "After that we start packing it.",
  prepared: "Your order is being prepared",
  preparedNote: "It can no longer be changed from here.",
  address: "Edit address",
  items: "Edit items",
  cancel: "Cancel order",
  statusTen: "10 minutes left to change your order.",
  statusLast: "Less than a minute left to change your order.",
  statusExpired: "Your order is being prepared. It can no longer be changed.",
  cancelTitle: "Cancel this order?",
  cancelText: "This stops the order before it is packed. You cannot undo it.",
  cancelKeep: "Keep order",
  cancelConfirm: "Cancel order",
} satisfies Required<OrderEditWindowLabels>;

const ACTIONS = {
  address: { icon: IconPin },
  items: { icon: IconEdit },
  cancel: { icon: IconXCircle },
} as const;

export interface OrderEditWindowProps extends Omit<ComponentProps<"div">, "children"> {
  /** When the order stops being editable: an ISO 8601 date-time with its offset, a Date or epoch milliseconds. */
  editableUntil: EditMoment;
  /** The moment to measure from. Pass it in tests and previews; without it the strip reads the browser's clock once the page has loaded, and wakes up once a minute. */
  now?: EditMoment;
  /** How long the whole window is, in minutes. With it a thin bar shows how much of the window is left; without it there is no bar. */
  windowMinutes?: number;
  /** Which actions to offer, in this order. Defaults to all three. */
  actions?: readonly OrderEditAction[];
  /** Called when the shopper picks an action. Cancelling is only reported after they confirm. It is never called once the time is up. */
  onAction?: (action: OrderEditAction) => void;
  /** Called once when the time runs out while the strip is on the page. Take the edit links away and tell your server the order is locked. */
  onExpire?: () => void;
  /** Always pass your application locale, so the length of time is written the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: OrderEditWindowLabels;
}

/** A sentence with the length of time set in heavier type where `{time}` is. */
function withTime(template: string, time: string): ReactNode {
  const [before = "", after = ""] = template.split("{time}");
  return (
    <>
      {before}
      <strong className="font-semibold">{time}</strong>
      {after}
    </>
  );
}

/**
 * The time left, in milliseconds, from the moment you pass in or from the browser's clock. The browser's clock
 * is only read once the page has loaded, and the timer sleeps until the words next need to change, so the strip
 * wakes up once a minute, and once more when the time is up. Null while it is not known yet.
 */
function useRemaining(until: number, given: number | undefined): number | null {
  const [clock, setClock] = useState<number | null>(null);
  useEffect(() => {
    if (given !== undefined || Number.isNaN(until)) return;
    let timer: number | undefined;
    const tick = (): void => {
      window.clearTimeout(timer);
      const current = Date.now();
      setClock(current);
      const wait = untilNextChange(until - current);
      if (Number.isFinite(wait)) timer = window.setTimeout(tick, wait);
    };
    tick();
    // A sleeping tab misses its timers: catch up when it is looked at again.
    const visible = (): void => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [until, given]);
  const moment = given ?? clock;
  return moment === null ? null : until - moment;
}

/**
 * The strip on a fresh order: "You can still change this order for 24 minutes", with Edit address, Edit items and
 * Cancel order. The time left is written in words and moves once a minute. Only two moments are said out loud,
 * when the words reach 10 minutes and when they reach "less than a minute", so a screen reader is never
 * interrupted by a countdown. At zero the strip says "Your order is being prepared" and the actions go quiet, in
 * the same space: every sentence it can say is laid in one cell, so nothing moves in the last minute or at the
 * end. Cancelling asks first, in a dialog whose focus starts on the safe answer, and is never reported once the
 * time is up.
 */
export function OrderEditWindow({ editableUntil, now, windowMinutes, actions = ["address", "items", "cancel"], onAction, onExpire, locale = "en-US", labels, className, ...props }: OrderEditWindowProps) {
  const words = { ...WORDS, ...labels };
  const until = toMs(editableUntil);
  const remaining = useRemaining(until, now === undefined ? undefined : toMs(now));
  const [confirming, setConfirming] = useState(false);

  const phase: EditPhase | null = remaining === null ? null : phaseOf(remaining);
  const expired = phase === "expired";

  // Said when a mark is crossed, never for where the time already stands the first time it is known.
  const [said, setSaid] = useState("");
  const before = useRef<EditPhase | null>(null);
  useEffect(() => {
    if (phase === null) return;
    const previous = before.current;
    before.current = phase;
    if (previous === null || previous === phase) return;
    setSaid(phase === "ten" ? words.statusTen : phase === "last" ? words.statusLast : phase === "expired" ? words.statusExpired : "");
    // A countdown message that stays would be read out of date by someone who comes to it later; "being prepared" stays true.
    if (phase === "expired") return;
    const timeout = window.setTimeout(() => setSaid(""), 6000);
    return () => window.clearTimeout(timeout);
  }, [phase, words.statusTen, words.statusLast, words.statusExpired]);

  // The parent hears about it once, when the time runs out on the page.
  const reported = useRef(expired && now !== undefined);
  useEffect(() => {
    if (!expired) {
      reported.current = false;
      return;
    }
    setConfirming(false);
    if (reported.current) return;
    reported.current = true;
    onExpire?.();
  }, [expired, onExpire]);

  const minutes = remaining === null ? null : minutesLeft(remaining);
  const left = windowMinutes && windowMinutes > 0 ? (remaining === null ? 1 : Math.min(1, Math.max(0, remaining / (windowMinutes * 60_000)))) : null;
  const sentence: ReactNode = minutes === null ? words.editableUnknown : minutes === 0 ? words.editableSoon : withTime(words.editable, durationWords(minutes, locale));

  const press = (action: OrderEditAction) => {
    if (expired) return;
    onAction?.(action);
  };
  // On a narrow strip the actions are a column of equal buttons; on a wide one they sit in a row at their own size.
  const lock = { "aria-disabled": expired || undefined, className: "w-full aria-disabled:pointer-events-none aria-disabled:opacity-50 @min-[24rem]:w-auto" } as const;

  return (
    <Alert data-slot="order-edit-window" data-state={expired ? "expired" : "editable"} role="none" tone="info" className={cn("@container px-4 py-3.5", className)} {...props}>
      {expired ? <IconPackage /> : <IconClock />}
      <div className="col-start-2 grid gap-3.5">
        {/* Every sentence it can say shares one cell. The ones that are not true are invisible, not removed, so the strip is as tall as the tallest of them at every width: nothing moves in the last minute or when time is up. */}
        <div className="grid">
          <div aria-hidden={expired || undefined} className={cn("col-start-1 row-start-1 grid gap-0.5", expired && "invisible")}>
            <p className="font-medium text-foreground tabular-nums">{sentence}</p>
            <p className="text-muted-foreground">{words.editableNote}</p>
          </div>
          <div aria-hidden="true" className="invisible col-start-1 row-start-1 grid gap-0.5">
            <p className="font-medium tabular-nums">{words.editableSoon}</p>
            <p>{words.editableNote}</p>
          </div>
          <div aria-hidden={!expired || undefined} className={cn("col-start-1 row-start-1 grid gap-0.5", !expired && "invisible")}>
            <p className="font-medium text-foreground">{words.prepared}</p>
            <p className="text-muted-foreground">{words.preparedNote}</p>
          </div>
        </div>

        {/* Once the time is up the track is hidden, not removed: the strip keeps its height, and an empty bar does not suggest progress at zero. */}
        {left !== null ? (
          <div aria-hidden="true" className={cn("-mt-1 h-1 overflow-hidden rounded-full bg-foreground/10", expired && "invisible")}>
            <div className="h-full rounded-full bg-foreground transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.round(left * 100)}%` }} />
          </div>
        ) : null}

        <div className="grid gap-2 @min-[24rem]:flex @min-[24rem]:flex-wrap">
          {actions.map((action) => {
            const Icon = ACTIONS[action].icon;
            if (action === "cancel") {
              return (
                <AlertDialog key={action} open={confirming} onOpenChange={(open) => setConfirming(open && !expired)}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="outline" {...lock} className={cn(lock.className, "text-destructive hover:text-destructive")} onClick={(event) => expired && event.preventDefault()}>
                      <Icon />
                      {words.cancel}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{words.cancelTitle}</AlertDialogTitle>
                      <AlertDialogDescription>{words.cancelText}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{words.cancelKeep}</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => press("cancel")}>
                        {words.cancelConfirm}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              );
            }
            return (
              <Button key={action} type="button" size="sm" variant="outline" {...lock} onClick={() => press(action)}>
                <Icon />
                {words[action]}
              </Button>
            );
          })}
        </div>
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </Alert>
  );
}
