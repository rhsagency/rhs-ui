"use client";

import { useState } from "react";

import { SearchHero } from "@rhs-ui/marketing/search-hero";

export default function Demo(): React.JSX.Element {
  const [query, setQuery] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-6xl px-6">
      <SearchHero
        title="How can we help?"
        description="Answers from the team that builds Ledger, updated every week."
        label="Search the help centre"
        placeholder="Try “export to CSV” or “invite a guest”"
        popular={["Billing", "Two-step sign-in", "Import from Trello", "API keys"]}
        onSearch={setQuery}
      />
      {query ? <p role="status" className="pb-10 text-center text-sm text-muted-foreground">Searching for “{query}”…</p> : null}
    </div>
  );
}
