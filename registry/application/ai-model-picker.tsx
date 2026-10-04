"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface AiModelOption {
  id: string;
  label: string;
  /** One line on when to pick it: "Fast, for short answers". */
  description?: string;
  /** "New", "Beta". */
  badge?: string;
}

export interface AiModelPickerProps {
  models: readonly AiModelOption[];
  value: string;
  onValueChange: (id: string) => void;
  label?: string;
  className?: string;
}

/**
 * The model switch above or inside a prompt box: a compact trigger that
 * shows the current model, and a list where every option says what it is
 * good for. Built on the RHS UI Select, so it is a real listbox.
 */
export function AiModelPicker({ models, value, onValueChange, label = "Model", className }: AiModelPickerProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger size="sm" aria-label={label} className={cn("w-auto gap-2 border-transparent bg-transparent hover:bg-muted", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="min-w-64">
        {models.map((model) => (
          <SelectItem key={model.id} value={model.id} description={model.description}>
            {model.label}
            {model.badge ? <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">{model.badge}</span> : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
