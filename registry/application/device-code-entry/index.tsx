"use client";

import { useEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClose, IconInfo, IconShieldAlert, IconTerminal } from "@rhs-ui/icons";
import { cleanDeviceCode, DEFAULT_DEVICE_ALPHABET, formatDeviceCode } from "@rhs-ui/application/device-code-entry/code";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { OtpInput } from "@rhs-ui/primitives/otp-input";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** What your server knows about the device that is asking, once the code is right. */
export interface DeviceRequest {
  /** What the device is called: "MacBook Pro". */
  deviceName: string;
  /** Where it asked from, as far as you know: "Utrecht, Netherlands". It is shown as approximate, since it usually comes from an IP address. */
  location?: string;
  /** When it asked: a Date, an ISO string or a timestamp. */
  requestedAt?: Date | string | number;
}

/** The words the card uses, for translation. `{client}`, `{device}`, `{account}`, `{example}`, `{length}` and `{chars}` are filled in. */
export interface DeviceCodeEntryLabels {
  /** The first step's heading. Default "Connect a device". */
  heading?: string;
  /** The line under it. Default "Enter the code that {client} shows on your device.". */
  description?: string;
  /** The name of the code boxes, and the label above them. Default "Device code". */
  codeLabel?: string;
  /** Under the boxes. Default "It is shown on your device, like {example}.". */
  codeHint?: string;
  /** The button. Default "Continue". */
  continue?: string;
  /** The button while the code is checked. Default "Checking the code". */
  checking?: string;
  /** Under the boxes when Continue was pressed with some of them empty. Default "Enter all {length} characters of the code.". */
  incomplete?: string;
  /** Under the boxes when `onSubmitCode` threw instead of returning a message. Default "We could not check the code. Check your connection and try again.". */
  failed?: string;
  /** Said when a character that codes never contain was typed or pasted. Default "Codes never contain {chars}.". */
  rejected?: string;
  /** The second step's heading. Default "Connect {client} on {device}?". */
  confirmHeading?: string;
  /** The line under it, when `account` is given. Default "{client} will be signed in as {account}.". */
  confirmLine?: string;
  /** The row naming the device. Default "Device". */
  factDevice?: string;
  /** The row naming where it is. Default "Approximate location". */
  factLocation?: string;
  /** The row naming when it asked. Default "Requested". */
  factRequested?: string;
  /** The row naming the code. Default "Code". */
  factCode?: string;
  /** The title of the warning. Default "Only continue if you started this on your own device". */
  warnTitle?: string;
  /** The line under it. Default "If you did not, deny the request. Nobody should ever ask you to read this code out to them.". */
  warnBody?: string;
  /** The button that agrees. Default "Approve". */
  approve?: string;
  /** The agree button while it works. Default "Approving". */
  approving?: string;
  /** The button that refuses. Default "Deny". */
  deny?: string;
  /** The refuse button while it works. Default "Denying". */
  denying?: string;
  /** The way back to the code. Default "Use a different code". */
  different?: string;
  /** Above the buttons when `onApprove` or `onDeny` threw. Default "Something went wrong and nothing was connected. Try again.". */
  actionFailed?: string;
  /** The heading once approved. Default "Device connected". */
  approvedHeading?: string;
  /** The line under it. Default "{client} is signed in on {device}. You can close this tab.". */
  approvedLine?: string;
  /** The heading once denied. Default "Request denied". */
  deniedHeading?: string;
  /** The line under it. Default "Nothing was connected. You can close this tab.". */
  deniedLine?: string;
  /** Said once approved. Default "Approved. {client} is connected on {device}.". */
  approvedSaid?: string;
  /** Said once denied. Default "Denied. Nothing was connected.". */
  deniedSaid?: string;
}

export interface DeviceCodeEntryProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /**
   * Looks the code up. It receives the code as the device shows it, in groups, "WDJB-MJHT". Resolve with what you know about the device and the card
   * moves to the question. Resolve with a message instead (a string) for a code that is wrong or expired ("That code has expired. Start again on your
   * device.") and the card announces it and keeps the code in the boxes for correcting. A thrown error shows a general message.
   */
  onSubmitCode: (code: string) => DeviceRequest | string | Promise<DeviceRequest | string>;
  /** The person agrees. Return a promise and both buttons wait; a rejection shows a message and nothing is lost. This is where you grant the device its token. */
  onApprove: () => void | Promise<void>;
  /** The person refuses. A button of the same size as Approve, never a link. */
  onDeny: () => void | Promise<void>;
  /** What is asking to be connected: "Acme CLI", "Halcyon TV". */
  clientName: string;
  /** The address of the account that would be connected, shown so nobody approves into the wrong one. */
  account?: string;
  /** How many characters the code has. Default 8. */
  codeLength?: number;
  /** The characters a code can contain, as one string. Anything else is turned away as it is typed or pasted. Default twenty consonants, so O and 0 can never be confused. */
  alphabet?: string;
  /** Where the hyphen goes: after this many characters. Default 4, "WDJB-MJHT". 0 for none. */
  groupAfter?: number;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the time is written in, so the server and the browser agree. Its name is written after the time. Default "UTC". */
  timeZone?: string;
  /** The code the boxes start with: for a preview, or a code carried in the address. */
  defaultCode?: string;
  /** Start with this message under the boxes, as it stands after a wrong code: for a preview. Typing clears it. */
  defaultError?: string;
  /** Start on the question, as if the code had been checked: for a preview. */
  defaultRequest?: DeviceRequest;
  /** Start on the answer: for a preview. Needs `defaultRequest`. */
  defaultOutcome?: "approved" | "denied";
  /** Under the card: a link to help. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: DeviceCodeEntryLabels;
}

const DEFAULT_LABELS = {
  heading: "Connect a device",
  description: "Enter the code that {client} shows on your device.",
  codeLabel: "Device code",
  codeHint: "It is shown on your device, like {example}.",
  continue: "Continue",
  checking: "Checking the code",
  incomplete: "Enter all {length} characters of the code.",
  failed: "We could not check the code. Check your connection and try again.",
  rejected: "Codes never contain {chars}.",
  confirmHeading: "Connect {client} on {device}?",
  confirmLine: "{client} will be signed in as {account}.",
  factDevice: "Device",
  factLocation: "Approximate location",
  factRequested: "Requested",
  factCode: "Code",
  warnTitle: "Only continue if you started this on your own device",
  warnBody: "If you did not, deny the request. Nobody should ever ask you to read this code out to them.",
  approve: "Approve",
  approving: "Approving",
  deny: "Deny",
  denying: "Denying",
  different: "Use a different code",
  actionFailed: "Something went wrong and nothing was connected. Try again.",
  approvedHeading: "Device connected",
  approvedLine: "{client} is signed in on {device}. You can close this tab.",
  deniedHeading: "Request denied",
  deniedLine: "Nothing was connected. You can close this tab.",
  approvedSaid: "Approved. {client} is connected on {device}.",
  deniedSaid: "Denied. Nothing was connected.",
} satisfies Required<DeviceCodeEntryLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The time in the locale and zone, with the zone's name after it ("2:27 PM UTC"): this is the line a person checks the request against, so a
 * clock time with no zone could be read as their own. (`timeZoneName` cannot be combined with `dateStyle`, hence the separate fields.)
 * An unknown locale or zone falls back to US English and UTC instead of taking the page down.
 */
function writtenTime(input: Date | string | number, locale: string, timeZone: string): string {
  const at = new Date(input);
  if (Number.isNaN(at.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone };
  try {
    return new Intl.DateTimeFormat(locale, options).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/**
 * The page you open from a command line tool or a TV: the device shows a short
 * code, and this is where it is typed. The code goes into one box per
 * character, grouped as the device shows it ("WDJB-MJHT"), upper-cased as it
 * is typed, with pasting accepted with or without the hyphen. Only the
 * characters of the alphabet get in; the default is twenty consonants, so the
 * letter O and the digit 0 cannot be confused, and a character that is turned
 * away is said out loud instead of silently doing nothing. A wrong or expired
 * code is announced and stays in the boxes for correcting. Once it is right the
 * card asks the real question, "Connect Acme CLI on MacBook Pro?", with what
 * you know about the device laid out as facts, a plain warning to continue
 * only if you started this yourself, and Approve and Deny as two buttons of one
 * size. The answer is shown and announced, and the card says it can be closed.
 */
export function DeviceCodeEntry({
  onSubmitCode,
  onApprove,
  onDeny,
  clientName,
  account,
  codeLength = 8,
  alphabet = DEFAULT_DEVICE_ALPHABET,
  groupAfter = 4,
  locale = "en-US",
  timeZone = "UTC",
  defaultCode = "",
  defaultError,
  defaultRequest,
  defaultOutcome,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: DeviceCodeEntryProps) {
  const text: Required<DeviceCodeEntryLabels> = { ...DEFAULT_LABELS, ...labels };
  const entry = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const working = useRef(false);
  const moved = useRef(false);
  const refocus = useRef(false);
  const [step, setStep] = useState<"code" | "confirm" | "done">(defaultRequest ? (defaultOutcome ? "done" : "confirm") : "code");
  const [code, setCode] = useState(() => cleanDeviceCode(defaultCode, alphabet, codeLength).code);
  const [error, setError] = useState(defaultError ?? "");
  const [turnedAway, setTurnedAway] = useState("");
  const [request, setRequest] = useState<DeviceRequest | null>(defaultRequest ?? null);
  const [busy, setBusy] = useState<"code" | "approve" | "deny" | null>(null);
  const [outcome, setOutcome] = useState<"approved" | "denied" | null>(defaultOutcome ?? null);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const shown = formatDeviceCode(code, groupAfter);
  // A code to show as an example: the first characters of the alphabet, grouped the way real ones are.
  const example = formatDeviceCode(Array.from({ length: codeLength }, (_, index) => alphabet[(index * 3) % alphabet.length] ?? "A").join("").toUpperCase(), groupAfter);
  const deviceName = request?.deviceName ?? "";
  const names = { client: clientName, device: deviceName, account: account ?? "", example, length: String(codeLength) };
  const inputs = () => Array.from(entry.current?.querySelectorAll<HTMLInputElement>("input:not([type=hidden])") ?? []);
  // The example is kept in one piece, so a narrow card breaks the line before it and not in the middle of its hyphen.
  const [hintBefore = "", hintAfter = ""] = fill(text.codeHint, { ...names, example: "{example}" }).split("{example}");

  // A character that is not in the alphabet never reaches a box: it is stopped before the input event, and the person is told why. Pasting goes through the change handler below.
  useEffect(() => {
    const node = entry.current;
    if (!node) return;
    const guard = (event: InputEvent) => {
      if (event.inputType !== "insertText" || !event.data) return;
      const { rejected } = cleanDeviceCode(event.data, alphabet, codeLength);
      if (rejected.length === 0) return;
      event.preventDefault();
      setTurnedAway(fill(text.rejected, { chars: rejected.join(", ") }));
    };
    node.addEventListener("beforeinput", guard);
    return () => node.removeEventListener("beforeinput", guard);
  }, [alphabet, codeLength, step, text.rejected]);

  // Focus follows the swap, but never on the first paint: the heading says where the person now is.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    if (step === "code") inputs()[0]?.focus();
    else heading.current?.focus();
  }, [step]);

  // The boxes are disabled while the code is checked, and a disabled box cannot take the focus; so a correction waits for them.
  useEffect(() => {
    if (busy !== null || !refocus.current) return;
    refocus.current = false;
    inputs()[0]?.focus();
  }, [busy]);

  function change(next: string) {
    const { code: clean, rejected } = cleanDeviceCode(next, alphabet, codeLength);
    setCode(clean);
    setTurnedAway(rejected.length > 0 ? fill(text.rejected, { chars: rejected.join(", ") }) : "");
    if (error) setError("");
  }

  async function submit() {
    if (working.current) return;
    if (code.length < codeLength) {
      setError(fill(text.incomplete, names));
      (inputs()[code.length] ?? inputs()[0])?.focus();
      return;
    }
    working.current = true;
    setBusy("code");
    setError("");
    try {
      const found = await onSubmitCode(formatDeviceCode(code, groupAfter));
      if (typeof found === "string") {
        // The code stays in the boxes: a typo is fixed, not retyped.
        setError(found);
        refocus.current = true;
      } else {
        setRequest(found);
        setProblem("");
        moved.current = true;
        setStep("confirm");
      }
    } catch {
      setError(text.failed);
      refocus.current = true;
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  async function decide(kind: "approve" | "deny") {
    if (working.current) return;
    working.current = true;
    setBusy(kind);
    setProblem("");
    try {
      if (kind === "approve") await onApprove();
      else await onDeny();
      setOutcome(kind === "approve" ? "approved" : "denied");
      say(fill(kind === "approve" ? text.approvedSaid : text.deniedSaid, names));
      moved.current = true;
      setStep("done");
    } catch {
      setProblem(text.actionFailed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  function back() {
    moved.current = true;
    setProblem("");
    setStep("code");
  }

  const shell = "@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";
  const titleClass = "text-xl leading-tight font-semibold tracking-[-0.03em] text-balance outline-none";
  const mark = (icon: ReactNode, solid = false) => (
    <span aria-hidden="true" className={cn("grid size-11 place-items-center rounded-full [&_svg]:size-5", solid ? "bg-primary text-primary-foreground" : "border border-border bg-muted/60 text-foreground")}>
      {icon}
    </span>
  );
  const live = (
    <span role="status" className="sr-only">
      <span key={said.id}>{said.text}</span>
    </span>
  );

  if (step === "done" && outcome) {
    const approved = outcome === "approved";
    return (
      <div data-slot="device-code-entry" data-step="done" data-outcome={outcome} className={cn(shell, className)} {...props}>
        <div className="grid justify-items-start gap-4">
          {mark(approved ? <IconCheck /> : <IconClose />, approved)}
          <div className="grid gap-1.5">
            <Title ref={heading} tabIndex={-1} className={titleClass}>
              {approved ? text.approvedHeading : text.deniedHeading}
            </Title>
            <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{fill(approved ? text.approvedLine : text.deniedLine, names)}</p>
          </div>
        </div>
        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
        {live}
      </div>
    );
  }

  if (step === "confirm" && request) {
    const requested = request.requestedAt === undefined ? "" : writtenTime(request.requestedAt, locale, timeZone);
    const facts = [
      { term: text.factDevice, value: request.deviceName },
      ...(request.location ? [{ term: text.factLocation, value: request.location }] : []),
      ...(requested ? [{ term: text.factRequested, value: <span className="tabular-nums">{requested}</span> }] : []),
      { term: text.factCode, value: <span className="font-mono tracking-[0.04em] tabular-nums">{shown}</span> },
    ];
    const locked = busy !== null;
    return (
      <div data-slot="device-code-entry" data-step="confirm" className={cn(shell, className)} {...props}>
        <div className="grid justify-items-start gap-4">
          {mark(<IconTerminal />)}
          <div className="grid gap-1.5">
            <Title ref={heading} tabIndex={-1} className={titleClass}>
              {fill(text.confirmHeading, names)}
            </Title>
            {account ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground [overflow-wrap:anywhere]">{fill(text.confirmLine, names)}</p> : null}
          </div>
        </div>

        <DescriptionList items={facts} className="rounded-lg border border-border bg-muted/30 px-4 py-3.5 sm:[&>div]:grid-cols-[9.5rem_1fr] [&_dd]:min-w-0 [&_dd]:[overflow-wrap:anywhere]" />

        {/* A warning in the card's own greys: the icon, the weight and the words carry it, so no colour is needed (and a consumer's theme has none). */}
        <Alert tone="info" role="note" className="border-foreground/30 [&>svg]:text-foreground">
          <IconShieldAlert />
          <AlertTitle className="text-balance">{text.warnTitle}</AlertTitle>
          <AlertDescription>{text.warnBody}</AlertDescription>
        </Alert>

        <div className="grid gap-4">
          <div role="alert" className="empty:hidden">
            {problem ? (
              <Alert tone="destructive" role="none" className={DANGER_TEXT}>
                <IconAlertCircle />
                <AlertTitle>{problem}</AlertTitle>
              </Alert>
            ) : null}
          </div>

          {/* Two filled buttons of one size: refusing is as visible and as easy as agreeing, and it comes first in the tab order. */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              aria-busy={busy === "deny" || undefined}
              aria-disabled={(locked && busy !== "deny") || undefined}
              onClick={() => void decide("deny")}
              className="aria-busy:cursor-progress aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:bg-secondary"
            >
              {busy === "deny" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : null}
              {busy === "deny" ? text.denying : text.deny}
            </Button>
            <Button
              type="button"
              size="lg"
              aria-busy={busy === "approve" || undefined}
              aria-disabled={(locked && busy !== "approve") || undefined}
              onClick={() => void decide("approve")}
              className="aria-busy:cursor-progress aria-disabled:cursor-default aria-disabled:opacity-60 aria-disabled:hover:bg-primary"
            >
              {busy === "approve" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : null}
              {busy === "approve" ? text.approving : text.approve}
            </Button>
          </div>

          <Button type="button" variant="ghost" size="sm" disabled={locked} onClick={back} className="justify-self-center text-muted-foreground hover:text-foreground">
            {text.different}
          </Button>
        </div>

        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
        {live}
      </div>
    );
  }

  return (
    <div data-slot="device-code-entry" data-step="code" className={cn(shell, className)} {...props}>
      <div className="grid justify-items-start gap-4">
        {mark(<IconTerminal />)}
        <div className="grid gap-1.5">
          <Title className={titleClass}>{text.heading}</Title>
          <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{fill(text.description, names)}</p>
        </div>
      </div>

      <form
        noValidate
        aria-busy={busy === "code" || undefined}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void submit();
        }}
        className="grid gap-5"
      >
        <div className="grid gap-3">
          <p aria-hidden="true" className="text-sm leading-none font-medium">
            {text.codeLabel}
          </p>
          <div ref={entry}>
            <OtpInput length={codeLength} mode="alphanumeric" groupAfter={groupAfter > 0 ? groupAfter : undefined} value={code} onValueChange={change} label={text.codeLabel} name="user_code" invalid={error !== ""} disabled={busy === "code"} />
          </div>
          <div role="alert" className="empty:hidden">
            {error ? (
              <p className={cn("flex items-start gap-2 text-[0.8125rem] leading-snug font-medium", DANGER_TEXT)}>
                <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
                {error}
              </p>
            ) : null}
          </div>
          <p className="text-[0.8125rem] leading-snug text-muted-foreground">
            {hintBefore}
            <span className="whitespace-nowrap tabular-nums">{example}</span>
            {hintAfter}
          </p>
          <p role="status" className="flex items-start gap-2 text-[0.8125rem] leading-snug font-medium text-foreground empty:hidden">
            {turnedAway ? <IconInfo aria-hidden="true" className="mt-px size-4 shrink-0" /> : null}
            {turnedAway}
          </p>
        </div>

        <Button type="submit" size="lg" loading={busy === "code"} className="w-full">
          {busy === "code" ? text.checking : text.continue}
        </Button>
      </form>

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
      {live}
    </div>
  );
}
