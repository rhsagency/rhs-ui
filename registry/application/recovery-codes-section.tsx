"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconCheck, IconCopy, IconDownload, IconPrinter } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { InlineConfirm } from "@rhs-ui/primitives/inline-confirm";
import { cn } from "@/lib/utils";

/** A recovery code and whether it has been spent. */
export interface RecoveryCode {
  code: string;
  used?: boolean;
}

export interface RecoveryCodesSectionProps {
  /** The codes. A plain string is an unused code; use { code, used } to show which were spent. */
  codes: readonly (string | RecoveryCode)[];
  /** Called with the unused codes after they are on the clipboard. */
  onCopy?: (codes: string[]) => void;
  /** Called with the unused codes when Download is pressed. Without it the block saves a text file itself. */
  onDownload?: (codes: string[]) => void;
  /** Shows "I have saved these codes" and a Continue button that stays locked until it is ticked. */
  onContinue?: () => void;
  /** Makes a new set. Offered behind an inline confirmation that says the old codes stop working. Pass the new codes back in `codes`. */
  onRegenerate?: () => Promise<void> | void;
  /** The heading, "Save your recovery codes" while Continue is offered, "Recovery codes" otherwise. */
  title?: string;
  /** The line under the heading that fits the same two cases. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

type Note = "copied" | "copy-failed" | "regenerated" | "regenerate-failed";

/** Saves the codes as recovery-codes.txt through a temporary link. */
function saveAsFile(codes: string[]) {
  const url = URL.createObjectURL(new Blob([`${codes.join("\n")}\n`], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "recovery-codes.txt";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The screen that decides whether someone can get back into their account.
 * The codes are a monospaced grid, two columns while the longest code fits and
 * one when it does not, each one selectable with a single click and none ever
 * cut off; a callout says each works once; Copy all, Download and Print
 * sit right under them, and Print hides everything on the page but a plain
 * sheet of the codes. A checkbox, "I have saved these codes", unlocks
 * Continue, so it is hard to skip by accident. Spent codes are struck through
 * and read "Used" in words, and a new set is one inline confirmation away,
 * which says the old codes stop working.
 */
export function RecoveryCodesSection({ codes, onCopy, onDownload, onContinue, onRegenerate, title, description, headingLevel = 2, className }: RecoveryCodesSectionProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const id = useId();
  const [saved, setSaved] = useState(false);
  const [note, setNote] = useState<Note | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const list = codes.map((entry) => (typeof entry === "string" ? { code: entry, used: false } : { code: entry.code, used: Boolean(entry.used) }));
  const remaining = list.filter((entry) => !entry.used).map((entry) => entry.code);
  const setup = Boolean(onContinue);
  // Codes run from 8 to 24 characters in real products. How many fit side by side follows from the longest one, so a tile
  // is never narrower than its code: two columns while they fit (a monospace character is about 0.66 of the font size
  // wide with the letter spacing), one column when they do not.
  const longest = list.reduce((most, entry) => Math.max(most, entry.code.length), 0);
  const columns = `repeat(auto-fit, minmax(min(100%, max(calc(${longest} * 0.66 * var(--code-size) + var(--code-pad)), calc(50% - 1rem))), 1fr))`;

  // A new set of codes has not been saved yet.
  const signature = list.map((entry) => entry.code).join("|");
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setSaved(false);
  }

  function say(next: Note, clearAfter = 4000) {
    window.clearTimeout(timer.current);
    setNote(next);
    timer.current = window.setTimeout(() => setNote(null), clearAfter);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(remaining.join("\n"));
      onCopy?.(remaining);
      say("copied");
    } catch {
      say("copy-failed");
    }
  }

  function print() {
    const root = document.documentElement;
    root.setAttribute("data-rhs-printing", id);
    const done = () => {
      root.removeAttribute("data-rhs-printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  }

  async function regenerate() {
    try {
      await onRegenerate?.();
      say("regenerated", 6000);
    } catch {
      say("regenerate-failed", 6000);
    }
  }

  // Print shows the sheet and nothing else: everything on the page is hidden, this instance's sheet is not.
  const printCss = `@media print{html[data-rhs-printing="${id}"],html[data-rhs-printing="${id}"] body{height:100vh!important;overflow:hidden!important}html[data-rhs-printing="${id}"] body *{visibility:hidden!important}html[data-rhs-printing="${id}"] [data-print-sheet="${id}"],html[data-rhs-printing="${id}"] [data-print-sheet="${id}"] *{visibility:visible!important}html[data-rhs-printing="${id}"] [data-print-sheet="${id}"]{position:absolute;top:0;left:0;width:100%;padding:32px;background:#fff;color:#000}}`;

  return (
    <section data-slot="recovery-codes-section" aria-labelledby={`${id}-title`} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="px-6 pt-6 pb-6">
          <CardTitle asChild className="text-lg tracking-[-0.02em]">
            <Heading id={`${id}-title`}>{title ?? (setup ? "Save your recovery codes" : "Recovery codes")}</Heading>
          </CardTitle>
          <CardDescription>
            {description ?? (setup ? "If you lose your phone, each of these signs you in once. Save them before you go on." : `${remaining.length} of ${list.length} codes left. Each one signs you in once.`)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 px-6 pb-6">
          {/* The warning keeps its icon and the spoken "Warning", on a neutral surface: a consumer's theme has no warning colour. */}
          <Callout tone={setup ? "warning" : "note"} title={setup ? "Each code works once and will not be shown again" : "Each code works once"} className={setup ? "border-border bg-muted/50" : undefined}>
            {setup ? "Keep them in a password manager, or print them and put the page somewhere safe." : "Generating a new set ends all of these, used or not."}
          </Callout>

          <ol
            aria-label="Recovery codes"
            style={{ gridTemplateColumns: columns }}
            className="grid gap-2 rounded-xl border border-border bg-muted/40 p-3 [--code-pad:1.125rem] [--code-size:0.8125rem] sm:gap-x-3 sm:p-4 sm:[--code-pad:2.125rem] sm:[--code-size:0.9375rem]"
          >
            {list.map((entry) => (
              <li
                key={entry.code}
                className={cn(
                  "flex min-h-11 flex-wrap items-center justify-between gap-x-2 gap-y-0.5 rounded-lg border border-border bg-card px-2 py-2 sm:px-4",
                  entry.used && "bg-transparent text-muted-foreground",
                )}
              >
                <code className={cn("min-w-0 font-mono text-[length:var(--code-size)] tracking-[0.04em] tabular-nums select-all [overflow-wrap:anywhere]", entry.used && "line-through decoration-muted-foreground/70")}>{entry.code}</code>
                {entry.used ? <span className="text-xs">Used</span> : null}
              </li>
            ))}
          </ol>

          {/* The status sits beside the buttons on a wide screen, so a copy never moves the page. */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <Button type="button" variant="outline" onClick={() => void copy()} disabled={!remaining.length} className="sm:min-w-28">
                {note === "copied" ? <IconCheck /> : <IconCopy />}
                {note === "copied" ? "Copied" : "Copy all"}
              </Button>
              <Button type="button" variant="outline" onClick={() => (onDownload ?? saveAsFile)(remaining)} disabled={!remaining.length}>
                <IconDownload />
                Download
              </Button>
              <Button type="button" variant="outline" onClick={print} disabled={!remaining.length} className="col-span-2 sm:col-span-1">
                <IconPrinter />
                Print
              </Button>
            </div>
            <p role="status" className={cn("min-w-0 text-sm text-muted-foreground empty:hidden", note === "copied" ? "flex-1" : "basis-full")}>
              {note === "copied" ? `${remaining.length} ${remaining.length === 1 ? "code" : "codes"} copied.` : null}
              {note === "copy-failed" ? "Could not copy. Select the codes and copy them by hand." : null}
              {note === "regenerated" ? "New codes are ready. The old ones no longer work." : null}
              {note === "regenerate-failed" ? <span className="text-destructive">We could not make new codes. Your old ones still work.</span> : null}
            </p>
          </div>

          {onRegenerate ? (
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border pt-5">
              <p className="text-sm text-muted-foreground">Lost your codes, or used most of them?</p>
              <InlineConfirm question="The old codes stop working. Generate new ones?" confirmLabel="Generate" onConfirm={regenerate} className="max-w-full flex-wrap [&>span]:text-foreground">
                Generate new codes
              </InlineConfirm>
            </div>
          ) : null}
        </CardContent>

        {setup ? (
          <div data-slot="recovery-codes-footer" className="flex flex-col gap-4 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Checkbox id={`${id}-saved`} checked={saved} onCheckedChange={(checked) => setSaved(checked === true)} />
              <label htmlFor={`${id}-saved`} className="text-sm font-medium select-none">
                I have saved these codes
              </label>
            </div>
            <Button type="button" onClick={onContinue} disabled={!saved} aria-describedby={saved ? undefined : `${id}-locked`}>
              Continue
            </Button>
            <span id={`${id}-locked`} className="sr-only">
              Tick the box to confirm you saved the codes, then Continue unlocks.
            </span>
          </div>
        ) : null}
      </Card>

      {/* What Print shows: a plain sheet that is hidden on screen. */}
      <style dangerouslySetInnerHTML={{ __html: printCss }} />
      <div data-print-sheet={id} aria-hidden="true" className="hidden print:block">
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Recovery codes</h2>
        <p style={{ fontSize: 13, margin: "8px 0 24px" }}>Each code works once. Keep this page somewhere safe and cross a code out when you use it.</p>
        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px", fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 18 }}>
          {remaining.map((code) => (
            <li key={code} style={{ border: "1px solid #000", padding: "10px 14px" }}>
              {code}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
