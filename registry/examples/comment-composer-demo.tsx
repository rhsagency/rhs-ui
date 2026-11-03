"use client";

import { useState, type ReactNode } from "react";

import { CommentComposer } from "@rhs-ui/application/comment-composer";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";

interface Entry {
  id: string;
  name: string;
  time: string;
  body: string;
}

const START: readonly Entry[] = [
  { id: "c1", name: "Mara Visser", time: "Tuesday, 14:10", body: "The new onboarding copy reads well. One thing: step three still says workspace where the rest says team." },
  { id: "c2", name: "Tom Jansen", time: "Tuesday, 16:45", body: "Fixed in the draft. I also moved the invite step in front of billing, like we agreed." },
  { id: "c3", name: "Priya Nair", time: "Today, 09:20", body: "Looks good to me. Can we ship it with Thursday's release?" },
];

const ME = { name: "Sofie de Vries" };

function Comment({ entry }: { entry: Entry }): React.JSX.Element {
  return (
    <li className="flex gap-3 px-4 py-4">
      <Avatar aria-hidden="true" className="shrink-0">
        <AvatarFallback>{initialsOf(entry.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm leading-5">
          <span className="font-semibold tracking-[-0.01em]">{entry.name}</span>
          <span className="text-xs text-muted-foreground">{entry.time}</span>
        </p>
        <p className="mt-1 text-[0.9375rem] leading-6 text-pretty [overflow-wrap:anywhere]">{entry.body}</p>
      </div>
    </li>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Stands in for a request: it waits, so the busy state can be seen, and rejects when the demo is told to fail. */
async function send(fail: boolean): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  if (fail) throw new Error("The server did not answer. Check your connection and try again.");
}

export default function Demo(): React.JSX.Element {
  const [entries, setEntries] = useState<readonly Entry[]>(START);
  const [draft, setDraft] = useState("");
  const [fail, setFail] = useState(false);
  const [saved, setSaved] = useState("Looks good to me too. One question about the rollout: is it still the 12th?");

  async function post(body: string) {
    await send(fail);
    setEntries((current) => [...current, { id: `c${current.length + 1}`, name: ME.name, time: "Just now", body }]);
  }

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-xl gap-9">
        <Case caption="Click the line: it grows into a box. Cmd or Ctrl Enter sends, Escape folds an empty box, and Comment waits for text. Make the next post fail to see the text stay and an alert say why.">
          <section aria-labelledby="comment-thread" className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="comment-thread" className="text-sm font-semibold tracking-[-0.01em]">
                Launch checklist
              </h2>
              <p className="text-xs text-muted-foreground tabular-nums">{entries.length} comments</p>
            </div>
            <ul className="divide-y divide-border">
              {entries.map((entry) => (
                <Comment key={entry.id} entry={entry} />
              ))}
            </ul>
            <div className="border-t border-border bg-muted/30 p-4">
              <CommentComposer author={ME} value={draft} onChange={setDraft} onSubmit={post} maxLength={400} />
              <div className="mt-4 flex items-center gap-2.5 ps-12">
                <Switch id="demo-fail" checked={fail} onCheckedChange={setFail} aria-label="Make the next post fail" />
                <Label htmlFor="demo-fail" className="text-xs font-normal text-muted-foreground">
                  Make the next post fail
                </Label>
              </div>
            </div>
          </section>
        </Case>

        <div className="@container">
          <div className="grid gap-x-8 gap-y-9 @2xl:grid-cols-2">
            <Case caption="A draft that was kept. The value lives in your state, so it survives a re-render or a route change, and a box with text stays open.">
              <CommentComposer
                author={{ name: "Alex Kuiper" }}
                value={saved}
                onChange={setSaved}
                onSubmit={() => send(false)}
              />
            </Case>
            <Case caption="Locked, for a closed thread. Say why in the placeholder.">
              <CommentComposer author={ME} disabled placeholder="Comments are closed on this thread." onSubmit={() => undefined} />
            </Case>
          </div>
        </div>
      </div>
    </div>
  );
}
