"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconSend } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { OptimisticItem, type OptimisticStatus } from "@rhs-ui/primitives/optimistic-item";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function CommentCard({ author, time, text }: { author: string; time: string; text: string }): React.JSX.Element {
  return (
    <article className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
      <Avatar size="sm">
        <AvatarFallback>{initialsOf(author)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 flex-1 gap-1">
        <p className="flex items-baseline gap-2 text-sm">
          <span className="font-medium">{author}</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </p>
        <p className="text-sm leading-relaxed [overflow-wrap:anywhere]">{text}</p>
      </div>
    </article>
  );
}

interface Comment {
  id: number;
  text: string;
  status: OptimisticStatus;
  error?: string;
}

const OFFLINE = "You are offline. Your comment is still here.";

function Live(): React.JSX.Element {
  const [comments, setComments] = useState<readonly Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [failNext, setFailNext] = useState(false);
  const next = useRef(1);
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const own = timers.current;
    return () => own.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const update = (id: number, change: Partial<Comment>) => setComments((list) => list.map((comment) => (comment.id === id ? { ...comment, ...change } : comment)));

  /** Pretends to send it: the server answers after a moment, with a yes or a no. */
  function send(id: number, fails: boolean) {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      update(id, fails ? { status: "failed", error: OFFLINE } : { status: "confirmed", error: undefined });
    }, 1500);
    timers.current.add(timer);
  }

  function post(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const id = next.current++;
    setComments((list) => [{ id, text, status: "pending" }, ...list]);
    setDraft("");
    send(id, failNext);
    setFailNext(false);
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={post} className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex gap-2">
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a comment…" aria-label="Comment" autoComplete="off" />
          <Button type="submit" size="icon" aria-label="Post comment" disabled={!draft.trim()}>
            <IconSend />
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch id="optimistic-fail" checked={failNext} onCheckedChange={setFailNext} />
          <Label htmlFor="optimistic-fail" className="font-normal text-muted-foreground">
            Make the next post fail
          </Label>
        </div>
      </form>
      <div className="grid gap-3">
        {comments.map((comment) => (
          <OptimisticItem
            key={comment.id}
            status={comment.status}
            error={comment.error}
            onRetry={() => {
              update(comment.id, { status: "pending", error: undefined });
              send(comment.id, failNext);
              setFailNext(false);
            }}
            onDiscard={() => setComments((list) => list.filter((entry) => entry.id !== comment.id))}
          >
            <CommentCard author="You" time="Just now" text={comment.text} />
          </OptimisticItem>
        ))}
        <CommentCard author="Priya Raman" time="2 min ago" text="Moving the beta to the 14th gives QA a full week. Can someone confirm with Tomás?" />
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
      <Example caption="Saved, saving and not saved: the same comment in each state">
        <div className="grid gap-3">
          <OptimisticItem status="confirmed">
            <CommentCard author="Priya Raman" time="12 min ago" text="Moving the beta to the 14th gives QA a full week. Can someone confirm with Tomás?" />
          </OptimisticItem>
          <OptimisticItem status="pending">
            <CommentCard author="You" time="Just now" text="Confirmed with Tomás, the 14th works for his team." />
          </OptimisticItem>
          <OptimisticItem status="failed" error={OFFLINE} onRetry={() => undefined} onDiscard={() => undefined}>
            <CommentCard author="You" time="Just now" text="I will update the roadmap tonight and post the new dates." />
          </OptimisticItem>
        </div>
      </Example>
      <Example caption="Try it: post a comment, then make the next one fail and press Retry">
        <Live />
      </Example>
    </div>
  );
}
