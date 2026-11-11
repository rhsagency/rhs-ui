"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  SEARCH_AFTER,
  fill,
  filterPeople,
  numberText,
  plural,
  stackSummary,
  type AvatarGroupLabels,
  type AvatarPerson,
  type PresenceStatus,
} from "@rhs-ui/application/avatar-group-popover/people";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export type { AvatarGroupLabels, AvatarPerson, PresenceStatus } from "@rhs-ui/application/avatar-group-popover/people";

export interface AvatarGroupPopoverProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** Everyone in the group, in the order the stack should show them: an id, a name, a role, a picture and where they are right now. */
  people: readonly AvatarPerson[];
  /** How many avatars are drawn before the rest are folded into a "+5" button. Default 4. With no more people than this there is no button. */
  max?: number;
  /** A row of the list was chosen, by a click or by Enter. The popover closes. With no handler the rows are plain text: they can be reached with the arrow keys and read, and do nothing. */
  onSelect?: (person: AvatarPerson) => void;
  /** Where the "View all people" link at the foot goes. Leave it out for no link. */
  viewAllHref?: string;
  /** Give the list a filter field once it holds more than eight people. Default true. */
  searchable?: boolean;
  /** The size of the avatars and of the button: `sm` 28px, `default` 36px, `lg` 48px. Default `default`. */
  size?: "sm" | "default" | "lg";
  /** Which edge of the button the list lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the list is open, when you control it. */
  open?: boolean;
  /** Whether the list is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of "1 person" against "3 people". Default "en-US". */
  locale?: string;
  /** The words the stack and the list say, for translation. */
  labels?: AvatarGroupLabels;
}

const CHIP_SIZE: Record<NonNullable<AvatarGroupPopoverProps["size"]>, string> = {
  sm: "size-7 text-[0.6875rem]",
  default: "size-9 text-[0.8125rem]",
  lg: "size-12 text-base",
};

const OVERLAP: Record<NonNullable<AvatarGroupPopoverProps["size"]>, string> = {
  sm: "-space-x-1",
  default: "-space-x-1.5",
  lg: "-space-x-2.5",
};

/** A presence drawn as a shape, not a colour: a solid disc is here, a half disc stepped away, a ring with a bar is busy, a bare ring is not here. */
function PresenceMark({ status }: { status: PresenceStatus }) {
  return (
    <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false" data-status={status} className={cn("size-2.5 shrink-0", status === "online" || status === "busy" ? "text-foreground" : "text-muted-foreground")}>
      {status === "online" ? <circle cx="5" cy="5" r="4" fill="currentColor" /> : null}
      {status === "away" ? (
        <>
          <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5 1.6a3.4 3.4 0 0 0 0 6.8z" fill="currentColor" />
        </>
      ) : null}
      {status === "busy" ? (
        <>
          <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.2 5h3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </>
      ) : null}
      {status === "offline" ? <circle cx="5" cy="5" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.3" /> : null}
    </svg>
  );
}

interface RowProps {
  person: AvatarPerson;
  active: boolean;
  selectable: boolean;
  words: Required<AvatarGroupLabels>;
  onActive: (id: string) => void;
  onSelect: (person: AvatarPerson) => void;
}

function PersonRow({ person, active, selectable, words, onActive, onSelect }: RowProps) {
  const content = (
    <>
      <Avatar aria-hidden="true" className="data-[size=default]:size-8">
        {person.image ? <AvatarImage src={person.image} alt="" /> : null}
        <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
      </Avatar>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-sm font-medium tracking-[-0.01em]">{person.name}</span>
        {person.role ? <span className="truncate text-xs text-muted-foreground">{person.role}</span> : null}
      </span>
      {person.status ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
          <PresenceMark status={person.status} />
          {words[person.status]}
        </span>
      ) : null}
    </>
  );
  const shared = {
    "data-row": "",
    "data-id": person.id,
    tabIndex: active ? 0 : -1,
    onFocus: () => onActive(person.id),
    className: cn(
      "flex w-full min-w-0 items-center gap-3 rounded-md px-2.5 py-2 text-left outline-none transition-colors duration-150 focus-visible:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none",
      selectable && "hover:bg-muted/70",
    ),
  } as const;
  return selectable ? (
    <button type="button" {...shared} onClick={() => onSelect(person)}>
      {content}
    </button>
  ) : (
    <div {...shared}>{content}</div>
  );
}

/**
 * An avatar stack whose "+5" does something: press it and everyone is in a short list, with name, role and where they are right
 * now as a drawing and a word. The visible avatars have names for assistive technology, the button is named "Show 5 more
 * people", and the whole stack reads as "Maya Okafor and 6 others". The list is one tab stop with the arrow keys, Home and End,
 * and it scrolls inside itself when it is long; past eight people it gets a filter field that says how many match. With
 * `onSelect` a row can be chosen, and a link at the foot goes to the full list.
 */
export function AvatarGroupPopover({
  people,
  max = 4,
  onSelect,
  viewAllHref,
  searchable = true,
  size = "default",
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: AvatarGroupPopoverProps) {
  const words: Required<AvatarGroupLabels> = { ...DEFAULT_LABELS, ...labels };
  const listId = useId();
  const content = useRef<HTMLDivElement>(null);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const isOpen = open ?? ownOpen;
  // A list that is open from the start (a preview, a first-run tip) never takes focus from the page: that is only for a list somebody opened.
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [fresh, setFresh] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setFresh(false);
  }

  const shown = people.slice(0, Math.max(0, max));
  const hidden = people.length - shown.length;
  const filtering = searchable && people.length > SEARCH_AFTER;
  const rows = filtering ? filterPeople(people, query) : [...people];
  const current = rows.some((row) => row.id === activeId) ? activeId : (rows[0]?.id ?? null);
  const asked = query.trim();
  const matches = fill(plural(rows.length, words.matchesOne, words.matchesMany, locale), { count: numberText(rows.length, locale) });

  function setOpen(next: boolean) {
    if (!next) setQuery("");
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function choose(person: AvatarPerson) {
    onSelect?.(person);
    setOpen(false);
  }

  /** The filter field, when the list has one. */
  const field = () => content.current?.querySelector<HTMLInputElement>("input[type='search']") ?? null;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target;
    const list = [...(content.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])];
    if (target instanceof HTMLInputElement && target.type === "search") {
      if (event.key === "ArrowDown" && list[0]) {
        event.preventDefault();
        list[0].focus();
      }
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const at = list.findIndex((row) => row === document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    // From the first row, the arrow up goes back to the filter field, where one is.
    const search = field();
    if (event.key === "ArrowUp" && at === 0 && search) {
      search.focus();
      return;
    }
    const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : Math.min(list.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)));
    list[next]?.focus();
  }

  return (
    <div data-slot="avatar-group-popover" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <AvatarGroup role="group" aria-label={stackSummary(people, words, locale) || undefined} className={OVERLAP[size]}>
        {shown.map((person) => (
          <Avatar key={person.id} size={size} role="img" aria-label={person.name}>
            {person.image ? <AvatarImage src={person.image} alt="" /> : null}
            <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
          </Avatar>
        ))}
        {hidden > 0 ? (
          <Popover open={isOpen} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={fill(plural(hidden, words.showMoreOne, words.showMoreMany, locale), { count: numberText(hidden, locale) })}
                className={cn(
                  "relative flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground tabular-nums ring-2 ring-background outline-none transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_9%)] focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_9%)] motion-reduce:transition-none",
                  CHIP_SIZE[size],
                )}
              >
                <span aria-hidden="true">+{numberText(hidden, locale)}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              ref={content}
              align={align}
              collisionPadding={8}
              aria-label={words.title}
              onKeyDown={onKeyDown}
              onOpenAutoFocus={(event) => {
                // Focus goes to the filter field, or to the first row, the one the arrow keys start from.
                event.preventDefault();
                if (fresh) return;
                const target = field() ?? content.current?.querySelector<HTMLElement>('[data-row][tabindex="0"]') ?? content.current;
                target?.focus({ preventScroll: true });
              }}
              // Escape empties a filter that has words in it, and only then closes the list: the field's own handler does the emptying.
              onEscapeKeyDown={(event) => {
                const field = event.target;
                if (field instanceof HTMLInputElement && field.type === "search" && field.value !== "") event.preventDefault();
              }}
              className="flex max-h-[min(26rem,var(--radix-popover-content-available-height))] w-[min(20rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
            >
              <div className="flex shrink-0 items-baseline justify-between gap-3 px-4 pt-3 pb-2.5">
                <h2 className="text-sm font-semibold tracking-[-0.01em]">{words.title}</h2>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {fill(plural(people.length, words.countOne, words.countMany, locale), { count: numberText(people.length, locale) })}
                </span>
              </div>
              {filtering ? (
                <div className="shrink-0 px-3 pb-2.5">
                  <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={words.searchPlaceholder}
                    aria-label={words.search}
                    aria-controls={listId}
                    className="h-8 [&_input]:text-[0.8125rem]"
                  />
                </div>
              ) : null}
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border [scrollbar-width:thin]">
                {rows.length ? (
                  <ul id={listId} aria-label={words.title} className="grid gap-px p-1.5">
                    {rows.map((person) => (
                      <li key={person.id}>
                        <PersonRow person={person} active={person.id === current} selectable={onSelect !== undefined} words={words} onActive={setActiveId} onSelect={choose} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p id={listId} className="px-4 py-8 text-center text-[0.8125rem] text-muted-foreground">
                    {fill(words.nothingMatches, { query: asked })}
                  </p>
                )}
              </div>
              {viewAllHref ? (
                <div className="shrink-0 border-t border-border bg-muted/30 p-1.5">
                  <a href={viewAllHref} onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-center")}>
                    {words.viewAll}
                    <IconArrowRight />
                  </a>
                </div>
              ) : null}
              {/* Kept in the list when empty: a live region that appears together with its message is often never read. */}
              <p role="status" aria-live="polite" className="sr-only">
                {filtering && asked ? (rows.length ? matches : fill(words.nothingMatches, { query: asked })) : ""}
              </p>
            </PopoverContent>
          </Popover>
        ) : null}
      </AvatarGroup>
    </div>
  );
}
