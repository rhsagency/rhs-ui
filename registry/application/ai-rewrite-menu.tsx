"use client";

import { useState } from "react";

import { IconCheck, IconRefresh, IconSparkle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface RewriteAction {
  id: string;
  /** "Shorter", "More formal", "Fix spelling". */
  label: string;
}

export interface AiRewriteMenuProps {
  /** The text being rewritten. */
  text: string;
  actions: readonly RewriteAction[];
  /** Your model call: resolve with the rewritten text. */
  onRewrite: (actionId: string, text: string) => Promise<string>;
  /** Accept the suggestion into the field. */
  onAccept: (text: string) => void;
  className?: string;
}

/**
 * "Improve with AI" for any text field: a menu of rewrites, the suggestion
 * shown next to what it replaces with accept, try again and discard, and a
 * busy state announced while the model works. Nothing replaces the text
 * until the writer accepts it.
 */
export function AiRewriteMenu({ text, actions, onRewrite, onAccept, className }: AiRewriteMenuProps) {
  const [action, setAction] = useState<RewriteAction | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function run(next: RewriteAction) {
    setAction(next);
    setBusy(true);
    setFailed(false);
    setSuggestion(null);
    try {
      setSuggestion(await onRewrite(next.id, text));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div data-slot="ai-rewrite-menu" className={cn("grid gap-3", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-self-start" disabled={!text.trim() || busy}><IconSparkle /> Improve with AI</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          <DropdownMenuLabel>Rewrite</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {actions.map((item) => <DropdownMenuItem key={item.id} onSelect={() => void run(item)}>{item.label}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <div role="status" aria-live="polite" className="empty:hidden">
        {busy ? <p className="text-sm text-muted-foreground">{action?.label}: writing…</p> : null}
        {failed ? <p className="text-sm text-destructive">The rewrite did not come through. Try again.</p> : null}
      </div>
      {suggestion !== null && action ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><IconSparkle className="size-3.5" />{action.label}</p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">{suggestion}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { onAccept(suggestion); setSuggestion(null); }}><IconCheck /> Use this</Button>
            <Button size="sm" variant="outline" onClick={() => void run(action)}><IconRefresh /> Try again</Button>
            <Button size="sm" variant="ghost" onClick={() => setSuggestion(null)}>Discard</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
