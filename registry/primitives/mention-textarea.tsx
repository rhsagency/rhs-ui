"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface MentionPerson {
  id: string;
  name: string;
  /** "Design", "a.dewit": a second line in the list. */
  detail?: string;
}

export interface MentionTextareaProps {
  value: string;
  onValueChange: (value: string) => void;
  people: readonly MentionPerson[];
  label: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

/** The "@word" being typed right before the caret, if any. */
function activeQuery(text: string, caret: number): { start: number; query: string } | null {
  const match = /(^|\s)@([\p{L}\p{N}._-]{0,30})$/u.exec(text.slice(0, caret));
  return match ? { start: caret - match[2]!.length - 1, query: match[2]!.toLowerCase() } : null;
}

/**
 * A comment box that knows your team: type @ and a list of people filters as
 * you go, arrow keys move, Enter or Tab inserts "@Name", Escape closes. A
 * real combobox for assistive technology, the textarea keeps focus the whole
 * time, and the value stays plain text.
 */
export function MentionTextarea({ value, onValueChange, people, label, placeholder, rows = 4, className }: MentionTextareaProps) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<{ start: number; query: string } | null>(null);
  const [active, setActive] = useState(0);
  const matches = query ? people.filter((person) => person.name.toLowerCase().includes(query.query)).slice(0, 6) : [];
  const open = matches.length > 0;
  function update(text: string, caret: number) {
    onValueChange(text);
    setQuery(activeQuery(text, caret));
    setActive(0);
  }
  function insert(person: MentionPerson) {
    if (!query || !area.current) return;
    const caret = area.current.selectionStart;
    const next = `${value.slice(0, query.start)}@${person.name} ${value.slice(caret)}`;
    const at = query.start + person.name.length + 2;
    onValueChange(next);
    setQuery(null);
    requestAnimationFrame(() => area.current?.setSelectionRange(at, at));
  }
  function keys(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + matches.length) % matches.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      const person = matches[active];
      if (person) insert(person);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setQuery(null);
    }
  }
  return (
    <div data-slot="mention-textarea" className={cn("relative grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <textarea
        ref={area}
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => update(event.target.value, event.target.selectionStart)}
        onKeyDown={keys}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${id}-option-${active}` : undefined}
        className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
      />
      <ul id={`${id}-list`} role="listbox" aria-label="People" hidden={!open} className="absolute top-full right-0 left-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        {matches.map((person, index) => (
          <li
            key={person.id}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            onPointerDown={(event) => { event.preventDefault(); insert(person); }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-muted"
          >
            <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium">{person.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
            <span>
              <span className="block">{person.name}</span>
              {person.detail ? <span className="block text-xs text-muted-foreground">{person.detail}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
