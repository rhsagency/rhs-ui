"use client";

import { Fragment, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconBadgeCheck, IconCheck, IconEdit, IconEye, IconLock, IconWarning } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { Separator } from "@rhs-ui/primitives/separator";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** The app that is asking for access. */
export interface AuthorizeApp {
  /** Its name: "Kestrel Analytics". */
  name: string;
  /** Who makes it: "Kestrel Labs". Shown as "by Kestrel Labs". */
  publisher?: string;
  /** Whether you have checked who is behind it. It is said in words, "Verified" or "Unverified", with an icon; an unverified app also gets a warning. Default false. */
  verified?: boolean;
  /** Your own drawing of its icon, inside the tile. Without one the tile shows the logo or the initials. */
  icon?: ReactNode;
  /** Its logo, as an image address. */
  logo?: string;
}

/** The person who is signed in and would be giving access. */
export interface AuthorizeAccount {
  /** The address they are signed in with. */
  email: string;
  /** Their name, shown above the address. Without one the address stands alone. */
  name?: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  avatar?: string;
}

/** One permission the app asks for. */
export interface AuthorizeScope {
  /** A stable identity, handed to `onAllow`: "projects.read". */
  id: string;
  /** The permission in a few plain words: "Your project list". */
  label: string;
  /** What it means in one line, without jargon: "The names, owners and status of the projects you can see". */
  description: string;
  /** `read` only looks; `write` changes things. They are listed in two groups, and a write scope carries the word as well as an icon. */
  access: "read" | "write";
  /** An app that cannot work without it. It shows a lock and the word "Required" instead of a checkbox and is always granted. */
  required?: boolean;
}

/** The words the card uses, for translation. `{app}`, `{publisher}`, `{host}`, `{granted}` and `{total}` are filled in. */
export interface AuthorizeAppCardLabels {
  /** The heading. Default "{app} wants access to your account". */
  heading?: string;
  /** Under the heading, beside the app's status. Default "by {publisher}". */
  publisher?: string;
  /** For an app you have checked. Default "Verified". */
  verified?: string;
  /** For one you have not. Default "Unverified". */
  unverified?: string;
  /** The heading of the warning about an unverified app. Default "This app has not been verified". */
  unverifiedTitle?: string;
  /** The line under it. Default "Only continue if you trust it. It will be able to do everything you allow below.". */
  unverifiedBody?: string;
  /** Above the signed-in address. Default "Signed in as". */
  signedInAs?: string;
  /** The link to another account. Default "Not you?". */
  notYou?: string;
  /** The heading above the permissions. Default "{app} will be able to".  */
  permissions?: string;
  /** How many are on, to the right of that heading. Default "{granted} of {total} allowed". */
  counter?: string;
  /** The heading of the group that only looks. Default "Read". */
  read?: string;
  /** What it means. Default "See your information". */
  readHint?: string;
  /** The heading of the group that changes things. Default "Write". */
  write?: string;
  /** What it means. Default "Make changes for you". */
  writeHint?: string;
  /** The mark on a permission that cannot be turned off. Default "Required". */
  required?: string;
  /** The badge on each write permission. Default "Write". */
  writeBadge?: string;
  /** Where the person is sent next; `{host}` is the address. Default "You will be sent to {host} after you choose.". */
  redirect?: string;
  /** What they can do later. Default "You can remove this app's access at any time in your settings.". */
  revoke?: string;
  /** The button that refuses. Default "Deny". */
  deny?: string;
  /** The button that agrees. Default "Allow". */
  allow?: string;
  /** The agree button once it worked. Default "Allowed". */
  allowed?: string;
  /** The refuse button once it worked. Default "Denied". */
  denied?: string;
  /** Above the buttons when `onAllow` or `onDeny` threw. Default "Something went wrong and nothing was shared. Try again.". */
  failed?: string;
}

export interface AuthorizeAppCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The app that is asking: its name, who makes it, and whether it is verified. */
  app: AuthorizeApp;
  /** The signed-in account that would give the access. */
  account: AuthorizeAccount;
  /** What the app asks for, each in plain words with a line on what it means. Read scopes and write scopes are listed in their own groups. */
  scopes: readonly AuthorizeScope[];
  /**
   * Agree. It receives the ids of everything granted: the required scopes and the optional ones that are still ticked. Return a promise and both
   * buttons wait until it settles; a rejection shows a message and nothing is lost. This is where you finish the OAuth redirect.
   */
  onAllow: (grantedScopeIds: string[]) => void | Promise<void>;
  /** Refuse. A button of the same size as Allow, never a text link. This is where you send the person back with an access_denied error. */
  onDeny: () => void | Promise<void>;
  /** Where the person is sent once they choose, as the host only: "kestrel.app". */
  redirectHost: string;
  /** The person is not the account that is signed in. Leave it out for no "Not you?" link. */
  onSwitchAccount?: () => void;
  /** The optional scopes that start ticked, by id. Default all of them: the app asked for them, and each can be turned off. */
  defaultGranted?: readonly string[];
  /** Under the card's buttons: terms, a link to the app's privacy policy. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: AuthorizeAppCardLabels;
}

const DEFAULT_LABELS = {
  heading: "{app} wants access to your account",
  publisher: "by {publisher}",
  verified: "Verified",
  unverified: "Unverified",
  unverifiedTitle: "This app has not been verified",
  unverifiedBody: "Only continue if you trust it. It will be able to do everything you allow below.",
  signedInAs: "Signed in as",
  notYou: "Not you?",
  permissions: "{app} will be able to",
  counter: "{granted} of {total} allowed",
  read: "Read",
  readHint: "See your information",
  write: "Write",
  writeHint: "Make changes for you",
  required: "Required",
  writeBadge: "Write",
  redirect: "You will be sent to {host} after you choose.",
  revoke: "You can remove this app's access at any time in your settings.",
  deny: "Deny",
  allow: "Allow",
  allowed: "Allowed",
  denied: "Denied",
  failed: "Something went wrong and nothing was shared. Try again.",
} satisfies Required<AuthorizeAppCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** Lets a long address wrap after "@", "." and "-" rather than in the middle of a word. */
function breakable(address: string) {
  return (address.match(/[^@.\-_]*[@.\-_]|[^@.\-_]+/g) ?? [address]).map((part, index) => (
    <Fragment key={index}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/**
 * The OAuth consent screen, written so that someone can actually decide. It
 * shows who is asking (a tile, the name, the publisher, and "Verified" or
 * "Unverified" in words, with a warning for the second), which account would
 * give the access, with "Not you?" beside it, and what is being asked for in
 * plain language, in a group that only reads and a group that writes. Optional
 * permissions have a checkbox, required ones a lock and the word "Required"; a
 * write permission carries the word as well as an icon. Deny is a button of the
 * same size as Allow, never a text link, and the tab order runs through the
 * permissions, then Deny, then Allow. A line at the end says where the person
 * will be sent and that access can be taken back in settings.
 */
export function AuthorizeAppCard({
  app,
  account,
  scopes,
  onAllow,
  onDeny,
  redirectHost,
  onSwitchAccount,
  defaultGranted,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: AuthorizeAppCardProps) {
  const text: Required<AuthorizeAppCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  // One level under the title, so the outline never skips a step whichever element the title is.
  const Sub = Title === "h1" ? "h2" : Title === "h2" ? "h3" : "h4";
  const working = useRef(false);
  // What the person has turned off; anything new starts on, and a required scope can never be in here.
  const [off, setOff] = useState<ReadonlySet<string>>(() => new Set(defaultGranted ? scopes.filter((scope) => !scope.required && !defaultGranted.includes(scope.id)).map((scope) => scope.id) : []));
  const [busy, setBusy] = useState<"allow" | "deny" | null>(null);
  const [outcome, setOutcome] = useState<"allowed" | "denied" | null>(null);
  const [problem, setProblem] = useState("");

  const isOn = (scope: AuthorizeScope) => scope.required === true || !off.has(scope.id);
  const granted = scopes.filter(isOn);
  const values = { app: app.name, publisher: app.publisher ?? "", host: redirectHost, granted: String(granted.length), total: String(scopes.length) };

  function toggle(scope: AuthorizeScope, on: boolean) {
    setOff((previous) => {
      const next = new Set(previous);
      if (on) next.delete(scope.id);
      else next.add(scope.id);
      return next;
    });
  }

  async function decide(kind: "allow" | "deny") {
    if (working.current || outcome) return;
    working.current = true;
    setBusy(kind);
    setProblem("");
    try {
      if (kind === "allow") await onAllow(granted.map((scope) => scope.id));
      else await onDeny();
      setOutcome(kind === "allow" ? "allowed" : "denied");
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  const groups = [
    { access: "read" as const, title: text.read, hint: text.readHint, icon: <IconEye /> },
    { access: "write" as const, title: text.write, hint: text.writeHint, icon: <IconEdit /> },
  ]
    .map((group) => ({ ...group, items: scopes.filter((scope) => scope.access === group.access) }))
    .filter((group) => group.items.length > 0);

  const locked = busy !== null || outcome !== null;
  // The button that was pressed keeps its look (busy, then done); the other one steps back. Neither does anything more while the first works.
  const stateOf = (kind: "allow" | "deny") => (busy === kind ? "busy" : outcome === (kind === "allow" ? "allowed" : "denied") ? "done" : locked ? "locked" : "idle");
  const [beforeHost = "", afterHost = ""] = text.redirect.split("{host}");

  return (
    <div
      data-slot="authorize-app-card"
      data-outcome={outcome ?? undefined}
      className={cn("@container mx-auto grid w-full max-w-lg gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)}
      {...props}
    >
      <div className="grid gap-5">
        <div aria-hidden="true" className="flex items-center gap-3">
          <Avatar className="rounded-xl ring-1 ring-border data-[size=default]:size-14">
            {app.logo ? <AvatarImage src={app.logo} alt="" className="rounded-xl" /> : null}
            <AvatarFallback className="rounded-xl bg-primary text-lg tracking-[-0.02em] text-primary-foreground [&_svg]:size-6">{app.icon ?? (initialsOf(app.name) || "?")}</AvatarFallback>
          </Avatar>
          <span className="h-px max-w-24 flex-1 border-t border-dashed border-muted-foreground/50" />
          <Avatar className="data-[size=default]:size-14">
            {account.avatar ? <AvatarImage src={account.avatar} alt="" /> : null}
            <AvatarFallback className="text-base">{initialsOf(account.name ?? account.email.split("@")[0]?.replace(/[._+-]+/g, " ") ?? "") || "?"}</AvatarFallback>
          </Avatar>
        </div>

        <div className="grid gap-2.5">
          <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{fill(text.heading, values)}</Title>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-muted-foreground">
            {app.publisher ? <span>{fill(text.publisher, values)}</span> : null}
            {app.verified ? (
              <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-[0.8125rem] text-foreground [&>svg]:size-3.5">
                <IconBadgeCheck />
                {text.verified}
              </Badge>
            ) : (
              <Badge className="h-6 gap-1.5 px-2.5 text-[0.8125rem] font-semibold [&>svg]:size-3.5">
                <IconWarning />
                {text.unverified}
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* A warning in the card's own greys: the icon, the black "Unverified" pill and the words carry it, so no colour is needed (and a consumer's theme has none). */}
      {app.verified ? null : (
        <Alert tone="info" role="note" className="border-foreground/30 [&>svg]:text-foreground">
          <IconWarning />
          <AlertTitle>{text.unverifiedTitle}</AlertTitle>
          <AlertDescription>{text.unverifiedBody}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 py-3 pr-2 pl-3">
        <div className="grid min-w-0 gap-0.5">
          <span className="text-xs leading-snug text-muted-foreground">{text.signedInAs}</span>
          <span className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{breakable(account.email)}</span>
        </div>
        {onSwitchAccount ? (
          <button
            type="button"
            disabled={locked}
            onClick={onSwitchAccount}
            className="mr-1 shrink-0 rounded-sm text-[0.8125rem] font-medium text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
          >
            {text.notYou}
          </button>
        ) : null}
      </div>

      <div className="grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <Sub className="text-sm leading-snug font-medium">{fill(text.permissions, values)}</Sub>
          <p role="status" className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {fill(text.counter, values)}
          </p>
        </div>

        {groups.map((group) => {
          const headingId = `${id}-${group.access}`;
          return (
            <div key={group.access} role="group" aria-labelledby={headingId} className="overflow-hidden rounded-lg border border-border">
              <div className="flex items-center gap-2.5 border-b border-border bg-muted/50 px-4 py-2.5">
                <span aria-hidden="true" className="text-foreground [&_svg]:size-4">
                  {group.icon}
                </span>
                <p id={headingId} className="text-sm leading-snug font-medium">
                  {group.title}
                </p>
                <p className="text-xs leading-snug text-muted-foreground">{group.hint}</p>
              </div>
              <ul className="divide-y divide-border">
                {group.items.map((scope) => {
                  const labelId = `${headingId}-${scope.id.replace(/\W+/g, "-")}`;
                  return (
                    <li key={scope.id} className={cn("relative flex items-start gap-3.5 px-4 py-3.5", !scope.required && "transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none")}>
                      <span className="mt-px grid size-[18px] shrink-0 place-items-center">
                        {scope.required ? (
                          <IconLock aria-hidden="true" className="size-4 text-muted-foreground" />
                        ) : (
                          <Checkbox id={labelId} checked={isOn(scope)} disabled={locked} aria-describedby={`${labelId}-hint`} onCheckedChange={(checked) => toggle(scope, checked === true)} />
                        )}
                      </span>
                      <div className="grid min-w-0 flex-1 gap-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {scope.required ? (
                            <span className="text-sm leading-snug font-medium">{scope.label}</span>
                          ) : (
                            // The label stretches over the whole row, so a tap anywhere on it ticks the box; the box alone shows the focus.
                            <Label htmlFor={labelId} className="text-sm leading-snug after:absolute after:inset-0">
                              {scope.label}
                            </Label>
                          )}
                          {scope.required ? (
                            <Badge variant="muted" className="h-5 gap-1 px-1.5 text-[0.6875rem]">
                              {text.required}
                            </Badge>
                          ) : null}
                          {scope.access === "write" ? (
                            <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[0.6875rem] text-foreground">
                              <IconEdit />
                              {text.writeBadge}
                            </Badge>
                          ) : null}
                        </div>
                        <p id={`${labelId}-hint`} className="text-[0.8125rem] leading-snug text-muted-foreground">
                          {scope.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4">
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        {/* Two filled buttons of one size: refusing is as visible and as easy as agreeing, and it is the first of the two in the tab order. */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            data-state={stateOf("deny")}
            aria-disabled={stateOf("deny") === "locked" || undefined}
            aria-busy={busy === "deny" || undefined}
            onClick={() => void decide("deny")}
            className="data-[state=busy]:cursor-progress data-[state=done]:cursor-default data-[state=locked]:cursor-default data-[state=locked]:opacity-60 data-[state=locked]:hover:bg-secondary"
          >
            {busy === "deny" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : outcome === "denied" ? <IconCheck /> : null}
            {outcome === "denied" ? text.denied : text.deny}
          </Button>
          <Button
            type="button"
            size="lg"
            data-state={stateOf("allow")}
            aria-disabled={stateOf("allow") === "locked" || undefined}
            aria-busy={busy === "allow" || undefined}
            onClick={() => void decide("allow")}
            className="data-[state=busy]:cursor-progress data-[state=done]:cursor-default data-[state=locked]:cursor-default data-[state=locked]:opacity-60 data-[state=locked]:hover:bg-primary"
          >
            {busy === "allow" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : outcome === "allowed" ? <IconCheck /> : null}
            {outcome === "allowed" ? text.allowed : text.allow}
          </Button>
        </div>

        <Separator />

        <p className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
          <IconArrowUpRight aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            {beforeHost}
            <strong className="font-medium text-foreground [overflow-wrap:anywhere]">{redirectHost}</strong>
            {afterHost} {text.revoke}
          </span>
        </p>
      </div>

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
