"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactElement, type RefObject } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface RecordNavigatorLabels {
  /** The name of the group for screen readers; `{label}` is the capitalised noun. Default "{label} navigation". */
  group?: string;
  /** The position text. `{label}` is the capitalised noun, `{current}` and `{total}` the numbers. Default "{label} {current} of {total}". */
  position?: string;
  /** What `{total}` becomes while the total is unknown. Default "many". */
  many?: string;
  /** Name and tooltip of the previous button; `{label}` is the noun. Default "Previous {label}". */
  previous?: string;
  /** Name and tooltip of the next button. Default "Next {label}". */
  next?: string;
  /** Why the previous button is dimmed on the first record. Default "This is the first {label}". */
  first?: string;
  /** Why the next button is dimmed on the last record. Default "This is the last {label}". */
  last?: string;
}

export interface RecordNavigatorProps extends Omit<ComponentProps<"div">, "children"> {
  /** Where you are, counting from zero: the first record is 0. The text shows it as 1. */
  index: number;
  /** How many records there are. Leave it out, or pass null, while a list is still loading: the text then reads "3 of many" and Next stays on. */
  total?: number | null;
  /** Called when Previous is pressed. You own the position: change `index` in response. */
  onPrevious: () => void;
  /** Called when Next is pressed. */
  onNext: () => void;
  /** The noun for one record, lower case: "submission". It builds the text, the tooltips and the announcement. Default "record". */
  label?: string;
  /** J for next and K for previous, ignored while typing in a field and with Ctrl, Cmd or Alt held. Default true. */
  bindKeys?: boolean;
  /** Listen only while focus is inside this element instead of anywhere on the page. */
  scope?: RefObject<HTMLElement | null>;
  /** Keep both buttons on at the ends and call the handlers there too, so you can wrap the index around. */
  loop?: boolean;
  /** Button size: 28, 32 or 40px (44px on touch screens). */
  size?: "sm" | "md" | "lg";
  /** `outline` puts the buttons and the text in one bar; `ghost` has no surface of its own. */
  variant?: "outline" | "ghost";
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words used for the text and the tooltips. */
  labels?: RecordNavigatorLabels;
}

const BOX = {
  sm: "size-7 [&_svg:not([class*='size-'])]:size-3.5 [@media(pointer:coarse)]:size-11",
  md: "size-8 [&_svg:not([class*='size-'])]:size-4 [@media(pointer:coarse)]:size-11",
  lg: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem] [@media(pointer:coarse)]:size-11",
} as const;

const TEXT = { sm: "text-xs", md: "text-[0.8125rem]", lg: "text-sm" } as const;

/** True for a field where the keys belong to the person typing. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file", "image"].includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.closest("[role='textbox'], [role='searchbox'], [role='combobox']") !== null;
}

interface StepProps {
  icon: ReactElement;
  /** What the button does: its name and, while it is on, its tooltip. */
  name: string;
  /** Why it is dimmed, when it is. */
  reason: string;
  keyHint: string | undefined;
  disabled: boolean;
  size: "sm" | "md" | "lg";
  /** True for a moment after its key ran, so a key press shows on the button it belongs to. */
  flashing: boolean;
  onPress: () => void;
}

function Step({ icon, name, reason, keyHint, disabled, size, flashing, onPress }: StepProps) {
  const reasonId = useId();
  return (
    <Fragment>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={name}
            aria-disabled={disabled || undefined}
            aria-keyshortcuts={keyHint && !disabled ? keyHint : undefined}
            // The name is the action. A dimmed button gives its reason as a description and keeps its name.
            aria-describedby={disabled ? reasonId : undefined}
            data-flash={flashing || undefined}
            className={cn(BOX[size], "data-[flash=true]:bg-muted aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:active:translate-y-0")}
            onClick={(event) => {
              if (disabled) {
                event.preventDefault();
                return;
              }
              onPress();
            }}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className={cn(keyHint && !disabled && "flex items-center gap-2.5")}>
          {disabled ? reason : name}
          {keyHint && !disabled ? (
            <KbdGroup aria-hidden="true">
              <Kbd className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">{keyHint}</Kbd>
            </KbdGroup>
          ) : null}
        </TooltipContent>
      </Tooltip>
      {disabled ? (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      ) : null}
    </Fragment>
  );
}

/**
 * Previous and next through a queue of records, without going back to the
 * list: search hits, a review queue, form submissions, spreadsheet rows. The
 * position is written in words ("Submission 3 of 40", in tabular figures) and
 * is a polite live region, so each step announces itself. At either end the
 * button dims and its tooltip says why ("This is the first submission"),
 * unless `loop` keeps it on. J and K work from the keyboard. It walks single
 * records; for pages of rows use Pagination.
 */
export function RecordNavigator({
  index,
  total,
  onPrevious,
  onNext,
  label = "record",
  bindKeys = true,
  scope,
  loop = false,
  size = "md",
  variant = "outline",
  locale = "en-US",
  labels,
  className,
  ...props
}: RecordNavigatorProps) {
  const count = typeof total === "number" && total >= 0 ? total : null;
  const fill = (template: string) => template.replace("{label}", label);
  const capitalised = label.charAt(0).toUpperCase() + label.slice(1);
  const text = {
    group: (labels?.group ?? "{label} navigation").replace("{label}", capitalised),
    position: labels?.position ?? "{label} {current} of {total}",
    many: labels?.many ?? "many",
    previous: fill(labels?.previous ?? "Previous {label}"),
    next: fill(labels?.next ?? "Next {label}"),
    first: fill(labels?.first ?? "This is the first {label}"),
    last: fill(labels?.last ?? "This is the last {label}"),
  };
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const empty = count === 0;
  const at = count === null ? Math.max(0, index) : Math.min(Math.max(0, index), Math.max(0, count - 1));
  // With loop the ends are not ends, unless there is nowhere to go (one record) or, with an unknown total, nowhere to wrap back to.
  const canPrevious = !empty && (loop && count !== null ? count > 1 : at > 0);
  const canNext = !empty && (loop ? count === null || count > 1 : count === null || at < count - 1);

  const position = text.position
    .replace("{label}", capitalised)
    .replace("{current}", numbers.format(empty ? 0 : at + 1))
    .replace("{total}", count === null ? text.many : numbers.format(count));

  const [edge, setEdge] = useState({ id: 0, text: "" });
  const [flash, setFlash] = useState<"previous" | "next" | null>(null);
  const edgeTimer = useRef<number>(undefined);
  const flashTimer = useRef<number>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(edgeTimer.current);
      window.clearTimeout(flashTimer.current);
    },
    [],
  );

  const blink = (which: "previous" | "next") => {
    window.clearTimeout(flashTimer.current);
    setFlash(which);
    flashTimer.current = window.setTimeout(() => setFlash(null), 180);
  };

  const latest = useRef({ canPrevious, canNext, onPrevious, onNext, text, blink });
  useEffect(() => {
    latest.current = { canPrevious, canNext, onPrevious, onNext, text, blink };
  });

  useEffect(() => {
    if (!bindKeys) return;
    const host: EventTarget = scope?.current ?? document;
    const onKey = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.defaultPrevented || event.isComposing || event.repeat || event.ctrlKey || event.metaKey || event.altKey || isTyping(event.target)) return;
      const key = event.key.toLowerCase();
      if (key !== "j" && key !== "k") return;
      const now = latest.current;
      const forward = key === "j";
      if (forward ? now.canNext : now.canPrevious) {
        now.blink(forward ? "next" : "previous");
        (forward ? now.onNext : now.onPrevious)();
        return;
      }
      // A key that does nothing should still say why, or it feels broken.
      window.clearTimeout(edgeTimer.current);
      setEdge((previous) => ({ id: previous.id + 1, text: forward ? now.text.last : now.text.first }));
      edgeTimer.current = window.setTimeout(() => setEdge((previous) => ({ ...previous, text: "" })), 2500);
    };
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [bindKeys, scope]);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        role="group"
        aria-label={text.group}
        data-slot="record-navigator"
        data-size={size}
        data-variant={variant}
        className={cn("inline-flex max-w-full items-center", variant === "outline" ? "gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-xs" : "gap-1", className)}
        {...props}
      >
        <Step icon={<IconChevronLeft />} name={text.previous} reason={text.first} keyHint={bindKeys ? "K" : undefined} disabled={!canPrevious} size={size} flashing={flash === "previous"} onPress={onPrevious} />
        <span role="status" aria-atomic="true" className={cn("min-w-0 truncate px-2 text-center font-medium tracking-[-0.005em] whitespace-nowrap text-foreground tabular-nums", TEXT[size])}>
          {position}
        </span>
        <Step icon={<IconChevronRight />} name={text.next} reason={text.last} keyHint={bindKeys ? "J" : undefined} disabled={!canNext} size={size} flashing={flash === "next"} onPress={onNext} />
        <span role="status" className="sr-only">
          <span key={edge.id}>{edge.text}</span>
        </span>
      </div>
    </TooltipProvider>
  );
}
