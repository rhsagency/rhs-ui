"use client";

import { useState, type ReactNode } from "react";

import { IconCheck, IconCopy, IconRefresh, IconSparkle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiMessageProps {
  role: "user" | "assistant";
  /** The text of the message, used for copying. */
  text: string;
  /** Rendered content; defaults to the text in paragraphs. */
  children?: ReactNode;
  /** Who is speaking, for the label above the message. */
  name?: string;
  /** Shown while the answer is still arriving: a caret after the text. */
  streaming?: boolean;
  onRegenerate?: () => void;
  className?: string;
}

/**
 * One turn of a conversation with an assistant. User turns sit right in a
 * bubble; assistant turns sit left without one, like a document, with copy
 * and regenerate under them once the answer is complete.
 */
export function AiMessage({ role, text, children, name, streaming = false, onRegenerate, className }: AiMessageProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  const body = children ?? text.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>);
  if (role === "user") {
    return (
      <div data-slot="ai-message" data-role="user" className={cn("flex justify-end", className)}>
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5 text-sm leading-relaxed [&_p+p]:mt-2">
          <span className="sr-only">{name ?? "You"}: </span>
          {body}
        </div>
      </div>
    );
  }
  const action = "inline-flex size-7 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-3.5";
  return (
    <div data-slot="ai-message" data-role="assistant" className={cn("flex gap-3", className)}>
      <span aria-hidden="true" className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border [&_svg]:size-3.5">
        <IconSparkle />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{name ?? "Assistant"}</p>
        <div aria-live={streaming ? "polite" : undefined} aria-busy={streaming} className="mt-1 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.8125rem] [&_li]:ml-4 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-2">
          {body}
          {streaming ? <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 bg-foreground motion-safe:animate-pulse" /> : null}
        </div>
        {streaming ? null : (
          <div className="mt-2 flex gap-1">
            <button type="button" onClick={copy} className={action} aria-label={copied ? "Copied" : "Copy answer"}>
              {copied ? <IconCheck /> : <IconCopy />}
            </button>
            {onRegenerate ? (
              <button type="button" onClick={onRegenerate} className={action} aria-label="Regenerate answer">
                <IconRefresh />
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
