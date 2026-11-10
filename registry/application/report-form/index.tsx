"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconFlag, IconMessage, IconMessageText, IconShield, IconTag, IconUser } from "@rhs-ui/icons";
import {
  DEFAULT_BLOCK,
  DEFAULT_LABELS,
  MIN_DETAIL,
  blocker,
  fill,
  type BlockOption,
  type ReportDraft,
  type ReportFormLabels,
  type ReportReason,
  type ReportSubject,
  type ReportSubmission,
} from "@rhs-ui/application/report-form/report";
import { Alert, AlertDescription } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";
import { cn } from "@/lib/utils";

export type { BlockOption, ReportDraft, ReportFormLabels, ReportReason, ReportSubject, ReportSubmission } from "@rhs-ui/application/report-form/report";

export interface ReportFormProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "onSubmit" | "title" | "children"> {
  /** The reasons to choose from, in order, one line of explanation each. */
  reasons: readonly ReportReason[];
  /** What is being reported. It names the heading and is shown in a small card, so the person can check it is the right thing. */
  subject: ReportSubject;
  /** Called with the report when the person sends it. Return a promise to show that the report is on its way; if it rejects, the form stays and says so. */
  onSubmit: (report: ReportSubmission) => void | Promise<void>;
  /** Offer an "Also block this user" box, unticked by default. `true` for the usual words, or your own label and line. */
  blockOption?: boolean | BlockOption;
  /** The most characters of detail. Default 500. */
  maxDetail?: number;
  /** The fewest characters of detail a reason that asks for it needs. Default 10. */
  minDetail?: number;
  /** The form as it stands, when you control it. */
  value?: ReportDraft;
  /** The form to begin with, when it keeps its own state. */
  defaultValue?: Partial<ReportDraft>;
  /** Called whenever the reason, the detail or the block box changes. */
  onValueChange?: (value: ReportDraft) => void;
  /** Called by the Cancel button. Without it there is no Cancel button. */
  onCancel?: () => void;
  /** Called by the Done button of the confirmation, to close the dialog. Without it the confirmation has no button. */
  onDone?: () => void;
  /** The heading block, in place of the form's own: pass your dialog's header, with its title. After the report is sent it stays in the page, unseen, so the dialog keeps its name. */
  header?: ReactNode;
  /** What the note under the reasons says. Default "We review reports within 24 hours and never tell the person you reported who sent it." */
  note?: ReactNode;
  /** Turn the whole form off. */
  disabled?: boolean;
  /** The words the form says, for translation. */
  labels?: ReportFormLabels;
}

/** A small mark for the kind of thing that is reported. */
function SubjectIcon({ kind }: { kind: string }): React.JSX.Element {
  if (kind === "post") return <IconMessageText aria-hidden="true" className="size-4" />;
  if (kind === "comment") return <IconMessage aria-hidden="true" className="size-4" />;
  if (kind === "listing") return <IconTag aria-hidden="true" className="size-4" />;
  if (kind === "user") return <IconUser aria-hidden="true" className="size-4" />;
  return <IconFlag aria-hidden="true" className="size-4" />;
}

/**
 * The content of a report dialog for moderation: a card with what is being
 * reported, the reasons as a radio list with one line of explanation each, a
 * text box that opens (and counts) under the reasons that need detail, an
 * optional "Also block this user" box that starts unticked, and a note that
 * says what happens next. Send stays disabled until a reason is chosen and,
 * where the reason asks for it, the detail has enough words; the line beside it
 * says what is missing. After sending, a confirmation replaces the form and is
 * announced politely; if sending fails, the form stays and says so. In a
 * dialog that is shorter than the form, the reasons scroll between the heading
 * and the Send row, which both stay in view, so the report can always be sent.
 */
export function ReportForm({
  reasons,
  subject,
  onSubmit,
  blockOption,
  maxDetail = 500,
  minDetail = MIN_DETAIL,
  value,
  defaultValue,
  onValueChange,
  onCancel,
  onDone,
  header,
  note,
  disabled = false,
  labels,
  className,
  ...props
}: ReportFormProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const failure = useRef<HTMLDivElement>(null);
  // Whether the body has more behind its top and its bottom edge, which only happens when the form is given less room than it needs.
  const [edges, setEdges] = useState({ above: false, below: false });
  // Whether the focus was in the form when it was sent: the button that had it is switched off while sending and goes away with the form.
  const hadFocus = useRef(false);
  const [own, setOwn] = useState<ReportDraft>({ reasonId: null, detail: "", block: false, ...defaultValue });
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState<{ block: boolean } | null>(null);
  const draft = value ?? own;
  const reason = reasons.find((item) => item.id === draft.reasonId);
  const open = reason?.requiresDetail ? reason.id : null;
  const stop = blocker(reasons, draft, minDetail);
  const block = blockOption ? { ...DEFAULT_BLOCK, ...(typeof blockOption === "object" ? blockOption : null) } : null;

  // The box of the reason that was chosen before closes while the new one opens, so it is kept in the page until it has folded away.
  const [leaving, setLeaving] = useState<string | null>(null);
  const before = useRef(open);
  useEffect(() => {
    const was = before.current;
    before.current = open;
    if (!was || was === open) return;
    setLeaving(was);
    const timer = window.setTimeout(() => setLeaving(null), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  // The body is only there until the report is sent. Its children are watched too, because a box that opens or closes inside it changes how much there is to scroll.
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const measure = () => {
      const above = element.scrollTop > 1;
      const below = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      setEdges((now) => (now.above === above && now.below === below ? now : { above, below }));
    };
    measure();
    element.addEventListener("scroll", measure, { passive: true });
    const watch = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    watch?.observe(element);
    for (const child of element.children) watch?.observe(child);
    return () => {
      element.removeEventListener("scroll", measure);
      watch?.disconnect();
    };
  }, [sent]);

  // The confirmation replaces the form, and the message of a failure appears where the button was: each takes the focus, so a keyboard user is not dropped on the page.
  useEffect(() => {
    if (sent && hadFocus.current) confirmation.current?.focus();
  }, [sent]);
  useEffect(() => {
    if (failed && hadFocus.current) failure.current?.focus();
  }, [failed]);

  function change(patch: Partial<ReportDraft>) {
    const next = { ...draft, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stop || pending || disabled || !reason) return;
    hadFocus.current = Boolean(root.current?.contains(document.activeElement));
    setPending(true);
    setFailed(false);
    try {
      await onSubmit({ reasonId: reason.id, detail: reason.requiresDetail ? draft.detail.trim() : "", block: Boolean(block) && draft.block });
      setSent({ block: Boolean(block) && draft.block });
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  const heading = header ?? (
    <div className="grid gap-1.5">
      <h3 className="text-lg leading-tight font-semibold tracking-[-0.02em]">{fill(words.title, { kind: subject.kind })}</h3>
      <p className="text-sm text-muted-foreground">{words.intro}</p>
    </div>
  );

  return (
    <div
      ref={root}
      data-slot="report-form"
      // In a dialog the form may not be taller than the dialog can be (the screen, less its margin and padding), so the body below scrolls and the Send row stays in view.
      className={cn("flex w-full min-w-0 flex-col [[data-slot=dialog-content]_&]:max-h-[calc(100dvh-5rem)]", className)}
      {...props}
    >
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {sent ? words.sent : ""}
      </p>

      {sent ? (
        <div ref={confirmation} tabIndex={-1} data-slot="report-form-sent" className="outline-none">
          {/* The dialog is named by the title inside `header`, which would go away with the form. It stays, unseen and not read out twice, so the dialog keeps its name. */}
          {header ? (
            <div aria-hidden="true" className="sr-only">
              {header}
            </div>
          ) : null}
          <ResultState
            tone="success"
            title={words.doneTitle}
            description={sent.block ? `${words.doneBody} ${words.doneBlocked}` : words.doneBody}
            actions={onDone ? <Button variant="outline" onClick={onDone}>{words.done}</Button> : undefined}
            className="max-w-none px-0 py-6"
          />
        </div>
      ) : (
        <form onSubmit={send} noValidate className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-3">
          <div data-slot="report-form-heading">{heading}</div>

          {/* The heading and the buttons stay where they are; what lies between them scrolls when the form is given less room than it needs. A hairline on the edge that has more behind it says so. */}
          <div
            ref={body}
            data-slot="report-form-body"
            data-above={edges.above || undefined}
            data-below={edges.below || undefined}
            className="relative -mx-1 -my-px grid min-h-0 content-start gap-5 overflow-y-auto border-y border-transparent px-1 py-2 transition-colors duration-150 data-[above]:border-t-border data-[below]:border-b-border motion-reduce:transition-none"
          >
            <div data-slot="report-form-subject" className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
                <SubjectIcon kind={subject.kind} />
              </span>
              <div className="grid min-w-0 gap-0.5">
                <p className="truncate text-sm leading-5 font-medium">{subject.title}</p>
                {subject.byline ? <p className="truncate text-xs leading-4 text-muted-foreground">{subject.byline}</p> : null}
              </div>
            </div>

            <fieldset disabled={disabled || pending} className="grid min-w-0 gap-5">
              <RadioGroup value={draft.reasonId ?? ""} onValueChange={(id) => change({ reasonId: id })} aria-label={words.reasons} className="gap-2">
                {reasons.map((item) => {
                  const id = `${base}-${item.id}`;
                  const shown = open === item.id;
                  const mounted = shown || leaving === item.id;
                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-card transition-[border-color,background-color] duration-150 has-[[data-state=checked]]:border-foreground/50 has-[[data-state=checked]]:bg-muted/40 has-[button:focus-visible]:border-ring motion-reduce:transition-none"
                    >
                      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 px-3.5 py-3">
                        <RadioGroupItem id={id} value={item.id} aria-labelledby={`${id}-label`} aria-describedby={item.description ? `${id}-description` : undefined} className="mt-0.5" />
                        <span className="grid min-w-0 gap-0.5">
                          <span id={`${id}-label`} className="text-sm leading-5 font-medium">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span id={`${id}-description`} className="text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                      {item.requiresDetail && mounted ? (
                        <div
                          inert={!shown}
                          className={cn(
                            "grid px-3.5 transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none starting:grid-rows-[0fr] starting:opacity-0",
                            shown ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="-m-1 min-h-0 overflow-hidden p-1">
                            <div className="grid gap-2 pb-3 pl-[30px]">
                              <Label htmlFor={`${id}-detail`}>{words.detailLabel}</Label>
                              <p className="text-xs leading-4 text-muted-foreground">{fill(words.detailHint, { min: minDetail })}</p>
                              <TextareaCounter id={`${id}-detail`} limit={maxDetail} rows={3} value={draft.detail} onChange={(event) => change({ detail: event.target.value })} />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </RadioGroup>

              {block ? (
                <div className="flex items-start gap-3 rounded-lg border border-border p-3.5">
                  <Checkbox id={`${base}-block`} checked={draft.block} onCheckedChange={(next) => change({ block: next === true })} aria-describedby={`${base}-block-description`} className="mt-0.5" />
                  <Label htmlFor={`${base}-block`} className="grid gap-0.5 leading-normal font-normal">
                    <span className="text-sm leading-5 font-medium">{block.label}</span>
                    <span id={`${base}-block-description`} className="text-xs leading-5 text-muted-foreground">
                      {block.description}
                    </span>
                  </Label>
                </div>
              ) : null}
            </fieldset>

            <p data-slot="report-form-note" className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
              <IconShield aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{note ?? words.note}</span>
            </p>
          </div>

          <div data-slot="report-form-actions" className="grid gap-5">
            {failed ? (
              <Alert ref={failure} tabIndex={-1} tone="destructive" role="alert" className="outline-none">
                <IconAlertCircle aria-hidden="true" />
                <AlertDescription className="font-medium text-foreground">{words.failed}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p id={`${base}-hint`} className="min-h-4 text-xs leading-4 text-muted-foreground empty:hidden sm:max-w-[16rem] sm:empty:block">
                {stop === "reason" ? words.needReason : stop === "detail" ? fill(words.needDetail, { min: minDetail }) : null}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {onCancel ? (
                  <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>
                    {words.cancel}
                  </Button>
                ) : null}
                <Button type="submit" loading={pending} disabled={disabled || stop !== null} aria-describedby={stop ? `${base}-hint` : undefined}>
                  {words.submit}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
