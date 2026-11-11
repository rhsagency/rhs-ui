"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconChevronDown, IconLock, IconSpinner, IconUserMinus } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  fill,
  isThenable,
  messageOf,
  type AccessLevel,
  type AccessLevelLabels,
  type DisabledLevel,
} from "@rhs-ui/application/access-level-menu/levels";
import { Button } from "@rhs-ui/primitives/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export type { AccessLevel, AccessLevelLabels, DisabledLevel } from "@rhs-ui/application/access-level-menu/levels";

/**
 * Popover and Dialog content declare `onOpenAutoFocus`. Radix reads it on a menu's content too, but leaves it out of the menu's types,
 * so the prop travels in an object that carries its own type.
 */
type MenuContentFocus = ComponentProps<typeof DropdownMenuContent> & { onOpenAutoFocus?: (event: Event) => void };

export interface AccessLevelMenuProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The levels that exist, in menu order: an id, a label and a line on what each allows. */
  levels: readonly AccessLevel[];
  /** The `id` of the current level, when you control the menu. Pair it with `onValueChange`. */
  value?: string;
  /** The `id` of the level to begin with, when the menu keeps it itself. Default: the first level. */
  defaultValue?: string;
  /**
   * A level was chosen. Save it and update `value`. Return a promise and the button shows the choice with a spinner while it
   * runs; if it rejects, the button goes back to the level it had and the reason is written under it. Update `value` before the
   * promise resolves, so the button and the announcement agree.
   */
  onValueChange?: (id: string) => void | Promise<void>;
  /** Shows "Remove access" below a separator and runs this when it is chosen. It may return a promise. Leave it out for no remove entry. */
  onRemove?: () => void | Promise<void>;
  /** The words of the remove entry. Default "Remove access". */
  removeLabel?: string;
  /** Ask once more before removing: the menu turns into "Remove access? Yes, remove access / Keep access", with focus on the safe answer. */
  confirmRemove?: boolean;
  /** Levels this person may not be given, each with the reason. They stay in the list, they can be reached with the arrow keys, and choosing one does nothing. */
  disabledLevels?: readonly DisabledLevel[];
  /** Shows the current level as plain text with a lock, and no menu: an owner row, or access that is fixed by a plan. */
  locked?: boolean;
  /** Why a locked level cannot change. It is written under the level. */
  lockedReason?: string;
  /** Who or what the control is for: "Dana Whitfield", "Anyone with the link". It names the button for a screen reader and the confirmation. */
  subject?: string;
  /** `sm` is the compact button, 32px, for a dense list. Default `default`, 36px. */
  size?: "sm" | "default";
  /** `outline` is a button with a border. `ghost` has none until you hover or open it, so a column of them reads as a list. Default `outline`. */
  variant?: "outline" | "ghost";
  /** Turns the control off. The level stays readable. */
  disabled?: boolean;
  /** Which edge of the button the menu lines up with, and the edge a message under the button hangs from. Default "end", for a control at the end of a row. */
  align?: "start" | "center" | "end";
  /** Whether the menu is open, when you control it. */
  open?: boolean;
  /** Whether the menu is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the menu opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Called with whatever a refused change or removal threw, after the control has gone back and said so. */
  onError?: (error: unknown) => void;
  /** The words the menu says, for translation. */
  labels?: AccessLevelLabels;
}

/** The failure text, darkened toward the foreground so small red words reach 4.5:1 on a card. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * The column of button and message hangs from the edge the menu lines up with, so a message under the button (or a reason under a
 * locked level) never pushes the button away from the edge the other rows share.
 */
const EDGE = {
  start: "items-start",
  center: "items-center text-center",
  end: "items-end text-right",
} as const;

/**
 * The role control that sits beside a person or a link in a sharing dialog or a member list. The button reads the
 * current level with a chevron; the menu is one choice of several, and every level says in a line what it allows. Levels
 * this person may not be given stay in the list with the reason under them, so nobody has to guess why; Remove access
 * waits below a separator, with one more question first if you ask for it. A change is made at once and put back with
 * a message when the server refuses it, a locked row (the owner) shows its level without a menu and says why, and
 * everything that happens is said out loud.
 */
export function AccessLevelMenu({
  levels,
  value,
  defaultValue,
  onValueChange,
  onRemove,
  removeLabel,
  confirmRemove = false,
  disabledLevels = [],
  locked = false,
  lockedReason,
  subject,
  size = "default",
  variant = "outline",
  disabled = false,
  align = "end",
  open,
  defaultOpen = false,
  onOpenChange,
  onError,
  labels,
  className,
  ...props
}: AccessLevelMenuProps) {
  const words: Required<AccessLevelLabels> = { ...DEFAULT_LABELS, ...labels };
  const noteId = useId();
  const [own, setOwn] = useState(defaultValue ?? levels[0]?.id ?? "");
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [choice, setChoice] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [asking, setAsking] = useState(false);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState("");
  const working = useRef(false);
  const keep = useRef<HTMLDivElement>(null);

  const isOpen = open ?? ownOpen;
  // A menu that is open from the start (a preview, a first-run tip) never takes focus from the page, and so never swallows Tab: that
  // is only for a menu somebody opened. Once it has been closed it is an ordinary menu.
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [fresh, setFresh] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setFresh(false);
  }
  const current = value ?? own;
  const shown = choice ?? current;
  const level = levels.find((item) => item.id === shown) ?? levels[0];
  const blocked = new Map(disabledLevels.map((item) => [item.id, item.reason] as const));
  const busy = choice !== null || removing;
  const labelOf = (id: string) => levels.find((item) => item.id === id)?.label ?? id;

  // A refusal stays until the next try, and goes by itself after a while so a row does not stay tall for good.
  useEffect(() => {
    if (!problem) return;
    const timer = window.setTimeout(() => setProblem(""), 12_000);
    return () => window.clearTimeout(timer);
  }, [problem]);

  // The confirmation replaces the list, so focus goes to the safe answer instead of staying on a button that is gone.
  useEffect(() => {
    if (asking) keep.current?.focus();
  }, [asking]);

  function changeOpen(next: boolean) {
    if (next && (disabled || busy)) return;
    if (next) {
      // Cleared on the way in, so the same words are read out again after the next attempt.
      setProblem("");
      setSaid("");
    } else {
      setAsking(false);
    }
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function fail(error: unknown, text: string) {
    const extra = messageOf(error);
    const message = extra ? `${text} ${extra}` : text;
    setProblem(message);
    setSaid(message);
    onError?.(error);
  }

  async function change(next: string) {
    if (working.current || blocked.has(next) || next === current) return;
    const before = current;
    const done = () => {
      if (value === undefined) setOwn(next);
      setSaid(subject ? fill(words.changedFor, { subject, level: labelOf(next) }) : fill(words.changed, { level: labelOf(next) }));
    };
    setProblem("");
    let outcome: void | Promise<void>;
    try {
      outcome = onValueChange?.(next);
    } catch (error) {
      fail(error, fill(words.failed, { level: labelOf(before) }));
      return;
    }
    // An answer that is already here needs no busy state; a promise shows the choice and a spinner while it runs.
    if (!isThenable(outcome)) {
      done();
      return;
    }
    working.current = true;
    setChoice(next);
    try {
      await outcome;
      done();
    } catch (error) {
      fail(error, fill(words.failed, { level: labelOf(before) }));
    } finally {
      working.current = false;
      setChoice(null);
    }
  }

  async function remove() {
    if (working.current) return;
    const done = () => setSaid(subject ? fill(words.removedFor, { subject }) : words.removed);
    setProblem("");
    let outcome: void | Promise<void>;
    try {
      outcome = onRemove?.();
    } catch (error) {
      fail(error, words.removeFailed);
      return;
    }
    if (!isThenable(outcome)) {
      done();
      return;
    }
    working.current = true;
    setRemoving(true);
    try {
      await outcome;
      done();
    } catch (error) {
      fail(error, words.removeFailed);
    } finally {
      working.current = false;
      setRemoving(false);
    }
  }

  const compact = size === "sm";

  if (locked) {
    const reason = lockedReason ?? words.lockedReason;
    return (
      <div data-slot="access-level-menu" data-locked="" className={cn("inline-flex min-w-0 max-w-full flex-col gap-0.5", EDGE[align], className)} {...props}>
        <span className={cn("inline-flex max-w-full items-center gap-1.5 font-medium", compact ? "h-8 text-[0.8125rem]" : "h-9 text-sm")}>
          <IconLock aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{level?.label}</span>
        </span>
        <span className="max-w-[16rem] text-xs leading-snug text-pretty text-muted-foreground">{reason}</span>
      </div>
    );
  }

  const name = subject ? fill(words.buttonFor, { subject, level: level?.label ?? "" }) : fill(words.button, { level: level?.label ?? "" });
  const contentFocus: MenuContentFocus = fresh ? { onOpenAutoFocus: (event) => event.preventDefault() } : {};

  return (
    <div data-slot="access-level-menu" data-busy={busy || undefined} className={cn("inline-flex min-w-0 max-w-full flex-col gap-1", EDGE[align], className)} {...props}>
      <DropdownMenu modal={false} open={isOpen} onOpenChange={changeOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={compact ? "sm" : "default"}
            aria-label={name}
            aria-busy={busy || undefined}
            aria-disabled={disabled || undefined}
            aria-describedby={problem ? noteId : undefined}
            className="max-w-full min-w-0 justify-between gap-1.5 px-3 data-[state=open]:bg-muted aria-busy:cursor-progress aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <span className="truncate">{level?.label}</span>
            {busy ? (
              <IconSpinner aria-hidden="true" className="text-muted-foreground" />
            ) : (
              <IconChevronDown aria-hidden="true" className="text-muted-foreground transition-transform duration-200 group-data-[state=open]/button:rotate-180 motion-reduce:transition-none" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent {...contentFocus} align={align} collisionPadding={8} className="w-[19rem] max-w-[calc(100vw-1rem)]">
          {asking ? (
            <>
              <div className="px-2 pt-2 pb-2.5">
                <p className="text-sm leading-tight font-medium">{words.confirmTitle}</p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">{fill(words.confirmBody, { subject: subject ?? words.someone })}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem ref={keep}>{words.keep}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => void remove()}>
                <IconUserMinus />
                {words.confirmAction}
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuLabel>{words.menu}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={current} onValueChange={(id) => void change(id)}>
                {levels.map((item) => {
                  const reason = blocked.get(item.id);
                  return (
                    <DropdownMenuRadioItem
                      key={item.id}
                      value={item.id}
                      textValue={item.label}
                      // Not `disabled`: Radix skips a disabled item with the arrow keys, and the reason would never be read to a keyboard or a screen reader.
                      aria-disabled={reason ? true : undefined}
                      onSelect={reason ? (event) => event.preventDefault() : undefined}
                      // A level that cannot be given stays muted when it is highlighted: the highlight shows where the arrow keys are, and does not suggest the level can be chosen.
                      className={cn("items-start py-2 pr-3", reason && "cursor-not-allowed text-muted-foreground data-[highlighted]:bg-muted/50 data-[highlighted]:text-muted-foreground")}
                    >
                      <span className="grid min-w-0 gap-0.5">
                        <span className={cn("text-sm leading-tight font-medium", reason ? "text-muted-foreground" : "text-foreground")}>{item.label}</span>
                        {item.description ? <span className="text-xs leading-snug text-muted-foreground">{item.description}</span> : null}
                        {reason ? (
                          <span className="mt-0.5 flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
                            <IconLock aria-hidden="true" className="mt-px size-3 shrink-0" />
                            <span>{reason}</span>
                          </span>
                        ) : null}
                      </span>
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
              {onRemove ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(event) => {
                      if (confirmRemove) {
                        event.preventDefault();
                        setAsking(true);
                      } else {
                        void remove();
                      }
                    }}
                  >
                    <IconUserMinus />
                    {removeLabel ?? words.remove}
                  </DropdownMenuItem>
                </>
              ) : null}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {problem ? (
        <p id={noteId} className={cn("flex max-w-[16rem] items-start gap-1.5 text-xs leading-snug font-medium text-pretty", DANGER_TEXT)}>
          <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {problem}
        </p>
      ) : null}
      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {busy ? (removing ? words.removing : words.saving) : said}
      </p>
    </div>
  );
}
