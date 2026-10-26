"use client";

import { useState, type ReactNode } from "react";

import { ReactionBar, type Reaction } from "@rhs-ui/application/reaction-bar";
import { applyReaction } from "@rhs-ui/application/reaction-bar/palette";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Post({ caption, name, initials, time, text, children }: { caption: string; name: string; initials: string; time: string; text: string; children: ReactNode }) {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <article className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-xs">
        <header className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <p className="text-sm">
            <span className="font-medium">{name}</span>
            <span className="ml-2 text-xs text-muted-foreground">{time}</span>
          </p>
        </header>
        <p className="mt-2.5 text-sm leading-relaxed">{text}</p>
        <div className="mt-3.5">{children}</div>
      </article>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [rollout, setRollout] = useState<Reaction[]>([
    { emoji: "👍", count: 12, reacted: true, users: ["Tomas Brandt", "Priya Nair", "Jonas Weber"] },
    { emoji: "🎉", count: 6, users: ["Mara Okafor", "Ines Kowalski", "Leo Martins", "Sofia Rossi", "Dan Cho", "Hana Sato"] },
    { emoji: "🚀", count: 3, users: ["Leo Martins", "Dan Cho", "Hana Sato"] },
    { emoji: "👀", count: 1, users: ["Priya Nair"] },
  ]);
  const [limit, setLimit] = useState<Reaction[]>([
    { emoji: "👍", count: 8, users: ["Mara Okafor", "Leo Martins"] },
    { emoji: "❤️", count: 5, reacted: true, users: ["Priya Nair", "Dan Cho"] },
    { emoji: "😂", count: 3, users: ["Jonas Weber", "Hana Sato"] },
    { emoji: "🙏", count: 2, users: ["Ines Kowalski", "Sofia Rossi"] },
    { emoji: "🔥", count: 1, users: ["Tomas Brandt"] },
  ]);
  const archived: Reaction[] = [
    { emoji: "👍", count: 9, users: ["Mara Okafor", "Leo Martins", "Dan Cho"] },
    { emoji: "✅", count: 4, users: ["Priya Nair", "Hana Sato"] },
  ];

  return (
    <div className="mx-auto grid w-full max-w-lg gap-7">
      <Post
        caption="Press a chip, or add your own. This server refuses the rocket, so the bar puts it back and says so."
        name="Ana Reyes"
        initials="AR"
        time="10:42"
        text="The new onboarding checklist is live for 20% of accounts. Activation after the first day is up six points, and support has not seen a single new ticket."
      >
        <ReactionBar
          reactions={rollout}
          onToggle={async (emoji, reacted) => {
            await wait(450);
            if (emoji === "🚀") throw new Error("The server refused this reaction.");
            setRollout((list) => applyReaction(list, emoji, reacted));
          }}
        />
      </Post>
      <Post
        caption="At the limit (max 5): the palette only lets you toggle what is already there."
        name="Tomas Brandt"
        initials="TB"
        time="Yesterday"
        text="Friday demo moved to 15:00 so the Lisbon team can join. Notes will be in the channel afterwards."
      >
        <ReactionBar
          max={5}
          reactions={limit}
          onToggle={async (emoji, reacted) => {
            await wait(250);
            setLimit((list) => applyReaction(list, emoji, reacted));
          }}
        />
      </Post>
      <Post caption="Read only, for an archived thread." name="Priya Nair" initials="PN" time="3 weeks ago" text="Closing this thread: the Kestrel migration shipped on schedule and the old endpoints are retired.">
        <ReactionBar disabled reactions={archived} onToggle={() => undefined} />
      </Post>
    </div>
  );
}
