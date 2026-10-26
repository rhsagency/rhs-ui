"use client";

import { useRef, useState } from "react";

import { CommentItem, type CommentAuthor } from "@rhs-ui/application/comment-item";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";

// A fixed "now" keeps the preview the same on every load. In an app, leave `now` out and the time reads the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();

interface Entry {
  id: string;
  author: CommentAuthor;
  badge?: string;
  createdAt: string;
  editedAt?: string;
  body: string;
  /** Written by the person looking at the page, so it can be edited and deleted. */
  own?: boolean;
  highlighted?: boolean;
  replies: Entry[];
}

const ME: CommentAuthor = { name: "Mara Okafor" };

const INITIAL: Entry[] = [
  {
    id: "c1",
    author: ME,
    badge: "Owner",
    createdAt: ago(5 * 60),
    editedAt: ago(4 * 60),
    own: true,
    body: "I went through the whole checklist with legal this morning. Three things are blocking the launch: the press embargo still reads Wednesday in the brief, the pricing page footnotes have not been signed off, and the German cookie banner is a literal translation of the English one.\n\nPriya is on the embargo, Ines owns the footnotes, and I will take the cookie banner myself today so we do not slip the freeze on Friday. If anything else turns up, put it here and tag me so it does not get lost in the channel.\n\nOne more thing for the record: the status page copy is still the draft from September. Dan, can you check it against the final incident wording before Thursday? It should say what we measured, not what we hoped.",
    replies: [
      {
        id: "c2",
        author: { name: "Leo Martins" },
        badge: "Engineering",
        createdAt: ago(4 * 60 - 12),
        body: "Redirects are done for 212 of 212 URLs. I will merge as soon as the staging check is green.",
        replies: [],
      },
      {
        id: "c3",
        author: { name: "Priya Nair" },
        createdAt: ago(52),
        highlighted: true,
        body: "Embargo is Thursday in the brief now. I also updated the press kit and the scheduled posts.",
        replies: [],
      },
    ],
  },
  {
    id: "c4",
    author: { name: "Dan Cho" },
    badge: "Support",
    createdAt: ago(2 * 24 * 60 + 40),
    body: "Do we want the changelog entry to ship with the launch or the day after?",
    replies: [],
  },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
/** Puts focus back on the Reply button of a comment, after the composer that had it has gone. */
const focusReply = (id: string) => requestAnimationFrame(() => document.querySelector<HTMLElement>(`#comment-${id} [data-action="reply"]`)?.focus());
const mapEntries = (list: Entry[], change: (entry: Entry) => Entry): Entry[] => list.map((entry) => change({ ...entry, replies: mapEntries(entry.replies, change) }));
const withoutEntry = (list: Entry[], id: string): Entry[] => list.filter((entry) => entry.id !== id).map((entry) => ({ ...entry, replies: withoutEntry(entry.replies, id) }));

export default function Demo(): React.JSX.Element {
  const [thread, setThread] = useState(INITIAL);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  // The first delete fails on purpose, to show what the comment says when the request does not go through.
  const attempts = useRef(0);
  const posted = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);

  function row(entry: Entry, depth: number): React.JSX.Element {
    const isEditing = editing === entry.id;
    return (
      <CommentItem
        key={entry.id}
        id={`comment-${entry.id}`}
        author={entry.author}
        badge={entry.badge}
        createdAt={entry.createdAt}
        editedAt={entry.editedAt}
        now={NOW}
        size={depth > 0 ? "sm" : "default"}
        highlighted={entry.highlighted}
        editing={isEditing}
        actions={entry.own ? ["reply", "edit", "delete"] : ["reply"]}
        body={
          isEditing ? (
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const text = draft.trim();
                if (!text) return;
                setThread((list) => mapEntries(list, (item) => (item.id === entry.id ? { ...item, body: text, editedAt: new Date(NOW).toISOString() } : item)));
                setEditing(null);
              }}
            >
              <Label htmlFor={`edit-${entry.id}`} className="sr-only">
                Edit your comment
              </Label>
              <Textarea id={`edit-${entry.id}`} rows={5} value={draft} autoFocus onChange={(event) => setDraft(event.target.value)} />
              <div className="flex justify-end gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={!draft.trim()}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            entry.body
          )
        }
        onAction={async (action) => {
          if (action === "reply") {
            setReplyingTo(entry.id);
            setReply("");
          } else if (action === "edit") {
            setDraft(entry.body);
            setEditing(entry.id);
          } else {
            await wait(600);
            attempts.current += 1;
            if (attempts.current === 1) throw new Error("The server did not answer.");
            setThread((list) => withoutEntry(list, entry.id));
            // The comment that had focus is gone: focus moves to the heading of the thread, not to the top of the page.
            requestAnimationFrame(() => heading.current?.focus());
          }
        }}
      >
        {entry.replies.map((child) => row(child, depth + 1))}
        {replyingTo === entry.id ? (
          <form
            className="mx-3 mb-1 grid gap-2 rounded-lg border border-border bg-card p-3"
            onSubmit={(event) => {
              event.preventDefault();
              const text = reply.trim();
              if (!text) return;
              posted.current += 1;
              const added: Entry = { id: `new-${posted.current}`, author: ME, createdAt: new Date(NOW).toISOString(), own: true, body: text, replies: [] };
              setThread((list) => mapEntries(list, (item) => (item.id === entry.id ? { ...item, replies: [...item.replies, added] } : item)));
              setReplyingTo(null);
              focusReply(entry.id);
            }}
          >
            <Label htmlFor={`reply-${entry.id}`} className="text-xs text-muted-foreground">
              Reply to {entry.author.name}
            </Label>
            <Textarea id={`reply-${entry.id}`} rows={2} value={reply} autoFocus placeholder="Write a reply" onChange={(event) => setReply(event.target.value)} />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  focusReply(entry.id);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!reply.trim()}>
                Post reply
              </Button>
            </div>
          </form>
        ) : null}
      </CommentItem>
    );
  }

  return (
    <figure className="grid w-full max-w-2xl gap-2">
      <figcaption className="text-xs text-muted-foreground">
        Your own comment has Edit and Delete in its menu, and Delete asks first (the first attempt fails, on purpose). The framed reply is the permalink target; the long body folds.
      </figcaption>
      <section aria-label="Comments" className="grid gap-1 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-xs">
        <h2 ref={heading} tabIndex={-1} className="px-3 pt-1 pb-2 text-sm font-semibold tracking-[-0.01em] outline-none">
          Comments on Q4 launch checklist
        </h2>
        {thread.map((entry) => row(entry, 0))}
      </section>
    </figure>
  );
}
