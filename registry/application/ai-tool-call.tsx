"use client";

import { useState } from "react";

import { IconCheck, IconChevronDown, IconSpinner, IconWarning, IconWrench } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export interface AiToolCallProps {
  /** The tool's name as people should read it: "Search the web". */
  name: string;
  status: "running" | "done" | "error";
  /** The input the model sent, shown as JSON. */
  input?: unknown;
  /** The result, shown as JSON or text. */
  output?: unknown;
  /** One line about the result: "12 results", "Timed out after 30 s". */
  summary?: string;
  className?: string;
}

function format(value: unknown) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

/**
 * A tool the assistant used, as a compact row: what it is doing, whether it
 * worked, and the raw input and output folded underneath for people who
 * want to check. Status is in the icon and in words.
 */
export function AiToolCall({ name, status, input, output, summary, className }: AiToolCallProps) {
  const [open, setOpen] = useState(false);
  const icon = status === "running" ? <IconSpinner className="motion-safe:animate-spin" /> : status === "done" ? <IconCheck /> : <IconWarning />;
  const word = status === "running" ? "Running" : status === "done" ? "Done" : "Failed";
  const hasDetail = input !== undefined || output !== undefined;
  return (
    <Collapsible open={open} onOpenChange={setOpen} data-slot="ai-tool-call" data-status={status} className={cn("rounded-xl border border-border text-sm data-[status=error]:border-destructive/40", className)}>
      <CollapsibleTrigger disabled={!hasDetail} className="group flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-default">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted [&_svg]:size-3.5"><IconWrench /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{name}</span>
          {summary ? <span className="block truncate text-xs text-muted-foreground">{summary}</span> : null}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5", status === "error" && "text-destructive")} aria-live="polite">
          {icon}
          {word}
        </span>
        {hasDetail ? <span className="text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 [&_svg]:size-3.5"><IconChevronDown /></span> : null}
      </CollapsibleTrigger>
      {hasDetail ? (
        <CollapsibleContent>
          <div className="grid gap-3 border-t border-border p-3">
            {input !== undefined ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Input</p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">{format(input)}</pre>
              </div>
            ) : null}
            {output !== undefined ? (
              <div>
                <p className="mb-1 text-xs text-muted-foreground">Output</p>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 font-mono text-xs">{format(output)}</pre>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  );
}
