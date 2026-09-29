"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconClose } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TagInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange"> {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (tags: string[]) => void;
  /** At most this many tags. */
  max?: number;
  /** Returns a message to refuse a tag, or nothing to accept it. */
  validate?: (tag: string) => string | void;
  /** The field's name, for a plain form submit: the tags joined by commas in one hidden input. */
  name?: string;
}

/**
 * Several short values in one field: emails to invite, keywords, skills.
 * Enter or a comma adds the text as a tag, Backspace on an empty field
 * removes the last one, and each tag has its own remove button. Duplicates
 * are refused with a message.
 */
export function TagInput({ value, defaultValue = [], onValueChange, max = Number.POSITIVE_INFINITY, validate, name, className, placeholder = "Type and press Enter", id, ...props }: TagInputProps) {
  const own = useId();
  const inputId = id ?? own;
  const [tags, setTags] = useState<readonly string[]>(defaultValue);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const current = value ?? tags;
  const set = (next: string[]) => {
    if (value === undefined) setTags(next);
    onValueChange?.(next);
  };
  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    const problem = current.includes(tag) ? `${tag} is already in the list.` : current.length >= max ? `At most ${max}.` : validate?.(tag);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    set([...current, tag]);
    setText("");
  };
  return (
    <div data-slot="tag-input" className={cn("grid w-full gap-1.5", className)}>
      <div
        className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-xs has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40"
        onClick={(event) => (event.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus()}
      >
        {current.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded bg-muted py-0.5 pr-0.5 pl-2 text-xs font-medium">
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => set(current.filter((item) => item !== tag))}
              className="grid size-5 place-items-center rounded text-muted-foreground outline-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <IconClose size={12} />
            </button>
          </span>
        ))}
        <input
          id={inputId}
          value={text}
          placeholder={current.length ? undefined : placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => {
            setError(null);
            const typed = event.target.value;
            if (typed.includes(",")) typed.split(",").slice(0, -1).forEach(add);
            setText(typed.includes(",") ? typed.split(",").at(-1) ?? "" : typed);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(text);
            } else if (event.key === "Backspace" && !text && current.length) set(current.slice(0, -1));
          }}
          onBlur={() => add(text)}
          className="min-w-24 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground"
          {...props}
        />
      </div>
      <p id={`${inputId}-error`} role="status" className="min-h-4 text-xs text-destructive empty:hidden">
        {error}
      </p>
      {name ? <input type="hidden" name={name} value={current.join(",")} /> : null}
    </div>
  );
}
