"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconCheck, IconClose, IconSpinner } from "@rhs-ui/icons";
import { IconCheckCircleAnimated } from "@rhs-ui/icons/animated/check-circle";
import { IconXCircleAnimated } from "@rhs-ui/icons/animated/x-circle";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

/** Where a request stands: waiting for a decision, approved or rejected. */
export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalButtonsProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** Controlled: the decision so far. Update it in `onApprove`, `onReject` and `onChangeDecision`. */
  status?: ApprovalStatus;
  /** Where an uncontrolled control starts. Default "pending". */
  defaultStatus?: ApprovalStatus;
  /** Called when Approve is pressed. The button shows its own busy state; if this rejects, a line says so and nothing is decided. */
  onApprove?: () => void | Promise<void>;
  /** Called with the reason when a rejection is confirmed. Same rules as `onApprove`. */
  onReject?: (reason: string) => void | Promise<void>;
  /** Called when "Change decision" is pressed: take the decision back and ask again. Uncontrolled, the buttons come back by themselves. */
  onChangeDecision?: () => void | Promise<void>;
  /** A rejection needs a reason. Off, the field is optional. Default true. */
  requireReason?: boolean;
  /** Who made the decision, as it reads in the status line. Uncontrolled it names the person pressing; default "you". */
  decidedBy?: string;
  /** When it was decided. Uncontrolled, it is the moment of the press. Without it a decision made elsewhere counts from when this control first sees it. A time given here is always printed with its date, so a page rendered on the server reads the same once it has loaded. */
  decidedAt?: Date | string | number;
  /** The reason given for a rejection, shown in the status line. Uncontrolled, it is the text that was sent. */
  reason?: string;
  /** What is being decided, for the names: "expense" gives "Approve expense". Default "request". */
  subject?: string;
  /** How many seconds "Change decision" stays available after a decision. 0 turns it off. Default 30. */
  undoWindow?: number;
  /** Language of the time. Default "en-US". */
  locale?: string;
  /** Time zone of the time, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** 32, 36 or 44px buttons. Default "default". */
  size?: "sm" | "default" | "lg";
}

type Action = "approve" | "reject" | "change";

const WIDTH = { sm: "min-w-24", default: "min-w-28", lg: "min-w-36" } as const;

function stamp(value: Date | string | number | undefined): number | null {
  if (value === undefined) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * A decision control for approvals: expenses, pull requests, leave requests.
 * Pending shows Approve and Reject at equal weight; Reject opens a small reason
 * field inline and commits only when it is confirmed (the button, or Ctrl or
 * Cmd with Enter). Once decided, the pair is replaced by a status line
 * ("Approved by Dana Whitfield, 14:20") with a Change decision button that
 * stays for a short window you set, with a thin line running down along its
 * edge; in a narrow space the button drops under the sentence instead of
 * squeezing it. Each action has its own busy and error state, the buttons name
 * their subject ("Approve expense"), and the final state is announced politely.
 * It holds no form of its own, so it can sit inside yours.
 */
export function ApprovalButtons({
  status: controlled,
  defaultStatus = "pending",
  onApprove,
  onReject,
  onChangeDecision,
  requireReason = true,
  decidedBy,
  decidedAt,
  reason: reasonProp,
  subject = "request",
  undoWindow = 30,
  locale = "en-US",
  timeZone = "UTC",
  size = "default",
  className,
  ...props
}: ApprovalButtonsProps) {
  const id = useId();
  const approveButton = useRef<HTMLButtonElement>(null);
  const reject = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  // Where focus goes after a decision made here: the button it replaced is gone, and keyboard users should not be dropped on the page.
  const refocus = useRef<"decided" | "pending" | null>(null);
  const [nudge, setNudge] = useState(0);
  const [own, setOwn] = useState<{ status: ApprovalStatus; at: number | null; reason: string }>({ status: defaultStatus, at: null, reason: "" });
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [failure, setFailure] = useState<{ action: Action; message: string } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // The time is only known in the browser, so it starts empty: the server and the first render agree, and the clock starts right after.
  const [now, setNow] = useState<number | null>(null);
  const [noticed, setNoticed] = useState<number | null>(null);

  const status = controlled ?? own.status;
  const decided = status !== "pending";
  const at = stamp(decidedAt) ?? own.at ?? noticed;
  const reason = reasonProp ?? own.reason;
  const by = decidedBy ?? "you";
  const remaining = decided && now !== null && at !== null && undoWindow > 0 ? Math.min(undoWindow, Math.max(0, Math.ceil((at + undoWindow * 1000 - now) / 1000))) : 0;

  useEffect(() => {
    const time = Date.now();
    setNow(time);
    setNoticed(status === "pending" ? null : time);
  }, [status]);
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [remaining > 0]);
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    const target = refocus.current;
    if (!target) return;
    refocus.current = null;
    if (target === "pending") approveButton.current?.focus();
    else (changeButton.current ?? pill.current)?.focus();
  }, [status, nudge]);

  const format = (time: number, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(time);
  // A decision made here reads as just the time when it was today; any other, and every time that is handed in, carries its date. The browser's clock decides what is today, so a time from props could not read one way on the server and another once the page loads.
  const given = stamp(decidedAt) !== null;
  const clock = (time: number) => (!given && now !== null && format(time, { dateStyle: "short" }) === format(now, { dateStyle: "short" }) ? format(time, { timeStyle: "short" }) : format(time, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }));
  const word = status === "approved" ? "Approved" : "Rejected";

  // The result is announced when the status changes, whoever changed it; the first render says nothing.
  const said = useRef(status);
  useEffect(() => {
    if (said.current === status) return;
    said.current = status;
    setAnnouncement(status === "pending" ? `Decision withdrawn. This ${subject} is waiting for a decision again.` : `${word} by ${by}${at !== null ? `, ${clock(at)}` : ""}.`);
  }, [status]);

  async function run(action: Action, work: () => void | Promise<void>, done: () => void): Promise<void> {
    if (pending.current) return;
    pending.current = true;
    setBusy(action);
    setFailure(null);
    try {
      await work();
      done();
    } catch {
      const message = action === "approve" ? `Could not approve this ${subject}. Try again.` : action === "reject" ? `Could not reject this ${subject}. Try again.` : "Could not change the decision. Try again.";
      setFailure({ action, message });
    } finally {
      pending.current = false;
      setBusy(null);
    }
  }

  function openReason(): void {
    setOpen(true);
    setTried(false);
    setFailure(null);
  }
  // Closing the field keeps what was typed: Escape by mistake should not cost a sentence. It is cleared once the rejection is sent.
  function closeReason(): void {
    setOpen(false);
    setTried(false);
    setFailure(null);
    reject.current?.focus();
  }
  const approve = () =>
    run("approve", () => onApprove?.(), () => {
      setOpen(false);
      refocus.current = "decided";
      setNudge((count) => count + 1);
      if (controlled === undefined) setOwn({ status: "approved", at: Date.now(), reason: "" });
    });
  const confirmReject = (): Promise<void> => {
    const text = draft.trim();
    if (requireReason && !text) {
      setTried(true);
      field.current?.focus();
      return Promise.resolve();
    }
    return run("reject", () => onReject?.(text), () => {
      setOpen(false);
      setDraft("");
      refocus.current = "decided";
      setNudge((count) => count + 1);
      if (controlled === undefined) setOwn({ status: "rejected", at: Date.now(), reason: text });
    });
  };
  const change = () =>
    run("change", () => onChangeDecision?.(), () => {
      refocus.current = "pending";
      setNudge((count) => count + 1);
      if (controlled === undefined) setOwn({ status: "pending", at: null, reason: "" });
    });

  const missing = requireReason && tried && draft.trim() === "";
  const fieldId = `${id}-reason`;
  const failed = (action: Action) => (failure?.action === action ? failure.message : null);
  const problem = (message: string | null, spacing?: string) =>
    message ? (
      <p role="alert" className={cn("flex items-start gap-1.5 text-xs leading-snug font-medium text-destructive", spacing)}>
        <IconAlertCircle className="mt-px size-3.5 shrink-0" />
        {message}
      </p>
    ) : null;

  return (
    <div data-slot="approval-buttons" data-status={status} className={cn("flex w-full max-w-full flex-col items-start gap-3", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>

      {decided ? (
        <div ref={pill} tabIndex={-1} className="@container relative w-full overflow-hidden rounded-lg border border-border bg-muted/40 px-3.5 py-3 outline-none transition-[opacity,translate] duration-200 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none">
          {/* Roomy, the sentence and Change decision share a row. Narrow, the sentence keeps the whole width and the button drops under it, in line with the words. */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 @sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-background">
              {/* The ring and the mark draw themselves once, as the decision lands. */}
              {status === "approved" ? <IconCheckCircleAnimated trigger="appear" className="size-4" /> : <IconXCircleAnimated trigger="appear" className="size-4" />}
            </span>
            <p className="min-w-0 text-sm leading-snug break-words">
              <span className="font-medium">{word}</span>
              {/* The name and the time each stay whole when the line breaks: "Dana Whitfield," never splits, and "10:13" is not cut off from its comma. */}
              <span className="text-muted-foreground">
                {" "}
                <span className="inline-block max-w-full">
                  by {by}
                  {at !== null ? "," : ""}
                </span>
                {at !== null ? (
                  <>
                    {" "}
                    <span className="inline-block max-w-full">{clock(at)}</span>
                  </>
                ) : null}
              </span>
              {status === "rejected" && reason ? <span className="mt-0.5 block text-xs text-muted-foreground">&ldquo;{reason}&rdquo;</span> : null}
            </p>
            {remaining > 0 ? (
              <Button
                ref={changeButton}
                type="button"
                variant="ghost"
                size="sm"
                aria-busy={busy === "change" || undefined}
                aria-disabled={busy === "change" || undefined}
                onClick={() => void change()}
                className="col-start-2 -ml-3 justify-self-start text-muted-foreground hover:text-foreground @sm:col-start-3 @sm:ml-0 @sm:-mr-1.5 @sm:justify-self-end"
              >
                {busy === "change" ? <IconSpinner /> : null}
                Change decision
                <span aria-hidden="true" className="min-w-[2ch] text-xs tabular-nums">
                  {remaining}s
                </span>
              </Button>
            ) : null}
          </div>
          {remaining > 0 ? (
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-foreground/15 transition-transform duration-1000 ease-linear motion-reduce:transition-none" style={{ transform: `scaleX(${remaining / undoWindow})` }} />
          ) : null}
          {problem(failed("change"), "mt-2")}
        </div>
      ) : (
        <>
          <div role="group" aria-label={`Decide on this ${subject}`} className="flex w-full flex-wrap gap-2">
            <Button
              ref={approveButton}
              type="button"
              variant="outline"
              size={size}
              disabled={busy === "reject"}
              aria-label={`Approve ${subject}`}
              aria-busy={busy === "approve" || undefined}
              aria-disabled={busy === "approve" || undefined}
              onClick={() => void approve()}
              className={cn(WIDTH[size], "flex-1 sm:flex-none")}
            >
              {busy === "approve" ? <IconSpinner /> : <IconCheck />}
              Approve
            </Button>
            <Button
              ref={reject}
              type="button"
              variant="outline"
              size={size}
              disabled={busy === "approve" || busy === "reject"}
              aria-label={`Reject ${subject}`}
              aria-expanded={open}
              aria-controls={`${id}-panel`}
              onClick={() => (open ? closeReason() : openReason())}
              className={cn(WIDTH[size], "flex-1 sm:flex-none", open && "bg-muted")}
            >
              <IconClose />
              Reject
            </Button>
          </div>
          {problem(failed("approve"), "-mt-1")}
          {/* The reason opens in place: the row grows from nothing, and what it holds cannot be reached while it is shut. */}
          <div
            id={`${id}-panel`}
            inert={!open}
            className={cn("grid w-full transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none", open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}
          >
            <div className="-mx-1 min-h-0 overflow-hidden px-1">
              {/* Not a <form>: this control often sits inside one, and a form inside a form is dropped from the page, so Confirm would send the outer one. */}
              <div
                className="grid gap-3 pt-1 pb-1"
                onKeyDown={(event) => {
                  if (event.key !== "Escape") return;
                  event.stopPropagation();
                  closeReason();
                }}
              >
                <div className="grid gap-1.5">
                  <Label htmlFor={fieldId} className="justify-between">
                    Why are you rejecting it?
                    <span className="text-xs font-normal text-muted-foreground">{requireReason ? "Required" : "Optional"}</span>
                  </Label>
                  <Textarea
                    id={fieldId}
                    ref={field}
                    rows={2}
                    value={draft}
                    placeholder="The requester sees this, so say what to change."
                    aria-invalid={missing || undefined}
                    aria-describedby={`${fieldId}-help`}
                    aria-keyshortcuts="Control+Enter Meta+Enter"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      // Enter writes a new line, as in any text field; Ctrl or Cmd with Enter confirms.
                      if (event.key !== "Enter" || !(event.ctrlKey || event.metaKey) || event.nativeEvent.isComposing) return;
                      event.preventDefault();
                      void confirmReject();
                    }}
                    className="min-h-16"
                  />
                  <p id={`${fieldId}-help`} className={cn("text-xs leading-snug", missing ? "font-medium text-destructive" : "text-muted-foreground")}>
                    {missing ? "Add a reason before you reject." : "It is shared with the requester."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" aria-busy={busy === "reject" || undefined} aria-disabled={busy === "reject" || undefined} onClick={() => void confirmReject()}>
                    {busy === "reject" ? <IconSpinner /> : null}
                    Confirm rejection
                  </Button>
                  <Button type="button" size="sm" variant="ghost" disabled={busy === "reject"} onClick={closeReason}>
                    Cancel
                  </Button>
                </div>
                {problem(failed("reject"))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
