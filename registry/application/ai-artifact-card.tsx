"use client";

import { useState, type ReactNode } from "react";

import { IconCheck, IconCode, IconCopy, IconDownload, IconFileText, IconMaximize } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AiArtifactCardProps {
  /** What the assistant made: "Q2 launch plan". */
  title: string;
  kind: "document" | "code";
  /** "Markdown, 1.2k words", "TypeScript, 84 lines". */
  meta?: string;
  /** The raw content, for copy and download. */
  content: string;
  /** A rendered preview; the raw content is shown when left out. */
  preview?: ReactNode;
  /** File name for the download. */
  filename: string;
  /** Open it in a side panel or a full view. */
  onOpen?: () => void;
  className?: string;
}

/**
 * The card an assistant leaves in the chat when it made something bigger
 * than a message: a document or a piece of code with a faded preview, and
 * open, copy and download. Copy says "Copied" in words; download is a real
 * file from the content, made in the browser.
 */
export function AiArtifactCard({ title, kind, meta, content, preview, filename, onOpen, className }: AiArtifactCardProps) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function download() {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  const action = "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4";
  return (
    <article data-slot="ai-artifact-card" className={cn("relative w-full max-w-md overflow-clip rounded-2xl border border-border bg-background", className)}>
      <header className="flex items-center gap-3 border-b border-border p-3 pl-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-4.5">{kind === "code" ? <IconCode /> : <IconFileText />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          {meta ? <span className="block truncate text-xs text-muted-foreground">{meta}</span> : null}
        </span>
        {onOpen ? <button type="button" onClick={onOpen} aria-label={`Open ${title}`} className={action}><IconMaximize /></button> : null}
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : `Copy ${title}`} className={action}>{copied ? <IconCheck /> : <IconCopy />}</button>
        <button type="button" onClick={download} aria-label={`Download ${filename}`} className={action}><IconDownload /></button>
      </header>
      <div className="relative max-h-44 overflow-clip p-4 text-sm [mask-image:linear-gradient(#000_60%,transparent)]">
        {preview ?? <pre className={cn("whitespace-pre-wrap", kind === "code" && "font-mono text-[0.8125rem]")}>{content}</pre>}
      </div>
      <span role="status" className="sr-only">{copied ? "Copied to the clipboard" : ""}</span>
    </article>
  );
}
