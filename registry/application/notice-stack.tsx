"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconChevronDown, IconChevronUp, IconClose, IconInfo, IconWarning } from "@rhs-ui/icons";
import { Alert } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** How urgent a notice is. Errors come first, then warnings, then information. */
export type NoticeTone = "error" | "warning" | "info";

export interface StackNotice {
  /** Names the notice, so it keeps its place while others come and go. Unique within the stack. */
  id: string;
  /** How urgent it is. It decides the order, the icon and the word a screen reader hears before the title. */
  tone: NoticeTone;
  /** What it says first, in a few words. It also names the close button, "Dismiss: Title". */
  title: string;
  /** The line under the title: what it means or what to do. */
  body?: ReactNode;
  /** Buttons or links under the text, such as "Update card". Each notice keeps its own. */
  action?: ReactNode;
  /** Adds a close button, which calls `onDismiss` with the id. Leave it off for what must be dealt with. */
  dismissible?: boolean;
}

/** The words the stack uses, for translation. `{count}`, `{tone}` and `{title}` are filled in. */
export interface NoticeStackLabels {
  /** The button that unfolds the rest. Default "+{count} more". */
  more?: string;
  /** Its name for a screen reader, which includes the count. Default "Show {count} more notices". */
  showMore?: string;
  /** The same when there is one more. Default "Show 1 more notice". */
  showOne?: string;
  /** The button that folds them again. Default "Show fewer notices". */
  showFewer?: string;
  /** The name of a close button. Default "Dismiss: {title}". */
  dismiss?: string;
  /** Read before the title of an error. Default "Error". */
  error?: string;
  /** Read before the title of a warning. Default "Warning". */
  warning?: string;
  /** Read before the title of information. Default "Notice". */
  info?: string;
  /** What is said when a notice arrives. Default "{tone}: {title}". */
  announce?: string;
}

export interface NoticeStackProps extends Omit<ComponentProps<"section">, "children"> {
  /** Everything that applies right now, in any order. The stack sorts it by urgency, and keeps your order within a level. */
  notices: readonly StackNotice[];
  /** Called with the id when a notice's close button is pressed. Remove it from `notices` and the next one comes forward. */
  onDismiss?: (id: string) => void;
  /** How many notices are shown in full; the rest fold under a button. Default 1. */
  max?: number;
  /** The name of the region for a screen reader. Default "Notices". */
  label?: string;
  /** The words the stack uses, for translation. */
  labels?: NoticeStackLabels;
}

const DEFAULT_LABELS = {
  more: "+{count} more",
  showMore: "Show {count} more notices",
  showOne: "Show 1 more notice",
  showFewer: "Show fewer notices",
  dismiss: "Dismiss: {title}",
  error: "Error",
  warning: "Warning",
  info: "Notice",
  announce: "{tone}: {title}",
} satisfies Required<NoticeStackLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const ORDER: Record<NoticeTone, number> = { error: 0, warning: 1, info: 2 };
const ICON = { error: IconAlertCircle, warning: IconWarning, info: IconInfo } as const;
// Colour is only for what is wrong. A warning and information differ by icon, weight, surface and the word read before the title.
const SURFACE = { error: "destructive", warning: "default", info: "info" } as const;

/** One notice: icon, title, text, its own action and an optional close button. */
function NoticeCard({ notice, text, onDismiss }: { notice: StackNotice; text: Required<NoticeStackLabels>; onDismiss: (id: string) => void }) {
  const titleId = useId();
  const Icon = ICON[notice.tone];
  return (
    <Alert tone={SURFACE[notice.tone]} role="group" aria-labelledby={titleId} data-notice-id={notice.id} data-notice-tone={notice.tone} className="flex items-start gap-3 px-4 py-3.5">
      <Icon />
      <div className="min-w-0 flex-1">
        {/* The destructive colour on its own tint is 4.3:1; a little foreground in it makes the title pass 4.5:1 at this size. */}
        <p id={titleId} className={cn("text-sm leading-snug tracking-[-0.01em]", notice.tone === "info" ? "font-medium" : "font-semibold", notice.tone === "error" && "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]")}>
          <span className="sr-only">{text[notice.tone]}: </span>
          {notice.title}
        </p>
        {notice.body ? <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{notice.body}</div> : null}
        {notice.action ? <div className="mt-3 flex flex-wrap items-center gap-2">{notice.action}</div> : null}
      </div>
      {notice.dismissible ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-notice-dismiss=""
          aria-label={fill(text.dismiss, { title: notice.title })}
          onClick={() => onDismiss(notice.id)}
          className="-my-1 -mr-1.5 size-7 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <IconClose size={14} />
        </Button>
      ) : null}
    </Alert>
  );
}

/**
 * Several notices in one place, so a page does not grow a tower of banners
 * when a billing warning, a maintenance note and a trial notice all apply at
 * once. The stack sorts them by urgency (errors, then warnings, then
 * information), shows the first `max` in full and folds the rest under a
 * "+2 more" button, with a hint of the folded cards peeking out beneath. The
 * button unfolds the list in place, and its name carries the count ("Show 2
 * more notices"). Each notice keeps its own action, and `dismissible` ones
 * have a close button: dismissing one calls `onDismiss`, and when you remove
 * it from `notices` the next one comes forward and focus moves to it instead
 * of dropping to the top of the page. A notice that arrives after the first
 * paint is announced politely; an error is announced once, as an alert. The
 * whole stack is one labelled region.
 */
export function NoticeStack({ notices, onDismiss, max = 1, label = "Notices", labels, className, ...props }: NoticeStackProps) {
  const text: Required<NoticeStackLabels> = { ...DEFAULT_LABELS, ...labels };
  const extrasId = useId();
  const root = useRef<HTMLElement>(null);
  const known = useRef<Set<string> | null>(null);
  const pending = useRef<{ id: string; index: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");

  const sorted = notices
    .map((notice, index) => ({ notice, index }))
    .sort((a, b) => ORDER[a.notice.tone] - ORDER[b.notice.tone] || a.index - b.index)
    .map((entry) => entry.notice);
  const limit = Number.isNaN(max) ? 1 : Math.max(1, Math.floor(max));
  const shown = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const open = expanded && rest.length > 0;
  if (expanded && rest.length === 0) setExpanded(false);

  // What is there when the page loads is not news. What arrives later is said once: errors as an alert, the rest politely.
  useEffect(() => {
    const before = known.current;
    known.current = new Set(notices.map((notice) => notice.id));
    if (before === null) return;
    const fresh = notices.filter((notice) => !before.has(notice.id));
    const say = (list: readonly StackNotice[]) => list.map((notice) => fill(text.announce, { tone: text[notice.tone], title: notice.title })).join(". ");
    const errors = fresh.filter((notice) => notice.tone === "error");
    const others = fresh.filter((notice) => notice.tone !== "error");
    if (errors.length > 0) setAssertive(say(errors));
    if (others.length > 0) setPolite(say(others));
    // The words come from labels, which can be a new object on every render; only the notices decide when something is new.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices]);

  // What was said stays only while it is news; left in the region it would be read again with the next message.
  useEffect(() => {
    if (!polite) return;
    const timer = window.setTimeout(() => setPolite(""), 6000);
    return () => window.clearTimeout(timer);
  }, [polite]);
  useEffect(() => {
    if (!assertive) return;
    const timer = window.setTimeout(() => setAssertive(""), 6000);
    return () => window.clearTimeout(timer);
  }, [assertive]);

  // The close button that was pressed leaves with its notice. Once the notice is really gone, focus goes to the one that took its place.
  useEffect(() => {
    const wanted = pending.current;
    if (!wanted || notices.some((notice) => notice.id === wanted.id)) return;
    pending.current = null;
    const region = root.current;
    const active = document.activeElement;
    if (!region || (active && active !== document.body && region.contains(active))) return;
    const reachable = open ? sorted : shown;
    const next = reachable[Math.min(wanted.index, reachable.length - 1)];
    const card = next ? Array.from(region.querySelectorAll<HTMLElement>("[data-notice-id]")).find((element) => element.dataset.noticeId === next.id) : undefined;
    const target = card?.querySelector<HTMLElement>("[data-notice-dismiss]") ?? region.querySelector<HTMLElement>("[data-notice-toggle]") ?? region;
    target.focus({ preventScroll: true });
  });

  if (sorted.length === 0) return null;

  function dismiss(id: string) {
    pending.current = { id, index: sorted.findIndex((notice) => notice.id === id) };
    onDismiss?.(id);
  }

  const hidden = rest.length;
  return (
    <section ref={root} data-slot="notice-stack" data-expanded={open ? "" : undefined} aria-label={label} tabIndex={-1} className={cn("@container flex flex-col outline-none", className)} {...props}>
      <ul className="relative z-10 grid gap-2">
        {shown.map((notice) => (
          <li key={notice.id}>
            <NoticeCard notice={notice} text={text} onDismiss={dismiss} />
          </li>
        ))}
      </ul>

      {hidden > 0 ? (
        <>
          {/* Cards folded behind the front one, so the stack looks like one. They are decoration; the button says what they are. */}
          <div
            aria-hidden="true"
            className={cn("pointer-events-none relative transition-[height,opacity] duration-200 motion-reduce:transition-none", open ? "h-0 opacity-0" : cn("opacity-100", hidden > 1 ? "h-3" : "h-1.5"))}
          >
            {hidden > 1 ? <span className="absolute inset-x-5 -top-px h-3 rounded-b-lg border border-t-0 border-border bg-muted" /> : null}
            <span className="absolute inset-x-2.5 -top-px h-[7px] rounded-b-lg border border-t-0 border-border bg-card" />
          </div>

          {/* A row folds from 1fr to 0fr, which animates height without measuring anything. Hidden, it leaves the tab order and the reading order. */}
          <div id={extrasId} className={cn("grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none", open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]")}>
            <div className="-m-1 min-h-0 overflow-hidden p-1">
              <ul className="grid gap-2 pt-2">
                {rest.map((notice) => (
                  <li key={notice.id}>
                    <NoticeCard notice={notice} text={text} onDismiss={dismiss} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-2 flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-notice-toggle=""
              aria-expanded={open}
              aria-controls={extrasId}
              aria-label={open ? text.showFewer : hidden === 1 ? text.showOne : fill(text.showMore, { count: String(hidden) })}
              onClick={() => setExpanded(!open)}
              className="-ms-2.5 text-muted-foreground hover:text-foreground"
            >
              <span className="tabular-nums">{open ? text.showFewer : fill(text.more, { count: String(hidden) })}</span>
              {open ? <IconChevronUp /> : <IconChevronDown />}
            </Button>
          </div>
        </>
      ) : null}

      {/* In the page before they have anything to say, so what arrives later is spoken. */}
      <p role="status" className="sr-only">
        {polite}
      </p>
      <p role="alert" className="sr-only">
        {assertive}
      </p>
    </section>
  );
}
