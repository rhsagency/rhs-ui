"use client";

import { useId, useState } from "react";

import { IconEye, IconEyeOff, IconPlus, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  /** Mask the value: API keys, tokens. */
  secret?: boolean;
}

export interface KeyValueEditorProps {
  pairs: readonly KeyValuePair[];
  onPairsChange: (pairs: KeyValuePair[]) => void;
  keyLabel?: string;
  valueLabel?: string;
  /** Keys must match this, like environment variable names. */
  keyPattern?: RegExp;
  className?: string;
}

/**
 * Edit a list of keys and values, like environment variables, headers or
 * metadata: rows of two fields, add and remove, secret values masked with a
 * reveal toggle per row, and duplicate or malformed keys flagged in words
 * on the row they belong to. Paste "KEY=value" lines into a key field to
 * add them all at once.
 */
export function KeyValueEditor({ pairs, onPairsChange, keyLabel = "Key", valueLabel = "Value", keyPattern, className }: KeyValueEditorProps) {
  const id = useId();
  const [shown, setShown] = useState<Set<string>>(new Set());
  const update = (rowId: string, patch: Partial<KeyValuePair>) => onPairsChange(pairs.map((pair) => (pair.id === rowId ? { ...pair, ...patch } : pair)));
  const add = (extra: Omit<KeyValuePair, "id">[] = [{ key: "", value: "" }]) => onPairsChange([...pairs, ...extra.map((pair, index) => ({ ...pair, id: `${Date.now()}-${index}` }))]);
  const problem = (pair: KeyValuePair) => {
    if (!pair.key) return null;
    if (keyPattern && !keyPattern.test(pair.key)) return "Use capitals, digits and underscores.";
    if (pairs.filter((other) => other.key === pair.key).length > 1) return "This key is used twice.";
    return null;
  };
  function paste(rowId: string, text: string): boolean {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("="));
    if (lines.length < 2) return false;
    const parsed = lines.map((line) => ({ key: line.slice(0, line.indexOf("=")).trim(), value: line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "") }));
    onPairsChange([...pairs.filter((pair) => pair.id !== rowId || pair.key || pair.value), ...parsed.map((pair, index) => ({ ...pair, id: `${Date.now()}-${index}` }))]);
    return true;
  }
  const field = "h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive";
  return (
    <div data-slot="key-value-editor" className={cn("grid gap-2", className)}>
      <div aria-hidden="true" className="grid grid-cols-[1fr_1fr_4.5rem] gap-2 text-xs text-muted-foreground"><span>{keyLabel}</span><span>{valueLabel}</span></div>
      {pairs.map((pair, index) => {
        const error = problem(pair);
        const visible = !pair.secret || shown.has(pair.id);
        return (
          <div key={pair.id} className="grid gap-1">
            <div className="grid grid-cols-[1fr_1fr_4.5rem] items-center gap-2">
              <input aria-label={`${keyLabel} ${index + 1}`} value={pair.key} onChange={(event) => update(pair.id, { key: event.target.value })} onPaste={(event) => { if (paste(pair.id, event.clipboardData.getData("text"))) event.preventDefault(); }} spellCheck={false} placeholder="API_URL" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-${pair.id}` : undefined} className={field} />
              <input aria-label={`${valueLabel} ${index + 1}`} type={visible ? "text" : "password"} value={pair.value} onChange={(event) => update(pair.id, { value: event.target.value })} spellCheck={false} autoComplete="off" className={field} />
              <span className="flex">
                {pair.secret ? (
                  <button type="button" onClick={() => setShown((set) => { const next = new Set(set); if (next.has(pair.id)) next.delete(pair.id); else next.add(pair.id); return next; })} aria-label={visible ? `Hide value ${index + 1}` : `Show value ${index + 1}`} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4">{visible ? <IconEyeOff /> : <IconEye />}</button>
                ) : <span className="size-9" />}
                <button type="button" onClick={() => onPairsChange(pairs.filter((other) => other.id !== pair.id))} aria-label={`Remove ${pair.key || `row ${index + 1}`}`} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconTrash /></button>
              </span>
            </div>
            {error ? <p id={`${id}-${pair.id}`} className="text-xs text-destructive">{error}</p> : null}
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" className="justify-self-start" onClick={() => add()}><IconPlus /> Add a row</Button>
      <p className="text-xs text-muted-foreground">Tip: paste lines of KEY=value into a key field to add them all.</p>
    </div>
  );
}
