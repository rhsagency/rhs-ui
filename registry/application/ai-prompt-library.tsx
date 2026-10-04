"use client";

import { useDeferredValue, useId, useState, type ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PromptTemplate {
  id: string;
  title: string;
  /** The prompt; {curly} words are placeholders the writer fills in. */
  prompt: string;
  category: string;
  icon?: ReactNode;
}

export interface AiPromptLibraryProps {
  prompts: readonly PromptTemplate[];
  /** Put the prompt in the composer. */
  onUse: (prompt: PromptTemplate) => void;
  className?: string;
}

/**
 * A library of ready prompts for an empty chat or a "/" menu: search, filter
 * by category, and cards that show the prompt with its {placeholders}
 * marked, so people see what they still need to fill in. Choosing one
 * hands it to your composer.
 */
export function AiPromptLibrary({ prompts, onUse, className }: AiPromptLibraryProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const categories = [...new Set(prompts.map((prompt) => prompt.category))];
  const shown = prompts.filter((prompt) => (!category || prompt.category === category) && (!deferred || `${prompt.title} ${prompt.prompt}`.toLowerCase().includes(deferred)));
  const chip = "rounded-full border border-border px-3 py-1 text-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background";
  return (
    <section data-slot="ai-prompt-library" aria-label="Prompt library" className={cn("relative grid gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Category" className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip}>All</button>
          {categories.map((item) => <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={chip}>{item}</button>)}
        </div>
        <div role="search" className="relative sm:w-56">
          <label htmlFor={id} className="sr-only">Search prompts</label>
          <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts" className="h-9 w-full rounded-lg border border-border bg-background pr-3 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        </div>
      </div>
      <p role="status" className="sr-only">{shown.length} prompts</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {shown.map((prompt) => (
          <li key={prompt.id}>
            <button type="button" onClick={() => onUse(prompt)} className="flex h-full w-full flex-col rounded-2xl border border-border p-4 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <span className="flex items-center gap-2 text-sm font-medium [&_svg]:size-4">{prompt.icon}{prompt.title}</span>
              <span className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {prompt.prompt.split(/(\{[^}]+\})/).map((part, index) => (part.startsWith("{") ? <mark key={index} className="rounded bg-foreground/10 px-1 text-foreground">{part.slice(1, -1)}</mark> : part))}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
