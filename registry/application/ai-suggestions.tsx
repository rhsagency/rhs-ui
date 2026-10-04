import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AiSuggestion {
  id: string;
  label: string;
  /** The full prompt sent when chosen; defaults to the label. */
  prompt?: string;
  icon?: ReactNode;
}

export interface AiSuggestionsProps {
  suggestions: readonly AiSuggestion[];
  onSelect: (prompt: string) => void;
  /** Names the group for screen readers. */
  label?: string;
  layout?: "chips" | "grid";
  className?: string;
}

/**
 * Starting points for an empty conversation: short prompts as chips, or as a
 * two-column grid of cards with an icon. Each is a plain button.
 */
export function AiSuggestions({ suggestions, onSelect, label = "Suggested prompts", layout = "chips", className }: AiSuggestionsProps) {
  return (
    <div data-slot="ai-suggestions" role="group" aria-label={label} className={cn(layout === "chips" ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2", className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          type="button"
          onClick={() => onSelect(suggestion.prompt ?? suggestion.label)}
          className={cn(
            "inline-flex items-center gap-2 border border-border text-left text-sm transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
            layout === "chips" ? "rounded-full px-3.5 py-1.5" : "rounded-xl px-4 py-3",
          )}
        >
          {suggestion.icon}
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}
