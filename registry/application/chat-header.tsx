"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowLeft, IconBellOff, IconMoreHorizontal } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { IconButton, IconButtonProvider } from "@rhs-ui/primitives/icon-button";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** One person in a group, for the mosaic that stands in for a group picture. */
export interface ChatMember {
  /** Their name: the first letter stands in while a picture loads, or when there is none. */
  name: string;
  /** A picture. */
  image?: string;
}

/** The conversation the header introduces. */
export interface ChatConversation {
  /** A stable identity. When it changes, the status is read as a new conversation and not announced as a change. */
  id: string;
  /** The person's name, or the group's. */
  name: string;
  /** A picture. A group without one is drawn as a mosaic of its members. */
  image?: string;
  /** A group chat: the status line counts members instead of showing presence. */
  group?: boolean;
  /** The people in a group. Up to four are drawn in the mosaic, and the count defaults to how many there are. */
  members?: readonly ChatMember[];
  /** How many people are in the group, when the list above is only the first few. */
  memberCount?: number;
  /** How many of them are online right now. */
  onlineCount?: number;
  /** Notifications are off: a bell with a line through it and the word "Muted" join the status line. */
  muted?: boolean;
}

/** Where a person stands: active now, away, or gone offline (with when they were last seen). */
export interface ChatPresence {
  /** Where the person stands: online, away or offline. */
  state: "online" | "away" | "offline";
  /** When an offline person was last active. */
  lastSeenAt?: DateInput;
}

/** One button at the end of the bar: call, search, info. */
export interface ChatHeaderAction {
  /** A stable identity. */
  id: string;
  /** What it does. It is the button's name, its tooltip and its line in the overflow menu. */
  label: string;
  /** An icon element, drawn at 16px. */
  icon: ReactNode;
  /** Pressed. */
  onSelect?: () => void;
  /** Greyed out and skipped by the keyboard. */
  disabled?: boolean;
}

/** The words the bar uses, for translation. `{name}` and `{time}` are filled in. */
export interface ChatHeaderLabels {
  /** Under a person who is online. Default "Active now". */
  online?: string;
  /** Under a person who is away. Default "Away". */
  away?: string;
  /** Under an offline person with no last-seen time. Default "Offline". */
  offline?: string;
  /** Under an offline person, with `{time}`: "14:02" today, "yesterday", "Mon" or "12 Oct". Default "Last seen {time}". */
  lastSeen?: string;
  /** The group count. `{count}` is filled in. Default "{count} members". */
  members?: string;
  /** Added when someone in the group is online. `{count}` is filled in. Default "{count} online". */
  groupOnline?: string;
  /** The word beside the bell with a line through it. Default "Muted". */
  muted?: string;
  /** The name of the identity button. Default "Open info for {name}". */
  openInfo?: string;
  /** The name of the back button. Default "Back to conversations". */
  back?: string;
  /** The overflow button's name. Default "More actions". */
  more?: string;
  /** Said when the status changes. Default "{name}: {status}". */
  statusChanged?: string;
}

export interface ChatHeaderProps extends Omit<ComponentProps<"div">, "children"> {
  /** The conversation the bar is above. */
  conversation: ChatConversation;
  /** A person's presence, for a direct chat. A group needs none: it counts its members. */
  presence?: ChatPresence;
  /** A line of your own in place of the one worked out from the presence or the members: "Typing…", "Recording a voice message". */
  status?: string;
  /** The buttons at the end, in order of importance: voice call, video call, search, info. Those that do not fit move into a menu. */
  actions?: readonly ChatHeaderAction[];
  /** How many actions stay in the bar on a wide screen. The rest go in the "More" menu; a narrow bar keeps two and a very narrow one keeps one. Default 3. */
  maxInline?: number;
  /** The back button was pressed. It appears on a narrow screen only, where the thread fills the page. Leave it out for no button. */
  onBack?: () => void;
  /** The avatar and name were pressed. They are one button that opens the info panel. Leave it out and they are plain text. */
  onOpenInfo?: () => void;
  /** The moment "Last seen" is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the times. Default "en-US". */
  locale?: string;
  /** The time zone the times are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the bar uses, for translation. */
  labels?: ChatHeaderLabels;
}

const DEFAULT_LABELS = {
  online: "Active now",
  away: "Away",
  offline: "Offline",
  lastSeen: "Last seen {time}",
  members: "{count} members",
  groupOnline: "{count} online",
  muted: "Muted",
  openInfo: "Open info for {name}",
  back: "Back to conversations",
  more: "More actions",
  statusChanged: "{name}: {status}",
} satisfies Required<ChatHeaderLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** The calendar day in the zone as a whole number: equal numbers are the same day, numbers one apart are neighbours. */
function dayNumber(at: number, timeZone: string): number {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  } catch {
    parts = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  }
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? 0);
  return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000);
}

/** Hour and minute the way the locale writes them: two digits in a 24-hour locale, so 09:10 lines up with 14:32. */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric", timeZone: "UTC" }).resolvedOptions().hourCycle;
    return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
  } catch {
    return { hour: "numeric", minute: "2-digit" };
  }
}

/** When someone was last seen, short: "14:02" today, "yesterday", "Mon" within the week, "12 Oct" before that. */
function lastSeenIn(at: number, now: number, locale: string, timeZone: string): string {
  const apart = dayNumber(now, timeZone) - dayNumber(at, timeZone);
  if (apart <= 0) return dateIn(at, locale, timeZone, clockOptions(locale));
  if (apart === 1) {
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day");
    } catch {
      return "yesterday";
    }
  }
  if (apart < 7) return dateIn(at, locale, timeZone, { weekday: "short" });
  return dateIn(at, locale, timeZone, { day: "numeric", month: "short" });
}

/** The browser's clock, read once the page is live and again only when the time it measures changes. Null on the server and before hydration, so both write the same text. */
function useClock(fixed: DateInput | undefined, measured: number): number | null {
  const [read, setRead] = useState<number | null>(null);
  useEffect(() => {
    if (fixed === undefined) setRead(Date.now());
  }, [fixed, measured]);
  if (fixed !== undefined) {
    const value = new Date(fixed).getTime();
    if (!Number.isNaN(value)) return value;
  }
  return read;
}

/** How many actions fit in the bar right now, from its content width in rems: one below 18rem, two below 28rem, then as many as `maxInline`. */
function menuStart(bar: HTMLElement | null, inline: number): number {
  if (!bar) return inline;
  const style = getComputedStyle(bar);
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const content = (bar.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight)) / rem;
  return content < 18 ? 1 : content < 28 ? Math.min(2, inline) : inline;
}

/** Up to four faces in a circle, split the way a chat app does it: halves for two, a half and two quarters for three, quarters for four. */
function Mosaic({ conversation }: { conversation: ChatConversation }) {
  const cells = (conversation.members ?? []).slice(0, 4);
  if (!cells.length) {
    return (
      <Avatar aria-hidden="true" className="data-[size=default]:size-10">
        {conversation.image ? <AvatarImage src={conversation.image} alt="" /> : null}
        <AvatarFallback>{initialsOf(conversation.name)}</AvatarFallback>
      </Avatar>
    );
  }
  return (
    <span aria-hidden="true" className={cn("grid size-10 shrink-0 gap-px overflow-hidden rounded-full bg-background", cells.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2")}>
      {cells.map((member, index) => (
        <Avatar key={`${index}-${member.name}`} className={cn("size-full rounded-none data-[size=default]:size-full", cells.length === 3 && index === 0 && "row-span-2")}>
          {member.image ? <AvatarImage src={member.image} alt="" /> : null}
          <AvatarFallback className={cn("rounded-none text-[0.6875rem] font-semibold text-foreground/70", index % 2 === 0 ? "bg-foreground/[0.07]" : "bg-foreground/[0.13]")}>{initialsOf(member.name).slice(0, 1)}</AvatarFallback>
        </Avatar>
      ))}
    </span>
  );
}

/** A dot for active, a ring for away, nothing for offline: the shape says it before the words do. */
function PresenceMark({ state }: { state: ChatPresence["state"] }) {
  if (state === "offline") return null;
  return (
    <span
      aria-hidden="true"
      data-presence={state}
      className={cn("absolute -end-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-background", state === "online" ? "bg-foreground" : "border-[2.5px] border-foreground bg-background")}
    />
  );
}

/**
 * The bar above a chat thread: who you are talking to (a picture, or a mosaic
 * of faces for a group), their name, one calm line about where they stand
 * ("Active now", "Last seen 14:02", "12 members, 3 online") and the actions
 * that fit, the rest in a menu. The picture and name are one button that
 * opens the info panel, and the line under the name is a polite status that
 * is read out once a change has settled, never on every flicker and never
 * when you switch to another conversation. On a phone a back button appears
 * and the name gives way to the buttons. A muted conversation says so with a
 * bell with a line through it and the word.
 */
export function ChatHeader({
  conversation,
  presence,
  status: statusOverride,
  actions = [],
  maxInline = 3,
  onBack,
  onOpenInfo,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: ChatHeaderProps) {
  const text: Required<ChatHeaderLabels> = { ...DEFAULT_LABELS, ...labels };
  const root = useRef<HTMLDivElement>(null);
  const statusId = useId();
  const [menuFrom, setMenuFrom] = useState<number | null>(null);

  const seen = presence?.lastSeenAt === undefined ? Number.NaN : new Date(presence.lastSeenAt).getTime();
  const clock = useClock(now, Number.isNaN(seen) ? 0 : seen);

  let status = statusOverride ?? "";
  if (!status) {
    if (conversation.group) {
      const count = conversation.memberCount ?? conversation.members?.length ?? 0;
      status = [count ? fill(text.members, { count: String(count) }) : "", conversation.onlineCount ? fill(text.groupOnline, { count: String(conversation.onlineCount) }) : ""].filter(Boolean).join(", ");
    } else if (presence) {
      if (presence.state === "online") status = text.online;
      else if (presence.state === "away") status = text.away;
      else if (Number.isNaN(seen)) status = text.offline;
      else status = fill(text.lastSeen, { time: clock === null ? dateIn(seen, locale, timeZone, { day: "numeric", month: "short", ...clockOptions(locale) }) : lastSeenIn(seen, clock, locale, timeZone) });
    }
  }

  // The spoken copy: nothing on the way in, nothing when another conversation opens, and a change only once it has held for a moment.
  const [spoken, setSpoken] = useState("");
  const heard = useRef({ id: conversation.id, status });
  useEffect(() => {
    if (heard.current.id !== conversation.id) {
      heard.current = { id: conversation.id, status };
      setSpoken("");
      return;
    }
    if (heard.current.status === status) return;
    const timer = window.setTimeout(() => {
      heard.current = { id: conversation.id, status };
      setSpoken(status ? fill(text.statusChanged, { name: conversation.name, status }) : "");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [conversation.id, conversation.name, status, text.statusChanged]);

  const inline = Math.max(1, Math.floor(maxInline));
  // The bar keeps one action below 18rem, two below 28rem and `maxInline` above; the menu lists what is left out at the width it opens at.
  const overflow = actions.slice(Math.min(menuFrom ?? inline, inline));
  const moreClass = actions.length > inline ? undefined : actions.length > 2 ? "@md:hidden" : "@min-[18rem]:hidden";

  const identity = (
    <>
      <span className="relative shrink-0">
        {!conversation.image && (conversation.group || conversation.members?.length) ? (
          <Mosaic conversation={conversation} />
        ) : (
          <Avatar aria-hidden="true" className="data-[size=default]:size-10">
            {conversation.image ? <AvatarImage src={conversation.image} alt="" /> : null}
            <AvatarFallback>{initialsOf(conversation.name)}</AvatarFallback>
          </Avatar>
        )}
        {!conversation.group && presence ? <PresenceMark state={presence.state} /> : null}
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-[0.9375rem] leading-5 font-semibold tracking-[-0.02em]">{conversation.name}</span>
        {status || conversation.muted ? (
          <span id={statusId} className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[0.8125rem] leading-5 text-muted-foreground @md:flex-nowrap">
            {status ? <span className="max-w-full truncate @md:shrink-[0.2]">{status}</span> : null}
            {conversation.muted ? (
              <>
                {status ? (
                  <span aria-hidden="true" className="hidden @md:inline">
                    ·
                  </span>
                ) : null}
                <span className="inline-flex shrink-0 items-center gap-1 @md:min-w-0 @md:shrink">
                  <IconBellOff className="size-3.5 shrink-0" />
                  <span className="truncate">{text.muted}</span>
                </span>
              </>
            ) : null}
          </span>
        ) : null}
      </span>
    </>
  );

  return (
    <div ref={root} role="group" aria-label={conversation.name} data-slot="chat-header" data-group={conversation.group || undefined} className={cn("@container flex min-h-16 items-center gap-1 border-b border-border bg-background px-2 @md:px-3", className)} {...props}>
      {onBack ? (
        <Button type="button" variant="ghost" size="icon" aria-label={text.back} onClick={onBack} className="shrink-0 @md:hidden">
          <IconArrowLeft />
        </Button>
      ) : null}

      {onOpenInfo ? (
        <button
          type="button"
          aria-label={fill(text.openInfo, { name: conversation.name })}
          aria-describedby={status || conversation.muted ? statusId : undefined}
          onClick={onOpenInfo}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-start outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          {identity}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-1.5">{identity}</div>
      )}

      {actions.length ? (
        <IconButtonProvider>
          <div className="flex shrink-0 items-center gap-0.5">
            {actions.slice(0, inline).map((action, index) => (
              <IconButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                disabled={action.disabled}
                onClick={action.onSelect}
                side="bottom"
                className={cn(index === 1 && "@max-[18rem]:hidden", index >= 2 && "hidden @md:inline-flex")}
              />
            ))}
            {actions.length > 1 ? (
              <DropdownMenu
                modal={false}
                onOpenChange={(open) => {
                  // The menu lists what the bar could not fit at this moment, so it reads the bar's own width as it opens.
                  if (open) setMenuFrom(menuStart(root.current, inline));
                }}
              >
                <DropdownMenuTrigger asChild>
                  <IconButton icon={<IconMoreHorizontal />} label={text.more} side="bottom" className={moreClass} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48">
                  {overflow.map((action) => (
                    <DropdownMenuItem key={action.id} disabled={action.disabled} onSelect={() => action.onSelect?.()}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </IconButtonProvider>
      ) : null}

      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
}
