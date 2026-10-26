"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { Glyph, IconAlertCircle, IconBell, IconBellOff, IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ButtonGroup, ButtonGroupText, iconSizeOf } from "@rhs-ui/primitives/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

/** What you are told about: everything, only what is aimed at you, or nothing. */
export type WatchLevel = "all" | "mentions" | "ignore";

export interface WatchLevelOption {
  /** Which level this is. All three keep their ids; only the words change. */
  id: WatchLevel;
  /** The name in the menu: "All activity". */
  label: string;
  /** One line on what this level sends. */
  description: string;
  /** What the button says while this level is on. Default "Watching", "Mentions only" and "Not watching". */
  status?: string;
}

export interface WatchButtonProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The current level. Controlled: update it, and `count`, in `onLevelChange` before it resolves. */
  level?: WatchLevel;
  /** Where an uncontrolled button starts. Default "ignore". */
  defaultLevel?: WatchLevel;
  /** Called with the new level. The button changes at once; if this rejects it rolls back and says so. */
  onLevelChange?: (next: WatchLevel) => void | Promise<void>;
  /** The levels in the menu, in order, with your own words. Default all activity, mentions only and ignore. */
  levels?: readonly WatchLevelOption[];
  /** How many people are watching. It moves by one when you start or stop. Leave it out to show no count. */
  count?: number;
  /** What is watched, for the accessible name: "this issue" gives "Watching this issue, all activity". Default "this thread". */
  subject?: string;
  /** 32, 36 or 44px. Default "default". */
  size?: "sm" | "default" | "lg";
  /** Language of the count and of the lower-cased level in the name. Default "en-US". */
  locale?: string;
  /** Disables both buttons. */
  disabled?: boolean;
}

const DEFAULT_LEVELS: readonly WatchLevelOption[] = [
  { id: "all", label: "All activity", description: "Every comment, status change and commit." },
  { id: "mentions", label: "Mentions only", description: "Only when you are mentioned or assigned." },
  { id: "ignore", label: "Ignore", description: "Nothing, even if you are mentioned." },
];
const STATUS: Record<WatchLevel, string> = { all: "Watching", mentions: "Mentions only", ignore: "Not watching" };
const WHOLE = { maximumFractionDigits: 0 } as const;

/** Three bells that differ in shape, so the level never rests on colour: a bell, a bell with a dot, a bell crossed out. */
function LevelIcon({ level }: { level: WatchLevel }) {
  if (level === "ignore") return <IconBellOff />;
  if (level === "all") return <IconBell />;
  return (
    <span className="relative grid size-4 place-items-center">
      <IconBell className="col-start-1 row-start-1" />
      {/* The dot sits in the gap the bell's outline leaves at the top right. */}
      <Glyph className="col-start-1 row-start-1" stroke="none">
        <circle cx="17.7" cy="5.3" r="2.3" fill="currentColor" />
      </Glyph>
    </span>
  );
}

/**
 * A watch button with levels, for issues, threads, projects and documents.
 * It is a split button that always says what you will be told about: the main
 * button switches between the level you last chose and not watching, its words
 * name the mode ("Watching", "Mentions only", "Not watching"), and the chevron
 * opens a radio menu where every level says in one line what it sends. The
 * bell changes shape per level, and the accessible name reads "Watching this
 * issue, all activity". The change is made at once; if the request fails it is
 * rolled back and a line says so, and the count moves by one when you start or
 * stop watching.
 */
export function WatchButton({
  level,
  defaultLevel = "ignore",
  onLevelChange,
  levels = DEFAULT_LEVELS,
  count,
  subject = "this thread",
  size = "default",
  locale = "en-US",
  disabled = false,
  className,
  ...props
}: WatchButtonProps) {
  const hint = useId();
  const [own, setOwn] = useState<WatchLevel>(defaultLevel);
  const [optimistic, setOptimistic] = useState<WatchLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pending = useRef(false);

  const settled = level ?? own;
  const shown = optimistic ?? settled;
  const busy = optimistic !== null;
  const watching = shown !== "ignore";

  // Pressing the main button while not watching goes back to the last level that was on.
  const first = levels.find((option) => option.id !== "ignore")?.id ?? "all";
  const last = useRef<WatchLevel>(settled !== "ignore" ? settled : first);
  if (shown !== "ignore") last.current = shown;
  const comeBack = levels.some((option) => option.id === last.current) ? last.current : first;

  // The count was written for the level the button starts in: it moves by one between watching and not.
  const reference = level !== undefined ? settled : defaultLevel;
  const countFor = (state: WatchLevel) => (count === undefined ? undefined : Math.max(0, count + (state !== "ignore" ? 1 : 0) - (reference !== "ignore" ? 1 : 0)));
  const shownCount = countFor(shown);

  const optionOf = (id: WatchLevel) => levels.find((option) => option.id === id) ?? DEFAULT_LEVELS.find((option) => option.id === id) ?? DEFAULT_LEVELS[0]!;
  const statusOf = (id: WatchLevel) => optionOf(id).status ?? STATUS[id];
  const nameOf = (id: WatchLevel) => (id === "ignore" ? `Not watching ${subject}` : `Watching ${subject}, ${optionOf(id).label.toLocaleLowerCase(locale)}`);

  async function change(next: WatchLevel): Promise<void> {
    if (pending.current || disabled || next === shown) return;
    pending.current = true;
    setError(null);
    setOptimistic(next);
    try {
      await onLevelChange?.(next);
      if (level === undefined) setOwn(next);
      setAnnouncement(nameOf(next));
    } catch {
      setError(`Could not update your notifications for ${subject}. Try again.`);
    } finally {
      pending.current = false;
      setOptimistic(null);
    }
  }

  return (
    <div data-slot="watch-button" className={cn("inline-flex max-w-full flex-col items-start gap-1.5", className)} {...props}>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {/* Read as the button's description when it has focus; hidden from the page flow of a screen reader so it is not read twice. */}
      <span id={hint} aria-hidden="true" className="sr-only">
        {watching ? `Press to stop watching ${subject}` : `Press to start watching ${subject}`}
      </span>
      <ButtonGroup aria-label={`Notifications for ${subject}`} variant="outline" size={size} className="min-w-0 max-w-full">
        <Button
          type="button"
          aria-label={nameOf(shown)}
          aria-describedby={hint}
          aria-busy={busy || undefined}
          disabled={disabled}
          onClick={() => void change(watching ? "ignore" : comeBack)}
          // In a narrow card the group gives up width here, not at the edge: the longest hidden level is clipped first.
          className={cn("min-w-0 shrink overflow-hidden", !watching && "text-muted-foreground hover:text-foreground")}
        >
          {/* Every level, bell and words together, sits in the same cell: the button is as wide as the longest and does not jump when the level changes. */}
          <span aria-hidden="true" className="inline-grid">
            {[...new Set([...levels.map((option) => option.id), shown])].map((id) => (
              <span key={id} className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity duration-150 motion-reduce:transition-none", id === shown ? "opacity-100" : "opacity-0")}>
                <LevelIcon level={id} />
                <span className="truncate">{statusOf(id)}</span>
              </span>
            ))}
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size={iconSizeOf[size]} disabled={disabled} aria-label={`Change what you are notified about for ${subject}`} className={cn("relative", size === "lg" && "size-11")}>
              <IconChevronDown className="transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" collisionPadding={8} className="w-80 max-w-[calc(100vw-1rem)]">
            <DropdownMenuLabel>Notify me about</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={shown} onValueChange={(next) => void change(next as WatchLevel)}>
              {levels.map((option) => (
                <DropdownMenuRadioItem
                  key={option.id}
                  value={option.id}
                  aria-labelledby={`${hint}-${option.id}-label`}
                  aria-describedby={`${hint}-${option.id}-description`}
                  className="items-start gap-0 py-2 [&>span:first-child]:mt-0.5"
                >
                  <span className="grid min-w-0 gap-0.5">
                    <span id={`${hint}-${option.id}-label`} className="text-sm leading-5 font-medium">
                      {option.label}
                    </span>
                    <span id={`${hint}-${option.id}-description`} className="text-xs leading-snug text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {shownCount !== undefined ? (
          <ButtonGroupText>
            <AnimatedNumber value={shownCount} locale={locale} format={WHOLE} duration={0.45} />
            <span className="sr-only"> {shownCount === 1 ? "watcher" : "watchers"}</span>
          </ButtonGroupText>
        ) : null}
      </ButtonGroup>
      {error ? (
        <p role="alert" className="flex items-start gap-1.5 text-xs leading-snug font-medium text-destructive">
          <IconAlertCircle className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
