"use client";

import { useEffect, useMemo, useRef, useState, type ComponentProps } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconAlertCircle, IconArrowRight, IconCheck, IconClose, IconInfo, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardAction, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { toast } from "@rhs-ui/primitives/toast";
import { cn } from "@/lib/utils";

export type AttentionSeverity = "critical" | "warning" | "notice";

export interface AttentionItem {
  /** Stable identity: what dismissing and undoing refer to. */
  id: string;
  /** How urgent it is. Drawn as a shape and a word, and the list sorts by it. */
  severity: AttentionSeverity;
  /** What needs attention, in one line. */
  title: string;
  /** One short line of why: "Card declined three times. The subscription pauses tomorrow." */
  detail?: string;
  /** When it started needing attention: an ISO string, a Date or a timestamp. */
  time: Date | string | number;
  /** The one thing to do about it. Give it an `href` and the button is a link. */
  action?: { label: string; href?: string };
}

export interface AttentionListProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** Everything that needs a person. The list sorts it and shows the first `maxVisible`. */
  items: readonly AttentionItem[];
  /** The card's heading. */
  title?: string;
  /** Called when a row's action is pressed, also when it is a link, so you can track it or route it yourself. */
  onAction?: (item: AttentionItem) => void;
  /** Called once a dismissed row has left the list. Drop it from `items` here; until then the list hides it itself. */
  onDismiss?: (item: AttentionItem) => void;
  /** Called when Undo in the toast brings a dismissed row back, so you can put it back in `items`. */
  onUndoDismiss?: (item: AttentionItem) => void;
  /** Rows shown at once; the rest are counted under the list. */
  maxVisible?: number;
  /** Where the full list lives. */
  viewAllHref?: string;
  /** The moment relative times are measured from. Defaults to the current time. */
  now?: Date | string | number;
  /** BCP 47 locale for relative times and dates. */
  locale?: string;
  /** IANA zone for the date shown after a week. */
  timeZone?: string;
}

const SEVERITY = {
  critical: { rank: 0, word: "Critical", Icon: IconAlertCircle, tile: "bg-destructive text-destructive-foreground" },
  warning: { rank: 1, word: "Warning", Icon: IconWarning, tile: "border border-border bg-background text-foreground" },
  notice: { rank: 2, word: "Notice", Icon: IconInfo, tile: "bg-muted text-muted-foreground" },
} as const;

const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : new Date(value).getTime());

function relativeTime(when: number, now: number, relative: Intl.RelativeTimeFormat, date: Intl.DateTimeFormat): string {
  const seconds = Math.round((when - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return relative.format(0, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 7 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return date.format(when);
}

const without = (set: ReadonlySet<string>, id: string): ReadonlySet<string> => new Set([...set].filter((entry) => entry !== id));
const withId = (set: ReadonlySet<string>, id: string): ReadonlySet<string> => new Set([...set, id]);

/**
 * What needs a person right now: failed payments, expiring certificates,
 * unanswered tickets. Items sort by severity, shown as a shape and a word so
 * colour is never the only signal, each with its time and one action, and the
 * count sits in the header. Dismissing a row collapses it, announces the
 * removal and offers Undo in a toast (mount one `<Toaster />` in your app).
 * Focus never falls to the page: it moves to the next row, to the heading when
 * the last row goes, and back to a row that Undo restores. An empty list gives
 * way to a calm "All clear".
 */
export function AttentionList({
  items,
  title = "Needs attention",
  onAction,
  onDismiss,
  onUndoDismiss,
  maxVisible = 5,
  viewAllHref,
  now,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: AttentionListProps) {
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(() => new Set());
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const [status, setStatus] = useState("");
  const timers = useRef(new Map<string, number>());
  /** Where focus goes when the row under it leaves: the id of the next row, "" for the heading when it was the last one, null when nothing is pending. */
  const focusNext = useRef<string | null>(null);
  /** The id of a row that Undo has just brought back, so focus can follow it. */
  const focusBack = useRef<string | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const sorted = useMemo(() => [...items].sort((a, b) => SEVERITY[a.severity].rank - SEVERITY[b.severity].rank || toMs(b.time) - toMs(a.time)), [items]);
  const open = sorted.filter((item) => !dismissed.has(item.id));
  const visible = open.slice(0, Math.max(1, maxVisible));
  const hidden = open.length - visible.length;
  const count = open.filter((item) => !leaving.has(item.id)).length;

  const relative = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }), [locale, timeZone]);
  const full = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }), [locale, timeZone]);
  const nowMs = now === undefined ? Date.now() : toMs(now);

  // Focus must not fall to the page when the row under it leaves: it moves to the next row, or to the heading when that was the last one.
  useEffect(() => {
    const target = focusNext.current;
    const active = document.activeElement;
    if (target === null || (active && active !== document.body)) return;
    focusNext.current = null;
    const next = target ? list.current?.querySelector<HTMLElement>(`[data-attention-id="${CSS.escape(target)}"] [data-attention-dismiss]`) : null;
    (next ?? heading.current)?.focus();
  }, [dismissed]);

  // Undo leaves focus on the toast, which is about to go: follow the row that came back.
  useEffect(() => {
    const id = focusBack.current;
    if (id === null) return;
    focusBack.current = null;
    const back = list.current?.querySelector<HTMLElement>(`[data-attention-id="${CSS.escape(id)}"] [data-attention-dismiss]`);
    (back ?? heading.current)?.focus();
  }, [dismissed, leaving]);

  // Once the parent has dropped a dismissed item, forget it, so the same id can come back later.
  useEffect(() => {
    setDismissed((current) => {
      const present = new Set(items.map((item) => item.id));
      const kept = [...current].filter((id) => present.has(id));
      return kept.length === current.size ? current : new Set(kept);
    });
  }, [items]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const restore = (item: AttentionItem) => {
    focusBack.current = item.id;
    const timer = timers.current.get(item.id);
    if (timer !== undefined) {
      // Undone before the row had left: nothing was reported, so nothing to undo.
      window.clearTimeout(timer);
      timers.current.delete(item.id);
      setLeaving((current) => without(current, item.id));
      setStatus(`${item.title} is back in the list.`);
      return;
    }
    setDismissed((current) => without(current, item.id));
    setStatus(`${item.title} is back in the list.`);
    onUndoDismiss?.(item);
  };

  const dismiss = (item: AttentionItem) => {
    if (timers.current.has(item.id)) return;
    const index = visible.findIndex((entry) => entry.id === item.id);
    focusNext.current = (visible[index + 1] ?? visible[index - 1])?.id ?? "";
    const left = count - 1;
    setLeaving((current) => withId(current, item.id));
    setStatus(`${item.title} dismissed. ${left === 0 ? "Nothing needs attention." : `${left} ${left === 1 ? "item needs" : "items need"} attention.`}`);
    toast(`Dismissed “${item.title}”`, {
      duration: 6000,
      action: { label: "Undo", altText: `Undo dismissing ${item.title}`, onClick: () => restore(item) },
    });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current.set(
      item.id,
      window.setTimeout(() => {
        timers.current.delete(item.id);
        setDismissed((current) => withId(current, item.id));
        setLeaving((current) => without(current, item.id));
        onDismiss?.(item);
      }, reduced ? 0 : 220),
    );
  };

  return (
    <Card data-slot="attention-list" className={cn("@container w-full gap-0 divide-y divide-border py-0", className)} {...props}>
      <CardHeader className="py-4">
        <CardTitle ref={heading} tabIndex={-1} className="flex items-center gap-2 text-base tracking-[-0.01em] outline-none">
          {title}
          {count > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {count}
              <span className="sr-only"> open</span>
            </Badge>
          ) : null}
        </CardTitle>
        {viewAllHref ? (
          <CardAction>
            <Button asChild variant="ghost" size="sm" className="-mr-2">
              <a href={viewAllHref}>
                View all
                <IconArrowRight />
              </a>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>

      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>

      {visible.length === 0 ? (
        <EmptyState icon={<IconCheck size={22} />} title="All clear" description="Nothing needs your attention right now. New issues show up here as they appear." className="rounded-none border-0 py-12" />
      ) : (
        <ul ref={list} aria-label={title} className="divide-y divide-border">
          {visible.map((item) => {
            const meta = SEVERITY[item.severity];
            const isLeaving = leaving.has(item.id);
            const when = toMs(item.time);
            const valid = Number.isFinite(when);
            return (
              <li
                key={item.id}
                data-attention-id={item.id}
                data-severity={item.severity}
                data-leaving={isLeaving || undefined}
                inert={isLeaving || undefined}
                className={cn("grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none", isLeaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr]")}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-3 px-6 py-4 @xl:grid-cols-[auto_minmax(0,1fr)_auto] @xl:items-center">
                    <span aria-hidden="true" className={cn("grid size-8 place-items-center rounded-lg", meta.tile)}>
                      <meta.Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug font-medium">{item.title}</p>
                      {item.detail ? <p className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">{item.detail}</p> : null}
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{meta.word}</span>
                        {valid ? (
                          <>
                            <span aria-hidden="true">&middot;</span>
                            <time dateTime={new Date(when).toISOString()} title={full.format(when)} suppressHydrationWarning>
                              {relativeTime(when, nowMs, relative, date)}
                            </time>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <div className="col-start-2 flex items-center gap-1.5 @xl:col-start-3">
                      {item.action ? (
                        item.action.href ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={item.action.href} onClick={() => onAction?.(item)}>
                              {item.action.label}
                            </a>
                          </Button>
                        ) : (
                          <Button type="button" variant="outline" size="sm" onClick={() => onAction?.(item)}>
                            {item.action.label}
                          </Button>
                        )
                      ) : null}
                      <Button type="button" variant="ghost" size="icon-sm" data-attention-dismiss="" aria-label={`Dismiss: ${item.title}`} onClick={() => dismiss(item)} className="text-muted-foreground">
                        <IconClose />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hidden > 0 ? (
        <p className="px-6 py-3 text-xs text-muted-foreground">
          {hidden} more {hidden === 1 ? "item needs" : "items need"} attention
        </p>
      ) : null}
    </Card>
  );
}
