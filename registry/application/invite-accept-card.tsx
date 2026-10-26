"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClock, IconInfo, IconSpinner, IconUsers } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { ConfirmPopover } from "@rhs-ui/primitives/confirm-popover";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { DEFAULT_PASSWORD_RULES, PasswordInput, type PasswordRule } from "@rhs-ui/primitives/password-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** The workspace someone is invited to. */
export interface InviteWorkspace {
  /** Its name: "Northwind". */
  name: string;
  /** Its logo, as an image address. Without one the avatar shows the initials. */
  logo?: string;
  /** How many people are in it now. Leave it out to skip the line. */
  members?: number;
}

/** The person who sent the invite. */
export interface InviteInviter {
  /** Their name: "Ana Costa". */
  name: string;
  /** Their address, shown when the invite has expired so the person knows who to ask. */
  email?: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  avatar?: string;
}

/** What the "new" form hands to `onAccept`. */
export interface InviteAcceptValues {
  /** The name typed, trimmed. */
  name: string;
  /** The password as typed. */
  password: string;
}

/** The words the card uses, for translation. `{workspace}`, `{inviter}`, `{role}`, `{count}`, `{when}` and `{date}` are filled in. */
export interface InviteAcceptCardLabels {
  /** The heading. Default "Join {workspace}". */
  heading?: string;
  /** The line under it; the inviter is set in bold and the role becomes a chip with the tooltip. Default "{inviter} invited you as {role}". */
  invitedBy?: string;
  /** Said to screen readers about the role chip, before what the role can do; `{role}` is filled in. Default "{role} can". */
  roleCan?: string;
  /** One member. Default "{count} member". */
  memberOne?: string;
  /** Several members. Default "{count} members". */
  memberOther?: string;
  /** While the clock is not known yet, and in the server HTML. Default "Valid until {date}". */
  validUntil?: string;
  /** How long is left; `{when}` is a phrase like "in 6 days" or "tomorrow". Default "Expires {when}". */
  expires?: string;
  /** When the date has passed. Default "Expired on {date}". */
  expiredOn?: string;
  /** The heading of the expired notice. Default "This invite has expired". */
  expiredTitle?: string;
  /** What to do about it. Default "Ask {inviter} to send you a new one.". */
  expiredBody?: string;
  /** Above the signed-in address. Default "Join as". */
  joinAs?: string;
  /** The link to another account. Default "Not you?". */
  notYou?: string;
  /** The main button. Default "Join {workspace}". */
  join?: string;
  /** The main button once it worked. Default "Joined". */
  joined?: string;
  /** Said when joining worked. Default "You joined {workspace}.". */
  joinedSaid?: string;
  /** The decline button beside Join. Default "Decline". */
  decline?: string;
  /** The decline link under the new-account form. Default "Decline invite". */
  declineLink?: string;
  /** The question in the confirmation. Default "Decline this invite?". */
  declineTitle?: string;
  /** What declining means. Default "You will not join {workspace}. {inviter} can send a new invite if you change your mind.". */
  declineBody?: string;
  /** The confirming button. Default "Decline invite". */
  declineConfirm?: string;
  /** The heading once declined. Default "Invite declined". */
  declinedTitle?: string;
  /** The line under it. Default "You did not join {workspace}. {inviter} can send you a new invite whenever you change your mind.". */
  declinedBody?: string;
  /** The email field's label, in the new-account form. Default "Email address". */
  email?: string;
  /** Under it. Default "Your invite was sent to this address.". */
  emailHint?: string;
  /** The name field's label. Default "Full name". */
  name?: string;
  /** Under the name field when it is empty. Default "Enter your name.". */
  nameMissing?: string;
  /** The password field's label. Default "Password". */
  password?: string;
  /** Under the password field when a rule is not met. Default "Choose a password that meets every requirement.". */
  passwordWeak?: string;
  /** The new-account button. Default "Create account and join". */
  create?: string;
  /** Before the sign-in link in the new-account form. Default "Already have an account?". */
  haveAccount?: string;
  /** The sign-in link. Default "Sign in". */
  signIn?: string;
  /** Above the card's buttons when `onAccept` or `onDecline` threw. Default "Something went wrong. Check your connection and try again.". */
  failed?: string;
}

export interface InviteAcceptCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The workspace: its name, an optional logo and the number of people in it. */
  workspace: InviteWorkspace;
  /** Who sent the invite. */
  inviter: InviteInviter;
  /** The role they are invited as, in words: "Editor". */
  role: string;
  /** What that role can do, one short line each. It becomes the tooltip on the role chip, so nobody joins blind. Leave it out for a plain chip. */
  roleSummary?: string | readonly string[];
  /** When the invite stops working. Leave it out for an invite that never does. Once it has passed, the card says so and offers no buttons. */
  expiresAt?: Date | string | number;
  /** The address the invite was sent to. In `existing` mode it is the account that joins; in `new` mode it is fixed in the form. */
  email: string;
  /** `existing` joins with the account that is signed in, `new` asks for a name and a password first. Default `existing`. */
  mode?: "existing" | "new";
  /**
   * Accepts the invite: with no argument in `existing` mode, with `{ name, password }` in `new` mode. Return the message to show when it did not work
   * ("This invite was already used.") or nothing when it did. While it runs both buttons are disabled and the main one is busy.
   */
  onAccept: (values?: InviteAcceptValues) => string | void | Promise<string | void>;
  /** Declines the invite, after a small confirmation. Leave it out and there is no decline button. */
  onDecline?: () => void | Promise<void>;
  /** The person is not the account that is signed in (`existing`), or already has an account (`new`). Leave it out for no such link. */
  onSwitchAccount?: () => void;
  /** The rules a new password must meet, ticked off live. Default: at least 12 characters, upper and lower case, a number or a symbol. */
  rules?: readonly PasswordRule[];
  /** The time the card counts from, for the server HTML, tests and previews. Leave it out and it reads the clock once, after the first paint. */
  now?: Date | string | number;
  /** The language of the dates and numbers. Default "en-US". */
  locale?: string;
  /** The time zone the expiry date is shown in. Default "UTC", so the server and the browser agree. */
  timeZone?: string;
  /** Start in a finished state, for a preview: the invite already joined or already declined. */
  defaultOutcome?: "joined" | "declined";
  /** Under the card's buttons: terms, a link to support. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: InviteAcceptCardLabels;
}

const DEFAULT_LABELS = {
  heading: "Join {workspace}",
  invitedBy: "{inviter} invited you as {role}",
  roleCan: "{role} can",
  memberOne: "{count} member",
  memberOther: "{count} members",
  validUntil: "Valid until {date}",
  expires: "Expires {when}",
  expiredOn: "Expired on {date}",
  expiredTitle: "This invite has expired",
  expiredBody: "Ask {inviter} to send you a new one.",
  joinAs: "Join as",
  notYou: "Not you?",
  join: "Join {workspace}",
  joined: "Joined",
  joinedSaid: "You joined {workspace}.",
  decline: "Decline",
  declineLink: "Decline invite",
  declineTitle: "Decline this invite?",
  declineBody: "You will not join {workspace}. {inviter} can send a new invite if you change your mind.",
  declineConfirm: "Decline invite",
  declinedTitle: "Invite declined",
  declinedBody: "You did not join {workspace}. {inviter} can send you a new invite whenever you change your mind.",
  email: "Email address",
  emailHint: "Your invite was sent to this address.",
  name: "Full name",
  nameMissing: "Enter your name.",
  password: "Password",
  passwordWeak: "Choose a password that meets every requirement.",
  create: "Create account and join",
  haveAccount: "Already have an account?",
  signIn: "Sign in",
  failed: "Something went wrong. Check your connection and try again.",
} satisfies Required<InviteAcceptCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A template whose placeholders become elements: "{inviter} invited you as {role}" with the first in bold and the second a chip. */
function Template({ template, parts }: { template: string; parts: Record<string, ReactNode> }) {
  return (
    <>
      {template.split(/(\{\w+\})/).map((piece, index) => {
        const key = /^\{(\w+)\}$/.exec(piece)?.[1];
        return <Fragment key={index}>{key !== undefined && key in parts ? parts[key] : piece}</Fragment>;
      })}
    </>
  );
}

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(address: string) {
  return (address.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [address]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

const toMs = (value: Date | string | number | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const ms = value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
};

/** "in 6 days", "tomorrow", "in 5 hours": the largest whole unit that fits, in the reader's language. */
function whenPhrase(left: number, locale: string): string {
  const phrase = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (left >= 86_400_000) return phrase.format(Math.floor(left / 86_400_000), "day");
  if (left >= 3_600_000) return phrase.format(Math.floor(left / 3_600_000), "hour");
  return phrase.format(Math.max(1, Math.floor(left / 60_000)), "minute");
}

// One column that may be narrower than its widest child, so a long workspace name wraps inside the card instead of stretching it.
const SHELL = "@container mx-auto grid w-full max-w-md grid-cols-1 gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8";

/** A button whose label carries a name of any length: it grows a line at a time instead of running past the card. */
const WRAPPING_LABEL = "h-auto min-h-11 min-w-0 py-2.5 text-balance whitespace-normal [overflow-wrap:anywhere]";

/** The look of a button that is busy or finished: it keeps its fill and does not react to the pointer, since pressing it does nothing. */
const SETTLED = "aria-busy:cursor-progress aria-busy:hover:bg-primary aria-busy:active:translate-y-0 aria-disabled:cursor-default aria-disabled:hover:bg-primary aria-disabled:active:translate-y-0";

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The role, in words, as a chip. With a summary it carries a small info mark and
 * a tooltip that lists what the role can do: on hover and focus, and also on a
 * tap, which a plain tooltip does not take. The same list is always in the page
 * for screen readers, so nothing depends on the tooltip opening.
 */
function RoleChip({ role, summary, heading }: { role: string; summary: readonly string[]; heading: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const chip = "inline-flex h-6 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 align-middle text-[0.8125rem] leading-none font-medium text-foreground";
  if (!summary.length) return <span className={chip}>{role}</span>;
  return (
    <>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-describedby={`${id}-summary`}
            onClick={(event) => {
              // A touch screen has no hover: a tap opens the tooltip and the next tap elsewhere closes it.
              event.preventDefault();
              setOpen(true);
            }}
            className={cn(chip, "cursor-help outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40")}
          >
            {role}
            <IconInfo aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" collisionPadding={16} className="w-64 px-3 py-2.5 text-[0.8125rem] leading-snug">
          <p className="font-medium">{heading}</p>
          <ul className="mt-1.5 grid gap-1.5">
            {summary.map((line, index) => (
              <li key={`${index}-${line}`} className="flex items-start gap-2">
                <IconCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
      <span id={`${id}-summary`} className="sr-only">
        {heading}: {summary.join(". ")}.
      </span>
    </>
  );
}

/**
 * The receiving end of a team invite, and the part new people see first. The
 * header names the workspace (its logo, or initials, with the inviter's face on
 * the corner), says who invited you and as what, and how many people are in and
 * how long the invite stays good. The role is stated in words and carries a
 * tooltip with what that role can do. In `existing` mode the signed-in address
 * joins with one press, with "Not you?" beside it; in `new` mode a short form
 * asks for a name and a password with its rules ticked off live. Decline asks a
 * small confirmation first, and both buttons stop working while either one is
 * busy; the one that was pressed keeps the focus, so a failed try is one press
 * away. Once joined the card is finished: the button stays a solid "Joined" and
 * nothing else in it works. An invite that has passed its date says so and tells
 * the person who to ask, instead of offering buttons that cannot work.
 */
export function InviteAcceptCard({
  workspace,
  inviter,
  role,
  roleSummary,
  expiresAt,
  email,
  mode = "existing",
  onAccept,
  onDecline,
  onSwitchAccount,
  rules = DEFAULT_PASSWORD_RULES,
  now,
  locale = "en-US",
  timeZone = "UTC",
  defaultOutcome,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: InviteAcceptCardProps) {
  const text: Required<InviteAcceptCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const nameField = useRef<HTMLInputElement>(null);
  const passwordField = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [problem, setProblem] = useState("");
  const [outcome, setOutcome] = useState<"joined" | "declined" | null>(defaultOutcome ?? null);
  const [said, setSaid] = useState({ id: 0, text: "" });
  const declinedNotice = useRef<HTMLDivElement>(null);
  // Joined is a finished state: the card stays on show as a receipt, but nothing in it works any more.
  const joined = outcome === "joined";

  // Declining swaps the buttons for a notice, so the notice takes the focus and is read out; never on the first paint.
  const wasDeclined = useRef(outcome === "declined");
  useEffect(() => {
    if (outcome === "declined" && !wasDeclined.current) declinedNotice.current?.focus();
    wasDeclined.current = outcome === "declined";
  }, [outcome]);

  // The clock is read once, after the first paint, so the server and the browser draw the same text first.
  const nowMs = toMs(now);
  const [clock, setClock] = useState<number | null>(nowMs ?? null);
  useEffect(() => {
    setClock(nowMs ?? Date.now());
  }, [nowMs]);

  const expiresMs = toMs(expiresAt);
  const expired = expiresMs !== undefined && clock !== null && expiresMs <= clock;
  const summary = typeof roleSummary === "string" ? [roleSummary] : (roleSummary ?? []);
  const values = { workspace: workspace.name, inviter: inviter.name, role };

  let dateText = "";
  if (expiresMs !== undefined) {
    const yearIn = (ms: number) => new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(ms);
    const sameYear = clock === null || yearIn(clock) === yearIn(expiresMs);
    dateText = new Intl.DateTimeFormat(locale, { timeZone, weekday: "short", day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) }).format(expiresMs);
  }

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  async function accept(accepted?: InviteAcceptValues) {
    if (working.current || joined) return;
    working.current = true;
    setBusy("accept");
    setProblem("");
    try {
      const result = await onAccept(accepted);
      if (typeof result === "string" && result) {
        setProblem(result);
        return;
      }
      setOutcome("joined");
      say(fill(text.joinedSaid, values));
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  // Never throws: the confirmation popover that runs it would leave an unhandled rejection behind.
  async function decline() {
    if (working.current || joined) return;
    working.current = true;
    setBusy("decline");
    setProblem("");
    try {
      await onDecline?.();
      setOutcome("declined");
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working.current || joined) return;
    const typedName = name.trim();
    const weak = rules.some((rule) => !rule.test(password));
    setNameError(typedName ? "" : text.nameMissing);
    setPasswordError(weak ? text.passwordWeak : "");
    if (!typedName) nameField.current?.focus();
    else if (weak) passwordField.current?.focus();
    else void accept({ name: typedName, password });
  }

  const initials = (label: string) => initialsOf(label) || "?";
  // Once the invite is joined or declined, how long it would have stayed good is no longer news.
  const showExpiry = expiresMs !== undefined && outcome === null;
  const header = (
    <div className="grid gap-5">
      {/* The initials are decoration: the heading and the line under it already name the workspace and the inviter. */}
      <div aria-hidden="true" className="relative w-fit">
        {/* The Avatar sets its size on a data attribute, so the override has to say the same to win. */}
        <Avatar className="rounded-xl ring-1 ring-border data-[size=default]:size-14">
          {workspace.logo ? <AvatarImage src={workspace.logo} alt="" className="rounded-xl" /> : null}
          <AvatarFallback className="rounded-xl text-lg tracking-[-0.02em] text-foreground">{initials(workspace.name)}</AvatarFallback>
        </Avatar>
        <Avatar size="sm" className="absolute -right-2.5 -bottom-2.5 ring-2 ring-card">
          {inviter.avatar ? <AvatarImage src={inviter.avatar} alt="" /> : null}
          <AvatarFallback>{initials(inviter.name)}</AvatarFallback>
        </Avatar>
      </div>
      <div className="grid gap-2">
        <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]">{fill(text.heading, values)}</Title>
        <p className="text-sm leading-7 text-muted-foreground">
          <Template
            template={text.invitedBy}
            parts={{ inviter: <strong className="font-medium text-foreground">{inviter.name}</strong>, role: <RoleChip role={role} summary={summary} heading={fill(text.roleCan, values)} /> }}
          />
        </p>
      </div>
      {workspace.members !== undefined || showExpiry ? (
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] leading-snug text-muted-foreground">
          {workspace.members !== undefined ? (
            <li className="flex items-center gap-2">
              <IconUsers aria-hidden="true" className="size-4 shrink-0" />
              <span className="tabular-nums">{fill(workspace.members === 1 ? text.memberOne : text.memberOther, { count: new Intl.NumberFormat(locale).format(workspace.members) })}</span>
            </li>
          ) : null}
          {showExpiry ? (
            <li className="flex items-center gap-2">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {clock === null ? fill(text.validUntil, { date: dateText }) : expired ? fill(text.expiredOn, { date: dateText }) : fill(text.expires, { when: whenPhrase(expiresMs - clock, locale) })}
                {clock !== null && !expired ? <span className="text-muted-foreground/80"> · {dateText}</span> : null}
              </span>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );

  // A button beside Join for an account that is ready, a quiet link under the form for someone who still has a form to fill in.
  const LINK = "rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50";
  const declineControl = onDecline ? (
    <ConfirmPopover title={text.declineTitle} description={fill(text.declineBody, values)} confirmLabel={text.declineConfirm} destructive={false} onConfirm={decline}>
      {mode === "new" ? (
        <button type="button" disabled={busy !== null || joined} className={cn(LINK, "text-muted-foreground hover:text-foreground")}>
          {text.declineLink}
        </button>
      ) : (
        <Button type="button" variant="outline" size="lg" disabled={busy !== null || joined} className="@xs:min-w-28">
          {text.decline}
        </Button>
      )}
    </ConfirmPopover>
  ) : null;

  let body: ReactNode;
  if (outcome === "declined") {
    body = (
      <Alert ref={declinedNotice} tabIndex={-1} tone="info" role="status" className="outline-none">
        <IconInfo />
        <AlertTitle>{text.declinedTitle}</AlertTitle>
        <AlertDescription>{fill(text.declinedBody, values)}</AlertDescription>
      </Alert>
    );
  } else if (expired) {
    body = (
      <Alert tone="info" role="status">
        <IconClock />
        <AlertTitle>{text.expiredTitle}</AlertTitle>
        <AlertDescription>
          {fill(text.expiredBody, values)}
          {inviter.email ? <span className="font-medium text-foreground [overflow-wrap:anywhere]">{breakable(inviter.email)}</span> : null}
        </AlertDescription>
      </Alert>
    );
  } else {
    body = (
      <>
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        {mode === "existing" ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 py-3 pr-2 pl-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar>
                  <AvatarFallback aria-hidden="true">{initials(email.split("@")[0]?.replace(/[._+-]+/g, " ") ?? "")}</AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 gap-0.5">
                  <span className="text-xs leading-snug text-muted-foreground">{text.joinAs}</span>
                  <span className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{breakable(email)}</span>
                </div>
              </div>
              {onSwitchAccount ? (
                <button type="button" disabled={busy !== null || joined} onClick={onSwitchAccount} className={cn(LINK, "mr-1 shrink-0 text-[0.8125rem] text-muted-foreground hover:text-foreground")}>
                  {text.notYou}
                </button>
              ) : null}
            </div>
            <div className="flex flex-col gap-2.5 @xs:flex-row">
              <Button
                type="button"
                size="lg"
                // aria-disabled and aria-busy, not disabled: a disabled button gives up the focus, and after a failed try or the finished "Joined" it stays where the person pressed it.
                aria-disabled={busy === "decline" || joined || undefined}
                aria-busy={busy === "accept" || undefined}
                onClick={() => void accept()}
                className={cn(WRAPPING_LABEL, SETTLED, "@xs:flex-1", busy === "decline" && "opacity-60")}
              >
                {busy === "accept" ? <IconSpinner /> : joined ? <IconCheck /> : null}
                {joined ? text.joined : fill(text.join, values)}
              </Button>
              {declineControl}
            </div>
          </div>
        ) : (
          <>
            <form noValidate aria-busy={busy === "accept" || undefined} onSubmit={createAccount} className="grid gap-5">
              <FormField described>
                <FormLabel>{text.email}</FormLabel>
                <FormControl>
                  <Input type="email" name="email" autoComplete="username" value={email} readOnly className="h-10 bg-muted/40 text-muted-foreground" />
                </FormControl>
                <FormDescription>{text.emailHint}</FormDescription>
              </FormField>

              <FormField error={nameError}>
                <FormLabel>{text.name}</FormLabel>
                <FormControl>
                  <Input
                    ref={nameField}
                    name="name"
                    autoComplete="name"
                    value={name}
                    readOnly={busy !== null || joined}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (nameError) setNameError("");
                    }}
                    // Once joined the fields read as locked, in the same quiet fill as the address above them.
                    className={cn("h-10", joined && "bg-muted/40 text-muted-foreground")}
                  />
                </FormControl>
              </FormField>

              {/* Not in a FormControl: the rules under the field are its description, and FormControl would replace that link. */}
              <div className="grid gap-2">
                <Label htmlFor={`${id}-password`} className={cn(passwordError && "text-destructive")}>
                  {text.password}
                </Label>
                <PasswordInput
                  ref={passwordField}
                  id={`${id}-password`}
                  name="new-password"
                  autoComplete="new-password"
                  rules={rules}
                  value={password}
                  readOnly={busy !== null || joined}
                  aria-invalid={passwordError ? true : undefined}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (passwordError && rules.every((rule) => rule.test(event.target.value))) setPasswordError("");
                  }}
                  className={cn("[&_input]:h-10", joined && "[&_input]:bg-muted/40 [&_input]:text-muted-foreground")}
                />
                <p role="status" className="text-xs font-medium text-destructive empty:hidden">
                  {passwordError}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                // aria-disabled and aria-busy, not disabled, so the button keeps the focus through a failed try and the finished "Joined".
                aria-disabled={busy === "decline" || joined || undefined}
                aria-busy={busy === "accept" || undefined}
                className={cn(WRAPPING_LABEL, SETTLED, "w-full", busy === "decline" && "opacity-60")}
              >
                {busy === "accept" ? <IconSpinner /> : joined ? <IconCheck /> : null}
                {joined ? text.joined : text.create}
              </Button>
            </form>

            {onSwitchAccount || declineControl ? (
              <div className="grid justify-items-center gap-2.5 text-center text-sm text-muted-foreground">
                {onSwitchAccount ? (
                  <p>
                    {text.haveAccount}{" "}
                    <button type="button" disabled={busy !== null || joined} onClick={onSwitchAccount} className={cn(LINK, "text-foreground")}>
                      {text.signIn}
                    </button>
                  </p>
                ) : null}
                {declineControl}
              </div>
            ) : null}
          </>
        )}
      </>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div data-slot="invite-accept-card" data-mode={mode} data-outcome={outcome ?? (expired ? "expired" : undefined)} className={cn(SHELL, className)} {...props}>
        {header}
        {body}
        {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
        <span role="status" className="sr-only">
          <span key={said.id}>{said.text}</span>
        </span>
      </div>
    </TooltipProvider>
  );
}
