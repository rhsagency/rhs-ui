"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconBan, IconClock, IconLock, IconMail, IconMoreHorizontal, IconSend, IconUserCheck, IconUserCircle, IconUserMinus, IconUserX } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** Where a person stands in the team. Each has its own word and mark, so none depends on colour. */
export type MemberStatus = "active" | "invited" | "suspended";

/** The person a row shows. */
export interface Member {
  /** A stable identity, passed back to your callbacks. */
  id: string;
  /** Their name. Someone who was only invited may have none yet: the row then leads with the email. */
  name?: string;
  /** Their email address. */
  email: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
  /** The `value` of their role, one of `roles`. */
  role: string;
  /** Default "active". */
  status?: MemberStatus;
  /** When the invite was sent. An invited member reads "Invited 3 days ago". */
  invitedAt?: DateInput;
  /** The owner's role is fixed and the row says why. Their destructive actions are left out as well. */
  owner?: boolean;
}

/** One role a member can have. */
export interface MemberRole {
  /** Stored on the member, passed to `onRoleChange`. */
  value: string;
  /** What the select calls it. */
  label: string;
  /** A second line under the label in the list: what the role can do. */
  description?: string;
}

/** One entry of the row's menu. */
export interface MemberRowAction {
  /** Passed to `onAction`. */
  id: string;
  /** What the entry says. */
  label: string;
  /** An icon element, drawn at 16px. */
  icon?: ReactNode;
  /** Red, set apart under a rule, and left out of the menu on your own row and the owner's. */
  destructive?: boolean;
  /** Greyed out and skipped by the keyboard. */
  disabled?: boolean;
}

/** The words the row uses, for translation. `{name}`, `{role}` and `{time}` are filled in. */
export interface MemberRowLabels {
  /** The tag on your own row. Default "You". */
  you?: string;
  /** The word for an active member. Default "Active". */
  active?: string;
  /** The word for an invited one. Default "Invited". */
  invited?: string;
  /** The word for a suspended one. Default "Suspended". */
  suspended?: string;
  /** Under an invited member, with `{time}` as "3 days ago". Default "Invited {time}". */
  invitedAgo?: string;
  /** What an invite under a minute old is called. Default "just now". */
  justNow?: string;
  /** The select's accessible name. Default "Role for {name}". */
  role?: string;
  /** Said when a role changed. Default "{name}'s role is now {role}." */
  roleChanged?: string;
  /** Shown and said when a role change was refused. Default "Could not change the role of {name}. Nothing was changed." */
  roleFailed?: string;
  /** The owner's role when `roles` has no entry for it. Default "Owner". */
  owner?: string;
  /** Why the owner's role is fixed. Default "The owner's role cannot be changed. Transfer ownership instead." */
  ownerReason?: string;
  /** The menu button's name. Default "Actions for {name}". */
  actions?: string;
  /** The menu entry that opens a profile. Default "View profile". */
  profile?: string;
  /** The entry that sends an invite again. Default "Resend invite". */
  resend?: string;
  /** The entry that cancels an invite. Default "Revoke invite". */
  revoke?: string;
  /** The entry that stops someone signing in. Default "Suspend access". */
  suspend?: string;
  /** The entry that lets a suspended person back in. Default "Restore access". */
  restore?: string;
  /** The entry that takes someone out of the team. Default "Remove from team". */
  remove?: string;
}

export interface MemberRowProps extends Omit<ComponentProps<"li">, "children"> {
  /** The person to show. */
  member: Member;
  /** The roles the select offers. */
  roles: readonly MemberRole[];
  /**
   * A new role was chosen. Save it and update `member.role`. Return a promise and the select shows the choice while it
   * runs; if it rejects, the select goes back and the row says so. The change is announced as soon as the handler
   * resolves, so by then `member.role` must be updated, or the select and the announcement disagree. Leave it out and
   * the role is plain text.
   */
  onRoleChange?: (role: string, member: Member) => void | Promise<void>;
  /** A menu entry was chosen. A destructive one only reports: ask first, in your own dialog. */
  onAction?: (action: string, member: Member) => void;
  /** This row is the signed-in person: it carries a "You" tag and loses its destructive actions. */
  isYou?: boolean;
  /** Stops every control, for a row that is saving or that the viewer may not change. The text stays readable. */
  disabled?: boolean;
  /** Your own menu entries instead of the ones that fit the member's status. */
  actions?: readonly MemberRowAction[];
  /** The moment "Invited 3 days ago" is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the invite date is written in before the clock is known, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the row uses, for translation. */
  labels?: MemberRowLabels;
}

const DEFAULT_LABELS = {
  you: "You",
  active: "Active",
  invited: "Invited",
  suspended: "Suspended",
  invitedAgo: "Invited {time}",
  justNow: "just now",
  role: "Role for {name}",
  roleChanged: "{name}'s role is now {role}.",
  roleFailed: "Could not change the role of {name}. Nothing was changed.",
  owner: "Owner",
  ownerReason: "The owner's role cannot be changed. Transfer ownership instead.",
  actions: "Actions for {name}",
  profile: "View profile",
  resend: "Resend invite",
  revoke: "Revoke invite",
  suspend: "Suspend access",
  restore: "Restore access",
  remove: "Remove from team",
} satisfies Required<MemberRowLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "3 days ago", "yesterday", "2 weeks ago": the age of a moment in the reader's language. Under a minute it says `justNow`. */
function ageIn(at: number, now: number, locale: string, justNow: string): string {
  const diff = at - now;
  const unit = UNITS.find(([, size]) => Math.abs(diff) >= size);
  if (!unit) return justNow;
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  // From a day up the count is rounded: 13.9 days is "2 weeks ago", 47 hours "2 days ago". Minutes and hours are cut, so 59.6 minutes never reads "60 minutes".
  const count = unit[1] >= 86_400_000 ? Math.round(diff / unit[1]) : Math.trunc(diff / unit[1]);
  return words.format(count, unit[0]);
}

/** A date in the zone, for the server render and the tooltip. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

const STATUS_MARK: Record<MemberStatus, ReactNode> = {
  active: <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />,
  invited: <IconClock />,
  suspended: <IconBan />,
};

/**
 * The row of a team page: who someone is, what they may do and where they
 * stand. The role is the house select, quiet until you reach for it, and a
 * change is said out loud ("Sofia Rossi's role is now Admin."), with a refused
 * one put back and explained. An invited person reads "Invited 3 days ago" with
 * Resend and Revoke in the menu, a suspended one can be restored, your own row
 * carries "You" and never offers to remove you, and the owner's role is fixed
 * with the reason beside it: a tooltip on a wide row with a pointer, plain
 * text on a narrow one and on a touch screen. The row reads its own width, so
 * on a phone it folds into two lines, person and menu above, role and status
 * below. Put the rows in a `ul`.
 */
export function MemberRow({
  member,
  roles,
  onRoleChange,
  onAction,
  isYou = false,
  disabled = false,
  actions,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: MemberRowProps) {
  const text: Required<MemberRowLabels> = { ...DEFAULT_LABELS, ...labels };
  const reasonId = useId();
  const timer = useRef<number | undefined>(undefined);
  const [choice, setChoice] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("");

  const status = member.status ?? "active";
  const invited = status === "invited";
  const named = Boolean(member.name?.trim());
  const name = named ? (member.name as string) : member.email;
  const clock = useNow(now, invited && member.invitedAt !== undefined);
  const sentAt = member.invitedAt === undefined ? Number.NaN : new Date(member.invitedAt).getTime();
  const sent = Number.isNaN(sentAt) ? null : sentAt;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const roleLabel = (value: string) => roles.find((role) => role.value === value)?.label ?? (member.owner ? text.owner : value);

  async function changeRole(next: string) {
    if (choice !== null || next === member.role || !onRoleChange) return;
    setFailed(false);
    setChoice(next);
    try {
      await onRoleChange(next, member);
      setSaid(fill(text.roleChanged, { name, role: roleLabel(next) }));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setSaid(""), 4000);
    } catch {
      // The alert below says it; the select goes back to the role it had.
      setFailed(true);
    } finally {
      setChoice(null);
    }
  }

  // What the menu offers. An action that could lock out the signed-in person or the owner is left out, whoever wrote the list.
  const protectedRow = isYou || Boolean(member.owner);
  const defaults: MemberRowAction[] = invited
    ? [
        { id: "resend", label: text.resend, icon: <IconSend /> },
        { id: "revoke", label: text.revoke, icon: <IconUserX />, destructive: true },
      ]
    : [
        { id: "profile", label: text.profile, icon: <IconUserCircle /> },
        status === "suspended" ? { id: "restore", label: text.restore, icon: <IconUserCheck /> } : { id: "suspend", label: text.suspend, icon: <IconBan /> },
        { id: "remove", label: text.remove, icon: <IconUserMinus />, destructive: true },
      ];
  const entries = (actions ?? defaults).filter((action) => !(protectedRow && (action.destructive || (actions === undefined && action.id === "suspend"))));
  const plain = entries.filter((action) => !action.destructive);
  const danger = entries.filter((action) => action.destructive);

  // The email gives way first when the line is short: the words about the invite stay whole. Below 26rem there is no room for both on one line, so the invite words get a line of their own and the address stays readable.
  let secondary: ReactNode = <span className="truncate">{member.email}</span>;
  if (invited) {
    const [before = "", after = ""] = text.invitedAgo.split("{time}");
    const phrase =
      sent === null ? (
        text.invited
      ) : (
        <>
          {before}
          <time dateTime={new Date(sent).toISOString()} title={dateIn(sent, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning className="tabular-nums">
            {clock === null ? dateIn(sent, locale, timeZone, { day: "numeric", month: "short" }) : ageIn(sent, clock, locale, text.justNow)}
          </time>
          {after}
        </>
      );
    secondary = named ? (
      <>
        <span className="truncate">{member.email}</span>
        <span className="shrink-0 whitespace-pre">
          <span aria-hidden="true" className="@max-[26rem]:hidden">
            {" · "}
          </span>
          <span className="sr-only">. </span>
          {phrase}
        </span>
      </>
    ) : (
      <span className="truncate">{phrase}</span>
    );
  }

  const roleControl = member.owner ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-describedby={reasonId}
          className="-ms-2 inline-flex h-8 max-w-48 cursor-help items-center gap-1.5 rounded-md px-2 text-[0.8125rem] font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <IconLock className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{roleLabel(member.role)}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-64 text-pretty">
        {text.ownerReason}
      </TooltipContent>
    </Tooltip>
  ) : onRoleChange ? (
    <Select value={choice ?? member.role} onValueChange={(value) => void changeRole(value)} disabled={disabled}>
      <SelectTrigger
        size="sm"
        aria-label={fill(text.role, { name })}
        className="-ms-2 w-fit max-w-48 justify-start gap-1.5 border-transparent bg-transparent px-2 font-medium shadow-none hover:border-border hover:bg-muted data-[state=open]:border-border data-[state=open]:bg-muted"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-60">
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value} description={role.description}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <span className="inline-flex h-8 items-center text-[0.8125rem] font-medium">{roleLabel(member.role)}</span>
  );

  return (
    <li data-slot="member-row" data-status={status} aria-busy={choice ? true : undefined} className={cn("@container relative", className)} {...props}>
      <TooltipProvider>
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 @xl:grid-cols-[auto_minmax(0,1fr)_11rem_7.5rem_auto] @xl:gap-x-4">
          <Avatar aria-hidden="true" className="col-start-1 row-start-1 data-[size=default]:size-10">
            {member.image ? <AvatarImage src={member.image} alt="" /> : null}
            <AvatarFallback className={cn(!named && "border border-dashed border-muted-foreground/50 bg-background")}>
              {named ? initialsOf(name) : <IconMail className="size-4 text-muted-foreground" />}
            </AvatarFallback>
          </Avatar>

          <div className="col-start-2 row-start-1 min-w-0">
            <p className="flex min-w-0 items-center gap-2">
              <span className={cn("truncate text-sm font-medium tracking-[-0.01em]", status === "suspended" && "text-muted-foreground")}>{name}</span>
              {isYou ? (
                <Badge variant="outline" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                  {text.you}
                </Badge>
              ) : null}
            </p>
            <p className="flex min-w-0 flex-col text-[0.8125rem] leading-5 text-muted-foreground @min-[26rem]:flex-row">{secondary}</p>
          </div>

          <div className="col-span-2 col-start-2 row-start-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 @xl:contents">
            <div className="flex min-w-0 items-center @xl:col-start-3 @xl:row-start-1">{roleControl}</div>
            <div className="ms-auto flex shrink-0 items-center @xl:col-start-4 @xl:row-start-1 @xl:ms-0">
              <Badge variant={status === "suspended" ? "muted" : "outline"} className={cn("gap-1.5", invited && "border-dashed border-muted-foreground/50 text-muted-foreground")}>
                {STATUS_MARK[status]}
                {text[status]}
              </Badge>
            </div>
            {/* Plain text where the tooltip cannot be reached: on a narrow row, and on a wide one when there is no hover (a touch screen). Screen readers get the reason from the lock button's description. */}
            {member.owner ? (
              <p aria-hidden="true" className="basis-full text-xs text-muted-foreground @xl:col-span-3 @xl:col-start-2 @xl:row-start-2 @xl:[@media(hover:hover)]:hidden">
                {text.ownerReason}
              </p>
            ) : null}
          </div>
          {member.owner ? (
            <span id={reasonId} className="sr-only">
              {text.ownerReason}
            </span>
          ) : null}

          {entries.length ? (
            <div className="col-start-3 row-start-1 -me-1.5 @xl:col-start-5">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label={fill(text.actions, { name })} className="text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground">
                    <IconMoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {plain.map((action) => (
                    <DropdownMenuItem key={action.id} disabled={action.disabled} onSelect={() => onAction?.(action.id, member)}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {danger.length && plain.length ? <DropdownMenuSeparator /> : null}
                  {danger.map((action) => (
                    <DropdownMenuItem key={action.id} variant="destructive" disabled={action.disabled} onSelect={() => onAction?.(action.id, member)}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <span aria-hidden="true" className="col-start-3 row-start-1 -me-1.5 size-8 @xl:col-start-5" />
          )}

          {failed ? (
            <p role="alert" className="col-span-2 col-start-2 row-start-3 flex items-start gap-1.5 text-xs font-medium text-destructive motion-safe:animate-rhs-in @xl:col-span-4">
              <IconAlertCircle className="mt-px size-3.5 shrink-0" />
              {fill(text.roleFailed, { name })}
            </p>
          ) : null}
        </div>
      </TooltipProvider>
      <p role="status" className="sr-only">
        {said}
      </p>
    </li>
  );
}
