"use client";

import { Children, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconEdit, IconMoreHorizontal, IconReply, IconSpinner, IconTrash } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** What a viewer can do with a comment. `reply` is a button under the body; `edit` and `delete` live in the overflow menu, and delete asks first. */
export type CommentAction = "reply" | "edit" | "delete";

/** The person who wrote a comment. */
export interface CommentAuthor {
  /** The name, in semibold. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
  /** Makes the name a link to the person's profile. */
  href?: string;
}

export interface CommentItemLabels {
  /** The reply button. Default "Reply". */
  reply?: string;
  /** The edit item in the menu. Default "Edit". */
  edit?: string;
  /** The delete item in the menu. Default "Delete". */
  delete?: string;
  /** The menu button's name, followed by " for" and the author. Default "More actions". */
  more?: string;
  /** The note beside the time of a comment that was changed. Default "Edited". */
  edited?: string;
  /** Unfolds a long body. Default "Show more". */
  showMore?: string;
  /** Folds it again. Default "Show less". */
  showLess?: string;
  /** The name of the group of replies. Default "Replies". */
  replies?: string;
  /** The question before a delete. Default "Delete this comment?". */
  confirmTitle?: string;
  /** What it means. Default "It is removed for everyone and cannot be brought back.". */
  confirmBody?: string;
  /** The button that deletes. Default "Delete comment". */
  confirm?: string;
  /** The button that keeps it. Default "Keep it". */
  cancel?: string;
  /** Said when the delete failed. Default "Could not delete the comment. Nothing was changed.". */
  failed?: string;
}

export interface CommentItemProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** Who wrote it. */
  author: CommentAuthor;
  /** When it was written: a Date, a timestamp or an ISO string. */
  createdAt: DateInput;
  /** When it was last changed. Adds an "Edited" note beside the time, with the exact moment in its tooltip. */
  editedAt?: DateInput;
  /** The comment itself: text, or your own rich text. More than six lines fold behind "Show more". Line breaks in a plain string are kept. */
  body: ReactNode;
  /** A role beside the name: "Owner", "Support", "Bot". */
  badge?: string;
  /** What this viewer may do. Default `["reply"]`. Add `"edit"` and `"delete"` on the viewer's own comments: they appear in a menu, and delete asks first. */
  actions?: readonly CommentAction[];
  /** An action was chosen. A delete runs this once it is confirmed: return a promise and the confirm button waits, and if it rejects the comment says so and stays. */
  onAction?: (action: CommentAction) => void | Promise<void>;
  /** The comment a permalink points at: a quiet frame and `aria-current`. */
  highlighted?: boolean;
  /** Next to Reply, for your own reaction bar or like button. */
  footer?: ReactNode;
  /** The comment is being edited: put your editor in `body`. It is shown in full, unfolded, and the actions step aside until you are done. */
  editing?: boolean;
  /** `sm` draws a 28px avatar, for replies. Default "default" (36px). */
  size?: "default" | "sm";
  /** The replies, as more `CommentItem`s with `size="sm"`. They nest under this comment along a thread line, so a thread is composed rather than baked in. */
  children?: ReactNode;
  /** The moment the age is measured against. Leave it out to use the browser's clock, read once the page is live; pass it to get relative text in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the comment uses, for translation. */
  labels?: CommentItemLabels;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const cache = new Map<string, Intl.DateTimeFormat>();
/** A formatter per locale and options. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateFormat(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    cache.set(key, format);
  }
  return format;
}

/** The calendar day a moment falls on in the zone, as a number of days, so "yesterday" is a day and not 24 hours. */
function calendarDay(at: number, timeZone: string): { day: number; year: number } {
  const parts = dateFormat("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return { day: Date.UTC(part("year"), part("month") - 1, part("day")) / DAY, year: part("year") };
}

interface Stamp {
  text: string;
  iso: string;
  full: string;
}

/** "now", "4 min. ago", "3 hr. ago", "yesterday", "3 days ago", then the date. Before the browser's clock is known it writes the date and clock time, which reads the same everywhere. */
function describe(input: DateInput, now: number | null, locale: string, timeZone: string): Stamp | null {
  const at = new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  const full = dateFormat(locale, timeZone, { dateStyle: "medium", timeStyle: "short" }).format(at);
  const iso = new Date(at).toISOString();
  if (now === null) return { text: dateFormat(locale, timeZone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(at), iso, full };
  const diff = at - now;
  const age = Math.abs(diff);
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short" });
  }
  if (age < MINUTE) return { text: words.format(0, "second"), iso, full };
  if (age < HOUR) return { text: words.format(Math.round(diff / MINUTE), "minute"), iso, full };
  if (age < DAY) return { text: words.format(Math.round(diff / HOUR), "hour"), iso, full };
  const then = calendarDay(at, timeZone);
  const today = calendarDay(now, timeZone);
  const days = then.day - today.day;
  if (Math.abs(days) <= 6) return { text: words.format(days, "day"), iso, full };
  return { text: dateFormat(locale, timeZone, { day: "numeric", month: "short", ...(then.year === today.year ? {} : { year: "numeric" }) }).format(at), iso, full };
}

/** The browser's clock, once the page is live and every so often while the text can still change. Null on the server and before hydration. */
function useNow(fixed: DateInput | undefined, at: DateInput): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  const moment = new Date(at).getTime();
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    // Past a day the text changes at midnight, not by the minute, and the next render catches it.
    const age = Math.abs(Date.now() - moment);
    const timer = age < DAY ? window.setInterval(read, age < HOUR ? 20_000 : 5 * MINUTE) : undefined;
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [pinned, moment]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TEXT_BUTTON =
  "rounded-sm px-1 text-xs font-medium text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * One comment as it appears under a document, a task or a post: avatar, the
 * author's name with an optional role, the time and an "Edited" note, then the
 * body. Bodies longer than six lines fold behind a "Show more" button that
 * only exists when there is something to unfold. Reply is a button under the
 * body; on the author's own comment, Edit and Delete sit in an overflow menu,
 * and Delete asks first, right where the comment is, with focus on the safe
 * answer and a message if the request fails. A comment opened from a
 * permalink gets a quiet frame and `aria-current`. Replies are `children`:
 * they nest along a thread line, so the thread is yours to compose.
 */
export function CommentItem({
  author,
  createdAt,
  editedAt,
  body,
  badge,
  actions = ["reply"],
  onAction,
  highlighted = false,
  footer,
  editing = false,
  size = "default",
  children,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: CommentItemProps) {
  const text = {
    reply: "Reply",
    edit: "Edit",
    delete: "Delete",
    more: "More actions",
    edited: "Edited",
    showMore: "Show more",
    showLess: "Show less",
    replies: "Replies",
    confirmTitle: "Delete this comment?",
    confirmBody: "It is removed for everyone and cannot be brought back.",
    confirm: "Delete comment",
    cancel: "Keep it",
    failed: "Could not delete the comment. Nothing was changed.",
    ...labels,
  };
  const nameId = useId();
  const bodyId = useId();
  const askId = useId();
  const askBodyId = useId();
  const clock = useNow(now, createdAt);
  const created = describe(createdAt, clock, locale, timeZone);
  const edited = editedAt === undefined ? null : describe(editedAt, clock, locale, timeZone);

  const bodyBox = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  const [open, setOpen] = useState(false);
  const [folds, setFolds] = useState(false);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const canReply = actions.includes("reply") && !editing;
  const canEdit = actions.includes("edit") && !editing;
  const canDelete = actions.includes("delete") && !editing;
  const small = size === "sm";
  const hasReplies = Children.toArray(children).length > 0;

  // Whether the body is taller than its six lines. Measured while it is folded, since an unfolded body fits by definition.
  const plain = typeof body === "string" ? body : null;
  useBrowserLayoutEffect(() => {
    const box = bodyBox.current;
    if (!box || open || editing) return;
    const measure = () => setFolds(box.scrollHeight > box.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [open, editing, plain]);

  useEffect(() => {
    if (asking) cancel.current?.focus();
  }, [asking]);

  // When an edit ends, the editor in the body goes away with whatever had focus: focus returns to the menu it was started from, not to the top of the page.
  const wasEditing = useRef(editing);
  useEffect(() => {
    const was = wasEditing.current;
    wasEditing.current = editing;
    if (!was || editing) return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    menuButton.current?.focus({ preventScroll: true });
  }, [editing]);

  function keep() {
    setAsking(false);
    setFailure(null);
    // The menu button is where the question came from.
    menuButton.current?.focus();
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await onAction?.("delete");
      setAsking(false);
    } catch {
      setFailure(text.failed);
    } finally {
      setBusy(false);
    }
  }

  const nameClass = cn("max-w-full min-w-0 truncate font-semibold tracking-[-0.01em] text-foreground", small ? "text-[0.8125rem]" : "text-sm");
  const name = author.href ? (
    <a id={nameId} href={author.href} className={cn(nameClass, "rounded-sm outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40")}>
      {author.name}
    </a>
  ) : (
    <span id={nameId} className={nameClass}>
      {author.name}
    </span>
  );

  return (
    <article
      data-slot="comment-item"
      data-highlighted={highlighted ? "" : undefined}
      aria-current={highlighted ? "true" : undefined}
      aria-labelledby={nameId}
      className={cn("rounded-xl border p-3 transition-colors duration-300 motion-reduce:transition-none", highlighted ? "border-border bg-muted/60" : "border-transparent", className)}
      {...props}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div className="flex flex-col items-center">
          <Avatar size={small ? "sm" : "default"} aria-hidden="true">
            {author.image ? <AvatarImage src={author.image} alt="" /> : null}
            <AvatarFallback>{initialsOf(author.name)}</AvatarFallback>
          </Avatar>
          {hasReplies ? <span aria-hidden="true" className="mt-2 w-px flex-1 bg-border" /> : null}
        </div>

        <div className="min-w-0">
          <header className="flex items-start justify-between gap-2">
            <div className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5", small ? "min-h-7" : "min-h-9")}>
              {name}
              {badge ? (
                <Badge variant="outline" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                  {badge}
                </Badge>
              ) : null}
              <span className="flex shrink-0 items-center gap-x-1.5 text-xs text-muted-foreground">
                {created ? (
                  <time dateTime={created.iso} title={created.full} suppressHydrationWarning className="tabular-nums">
                    {created.text}
                  </time>
                ) : null}
                {edited ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <time dateTime={edited.iso} title={`${text.edited} ${edited.full}`} suppressHydrationWarning>
                      {text.edited}
                      <span className="sr-only"> {edited.text}</span>
                    </time>
                  </>
                ) : null}
              </span>
            </div>
            {canEdit || canDelete ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button ref={menuButton} type="button" variant="ghost" size="icon-sm" aria-label={`${text.more} for ${author.name}`} className={cn("-me-1.5 shrink-0 text-muted-foreground hover:text-foreground", small ? "-mt-0.5" : "mt-0.5")}>
                    <IconMoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onCloseAutoFocus={(event) => {
                    // Delete hands focus to the question, not back to the button. It is done here and not only when the question opens: a menu that is closing still takes focus back while the pointer leaves it (after a click or a tap), and then unmounts with it.
                    if (!keepFocus.current) return;
                    keepFocus.current = false;
                    event.preventDefault();
                    cancel.current?.focus();
                  }}
                >
                  {canEdit ? (
                    <DropdownMenuItem onSelect={() => void onAction?.("edit")}>
                      <IconEdit />
                      {text.edit}
                    </DropdownMenuItem>
                  ) : null}
                  {canDelete ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => {
                        keepFocus.current = true;
                        setAsking(true);
                      }}
                    >
                      <IconTrash />
                      {text.delete}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </header>

          <div id={bodyId} ref={bodyBox} className={cn("text-[0.9375rem] leading-6 [overflow-wrap:anywhere]", !editing && "whitespace-pre-line", small && "text-sm", !open && !editing && "line-clamp-6")}>
            {body}
          </div>
          {!editing && (folds || open) ? (
            <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((value) => !value)} className={cn(TEXT_BUTTON, "mt-1 -ms-1")}>
              {open ? text.showLess : text.showMore}
            </button>
          ) : null}

          {asking ? (
            <div
              role="group"
              aria-labelledby={askId}
              aria-describedby={askBodyId}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || busy) return;
                event.stopPropagation();
                keep();
              }}
              className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 motion-safe:animate-rhs-in"
            >
              <p id={askId} className="text-sm font-medium">
                {text.confirmTitle}
              </p>
              <p id={askBodyId} className="mt-0.5 text-xs text-muted-foreground">
                {text.confirmBody}
              </p>
              {failure ? (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]">
                  <IconAlertCircle className="size-3.5 shrink-0" />
                  {failure}
                </p>
              ) : null}
              {/* Busy is said with aria-disabled and aria-busy, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control for the whole request and after a failure. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="destructive" aria-disabled={busy || undefined} aria-busy={busy || undefined} onClick={() => void remove()} className="aria-busy:opacity-50">
                  {busy ? <IconSpinner data-slot="button-spinner" /> : null}
                  {text.confirm}
                </Button>
                <Button
                  ref={cancel}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-disabled={busy || undefined}
                  onClick={() => {
                    if (!busy) keep();
                  }}
                  className="aria-disabled:opacity-50"
                >
                  {text.cancel}
                </Button>
              </div>
            </div>
          ) : !editing && (canReply || footer) ? (
            <div className="mt-2 -ms-2 flex flex-wrap items-center gap-1">
              {canReply ? (
                <Button type="button" variant="ghost" size="sm" data-action="reply" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => void onAction?.("reply")}>
                  <IconReply className="size-3.5 rtl:-scale-x-100" />
                  {text.reply}
                  <span className="sr-only"> to {author.name}</span>
                </Button>
              ) : null}
              {footer}
            </div>
          ) : null}

          {hasReplies ? (
            <div role="group" aria-label={text.replies} className="-mx-3 mt-2 grid">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
