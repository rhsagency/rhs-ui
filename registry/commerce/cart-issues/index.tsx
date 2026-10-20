"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconBan, IconCart, IconClose, IconInfo, IconMinusCircle, IconSpinner, IconTag } from "@rhs-ui/icons";
import { isBlocking, type CartIssue, type CartIssueType } from "@rhs-ui/commerce/cart-issues/issues";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { CartIssue, CartIssueType } from "@rhs-ui/commerce/cart-issues/issues";

export interface CartIssuesProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** What is wrong with the cart right now. Remove an issue from the list once it is fixed; an empty list shows nothing. */
  issues: readonly CartIssue[];
  /** Called when an issue's fix is pressed. Return a promise and that button shows it is working until it settles. */
  onFix?: (issue: CartIssue) => void | Promise<unknown>;
  /** Called when a notice is dismissed: an issue that does not block and has no fix of its own, like a price that dropped. Without it there is no dismiss button. */
  onDismiss?: (issue: CartIssue) => void;
  /** Called by "Fix all" with every issue that has a fix, except a minimum order, which only the shopper can solve. Without it there is no such button. */
  onFixAll?: (issues: readonly CartIssue[]) => void | Promise<unknown>;
  /** Called on mount and whenever the cart goes from having a blocking issue to having none, and back. Use it to disable checkout. */
  onBlockingChange?: (blocking: boolean) => void;
  /** Replaces the heading: "3 things need your attention". */
  title?: string;
}

/** The buttons that act on an issue: where the focus goes when one of them is pressed and goes away. */
const ACTIONS = "[data-fix], [data-dismiss]";

const ICONS: Record<CartIssueType, typeof IconBan> = {
  unavailable: IconBan,
  quantity: IconMinusCircle,
  price: IconTag,
  minimum: IconCart,
};

/**
 * What needs fixing before checkout, above the cart lines: an item that sold
 * out, a quantity above stock, a price that moved, a minimum order that is not
 * reached. Each issue names the product, says what happened in plain words
 * and offers the one action that resolves it. The region announces how many
 * there are once, when it first appears; after a fix or a dismiss, focus moves
 * to the next action, and to the status line when the last one is gone, so a
 * keyboard user is never dropped back on the page; and every blocking issue
 * says so. Keep the component mounted when the list is empty, so that status
 * line is there to take the focus. Wire `aria-describedby` from your checkout
 * button to this region's `id`, or use `summarizeCartIssues` for the reason to
 * print next to a disabled button.
 */
export function CartIssues({ issues, onFix, onDismiss, onFixAll, onBlockingChange, title, className, ...props }: CartIssuesProps) {
  const headingId = useId();
  const region = useRef<HTMLElement>(null);
  const status = useRef<HTMLParagraphElement>(null);
  /** The action button the shopper pressed, and where it sat among the action buttons, so the focus can follow it when it goes. */
  const pressed = useRef<{ button: HTMLElement; index: number } | null>(null);
  const announced = useRef(false);
  const reported = useRef<boolean | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const blockingCount = issues.filter(isBlocking).length;
  const blocking = blockingCount > 0;
  const fixable = issues.filter((issue) => issue.fix && issue.type !== "minimum");
  const heading = title ?? `${issues.length} ${issues.length === 1 ? "thing needs" : "things need"} your attention`;

  // The count is said once, when the region first appears, and not again as issues are fixed.
  useEffect(() => {
    if (issues.length > 0 && !announced.current) {
      announced.current = true;
      setAnnouncement(heading);
    } else if (issues.length === 0 && announced.current) {
      announced.current = false;
      setAnnouncement("All cart problems are fixed.");
    }
  }, [issues.length, heading]);

  useEffect(() => {
    if (reported.current === blocking) return;
    reported.current = blocking;
    onBlockingChange?.(blocking);
  }, [blocking, onBlockingChange]);

  /** Notes which action button was pressed, and its place among them, before the issue (and the button) may go. */
  function remember(button: HTMLElement, index?: number) {
    const buttons = Array.from(region.current?.querySelectorAll<HTMLElement>(ACTIONS) ?? []);
    pressed.current = { button, index: index ?? Math.max(0, buttons.indexOf(button)) };
  }

  // A fixed or dismissed issue takes its button with it, and the focus with it. Put the focus on the next action, so a keyboard user can
  // carry on; on the heading when only information is left; on the status line when the whole list is gone. Never on the page. If the
  // focus is somewhere else by now (the shopper moved on while a fix was working) it is left alone.
  useEffect(() => {
    const request = pressed.current;
    if (!request || request.button.isConnected) return;
    pressed.current = null;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const buttons = region.current?.querySelectorAll<HTMLElement>(ACTIONS);
    const target = buttons?.length ? buttons[Math.min(request.index, buttons.length - 1)] : (region.current?.querySelector<HTMLElement>("[data-heading]") ?? status.current);
    target?.focus();
  }, [issues]);

  async function work(key: string, task: () => void | Promise<unknown>) {
    if (pending.has(key)) return;
    const result = task();
    if (!result || typeof (result as Promise<unknown>).then !== "function") return;
    setPending((current) => new Set(current).add(key));
    try {
      await result;
    } catch {
      // The caller reports its own failures; the button simply becomes pressable again.
    } finally {
      setPending((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <>
      {/* Always rendered, also when the list is empty: it is where the focus lands after the last issue is fixed or dismissed. */}
      <p ref={status} role="status" tabIndex={-1} className="sr-only outline-none">
        {announcement}
      </p>
      {issues.length > 0 ? (
        <section
          ref={region}
          data-slot="cart-issues"
          data-blocking={blocking || undefined}
          aria-labelledby={headingId}
          className={cn("overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs [overflow-wrap:anywhere]", blocking ? "border-destructive/35" : "border-border", className)}
          {...props}
        >
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className={cn("grid size-8 shrink-0 place-items-center rounded-full", blocking ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                {blocking ? <IconAlertCircle size={18} /> : <IconInfo size={18} />}
              </span>
              <div className="min-w-0">
                <h3 id={headingId} data-heading="" tabIndex={-1} className="rounded-sm text-sm leading-snug font-semibold tracking-[-0.01em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                  {heading}
                </h3>
                <p className="text-xs text-muted-foreground">{blocking ? `You can check out once ${blockingCount === 1 ? "this is" : "these are"} fixed.` : "Nothing here stops you from checking out."}</p>
              </div>
            </div>
            {onFixAll && fixable.length > 1 ? (
              <Button
                type="button"
                size="sm"
                aria-busy={pending.has("all") || undefined}
                aria-disabled={pending.has("all") || undefined}
                onClick={(event) => {
                  remember(event.currentTarget, 0);
                  void work("all", () => onFixAll(fixable));
                }}
              >
                {pending.has("all") ? <IconSpinner /> : null}
                Fix all
              </Button>
            ) : null}
          </header>

          <ul role="list" className="divide-y divide-border border-t border-border">
            {issues.map((issue) => {
              const Icon = ICONS[issue.type];
              const stops = isBlocking(issue);
              const busy = pending.has(issue.id);
              const subject = issue.line ?? issue.message;
              const canFix = Boolean(issue.fix && onFix);
              const canDismiss = !stops && !issue.fix && Boolean(onDismiss);
              return (
                <li
                  key={issue.id}
                  data-type={issue.type}
                  data-blocking={stops || undefined}
                  // The fix sits at the end of the row on a wide screen and under the words on a narrow one; a dismiss stays at the end of the first line.
                  className={cn(
                    "grid items-start gap-x-3 gap-y-3 px-4 py-4 sm:px-5",
                    canDismiss ? "grid-cols-[auto_minmax(0,1fr)_auto]" : "grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto]",
                  )}
                >
                  <span aria-hidden="true" className="mt-0.5 grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-snug font-medium">
                      {issue.line ?? issue.message}
                      {stops ? (
                        <Badge variant="outline" className="border-destructive/35 text-destructive">
                          Blocks checkout
                        </Badge>
                      ) : null}
                    </p>
                    {issue.line ? <p className="mt-0.5 text-sm text-muted-foreground">{issue.message}</p> : null}
                  </div>
                  {canDismiss ? (
                    <div className="col-start-3 row-start-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        data-dismiss=""
                        aria-label={`Dismiss: ${subject}`}
                        onClick={(event) => {
                          remember(event.currentTarget);
                          onDismiss?.(issue);
                        }}
                      >
                        <IconClose />
                      </Button>
                    </div>
                  ) : null}
                  {canFix ? (
                    <div className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-fix=""
                        aria-label={issue.line ? `${issue.fix}: ${issue.line}` : issue.fix}
                        aria-busy={busy || undefined}
                        aria-disabled={busy || undefined}
                        onClick={(event) => {
                          remember(event.currentTarget);
                          void work(issue.id, () => onFix?.(issue));
                        }}
                      >
                        {busy ? <IconSpinner /> : null}
                        {issue.fix}
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
