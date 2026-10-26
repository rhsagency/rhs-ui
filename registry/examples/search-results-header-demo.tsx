"use client";

import { useState, type ReactNode } from "react";

import { SearchResultsHeader, type SearchCategory } from "@rhs-ui/commerce/search-results-header";
import { EmptySearch } from "@rhs-ui/primitives/empty-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

const CATEGORIES: readonly SearchCategory[] = [
  { id: "all", label: "All", count: 42 },
  { id: "shirts", label: "Shirts", count: 24 },
  { id: "trousers", label: "Trousers", count: 11 },
  { id: "accessories", label: "Accessories", count: 7 },
];

function SortBy(): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort by</span>
      <Select defaultValue="relevance">
        <SelectTrigger size="sm" aria-label="Sort by" className="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">Relevance</SelectItem>
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="price-asc">Price, low to high</SelectItem>
          <SelectItem value="price-desc">Price, high to low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function Section({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="border-t border-border py-4 first:border-t-0 first:pt-0">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [category, setCategory] = useState("all");
  const [term, setTerm] = useState("");
  const active = CATEGORIES.find((entry) => entry.id === category) ?? CATEGORIES[0];

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 px-6 py-8">
      <Section caption="The top of a results page: the count in the h1, tabs with counts, related searches and a sort menu">
        <SearchResultsHeader
          headingAs="h2"
          query="linen shirt"
          total={42}
          categories={CATEGORIES}
          activeCategory={category}
          onCategoryChange={setCategory}
          related={["linen trousers", "overshirt", "flax summer", "stone linen"]}
          onSearch={setTerm}
          sort={<SortBy />}
          locale="en-GB"
        />
        <div role="status" className="grid min-h-24 place-items-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          {term ? `You would search for “${term}” now.` : category === CATEGORIES[0]?.id ? `All ${active?.count ?? 0} results would be listed here.` : `The ${active?.count ?? 0} ${active?.label.toLowerCase() ?? ""} would be listed here.`}
        </div>
      </Section>

      <Section caption="The shop fixed a typo: it says so, and offers the search as it was typed">
        <SearchResultsHeader
          headingAs="h2"
          query="shrit"
          correctedQuery="shirt"
          total={86}
          categories={[
            { id: "all", label: "All", count: 86 },
            { id: "shirts", label: "Shirts", count: 58 },
            { id: "tops", label: "Tops", count: 21 },
            { id: "accessories", label: "Accessories", count: 7 },
          ]}
          related={["shirt dress", "linen shirt", "overshirt"]}
          locale="en-GB"
        />
      </Section>

      <Section caption="Nothing found: the heading stays honest, the tabs go, the results area takes over">
        <SearchResultsHeader headingAs="h2" query="linnen shrt" total={0} locale="en-GB" />
        {/* The heading above already says what was not found, so the empty state keeps its own title for screen readers only and goes straight to the help. */}
        <EmptySearch
          className="pt-0 pb-8 [&>p:first-of-type]:sr-only"
          query="linnen shrt"
          suggestions={[
            { label: "linen shirt", href: "#linen-shirt" },
            { label: "shirt", href: "#shirt" },
          ]}
          action={
            <p className="text-muted-foreground">
              Looking for something we do not list? <a href="#ask" className="font-medium text-foreground underline underline-offset-4">Ask our stylists</a>
            </p>
          }
        />
      </Section>
    </div>
  );
}
