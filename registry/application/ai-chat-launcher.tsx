"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconClose, IconMessageCircle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiChatLauncherProps {
  /** The assistant's name in the header: "Ask Ledger". */
  title: string;
  /** A line under the title: "Answers from our help centre". */
  subtitle?: string;
  /** The chat itself: a thread and a prompt input, from the AI items. */
  children: ReactNode;
  /** A dot on the button when there is an unread reply. */
  unread?: boolean;
  className?: string;
}

/**
 * The floating "ask us" button in a corner of the site, opening a compact
 * chat panel above it. A disclosure, not a modal: the page stays usable,
 * Escape closes it and focus goes back to the button. Fixed to the corner by
 * default; pass className="absolute" to keep it inside a container.
 */
export function AiChatLauncher({ title, subtitle, children, unread = false, className }: AiChatLauncherProps) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("textarea, input, button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div data-slot="ai-chat-launcher" className={cn("fixed right-5 bottom-5 z-40 flex flex-col items-end gap-3", className)}>
      {open ? (
        <div ref={panel} id="ai-chat-launcher-panel" role="region" aria-label={title} className="flex h-[min(34rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-clip rounded-3xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <p className="font-medium">{title}</p>
              {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
            <button type="button" onClick={() => { setOpen(false); button.current?.focus(); }} aria-label="Close chat" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconClose /></button>
          </div>
          <div className="min-h-0 flex-1">{children}</div>
        </div>
      ) : null}
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="ai-chat-launcher-panel"
        aria-label={open ? "Close chat" : `Open chat: ${title}`}
        className="relative inline-flex size-14 items-center justify-center rounded-full bg-foreground text-background shadow-xl outline-none transition-transform hover:scale-105 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none [&_svg]:size-6"
      >
        {open ? <IconClose /> : <IconMessageCircle />}
        {unread && !open ? <span className="absolute top-1 right-1 size-3 rounded-full bg-destructive ring-2 ring-background"><span className="sr-only">New reply</span></span> : null}
      </button>
    </div>
  );
}
