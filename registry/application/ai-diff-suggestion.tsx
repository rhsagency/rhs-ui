import { IconCheck, IconClose, IconSparkle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface AiDiffSuggestionProps {
  /** The text as it is now. */
  before: string;
  /** What the model suggests instead. */
  after: string;
  /** Why: "Shorter and in your brand voice." */
  reason?: string;
  onAccept: () => void;
  onReject: () => void;
  className?: string;
}

/** A word-level diff: common words stay, removed words and added words are marked. */
export function wordDiff(before: string, after: string): { kind: "same" | "add" | "remove"; text: string }[] {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
  const out: { kind: "same" | "add" | "remove"; text: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { out.push({ kind: "same", text: a[i]! }); i++; j++; }
    else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) out.push({ kind: "remove", text: a[i++]! });
    else out.push({ kind: "add", text: b[j++]! });
  }
  while (i < a.length) out.push({ kind: "remove", text: a[i++]! });
  while (j < b.length) out.push({ kind: "add", text: b[j++]! });
  return out;
}

/**
 * An AI edit shown as a change, not a replacement: removed words struck
 * through, added words marked, the reason in one line, and accept or reject.
 * Changes are spoken as "removed" and "added" so the review works without
 * seeing the colours.
 */
export function AiDiffSuggestion({ before, after, reason, onAccept, onReject, className }: AiDiffSuggestionProps) {
  const parts = wordDiff(before, after);
  return (
    <div data-slot="ai-diff-suggestion" className={cn("rounded-2xl border border-border p-4", className)}>
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><IconSparkle aria-hidden="true" className="size-3.5" />Suggested edit{reason ? <span className="font-normal">: {reason}</span> : null}</p>
      <p className="mt-3 text-sm leading-relaxed">
        {parts.map((part, index) =>
          part.kind === "same" ? <span key={index}>{part.text}</span> : part.kind === "remove" ? (
            /^\s+$/.test(part.text) ? null : <del key={index} className="rounded bg-destructive/10 px-0.5 text-destructive decoration-destructive/60"><span className="sr-only">removed: </span>{part.text}</del>
          ) : (
            /^\s+$/.test(part.text) ? <span key={index}>{part.text}</span> : <ins key={index} className="rounded bg-foreground/10 px-0.5 no-underline"><span className="sr-only">added: </span>{part.text}</ins>
          ),
        )}
      </p>
      <div className="mt-4 flex gap-2">
        <Button size="sm" onClick={onAccept}><IconCheck /> Accept</Button>
        <Button size="sm" variant="ghost" onClick={onReject}><IconClose /> Reject</Button>
      </div>
    </div>
  );
}
