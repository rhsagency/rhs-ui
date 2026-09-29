"use client";

import { useState } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CodeBlockProps {
  code: string;
  /** Shown in the header: "app/page.tsx". */
  filename?: string;
  /** Shown in the header when there is no filename: "bash", "tsx". */
  language?: string;
  showLineNumbers?: boolean;
  /** Line numbers (from 1) to draw attention to. */
  highlight?: readonly number[];
  className?: string;
}

/**
 * Code to read and copy: a header with the file name and a copy button that
 * confirms, optional line numbers that are not copied with the code, and
 * highlighted lines. It does not colour syntax; pair it with a highlighter
 * on the server if you want that, and pass the plain text here.
 */
export function CodeBlock({ code, filename, language, showLineNumbers = false, highlight = [], className }: CodeBlockProps) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const lines = code.replace(/\n$/, "").split("\n");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    setTimeout(() => setCopied("idle"), 1600);
  };
  return (
    <figure data-slot="code-block" className={cn("overflow-hidden rounded-lg border border-border bg-muted/40", className)}>
      <figcaption className="flex h-10 items-center justify-between gap-3 border-b border-border px-4">
        <span className="truncate font-mono text-xs text-muted-foreground">{filename ?? language ?? "Code"}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied === "done" ? "Copied" : "Copy code"}
          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {copied === "done" ? <IconCheck size={14} /> : <IconCopy size={14} />}
          <span aria-live="polite">{copied === "done" ? "Copied" : copied === "failed" ? "Copy failed" : "Copy"}</span>
        </button>
      </figcaption>
      <pre className="overflow-x-auto py-3 font-mono text-[0.8125rem] leading-6" tabIndex={0}>
        <code>
          {lines.map((line, index) => (
            <span key={index} className={cn("flex px-4", highlight.includes(index + 1) && "bg-foreground/[0.06] shadow-[inset_2px_0_0] shadow-foreground")}>
              {showLineNumbers ? (
                <span aria-hidden="true" className="mr-4 inline-block w-6 shrink-0 text-right text-muted-foreground/60 select-none">
                  {index + 1}
                </span>
              ) : null}
              <span className="whitespace-pre">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
