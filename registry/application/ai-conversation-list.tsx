"use client";

import { useDeferredValue, useId, useState } from "react";

import { IconPlus, IconSearch } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  title: string;
  /** Group heading: "Today", "Last 7 days", "March". Worked out on your side. */
  group: string;
  href: string;
}

export interface AiConversationListProps {
  conversations: readonly Conversation[];
  current?: string;
  onNew: () => void;
  className?: string;
}

/**
 * The history sidebar of a chat product: a new-chat button, a search over
 * past titles, and the conversations under date headings with the open one
 * marked. Groups come from you, so "Today" means today in the reader's own
 * time zone.
 */
export function AiConversationList({ conversations, current, onNew, className }: AiConversationListProps) {
  const id = useId();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const shown = conversations.filter((c) => !deferred || c.title.toLowerCase().includes(deferred));
  const groups = [...new Set(shown.map((c) => c.group))];
  return (
    <nav data-slot="ai-conversation-list" aria-label="Conversations" className={cn("flex h-full flex-col gap-3", className)}>
      <button type="button" onClick={onNew} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4"><IconPlus aria-hidden="true" />New chat</button>
      <div role="search" className="relative">
        <label htmlFor={id} className="sr-only">Search conversations</label>
        <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-8 w-full rounded-md border border-border bg-background pr-2 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40" />
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group} className="mb-3">
            <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">{group}</p>
            <ul className="grid gap-0.5">
              {shown.filter((c) => c.group === group).map((c) => (
                <li key={c.id}><a href={c.href} aria-current={c.id === current ? "page" : undefined} className="block truncate rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:text-foreground">{c.title}</a></li>
              ))}
            </ul>
          </div>
        ))}
        {!shown.length ? <p className="px-2 text-sm text-muted-foreground">No conversation matches.</p> : null}
      </div>
    </nav>
  );
}
