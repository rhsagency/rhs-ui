"use client";

import { useState, type ReactNode } from "react";

import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { PinnableList, type PinnableItem } from "@rhs-ui/primitives/pinnable-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const PROJECTS: readonly PinnableItem[] = [
  { id: "q3", label: "Q3 planning" },
  { id: "brand", label: "Brand refresh" },
  { id: "onboarding", label: "Onboarding revamp" },
  { id: "pricing", label: "Pricing experiments" },
  { id: "security", label: "Security review" },
  { id: "partners", label: "Partner programme" },
  { id: "mobile", label: "Mobile app v2" },
  { id: "report", label: "Annual report" },
];

const META: Readonly<Record<string, string>> = {
  q3: "Edited 12 minutes ago, Northwind Traders",
  brand: "Edited 2 hours ago, Halcyon Labs",
  onboarding: "Edited yesterday, Mirror Labs",
  pricing: "Edited 3 days ago, Kestrel Analytics",
  security: "Edited last week, Lumen Energy",
  partners: "Edited last week, Fjord Freight",
  mobile: "Edited 2 weeks ago, Oak Lane Bakery",
  report: "Edited in September, Northwind Traders",
};

type Chat = { id: string; label: string; last: string; time: string };

const CHATS: readonly (PinnableItem & Chat)[] = [
  { id: "mara", label: "Mara Okafor", last: "The invoice export looks right to me.", time: "14:02" },
  { id: "halcyon", label: "Halcyon team", last: "Jonas: shipping the fix after lunch", time: "13:40" },
  { id: "jonas", label: "Jonas Weber", last: "Can you review the checkout branch?", time: "11:48" },
  { id: "rota", label: "Support rota", last: "Priya swapped Thursday with Lucas", time: "Yesterday" },
  { id: "priya", label: "Priya Nair", last: "Thanks, that solved it.", time: "Mon" },
];

export default function Demo(): React.JSX.Element {
  const [pinned, setPinned] = useState<readonly string[]>(["halcyon"]);

  return (
    <div className="mx-auto grid w-full max-w-xl gap-10">
      <Example caption="Limited to three pins: the other pin buttons switch off, and the title says why">
        <PinnableList
          aria-label="Projects"
          items={PROJECTS}
          defaultPinned={["q3", "onboarding", "security"]}
          maxPinned={3}
          renderItem={(item) => (
            <div className="min-w-0">
              <p className="truncate text-sm leading-5 font-medium">{item.label}</p>
              <p className="truncate text-xs leading-4 text-muted-foreground">{META[item.id]}</p>
            </div>
          )}
        />
      </Example>

      <Example caption="Controlled, no limit: you hold the pinned ids, and pinning moves the row up">
        <PinnableList
          aria-label="Conversations"
          items={CHATS}
          pinned={pinned}
          onPinnedChange={setPinned}
          renderItem={(item) => {
            const chat = CHATS.find((entry) => entry.id === item.id);
            return (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{initialsOf(item.label)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm leading-5 font-medium">{item.label}</p>
                  <p className="truncate text-xs leading-4 text-muted-foreground">{chat?.last}</p>
                </div>
                <span className="shrink-0 self-start pt-0.5 text-xs text-muted-foreground tabular-nums">{chat?.time}</span>
              </div>
            );
          }}
        />
      </Example>
    </div>
  );
}
