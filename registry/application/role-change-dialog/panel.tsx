"use client";

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconArrowRight, IconCheck, IconLock, IconMinus, IconPlus, IconSpinner, IconWarning } from "@rhs-ui/icons";
import {
  compareRoles,
  confirmValueOf,
  DEFAULT_LABELS,
  fill,
  messageOf,
  plural,
  sameText,
  type Capability,
  type RoleChange,
  type RoleChangeLabels,
  type RoleInfo,
  type RoleMember,
} from "@rhs-ui/application/role-change-dialog/roles";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface RoleChangePanelProps {
  /** The person whose role changes: a name, and an email that is shown under it and typed to confirm a promotion to a powerful role. */
  member: RoleMember;
  /** The role they have now, with everything it allows. */
  fromRole: RoleInfo;
  /** The role they would get, with everything it allows. Set `powerful` on it and the email has to be typed. */
  toRole: RoleInfo;
  /**
   * Makes the change. Return a promise: the field locks and the button shows progress while it runs, and the dialog cannot be
   * closed. When it resolves the form is replaced by "Role changed" and a sentence that names the person and the new role. When it
   * rejects the form stays as it was, with the message above the buttons, so nothing has to be retyped.
   */
  onConfirm: (change: RoleChange) => void | Promise<void>;
  /** Warn that the change takes something away, above the buttons, when it does. Default true. */
  warnOnDowngrade?: boolean;
  /** This person is the only one with the role they are leaving, such as the last owner. A change that takes something away is then refused, and the button stays off with the reason. */
  lastOwner?: boolean;
  /** Any other reason the change cannot be made. It is written above the buttons, the button stays off, and it replaces the last-owner sentence. */
  blockedReason?: string;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside an AlertDialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when "Cancel" or "Done" is pressed in a standalone panel. Inside an AlertDialog those buttons close it. */
  onClose?: () => void;
  /** Called with true while the change is made and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The language of the numbers and of "1 permission" against "3 permissions". Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: RoleChangeLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <AlertDialogTitle className={className}>{children}</AlertDialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <AlertDialogDescription className={className}>{children}</AlertDialogDescription>;
}

/** A sentence with one value in it, set in a heavier weight: `{value}` in the template. */
function Naming({ template, token, value }: { template: string; token: string; value: string }) {
  const [before = "", ...after] = template.split(`{${token}}`);
  if (!after.length) return <>{template}</>;
  return (
    <>
      {before}
      <strong className="font-semibold text-foreground [overflow-wrap:anywhere]">{value}</strong>
      {after.join(`{${token}}`)}
    </>
  );
}

/** One side of the comparison: a heading with a count, and the capabilities under it. A sign in front of each, so the lists read without colour. */
function Column({ title, items, empty, side }: { title: string; items: readonly Capability[]; empty: string; side: "gains" | "loses" }) {
  const Sign = side === "gains" ? IconPlus : IconMinus;
  const sign = (
    <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-full bg-foreground text-background">
      <Sign size={10} strokeWidth={3} />
    </span>
  );
  // A side with nothing on it is one quiet line, not a box with an empty body.
  if (!items.length) {
    return (
      <section data-side={side} className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border border-dashed border-border px-3 py-2.5">
        <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-[-0.01em]">
          {sign}
          {title}
        </h3>
        <p className="text-[0.8125rem] text-muted-foreground">{empty}</p>
      </section>
    );
  }
  return (
    <section data-side={side} className="min-w-0 rounded-lg border border-border bg-background">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h3 className="flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-[-0.01em]">
          {sign}
          {title}
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
      </header>
      <ul className="grid gap-2 p-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm leading-snug">
            <Sign aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <span className={cn("[overflow-wrap:anywhere]", side === "loses" && "text-muted-foreground")}>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The inside of the role change dialog, on its own: the person, the role they have and the role they would get, and under
 * them two lists computed from the roles' capabilities, "Gains" and "Loses", so nobody has to remember what Editor means. A
 * promotion to a powerful role asks for the member's email to be typed; the last owner cannot be demoted, which keeps the
 * button off and says why; a change that takes something away is warned about. Confirming shows progress and locks the
 * field; a success is replaced by one sentence that names the person and the new role, and a failure keeps the form with its
 * message. Use it inside an AlertDialog, or with `standalone` anywhere else.
 */
export function RoleChangePanel({
  member,
  fromRole,
  toRole,
  onConfirm,
  warnOnDowngrade = true,
  lastOwner = false,
  blockedReason,
  standalone = false,
  onClose,
  onBusyChange,
  locale = "en-US",
  labels,
  className,
}: RoleChangePanelProps) {
  const words: Required<RoleChangeLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const comparison = useMemo(() => compareRoles(fromRole, toRole), [fromRole, toRole]);
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  // What the success says, written when the change was made: the roles you pass may move on as soon as it is saved.
  const [made, setMade] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  const submitButton = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  // Whether the form still holds the focus at the moment it is replaced, so the way out only takes focus that was there to take.
  const keepFocus = useRef(false);

  const pending = status === "pending";
  const same = comparison.kind === "same";
  const takesAway = comparison.loses.length > 0;
  const expected = confirmValueOf(member);
  const needsTyping = Boolean(toRole.powerful) && !same;
  const matches = sameText(typed, expected);
  const reason = blockedReason ?? (lastOwner && takesAway ? fill(words.lastOwner, { name: member.name }) : same ? words.sameRole : null);
  const off = reason !== null || (needsTyping && !matches);
  const reasonId = `${id}-reason`;

  // The form leaves, and with it the button that had focus: the way out takes it, but only if the form had it. A panel that was
  // pressed by a preview or a script never pulls focus, and nothing here ever scrolls the page.
  useEffect(() => {
    if (status === "done" && keepFocus.current) closer.current?.focus({ preventScroll: true });
  }, [status]);

  // On a short screen the body scrolls. A box that scrolls and holds nothing to focus cannot be scrolled from the keyboard, so it becomes a stop of its own, but only while it scrolls.
  useEffect(() => {
    const node = body.current;
    if (!node) return;
    const measure = () => setScrolls(node.scrollHeight > node.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A dialog is drawn in a portal, but React still passes its events up to whatever rendered it: do not submit a form around it as well.
    event.stopPropagation();
    if (busy.current || reason !== null) return;
    if (needsTyping && !matches) {
      field.current?.focus();
      return;
    }
    // Focus counts as the panel's when it is inside the form. In the dialog this panel is drawn in, the whole dialog counts: it keeps focus inside itself.
    const form = event.currentTarget;
    const scope = standalone ? form : (form.closest('[role="alertdialog"]') ?? form);
    const hadFocus = scope.contains(document.activeElement);
    busy.current = true;
    setError(null);
    setStatus("pending");
    onBusyChange?.(true);
    // The field is about to switch off and take the focus with it. The button stays focusable, so focus rests there while it works.
    if (hadFocus) submitButton.current?.focus({ preventScroll: true });
    try {
      await onConfirm({ member, fromRole, toRole });
      setMade(fill(words.doneBody, { name: member.name, role: toRole.name }));
      // Read here, not when the button was pressed: somebody who went on to use the page while this ran does not get pulled back.
      keepFocus.current = scope.contains(document.activeElement);
      setStatus("done");
    } catch (thrown) {
      setStatus("idle");
      setError(messageOf(thrown) || words.failedBody);
    } finally {
      busy.current = false;
      onBusyChange?.(false);
    }
  }

  const cancel = standalone ? (
    <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
      {words.cancel}
    </Button>
  ) : (
    <AlertDialogCancel disabled={pending}>{words.cancel}</AlertDialogCancel>
  );

  return (
    <div data-slot="role-change-panel" data-status={status} className={cn("@container flex min-h-0 flex-col", className)}>
      {status === "done" ? (
        // The same kind of scroll box as the form body: on a short screen (a landscape phone, a page zoomed to 400%) the check and the
        // heading stay reachable instead of being clipped by the dialog.
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-5 py-10 text-center sm:px-6 sm:py-12">
            <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-5">
              <IconCheck />
            </span>
            <Heading standalone={standalone} className="mt-5 text-xl leading-tight font-medium tracking-[-0.02em]">
              {words.done}
            </Heading>
            <Lede standalone={standalone} className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {made}
            </Lede>
            <div className="mt-6">
              {standalone ? (
                <Button ref={closer} type="button" onClick={onClose}>
                  {words.close}
                </Button>
              ) : (
                <AlertDialogAction ref={closer}>{words.close}</AlertDialogAction>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-col">
          <div className="shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
              {fill(words.title, { name: member.name })}
            </Heading>
            <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {words.description}
            </Lede>
          </div>

          <div
            ref={body}
            tabIndex={scrolls ? 0 : undefined}
            role={scrolls ? "group" : undefined}
            aria-label={scrolls ? fill(words.title, { name: member.name }) : undefined}
            className="relative grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 pb-5 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar aria-hidden="true">
                  {member.image ? <AvatarImage src={member.image} alt="" /> : null}
                  <AvatarFallback>{initialsOf(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium tracking-[-0.01em]">{member.name}</p>
                  {member.email ? <p className="truncate text-[0.8125rem] text-muted-foreground">{member.email}</p> : null}
                </div>
              </div>
              <p className="flex shrink-0 items-center">
                <span className="sr-only">{fill(words.transition, { from: fromRole.name, to: toRole.name })}</span>
                <span aria-hidden="true" className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 bg-background px-2.5 text-[0.8125rem]">
                    {fromRole.name}
                  </Badge>
                  <IconArrowRight className="size-4 text-muted-foreground" />
                  <Badge className="h-6 px-2.5 text-[0.8125rem]">{toRole.name}</Badge>
                </span>
              </p>
            </div>

            <div className="grid gap-2.5">
              {/* Side by side only when both sides have something to list. A side with nothing on it is one quiet line across the full width, not a tall empty box beside a long list. */}
              <div className={cn("grid gap-3", comparison.gains.length > 0 && comparison.loses.length > 0 && "@md:grid-cols-2 @md:items-start")}>
                <Column side="gains" title={words.gains} items={comparison.gains} empty={words.nothingGained} />
                <Column side="loses" title={words.loses} items={comparison.loses} empty={words.nothingLost} />
              </div>
              {comparison.keeps.length ? (
                <p className="text-xs leading-snug text-muted-foreground tabular-nums">
                  {fill(plural(comparison.keeps.length, words.keepsOne, words.keepsMany, locale), { count: new Intl.NumberFormat(locale).format(comparison.keeps.length) })}
                </p>
              ) : null}
            </div>

            {warnOnDowngrade && takesAway && reason === null ? (
              <Alert tone="info" role="note">
                <IconWarning />
                <AlertDescription className="text-foreground">{fill(words.warning, { name: member.name })}</AlertDescription>
              </Alert>
            ) : null}

            {needsTyping && reason === null ? (
              <div className="grid gap-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <Naming template={fill(words.powerful, { role: toRole.name })} token="value" value={expected} />
                </p>
                <Label htmlFor={`${id}-confirm`} className="leading-snug">
                  <span>
                    <Naming template={words.typeLabel} token="value" value={expected} />
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    ref={field}
                    id={`${id}-confirm`}
                    value={typed}
                    disabled={pending}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    onChange={(event) => setTyped(event.target.value)}
                    className="pr-9"
                  />
                  {matches ? (
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-foreground">
                      <IconCheck aria-hidden="true" className="size-4" />
                      <span className="sr-only">{words.typeMatched}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            {reason !== null ? (
              <Alert id={reasonId} tone="destructive" role="note" className="text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                <IconLock />
                <AlertDescription className="text-current">{reason}</AlertDescription>
              </Alert>
            ) : null}

            {error !== null ? (
              <Alert tone="destructive" role="alert" className="text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
                <IconAlertCircle />
                <AlertTitle>{words.failed}</AlertTitle>
                <AlertDescription className="text-current">{error}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          {/* Buttons stacked only on a narrow phone: from 480px they sit in a row, so a short screen keeps its height for the body. */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-4 min-[480px]:flex-row min-[480px]:justify-end sm:px-6">
            {cancel}
            {/* Off and busy are said with aria-disabled and aria-busy, not disabled: a disabled button gives up focus, which would leave a keyboard on no control. */}
            <Button
              ref={submitButton}
              type="submit"
              aria-disabled={off || pending || undefined}
              aria-busy={pending || undefined}
              aria-describedby={reason !== null ? reasonId : undefined}
              className={cn("aria-disabled:cursor-not-allowed", off && !pending && "opacity-50", pending && "aria-disabled:cursor-progress")}
            >
              {pending ? <IconSpinner data-slot="button-spinner" /> : null}
              {pending ? words.confirming : error !== null ? words.retry : fill(words.confirm, { role: toRole.name })}
            </Button>
          </div>
        </form>
      )}
      {/* Kept in the page the whole time: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {pending ? words.confirming : status === "done" ? `${words.done}. ${made}` : ""}
      </p>
    </div>
  );
}
