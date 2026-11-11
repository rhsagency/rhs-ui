"use client";

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";

import { IconArrowRight, IconExternal, IconHelp } from "@rhs-ui/icons";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface HelpPopoverLink {
  /** What the link says: "Read the rate limit guide". */
  label: string;
  /** Where it goes. */
  href: string;
  /** The link leaves your site: it opens in a new tab with `noopener noreferrer`, and screen readers are told. */
  external?: boolean;
}

/** The words the popover says on its own, for another language or your own wording. */
export interface HelpPopoverLabels {
  /** Said to screen readers after a link that opens a new tab. Default "(opens in a new tab)". */
  newTab: string;
}

export interface HelpPopoverProps {
  /** The heading of the popover. It names the popover for assistive technology; without one the `label` does. */
  title?: string;
  /** The explanation: a few sentences, a short list or a short code sample (it wraps). Paragraphs, lists, `strong` and `code` are styled for you. */
  children: ReactNode;
  /** Where to read more: one or two links under the text. */
  links?: readonly HelpPopoverLink[];
  /** The accessible name of the button, what the question mark stands for: "Help: API rate limit". Required, an icon alone says nothing. */
  label: string;
  /** The side the popover opens on. `auto` (the default) sits beside the field the label belongs to when there is room, above the label otherwise, and below the field when there is no room above either, so it does not cover the field. Any other side is taken from the button. */
  side?: "auto" | "top" | "right" | "bottom" | "left";
  /** How the popover lines up with the button along that side. Default "start". */
  align?: "start" | "center" | "end";
  /** The size of the button: `sm` is 24px with a 14px icon, `md` is 28px with a 16px icon. On a touch screen both get a 44px target. Default "md". */
  size?: "sm" | "md";
  /** The words the popover says on its own. */
  labels?: Partial<HelpPopoverLabels>;
  /** Extra classes for the button, for a different place in a label row. */
  className?: string;
}

const DEFAULT_LABELS = { newTab: "(opens in a new tab)" } satisfies HelpPopoverLabels;

/** Pixels needed to the right of the field for the popover (20rem) to sit beside it with its gap and the edge of the screen. */
const ROOM_BESIDE = 352;

/** The space between the popover and what it is placed against. */
const GAP = 8;

/** The control a label beside the button names, when there is one: the field the help is about. */
function controlBeside(button: HTMLElement): HTMLElement | null {
  const label = button.parentElement?.querySelector("label[for]");
  return label instanceof HTMLLabelElement && label.htmlFor ? document.getElementById(label.htmlFor) : null;
}

/**
 * What `auto` places the popover against, as a rectangle that is measured again whenever the popover is positioned. Beside, it is the button
 * out to the far edge of the field, so the popover starts where the field ends. Above or below, it is the button and the field together:
 * above is above the label, and when the screen has no room there the popover flips to the other side of the same rectangle, which is below
 * the field and not on top of it.
 */
function placeRect(button: HTMLElement, beside: boolean): DOMRect {
  const own = button.getBoundingClientRect();
  const field = controlBeside(button)?.getBoundingClientRect();
  if (!field) return own;
  if (beside) return new DOMRect(own.x, own.y, Math.max(own.right, field.right) - own.x, own.height);
  const top = Math.min(own.top, field.top);
  return new DOMRect(own.x, top, own.width, Math.max(own.bottom, field.bottom) - top);
}

/** What the explanation can hold, styled with classes written out in full. */
const PROSE = [
  "text-[0.8125rem] leading-relaxed text-muted-foreground",
  "[&_p+p]:mt-2 [&_strong]:font-medium [&_strong]:text-foreground",
  "[&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-4",
  "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.75rem] [&_code]:text-foreground",
  // A code sample wraps instead of scrolling sideways: a region that scrolls needs a tab stop of its own, and a popover is no place for one.
  "[&_pre]:mt-2 [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-2.5 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed [&_pre]:break-words [&_pre]:whitespace-pre-wrap [&_pre]:text-foreground",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
].join(" ");

/**
 * The small question mark beside a label that explains one field or one section.
 * It is a real button that opens a non-modal popover, so it works on touch, where
 * hover does not exist, and for a keyboard and a screen reader: Escape closes it,
 * focus goes back to the button, and opening another help button closes the first
 * (a click outside closes a non-modal popover). The popover has a heading, a short
 * text that can hold a list or a code sample, and up to a couple of links that say
 * when they leave the site. With the default `side="auto"` it opens beside the
 * field the label next to the button names (through the label's `for`) when there
 * is room, above the label when there is not, and below the field when there is no
 * room above either, so it does not sit on the field it describes. Name the button
 * after what it explains, never just "Help".
 */
export function HelpPopover({ title, children, links, label, side = "auto", align = "start", size = "md", labels, className }: HelpPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const button = useRef<HTMLButtonElement | null>(null);
  /** Where `auto` puts it: beside the field, or above the label (and below the field when the screen has no room above). */
  const [beside, setBeside] = useState(false);
  /** The same decision for the anchor, which is measured by the positioning code outside of rendering. */
  const besideNow = useRef(false);
  /** True once the button has mounted: the anchor below is added only then. */
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  /** The rectangle `auto` places the popover against. It is read live, so scrolling and resizing keep the popover with its field. */
  const anchor = useRef({
    getBoundingClientRect: () => (button.current ? placeRect(button.current, besideNow.current) : new DOMRect()),
    // The button's scrolling parents are watched too: a help button in a table that scrolls sideways keeps its popover with it.
    get contextElement() {
      return button.current ?? undefined;
    },
  });

  /** Runs on the press that opens the popover, before it opens, so it is placed right from its first frame. */
  function prepare(event: MouseEvent<HTMLButtonElement>) {
    if (side !== "auto" || event.currentTarget.getAttribute("data-state") === "open") return;
    // Decided when it opens, from where things really are: beside the field when there is room, above the label when there is not.
    const own = event.currentTarget.getBoundingClientRect();
    const field = controlBeside(event.currentTarget)?.getBoundingClientRect();
    const edge = Math.max(own.right, field?.right ?? 0);
    const room = document.documentElement.clientWidth - edge >= ROOM_BESIDE;
    besideNow.current = room;
    setBeside(room);
  }

  return (
    <Popover>
      {/*
        A rectangle instead of the button, so that a popover that has no room above flips to below the field and not onto it. It is added after the
        first render: while the button mounts (twice in React's strict mode) Radix lets it claim the anchor, and a rectangle given before that is lost.
      */}
      {side === "auto" && ready ? <PopoverAnchor virtualRef={anchor} /> : null}
      <PopoverTrigger asChild>
        <button
          ref={button}
          type="button"
          onClick={prepare}
          data-slot="help-popover"
          aria-label={label}
          className={cn(
            "relative inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none",
            "transition-[background-color,color] duration-150 motion-reduce:transition-none",
            "hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
            "focus-visible:ring-[3px] focus-visible:ring-ring/40",
            // A bigger target on a touch screen without moving anything: the button grows by an invisible frame.
            "before:absolute before:-inset-1 before:content-[''] pointer-coarse:before:-inset-2",
            size === "sm" ? "size-6 [&_svg]:size-3.5 pointer-coarse:before:-inset-2.5" : "size-7 [&_svg]:size-4",
            className,
          )}
        >
          <IconHelp />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side={side === "auto" ? (beside ? "right" : "top") : side}
        align={align}
        sideOffset={GAP}
        collisionPadding={12}
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : label}
        className="w-80 max-w-[min(20rem,var(--radix-popover-content-available-width))] p-4 text-sm"
      >
        {title ? (
          <h3 id={titleId} className="mb-1.5 text-sm leading-snug font-semibold tracking-[-0.01em] text-popover-foreground">
            {title}
          </h3>
        ) : null}
        <div className={PROSE}>{children}</div>
        {links?.length ? (
          <ul className="mt-3 grid gap-1.5 border-t border-border pt-3">
            {links.map((link) => (
              <li key={`${link.label}-${link.href}`}>
                <a
                  href={link.href}
                  {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group/link inline-flex items-center gap-1.5 rounded-sm text-[0.8125rem] font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {link.label}
                  {link.external ? (
                    <>
                      <IconExternal aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="sr-only">{words.newTab}</span>
                    </>
                  ) : (
                    <IconArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                  )}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
