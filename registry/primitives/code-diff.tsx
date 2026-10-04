import { cn } from "@/lib/utils";

export interface CodeDiffProps {
  /** The text before the change. */
  before: string;
  /** The text after the change. */
  after: string;
  filename?: string;
  className?: string;
}

type Line = { kind: "same" | "add" | "remove"; text: string; old?: number; new?: number };

/** A line diff on the longest common subsequence: small inputs, exact result. */
function diff(a: string[], b: string[]): Line[] {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
  const lines: Line[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { lines.push({ kind: "same", text: a[i]!, old: i + 1, new: j + 1 }); i++; j++; }
    else if (j < b.length && (i >= a.length || table[i]![j + 1]! >= table[i + 1]![j]!)) { lines.push({ kind: "add", text: b[j]!, new: j + 1 }); j++; }
    else { lines.push({ kind: "remove", text: a[i]!, old: i + 1 }); i++; }
  }
  return lines;
}

/**
 * Two versions of a file, unified: removed lines marked with a minus,
 * added lines with a plus, both line numbers in the gutter. The sign is
 * part of the text, so the change is clear without colour.
 */
export function CodeDiff({ before, after, filename, className }: CodeDiffProps) {
  const lines = diff(before.split("\n"), after.split("\n"));
  const added = lines.filter((line) => line.kind === "add").length;
  const removed = lines.filter((line) => line.kind === "remove").length;
  return (
    <figure data-slot="code-diff" className={cn("overflow-hidden rounded-lg border border-border font-mono text-[0.8125rem]", className)}>
      <figcaption className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2 text-xs">
        <span>{filename ?? "Changes"}</span>
        <span className="tabular-nums"><span className="text-[var(--color-success,oklch(0.55_0.15_150))]">+{added}</span> <span className="text-destructive">−{removed}</span></span>
      </figcaption>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className={cn(line.kind === "add" && "bg-[color-mix(in_oklch,var(--color-success,oklch(0.62_0.15_150))_12%,transparent)]", line.kind === "remove" && "bg-destructive/8")}>
                <td className="w-10 px-2 text-right text-muted-foreground/70 select-none tabular-nums">{line.old ?? ""}</td>
                <td className="w-10 px-2 text-right text-muted-foreground/70 select-none tabular-nums">{line.new ?? ""}</td>
                <td className="w-5 text-center text-muted-foreground select-none">{line.kind === "add" ? "+" : line.kind === "remove" ? "−" : ""}</td>
                <td className="pr-4 whitespace-pre">
                  {line.kind !== "same" ? <span className="sr-only">{line.kind === "add" ? "Added: " : "Removed: "}</span> : null}
                  {line.text || " "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
