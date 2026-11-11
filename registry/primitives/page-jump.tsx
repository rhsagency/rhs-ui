"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconAlertCircle, IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconInfo } from "@rhs-ui/icons";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface PageJumpLabels {
  /** The name of the page field. Default "Page". */
  page?: string;
  /** The text after the field; `{count}` is the number of pages. Default "of {count}". */
  of?: string;
  /** What is announced after every page change; `{page}` and `{count}` are the numbers. Default "Page {page} of {count}". */
  pageOf?: string;
  /** The name of the button that goes to the first page. Default "First page". */
  first?: string;
  /** The name of the button that goes one page back. Default "Previous page". */
  previous?: string;
  /** The name of the button that goes one page on. Default "Next page". */
  next?: string;
  /** The name of the button that goes to the last page. Default "Last page". */
  last?: string;
  /** The reason in the tooltip of the buttons that go back, on the first page. Default "You are on the first page". */
  atFirst?: string;
  /** The reason in the tooltip of the buttons that go on, on the last page. Default "You are on the last page". */
  atLast?: string;
  /** Said when what was typed is not a page; `{count}` is the number of pages. Default "Enter a page from 1 to {count}". */
  invalid?: string;
  /** Said when the page typed does not exist; `{page}` is what was typed and `{target}` the page shown instead. Default "There is no page {page}. Showing page {target}." */
  clamped?: string;
}

export interface PageJumpProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The current page, counted from 1. */
  page: number;
  /** How many pages there are. */
  pageCount: number;
  /** Called with the page to go to, from a button or from the field. You own the page: change `page` in response. */
  onPageChange?: (page: number) => void;
  /** Turns everything off, for the moment a page is loading. */
  disabled?: boolean;
  /** The name of the navigation landmark. Default "Pagination". */
  label?: string;
  /** Turns the four buttons into real links to the address you return, so the pages can be crawled and opened in a new tab. With no `onPageChange`, a jump from the field goes to the address too. */
  hrefFor?: (page: number) => string;
  /** The same as `hrefFor` for a Server Component, which cannot pass a function: an address with `{page}` in it, such as "/orders?page={page}". */
  hrefTemplate?: string;
  /** The locale the numbers are written in. Default "en-US". */
  locale?: string;
  /** The words used, for another language. */
  labels?: PageJumpLabels;
}

interface Note {
  tone: "info" | "error";
  text: string;
}

const plain = (event: MouseEvent) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/**
 * The end buttons give way in a narrow box, so the row stays one row and the field reaches any page. A touch screen
 * gets the wider threshold: its buttons are 44px, and the full row of a pager of up to 9,999 pages needs about 320 to
 * 350px there. Written out whole so Tailwind can see it.
 */
const ENDS = "@max-[18.5rem]:hidden [@media(pointer:coarse)]:@max-[22rem]:hidden";

/** The same for 10,000 pages and up, where the field and the "of 12,345" after it are wider. */
const ENDS_WIDE = "@max-[21rem]:hidden [@media(pointer:coarse)]:@max-[24rem]:hidden";

interface ControlProps {
  label: string;
  href?: string;
  /** A control that goes nowhere right now. It is aria-disabled, not disabled, so it keeps focus and can say why. */
  disabled: boolean;
  reason: string;
  onPress: (event: MouseEvent<HTMLElement>) => void;
  /** Extra classes of the button, for the ones that give way when there is no room. */
  className?: string;
  children: ReactNode;
}

/** One of the four buttons: a link when it has an address, a button when it has not, and the same tooltip either way. */
function Control({ label, href, disabled, reason, onPress, className, children }: ControlProps) {
  const [hint, setHint] = useState(false);
  const shared = {
    "aria-label": label,
    "aria-disabled": disabled || undefined,
    className: cn(
      buttonVariants({ variant: "outline", size: "icon" }),
      "aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:border-border aria-disabled:hover:bg-background aria-disabled:active:translate-y-0",
      "[@media(pointer:coarse)]:size-11",
      className,
    ),
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }
      onPress(event);
    },
  };
  const control =
    href !== undefined ? (
      <a {...shared} href={disabled ? undefined : href} role={disabled ? "link" : undefined} tabIndex={disabled ? 0 : undefined}>
        {children}
      </a>
    ) : (
      <button type="button" {...shared}>
        {children}
      </button>
    );
  return (
    <Tooltip open={disabled && reason !== "" && hint} onOpenChange={setHint}>
      <TooltipTrigger {...AS_CHILD}>{control}</TooltipTrigger>
      <TooltipContent side="top">{reason}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Pagination for hundreds of pages, where a row of page numbers is no use: first, previous, a field you type a
 * page into ("12" of 480), next and last. The field selects its number on focus; Enter goes there and Escape puts
 * the old number back. A page that does not exist is not silently changed: it goes to the nearest one and says so,
 * and an empty field says what is expected. Every change is announced ("Page 12 of 480"), the end buttons dim
 * with a tooltip that says why while staying focusable, and with `hrefFor` the four buttons are real links.
 */
export function PageJump({ page, pageCount, onPageChange, disabled = false, label = "Pagination", hrefFor, hrefTemplate, locale = "en-US", labels, className, "aria-label": ariaLabel, ...props }: PageJumpProps) {
  const words = {
    page: labels?.page ?? "Page",
    of: labels?.of ?? "of {count}",
    pageOf: labels?.pageOf ?? "Page {page} of {count}",
    first: labels?.first ?? "First page",
    previous: labels?.previous ?? "Previous page",
    next: labels?.next ?? "Next page",
    last: labels?.last ?? "Last page",
    atFirst: labels?.atFirst ?? "You are on the first page",
    atLast: labels?.atLast ?? "You are on the last page",
    invalid: labels?.invalid ?? "Enter a page from 1 to {count}",
    clamped: labels?.clamped ?? "There is no page {page}. Showing page {target}.",
  };
  const count = Math.max(1, Math.round(pageCount) || 1);
  const at = Math.min(Math.max(Math.round(page) || 1, 1), count);
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const n = (value: number) => numbers.format(value);
  const pageOf = fill(words.pageOf, { page: n(at), count: n(count) });
  const addressOf = hrefFor ?? (hrefTemplate ? (target: number) => hrefTemplate.replace("{page}", String(target)) : undefined);

  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  /** What is in the field while it is being edited. Null: not being edited, and the field shows the current page. */
  const [draft, setDraft] = useState<string | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [status, setStatus] = useState("");
  const selectNext = useRef(false);
  const pending = useRef<string | null>(null);
  const grabbed = useRef(false);

  // Whatever put the number in the field, the field shows it selected, ready to be typed over.
  useEffect(() => {
    if (!selectNext.current) return;
    selectNext.current = false;
    input.current?.select();
  });

  // A page change is told once, whoever made it: a button, the field, or your own code.
  const last = useRef(at);
  useEffect(() => {
    if (last.current === at) return;
    last.current = at;
    setStatus(pending.current ?? pageOf);
    pending.current = null;
  }, [at, pageOf]);
  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 4000);
    return () => window.clearTimeout(timer);
  }, [status]);
  useEffect(() => {
    if (note?.tone !== "info") return;
    const timer = window.setTimeout(() => setNote(null), 4500);
    return () => window.clearTimeout(timer);
  }, [note]);

  const go = (target: number) => {
    const next = Math.min(Math.max(target, 1), count);
    if (next === at) return;
    if (onPageChange) onPageChange(next);
    else if (addressOf) window.location.assign(addressOf(next));
  };

  const press = (target: number) => (event: MouseEvent<HTMLElement>) => {
    // A link with a handler is a button that has an address: a plain click is yours, a modified one opens the address.
    if (event.currentTarget.tagName === "A") {
      if (!onPageChange || !plain(event)) return;
      event.preventDefault();
    }
    go(target);
  };

  const commit = () => {
    const digits = (draft ?? "").replace(/\D/g, "");
    if (digits === "") {
      const text = fill(words.invalid, { count: n(count) });
      setNote({ tone: "error", text });
      setStatus(text);
      setDraft(String(at));
      selectNext.current = true;
      return;
    }
    const typed = Number(digits.slice(0, 9));
    const target = Math.min(Math.max(typed, 1), count);
    if (typed === target) setNote(null);
    else {
      const text = fill(words.clamped, { page: n(typed), target: n(target), count: n(count) });
      pending.current = text;
      setNote({ tone: "info", text });
      setStatus(text);
    }
    go(target);
    setDraft(null);
    selectNext.current = true;
  };

  const href = (target: number) => addressOf?.(Math.min(Math.max(target, 1), count));
  const onFirstPage = at <= 1;
  const onLastPage = at >= count;
  const digits = Math.max(2, n(count).length);
  const ends = digits >= 6 ? ENDS_WIDE : ENDS;
  const reason = (text: string) => (disabled ? "" : text);

  return (
    <div data-slot="page-jump" data-disabled={disabled || undefined} className={cn("@container flex w-full justify-center", className)} {...props}>
      <nav aria-label={ariaLabel ?? label} className="flex max-w-full flex-col items-center gap-1.5">
        {/* One row that never wraps, so no button is ever left alone on a second line: in a narrow box the end buttons go (see ENDS) and the field gives a little before anything breaks. */}
        <div className="flex max-w-full items-center justify-center gap-1.5">
          <TooltipProvider delayDuration={150}>
            <Control label={words.first} href={href(1)} disabled={disabled || onFirstPage} reason={reason(words.atFirst)} onPress={press(1)} className={ends}>
              <IconChevronsLeft />
            </Control>
            <Control label={words.previous} href={href(at - 1)} disabled={disabled || onFirstPage} reason={reason(words.atFirst)} onPress={press(at - 1)}>
              <IconChevronLeft />
            </Control>

            <div className="mx-1 flex min-w-0 items-center gap-2 text-sm">
              <input
                ref={input}
                type="text"
                inputMode="numeric"
                enterKeyHint="go"
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                aria-label={words.page}
                aria-invalid={note?.tone === "error" || undefined}
                aria-describedby={[`${id}-total`, note?.tone === "error" ? `${id}-note` : null].filter(Boolean).join(" ")}
                value={draft ?? n(at)}
                style={{ width: `calc(${digits}ch + 1.75rem)` }}
                className={cn(fieldSurface, "h-9 min-w-0 px-2 text-center font-medium tabular-nums selection:bg-primary selection:text-primary-foreground [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:text-base")}
                onFocus={() => {
                  setDraft(String(at));
                  selectNext.current = true;
                  setNote((previous) => (previous?.tone === "error" ? null : previous));
                }}
                onBlur={() => {
                  setDraft(null);
                  setNote((previous) => (previous?.tone === "error" ? null : previous));
                }}
                // A click on a field that is not focused yet would drop the caret in and undo the selection.
                onMouseDown={() => {
                  grabbed.current = document.activeElement !== input.current;
                }}
                onMouseUp={(event) => {
                  if (!grabbed.current) return;
                  grabbed.current = false;
                  event.preventDefault();
                }}
                onChange={(event) => {
                  setDraft(event.target.value.replace(/\D/g, "").slice(0, 9));
                  setNote((previous) => (previous?.tone === "error" ? null : previous));
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commit();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setDraft(String(at));
                    selectNext.current = true;
                    setNote(null);
                  }
                }}
              />
              <span id={`${id}-total`} className="whitespace-nowrap text-muted-foreground tabular-nums">
                {fill(words.of, { count: n(count) })}
              </span>
            </div>

            <Control label={words.next} href={href(at + 1)} disabled={disabled || onLastPage} reason={reason(words.atLast)} onPress={press(at + 1)}>
              <IconChevronRight />
            </Control>
            <Control label={words.last} href={href(count)} disabled={disabled || onLastPage} reason={reason(words.atLast)} onPress={press(count)} className={ends}>
              <IconChevronsRight />
            </Control>
          </TooltipProvider>
        </div>

        {/* What the status says, for the eyes: the same words, so it is hidden from the reader. It takes a line of its own under the controls, so no card around the pager can cut it off. */}
        {note ? (
          <p
            id={`${id}-note`}
            aria-hidden="true"
            className={cn("flex max-w-full items-start justify-center gap-1.5 pt-1 text-center text-xs leading-5 motion-safe:animate-rhs-in", note.tone === "error" ? "text-destructive" : "text-foreground")}
          >
            {note.tone === "error" ? <IconAlertCircle className="mt-0.5 size-3.5 shrink-0" /> : <IconInfo className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
            <span className="text-balance">{note.text}</span>
          </p>
        ) : null}
        <span role="status" className="sr-only">
          {status}
        </span>
      </nav>
    </div>
  );
}
