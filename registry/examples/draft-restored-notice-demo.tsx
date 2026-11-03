"use client";

import { useEffect, useState, type ReactNode } from "react";

import { DraftRestoredNotice, useLocalDraft, type LocalDraft } from "@rhs-ui/application/draft-restored-notice";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

const ZONE = "Europe/Amsterdam";
const KEY = "demo-post";

interface Post {
  title: string;
  body: string;
}

const EMPTY: Post = { title: "", body: "" };

/** What a crashed tab would have left behind: a draft saved eighteen minutes ago. Written once, before the editor first looks. */
function leaveADraft(): void {
  try {
    const key = `rhs-ui-draft:${KEY}`;
    if (window.localStorage.getItem(key)) return;
    const value: Post = {
      title: "Q4 planning update",
      body: "Hi all, a short note before Thursday's planning session. Halcyon's renewals are tracking ahead of plan, the Kestrel migration moves to the second week of December, and we need two volunteers to own the onboarding checklist.",
    };
    window.localStorage.setItem(key, JSON.stringify({ v: 1, savedAt: Date.now() - 18 * 60_000, value }));
  } catch {
    // Storage is blocked: the demo simply starts without a draft.
  }
}

function wordsIn(post: Post): number {
  return `${post.title} ${post.body}`.split(/\s+/).filter(Boolean).length;
}

function Editor({ onSaved }: { onSaved: () => void }): React.JSX.Element {
  const [post, setPost] = useState<Post>(EMPTY);
  const [saving, setSaving] = useState(false);
  const { draft, clear } = useLocalDraft<Post>(KEY, post);
  // What the notice talks about. It is kept apart from `draft`, which `clear()` empties at once, so the notice can fold away before it leaves the page.
  const [restored, setRestored] = useState<LocalDraft<Post> | null>(null);

  // A draft was waiting: put it in the form. The notice below says so and lets the person keep it or start over.
  useEffect(() => {
    if (!draft) return;
    setPost(draft.value);
    setRestored(draft);
  }, [draft]);

  async function save() {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setSaving(false);
    // Saved for real: the copy on this device is no longer a draft.
    clear();
    setPost(EMPTY);
    onSaved();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="border-b border-border px-5 py-3.5">
        <p className="text-sm font-semibold tracking-[-0.02em]">New post</p>
      </div>
      <div className="grid gap-4 p-5">
        {restored ? (
          <DraftRestoredNotice
            savedAt={restored.savedAt}
            summary={`${wordsIn(restored.value)} words`}
            timeZone={ZONE}
            locale="en-GB"
            onDiscard={() => {
              setPost(EMPTY);
              clear();
            }}
            onClosed={() => setRestored(null)}
          />
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="demo-post-title">Title</Label>
          <Input id="demo-post-title" value={post.title} onChange={(event) => setPost({ ...post, title: event.target.value })} placeholder="What is this about?" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="demo-post-body">Message</Label>
          <Textarea id="demo-post-body" rows={5} value={post.body} onChange={(event) => setPost({ ...post, body: event.target.value })} placeholder="Write something. It is kept on this device as you type." />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3">
        <p className="text-xs text-muted-foreground tabular-nums">{wordsIn(post)} words</p>
        <Button type="button" size="sm" loading={saving} disabled={!post.title.trim() && !post.body.trim()} onClick={() => void save()}>
          Publish
        </Button>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  // Written during the first render on the client, so it is in storage before the editor's own effect reads it. The server render skips it.
  useState(() => {
    if (typeof window !== "undefined") leaveADraft();
    return true;
  });
  const [round, setRound] = useState(0);
  const [saved, setSaved] = useState(false);

  return (
    <div className="grid w-full max-w-lg gap-9">
      <Case caption="A draft was waiting, so the form already holds it and the notice says when it was saved and how much it holds. Type something, then close the tab below: the copy is kept as you type, a moment after the last key.">
        <Editor key={round} onSaved={() => setSaved(true)} />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSaved(false);
              setRound((count) => count + 1);
            }}
          >
            Close the tab and come back
          </Button>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {saved ? "Published: the draft on this device was cleared." : "Keep draft folds the notice away. Start over asks once more before it deletes."}
          </p>
        </div>
      </Case>

      <Case caption="From another day, the notice writes the day as well. The summary can be any short phrase.">
        <DraftRestoredNotice savedAt="2026-11-01T14:05:00Z" now="2026-11-02T11:00:00Z" summary="3 fields changed" timeZone={ZONE} locale="en-GB" />
      </Case>
    </div>
  );
}
