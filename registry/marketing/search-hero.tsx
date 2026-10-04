"use client";

import { useId, type FormEvent } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface SearchHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  title: string;
  description?: string;
  /** The field's accessible name and placeholder: "Search the help centre". */
  label: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  /** Popular searches as one-click chips. */
  popular?: readonly string[];
  className?: string;
}

/**
 * An opening built around one search field: help centres, docs, marketplaces,
 * job boards. A real search form (role="search"), popular queries as chips
 * that search on click, and Enter on the field does the rest.
 */
export function SearchHero({ titleAs: Title = "h2", title, description, label, placeholder, onSearch, popular = [], className }: SearchHeroProps) {
  const id = useId();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (query) onSearch(query);
  }
  return (
    <section data-slot="search-hero" className={cn("py-16 text-center sm:py-24", className)}>
      <Title className="mx-auto max-w-2xl text-4xl font-medium leading-[1.06] tracking-[-.05em] text-balance sm:text-5xl">{title}</Title>
      {description ? <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <form role="search" onSubmit={submit} className="relative mx-auto mt-9 max-w-xl">
        <label htmlFor={id} className="sr-only">{label}</label>
        <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          id={id}
          name="q"
          type="search"
          placeholder={placeholder ?? label}
          className="h-14 w-full rounded-full border border-border bg-background pr-28 pl-13 text-base shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
        />
        <button type="submit" className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50">Search</button>
      </form>
      {popular.length ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Popular:</span>
          {popular.map((query) => (
            <button key={query} type="button" onClick={() => onSearch(query)} className="rounded-full border border-border px-3 py-1 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">{query}</button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
