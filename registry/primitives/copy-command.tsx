"use client";

import { useState, type KeyboardEvent } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CopyCommandProps {
  /** One command per package manager, in the order of the switch: { pnpm: "pnpm add x", npm: "npm i x" }. */
  commands: Readonly<Record<string, string>>;
  /** The manager shown first; defaults to the first key. */
  defaultManager?: string;
  className?: string;
}

/**
 * An install line with a package-manager switch and a copy button: pick
 * pnpm, npm, yarn or bun and the command follows. The switch is a radio
 * group, the copy button announces "Copied", and long commands scroll
 * sideways inside the box instead of widening the page.
 */
export function CopyCommand({ commands, defaultManager, className }: CopyCommandProps) {
  const managers = Object.keys(commands);
  const [manager, setManager] = useState(defaultManager ?? managers[0] ?? "");
  const [copied, setCopied] = useState(false);
  const command = commands[manager] ?? "";
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  // Arrow keys move the choice, like any radio group; only the chosen one is a tab stop.
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = managers[(managers.indexOf(manager) + step + managers.length) % managers.length] ?? manager;
    setManager(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-manager="${next}"]`)?.focus();
  }
  return (
    <div data-slot="copy-command" className={cn("relative w-full max-w-xl overflow-clip rounded-xl border border-border bg-card", className)}>
      <div role="radiogroup" aria-label="Package manager" onKeyDown={onKeyDown} className="flex gap-1 border-b border-border px-2 pt-2">
        {managers.map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={name === manager}
            tabIndex={name === manager ? 0 : -1}
            data-manager={name}
            onClick={() => setManager(name)}
            className="-mb-px rounded-t-md border-b-2 border-transparent px-2.5 pb-1.5 font-mono text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-checked:border-foreground aria-checked:text-foreground"
          >
            {name}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 py-2 pr-2 pl-4">
        <code className="relative min-w-0 flex-1 overflow-x-auto py-1.5 font-mono text-sm whitespace-nowrap"><span aria-hidden="true" className="mr-2 text-muted-foreground select-none">$</span>{command}</code>
        <button type="button" onClick={copy} aria-label={copied ? "Copied" : "Copy command"} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4">
          {copied ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
        </button>
        <span role="status" className="sr-only">{copied ? "Command copied" : ""}</span>
      </div>
    </div>
  );
}
