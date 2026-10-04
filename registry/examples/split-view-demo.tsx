"use client";

import { useState } from "react";

import { SplitView } from "@rhs-ui/primitives/split-view";

const MAIL = [
  { id: "1", from: "Sara Haddad", subject: "Refund for order LD-20418", body: "Hi! The customer asked for a partial refund on the apron. Can you approve it today?" },
  { id: "2", from: "Luca Romano", subject: "Exports are fast again", body: "The fix is live. Exports above 10,000 rows now finish in under five seconds." },
  { id: "3", from: "Mei Tanaka", subject: "New empty states", body: "Designs are in the file. Would love your eyes on the onboarding one." },
];

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState<string | null>("1");
  const mail = MAIL.find((item) => item.id === open);
  return (
    <div className="mx-auto h-96 max-w-3xl overflow-clip rounded-2xl border border-border">
      <SplitView
        onBack={() => setOpen(null)}
        backLabel="Inbox"
        empty="No message selected."
        list={
          <ul className="divide-y divide-border">
            {MAIL.map((item) => (
              <li key={item.id}>
                <button type="button" onClick={() => setOpen(item.id)} aria-current={item.id === open ? "true" : undefined} className="block w-full px-4 py-3 text-left text-sm outline-none hover:bg-muted/60 focus-visible:bg-muted aria-[current=true]:bg-muted">
                  <span className="block font-medium">{item.from}</span>
                  <span className="block truncate text-muted-foreground">{item.subject}</span>
                </button>
              </li>
            ))}
          </ul>
        }
        detail={mail ? <article className="p-6"><h3 className="text-lg font-medium">{mail.subject}</h3><p className="mt-1 text-sm text-muted-foreground">From {mail.from}</p><p className="mt-5 text-sm leading-relaxed">{mail.body}</p></article> : null}
      />
    </div>
  );
}
