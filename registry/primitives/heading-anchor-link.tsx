"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconCheck, IconHash } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface HeadingAnchorLinkProps extends Omit<ComponentProps<"div">, "id" | "children" | "onCopy"> {
  /** The id of the heading and the fragment of the link: `installation` links to `#installation`. Without an id no link is drawn at all. */
  id?: string;
  /** The heading level. Default "h2". */
  as?: "h2" | "h3" | "h4" | "h5" | "h6";
  /** The heading text. */
  children: ReactNode;
  /** The name of the link and its tooltip. `{heading}` is the heading's text, so in a list of links every one says which section it belongs to; a label without it is followed by the heading's text in the name. Default "Copy link to {heading}". */
  label?: string;
  /** Said after the copy; `{heading}` is the heading's text. Default "Link to {heading} copied". */
  copiedLabel?: string;
  /** The tooltip for the moment after the copy. Default "Link copied". */
  copiedTip?: string;
  /** Said and shown when the browser would not copy; the address bar still has the link. Default "Could not copy. The link is in the address bar." */
  failedLabel?: string;
  /** Called with the full URL once it is on the clipboard. */
  onCopy?: (url: string) => void;
  /** The height in pixels of whatever is fixed at the top of the page. The heading keeps this much room above it after a jump, so a sticky navbar never covers it. Default 80. */
  offset?: number;
  /** `hover` shows the link on hover and on keyboard focus, and always on touch screens. `always` keeps it visible. Default "hover". */
  reveal?: "hover" | "always";
  /** Classes for the heading element itself. The wrapper takes `className`. */
  headingClassName?: string;
}

const SIZE = {
  h2: "text-2xl leading-tight",
  h3: "text-xl leading-snug",
  h4: "text-lg leading-snug",
  h5: "text-base leading-snug",
  h6: "text-sm leading-snug",
} as const;

/** Writes with the Clipboard API, and falls back to a selected, hidden field for pages where it is blocked. */
async function writeText(text: string, near: HTMLElement | null): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
    (near?.parentElement ?? document.body).appendChild(area);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    area.select();
    area.setSelectionRange(0, text.length);
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
    active?.focus({ preventScroll: true });
    return copied;
  }
}

/**
 * The "#" beside a heading that lets a section be linked to. It is a real link
 * to the heading's id: pressing it jumps there, puts the fragment in the
 * address bar, copies the full URL (the origin is read when you press, so it
 * is right on any host) and says "Link to Installation copied" politely. It
 * shows on hover and on keyboard focus, and is always there on touch screens.
 * The heading keeps `scroll-margin-top`, so a fixed navbar never hides it
 * after the jump. The link is a sibling of the heading, not inside it, so
 * the heading's own name stays clean in a screen reader's list of headings,
 * and the link is named after its heading ("Copy link to Installation"), so
 * a list of links is not seven identical lines.
 */
export function HeadingAnchorLink({
  id,
  as: Heading = "h2",
  children,
  label = "Copy link to {heading}",
  copiedLabel = "Link to {heading} copied",
  copiedTip = "Link copied",
  failedLabel = "Could not copy. The link is in the address bar.",
  onCopy,
  offset = 80,
  reveal = "hover",
  headingClassName,
  className,
  ...props
}: HeadingAnchorLinkProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const timer = useRef<number>(undefined);
  const nameId = useId();
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const [pointed, setPointed] = useState(false);
  // The heading's text for the tooltip. The heading is a node until it is on the page, so the text is read when the tooltip opens.
  const [subject, setSubject] = useState("");
  const [heard, setHeard] = useState({ id: 0, text: "" });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const subjectNow = () => heading.current?.textContent?.trim() ?? "";

  async function copy(event: MouseEvent<HTMLAnchorElement>) {
    // A click that means "open in a new tab" is the browser's business.
    if (!id || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    // The jump itself is left to the browser, which puts the fragment in the address bar and scrolls to the heading.
    const url = new URL(`#${encodeURIComponent(id)}`, window.location.href).href;
    const ok = await writeText(url, link.current);
    setState(ok ? "copied" : "failed");
    setHeard((previous) => ({ id: previous.id + 1, text: ok ? copiedLabel.replace("{heading}", subjectNow()) : failedLabel }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 2000);
    if (ok) onCopy?.(url);
  }

  // The link is named from three parts that the browser puts together: what the label says before the heading, the heading itself (referenced, so it is always current and right on the server) and what the label says after it.
  const slot = label.indexOf("{heading}");
  const lead = (slot < 0 ? label : label.slice(0, slot)).trim();
  const trail = slot < 0 ? "" : label.slice(slot + "{heading}".length).trim();
  const named = [lead ? `${nameId}-lead` : "", id ?? "", trail ? `${nameId}-trail` : ""].filter(Boolean).join(" ");

  const tip = state === "copied" ? copiedTip : state === "failed" ? failedLabel : label.replace("{heading}", subject);
  return (
    <div data-slot="heading-anchor-link" className={cn("group/heading font-semibold tracking-[-0.02em] text-balance text-foreground", SIZE[Heading], className)} {...props}>
      <Heading ref={heading} id={id} style={{ scrollMarginTop: offset }} className={cn("inline", headingClassName)}>
        {children}
      </Heading>
      {id ? (
        <>
          {lead ? (
            <span id={`${nameId}-lead`} hidden>
              {lead}
            </span>
          ) : null}
          {trail ? (
            <span id={`${nameId}-trail`} hidden>
              {trail}
            </span>
          ) : null}
          <TooltipProvider delayDuration={200}>
            <Tooltip
              open={pointed || state !== "idle"}
              onOpenChange={(next) => {
                if (next) setSubject(subjectNow());
                setPointed(next);
              }}
            >
              <TooltipTrigger asChild>
                <a
                  ref={link}
                  href={`#${encodeURIComponent(id)}`}
                  aria-labelledby={named}
                  // The name already says it; the tooltip only repeats it, and what happened is said by the status below.
                  aria-describedby={undefined}
                  data-state={state}
                  onClick={(event) => void copy(event)}
                  className={cn(
                    "ml-1.5 inline-flex size-7 items-center justify-center rounded-md align-middle text-muted-foreground no-underline outline-none",
                    "transition-[opacity,color,background-color] duration-150 hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                    "[&_svg]:size-4",
                    reveal === "always" || state !== "idle" ? "opacity-100" : "opacity-0 group-focus-within/heading:opacity-100 group-hover/heading:opacity-100 [@media(hover:none)]:opacity-100",
                  )}
                >
                  {state === "copied" ? <IconCheck /> : <IconHash />}
                </a>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={6}>
                {tip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <span role="status" className="sr-only">
            <span key={heard.id}>{heard.text}</span>
          </span>
        </>
      ) : null}
    </div>
  );
}
