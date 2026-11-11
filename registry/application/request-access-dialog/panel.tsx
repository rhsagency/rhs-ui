"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconLock, IconMail, IconSpinner, IconUser } from "@rhs-ui/icons";
import {
  ageText,
  DEFAULT_LABELS,
  fill,
  messageOf,
  stampText,
  toTimestamp,
  type AccessOwner,
  type AccessRequest,
  type RequestAccessLabels,
  type RequestLevel,
  type RequestTime,
} from "@rhs-ui/application/request-access-dialog/request";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";
import { cn } from "@/lib/utils";

export interface RequestAccessPanelProps {
  /** What is locked: "Q4 launch plan". It is named in the first sentence and in the last of the success. */
  resourceName: string;
  /** Who can say yes. They are named as the one who receives the request. */
  owner: AccessOwner;
  /** What can be asked for, such as View and Edit: an id, a label and a line on what each allows. With one level there is nothing to choose, and the choice is left out. */
  levels: readonly RequestLevel[];
  /** The `id` of the level that starts chosen. Default: the first. */
  defaultLevel?: string;
  /**
   * Sends the request with `{ level, message }`. Return a promise: the fields lock and the button shows progress while it runs, and
   * the dialog cannot be closed. When it resolves the form is replaced by "Request sent to Maya Okafor" and what to expect. When it
   * rejects the form stays as it was, with the note still in it and the message above the buttons.
   */
  onRequest: (request: AccessRequest) => void | Promise<void>;
  /** The address the person is signed in with. It says as whom they are asking, and where the answer will go. */
  signedInAs?: string;
  /** When the person already asked: a Date, an ISO string or a timestamp. The panel then says "Already requested 2 hours ago" and offers to send it again. */
  pendingSince?: RequestTime;
  /** The moment "2 hours ago" is measured from. Leave it out to use the browser's clock once the page is live; pass it for the words in server HTML, in tests and in previews. */
  now?: RequestTime;
  /** The most characters the note takes. Default 280. */
  maxLength?: number;
  /** Show the owner's email address under their name. Off by default: it is theirs to share. */
  showOwnerEmail?: boolean;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when "Cancel" or "Close" is pressed in a standalone panel. Inside a Dialog those buttons close it. */
  onClose?: () => void;
  /** Called with true while the request is sent and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in before the browser's clock is known, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the panel says, for translation. */
  labels?: RequestAccessLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

/** A sentence with some values in it, set in a heavier weight: `{owner}` and the like in the template. */
function Rich({ template, bold }: { template: string; bold: Record<string, string> }) {
  return (
    <>
      {template.split(/(\{\w+\})/g).map((part, index) => {
        const key = /^\{(\w+)\}$/.exec(part)?.[1];
        return key !== undefined && key in bold ? (
          <strong key={index} className="font-medium text-foreground [overflow-wrap:anywhere]">
            {bold[key]}
          </strong>
        ) : (
          part
        );
      })}
    </>
  );
}

const subscribeNever = (): (() => void) => () => undefined;

/**
 * The clock "2 hours ago" is read against: `now` when it is given, otherwise the browser's, once the page is live. Null while the
 * server renders and while the browser hydrates, so both write the same text; a panel that mounts after the page is live has the
 * time at once.
 */
function useClock(now: RequestTime | undefined): number | null {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [tick] = useState(() => Date.now());
  if (now !== undefined) {
    const at = toTimestamp(now);
    if (!Number.isNaN(at)) return at;
  }
  return mounted ? tick : null;
}

function Step({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-snug">
      <span aria-hidden="true" className="mt-px grid size-6 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="min-w-0 pt-0.5 [overflow-wrap:anywhere]">{children}</span>
    </li>
  );
}

/**
 * The inside of the request access dialog, on its own: who gets the request and as whom the person is asking, the level they
 * need as a short radio group, and a note with a counter. Sending shows progress and locks the fields; a success replaces the
 * form with "Request sent to Maya Okafor" and what to expect; a failure keeps the note and says so above the buttons; a request
 * that is already out is recognised ("Already requested 2 hours ago") and can be sent again. Use it inside a Dialog, or with
 * `standalone` anywhere else.
 */
export function RequestAccessPanel({
  resourceName,
  owner,
  levels,
  defaultLevel,
  onRequest,
  signedInAs,
  pendingSince,
  now,
  maxLength = 280,
  showOwnerEmail = false,
  standalone = false,
  onClose,
  onBusyChange,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
}: RequestAccessPanelProps) {
  const words: Required<RequestAccessLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [level, setLevel] = useState(defaultLevel ?? levels[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  // What the success says, written when the request was sent: the props may move on as soon as it is saved.
  const [sent, setSent] = useState({ owner: owner.name, resource: resourceName, email: signedInAs ?? "" });
  const submitButton = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  // Whether the form still holds the focus at the moment it is replaced, so the way out only takes focus that was there to take.
  const keepFocus = useRef(false);

  const pending = status === "pending";
  const earlier = pendingSince === undefined ? Number.NaN : toTimestamp(pendingSince);
  const clock = useClock(now);
  const earlierText = Number.isNaN(earlier) ? "" : clock === null ? stampText(earlier, locale, timeZone) : ageText(earlier, clock, locale, words.justNow);

  // The form leaves, and with it the button that had focus: the way out takes it, but only if the form had it. A panel that was
  // pressed by a preview or a script never pulls focus, and nothing here ever scrolls the page.
  useEffect(() => {
    if (status === "done" && keepFocus.current) closer.current?.focus({ preventScroll: true });
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A dialog is drawn in a portal, but React still passes its events up to whatever rendered it: do not submit a form around it as well.
    event.stopPropagation();
    if (busy.current) return;
    // Focus counts as the panel's when it is inside the form. In the dialog this panel is drawn in, the whole dialog counts: it keeps focus inside itself.
    const form = event.currentTarget;
    const scope = standalone ? form : (form.closest('[role="dialog"]') ?? form);
    const hadFocus = scope.contains(document.activeElement);
    busy.current = true;
    setError(null);
    setStatus("pending");
    onBusyChange?.(true);
    // The fields are about to switch off and take the focus with them. The button stays focusable, so focus rests there while it works.
    if (hadFocus) submitButton.current?.focus({ preventScroll: true });
    try {
      await onRequest({ level, message: message.trim() });
      setSent({ owner: owner.name, resource: resourceName, email: signedInAs ?? "" });
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

  function onNoteKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter makes a new line in a note; Ctrl or Command with Enter sends it.
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const cancel = standalone ? (
    <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
      {words.cancel}
    </Button>
  ) : (
    <DialogClose asChild>
      <Button type="button" variant="outline" disabled={pending}>
        {words.cancel}
      </Button>
    </DialogClose>
  );

  const doneTitle = fill(words.done, { owner: sent.owner });

  return (
    <div data-slot="request-access-panel" data-status={status} className={cn("flex min-h-0 flex-col", className)}>
      {status === "done" ? (
        // The same kind of scroll box as the form body: on a short screen (a landscape phone, a page zoomed to 200%) the check and the
        // heading stay reachable instead of being clipped by the dialog.
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center px-5 py-9 text-center sm:px-6 sm:py-10">
            <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-5">
              <IconCheck />
            </span>
            <Heading standalone={standalone} className="mt-5 text-xl leading-tight font-medium tracking-[-0.02em] [overflow-wrap:anywhere]">
              {doneTitle}
            </Heading>
            <Lede standalone={standalone} className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {words.doneBody}
            </Lede>
            <ul className="mt-6 grid w-full max-w-sm gap-3.5 text-left">
              <Step icon={<IconMail />}>{fill(words.nextMail, { owner: sent.owner })}</Step>
              <Step icon={<IconClock />}>{sent.email ? fill(words.nextReply, { email: sent.email }) : words.nextReplyAnon}</Step>
              <Step icon={<IconLock />}>{fill(words.nextWait, { resource: sent.resource })}</Step>
            </ul>
            <div className="mt-7">
              {standalone ? (
                <Button ref={closer} type="button" onClick={onClose}>
                  {words.close}
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button ref={closer} type="button">
                    {words.close}
                  </Button>
                </DialogClose>
              )}
            </div>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={(event) => void submit(event)} className="flex min-h-0 flex-col">
          <div className="flex shrink-0 items-start gap-3.5 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-5">
              <IconLock />
            </span>
            <div className="min-w-0">
              <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
                {words.title}
              </Heading>
              <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                <Rich template={words.description} bold={{ resource: resourceName, owner: owner.name }} />
              </Lede>
            </div>
          </div>

          <div className="relative grid min-h-0 flex-1 gap-5 overflow-y-auto px-5 pb-5 sm:px-6">
            {earlierText ? (
              <Alert tone="info">
                <IconClock />
                <AlertTitle>{fill(words.pending, { time: earlierText })}</AlertTitle>
                <AlertDescription>{fill(words.pendingBody, { owner: owner.name })}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3.5">
              <div className="flex items-center gap-3">
                <Avatar aria-hidden="true">
                  {owner.image ? <AvatarImage src={owner.image} alt="" /> : null}
                  <AvatarFallback>{initialsOf(owner.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{words.to}</p>
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-medium tracking-[-0.01em]">{owner.name}</span>
                    <Badge variant="outline" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                      {words.ownerTag}
                    </Badge>
                  </p>
                  {showOwnerEmail && owner.email ? <p className="truncate text-[0.8125rem] text-muted-foreground">{owner.email}</p> : null}
                </div>
              </div>
              {signedInAs ? (
                <p className="flex items-start gap-2.5 border-t border-border pt-3 text-[0.8125rem] leading-snug text-muted-foreground">
                  <IconUser aria-hidden="true" className="mt-px size-4 shrink-0" />
                  <span className="min-w-0">
                    <Rich template={words.signedInAs} bold={{ email: signedInAs }} />
                  </span>
                </p>
              ) : null}
            </div>

            {/* A disabled fieldset switches off every control inside it and keeps what was typed and chosen. */}
            <fieldset disabled={pending} className="m-0 grid min-w-0 gap-5 border-0 p-0">
              {levels.length > 1 ? (
                <div className="grid gap-2.5">
                  <p id={`${id}-level`} className="text-sm font-medium">
                    {words.level}
                  </p>
                  <RadioGroup value={level} onValueChange={setLevel} aria-labelledby={`${id}-level`} className="gap-2">
                    {levels.map((item) => (
                      <label
                        key={item.id}
                        htmlFor={`${id}-level-${item.id}`}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3 transition-colors duration-150 hover:bg-muted/50 has-[[data-state=checked]]:border-foreground/60 has-[[data-state=checked]]:bg-muted/40 has-disabled:cursor-not-allowed has-disabled:opacity-60 motion-reduce:transition-none"
                      >
                        <RadioGroupItem id={`${id}-level-${item.id}`} value={item.id} className="mt-0.5" />
                        <span className="grid min-w-0 gap-0.5">
                          <span className="text-sm leading-snug font-medium">{item.label}</span>
                          {item.description ? <span className="text-[0.8125rem] leading-snug text-muted-foreground">{item.description}</span> : null}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              ) : levels[0] ? (
                // With one level there is nothing to choose, but what is being asked for is still said.
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-3">
                  <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <p className="grid min-w-0 gap-0.5">
                    <span className="text-sm leading-snug font-medium">{levels[0].label}</span>
                    {levels[0].description ? <span className="text-[0.8125rem] leading-snug text-muted-foreground">{levels[0].description}</span> : null}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor={`${id}-message`}>{words.message}</Label>
                <TextareaCounter
                  id={`${id}-message`}
                  limit={maxLength}
                  rows={3}
                  value={message}
                  placeholder={words.messagePlaceholder}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={onNoteKeyDown}
                />
              </div>
            </fieldset>

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
            {/* Busy is said with aria-busy and aria-disabled, not disabled: a disabled button gives up focus, which would leave a keyboard on no control until the request is sent. */}
            <Button
              ref={submitButton}
              type="submit"
              aria-busy={pending || undefined}
              aria-disabled={pending || undefined}
              className="aria-disabled:cursor-progress"
            >
              {pending ? <IconSpinner data-slot="button-spinner" /> : null}
              {pending ? words.sending : error !== null ? words.retry : earlierText ? words.sendAgain : words.send}
            </Button>
          </div>
        </form>
      )}
      {/* Kept in the page the whole time: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {pending ? words.sending : status === "done" ? `${doneTitle}. ${words.doneBody}` : ""}
      </p>
    </div>
  );
}
