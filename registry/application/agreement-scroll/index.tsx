"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconCheck, IconFileText } from "@rhs-ui/icons";
import { DEFAULT_LABELS, atEnd, fill, readFraction, type AgreementScrollLabels } from "@rhs-ui/application/agreement-scroll/labels";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export type { AgreementScrollLabels } from "@rhs-ui/application/agreement-scroll/labels";

export interface AgreementScrollProps extends Omit<ComponentProps<"div">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The name of the document: "Terms of service". It names the scrolling region for a screen reader. */
  title: string;
  /** The version of the text, shown beside the title: "3.2". */
  version?: string;
  /** The text to read. `h4`, `p`, `ol` and `ul` are styled for you. */
  children: ReactNode;
  /** The reader must reach the end before the checkbox unlocks. A text that fits without scrolling unlocks at once. Default true. */
  requireScroll?: boolean;
  /** Whether the text is accepted, when you control the checkbox. */
  accepted?: boolean;
  /** Whether it is accepted to begin with, when the component keeps that itself. */
  defaultAccepted?: boolean;
  /** Called when the checkbox is ticked or cleared. */
  onAcceptedChange?: (accepted: boolean) => void;
  /** The words next to the checkbox. Default "I have read and accept the {title}". */
  acceptLabel?: ReactNode;
  /** The height of the scrolling region: a number of px or any CSS length. Default "16rem". */
  height?: number | string;
  /** The checkbox's name, for a plain form submit. */
  name?: string;
  /** Turn the whole thing off. */
  disabled?: boolean;
  /** The words the component says, for translation. */
  labels?: AgreementScrollLabels;
}

/**
 * A contract, licence or consent text in a bordered scrolling region, with a
 * thin line along its top edge that fills as it is read (and keeps the furthest
 * point reached, so scrolling back up never un-reads it) and the acceptance
 * below it. The checkbox stays disabled until the reader reaches the end, with
 * "Scroll to the end to accept" tied to it and replaced by "You can now
 * accept" when it unlocks, announced politely. The region is focusable and
 * named, so the arrow keys, Page Up and Down and End scroll it, and a "Jump to
 * the end" button covers anyone who cannot scroll comfortably. A text that
 * fits unlocks at once, and a ResizeObserver checks again when the width
 * changes, so a rotated phone never strands the reader.
 */
export function AgreementScroll({
  title,
  version,
  children,
  requireScroll = true,
  accepted,
  defaultAccepted = false,
  onAcceptedChange,
  acceptLabel,
  height = "16rem",
  name,
  disabled = false,
  labels,
  className,
  ...props
}: AgreementScrollProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const ids = { title: `${base}-title`, accept: `${base}-accept`, hint: `${base}-hint` };
  const region = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLButtonElement>(null);
  // Set when the jump button was pressed: the checkbox takes the focus once it unlocks, because the button goes away.
  const jumped = useRef(false);
  const [own, setOwn] = useState(defaultAccepted);
  const [reached, setReached] = useState(false);
  const [fraction, setFraction] = useState(0);
  const isAccepted = accepted ?? own;
  // Once the end has been seen it stays seen; and a text that is already accepted can always be un-accepted.
  const unlocked = !requireScroll || reached || isAccepted;

  function measure() {
    const element = region.current;
    if (!element) return;
    const end = atEnd(element.scrollTop, element.scrollHeight, element.clientHeight);
    // The badge and the line say how far the reader has been, not where the box stands now: scrolling back up does not un-read the text, and it must not contradict "You can now accept".
    setFraction((before) => (end ? 1 : Math.max(before, readFraction(element.scrollTop, element.scrollHeight, element.clientHeight))));
    if (end) setReached(true);
  }

  // Look again whenever the region or the text inside it changes size: a rotated phone, a narrower column, a late-loading font.
  useEffect(() => {
    const element = region.current;
    if (!element) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reached && jumped.current) {
      jumped.current = false;
      box.current?.focus();
    }
  }, [reached]);

  function jump() {
    const element = region.current;
    if (!element) return;
    jumped.current = true;
    const calm = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ top: element.scrollHeight, behavior: calm ? "auto" : "smooth" });
  }

  function accept(next: boolean) {
    if (accepted === undefined) setOwn(next);
    onAcceptedChange?.(next);
  }

  const percent = Math.round(fraction * 100);

  return (
    <div data-slot="agreement-scroll" data-unlocked={unlocked || undefined} className={cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
            <IconFileText className="size-4" />
          </span>
          <div className="grid min-w-0 gap-0.5">
            <h3 id={ids.title} className="text-sm leading-5 font-medium tracking-[-0.01em] text-balance">
              {title}
            </h3>
            {version ? <p className="text-xs leading-4 text-muted-foreground tabular-nums">{fill(text.version, { version })}</p> : null}
          </div>
        </div>
        {requireScroll ? (
          <Badge variant="outline" aria-hidden="true" className="tabular-nums">
            {fill(text.percent, { percent })}
          </Badge>
        ) : null}
      </div>

      {/* The rule between the header and the text is the progress line; a text that is only offered has a plain rule. */}
      {requireScroll ? <Progress value={percent} aria-label={text.progress} className="h-0.5 rounded-none bg-border" /> : <div className="h-px bg-border" />}

      <div
        ref={region}
        role="region"
        aria-labelledby={ids.title}
        tabIndex={0}
        onScroll={measure}
        style={{ height }}
        className={cn(
          "relative overflow-y-auto overscroll-contain px-4 py-4 text-sm leading-relaxed text-muted-foreground outline-none sm:px-5",
          "[scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]",
          "focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
          "[&_h4]:mt-5 [&_h4]:mb-1.5 [&_h4]:text-sm [&_h4]:font-medium [&_h4]:text-foreground [&_h4:first-child]:mt-0",
          "[&_p+p]:mt-3 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_strong]:font-medium [&_strong]:text-foreground",
        )}
      >
        <div ref={content}>{children}</div>
      </div>

      <div className="grid gap-3 border-t border-border bg-muted/30 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <Checkbox
            ref={box}
            id={ids.accept}
            name={name}
            checked={isAccepted}
            disabled={disabled || !unlocked}
            onCheckedChange={(next) => accept(next === true)}
            aria-describedby={requireScroll ? ids.hint : undefined}
            className="mt-px"
          />
          <Label htmlFor={ids.accept} className="cursor-pointer items-start text-sm leading-snug font-normal">
            {acceptLabel ?? fill(text.accept, { title })}
          </Label>
        </div>
        {requireScroll ? (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-[30px]">
            <p id={ids.hint} role="status" aria-live="polite" className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {unlocked ? <IconCheck aria-hidden="true" className="size-3.5 shrink-0 text-foreground" /> : <IconArrowDown aria-hidden="true" className="size-3.5 shrink-0" />}
              <span className={cn(unlocked && "font-medium text-foreground")}>{unlocked ? text.unlockedHint : text.scrollHint}</span>
            </p>
            {unlocked ? null : (
              <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={jump}>
                <IconArrowDown aria-hidden="true" />
                {text.jump}
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
